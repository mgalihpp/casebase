# Konten Kasus 01: Pencurian di Gudang (draf)
 
Draf langkah 4 di whiteboard. Format mengikuti SDD 5.1 (versi 0.2). Data dan cerita fiktif. Polanya terinspirasi pembobolan rekening yang diberitakan. Pembobolan itu sekitar 42 transfer dalam 17 menit ke lima rekening. Nama pihak, bank, dan tersangka tidak dipakai.
 
Seed di bawah adalah data baru. Data ini bukan tabel `transaksi` dari prototipe atau dari `src/game/content.ts` (9 baris). Sebelum dipakai, cocokkan dengan prototipe. Jika prototipe dipertahankan, angka jawaban di bawah harus dihitung ulang.
 
## Seed
 
```sql
CREATE TABLE transaksi (id INTEGER, rekening TEXT, jumlah INTEGER, waktu TEXT);
INSERT INTO transaksi VALUES
(1,'GDG-01',2500000,'13/03 21:10'),
(2,'GDG-02',1200000,'13/03 21:14'),
(3,'GDG-01',750000,'13/03 21:40'),
(4,'GDG-03',4800000,'13/03 22:05'),
(5,'GDG-02',300000,'13/03 22:30'),
(6,'GDG-04',9500000,'13/03 23:50'),
(7,'GDG-04',6200000,'14/03 00:15'),
(8,'GDG-01',1100000,'14/03 00:40'),
(9,'GDG-05',450000,'14/03 08:00');
```
 
Hasil yang diharapkan untuk pengecekan:
- Jumlah di atas 2.000.000: 4 baris (id 1, 4, 6, 7).
- Tiga jumlah terbesar: 9.500.000, 6.200.000, 4.800.000.
- Total per rekening: GDG-04 15.700.000; GDG-03 4.800.000; GDG-01 4.350.000; GDG-02 1.500.000; GDG-05 450.000.
- Rekening dengan lebih dari satu transfer di atas 2.000.000: hanya GDG-04.
## Cerita
 
Brankas gudang PT Sinar Logam dibobol tengah malam, 13 Maret. Sembilan transfer keluar dari rekening terkait gudang sebelum pagi. Cari pola dalam tabel `transaksi`, lalu tunjukkan rekening yang paling mencurigakan.
 
## Node dan soal
 
```json
{
  "course": "sql",
  "number": "01",
  "title": "Pencurian di Gudang",
  "story": "Brankas gudang PT Sinar Logam dibobol tengah malam, 13 Maret. Sembilan transfer keluar sebelum pagi.",
  "seed": "CREATE TABLE transaksi (id INTEGER, rekening TEXT, jumlah INTEGER, waktu TEXT); INSERT INTO transaksi VALUES (1,'GDG-01',2500000,'13/03 21:10'), (2,'GDG-02',1200000,'13/03 21:14'), (3,'GDG-01',750000,'13/03 21:40'), (4,'GDG-03',4800000,'13/03 22:05'), (5,'GDG-02',300000,'13/03 22:30'), (6,'GDG-04',9500000,'13/03 23:50'), (7,'GDG-04',6200000,'14/03 00:15'), (8,'GDG-01',1100000,'14/03 00:40'), (9,'GDG-05',450000,'14/03 08:00');",
  "nodes": [
    {"key": "n1", "type": "mission", "title": "Lihat semua bukti", "topic": "SELECT dan FROM"},
    {"key": "n2", "type": "mission", "title": "Saring transfer besar", "topic": "WHERE"},
    {"key": "n3", "type": "mission", "title": "Tiga transfer terbesar", "topic": "ORDER BY dan LIMIT"},
    {"key": "n4", "type": "chest", "coins": 5},
    {"key": "n5", "type": "mission", "title": "Total per rekening", "topic": "GROUP BY dan SUM"},
    {"key": "n6", "type": "boss", "title": "Interogasi"}
  ],
  "questions": [
    {
      "node": "n1",
      "type": "write",
      "prompt": "Tampilkan semua kolom dan semua baris dari tabel transaksi.",
      "boleh": ["SELECT"],
      "wajib": ["FROM"],
      "aturanKolom": "tepat",
      "answer": "SELECT * FROM transaksi",
      "pemeriksa": null,
      "hints": [
        "Kamu ingin semua kolom, jadi pakai * setelah SELECT.",
        "Sebutkan nama tabel setelah FROM.",
        "SELECT * FROM ___"
      ],
      "explanation": "SELECT * mengambil semua kolom, FROM menunjuk tabel sumbernya."
    },
    {
      "node": "n2",
      "type": "write",
      "prompt": "Tampilkan transfer dengan jumlah lebih dari 2.000.000.",
      "boleh": ["SELECT"],
      "wajib": ["WHERE"],
      "aturanKolom": "minimal",
      "answer": "SELECT * FROM transaksi WHERE jumlah > 2000000",
      "pemeriksa": null,
      "hints": [
        "Gunakan WHERE untuk menyaring baris.",
        "Bandingkan kolom jumlah dengan tanda lebih besar.",
        "SELECT * FROM transaksi WHERE jumlah ___ 2000000"
      ],
      "explanation": "WHERE jumlah > 2000000 menyisakan baris yang nilainya di atas dua juta."
    },
    {
      "node": "n3",
      "type": "write",
      "prompt": "Tampilkan 3 transaksi dengan jumlah terbesar.",
      "boleh": ["SELECT"],
      "wajib": ["ORDER BY", "LIMIT"],
      "aturanKolom": "minimal",
      "answer": "SELECT * FROM transaksi ORDER BY jumlah DESC LIMIT 3",
      "pemeriksa": null,
      "hints": [
        "Urutkan transaksi dari jumlah terbesar ke terkecil, lalu ambil beberapa baris teratas saja.",
        "Pakai ORDER BY dengan DESC, lalu LIMIT.",
        "SELECT * FROM transaksi ORDER BY ___ DESC LIMIT ___"
      ],
      "explanation": "ORDER BY jumlah DESC mengurutkan dari terbesar, LIMIT 3 mengambil tiga teratas."
    },
    {
      "node": "n5",
      "type": "write",
      "prompt": "Tampilkan total jumlah transfer per rekening, dari yang terbesar.",
      "boleh": ["SELECT"],
      "wajib": ["GROUP BY", "SUM"],
      "aturanKolom": "minimal",
      "answer": "SELECT rekening, SUM(jumlah) AS total FROM transaksi GROUP BY rekening ORDER BY total DESC",
      "pemeriksa": null,
      "hints": [
        "Kelompokkan baris per rekening dengan GROUP BY.",
        "SUM(jumlah) menjumlahkan nilai di setiap kelompok.",
        "SELECT rekening, SUM(jumlah) ... GROUP BY rekening ORDER BY ___ DESC"
      ],
      "explanation": "GROUP BY rekening membuat satu baris per rekening, SUM(jumlah) menghitung totalnya, dan ORDER BY total DESC mengurutkannya."
    },
    {
      "node": "n6",
      "type": "write",
      "prompt": "Tampilkan rekening yang menerima lebih dari satu transfer di atas 2.000.000.",
      "boleh": ["SELECT"],
      "wajib": ["GROUP BY", "HAVING"],
      "aturanKolom": "minimal",
      "answer": "SELECT rekening FROM transaksi WHERE jumlah > 2000000 GROUP BY rekening HAVING COUNT(*) > 1",
      "pemeriksa": null,
      "hints": [
        "Saring dulu transfer di atas 2.000.000 dengan WHERE, baru kelompokkan.",
        "Jumlah baris per kelompok dihitung dengan COUNT(*). Filter kelompok ditulis dengan HAVING.",
        "... WHERE jumlah > 2000000 GROUP BY rekening HAVING COUNT(*) ___ 1"
      ],
      "explanation": "WHERE menyaring transfer besar, GROUP BY mengelompokkan per rekening, dan HAVING COUNT(*) > 1 hanya menyisakan rekening yang muncul lebih dari sekali. Jawabannya GDG-04."
    }
  ]
}
```
 
## Catatan untuk pengembangan
 
- Soal `n4` (chest) tidak punya soal. Node ini hanya memberi 5 koin.
- Soal `n6` memakai `HAVING`. Karena itu `wajib` harus memuat `GROUP BY` dan `HAVING`.
- Setiap soal memakai `aturanKolom: minimal`, kecuali `n1` yang memakai `tepat`. Dengan `minimal`, penilaian tetap menerima kolom tambahan.
- Petunjuk di `hints` disusun dari umum ke spesifik. Jumlah koin petunjuk masih terbuka (lihat SDD 5.2).
