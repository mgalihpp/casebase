// Lima kursus dan warnanya, sesuai Design System v2 (artifact SQL Quest Web Mobile).
// `next` adalah judul Kasus 02 yang ditampilkan sebagai kartu terkunci di peta misi.
export const COURSES = [
  {
    id: "sql",
    name: "SQL Dasar",
    abbr: "Dibi",
    color: "#00758F",
    next: "Transaksi Gelap",
  },
  {
    id: "pg",
    name: "PostgreSQL",
    abbr: "Kura",
    color: "#336791",
    next: "Indeks yang Hilang",
  },
  {
    id: "mongo",
    name: "MongoDB",
    abbr: "Doku",
    color: "#00684A",
    next: "Jejak Agregasi",
  },
  {
    id: "redis",
    name: "Redis",
    abbr: "Cici",
    color: "#DC382D",
    next: "Antrean Kurir",
  },
  {
    id: "lite",
    name: "SQLite",
    abbr: "Lumi",
    color: "#0B6DB0",
    next: "Catatan yang Salah Tulis",
  },
] as const;

export type CourseId = (typeof COURSES)[number]["id"];

export function findCourse(id: string) {
  return COURSES.find((course) => course.id === id);
}
