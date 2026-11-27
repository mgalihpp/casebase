/* Mengukur /poc di Chrome headless lewat CDP, dengan emulasi HP kelas menengah (CPU dilambatkan, jaringan 4G).
   Throttling dipasang di halaman DAN di Web Worker (target terpisah), karena mesin query berjalan di worker.
   Pakai: node scripts/ukur-browser.mjs <url> <cpu-kali> <unduh-kbps|0> <latensi-ms> [chrome]
   Ini emulasi, bukan HP sungguhan. Angka HP sungguhan: buka /poc di HP lalu tekan "Jalankan semua ukuran". */
import { spawn } from "node:child_process";
import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const [url = "http://localhost:3100/poc", cpu = "1", kbps = "0", latensi = "0", chrome = "/usr/bin/google-chrome"] = process.argv.slice(2);
const port = 9333 + Math.floor(Math.random() * 500);
const proc = spawn(chrome, [
  "--headless=new", `--remote-debugging-port=${port}`, "--no-first-run", "--no-default-browser-check",
  `--user-data-dir=${mkdtempSync(join(tmpdir(), "ukur-"))}`, "--window-size=412,915", "about:blank",
], { stdio: "ignore" });

const tunggu = (ms) => new Promise((r) => setTimeout(r, ms));
let ver;
for (let i = 0; i < 50 && !ver; i++) {
  try { ver = await (await fetch(`http://127.0.0.1:${port}/json/version`)).json(); } catch { await tunggu(200); }
}
const ws = new WebSocket(ver.webSocketDebuggerUrl);
await new Promise((r) => ws.addEventListener("open", r));
let n = 0;
const janji = new Map();
const kirim = (method, params = {}, sessionId) =>
  new Promise((ok, gagal) => {
    const id = ++n;
    janji.set(id, { ok, gagal });
    ws.send(JSON.stringify({ id, method, params, sessionId }));
  });
const throttleLog = [];

async function pasangThrottle(sessionId, jenis) {
  const hasil = { jenis };
  try { await kirim("Emulation.setCPUThrottlingRate", { rate: Number(cpu) }, sessionId); hasil.cpu = "ok"; } catch (e) { hasil.cpu = e.message; }
  if (Number(kbps) > 0) {
    try {
      await kirim("Network.enable", {}, sessionId);
      await kirim("Network.emulateNetworkConditions", {
        offline: false, latency: Number(latensi),
        downloadThroughput: (Number(kbps) * 1000) / 8, uploadThroughput: (Number(kbps) * 1000) / 8 / 4,
      }, sessionId);
      hasil.jaringan = "ok";
    } catch (e) { hasil.jaringan = e.message; }
  }
  throttleLog.push(hasil);
}

ws.addEventListener("message", async (ev) => {
  const m = JSON.parse(ev.data);
  if (m.id && janji.has(m.id)) {
    const { ok, gagal } = janji.get(m.id);
    janji.delete(m.id);
    m.error ? gagal(new Error(m.error.message)) : ok(m.result);
    return;
  }
  if (m.method === "Target.attachedToTarget") {
    const { sessionId, targetInfo } = m.params;
    await kirim("Target.setAutoAttach", { autoAttach: true, waitForDebuggerOnStart: true, flatten: true }, sessionId).catch(() => {});
    await pasangThrottle(sessionId, targetInfo.type);
    await kirim("Runtime.runIfWaitingForDebugger", {}, sessionId).catch(() => {});
  }
});

const { targetId } = await kirim("Target.createTarget", { url: "about:blank" });
const { sessionId: halaman } = await kirim("Target.attachToTarget", { targetId, flatten: true });
await kirim("Target.setAutoAttach", { autoAttach: true, waitForDebuggerOnStart: true, flatten: true }, halaman);
await kirim("Network.enable", {}, halaman);
await kirim("Network.setCacheDisabled", { cacheDisabled: false }, halaman);
await pasangThrottle(halaman, "page");
await kirim("Emulation.setDeviceMetricsOverride", { width: 412, height: 915, deviceScaleFactor: 2.6, mobile: true }, halaman);
await kirim("Page.enable", {}, halaman);
await kirim("Runtime.enable", {}, halaman);

const tMuat = performance.now();
await kirim("Page.navigate", { url }, halaman);
const evalJs = async (expr) => (await kirim("Runtime.evaluate", { expression: expr, returnByValue: true, awaitPromise: true }, halaman)).result.value;
for (let i = 0; i < 600; i++) {
  if (await evalJs("!!document.getElementById('ukur-semua') && document.readyState === 'complete'")) break;
  await tunggu(100);
}
const msHalaman = Math.round(performance.now() - tMuat);
await evalJs("document.getElementById('ukur-semua').click(), true");
let hasil = null;
for (let i = 0; i < 2400 && !hasil; i++) {
  await tunggu(250);
  hasil = await evalJs("window.__pocUkur ?? null");
}
// Utas utama: satu-satunya tempat Chrome bisa melambatkan CPU. Berkas mesin sudah ada di cache HTTP, jadi ini murni CPU.
const utama = await evalJs("import('/poc-worker/ukur-utama.js').then((m) => m.ukur())");
console.log(JSON.stringify({ emulasi: { cpu: Number(cpu), kbps: Number(kbps), latensi: Number(latensi) }, throttle: throttleLog, ms_halaman_siap: msHalaman, hasil, cpu_utas_utama: utama }, null, 2));
ws.close();
proc.kill();
process.exit(0);
