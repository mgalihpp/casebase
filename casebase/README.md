# Casebase

Konten kasus disimpan sebagai data terpisah dari kode (DC-MNT-01). Kasus baru cukup ditambah sebagai file JSON di sini.

## Struktur

```
casebase/
  README.md
  sql/                       Satu folder per kursus (course)
    01-pencurian-di-gudang.json
    02-jejak-perusahaan-cangkang.json
    03-rekaman-cctv-yang-hilang.json
    04-tersangka-tanpa-alibi.json
    05-saksi-kunci.json
    06-rantai-transaksi-mencurigakan.json
    07-peta-kejahatan-kota.json
    08-sandi-di-pesan-rahasia.json
    09-arsip-dari-nol.json
    10-dalang-di-balik-layar.json
```

## Format

Satu kasus = satu file JSON, sesuai SDD 5.1 (`docs/claude/SDD.md`).

- `course`, `number`, `title`, `story`, `seed`: identitas dan data contoh kasus.
- `nodes`: 6 node per kasus (3 misi, 1 kotak bukti, 1 misi, 1 interogasi).
- `questions`: soal per node. `answer` adalah kunci jawaban dan tidak boleh dikirim ke browser.
- `boleh`, `wajib`, `aturanKolom`: batasan query yang diterima.
- `pemeriksa`: diisi hanya untuk soal yang mengubah data.
- Tipe soal: `write`, `pilih`, `susun`, dan tiga tipe interaktif.
  - `tebak`: ketuk baris yang lolos. Isi `columns`, `rows`, dan `answer` (indeks baris).
  - `salah`: ketuk token yang keliru, lalu pilih perbaikan. Isi `tokens`, `wrongIndex`, `options`, `fixIndex`.
  - `pasang`: pasangkan `kiri` dengan `kanan`. `answer[i]` adalah indeks `kanan` untuk `kiri[i]`.
- Kasus dikerjakan berurutan menurut `number`. Kasus berikutnya terbuka setelah semua node kasus sebelumnya tuntas.

Sebelum dipakai, cocokkan `seed` dengan prototipe (lihat catatan di `docs/claude/kasus-01.md`).
