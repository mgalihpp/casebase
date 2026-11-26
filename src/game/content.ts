/* Konten kursus dan kasus CaseBase. Satu kursus (MySQL bareng Dibi), satu kasus lengkap. */
import type { MascotKey } from "./mascots";

export type Course = {
  key: MascotKey;
  mascot: string;
  role: string;
  course: string;
  sub: string;
  c: string;
  cd: string;
  cl: string;
  ready: boolean;
  hello: string;
};

export const COURSES: Course[] = [
  { key: "sql", mascot: "Dibi", role: "Detektif data", course: "MySQL", sub: "SELECT sampai window function", c: "#4F5BE0", cd: "#3742B5", cl: "#E1E4FF", ready: true, hello: "Halo, aku Dibi! Database kecil yang hobi menyelidik." },
  { key: "pg", mascot: "Kura", role: "Penjaga arsip", course: "PostgreSQL", sub: "Relasi, transaksi, JSONB", c: "#2F7FD1", cd: "#1F5FA3", cl: "#DCEBFB", ready: false, hello: "Pelan-pelan saja. Di arsipku tidak ada data yang hilang." },
  { key: "mongo", mascot: "Doku", role: "Jeli dokumen", course: "MongoDB", sub: "NoSQL, dokumen JSON", c: "#1FA672", cd: "#15805A", cl: "#D5F3E6", ready: false, hello: "Boing! Bentukku bebas, datamu juga boleh bebas." },
  { key: "redis", mascot: "Cici", role: "Kurir kilat", course: "Redis", sub: "Key-value, cache super cepat", c: "#E2553A", cd: "#B53D25", cl: "#FDE3DC", ready: false, hello: "Ciiit! Jawabannya sudah kusimpan di pipi." },
  { key: "lite", mascot: "Lumi", role: "Kunang-kunang saku", course: "SQLite", sub: "Database mungil dalam satu file", c: "#D99A00", cd: "#AD7A00", cl: "#FFF1CC", ready: false, hello: "Databaseku muat di saku, dan tetap jalan tanpa internet." },
];

/* ---------- skema dan data kasus ---------- */

export type Column = { name: string; type: string; note?: string };
export type Table = { name: string; desc: string; columns: Column[] };

export const TABLES: Table[] = [
  {
    name: "karyawan",
    desc: "Semua karyawan gudang PT Sinar Logam",
    columns: [
      { name: "id", type: "INT" },
      { name: "nama", type: "VARCHAR" },
      { name: "jabatan", type: "VARCHAR" },
      { name: "shift", type: "VARCHAR", note: "Pagi atau Malam" },
      { name: "akses_gudang", type: "TINYINT", note: "1 kalau punya kartu akses gudang" },
    ],
  },
  {
    name: "absensi",
    desc: "Catatan hadir harian, 13 sampai 15 Maret",
    columns: [
      { name: "id", type: "INT" },
      { name: "nama", type: "VARCHAR" },
      { name: "tanggal", type: "DATE", note: "format 'YYYY-MM-DD'" },
      { name: "hadir", type: "TINYINT", note: "1 hadir, 0 tidak hadir" },
    ],
  },
  {
    name: "akses_pintu",
    desc: "Log kartu akses di setiap pintu",
    columns: [
      { name: "id", type: "INT" },
      { name: "pemilik_kartu", type: "VARCHAR" },
      { name: "pintu", type: "VARCHAR", note: "Gudang, Gerbang Utama, Pos Satpam" },
      { name: "waktu", type: "DATETIME", note: "format 'YYYY-MM-DD HH:MM'" },
    ],
  },
  {
    name: "transaksi",
    desc: "Mutasi rekening perusahaan",
    columns: [
      { name: "id", type: "INT" },
      { name: "rekening", type: "VARCHAR" },
      { name: "jumlah", type: "INT", note: "dalam rupiah" },
      { name: "waktu", type: "DATETIME" },
      { name: "keterangan", type: "VARCHAR" },
    ],
  },
];

const q = (v: string | number | null) => (v === null ? "NULL" : typeof v === "number" ? String(v) : `'${v.replace(/'/g, "''")}'`);
const ins = (table: string, rows: (string | number | null)[][]) =>
  rows.map((r) => `INSERT INTO ${table} VALUES (${r.map(q).join(", ")});`).join("\n");

/* Teks pakai COLLATE NOCASE supaya perbandingan teks tidak peka huruf besar kecil, seperti MySQL. */
const SCHEMA_SQL = `
CREATE TABLE karyawan (id INTEGER PRIMARY KEY, nama TEXT COLLATE NOCASE, jabatan TEXT COLLATE NOCASE, shift TEXT COLLATE NOCASE, akses_gudang INTEGER);
CREATE TABLE absensi (id INTEGER PRIMARY KEY, nama TEXT COLLATE NOCASE, tanggal TEXT, hadir INTEGER);
CREATE TABLE akses_pintu (id INTEGER PRIMARY KEY, pemilik_kartu TEXT COLLATE NOCASE, pintu TEXT COLLATE NOCASE, waktu TEXT);
CREATE TABLE transaksi (id INTEGER PRIMARY KEY, rekening TEXT COLLATE NOCASE, jumlah INTEGER, waktu TEXT, keterangan TEXT COLLATE NOCASE);
`;

const KARYAWAN: [number, string, string, string, number][] = [
  [1, "Dewi Lestari", "Admin Gudang", "Pagi", 1],
  [2, "Agus Hidayat", "Kepala Gudang", "Pagi", 1],
  [3, "Bayu Santoso", "Operator Forklift", "Malam", 1],
  [4, "Rina Wijaya", "Kasir", "Malam", 0],
  [5, "Hendra Kusuma", "Satpam", "Malam", 1],
  [6, "Sari Putri", "Staf Logistik", "Malam", 1],
  [7, "Joko Prasetyo", "Sopir", "Pagi", 0],
  [8, "Maya Anggraini", "Staf Keuangan", "Pagi", 0],
  [9, "Rudi Hartono", "Teknisi", "Malam", 0],
  [10, "Fitri Handayani", "Staf Logistik", "Pagi", 1],
  [11, "Bagus Santosa", "Kurir", "Pagi", 0],
  [12, "Lina Marlina", "Petugas Kebersihan", "Malam", 0],
];

const ABSEN: Record<string, string[]> = {
  "2026-03-13": ["Joko Prasetyo", "Hendra Kusuma"],
  "2026-03-14": ["Dewi Lestari", "Agus Hidayat", "Bayu Santoso", "Rina Wijaya"],
  "2026-03-15": ["Maya Anggraini"],
};

function absensiRows(names: string[], absen: Record<string, string[]>, startId = 1) {
  const rows: (string | number)[][] = [];
  let id = startId;
  for (const tgl of Object.keys(absen)) for (const n of names) rows.push([id++, n, tgl, absen[tgl].includes(n) ? 0 : 1]);
  return rows;
}

const AKSES: (string | number)[][] = [
  [1, "Hendra Kusuma", "Gerbang Utama", "2026-03-14 19:02"],
  [2, "Bayu Santoso", "Gudang", "2026-03-15 00:41"],
  [3, "Sari Putri", "Gudang", "2026-03-14 19:05"],
  [4, "Dewi Lestari", "Gudang", "2026-03-15 07:58"],
  [5, "Bayu Santoso", "Gudang", "2026-03-14 23:38"],
  [6, "Hendra Kusuma", "Pos Satpam", "2026-03-14 22:15"],
  [7, "Sari Putri", "Gudang", "2026-03-14 21:47"],
  [8, "Bayu Santoso", "Gudang", "2026-03-13 23:50"],
  [9, "Hendra Kusuma", "Gerbang Utama", "2026-03-15 00:44"],
  [10, "Agus Hidayat", "Gudang", "2026-03-15 08:03"],
];

const TRANSAKSI: (string | number)[][] = [
  [1, "KAS-GDG", 2500000, "2026-03-13 21:10", "Pembelian palet"],
  [2, "KAS-GDG", 18750000, "2026-03-14 23:41", "Transfer ke BYS-88"],
  [3, "KAS-07", 950000, "2026-03-14 08:15", "Uang makan"],
  [4, "KAS-GDG", 32000000, "2026-03-15 00:12", "Transfer ke BYS-88"],
  [5, "PRB-22", 4200000, "2026-03-15 09:30", "Servis forklift"],
  [6, "KAS-GDG", 27500000, "2026-03-15 00:37", "Transfer ke BYS-88"],
  [7, "KAS-07", 1100000, "2026-03-15 10:02", "Uang makan"],
  [8, "PRB-22", 12300000, "2026-03-15 13:45", "Pembelian ban"],
  [9, "KAS-GDG", 15000000, "2026-03-12 14:00", "Gaji lembur"],
];

const NAMES = KARYAWAN.map((k) => k[1]);

export const SEED_SQL = [
  SCHEMA_SQL,
  ins("karyawan", KARYAWAN),
  ins("absensi", absensiRows(NAMES, ABSEN)),
  ins("akses_pintu", AKSES),
  ins("transaksi", TRANSAKSI),
].join("\n");

/* Dataset varian: dipakai diam-diam saat Periksa. Query yang menghafal nilai (misalnya WHERE id = 4) akan gagal di sini. */
export const VARIANT_SQL = [
  SEED_SQL,
  ins("karyawan", [[13, "Taufik Rahman", "Operator Forklift", "Malam", 1], [14, "Wulan Sari", "Kasir", "Pagi", 0]]),
  ins("absensi", [[901, "Taufik Rahman", "2026-03-14", 0], [902, "Wulan Sari", "2026-03-14", 1], [903, "Taufik Rahman", "2026-03-13", 1]]),
  ins("akses_pintu", [[11, "Taufik Rahman", "Gudang", "2026-03-14 23:55"], [12, "Wulan Sari", "Gudang", "2026-03-14 18:20"]]),
  ins("transaksi", [[10, "KAS-GDG", 41000000, "2026-03-15 00:55", "Transfer ke TRN-12"], [11, "KAS-07", 800000, "2026-03-15 11:00", "Uang makan"]]),
].join("\n");

/* ---------- misi ---------- */

export type Mission = {
  id: string;
  title: string;
  topic: string;
  story: string;
  goal: string;
  tables: string[];
  answer: string;
  ordered: boolean;
  starter?: string;
  hints: [string, string, string];
  win: string;
  clue: string;
  boss?: boolean;
  accuse?: { prompt: string; options: string[]; answer: string; wrong: string };
};

export const CASE = {
  n: "01",
  title: "Pencurian di Gudang",
  topics: "SELECT · WHERE · ORDER BY · LIMIT",
  intro:
    "Brankas gudang PT Sinar Logam dibobol malam 14 Maret, dan uang kas perusahaan mengalir keluar sebelum pagi. Semua datanya ada di database. Pelakunya belum ketemu.",
  culprit: "Bayu Santoso",
  culpritRole: "Operator Forklift, shift malam",
};

export const MISSIONS: Mission[] = [
  {
    id: "m1",
    title: "Buka berkas",
    topic: "SELECT * dan FROM",
    story: "Kita mulai dari daftar karyawan gudang. Detektif yang baik melihat semua bukti dulu sebelum menuduh.",
    goal: "Tampilkan semua kolom dan semua baris dari tabel karyawan.",
    tables: ["karyawan"],
    answer: "SELECT * FROM karyawan",
    ordered: false,
    hints: [
      "Kamu butuh perintah yang mengambil data dari sebuah tabel.",
      "Pakai SELECT untuk memilih kolom dan FROM untuk menyebut tabelnya. Tanda * artinya semua kolom.",
      "SELECT * FROM ____",
    ],
    win: "Dua belas karyawan, semuanya tercatat.",
    clue: "Ada 12 karyawan di gudang PT Sinar Logam.",
  },
  {
    id: "m2",
    title: "Pilih kolom",
    topic: "SELECT kolom tertentu",
    story: "Tabelnya terlalu ramai. Untuk papan tersangka, kita cukup butuh nama dan jabatan.",
    goal: "Tampilkan kolom nama dan jabatan dari tabel karyawan, dengan urutan kolom seperti itu.",
    tables: ["karyawan"],
    answer: "SELECT nama, jabatan FROM karyawan",
    ordered: false,
    hints: [
      "Ganti tanda * dengan nama kolom yang kamu butuhkan.",
      "Tulis nama kolom setelah SELECT, dipisah koma.",
      "SELECT nama, ____ FROM karyawan",
    ],
    win: "Papan tersangka mulai rapi.",
    clue: "Nama dan jabatan semua karyawan sudah ditempel di papan.",
  },
  {
    id: "m3",
    title: "Siapa yang absen?",
    topic: "WHERE dan AND",
    story: "Malam kejadian adalah 14 Maret. Pelaku biasanya punya alasan untuk tidak tercatat masuk kerja.",
    goal: "Tampilkan nama karyawan yang tidak hadir (hadir = 0) pada tanggal 2026-03-14.",
    tables: ["absensi"],
    answer: "SELECT nama FROM absensi WHERE tanggal = '2026-03-14' AND hadir = 0",
    ordered: false,
    hints: [
      "Tabel absensi berisi tiga tanggal. Kamu hanya butuh satu tanggal, dan hanya yang tidak hadir.",
      "Pakai WHERE untuk menyaring, lalu gabungkan dua syarat dengan AND. Teks tanggal ditulis di antara tanda kutip.",
      "SELECT nama FROM absensi WHERE tanggal = '____' AND hadir = ____",
    ],
    win: "Empat nama tercatat absen malam itu.",
    clue: "Dewi, Agus, Bayu, dan Rina tidak hadir pada 14 Maret.",
  },
  {
    id: "m4",
    title: "Persempit tersangka",
    topic: "WHERE dengan dua syarat",
    story: "Brankas dibobol tengah malam di dalam gudang. Pelakunya pasti orang shift malam yang punya kartu akses gudang.",
    goal: "Tampilkan nama karyawan yang shift-nya Malam dan akses_gudang-nya 1.",
    tables: ["karyawan"],
    answer: "SELECT nama FROM karyawan WHERE shift = 'Malam' AND akses_gudang = 1",
    ordered: false,
    hints: [
      "Sekarang kita menyaring tabel karyawan, bukan absensi.",
      "Dua syarat: shift = 'Malam' dan akses_gudang = 1. Hubungkan dengan AND.",
      "SELECT nama FROM karyawan WHERE shift = '____' AND akses_gudang = ____",
    ],
    win: "Bayu, Hendra, dan Sari punya akses malam.",
    clue: "Dari yang absen malam itu, hanya Bayu yang kerja shift malam dan memegang kartu gudang.",
  },
  {
    id: "m5",
    title: "Urutkan jejak kartu",
    topic: "ORDER BY",
    story: "Log pintu tercatat acak. Kita perlu melihat siapa yang masuk gudang, berurutan dari yang paling awal.",
    goal: "Tampilkan semua kolom dari akses_pintu untuk pintu Gudang saja, diurutkan dari waktu paling awal.",
    tables: ["akses_pintu"],
    answer: "SELECT * FROM akses_pintu WHERE pintu = 'Gudang' ORDER BY waktu",
    ordered: true,
    hints: [
      "Saring dulu pintunya, baru urutkan hasilnya.",
      "WHERE pintu = 'Gudang', lalu ORDER BY waktu. Urutan bawaan ORDER BY sudah dari yang terkecil.",
      "SELECT * FROM akses_pintu WHERE pintu = '____' ORDER BY ____",
    ],
    win: "Jejak kartu tersusun rapi.",
    clue: "Kartu milik Bayu dipakai di pintu gudang pukul 23.38, padahal dia tercatat absen.",
  },
  {
    id: "m6",
    title: "Ikuti uangnya",
    topic: "ORDER BY DESC dan LIMIT",
    story: "Setelah brankas dibobol, uang kas gudang ikut berpindah. Lihat tiga transfer paling besar.",
    goal: "Tampilkan semua kolom dari 3 transaksi dengan jumlah terbesar, dari yang paling besar.",
    tables: ["transaksi"],
    answer: "SELECT * FROM transaksi ORDER BY jumlah DESC LIMIT 3",
    ordered: true,
    hints: [
      "Urutkan dulu dari yang terbesar, lalu ambil beberapa baris teratas saja.",
      "DESC membalik urutan jadi dari yang terbesar. LIMIT membatasi jumlah baris dan ditulis paling akhir.",
      "SELECT * FROM transaksi ORDER BY ____ DESC LIMIT ____",
    ],
    win: "Tiga transfer besar ketemu.",
    clue: "Tiga transfer terbesar masuk ke rekening BYS-88, semuanya sekitar tengah malam.",
  },
  {
    id: "m7",
    title: "Interogasi",
    topic: "Misi gabungan",
    story: "Saatnya menyusun bukti terakhir. Siapa yang membuka pintu gudang di jam pembobolan, antara pukul 23.00 tanggal 14 dan pukul 01.00 tanggal 15?",
    goal: "Tampilkan pemilik_kartu dan waktu dari akses_pintu untuk pintu Gudang dengan waktu antara '2026-03-14 23:00' dan '2026-03-15 01:00', urut dari paling awal.",
    tables: ["akses_pintu", "karyawan", "absensi"],
    answer:
      "SELECT pemilik_kartu, waktu FROM akses_pintu WHERE pintu = 'Gudang' AND waktu BETWEEN '2026-03-14 23:00' AND '2026-03-15 01:00' ORDER BY waktu",
    ordered: true,
    hints: [
      "Gabungkan semua alatmu: pilih dua kolom, saring pintu dan rentang waktu, lalu urutkan.",
      "Rentang waktu bisa ditulis dengan waktu BETWEEN '...' AND '...', atau dengan >= dan <=.",
      "SELECT pemilik_kartu, waktu FROM akses_pintu WHERE pintu = 'Gudang' AND waktu BETWEEN '____' AND '____' ORDER BY waktu",
    ],
    win: "Bukti terakhir terkumpul.",
    clue: "Kartu Bayu dua kali membuka gudang di jam pembobolan.",
    boss: true,
    accuse: {
      prompt: "Bukti sudah lengkap. Siapa pelakunya?",
      options: ["Hendra Kusuma", "Bayu Santoso", "Sari Putri", "Bagus Santosa"],
      answer: "Bayu Santoso",
      wrong: "Cek lagi papan bukti: siapa yang absen, kerja shift malam, punya kartu gudang, dan kartunya dipakai tengah malam?",
    },
  },
];

export const KEYWORDS = ["SELECT", "*", "FROM", "WHERE", "AND", "OR", "=", "'", ",", "ORDER BY", "DESC", "LIMIT", "BETWEEN", ";"];

export const XP_BASE = 20;
export const XP_PER_HINT = 5;
export const MAX_HEARTS = 5;
