// Klien untuk worker SQL. Batas 3 detik hanya dihitung setelah mesin siap (SDD 3.8).
export const RUN_TIMEOUT_MS = 3000;
export const TIMEOUT_MESSAGE = "Query terlalu lama. Batasnya 3 detik.";

export type RunOutcome =
  | { ok: true; columns: string[]; rows: unknown[][] }
  | { ok: false; message: string };

type Pending = { resolve: (outcome: RunOutcome) => void };

let worker: Worker | null = null;
let ready: Promise<void> | null = null;
let nextId = 1;
const pending = new Map<number, Pending>();

const LOAD_FAILED_MESSAGE = "Mesin query gagal dimuat. Coba lagi.";

let failReady: (() => void) | null = null;

function resetWorker(message: string) {
  worker?.terminate();
  worker = null;
  ready = null;
  failReady?.();
  failReady = null;
  for (const [, entry] of pending) entry.resolve({ ok: false, message });
  pending.clear();
}

function ensureWorker(): Promise<void> {
  if (worker && ready) return ready;

  worker = new Worker(new URL("./sql-worker.ts", import.meta.url), {
    type: "module",
  });
  const current = worker;

  ready = new Promise<void>((resolve, reject) => {
    failReady = () => reject(new Error(LOAD_FAILED_MESSAGE));
    current.onmessage = (event: MessageEvent) => {
      const data = event.data;
      if (data.type === "ready") {
        resolve();
        return;
      }
      if (data.type === "failed") {
        resetWorker(LOAD_FAILED_MESSAGE);
        return;
      }
      if (data.type === "result") {
        const entry = pending.get(data.id);
        pending.delete(data.id);
        entry?.resolve(
          data.ok
            ? { ok: true, columns: data.columns, rows: data.rows }
            : { ok: false, message: data.message },
        );
      }
    };
    current.onerror = () => resetWorker(LOAD_FAILED_MESSAGE);
  });

  return ready;
}

export async function runSql(seed: string, query: string): Promise<RunOutcome> {
  try {
    await ensureWorker();
  } catch {
    return { ok: false, message: LOAD_FAILED_MESSAGE };
  }
  const activeWorker = worker;
  if (!activeWorker)
    return { ok: false, message: "Mesin query tidak tersedia." };

  const id = nextId++;
  return new Promise<RunOutcome>((resolve) => {
    pending.set(id, { resolve });
    activeWorker.postMessage({ id, seed, query });

    setTimeout(() => {
      if (pending.has(id)) resetWorker(TIMEOUT_MESSAGE);
    }, RUN_TIMEOUT_MS);
  });
}
