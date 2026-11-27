# Software Design Description: SQL Quest (CaseBase)
 
Salinan teks dari dokumen asli. Revisi 0.2 (27 Nov 2026) memasukkan hasil POC. Dokumen asli yang hidup dan bisa diedit, beserta enam diagramnya: https://claude.ai/artifact/6UvLW77aeSxzdaLRAbuYrq. Diagram di salinan ini diganti ringkasan teks. Jika berbeda, dokumen asli yang berlaku.
 
SQL Quest berjalan sebagai satu aplikasi Next.js di Vercel dengan tRPC dan PostgreSQL. Semua mesin query latihan berjalan di browser dan di server dengan WebAssembly atau JavaScript, tanpa server sandbox terpisah. Dokumen ini menjelaskan cara sistem dibangun untuk memenuhi SRS v0.2 (dokumen proyek `srs-sql-quest.md`). Strukturnya mengikuti template MSDD jam01, berbasis IEEE 1016-2009.
 
## Riwayat revisi
 
| Versi | Tanggal | Oleh | Perubahan |
| --- | --- | --- | --- |
| 0.1 | 27 Nov 2026 | Stunob | Draf awal dari SRS v0.2, prototipe web, dan keputusan stack di whiteboard |
| 0.2 | 27 Nov 2026 | Stunob | Revisi setelah POC penilai query (bagian 3.1, 3.7.1, 3.8, 4, 5.1, 5.2). D-05 diuji POC, final setelah ukur HP asli dan Vercel |
 
## 1. Pendahuluan
 
### 1.1 Tujuan dokumen
 
SRS menjawab apa yang harus dilakukan SQL Quest. Dokumen ini menjawab bagaimana sistemnya dibangun. Pembacanya pengembang yang menulis kode, penguji yang menyusun skenario uji, dan dosen pembimbing yang menilai rancangan.
 
### 1.2 Lingkup
 
Dokumen ini mencakup MVP 1.0: website mobile-first, backend tRPC, database, mesin query latihan, Web Push, dan deployment di Vercel. Dasbor dosen, aplikasi native, dan fitur berbayar berada di luar lingkup, sama seperti di SRS.
 
### 1.3 Istilah
 
Istilah domain seperti kasus, misi, nyawa, lentera, dan liga mengikuti SRS bagian 1.3. Istilah teknis yang baru muncul di sini:
 
| Istilah | Arti |
| --- | --- |
| Mesin query | Pustaka yang menjalankan query latihan: sql.js, PGlite, mingo, atau peniru Redis |
| mingo | Pustaka JavaScript yang meniru query dan agregasi MongoDB |
| PGlite | PostgreSQL yang dikompilasi ke WebAssembly, jalan di browser dan Node |
| PWA | Progressive Web App, website yang bisa dipasang ke layar utama |
| Service worker | Skrip browser yang menyimpan cache untuk offline dan menerima Web Push |
| sql.js | SQLite yang dikompilasi ke WebAssembly |
| tRPC | Pustaka API bertipe untuk TypeScript; klien dan server berbagi tipe yang sama |
| Web Worker | Thread terpisah di browser, dipakai agar query tidak membekukan halaman |
| Templat database | Database PGlite yang sudah di-initdb dan berisi data contoh satu kasus, dibuat sekali per seed lalu dipakai bersama |
| SAVEPOINT | Titik simpan di dalam transaksi PostgreSQL, dipakai agar BEGIN, COMMIT, dan ROLLBACK pengguna tidak mengakhiri transaksi bungkus |
 
### 1.4 Referensi
 
- SRS SQL Quest v0.2: https://claude.ai/artifact/6xAscwB6aqS2RdhEsom21s, sumber semua ID kebutuhan di dokumen ini
- Prototipe web mobile-first: https://claude.ai/artifact/RNzGfjJkgo1FQuF98VFHm4, sumber alur layar dan data contoh Kasus 01
- Whiteboard rencana sebelum coding: https://claude.ai/artifact/8gdjNvoxwF9NiyKiDaC3SG, sumber keputusan stack
- Brief dan hasil POC penilai query: dokumen proyek `poc-penilai-query-brief.md`, kode di branch `poc/query-engine` commit `0791fb3`
- Design system v3, dokumen proyek `sql-quest-design-system-v3.html`
- Template MSDD: https://github.com/jam01/SDD-Template, struktur dokumen
### 1.5 Konvensi
 
Setiap bagian desain menyebut ID kebutuhan SRS yang dipenuhinya, misalnya FR-EDT-02. Kata usulan menandai pilihan yang belum disepakati tim dan masih boleh diganti tanpa mengubah rancangan lain.
 
## 2. Gambaran desain
 
### 2.1 Pemangku kepentingan dan kepentingannya
 
| Pemangku kepentingan | Yang perlu dijawab desain | Dijawab di |
| --- | --- | --- |
| Mahasiswa dan pelajar | Misi tetap jalan di HP murah dan saat offline; jawaban dinilai cepat | 3.1, 3.3, 3.8 |
| Pengembang | Bagian mana menulis ke mana; tipe API sama di klien dan server | 3.1, 3.5, 3.6 |
| Penulis konten | Menambah kasus tanpa deploy ulang | 3.5, lampiran 5.1 |
| Penguji | Status misi, aturan skor, XP, dan nyawa yang bisa diuji | 3.4, 3.7 |
| Pemilik produk | Biaya server tetap kecil selama produk gratis | 3.1, 3.8, keputusan 4 |
 
### 2.2 Sudut pandang yang dipakai
 
Template IEEE 1016 menawarkan 15 sudut pandang. Dokumen ini memakai tujuh yang relevan untuk MVP. Sudut pandang fisik, konkurensi, dan sumber daya dibahas di dalam bagian 3.8 karena hanya menyangkut mesin query.
 
| Bagian | Sudut pandang IEEE 1016 | Isi |
| --- | --- | --- |
| 3.1 | Konteks, komposisi, deployment | Komponen dan tempat masing-masing berjalan |
| 3.2 | Interaksi | Alur pengguna dari sambutan sampai misi selesai |
| 3.3 | Interaksi | Urutan pesan saat Jalankan dan Cek jawaban |
| 3.4 | Dinamika status | Status soal dan misi |
| 3.5 | Informasi | Tabel database dan relasinya |
| 3.6 | Antarmuka | Router dan prosedur tRPC |
| 3.7 | Algoritma | Penilaian query, skor, XP, nyawa, lentera, liga |
| 3.8 | Sumber daya, konkurensi | Isolasi dan batas mesin query |
 
### 2.3 Use case
 
Diagram use case di dokumen asli memuat 3 aktor dan 17 use case. Tamu adalah pengunjung yang belum masuk. Pelajar adalah tamu yang sudah masuk, jadi pelajar juga bisa melakukan semua use case tamu. Vercel Cron adalah aktor sistem yang berjalan terjadwal. Relasi include berarti use case itu selalu ikut dijalankan; extend berarti boleh dijalankan.
 
- Ikuti onboarding di-extend oleh Cek kode kelas.
- Kerjakan misi meng-include Cek jawaban, dan di-extend oleh Jalankan query dan Buka petunjuk.
- Atur profil dan target di-extend oleh Hapus akun.
| Use case | Aktor | Kebutuhan SRS |
| --- | --- | --- |
| Ikuti onboarding, cek kode kelas | Tamu | FR-ONB-01 s.d. 06, FR-PRF-03, FR-PRF-04 |
| Daftar akun, masuk, lupa kata sandi | Tamu | FR-AUTH-01 s.d. 05 |
| Pilih kursus | Pelajar | FR-LRN-01, FR-LRN-02 |
| Kerjakan misi, jalankan query, cek jawaban, buka petunjuk | Pelajar | FR-MIS-01 s.d. 07, FR-EDT-01 s.d. 08 |
| Kelola berkas kasus | Pelajar | FR-BRK-01 s.d. 06 |
| Lihat peringkat | Pelajar | FR-RNK-01, FR-RNK-02, FR-RNK-04 |
| Atur profil dan target, hapus akun | Pelajar | FR-PRF-01, FR-PRF-02, FR-GAM-04, CMP-01 |
| Gabung kelas | Pelajar | FR-PRF-03 |
| Pasang ke layar utama | Pelajar | IF-UI-10 |
| Reset liga mingguan | Vercel Cron | FR-RNK-03 |
| Kirim pengingat harian | Vercel Cron | FR-ONB-05, IF-SW-04 |
 
## 3. Rancangan
 
### 3.1 Arsitektur dan deployment
 
Diagram di dokumen asli berjudul "Query latihan tidak pernah menyentuh database produksi". Isinya tiga zona:
 
- Browser di HP: Halaman Next.js, Web Worker berisi mesin query (sql.js, PGlite, mingo, peniru Redis), dan service worker. Halaman memanggil Web Worker untuk Jalankan.
- Vercel: route handler tRPC, penilai jawaban yang berjalan di worker thread, Better Auth, dan Vercel Cron. Halaman memanggil tRPC lewat HTTPS. tRPC memanggil penilai untuk Cek jawaban dan memanggil PostgreSQL lewat Drizzle.
- Layanan luar: PostgreSQL (Neon atau Supabase), Google OAuth, layanan email, dan layanan Web Push. Better Auth memakai Google OAuth dan layanan email. Vercel Cron mengirim pengingat harian lewat layanan Web Push ke service worker.
Seluruh kode adalah satu proyek Next.js di repositori mgalihpp/casebase yang di-deploy ke Vercel. Mesin query yang sama jalan di browser untuk Jalankan dan di server untuk Cek jawaban, jadi hasil di layar dan hasil penilaian selalu sama.
 
| Komponen | Tempat | Tugas | Memenuhi |
| --- | --- | --- | --- |
| Halaman Next.js | Browser | Semua layar, navigasi bawah, bottom sheet | IF-UI-01 s.d. 10 |
| Web Worker | Browser | Menjalankan query tanpa membekukan halaman | FR-EDT-02, NFR-PRF-03 |
| Service worker | Browser | Cache halaman, mesin query, dan berkas untuk offline; menerima Web Push | FR-STA-04, IF-SW-04 |
| Route handler tRPC | Fungsi Vercel | Semua API aplikasi | IF-SW-05 |
| Penilai jawaban | Worker thread di fungsi Vercel | Menilai ulang jawaban dan menghitung XP. Berjalan di worker thread, bukan langsung di fungsi, supaya query tak berujung bisa dihentikan (batas 3 detik) | FR-MIS-02, keputusan D-07 |
| Better Auth | Fungsi Vercel | Daftar, masuk, Google OAuth, lupa kata sandi, hapus akun | FR-AUTH-01 s.d. 07 |
| Vercel Cron | Vercel | Reset liga tiap Senin dan kirim pengingat harian | FR-RNK-03, FR-ONB-05 |
| PostgreSQL | Neon atau Supabase | Data akun, progres, berkas, liga, kelas, konten kasus | 3.5 |
 
### 3.2 Alur pengguna
 
Diagram alur di dokumen asli berjudul "Jawaban salah diulang di akhir antrean sampai nyawa habis".
 
1. Sambutan. "Mulai jadi detektif" menuju Onboarding 7 langkah, lalu Daftar akun. "Aku sudah punya akun" menuju Masuk.
2. Daftar akun dan Masuk sama-sama menuju Jalur misi di tab Belajar.
3. Ketuk misi aktif menuju Kerjakan soal, lalu keputusan Benar?
4. Jika tidak benar: nyawa berkurang 1 dan soal masuk ke akhir antrean. Lalu keputusan Nyawa habis? Jika ya, Misi berhenti. Jika tidak, kembali ke Kerjakan soal.
5. Jika benar: keputusan Masih ada soal? Jika ya, kembali ke Kerjakan soal. Jika tidak, Misi selesai dan dapat XP, lalu kembali ke Jalur misi.
Pilihan onboarding disimpan di browser selama pengguna belum punya akun. Setelah daftar berhasil, klien memanggil `onboarding.complete` untuk menyimpannya ke server. Misi selesai dan misi berhenti sama-sama kembali ke jalur misi. Misi berhenti tidak menyimpan progres, dan nyawa yang hilang tidak kembali (FR-MIS-06, FR-MIS-07).
 
### 3.3 Alur Jalankan dan Cek jawaban
 
Diagram urutan di dokumen asli berjudul "Jalankan berhenti di browser, hanya Cek jawaban yang ke server". Pesertanya Halaman, Web Worker, tRPC, PostgreSQL, dan Penilai.
 
Jalankan:
1. Halaman ke Web Worker: run(data, query).
2. Web Worker ke Halaman: kolom dan baris.
Cek jawaban:
1. Halaman ke tRPC: mission.check(soal, query).
2. tRPC ke PostgreSQL: ambil kunci dan data.
3. tRPC ke Penilai: nilai jawaban. Penilai menjalankan 2 query dan membandingkan hasil.
4. Penilai ke tRPC: benar atau salah.
5. tRPC ke PostgreSQL: simpan jawaban dan nyawa.
6. tRPC ke Halaman: hasil, penjelasan, sisa nyawa.
Jalankan tidak memanggil server, jadi tetap jalan saat offline dan tidak menambah biaya. Cek jawaban selalu lewat server karena kunci jawaban hanya ada di PostgreSQL dan XP hanya boleh diberikan server. Saat offline, jawaban disimpan di IndexedDB dan dikirim lewat `mission.syncOffline` saat tersambung lagi (FR-STA-05).
 
### 3.4 Status misi
 
Diagram status di dokumen asli berjudul "Hanya semua soal benar yang memberi XP".
 
- Status node di jalur: Terkunci, lalu Sekarang setelah misi sebelumnya selesai, lalu Selesai setelah percobaan selesai. Node selesai bisa diulang dengan +5 XP.
- Status percobaan misi: Dimulai (mission.start), lalu Menjawab, lalu Dinilai (Cek jawaban). Dari Dinilai, soal berikutnya atau soal salah yang diulang kembali ke Menjawab. Semua soal benar menuju Selesai: XP, skor, dan lentera dicatat. Nyawa habis menuju Berhenti. Tombol keluar dari Menjawab menuju Keluar. Berhenti dan Keluar tidak menyimpan progres misi.
Status node disimpan per pengguna per kursus sebagai angka progres, yaitu jumlah node yang sudah selesai. Node dengan urutan kurang dari angka itu berstatus selesai, node berikutnya berstatus sekarang, sisanya terkunci (FR-LRN-04). Status percobaan disimpan di tabel `mission_attempt`. Percobaan yang tidak selesai dalam 24 jam ditandai keluar oleh server (usulan).
 
### 3.5 Data
 
ERD di dokumen asli berjudul "Setiap percobaan misi terhubung ke satu pengguna dan satu kasus" dan memuat 8 tabel inti:
 
| Tabel | Kolom utama | Relasi |
| --- | --- | --- |
| `user` | id PK, name, email; dikelola Better Auth | 1 : 1 ke `profile`; 1 : n ke `course_progress`, `mission_attempt`, `case_file` |
| `profile` | user_id PK dan FK, xp, hearts, hearts_updated_at, coins, lentera, target_harian | 1 : 1 ke `user` |
| `course_progress` | user_id dan course_id PK, node_selesai | n : 1 ke `user` dan `course` |
| `course` | id PK, nama, engine, maskot | 1 : n ke `course_progress` dan `case_content` |
| `case_content` | id PK, course_id, nomor, judul, body JSON | 1 : n ke `mission_attempt` dan `case_file` |
| `mission_attempt` | id PK, user_id, case_id, node_key, status, petunjuk, skor, xp | 1 : n ke `answer` |
| `answer` | id PK, attempt_id, soal_key, jawaban, benar | n : 1 ke `mission_attempt` |
| `case_file` | user_id dan case_id PK, disematkan, status, query_terakhir | n : 1 ke `user` dan `case_content` |
 
ERD hanya memuat tabel inti untuk belajar. Skema ditulis dengan Drizzle, dan setiap perubahan skema masuk lewat file migrasi. Tabel lain:
 
| Tabel | Kolom utama | Relasi | Memenuhi |
| --- | --- | --- | --- |
| `session`, `account`, `verification` | dibuat Better Auth | n : 1 ke `user` | FR-AUTH-01 s.d. 07 |
| `class` | id, kode, nama, dosen | 1 : n ke `class_member` | FR-PRF-03 |
| `class_member` | class_id, user_id | n : 1 ke `class` dan `user` | FR-PRF-03, FR-RNK-01 |
| `league_group` | id, jenjang, minggu_mulai | 1 : n ke `league_member` | FR-RNK-02, FR-RNK-03 |
| `league_member` | group_id, user_id, xp_minggu_ini | n : 1 ke `league_group` dan `user` | FR-RNK-02 |
| `badge` | id, nama, syarat | 1 : n ke `user_badge` | FR-GAM-05 |
| `user_badge` | user_id, badge_id, didapat_pada | n : 1 ke `badge` dan `user` | FR-GAM-05 |
| `push_subscription` | id, user_id, endpoint, kunci | n : 1 ke `user` | IF-SW-04 |
 
Indeks yang dibutuhkan sejak awal: `mission_attempt(user_id, finished_at)` untuk menit belajar harian dan lentera, `league_member(group_id, xp_minggu_ini)` untuk papan liga, dan `class.kode` unik untuk pencarian kode kelas. Hapus akun menghapus baris `user`, dan semua tabel lain ikut terhapus lewat `ON DELETE CASCADE` (CMP-01).
 
### 3.6 Antarmuka API
 
Semua API berjalan di satu route handler Next.js, `/api/trpc/[trpc]`. Klien memanggilnya dengan klien tRPC dan TanStack Query, jadi tipe masukan dan keluaran diperiksa saat kompilasi. Masukan divalidasi dengan Zod di server. Semua prosedur kecuali `class.lookup` butuh sesi login. Tombol Jalankan tidak memanggil API sama sekali karena query dijalankan di browser.
 
Login, daftar, Google OAuth, lupa kata sandi, keluar, dan hapus akun ditangani Better Auth di `/api/auth/*`, di luar tRPC.
 
| Prosedur | Jenis | Masukan | Keluaran | Memenuhi |
| --- | --- | --- | --- | --- |
| `profile.me` | query | tidak ada | nama, kelas, XP, lentera, nyawa, koin, liga, target harian | FR-PRF-01 |
| `profile.update` | mutation | target harian, jam pengingat | profil baru | FR-ONB-03, FR-ONB-05 |
| `profile.savePush` | mutation | langganan Web Push dari browser | ok | IF-SW-04 |
| `profile.delete` | mutation | konfirmasi | ok, akun dan data terhapus | CMP-01 |
| `onboarding.complete` | mutation | kursus, tingkat, alasan, target, kode kelas opsional, pengingat opsional | progres awal | FR-ONB-01 s.d. 05 |
| `course.list` | query | tidak ada | 5 kursus dan progres masing-masing | FR-LRN-01, FR-LRN-02 |
| `course.path` | query | id kursus | kasus, 6 node, status tiap node | FR-LRN-03, FR-LRN-04, FR-LRN-06 |
| `mission.start` | mutation | id node | id percobaan, daftar soal tanpa kunci jawaban, data contoh | FR-MIS-01, FR-LRN-05 |
| `mission.check` | mutation | id percobaan, id soal, jawaban | benar atau salah, penjelasan, sisa nyawa | FR-MIS-02 s.d. 04, FR-MIS-07 |
| `mission.hint` | mutation | id percobaan, id soal | teks petunjuk berikutnya, sisa koin | FR-EDT-06 s.d. 08 |
| `mission.finish` | mutation | id percobaan | XP, akurasi, waktu, skor, lencana baru | FR-MIS-05, FR-GAM-01 |
| `mission.quit` | mutation | id percobaan | ok | FR-MIS-06 |
| `mission.syncOffline` | mutation | daftar percobaan offline, masing-masing dengan kunci idempoten | hasil per percobaan | FR-STA-05, NFR-REL-02 |
| `caseFile.list` | query | status, kursus, kata cari | daftar berkas | FR-BRK-01 s.d. 03 |
| `caseFile.get` | query | id berkas | cerita, bukti, tersangka, query terakhir | FR-BRK-05 |
| `caseFile.update` | mutation | id berkas, sematkan atau status | berkas baru | FR-BRK-04 |
| `caseFile.delete` | mutation | id berkas | ok | FR-BRK-04 |
| `caseFile.restore` | mutation | id berkas | berkas | FR-BRK-04, untuk Urungkan |
| `league.board` | query | liga atau kelas | peringkat, posisi sendiri, batas zona | FR-RNK-01 s.d. 04 |
| `class.lookup` | query | kode kelas | nama kelas, dosen, jumlah mahasiswa, tugas aktif | FR-PRF-03, FR-PRF-04 |
| `class.join` | mutation | kode kelas | keanggotaan | FR-PRF-03 |
 
Galat API memakai kode tRPC standar. Klien memetakan `UNAUTHORIZED` ke halaman masuk, `TOO_MANY_REQUESTS` ke toast, dan galat 5xx ke keadaan galat dengan kode galat (FR-STA-03).
 
### 3.7 Algoritma
 
Semua hitungan yang memengaruhi XP, nyawa, koin, dan peringkat dijalankan di server. Browser hanya menampilkan hasilnya.
 
#### 3.7.1 Penilaian jawaban
 
| Jenis soal | Cara menilai |
| --- | --- |
| Pilih jawaban | Bandingkan id opsi yang dipilih dengan kunci |
| Susun query | Gabungkan urutan ubin dengan spasi, lalu bandingkan dengan urutan kunci |
| Tulis query, membaca data | Jalankan query pengguna dan query kunci di data contoh yang baru dibuat. Bandingkan hasilnya, bukan teks query |
| Tulis query, mengubah data | Jalankan query pengguna, lalu jalankan query pemeriksa milik soal, misalnya `SELECT * FROM arsip`. Bandingkan hasil pemeriksa dengan hasil yang diharapkan |
 
Setiap soal tulis query punya field tambahan:
 
- `wajib`: daftar perintah atau kata kunci yang harus muncul di query pengguna, misalnya `BEGIN` dan `COMMIT` untuk soal transaksi. Jika tidak ada, jawaban dianggap salah dengan petunjuk yang sesuai.
- `aturanKolom`: `tepat` atau `minimal`. Pencocokan nama kolom tidak memperhatikan huruf besar dan urutan kolom, jadi `Jumlah, id` sama dengan `id, jumlah`.
- `pemeriksa`: query tambahan untuk soal yang mengubah data. Tidak dipakai untuk soal yang hanya membaca.
Perintah `WITH` dinilai menurut perintah utamanya (SELECT, UPDATE, dan seterusnya), bukan menurut kata `WITH` di depannya.
 
Perbandingan hasil untuk soal tulis query:
 
1. Tolak query yang memakai perintah di luar daftar `boleh` milik soal (FR-EDT-04).
2. Periksa `wajib`. Jika ada yang tidak muncul, anggap salah dengan petunjuk.
3. Jalankan query pengguna. Jika galat, kirim pesan galat yang sudah diterjemahkan (FR-EDT-03) dan anggap salah.
4. Samakan bentuk nilai: angka sebagai angka, teks dipangkas, `NULL` sebagai null.
5. Cocokkan kolom sesuai `aturanKolom`, dengan aturan huruf besar dan urutan di atas.
6. Cocokkan baris. Urutan baris dinilai dari ORDER BY di query kunci atau pemeriksa. Jika tidak ada ORDER BY, baris dibandingkan sebagai himpunan.
7. Untuk MongoDB, bandingkan dokumen hasil tanpa field `_id`. Untuk Redis, jalankan perintah pemeriksa (misalnya GET dan TTL) dengan jam yang dibekukan, lalu bandingkan nilai kunci dan sisa TTL yang diminta soal.
#### 3.7.2 Skor, akurasi, dan XP
 
- Skor misi = 100 dikurangi 10 untuk tiap petunjuk yang dibuka, paling rendah 0 (FR-EDT-07).
- Akurasi = jawaban benar dibagi semua jawaban yang dikirim, termasuk soal yang diulang.
- XP diberikan sekali per id percobaan saat `mission.finish`: 10 untuk node yang belum pernah selesai, 5 untuk ulangan (FR-GAM-01).
#### 3.7.3 Nyawa
 
Server menyimpan `hearts` dan `hearts_updated_at`. Nyawa sekarang dihitung saat dibaca: `min(5, hearts + floor((sekarang - hearts_updated_at) / 4 jam))`. Saat jawaban salah, server menghitung nilai sekarang, mengurangi 1, lalu menyimpan nilai dan waktu baru. Cara ini tidak butuh cron (FR-GAM-02).
 
#### 3.7.4 Lentera dan target harian
 
Tanggal dihitung di zona waktu pengguna, bawaan Asia/Jakarta. Saat misi selesai:
 
- Jika misi terakhir selesai hari ini, lentera tetap.
- Jika misi terakhir selesai kemarin, lentera bertambah 1.
- Selain itu, lentera kembali ke 1.
Menit belajar per hari dijumlah dari durasi percobaan misi hari itu (FR-GAM-03, FR-GAM-04).
 
#### 3.7.5 Liga mingguan
 
Vercel Cron menjalankan `/api/cron/league` tiap Senin pukul 00.00 WIB. Job ini menutup grup minggu lalu, memindahkan peserta zona naik ke jenjang atas dan zona turun ke jenjang bawah, lalu membagi pengguna aktif ke grup baru berisi sekitar 30 orang. Jumlah orang di zona naik dan turun belum ditentukan (FR-RNK-03).
 
### 3.8 Sandbox query
 
MVP tidak memakai server database latihan. Setiap kursus memakai mesin yang jalan di JavaScript atau WebAssembly, dengan kode yang sama di browser dan di fungsi Vercel. Database produksi tidak pernah menerima query pengguna (NFR-SEC-04).
 
| Kursus | Mesin query | Di browser | Di server |
| --- | --- | --- | --- |
| SQL Dasar | sql.js | Ya, untuk Jalankan | Ya, untuk Cek jawaban |
| SQLite | sql.js | Ya | Ya |
| PostgreSQL | PGlite | Ya, dimuat saat kursus dibuka | Ya |
| MongoDB | mingo dengan data JSON | Ya | Ya |
| Redis | Peniru buatan sendiri untuk SET, GET, EXPIRE, INCR, atau `ioredis-mock` (usulan) | Ya | Ya |
 
Semua mesin dibungkus antarmuka yang sama, `QueryEngine.run(seed, query) -> {kolom, baris, galat}`. Jika nanti perlu engine asli, layanan runner terpisah cukup memenuhi antarmuka ini, dan frontend tidak berubah.
 
Batas yang wajib ada:
 
- Query di browser berjalan di Web Worker. Query di server berjalan di worker thread Node.
- Worker dimatikan jika query berjalan lebih dari 3 detik. Waktu muat mesin tidak termasuk batas ini. Worker dipanaskan dulu, lalu batas 3 detik hanya berlaku untuk query.
- Hasil dipotong di 200 baris.
- Isolasi data per percobaan:
  - sql.js dan mingo membuat salinan baru dari data contoh kasus per Jalankan dan Cek. Biayanya murah, jadi DELETE atau DROP pengguna tidak terbawa ke percobaan berikutnya.
  - PGlite memakai satu database templat per seed, bukan database baru per query. initdb PGlite butuh sekitar 2,2 dtk di server dan sekitar 6 dtk di HP, terlalu mahal jika dilakukan per query. Tiap query dibungkus `BEGIN ... ROLLBACK`. BEGIN, COMMIT, dan ROLLBACK milik pengguna diubah menjadi SAVEPOINT di dalam transaksi bungkus, sehingga transaksi pengguna tidak mengakhiri transaksi bungkus. Soal transaksi turun dari sekitar 800 ms menjadi 1 sampai 5 ms.
- `mission.check` dibatasi 20 panggilan per menit per pengguna (usulan).
Server memakai snapshot klaster kosong yang dibuat saat build (sekitar 4,2 MB). Membukanya sekitar 0,5 dtk, dibanding initdb 2,2 dtk. Seed tetap dijalankan saat runtime, sehingga konten kasus dari database (D-08) tetap bisa dipakai. Setiap instance server memakai satu worker hangat. Dengan concurrency Fluid Compute, Cek antre di worker yang sama; pertimbangkan pool kecil jika p95 naik saat beban tinggi.
 
Pemuatan mesin:
 
- sql.js dimuat bersama halaman misi.
- PGlite berukuran 5,6 MB terkompresi gzip (pglite.wasm 3,3 MB, pglite.data 2,0 MB, initdb.wasm 0,13 MB, JS 0,13 MB). Berkas mesin disimpan dalam bentuk .gz dan dibuka dengan DecompressionStream, sehingga ukuran unduhan tidak bergantung pada kompresi hosting. Tanpa itu, `next start` mengirim pglite.data 6,0 MB mentah dan unduhan di 4G lambat menjadi sekitar 50 dtk.
- Strategi muat PGlite di klien: unduhan dimulai saat kartu kursus PostgreSQL dibuka, sebelum misi dimulai, dengan bilah progres. Klaster yang sudah di-initdb disimpan di IndexedDB (`idb://`), sehingga initdb hanya terjadi sekali per perangkat. Selama PGlite belum siap, tombol Jalankan bisa memakai `/api/poc/check` versi tanpa penilaian sebagai cadangan (butuh koneksi).
- Hasil POC di emulasi (bukan HP asli): unduh PGlite dengan 4G cepat dan CPU 4x sekitar 12 dtk secara total, dan sekitar 44 dtk dengan 4G lambat dan CPU 6x. Angka HP asli belum ada.
## 4. Keputusan desain
 
| ID | Keputusan | Alasan | Alternatif yang ditolak | Status |
| --- | --- | --- | --- | --- |
| D-01 | Website mobile-first dengan Next.js dan PWA | Satu kode untuk HP dan desktop, bisa dipasang ke layar utama, tanpa App Store | Aplikasi iOS native, dibatalkan 27 Nov | Disepakati |
| D-02 | tRPC lewat route handler Next.js | Tipe API sama di klien dan server, tidak perlu server API terpisah | REST manual, layanan backend terpisah | Disepakati |
| D-03 | PostgreSQL terkelola, misalnya Neon atau Supabase | Relasional cocok untuk progres dan liga; layanan terkelola jalan bersama Vercel | MongoDB untuk data aplikasi | Disepakati, penyedia belum dipilih |
| D-04 | Hosting di Vercel, termasuk Vercel Cron | Deploy otomatis dari GitHub dan preview per branch | VPS sendiri | Disepakati |
| D-05 | Mesin query di JavaScript dan WebAssembly, tanpa server sandbox | Gratis, offline jalan, tidak ada database latihan yang bisa dibobol. Lulus POC: semua target browser dan server tercapai, kecuali muat PGlite pertama di HP (sekitar 12 dtk, emulasi) | Runner Docker di Railway, Fly.io, atau VPS | Disepakati, lulus POC. Final setelah ukur HP Android asli dan `/api/poc/check` di Vercel |
| D-06 | SQL Dasar memakai sql.js, bukan MySQL asli | Materi Kasus 01 sama sintaksnya di SQLite dan MySQL. Didukung hasil POC | Container MySQL | Disepakati, didukung POC |
| D-07 | Server menilai ulang setiap jawaban | XP dan peringkat tidak bisa dicurangi dari browser | Penilaian hanya di browser | Usulan |
| D-08 | Konten kasus disimpan sebagai JSON di tabel `case_content` | Kasus baru ditambah tanpa deploy ulang (DC-MNT-01) | Konten ditulis di kode | Usulan |
| D-09 | Better Auth untuk Google OAuth dan email | Pustaka TypeScript dengan adapter Drizzle; sesi tersimpan di PostgreSQL dan cookie HttpOnly; lupa kata sandi dan hapus akun sudah tersedia | Auth.js, Clerk, Supabase Auth | Disepakati |
| D-10 | Drizzle ORM untuk akses database | Skema bertipe TypeScript dan migrasi SQL yang terbaca | Prisma | Disepakati |
| D-11 | Produk gratis selama MVP | Nyawa dan koin hanya mekanik game, tanpa pembayaran | Freemium atau langganan | Disepakati |
| D-12 | PGlite memakai templat database per seed dengan `BEGIN ... ROLLBACK` dan SAVEPOINT, bukan database baru per query | initdb per query terlalu mahal (2,2 dtk server, sekitar 6 dtk HP); templat menurunkan soal transaksi ke 1 sampai 5 ms | Database baru per query (sekitar 800 ms untuk soal transaksi) | Usulan, hasil POC |
 
## 5. Lampiran
 
### 5.1 Format konten kasus
 
Satu kasus disimpan sebagai satu dokumen JSON di `case_content.body`. Contoh di bawah memakai Kasus 01 SQL Dasar dari prototipe dan hanya menampilkan satu soal tulis query. Nama field `boleh` dan `aturanKolom` dipakai agar seragam dengan istilah di 3.7.1 (sebelumnya `allowed` dan `columns`).
 
```json
{
  "course": "sql",
  "number": "01",
  "title": "Pencurian di Gudang",
  "story": "Brankas gudang PT Sinar Logam dibobol tengah malam, 14 Maret.",
  "seed": "CREATE TABLE transaksi (id INTEGER, rekening TEXT, jumlah INTEGER, waktu TEXT); INSERT INTO transaksi VALUES (1,'GDG-01',2500000,'13/03 21:10'), ...;",
  "nodes": [
    {"key": "n1", "type": "mission", "title": "Lihat semua bukti", "topic": "SELECT dan FROM"},
    {"key": "n4", "type": "chest", "coins": 5},
    {"key": "n6", "type": "boss", "title": "Interogasi"}
  ],
  "questions": [
    {
      "node": "n3",
      "type": "write",
      "prompt": "Tampilkan 3 transaksi dengan jumlah terbesar",
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
    }
  ]
}
```
 
Kunci jawaban, `answer`, tidak pernah dikirim ke browser. `mission.start` membuang field `answer` sebelum mengirim soal. Field `pemeriksa` diisi hanya untuk soal yang mengubah data, misalnya `"SELECT * FROM arsip"`.
 
### 5.2 Pertanyaan terbuka
 
- [ ] Penyedia PostgreSQL: Neon atau Supabase.
- [ ] Apakah PGlite cukup cepat di HP Android kelas menengah? Query cukup cepat (milidetik), tetapi muat pertama sekitar 12 dtk di 4G (emulasi). Ditutup setelah ada angka HP Android asli.
- [ ] Batas memori untuk WASM: query seperti `SELECT repeat('x', 500000000)` belum diuji dan bisa menghabiskan memori fungsi Vercel. Perlu uji sebelum D-05 final.
- [ ] Mulai dingin fungsi Vercel dan p95 `/api/poc/check` di Vercel. Hasil lokal sudah lulus, Vercel belum diukur.
- [ ] Berapa koin untuk satu petunjuk, dan apakah petunjuk tetap bisa dibuka saat koin habis?
- [ ] Jumlah peserta zona naik dan zona turun liga, dan nama semua jenjang liga.
- [ ] Apakah jawaban salah ikut mengurangi skor misi, selain petunjuk?
- [ ] Batas `mission.check` per menit: 20 masih usulan.
