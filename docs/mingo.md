# mingo (query gaya MongoDB di JavaScript)

Belum ada di `package.json`. Dibutuhkan untuk mesin query NoSQL (lihat `ARCHITECTURE.md`). Sumber: Context7 `/kofrasa/mingo`.

## Find

```ts
import { find } from 'mingo'

const hasil = find(
  [
    { name: 'Alice', age: 30 },
    { name: 'Bob', age: 21 },
    { name: 'Charlie', age: 25 },
  ],
  { age: { $gte: 25 } },
).all()
// [{ name: 'Alice', age: 30 }, { name: 'Charlie', age: 25 }]
```

## Aggregation

Operator harus didaftarkan lebih dulu lewat `Context`:

```ts
import { Aggregator } from 'mingo/aggregator'
import { Context } from 'mingo/core'
import { $group } from 'mingo/operators/pipeline/group'
import { $match } from 'mingo/operators/pipeline/match'
import { $sort } from 'mingo/operators/pipeline/sort'
import { $min } from 'mingo/operators/accumulator/min'

const context = Context.init({
  pipeline: { $group, $match, $sort },
  accumulator: { $min },
})

const agg = new Aggregator(
  [
    { $match: { type: 'homework' } },
    { $group: { _id: '$student_id', score: { $min: '$score' } } },
    { $sort: { _id: 1, score: 1 } },
  ],
  { context },
)

const result = agg.run(collection)
```

`agg.stream(collection)` mengembalikan iterator untuk hasil bertahap. `collect()` setara dengan `run()`.

## Catatan untuk proyek ini

- Hanya impor operator yang dipakai. Ini menjaga ukuran bundle kecil.
- Versi terbaru memakai subpath seperti `mingo/operators/pipeline/group`. Pastikan versi yang dipasang sesuai dokumentasi.
- Sumber Context7 untuk mingo berstatus Medium. Verifikasi API di dokumentasi resmi sebelum dipakai.
