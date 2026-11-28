<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# SQL Quest

SQL Quest (CaseBase) adalah website mobile-first untuk belajar SQL lewat kasus detektif. Aplikasinya satu proyek Next.js (App Router) yang di-deploy ke Vercel, dengan tRPC sebagai API, Drizzle ORM di atas PostgreSQL, dan Better Auth untuk login.

Arsitektur dan keputusan desain ada di [ARCHITECTURE.md](ARCHITECTURE.md). Rujukan library ada di [docs/](docs/README.md).

## Prinsip yang tidak boleh dikompromikan

1. **Mobile-first.** Setiap fitur harus berfungsi dan nyaman di HP. Desktop mengikuti.
2. **Mesin query di browser.** Query latihan berjalan di browser (WebAssembly atau JavaScript), tanpa server sandbox terpisah (D-05). Jangan menambah runner SQL di server untuk latihan.
3. **Kunci jawaban tidak pernah dikirim ke browser.** Field `answer` di `casebase/` hanya dipakai di server untuk penilaian. Jika ada perubahan yang membuat jawaban ikut ke klien, itu bug.
4. **Konten kasus adalah data.** Kasus baru ditambah sebagai JSON di `casebase/`, bukan sebagai kode.
5. **Performa.** Jangan kirim data berlebihan lewat tRPC. Hindari animasi yang terus repaint, karena bisa membebani GPU di HP.

## Istilah

- **kasus / course / node / misi / berkas / liga / progres**: istilah domain yang dipakai di kode dan UI. Pakai istilah yang sama, jangan menerjemahkan ulang.
- **Berkas** adalah case file di UI. Folder kodenya `src/features/case-file/`.

## Peta kode

- `src/app/` — route Next.js (App Router) dan route handler.
- `src/features/<domain>/` — logika per domain: `auth`, `case-file`, `class`, `course`, `league`, `mission`, `onboarding`, `profile`, `progress`, `app-shell`.
- `src/server/api/` — tRPC: `root.ts`, `trpc.ts`, dan `routers/`.
- `src/server/db/` — skema Drizzle (`schema.ts`, `auth-schema.ts`), koneksi (`index.ts`), dan seed.
- `src/trpc/` — setup klien dan server tRPC.
- `src/lib/` — util dan konfigurasi bersama (auth, env, email, navigasi).
- `src/components/ui/` — komponen UI bersama.
- `casebase/` — konten kasus (JSON). Format ada di `casebase/README.md`.
- `drizzle/` — migrasi. Jangan diedit tangan.
- `tests/` — tes Vitest. Stub `server-only` ada di `tests/stubs/`.

## Cek semua permukaan

Bug yang paling sering muncul di repo ini adalah perubahan yang hanya benar di jalur yang diuji. Sebelum menganggap pekerjaan selesai, cek yang berlaku:

- **Halaman dan navigasi.** Route di `src/app/`, navigasi antar-layar, dan tombol kembali.
- **Layout mobile dan desktop.** Cek kedua ukuran layar.
- **API.** Procedure tRPC di `src/server/api/routers/`. Input divalidasi dengan Zod.
- **Data.** Perubahan skema Drizzle butuh migrasi (lihat di bawah).
- **Auth.** Route yang butuh login harus dicek saat logged-out.
- **Konten kasus.** Perubahan format JSON harus cocok dengan `casebase/README.md` dan seed.
- **Cron.** Jadwal ada di `vercel.json`. Endpoint cron harus tetap dilindungi `CRON_SECRET`.
- **Teks UI.** Semua teks UI berbahasa Indonesia dan konsisten dengan istilah di atas.
- **Dokumen.** Cek apakah `ARCHITECTURE.md` atau `docs/` jadi tidak akurat.

## Perintah

| Perintah | Fungsi |
| --- | --- |
| `bun run dev` | Dev server (Next.js) |
| `bun run typecheck` | `tsc --noEmit` |
| `bun run test` | Vitest, sekali jalan |
| `bun run test:watch` | Vitest mode watch |
| `bun run build` | Build produksi |
| `bun run lint` / `bun run format:check` | Biome (lint dan format) |
| `bun run format` | Format otomatis dengan Biome |
| `bun run db:migrate` | Jalankan migrasi Drizzle |
| `bun run db:seed` | Isi data contoh |

Gunakan `bun`, sesuai `packageManager` di `package.json`.

## Verifikasi

- Sebelum menyatakan selesai, jalankan `bun run typecheck`, `bun run test`, dan `bun run build`. CI menjalankan ketiganya dan harus hijau.
- Lint masih punya temuan lama dan tidak blocking di CI. Tetap jalankan `bun run lint` pada file yang diubah dan jangan menambah temuan baru.
- Logika baru di `src/features/` atau `src/lib/` perlu tes di `tests/unit/`. Tes menguji perilaku yang terlihat, bukan detail implementasi.
- Perubahan UI yang terlihat user: jalankan `bun run dev`, lalu jalani alurnya di browser sebagai user. Laporkan apa yang dicek dan apa yang tidak.
- Jangan jalankan `db:migrate` atau `db:seed` terhadap database yang tersambung ke `DATABASE_URL` di `.env` tanpa izin. Anggap database itu data nyata.

## Database dan migrasi

- Ubah skema di `src/server/db/`, lalu buat migrasi dengan drizzle-kit. Jangan mengedit file migrasi yang sudah pernah dijalankan.
- Perubahan skema dan migrasi dikerjakan dalam PR yang sama.

## Dokumentasi

Kebanyakan perubahan kode tidak butuh perubahan dokumen. Agen bisa membaca kodenya.

- `ARCHITECTURE.md` untuk keputusan desain dan alasannya, serta batasan yang melintasi beberapa bagian. Jangan menulis ulang daftar fitur atau file di sana.
- `docs/*.md` adalah salinan dokumentasi library dari Context7. Jangan diedit tangan. Untuk versi yang terpasang, baca `node_modules`.
- Komentar di kode hanya untuk alasan yang tidak terlihat dari kode, dan singkat. Default-nya tanpa komentar.
- Saat keputusan berubah, tulis ulang teks yang lama. Jangan menambah catatan baru di bawahnya.

## Commit dan pull request

- Jangan membuat PR kecuali diminta.
- Judul commit memakai Conventional Commits dengan bahasa yang sederhana: `feat: ...`, `fix: ...`, `refactor: ...`, `chore: ...`, `docs: ...`. Contoh: `fix: login ke layar belajar dan tombol buka berkas kasus`.
- Isi PR: masalahnya dalam satu atau dua kalimat, lalu cara memperbaikinya.
- Satu permintaan, satu PR. Jangan campur refactor dengan fitur.
- Jangan commit `.env`, secret, catatan rencana, atau file scratch.

## Taste

- Kerjakan yang diminta. Jangan menambah abstraksi atau fitur yang belum dibutuhkan.
- Inferred types lebih diutamakan daripada anotasi. `any` dihindari.
- Validasi input di batas (Zod di tRPC), lalu percaya tipe di dalam.
- Format mengikuti Biome: 2 spasi, tanda kutip ganda, titik koma, trailing comma, lebar 80.
- Effect React hanya untuk sinkronisasi dengan sistem di luar React. Turunkan nilai saat render dan lakukan aksi di handler.
- Jika aturan di sini bertentangan dengan tugas, katakan dan minta persetujuan sebelum melanggarnya.
