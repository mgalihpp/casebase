/* Bangun versi satu halaman CaseBase: React, game, CSS, dan mesin SQL (WASM tertanam) dalam satu file HTML. */
import { build } from "esbuild";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";

const js = await build({
  entryPoints: ["artifact/entry.tsx"],
  bundle: true,
  minify: true,
  format: "iife",
  target: "es2020",
  jsx: "automatic",
  define: { "process.env.NODE_ENV": '"production"' },
  write: false,
  logLevel: "warning",
});
const app = js.outputFiles[0].text;
const css = readFileSync("app/globals.css", "utf8");
const sqljs = readFileSync("node_modules/sql.js/dist/sql-wasm-inline.js", "utf8");
const safe = (s) => s.replace(/<\/script/gi, "<\\/script");

const html = `<title>CaseBase</title>
<meta name="description" content="Belajar database lewat kasus detektif. Tulis query SQL sungguhan dan pecahkan kasusnya.">
<meta name="theme-color" content="#141733">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,600;12..96,800&family=JetBrains+Mono:wght@500;700&family=Plus+Jakarta+Sans:wght@500;600;700;800&display=swap">
<style>
${css}
/* Di dalam Artifact, layar penuh mengikuti area aman yang sudah diberi bingkai. */
:root{color-scheme:dark}
html,body,#root{height:100%}
.app{height:100%}
@media (min-width:560px){.app{height:min(900px,calc(100% - 32px))}}
</style>
<div id="root"></div>
<script>
${safe(sqljs)}
</script>
<script>
${safe(app)}
</script>
`;
mkdirSync("dist", { recursive: true });
writeFileSync("dist/casebase.html", html);
console.log(`dist/casebase.html ${(html.length / 1024).toFixed(0)} KB`);
