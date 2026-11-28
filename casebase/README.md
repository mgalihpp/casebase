# Casebase

Konten kasus disimpan sebagai data terpisah dari kode (DC-MNT-01). Kasus baru cukup ditambah sebagai file JSON di sini.

## Struktur

```
casebase/
  README.md
  sql/                       Satu folder per kursus (course)
    01-pencurian-di-gudang.json
    02-jejak-perusahaan-cangkang.json
```

## Format

Satu kasus = satu file JSON, sesuai SDD 5.1 (`docs/claude/SDD.md`).

- `course`, `number`, `title`, `story`, `seed`: identitas dan data contoh kasus.
- `nodes`: 6 node per kasus (3 misi, 1 kotak bukti, 1 misi, 1 interogasi).
- `questions`: soal per node. `answer` adalah kunci jawaban dan tidak boleh dikirim ke browser.
- `boleh`, `wajib`, `aturanKolom`: batasan query yang diterima.
- `pemeriksa`: diisi hanya untuk soal yang mengubah data.

Sebelum dipakai, cocokkan `seed` dengan prototipe (lihat catatan di `docs/claude/kasus-01.md`).
