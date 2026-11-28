// Lima kursus dan warnanya, sesuai Design System v2 (artifact SQL Quest Web Mobile).
// `next` adalah judul Kasus 02 yang ditampilkan sebagai kartu terkunci di peta misi.
// `sub` adalah keterangan singkat di sheet pilih kursus, sesuai desain.
export const COURSES = [
  {
    id: "sql",
    name: "SQL Dasar",
    abbr: "Dibi",
    color: "#00758F",
    sub: "MySQL, Dibi si lumba-lumba",
    next: "Transaksi Gelap",
  },
  {
    id: "pg",
    name: "PostgreSQL",
    abbr: "Kura",
    color: "#336791",
    sub: "Relasi dan transaksi, Pogi si gajah",
    next: "Indeks yang Hilang",
  },
  {
    id: "mongo",
    name: "MongoDB",
    abbr: "Doku",
    color: "#00684A",
    sub: "Dokumen JSON, Doku si peri daun",
    next: "Jejak Agregasi",
  },
  {
    id: "redis",
    name: "Redis",
    abbr: "Cici",
    color: "#DC382D",
    sub: "Key-value dan cache, Kubo si kubus kilat",
    next: "Antrean Kurir",
  },
  {
    id: "lite",
    name: "SQLite",
    abbr: "Lumi",
    color: "#0B6DB0",
    sub: "Database satu file, Pena si burung",
    next: "Catatan yang Salah Tulis",
  },
] as const;

export type CourseId = (typeof COURSES)[number]["id"];

export function findCourse(id: string) {
  return COURSES.find((course) => course.id === id);
}
