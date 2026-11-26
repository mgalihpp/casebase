/* Salin mesin sql.js (SQLite WASM) ke public/sqljs supaya dimuat langsung oleh browser. */
import { copyFileSync, mkdirSync } from "node:fs";
import { join } from "node:path";
const dist = join("node_modules", "sql.js", "dist");
mkdirSync("public/sqljs", { recursive: true });
for (const f of ["sql-wasm.js", "sql-wasm.wasm"]) copyFileSync(join(dist, f), join("public/sqljs", f));
console.log("sql.js disalin ke public/sqljs");
