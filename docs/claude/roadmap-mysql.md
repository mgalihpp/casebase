# Roadmap Kursus MySQL

Rencana kurikulum kursus `sql` (SQL Dasar, maskot Dibi): urutan topik, kasus per topik, dan sampai mana kursus ini mengajar. Dasarnya riset jalur belajar MySQL yang umum dipakai (roadmap.sh/sql, GeeksforGeeks 30 Days of SQL, SkillEngine MySQL Roadmap 2026) dan objektif sertifikasi resmi MySQL (mysql.com/certification).

## Batas pencapaian

Query latihan berjalan di browser lewat sql.js (SQLite, WebAssembly), sesuai D-05. Karena itu kursus ini mengajar tingkat 1 dan 2 secara penuh dan tingkat 3 sebagian. Tingkat 4 tidak diajarkan.

| Tingkat | Cakupan | Status di kursus |
| --- | --- | --- |
| 1. Dasar | SELECT, WHERE, ORDER BY, LIMIT, GROUP BY, agregat, HAVING, INSERT/UPDATE/DELETE | Diajarkan penuh |
| 2. Menengah | JOIN, subquery, CTE, window function, CASE, NULL, fungsi tanggal dan teks | Diajarkan penuh |
| 3. Lanjutan | Desain skema, normalisasi, constraint, view | Diajarkan sebagian |
| 3. Lanjutan | Indeks dan EXPLAIN, transaksi, stored procedure, trigger | Tidak diajarkan, perilakunya berbeda di SQLite |
| 4. Administrasi | InnoDB, backup, replikasi, high availability, tuning server | Tidak diajarkan, butuh MySQL sungguhan |

Pencapaian akhir: pemain bisa menjawab pertanyaan dari banyak tabel dan merancang tabel sederhana. Itu setara level analis data, bukan DBA.

## Urutan kasus

Satu kasus = satu file di `casebase/sql/`. Kolom Inspirasi hanya acuan tema. Tabel dan nama dalam kasus dibuat fiktif.

| No | Judul | Topik | Inspirasi | Status |
| --- | --- | --- | --- | --- |
| 01 | Pencurian di Gudang | SELECT, WHERE, ORDER BY, LIMIT, GROUP BY, HAVING | Asli | Ada |
| 02 | Jejak Perusahaan Cangkang | JOIN, GROUP BY, HAVING | Panama Papers dan Paradise Papers | Ada |
| 03 | (belum ditentukan) | INSERT, UPDATE, DELETE | Barang bukti diubah, catatan CCTV dihapus | Rencana |
| 04 | (belum ditentukan) | LEFT JOIN dan NULL | Tersangka tanpa alibi (pola SQL Noir) | Rencana |
| 05 | (belum ditentukan) | Subquery | Cari saksi, lalu cari pelaku dari kesaksiannya | Rencana |
| 06 | (belum ditentukan) | CTE | Rantai transaksi mencurigakan (Enron) | Rencana |
| 07 | (belum ditentukan) | Window function | Pola kejahatan per wilayah dan waktu (Chicago Crime) | Rencana |
| 08 | (belum ditentukan) | CASE, fungsi tanggal dan teks | Menyisir catatan dengan LIKE (pola SQL Noir) | Rencana |
| 09 | (belum ditentukan) | Desain tabel dan constraint | Membangun arsip kasus dari nol | Rencana |
| 10 | (belum ditentukan) | View dan kasus gabungan penutup | Kasus besar gabungan | Rencana |

Setiap kasus memakai struktur 6 node yang sama (lihat `casebase/README.md`).

## Referensi

Dikumpulkan dari kutipan hasil pencarian. Isi tiap situs belum dibaca penuh, jadi cakupan topiknya perlu dicek sebelum dipakai sebagai acuan.

### Game dan kasus detektif SQL

- [SQL Murder Mystery](https://mystery.knightlab.com/): satu kasus pembunuhan, melatih JOIN. Lisensi MIT, repo di [GitHub](https://github.com/nuknightlab/sql-mysteries).
- [SQL Noir](https://www.sqlnoir.com/): 6 kasus, naik dari SELECT ke JOIN dan subquery. Ada tabel tersangka, wawancara, dan alibi.
- [SQL Police Department](https://sqlpd.com/): misi di kantor polisi (penipuan, pencurian, pembunuhan). UI memakai tombol kata kunci, mirip soal `susun`. Sebagian berbayar.
- [Query the Murder](https://querythemurder.com/sql-mystery-game.html): 18 kasus bertema Agatha Christie, gratis.
- [SQL Detective (itch.io)](https://lawnat.itch.io/sql-detective): 30 penyelidikan berformat temukan kesalahan query, jawaban dipilih.
- [SQL Case Files, Lost at SQL, Station Zero](https://sqlmaxx.com/sql-games/): disebut mengajarkan JOIN, window function, dan CTE.
- Daftar lain: [SQLMaxx](https://sqlmaxx.com/sql-games/) (39 game) dan [tinjauan CSEDU 2026](https://www.insticc.org/node/TechnicalProgram/csedu/2026/presentationDetails/149837).

### Kasus nyata dan dataset

- Panama Papers dan Paradise Papers (ICIJ): [offshoreleaks.icij.org](https://offshoreleaks.icij.org/), [metode investigasi](https://gijn.org/stories/paradise-papers/).
- [Chicago Crime](https://www.linkedin.com/posts/jesse-gifford-95713b134_sql-practice-with-bigquery-dataset-chicago-activity-7178508462329376768-DoEo): data terbuka kejahatan 2001 sampai sekarang.
- Enron: [analisis pola penipuan](https://towardsdatascience.com/deriving-patterns-of-fraud-from-the-enron-dataset-64cbceb65c36/).
- [Cambridge Analytica](https://id.wikipedia.org/wiki/Skandal_data_Facebook%E2%80%93Cambridge_Analytica) dan [9 kasus penipuan besar](https://money.usnews.com/investing/articles/biggest-corporate-frauds-in-history): tanpa dataset siap pakai, datanya harus disimulasikan.

### Sample database MySQL

[Sakila](https://dev.mysql.com/doc/sakila/en/), [classicmodels](https://www.mysqltutorial.org/getting-started-with-mysql/mysql-sample-database/), [Employees dan World](https://blog.sqlauthority.com/2020/02/15/mysql-download-sample-database-sakila-world-employee/), [Northwind untuk MySQL](https://github.com/harryho/db-samples), [perbandingan 7 database](https://mindweave.tech/blog/best-sample-databases-for-learning-sql).

### Jalur belajar dan sertifikasi

[roadmap.sh/sql](https://roadmap.sh/sql), [30 Days of SQL](https://www.geeksforgeeks.org/sql/30-days-of-sql-from-basic-to-advanced-level/), [MySQL Roadmap 2026](https://the-skillengine.com/mysql-roadmap/), [sertifikasi MySQL](https://www.mysql.com/certification/).

### Catatan hak cipta

Dari referensi di atas hanya pola yang dipakai: alur, topik, dan jenis tabel. Cerita, tabel, dan teks soal ditulis sendiri. Hanya SQL Murder Mystery yang berlisensi MIT, yang lain punya hak cipta masing-masing.

## Catatan keputusan

- Kursus `sql` berlabel "MySQL" tetapi mesinnya SQLite. Keputusan yang masih terbuka: ganti label menjadi "SQL umum", atau sesuaikan materi dengan dialek MySQL.
- Kasus nyata dipakai sebagai inspirasi tema saja. Data di kasus dibuat fiktif supaya ukurannya kecil dan tidak memakai nama orang sungguhan.
