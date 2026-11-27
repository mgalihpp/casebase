# PGlite (PostgreSQL di WebAssembly)

Belum ada di `package.json`. Dibutuhkan untuk mesin query PostgreSQL di browser (D-05, D-12). Sumber: Context7 `/electric-sql/pglite`.

## Membuat instance

```ts
import { PGlite } from '@electric-sql/pglite'

const pg = await PGlite.create()
const res = await pg.query('SELECT 1 + 1 AS hasil')
```

`PGlite.create()` menunggu `waitReady`, sehingga database sudah siap saat dipakai. Konstruktor `new PGlite()` juga tersedia.

## Query dan transaksi

```ts
await pg.exec(`CREATE TABLE IF NOT EXISTS t (id SERIAL PRIMARY KEY, nama TEXT);`)
await pg.query('INSERT INTO t (nama) VALUES ($1)', ['budi'])

await pg.transaction(async (tx) => {
  await tx.exec("INSERT INTO t (nama) VALUES ('a');")
  await tx.exec("INSERT INTO t (nama) VALUES ('b');")
  // tx.rollback() untuk membatalkan secara eksplisit
})
```

Jika callback melempar galat, transaksi otomatis di-ROLLBACK. Jika COMMIT gagal karena rollback, `TransactionAbortedError` (kode `25P02`) dilempar.

## Dijalankan di Web Worker

Agar UI tidak macet, jalankan PGlite di worker dan bungkus dengan `PGliteWorker`:

```js
// pglite-worker.js
import { PGlite } from '@electric-sql/pglite'
import { worker } from '@electric-sql/pglite/worker'

worker({
  async init() {
    return new PGlite()
  },
})
```

```ts
// di halaman
import { PGliteWorker } from '@electric-sql/pglite/worker'

const pg = new PGliteWorker(
  new Worker(new URL('./pglite-worker.js', import.meta.url), { type: 'module' }),
)
await pg.waitReady
```

## Persistensi dan templat database (relevan dengan D-12)

- `dumpDataDir(compression?)` menghasilkan tarball gzip dari data directory. Bisa dimuat lagi lewat opsi `loadDataDir`.
- Untuk menghindari `initdb` berulang, buat satu instance sebagai templat, dump, lalu muat dari dump itu. Ini cocok dengan pola templat di D-12.
- Di `PGlite.create`, opsi `loadDataDir` menerima data dari `dumpDataDir()`. Data prepopulated juga bisa dimuat lewat paket `@electric-sql/pglite-prepopulatedfs`.

## Catatan untuk proyek ini

- Muat PGlite sekitar 12 detik di HP (emulasi) menurut `docs/BACKLOQ.md`. Cache dan unduhan harus dipersiapkan sebelum Sprint 2 selesai.
- Pakai `BEGIN ... ROLLBACK` dengan `SAVEPOINT` untuk soal transaksi (D-12).
- Database produksi tidak menerima query pengguna (NFR-SEC-04). PGlite hanya di browser atau untuk penilaian ulang di server, sesuai keputusan proyek.
