/* Uji dan ukur POC mesin query di Node: penilaian per soal, isolasi data, batas 3 detik, dan waktu Cek.
   Jalankan: npm run test:poc (butuh poc-server/worker.mjs dari scripts/build-poc.mjs). */
import { QUERY_TAK_BERUJUNG, SOAL } from "../src/poc/kasus01";
import { kirimKeServer, tutupServerHost } from "../src/poc/server-host";
import type { Putusan } from "../src/poc/nilai";

type Kasus = [soalId: string, query: string, benar: boolean, pesan?: RegExp];

const KASUS: Kasus[] = [
  ["sql-top3", "SELECT * FROM transaksi ORDER BY jumlah DESC LIMIT 3", true],
  ["sql-top3", "select * from transaksi order by jumlah desc limit 3 offset 0;", true],
  ["sql-top3", "SELECT id, rekening, jumlah, waktu, keterangan FROM transaksi ORDER BY jumlah DESC LIMIT 3 -- komentar", true],
  ["sql-top3", "SELECT * FROM transaksi ORDER BY jumlah LIMIT 3", false, /isinya/],
  ["sql-top3", "SELECT * FROM transaksi ORDER BY jumlah DESC", false, /longgar/],
  ["sql-top3", "SELECT id, jumlah FROM transaksi ORDER BY jumlah DESC LIMIT 3", false, /kolom/],
  ["sql-top3", "DELETE FROM transaksi", false, /DELETE tidak dipakai/],
  ["sql-top3", "SELEC * FROM transaksi", false, /tidak dipakai|dekat/],
  ["sql-top3", "SELECT umur FROM transaksi", false, /Kolom "umur"/],
  ["sql-top3", "SELECT * FROM pegawai", false, /Tabel "pegawai"/],
  ["sql-top3", "SELECT * FROM transaksi WHERE keterangan = 'Uang", false, /kutip/],
  ["sql-top3", "WITH t AS (SELECT * FROM transaksi) SELECT * FROM t ORDER BY jumlah DESC LIMIT 3", true],
  ["sql-top3", "WITH t AS (SELECT 1) DELETE FROM transaksi", false, /DELETE tidak dipakai/],
  ["pg-top3", "SELECT * FROM transaksi ORDER BY jumlah DESC LIMIT 3", true],
  ["pg-top3", "SELECT * FROM transaksi ORDER BY jumlah DESC FETCH FIRST 3 ROWS ONLY", true],
  ["pg-top3", "SELECT * FROM transaksi ORDER BY jumlah ASC LIMIT 3", false, /isinya/],
  ["pg-top3", "SELECT umur FROM transaksi", false, /Kolom "umur"/],
  ["pg-top3", "SELECT * FROM pegawai", false, /Tabel "pegawai"/],
  ["pg-top3", "SELECT * FROM transaksi WHERE keterangan = \"Uang makan\"", false, /kutip tunggal/],
  ["pg-top3", "SELECT * FROM transaksi WHERE keterangan = 'Uang", false, /kutip/],
  ["pg-bekukan", "BEGIN; UPDATE transaksi SET keterangan = 'Dibekukan', rekening = 'BEKU-01' WHERE keterangan = 'Transfer ke BYS-88'; COMMIT;", true],
  ["pg-bekukan", "START TRANSACTION;\nUPDATE transaksi SET rekening='BEKU-01', keterangan='Dibekukan' WHERE keterangan LIKE '%BYS-88';\nCOMMIT;", true],
  ["pg-bekukan", "UPDATE transaksi SET keterangan = 'Dibekukan', rekening = 'BEKU-01' WHERE keterangan = 'Transfer ke BYS-88'", false, /BEGIN dan COMMIT/],
  ["pg-bekukan", "BEGIN; UPDATE transaksi SET keterangan = 'Dibekukan', rekening = 'BEKU-01' WHERE keterangan = 'Transfer ke BYS-88'; ROLLBACK; COMMIT;", false, /isinya/],
  ["pg-bekukan", "BEGIN; BEGIN; UPDATE transaksi SET keterangan = 'Dibekukan', rekening = 'BEKU-01' WHERE keterangan = 'Transfer ke BYS-88'; COMMIT; COMMIT;", true],
  ["pg-bekukan", "BEGIN; UPDATE transaksi SET keterangan = 'Dibekukan' WHERE keterangan = 'Transfer ke BYS-88'; UPDATE transaksi SET rekening = 'BEKU-01' WHERE keterangan = 'Dibekukan'; COMMIT;", true],
  ["pg-bekukan", "BEGIN; UPDATE transaksi SET keterangan = 'Dibekukan', rekening = 'BEKU-01' WHERE keterangan = 'Transfer ke BYS-88'; ROLLBACK;", false, /meminta COMMIT/],
  ["pg-bekukan", "BEGIN; DELETE FROM transaksi; COMMIT;", false, /DELETE tidak dipakai/],
  ["pg-bekukan", "BEGIN; UPDATE transaksi SET jumlah = 'banyak'; COMMIT;", false, /tipe/],
  // setelah soal yang mengubah data, data PostgreSQL harus kembali utuh
  ["pg-top3", "SELECT * FROM transaksi ORDER BY jumlah DESC LIMIT 3", true],
  ["mongo-top3", "db.transaksi.find({}).sort({ jumlah: -1 }).limit(3)", true],
  ["mongo-top3", "db.transaksi.find().sort({jumlah:-1}).limit(3);", true],
  ["mongo-top3", "db.transaksi.aggregate([{ $sort: { jumlah: -1 } }, { $limit: 3 }])", true],
  ["mongo-top3", "db.transaksi.find({}, { _id: 0 }).sort({ 'jumlah': -1 }).limit(3)", true],
  ["mongo-top3", "db.transaksi.find({}).sort({ jumlah: 1 }).limit(3)", false, /isinya/],
  ["mongo-top3", "db.transaksi.find({ $where: 'true' })", false, /\$where/],
  ["mongo-top3", "db.pegawai.find()", false, /Koleksi "pegawai"/],
  ["mongo-top3", "db.transaksi.find({jumlah: {$gt: 1}).limit(3)", false, /belum pas/],
  ["redis-hitung", "INCR transfer:BYS-88\nEXPIRE transfer:BYS-88 3600", true],
  ["redis-hitung", "SET transfer:BYS-88 4 EX 3600", true],
  ["redis-hitung", "INCR transfer:BYS-88", false, /isinya/],
  ["redis-hitung", "INCR transfer:BYS-88\nEXPIRE transfer:BYS-88 60", false, /isinya/],
  ["redis-hitung", "DEL transfer:BYS-88", false, /DEL tidak dipakai/],
  ["redis-hitung", "INCR saldo", false, /isinya/],
  ["redis-hitung", "INCR", false, /argumen/],
];

const persen = (xs: number[], p: number) => [...xs].sort((a, b) => a - b)[Math.min(xs.length - 1, Math.ceil((p / 100) * xs.length) - 1)];

const t0 = performance.now();
const pertama = await kirimKeServer({ op: "check", soalId: "sql-top3", query: "SELECT 1" });
console.log(`mulai dingin, soal SQL Dasar (worker + sql.js + seed): ${(performance.now() - t0).toFixed(0)} ms, dingin=${pertama.mulaiDingin}\n`);

const t1 = performance.now();
const pertamaPg = await kirimKeServer({ op: "check", soalId: "pg-top3", query: "SELECT 1" });
console.log(`soal PostgreSQL pertama (PGlite dari snapshot + seed): ${(performance.now() - t1).toFixed(0)} ms, dipanaskan=${pertamaPg.mulaiDingin}\n`);

let gagal = 0;
for (const [id, q, benar, pola] of KASUS) {
  const b = await kirimKeServer({ op: "check", soalId: id, query: q });
  const p = (b.ok ? b.putusan : { benar: false, pesan: b.galat }) as Putusan;
  const lulus = p.benar === benar && (!pola || pola.test(p.pesan));
  if (!lulus) gagal++;
  console.log(`${lulus ? "LULUS" : "GAGAL"} ${id.padEnd(13)} ${b.ms.toFixed(0).padStart(4)} ms  ${q.replace(/\s+/g, " ").slice(0, 64)}\n      -> ${p.pesan}`);
}

console.log("\nBatas waktu 3 detik:");
for (const [mesin, q] of Object.entries(QUERY_TAK_BERUJUNG)) {
  const soalId = SOAL.find((s) => s.mesin === mesin)!.id;
  await kirimKeServer({ op: "check", soalId, query: "SELECT 1" }); // pastikan mesin sudah dimuat; yang diukur hanya query-nya
  const t = performance.now();
  const b = await kirimKeServer({ op: "check", soalId, query: q! });
  const ms = performance.now() - t;
  const ok = !b.ok && /lebih dari 3 detik/.test(b.galat) && ms < 3600;
  if (!ok) gagal++;
  console.log(`${ok ? "LULUS" : "GAGAL"} ${mesin}: dihentikan setelah ${ms.toFixed(0)} ms -> ${b.ok ? "tidak dihentikan" : b.galat}`);
  const t2 = performance.now();
  const lanjut = await kirimKeServer({ op: "check", soalId, query: SOAL.find((s) => s.id === soalId)!.contoh });
  console.log(`      Cek berikutnya setelah worker dibuat ulang: ${(performance.now() - t2).toFixed(0)} ms, benar=${(lanjut as { putusan?: Putusan }).putusan?.benar}`);
}

console.log("\nWaktu Cek di worker hangat (200 kali per soal):");
for (const s of SOAL) {
  const xs: number[] = [];
  for (let i = 0; i < 200; i++) {
    const t = performance.now();
    await kirimKeServer({ op: "check", soalId: s.id, query: s.contoh });
    xs.push(performance.now() - t);
  }
  console.log(`${s.id.padEnd(13)} p50 ${persen(xs, 50).toFixed(1)} ms  p95 ${persen(xs, 95).toFixed(1)} ms  maks ${Math.max(...xs).toFixed(1)} ms`);
}

tutupServerHost();
console.log(gagal ? `\n${gagal} uji gagal` : "\nSemua uji lulus");
process.exit(gagal ? 1 : 0);
