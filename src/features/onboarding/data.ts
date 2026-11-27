import type { COURSE_KEYS, LEVEL_KEYS, REASON_KEYS } from "./schemas";

export type CourseKey = (typeof COURSE_KEYS)[number];
export type LevelKey = (typeof LEVEL_KEYS)[number];
export type ReasonKey = (typeof REASON_KEYS)[number];
export type DailyTarget = 5 | 10 | 15 | 20;
export type ReminderKey = "morning" | "noon" | "evening";

export const COURSES: {
  key: CourseKey;
  name: string;
  sub: string;
  mascot: string;
  color: string;
  tint: string;
  tip: string;
}[] = [
  {
    key: "sql",
    name: "SQL Dasar",
    sub: "MySQL",
    mascot: "Dibi",
    color: "#00758F",
    tint: "#DDF1F5",
    tip: "Halo, aku Dibi! Ingat, WHERE selalu ditulis setelah FROM.",
  },
  {
    key: "pg",
    name: "PostgreSQL",
    sub: "Relasi dan transaksi",
    mascot: "Pogi",
    color: "#336791",
    tint: "#E1EAF4",
    tip: "Aku Pogi. Gajah tidak pernah lupa, arsipku juga.",
  },
  {
    key: "mongo",
    name: "MongoDB",
    sub: "Dokumen JSON",
    mascot: "Doku",
    color: "#00684A",
    tint: "#DDF3E6",
    tip: "Aku Doku! Dokumenku boleh beda bentuk.",
  },
  {
    key: "redis",
    name: "Redis",
    sub: "Key-value dan cache",
    mascot: "Kubo",
    color: "#DC382D",
    tint: "#FBE1DE",
    tip: "Kubo di sini, secepat kilat!",
  },
  {
    key: "lite",
    name: "SQLite",
    sub: "Database satu file",
    mascot: "Pena",
    color: "#0B6DB0",
    tint: "#DDEBF7",
    tip: "Cuit! Aku Pena, databaseku muat di satu file.",
  },
];

// [value, title, description]
export const LEVEL_OPTIONS: Record<CourseKey, [LevelKey, string, string][]> = {
  sql: [
    ["new", "Baru dengar namanya", "Mulai dari SELECT paling dasar"],
    ["basic", "Pernah pakai SELECT", "Lanjut ke WHERE dan ORDER BY"],
    ["advanced", "Sudah paham JOIN", "Ikut tes penempatan singkat"],
  ],
  pg: [
    ["new", "Baru dengar namanya", "Mulai dari CREATE TABLE"],
    ["basic", "Pernah coba sedikit", "Lewati misi pengenalan"],
    ["advanced", "Sudah cukup paham", "Ikut tes penempatan singkat"],
  ],
  mongo: [
    ["new", "Baru dengar namanya", "Mulai dari find()"],
    ["basic", "Pernah coba sedikit", "Lewati misi pengenalan"],
    ["advanced", "Sudah cukup paham", "Ikut tes penempatan singkat"],
  ],
  redis: [
    ["new", "Baru dengar namanya", "Mulai dari SET dan GET"],
    ["basic", "Pernah coba sedikit", "Lewati misi pengenalan"],
    ["advanced", "Sudah cukup paham", "Ikut tes penempatan singkat"],
  ],
  lite: [
    ["new", "Baru dengar namanya", "Mulai dari membuat file database"],
    ["basic", "Pernah coba sedikit", "Lewati misi pengenalan"],
    ["advanced", "Sudah cukup paham", "Ikut tes penempatan singkat"],
  ],
};

export const REASON_OPTIONS: [ReasonKey, string, string][] = [
  ["school", "Tugas dan ujian kuliah", "Latihan sesuai materi kelas"],
  ["work", "Persiapan kerja", "Kasus mirip pekerjaan data sungguhan"],
  ["curious", "Penasaran saja", "Santai, tanpa target"],
  ["teacher", "Aku dosen atau asisten", "Nanti kamu bisa membuat kelas"],
];

export const DAILY_TARGET_OPTIONS: [DailyTarget, string, string][] = [
  [5, "5 menit sehari", "Santai"],
  [10, "10 menit sehari", "Rutin"],
  [15, "15 menit sehari", "Serius"],
  [20, "20 menit sehari", "Intens"],
];

export const REMINDER_OPTIONS: [ReminderKey, string, string][] = [
  ["morning", "Pagi, 07.00", "Sebelum berangkat kuliah"],
  ["noon", "Siang, 12.30", "Saat istirahat"],
  ["evening", "Malam, 19.00", "Sebelum tidur"],
];

// Mascot prompts for each onboarding step (index 0 = step 1).
export const STEP_PROMPTS: string[] = [
  "Halo, kami berlima siap menemanimu. Mau menyelidik di database mana?",
  "Seberapa kenal kamu dengan kursus ini? Kasusnya kami sesuaikan.",
  "Apa yang bikin kamu mau belajar? Biar kasusnya pas buatmu.",
  "Berapa menit sehari yang realistis buatmu? Rutin lebih penting daripada lama.",
  "Dapat kode kelas dari dosen? Masukkan di sini, tugasnya langsung muncul.",
  "Mau kuingatkan tiap hari? Lentera beruntunmu bakal tetap menyala.",
  "Berkas kasus pertamamu sudah di meja. Siap, detektif?",
];

// First case shown on the last onboarding step, per course.
export const FIRST_CASE_BY_COURSE: Record<
  CourseKey,
  { title: string; story: string; skills: string[] }
> = {
  sql: {
    title: "Pencurian di Gudang",
    story:
      "Brankas gudang PT Sinar Logam dibobol tengah malam, 14 Maret. Datanya lengkap, pelakunya belum ketemu.",
    skills: ["SELECT", "WHERE", "ORDER BY", "LIMIT"],
  },
  pg: {
    title: "Arsip yang Berantakan",
    story:
      "Arsip kepolisian kota tercampur aduk setelah banjir. Rapikan sebelum sidang minggu depan.",
    skills: ["CREATE TABLE", "PRIMARY KEY", "BEGIN"],
  },
  mongo: {
    title: "Kesaksian Tercecer",
    story:
      "Kesaksian 12 saksi tersimpan dalam bentuk yang berbeda-beda. Satukan jejaknya.",
    skills: ["koleksi", "find()", "filter", "sort()"],
  },
  redis: {
    title: "Pesan yang Menghilang",
    story:
      "Sebuah geng mengirim pesan rahasia yang lenyap dalam 60 detik. Cegat sebelum hilang.",
    skills: ["SET", "GET", "EXPIRE", "INCR"],
  },
  lite: {
    title: "Penyelidikan Tanpa Sinyal",
    story:
      "Kamu ditugaskan ke pulau tanpa sinyal. Semua catatan harus tersimpan di ponselmu sendiri.",
    skills: [".open", "CREATE TABLE", "INSERT"],
  },
};

export function courseOf(key: CourseKey) {
  const course = COURSES.find((item) => item.key === key);
  if (!course) {
    throw new Error(`Kursus "${key}" tidak ditemukan.`);
  }
  return course;
}
