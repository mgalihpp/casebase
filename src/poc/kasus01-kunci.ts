/* Kunci jawaban POC. Hanya diimpor oleh kode server (worker penilai), tidak pernah ke browser (SDD 5.1). */
export const KUNCI: Record<string, { kunci: string; pemeriksa?: string }> = {
  "sql-top3": { kunci: "SELECT * FROM transaksi ORDER BY jumlah DESC LIMIT 3" },
  "pg-top3": { kunci: "SELECT * FROM transaksi ORDER BY jumlah DESC LIMIT 3" },
  "pg-bekukan": {
    kunci:
      "BEGIN; UPDATE transaksi SET keterangan = 'Dibekukan', rekening = 'BEKU-01' WHERE keterangan = 'Transfer ke BYS-88'; COMMIT;",
    pemeriksa: "SELECT id, rekening, keterangan FROM transaksi ORDER BY id",
  },
  "mongo-top3": { kunci: "db.transaksi.find({}).sort({ jumlah: -1 }).limit(3)" },
  "redis-hitung": {
    kunci: "INCR transfer:BYS-88\nEXPIRE transfer:BYS-88 3600",
    pemeriksa: "GET transfer:BYS-88\nTTL transfer:BYS-88",
  },
};
