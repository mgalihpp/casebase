/* Uji penilai: cara penulisan berbeda yang benar harus lolos, yang salah harus gagal dengan pesan yang tepat. */
import initSqlJs from "sql.js";
import { MISSIONS } from "../src/game/content";
import { createCaseDbs, grade, type SqlJsStatic } from "../src/game/engine";

type Case = [missionId: string, query: string, expectOk: boolean, expectMsg?: RegExp];

const CASES: Case[] = [
  ["m1", "SELECT * FROM karyawan", true],
  ["m1", "select * from karyawan;", true],
  ["m1", "SELECT id, nama, jabatan, shift, akses_gudang FROM `karyawan` -- semua", true],
  ["m1", "SELECT * FROM karyawan LIMIT 5", false, /baris/],
  ["m1", "SELECT * FROM pegawai", false, /tidak ada/],
  ["m1", "DELETE FROM karyawan", false, /SELECT/],
  ["m1", "SELECT * FROM karyawan; DROP TABLE karyawan", false, /satu query/],
  ["m2", "SELECT nama, jabatan FROM karyawan", true],
  ["m2", "SELECT nama AS n, jabatan AS j FROM karyawan ORDER BY nama", true],
  ["m2", "SELECT jabatan, nama FROM karyawan", false, /isinya/],
  ["m2", "SELECT nama FROM karyawan", false, /kolom/],
  ["m3", "SELECT nama FROM absensi WHERE tanggal = '2026-03-14' AND hadir = 0", true],
  ["m3", "SELECT nama FROM absensi WHERE hadir = FALSE AND tanggal = \"2026-03-14\"", true],
  ["m3", "SELECT nama FROM absensi WHERE hadir = 0", false, /longgar/],
  ["m3", "SELECT nama FROM absensi WHERE nama IN ('Dewi Lestari','Agus Hidayat','Bayu Santoso','Rina Wijaya') AND tanggal='2026-03-14'", false, /menghafal/],
  ["m4", "SELECT nama FROM karyawan WHERE shift = 'malam' AND akses_gudang = 1", true],
  ["m4", "SELECT nama FROM karyawan WHERE shift = 'Malam' OR akses_gudang = 1", false, /longgar/],
  ["m4", "SELECT nama FROM karyawan WHERE id IN (3,5,6)", false, /menghafal/],
  ["m5", "SELECT * FROM akses_pintu WHERE pintu = 'Gudang' ORDER BY waktu ASC", true],
  ["m5", "SELECT * FROM akses_pintu WHERE pintu = 'Gudang'", false, /urutan/],
  ["m5", "SELECT * FROM akses_pintu WHERE pintu = 'Gudang' ORDER BY waktu DESC", false, /urutan/],
  ["m6", "SELECT * FROM transaksi ORDER BY jumlah DESC LIMIT 3", true],
  ["m6", "SELECT * FROM transaksi ORDER BY jumlah DESC LIMIT 0, 3", true],
  ["m6", "SELECT * FROM transaksi ORDER BY jumlah LIMIT 3", false],
  ["m6", "SELECT * FROM transaksi WHERE id IN (4,6,2) ORDER BY jumlah DESC", false, /menghafal/],
  ["m7", "SELECT pemilik_kartu, waktu FROM akses_pintu WHERE pintu='Gudang' AND waktu >= '2026-03-14 23:00' AND waktu <= '2026-03-15 01:00' ORDER BY waktu", true],
  ["m7", "SELECT pemilik_kartu, waktu FROM akses_pintu WHERE pintu = 'Gudang' AND waktu BETWEEN '2026-03-14 23:00' AND '2026-03-15 01:00' ORDER BY waktu", true],
  ["m7", "SELECT pemilik_kartu, waktu FROM akses_pintu WHERE pemilik_kartu='Bayu Santoso' AND waktu > '2026-03-14 12:00' ORDER BY waktu", false, /menghafal/],
  ["m7", "SELECT pemilik_kartu, waktu FROM akses_pintu WHERE pintu = 'Gudang' ORDER BY waktu", false, /longgar/],
  ["m1", "SELECT * FROM karyawan WHERE nama = 'Bayu", false, /kutip/],
  ["m1", "SELEC * FROM karyawan", false, /dekat/],
  ["m1", "SELECT umur FROM karyawan", false, /Kolom "umur"/],
];

const SQL = (await initSqlJs()) as unknown as SqlJsStatic;
const dbs = createCaseDbs(SQL);
let fail = 0;
for (const [id, query, expectOk, expectMsg] of CASES) {
  const m = MISSIONS.find((x) => x.id === id)!;
  const v = grade(dbs, m, query);
  const msg = v.ok ? "" : v.message;
  const pass = v.ok === expectOk && (!expectMsg || expectMsg.test(msg));
  if (!pass) fail++;
  console.log(`${pass ? "LULUS" : "GAGAL"}  ${id}  ${query.slice(0, 70)}${msg ? "\n        -> " + msg : ""}`);
}
for (const m of MISSIONS) {
  const v = grade(dbs, m, m.answer);
  if (!v.ok) {
    fail++;
    console.log("KUNCI GAGAL", m.id);
  } else console.log(`kunci ${m.id}: ${v.result.rows.length} baris`);
}
console.log(fail ? `${fail} uji gagal` : "Semua uji lulus");
process.exit(fail ? 1 : 0);
