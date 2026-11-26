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
