import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import initSqlJs from "sql.js";
import { describe, expect, it } from "vitest";
import { caseBodySchema } from "@/features/course/schemas";

const dir = join(process.cwd(), "casebase", "sql");
const SQL = await initSqlJs();

describe("casebase", () => {
  for (const file of readdirSync(dir)) {
    it(`${file}: skema valid dan kunci jawaban menghasilkan baris`, () => {
      const body = caseBodySchema.parse(
        JSON.parse(readFileSync(join(dir, file), "utf8")),
      );
      for (const node of body.nodes) {
        if (node.type === "chest") continue;
        expect(node.bukti, `${node.key} belum punya bukti`).toBeTruthy();
        expect(node.cerita, `${node.key} belum punya cerita`).toBeTruthy();
        expect(
          node.pelajaran,
          `${node.key} belum punya pelajaran`,
        ).toBeTruthy();
      }
      for (const question of body.questions) {
        if (question.type !== "write") continue;
        const db = new SQL.Database();
        db.exec(body.seed);
        const probe = question.pemeriksa ?? question.answer;
        if (question.pemeriksa) db.exec(question.answer);
        expect(db.exec(probe)[0]?.values.length).toBeGreaterThan(0);
        db.close();
      }
    });
  }
});
