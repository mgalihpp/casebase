// Web Worker untuk Jalankan: query pengguna berjalan di sini, bukan di thread halaman.
import initSqlJs, { type SqlJsStatic } from "sql.js";
import { executeQuery } from "./execute";
import { explainSqlError } from "./sql-messages";

type RunRequest = { id: number; seed: string; query: string };

const sqlPromise: Promise<SqlJsStatic> = initSqlJs({
  locateFile: (file) => `/${file}`,
});

sqlPromise.then(
  () => postMessage({ type: "ready" }),
  () => postMessage({ type: "failed" }),
);

addEventListener("message", async (event: MessageEvent<RunRequest>) => {
  const { id, seed, query } = event.data;
  const SQL = await sqlPromise;
  try {
    const result = executeQuery(SQL, seed, query);
    postMessage({ type: "result", id, ok: true, ...result });
  } catch (error) {
    postMessage({
      type: "result",
      id,
      ok: false,
      message: explainSqlError(error),
    });
  }
});
