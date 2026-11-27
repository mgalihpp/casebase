# Tailwind CSS v4

Versi proyek: `tailwindcss@4.3.3` dan `@tailwindcss/turbopack@4.3.3`. Sumber: Context7 `/tailwindlabs/tailwindcss.com`.

## Setup dengan PostCSS

```bash
npm i tailwindcss @tailwindcss/postcss
```

```js
// postcss.config.mjs
export default {
  plugins: { '@tailwindcss/postcss': {} },
}
```

```css
/* src/app/globals.css */
@import "tailwindcss";
```

Di v4, `postcss-import` dan `autoprefixer` tidak diperlukan lagi. Keduanya sudah ditangani oleh Tailwind.

## Kustomisasi dengan @theme

Variabel di `@theme` otomatis menghasilkan utilitas dan varian.

```css
@import "tailwindcss";

@theme {
  --font-family-display: "Satoshi", sans-serif;
  --breakpoint-3xl: 1920px;
  --color-neon-pink: oklch(71.7% 0.25 360);
}
```

Dengan ini, `font-display`, `3xl:`, dan `text-neon-pink` tersedia.

## Catatan untuk proyek ini

- Versi proyek memakai `@tailwindcss/turbopack`. Konfigurasi Next.js di `next.config.ts` mungkin perlu disesuaikan. Periksa panduan Next.js di `node_modules/next/dist/docs/` jika ada galat build.
- Design system v3 (lihat `docs/BACKLOQ.md`) cocok dibuat sebagai token di `@theme`, bukan nilai acak di komponen.
- Font JetBrains Mono untuk editor perlu dilisensikan dan dicek (CMP-03 di BACKLOQ).
