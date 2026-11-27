/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // POC mesin query: worker thread /api/poc/check dimuat dari berkas saat runtime, jadi harus ikut di-deploy.
  outputFileTracingIncludes: {
    "/api/poc/check": [
      "./poc-server/**",
      "./node_modules/sql.js/dist/sql-wasm.js",
      "./node_modules/sql.js/dist/sql-wasm.wasm",
      "./node_modules/sql.js/package.json",
      "./node_modules/@electric-sql/pglite/package.json",
      "./node_modules/@electric-sql/pglite/dist/*.js",
      "./node_modules/@electric-sql/pglite/dist/*.wasm",
      "./node_modules/@electric-sql/pglite/dist/*.data",
    ],
  },
  async headers() {
    // Berkas mesin tidak berubah antar-deploy di POC; cache lama supaya muat kedua instan.
    return ["/pglite/:f*", "/sqljs/:f*"].map((source) => ({
      source,
      headers: [{ key: "Cache-Control", value: "public, max-age=31536000, immutable" }],
    }));
  },
};
export default nextConfig;
