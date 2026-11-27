# CaseBase (MVP)

Belajar database lewat kasus detektif. MVP ini berisi satu kursus (MySQL bareng Dibi) dan Kasus 01: Pencurian di Gudang, tujuh misi bertahap.

## Cara menjalankan

```
npm install
npm run dev            # pratinjau lokal di http://localhost:3000
npm run build          # build produksi Next.js
npm test               # uji penilai query (32 kasus + semua kunci)
npm run build:artifact # versi satu halaman di dist/casebase.html
```

## Isi

- `src/game/content.ts`: kursus, tabel, data kasus, dataset varian, misi, petunjuk.
- `src/game/engine.ts`: mesin SQL di browser (sql.js, SQLite WASM), pemeriksaan query hanya-baca, pesan error ramah, penilaian berbasis hasil.
- `src/game/storage.ts`: progres lokal (XP, nyawa harian, lentera, misi selesai, draf query).
- `src/game/mascots.ts`, `src/game/icons.ts`: maskot dan ikon SVG.
- `src/components/Game.tsx`: semua layar (sambutan, intro kasus, peta, misi, kasus selesai).
- `artifact/entry.tsx` dan `scripts/build-artifact.mjs`: versi satu halaman.

## Cara penilaian

Hasil query pemain dibandingkan dengan hasil query kunci: jumlah kolom, jumlah baris, isi (urutan baris diabaikan kecuali misi meminta urutan, nama alias diabaikan, teks tidak peka huruf besar seperti MySQL). Query lalu dijalankan lagi di dataset varian supaya query yang menghafal id atau nama tertentu tidak lolos.

## Batasan MVP

Mesinnya SQLite, jadi beberapa fungsi khas MySQL belum ada. Belum ada akun, penilaian di server, kasus 2 sampai 6, dan kursus PostgreSQL, MongoDB, Redis, SQLite.

## POC mesin query (branch `poc/query-engine`)

Langkah 2 rencana: membuktikan mesin query jalan di browser HP dan di server Vercel (SDD 3.8, keputusan D-05).

- Halaman `/poc`: lima soal Kasus 01 (SQL Dasar, PostgreSQL baca, PostgreSQL BEGIN/COMMIT, MongoDB, Redis), tombol Jalankan (Web Worker), Cek jawaban (server), dan tombol "Jalankan semua ukuran" untuk diukur di HP sungguhan.
- `POST /api/poc/check` dengan `{ soalId, query }`: menilai di worker thread Node, sesuai SDD 3.7.1.
- `src/poc/`: antarmuka `QueryEngine.run(seed, query)`, mesin sql.js, PGlite, mingo, peniru Redis, penilai, dan pembungkus worker (batas 3 detik, 200 baris).

```
npm run build:poc     # bangun worker, berkas mesin (gzip), dan snapshot PostgreSQL
npm run test:poc      # 47 uji penilai, batas 3 detik, dan waktu Cek
node scripts/ukur-browser.mjs http://localhost:3000/poc 4 9000 85   # emulasi HP kelas menengah di 4G
```
