# Vercel Cron Jobs

Dibutuhkan untuk reset liga tiap Senin (FR-RNK-03) dan penjadwalan lain. Sumber: Context7 `/websites/vercel`.

## Konfigurasi jadwal

```json
// vercel.json
{
  "schedules": {
    "reset-liga": {
      "schedule": "0 0 * * 1",
      "path": "/api/cron/reset-liga",
      "requestMethod": "GET"
    }
  }
}
```

Dokumentasi Vercel menampilkan konfigurasi `schedules` dengan opsi `path` dan `requestMethod`. Konfigurasi dengan kunci `crons` dari versi lama masih dikenal. Periksa dokumentasi Vercel terbaru sebelum menulis `vercel.json`. Jadwal memakai format cron standar dalam UTC.

Jadwal dengan `path` memanggil route dengan metode POST secara default. Atur `requestMethod: "GET"` jika route hanya menangani GET.

## Mengamankan route dengan CRON_SECRET

Tambahkan `CRON_SECRET` sebagai variabel lingkungan di Vercel (minimal 16 karakter acak). Vercel mengirim nilainya sebagai header `Authorization: Bearer <secret>`.

```ts
// src/app/api/cron/reset-liga/route.ts
export async function GET(request: Request) {
  const authHeader = request.headers.get('authorization')
  const cronSecret = process.env.CRON_SECRET

  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return new Response('Unauthorized', { status: 401 })
  }

  // jalankan pekerjaan terjadwal
  return Response.json({ ok: true })
}
```

Route ini harus selalu memeriksa header. Tanpa pemeriksaan, siapa pun bisa memicu reset liga.

## Header yang dikirim Vercel

- `user-agent: vercel-cron/1.0`
- `x-vercel-cron-schedule`: ekspresi cron yang memicu
- `Authorization: Bearer <CRON_SECRET>` jika `CRON_SECRET` diatur

## Catatan untuk proyek ini

- Cron berjalan di Vercel. Rencana Hobby dan Pro punya batas jumlah dan frekuensi jadwal. Jumlah zona liga masih terbuka (lihat `docs/BACKLOQ.md`).
- Sesuai FR-GAM-02, nyawa dihitung saat dibaca, tanpa cron. Cron hanya untuk pekerjaan yang benar-benar berkala, seperti reset liga.
