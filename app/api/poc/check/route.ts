/* POC Cek jawaban: menjalankan mesin yang sama dengan browser di worker thread server, lalu menilai (SDD 3.7.1). */
import { SOAL } from "../../../../src/poc/kasus01";
import { kirimKeServer } from "../../../../src/poc/server-host";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const t0 = performance.now();
  let body: { soalId?: unknown; query?: unknown };
  try {
    body = await req.json();
  } catch {
    return Response.json({ galat: "Badan permintaan bukan JSON" }, { status: 400 });
  }
  const { soalId, query } = body;
  if (typeof soalId !== "string" || typeof query !== "string" || query.length > 5000 || !SOAL.some((s) => s.id === soalId))
    return Response.json({ galat: "soalId atau query tidak valid" }, { status: 400 });

  const b = await kirimKeServer({ op: "check", soalId, query });
  const msTotal = performance.now() - t0;
  const putusan = b.ok ? b.putusan : { benar: false, pesan: b.galat };
  return Response.json(
    { putusan, ukur: { msMesin: Math.round(b.ms * 10) / 10, msTotal: Math.round(msTotal * 10) / 10, mulaiDingin: b.mulaiDingin } },
    { headers: { "Server-Timing": `mesin;dur=${b.ms.toFixed(1)}, total;dur=${msTotal.toFixed(1)}` } },
  );
}
