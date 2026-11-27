# sql.js (SQLite di WebAssembly)

Belum ada di `package.json`. Dibutuhkan untuk mesin SQL Dasar (D-06). Sumber: Context7 `/sql-js/sql.js`.

## Inisialisasi di browser

```ts
import initSqlJs from 'sql.js'

const SQL = await initSqlJs({
  // wajib agar berkas .wasm dimuat dari lokasi yang benar
  locateFile: (file) => `/sql-wasm/${file}`,
})

const db = new SQL.Database()
```

Berkas `sql-wasm.wasm` harus ada di folder `public/` atau dilayani dari CDN. Di Next.js, letakkan di `public/sql-wasm/`.

## Eksekusi query

```ts
db.run('CREATE TABLE hello (a INT, b CHAR);')
db.run('INSERT INTO hello VALUES (?, ?)', [0, 'hello'])

const hasil = db.exec('SELECT * FROM hello')
// [{ columns: ['a', 'b'], values: [[0, 'hello']] }]
```

Untuk query dengan parameter, pakai `prepare`:

```ts
const stmt = db.prepare('SELECT * FROM hello WHERE a = :aval')
const row = stmt.getAsObject({ ':aval': 0 })
stmt.free() // wajib, agar memori dibebaskan
```

## Membuka database dari berkas

```ts
const buf = await fetch('/data/kasus-01.sqlite').then((r) => r.arrayBuffer())
const db = new SQL.Database(new Uint8Array(buf))
```

Ekspor: `db.export()` mengembalikan `Uint8Array` berisi berkas SQLite.

## Fungsi kustom

```ts
db.create_function('tambah', (a: number, b: number) => a + b)
```

## Catatan untuk proyek ini

- Pesan galat sql.js berbahasa Inggris. Terjemahkan ke Bahasa Indonesia sesuai FR-EDT-03 (lihat `docs/BACKLOQ.md`).
- Jalankan di Web Worker dengan batas 3 detik (FR-EDT-02, IF-SW-06).
- Ada perbedaan SQLite dan MySQL yang belum diputuskan (lihat `docs/BACKLOQ.md` bagian Risiko).
