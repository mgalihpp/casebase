# Zod v4

Versi proyek: `zod@^4.6.7`. Sumber: Context7 `/colinhacks/zod` (v4).

## Schema dan tipe

```ts
import * as z from 'zod'

const User = z.object({
  username: z.string().min(3),
  email: z.email(),
  favoriteNumbers: z.array(z.number()).optional(),
})

type User = z.infer<typeof User>
```

## Parsing

```ts
User.parse(data)           // melempar ZodError jika gagal
const result = User.safeParse(data)
if (!result.success) {
  console.log(result.error.issues)
}
```

`safeParse` mengembalikan `{ success, data }` atau `{ success: false, error }`. Gunakan ini di tempat yang tidak boleh melempar.

## Format galat untuk form

Schema yang datar (satu level) cocok dengan `z.flattenError`:

```ts
const flattened = z.flattenError(result.error)
flattened.formErrors                // galat di level objek
flattened.fieldErrors.username      // galat per kolom, misalnya ['...']
```

Untuk schema bersarang, gunakan `z.treeifyError`.

## Pemakaian di tRPC

Input dan output procedure tRPC diberi schema Zod:

```ts
baseProcedure
  .input(z.object({ name: z.string() }))
  .output(z.object({ greeting: z.string() }))
  .query(({ input }) => ({ greeting: `hello ${input.name}` }))
```

Lihat [trpc.md](trpc.md).

## Catatan untuk proyek ini

- `ARCHITECTURE.md` mewajibkan setiap input dari klien divalidasi Zod. Simpan skema di `schemas.ts` per fitur.
- Skema Zod bisa dibagi ke klien untuk validasi form, tetapi keputusan skor tetap di server (D-07).
