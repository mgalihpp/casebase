import "server-only";

import path from "node:path";
import { Worker } from "node:worker_threads";
import { explainSqlError } from "./engine/sql-messages";
import type { Job, RunOutcome } from "./judge";

/** SDD 3.8: query yang berjalan lebih dari 3 detik dihentikan dengan mematikan worker. */
export const SANDBOX_TIMEOUT_MS = 3000;
export const TIMEOUT_MESSAGE = "Query terlalu lama. Batas waktunya 3 detik.";

// Dijalankan di worker thread Node. Hanya memakai sql.js dan pesan bawaan Node.
const WORKER_SOURCE = `
const { parentPort, workerData } = require("node:worker_threads");
const initSqlJs = require(workerData.entry);
const sqlPromise = initSqlJs({
  locateFile: (file) => workerData.wasmDir + "/" + file,
});
parentPort.postMessage({ type: "ready" });
parentPort.on("message", async ({ jobs }) => {
  const SQL = await sqlPromise;
  const results = jobs.map((job) => {
    const db = new SQL.Database();
    try {
      db.exec(job.seed);
      if (job.prelude) db.exec(job.prelude);
      const outputs = db.exec(job.query);
      const last = outputs.at(-1);
      return last
        ? { ok: true, columns: last.columns, rows: last.values }
        : { ok: true, columns: [], rows: [] };
    } catch (error) {
      return { ok: false, message: error instanceof Error ? error.message : String(error) };
    } finally {
      db.close();
    }
  });
  parentPort.postMessage({ type: "done", results });
});
`;

type Raw =
  | { ok: true; columns: string[]; rows: unknown[][] }
  | { ok: false; message: string };

function sandboxFiles() {
  const dist = path.join(process.cwd(), "node_modules", "sql.js", "dist");
  return {
    entry: path.join(dist, "sql-wasm.js"),
    wasmDir: dist,
  };
}

/**
 * Menjalankan semua job di satu worker thread. Jika melewati batas waktu,
 * worker dimatikan dan setiap job diberi pesan batas waktu.
 */
export function runSandbox(jobs: Job[]): Promise<RunOutcome[]> {
  const files = sandboxFiles();
  return new Promise((resolve) => {
    const worker = new Worker(WORKER_SOURCE, { eval: true, workerData: files });
    let settled = false;
    let timer: ReturnType<typeof setTimeout> | undefined;
    const finish = (outcomes: RunOutcome[]) => {
      if (settled) return;
      settled = true;
      if (timer) clearTimeout(timer);
      void worker.terminate();
      resolve(outcomes);
    };

    worker.on("message", (message: { type: string; results?: Raw[] }) => {
      if (message.type === "ready") {
        // Batas 3 detik dihitung setelah mesin siap, seperti SDD 3.8.
        timer = setTimeout(
          () => finish(jobs.map(() => ({ ok: false, message: TIMEOUT_MESSAGE }))),
          SANDBOX_TIMEOUT_MS,
        );
        worker.postMessage({ jobs });
        return;
      }
      if (message.type === "done" && message.results) {
        finish(
          message.results.map((raw) =>
            raw.ok
              ? raw
              : { ok: false, message: explainSqlError(new Error(raw.message)) },
          ),
        );
      }
    });
    worker.on("error", (error) => {
      finish(
        jobs.map(() => ({ ok: false, message: explainSqlError(error) })),
      );
    });
  });
}
