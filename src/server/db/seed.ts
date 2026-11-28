// Menulis kursus dan kasus dari casebase/ ke database. Aman dijalankan ulang.
// Jalankan: bun run db:seed
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { COURSES } from "@/features/course/data";
import { caseContent, course } from "@/features/course/schema";
import { caseBodySchema } from "@/features/course/schemas";
import { db } from "@/server/db";

const CASE_FILES = [
  "sql/01-pencurian-di-gudang.json",
  "sql/02-jejak-perusahaan-cangkang.json",
  "sql/03-rekaman-cctv-yang-hilang.json",
  "sql/04-tersangka-tanpa-alibi.json",
  "sql/05-saksi-kunci.json",
  "sql/06-rantai-transaksi-mencurigakan.json",
  "sql/07-peta-kejahatan-kota.json",
  "sql/08-sandi-di-pesan-rahasia.json",
  "sql/09-arsip-dari-nol.json",
  "sql/10-dalang-di-balik-layar.json",
];

async function main() {
  await db
    .insert(course)
    .values(
      COURSES.map(({ id, name, abbr, color }) => ({ id, name, abbr, color })),
    )
    .onConflictDoUpdate({
      target: course.id,
      set: {
        name: course.name,
        abbr: course.abbr,
        color: course.color,
      },
    });

  for (const file of CASE_FILES) {
    const raw = readFileSync(join(process.cwd(), "casebase", file), "utf8");
    const body = caseBodySchema.parse(JSON.parse(raw));
    const id = `${body.course}-${body.number}`;

    await db
      .insert(caseContent)
      .values({
        id,
        courseId: body.course,
        number: body.number,
        title: body.title,
        body,
      })
      .onConflictDoUpdate({
        target: caseContent.id,
        set: { title: body.title, body },
      });
    console.log(`Kasus ${id} disimpan.`);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
