import { NextResponse } from "next/server";
import { closeFinishedGroups } from "@/features/mission/league";

// Dipanggil Vercel Cron tiap Senin 00.00 WIB (SDD 3.7.5). Vercel mengirim CRON_SECRET sebagai Bearer token.
export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret) {
    return NextResponse.json(
      { error: "CRON_SECRET belum diatur." },
      { status: 500 },
    );
  }
  if (request.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Tidak diizinkan." }, { status: 401 });
  }
  const result = await closeFinishedGroups(new Date());
  return NextResponse.json(result);
}
