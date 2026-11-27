# web-push (Web Push untuk notifikasi PWA)

Belum ada di `package.json`. Dibutuhkan untuk pengingat harian (FR-ONB-05, IF-SW-04). Sumber: Context7 `/web-push-libs/web-push`.

## Membuat VAPID key (sekali saja)

```ts
import webpush from 'web-push'

const vapidKeys = webpush.generateVAPIDKeys()
// simpan publicKey dan privateKey sebagai env variable, jangan dibuat ulang tiap deploy
```

```ts
webpush.setVapidDetails(
  'mailto:admin@contoh.test', // ganti dengan alamat kontak proyek
  process.env.VAPID_PUBLIC_KEY!,
  process.env.VAPID_PRIVATE_KEY!,
)
```

Subject harus berupa `mailto:` atau URL.

## Mengirim notifikasi

```ts
const subscription = {
  endpoint: '<URL push dari browser>',
  keys: {
    p256dh: '<kunci publik browser>',
    auth: '<auth secret browser>',
  },
}

await webpush.sendNotification(subscription, JSON.stringify({ title: 'Ayo belajar!' }), {
  TTL: 60 * 60,           // simpan di push service selama 1 jam
  urgency: 'normal',
})
```

`payload` opsional. Jika diisi, `subscription.keys` wajib ada. Promise gagal jika push service menolak, dan objek galat berisi `statusCode`. Subscription yang sudah tidak valid (biasanya 404 atau 410) sebaiknya dihapus dari database.

## Catatan untuk proyek ini

- Dipanggil dari server (route handler atau cron), bukan dari browser. Kunci privat tidak boleh sampai ke klien.
- Web Push di iOS hanya bekerja jika website sudah dipasang ke layar utama (lihat SRS 2.5 dan `docs/BACKLOQ.md`).
- Subscription disimpan di PostgreSQL lewat Drizzle, dengan kolom `endpoint`, `p256dh`, dan `auth`.
