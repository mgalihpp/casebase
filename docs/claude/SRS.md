# Software Requirements Specification: SQL Quest (CaseBase)
 
Salinan teks dari dokumen asli, 27 Nov 2026. Dokumen asli yang hidup dan bisa diedit: https://claude.ai/artifact/6xAscwB6aqS2RdhEsom21s. Jika berbeda, dokumen asli yang berlaku.
 
SRS ini menetapkan apa yang harus dilakukan SQL Quest versi MVP 1.0. SQL Quest dibangun sebagai website mobile-first (PWA), bukan aplikasi iOS. Isinya diturunkan dari prototipe web 27 Nov 2026 dan catatan desain proyek. Strukturnya mengikuti template MSRS jam01 (IEEE 830, ISO/IEC/IEEE 29148).
 
## Riwayat revisi
 
| Versi | Tanggal | Oleh | Perubahan |
| --- | --- | --- | --- |
| 0.2 | 27 Nov 2026 | Stunob | Platform diganti dari aplikasi iOS ke website mobile-first (Next.js, PWA); masuk dengan Apple dihapus; kebutuhan khas iOS diganti padanan web |
| 0.1 | 27 Nov 2026 | Stunob | Draf awal dari prototipe iOS dan catatan desain |
 
## 1. Pendahuluan
 
### 1.1 Tujuan dokumen
 
Dokumen ini menjadi acuan bersama untuk membangun, menguji, dan menilai SQL Quest. Pembacanya adalah pengembang, desainer, penguji, dan dosen pembimbing. Dokumen ini hanya mengatur apa yang harus ada, bukan bagaimana membuatnya.
 
### 1.2 Lingkup produk
 
SQL Quest (nama kerja CaseBase) adalah website mobile-first untuk belajar database dengan gaya Duolingo. Website bisa dipasang di layar utama sebagai PWA. Pengguna memecahkan kasus misteri detektif sambil menulis query. Lima menit sehari sudah cukup untuk satu misi.
 
- Termasuk: 5 kursus database, jalur misi per kasus, 3 jenis soal (pilihan ganda, susun query, tulis query), editor SQL dengan panel skema, petunjuk bertingkat, gamifikasi (XP, nyawa, lentera beruntun, koin, liga, lencana), berkas kasus, kelas dari dosen, akun.
- Tidak termasuk: bahasa pemrograman umum (diputuskan hanya database), aplikasi native iOS dan Android, fitur dosen untuk membuat kelas dan tugas (hanya bergabung lewat kode), pembayaran.
### 1.3 Istilah dan singkatan
 
| Istilah | Arti |
| --- | --- |
| Berkas kasus | Catatan satu kasus: cerita, bukti, tersangka, dan query yang sudah ditulis pengguna |
| Interogasi | Misi gabungan di akhir kasus (boss) |
| Kasus | Satu unit cerita berisi 6 node misi |
| Koin petunjuk | Mata uang untuk membuka petunjuk di misi sulit |
| Kotak bukti | Node hadiah di jalur misi (chest) |
| Kursus | Satu engine database: SQL Dasar (MySQL), PostgreSQL, MongoDB, Redis, SQLite |
| Lentera | Penanda hari beruntun (streak) |
| Liga | Papan peringkat mingguan berjenjang (misalnya Perunggu, Safir) |
| Maskot | Karakter pemandu per kursus: Dibi, Pogi, Doku, Kubo, Pena |
| Misi | Satu pelajaran di jalur, berisi beberapa soal |
| MVP | Minimum Viable Product, rilis pertama |
| Nyawa | Kesempatan salah; maksimal 5, bertambah 1 tiap 4 jam |
| XP | Poin pengalaman dari misi yang selesai |
 
### 1.4 Referensi
 
- Prototipe web mobile-first SQL Quest: https://claude.ai/artifact/RNzGfjJkgo1FQuF98VFHm4 (normatif untuk alur dan teks layar)
- Design system v3, dokumen proyek `sql-quest-design-system-v3.html` (normatif untuk warna, tipografi, komponen)
- Catatan riset dan keputusan desain web mobile-first, dokumen proyek `desain-web-mobile-catatan.md`, 27 Nov 2026 (normatif untuk keputusan platform)
- Apple Human Interface Guidelines (informatif, ukuran sentuh dan alternatif gesture)
- Template MSRS: https://github.com/jam01/SRS-Template (informatif, struktur dokumen)
### 1.5 Konvensi dokumen
 
Tiap kebutuhan punya ID unik: `FR-` untuk fungsional, `NFR-` untuk kualitas, `IF-` untuk antarmuka, `DC-` untuk batasan desain. Kata harus berarti wajib di MVP. Kata sebaiknya berarti diinginkan tetapi boleh ditunda. Prioritas ditulis P1 (wajib MVP), P2 (diinginkan), P3 (nanti).
 
## 2. Gambaran produk
 
### 2.1 Perspektif produk
 
SQL Quest adalah produk baru yang berdiri sendiri. Frontend web dibangun dengan Next.js dan berbicara dengan backend untuk akun, progres, papan peringkat, dan kelas. Website bisa dipasang ke layar utama sebagai PWA. Query pengguna dinilai di lingkungan latihan yang terisolasi, bukan di database produksi.
 
### 2.2 Fungsi utama
 
1. Sambutan, onboarding 7 langkah, daftar, dan masuk
2. Jalur misi per kursus dengan kasus, node, kotak bukti, dan interogasi
3. Misi berisi soal pilihan ganda, susun query, dan tulis query
4. Editor query dengan panel skema, jalankan, cek jawaban, dan petunjuk bertingkat
5. Gamifikasi: XP, nyawa, lentera, koin petunjuk, target harian, lencana
6. Berkas kasus: daftar, cari, filter, sematkan, arsip, hapus dengan urungkan
7. Peringkat liga mingguan dan peringkat kelas
8. Profil: statistik, lencana, aktivitas mingguan, target harian, keluar
9. Gabung kelas dosen dengan kode kelas
10. Keadaan memuat, kosong, galat, dan offline di setiap tab
### 2.3 Batasan produk
 
- MVP berupa website mobile-first. Lebar acuan 390 px, tetap rapi di 360 dan 430 px, dan tetap bisa dipakai di tablet dan desktop.
- Frontend memakai Next.js.
- Bahasa antarmuka hanya Bahasa Indonesia.
- Tampilan wajib mengikuti design system v3. Konvensi khas iOS (large title, swipe back dari tepi, font SF Pro) tidak dipakai.
- Lingkup materi hanya database (5 engine), tidak ada bahasa pemrograman.
### 2.4 Karakteristik pengguna
 
| Kelas pengguna | Ciri | Frekuensi | Hak akses |
| --- | --- | --- | --- |
| Mahasiswa | Kuliah Basis Data, sering belajar di HP sela kuliah, butuh latihan sesuai materi | Harian, 5 sampai 20 menit | Semua fitur belajar, gabung kelas |
| Pencari kerja | Persiapan kerja di bidang data, ingin kasus mirip pekerjaan nyata | Beberapa kali seminggu | Semua fitur belajar |
| Pelajar santai | Penasaran, tanpa target | Tidak tentu | Semua fitur belajar |
| Dosen atau asisten | Membagikan kode kelas, memantau peringkat kelas | Mingguan | Di MVP hanya ditandai saat onboarding; pembuatan kelas di luar lingkup |
 
Semua pengguna diasumsikan memakai smartphone (Android atau iPhone) dengan browser modern dan bisa membaca Bahasa Indonesia. Kemampuan awal SQL berkisar dari nol sampai paham JOIN.
 
### 2.5 Asumsi dan ketergantungan
 
- Masuk dengan Google tersedia lewat OAuth Google. Masuk dengan email tetap tersedia sebagai cadangan.
- Konten kasus (cerita, soal, data contoh) ditulis tim sendiri sebelum rilis.
- Lingkungan penilaian query butuh server untuk PostgreSQL, MongoDB, dan Redis. SQL Dasar dan SQLite sebaiknya bisa dinilai di browser (misalnya SQLite WebAssembly) agar misi tetap jalan saat offline. Catatan: SDD v0.1 memutuskan semua mesin jalan di JavaScript atau WebAssembly, lihat SDD bagian 3.8.
- Pengingat harian memakai Web Push. Di iPhone, Web Push hanya jalan jika website sudah dipasang ke layar utama (iOS 16.4 atau lebih baru).
### 2.6 Pembagian kebutuhan per rilis
 
| Rilis | Isi |
| --- | --- |
| MVP 1.0 | Semua FR berprioritas P1: akun, onboarding, jalur dan misi, editor, gamifikasi inti, berkas, peringkat, profil, gabung kelas, PWA dasar |
| 1.1 | FR P2: tes penempatan, lencana lengkap, mode offline penuh untuk misi |
| Nanti | Dasbor dosen, aplikasi native, fitur berbayar |
 
## 3. Kebutuhan
 
### 3.1 Antarmuka eksternal
 
#### 3.1.1 Antarmuka pengguna
 
| ID | Kebutuhan | Prioritas |
| --- | --- | --- |
| IF-UI-01 | Navigasi utama harus memakai navigasi bawah berisi 4 item: Belajar, Berkas, Peringkat, Profil. | P1 |
| IF-UI-02 | Warna harus mengikuti design system v3: indigo #4F46E5 untuk aksi, teal-biru #0E7490 untuk benar, rose #E11D48 untuk salah, amber hanya untuk hadiah, warna brand per kursus, dan editor bertema terang. | P1 |
| IF-UI-03 | Font harus Nunito Sans untuk teks dan navigasi, Nunito untuk judul besar dan angka, serta JetBrains Mono untuk kode. Semua dimuat dari Google Fonts. | P1 |
| IF-UI-04 | Layout harus memakai app bar 56 px di atas dan navigasi bawah 60 px ditambah `safe-area-inset-bottom`. Header kasus di jalur misi harus sticky. | P1 |
| IF-UI-05 | Filter, pilihan kursus, petunjuk, skema, dan aksi tambahan harus tampil sebagai bottom sheet. | P1 |
| IF-UI-06 | Aksi utama setiap layar harus berada di zona jempol (bagian bawah layar). | P1 |
| IF-UI-07 | Kembali harus lewat tombol panah di app bar dan tombol back browser; swipe dari tepi kiri tidak dipakai karena milik browser. Gesture lain harus punya alternatif tombol: swipe turun sheet ke tombol ✕ atau ketuk latar; swipe baris ke tombol ⋯; pull to refresh ke tombol ⟳; tekan lama ke tombol ⋯. | P1 |
| IF-UI-08 | Setiap kursus harus punya maskot orisinal dengan 8 ekspresi: diam, menyapa, berpikir, benar, salah, kaget, tidur, merayakan. | P1 |
| IF-UI-09 | Konten sekunder (cerita kasus, aktivitas mingguan, target harian) harus disembunyikan di balik accordion atau layar detail. | P2 |
| IF-UI-10 | Profil harus menampilkan ajakan "Pasang di layar utama" untuk memasang website sebagai PWA. | P1 |
 
| Maskot | Kursus | Karakter |
| --- | --- | --- |
| Dibi | SQL Dasar (MySQL) | Lumba-lumba detektif bertopi |
| Pogi | PostgreSQL | Gajah arsiparis berkacamata dengan kaca pembesar |
| Doku | MongoDB | Peri daun pembawa kartu dokumen { } |
| Kubo | Redis | Kubus kilat dengan kubus mini dan kunci |
| Pena | SQLite | Burung mungil pemegang pena bulu |
 
#### 3.1.2 Antarmuka perangkat keras
 
| ID | Kebutuhan | Prioritas |
| --- | --- | --- |
| IF-HW-01 | Website sebaiknya memberi getaran singkat lewat Vibration API saat jawaban dicek dan maskot disapa, di perangkat yang mendukung. | P2 |
| IF-HW-02 | Website harus mendukung layar sentuh 360 sampai 430 px dalam orientasi potret, dan tetap bisa dipakai dengan mouse dan keyboard di desktop. | P1 |
 
#### 3.1.3 Antarmuka perangkat lunak
 
| ID | Sistem luar | Kegunaan | Prioritas |
| --- | --- | --- | --- |
| IF-SW-01 | Browser: Chrome Android, Safari iOS, Chrome dan Edge desktop, dua versi terakhir | Menjalankan website | P1 |
| IF-SW-02 | Google OAuth | Daftar dan masuk | P1 |
| IF-SW-03 | Layanan email transaksional | Tautan atur ulang kata sandi | P1 |
| IF-SW-04 | Web Push API dan service worker | Pengingat harian pukul 07.00, 12.30, atau 19.00, serta cache untuk offline | P1 |
| IF-SW-05 | API backend SQL Quest (HTTPS, JSON) | Akun, progres, berkas, peringkat, kelas, penilaian query | P1 |
| IF-SW-06 | Sandbox engine database (MySQL, PostgreSQL, MongoDB, Redis, SQLite) | Menjalankan query latihan di data contoh per kasus | P1 |
| IF-SW-07 | Google Fonts | Nunito Sans, Nunito, JetBrains Mono | P1 |
 
### 3.2 Kebutuhan fungsional
 
Kebutuhan dikelompokkan per fitur. Kriteria penerimaan mengikuti perilaku di prototipe web mobile-first.
 
#### 3.2.1 Akun dan autentikasi
 
| ID | Kebutuhan | Kriteria penerimaan | Prioritas |
| --- | --- | --- | --- |
| FR-AUTH-01 | Layar sambutan harus menampilkan 5 maskot yang bisa disapa, tombol "Mulai jadi detektif", dan "Aku sudah punya akun". | Ketuk maskot memunculkan tip kursusnya selama sekitar 2,4 detik | P1 |
| FR-AUTH-02 | Pengguna harus bisa daftar dengan Google atau email (nama, email, kata sandi). | Akun dibuat lalu muncul pesan "Akun dibuat. Selamat datang, {nama}!" | P1 |
| FR-AUTH-03 | Sistem harus memvalidasi nama terisi, format email benar, dan panjang minimal kata sandi, dengan pesan galat per kolom. | Email salah format memunculkan contoh nama@kampus.ac.id | P1 |
| FR-AUTH-04 | Pengguna harus bisa masuk dengan email dan kata sandi, atau dengan Google. | Kredensial salah memunculkan "Email atau kata sandi salah. Coba lagi, atau atur ulang kata sandi." | P1 |
| FR-AUTH-05 | Pengguna harus bisa meminta tautan atur ulang kata sandi lewat email. | Email terdaftar menerima tautan | P1 |
| FR-AUTH-06 | Pengguna harus bisa menunda pembuatan akun ("Nanti saja") dan tetap mencoba misi pertama. | Progres tamu dipindahkan ke akun saat mendaftar | P2 |
| FR-AUTH-07 | Pengguna harus bisa keluar dari akun setelah konfirmasi. | Kembali ke layar sambutan; progres tetap tersimpan di server | P1 |
 
#### 3.2.2 Onboarding
 
| ID | Kebutuhan | Kriteria penerimaan | Prioritas |
| --- | --- | --- | --- |
| FR-ONB-01 | Onboarding harus berisi 7 langkah: pilih kursus, tingkat kemampuan, alasan belajar, target harian, kode kelas, pengingat, berkas kasus pertama. | Tombol Lanjut nonaktif sampai pilihan wajib terisi | P1 |
| FR-ONB-02 | Tingkat kemampuan harus punya 3 opsi per kursus (misalnya SQL Dasar: baru dengar, pernah pakai SELECT, sudah paham JOIN). | Pilihan menentukan titik mulai jalur | P1 |
| FR-ONB-03 | Target harian harus bisa dipilih 5, 10, 15, atau 20 menit dan diubah lagi dari Profil. | Nilai tersimpan dan tampil di Profil | P1 |
| FR-ONB-04 | Langkah kode kelas dan pengingat harus bisa dilewati. | "Lewati, aku belajar sendiri" dan "Nanti saja" melanjutkan tanpa galat | P1 |
| FR-ONB-05 | Pengingat harian harus bisa dipilih pagi 07.00, siang 12.30, atau malam 19.00. | Muncul konfirmasi waktu pengingat | P1 |
| FR-ONB-06 | Tombol panah kembali atau tombol back browser harus mundur satu langkah tanpa menghapus pilihan sebelumnya. | Pilihan langkah sebelumnya masih terpilih | P1 |
 
#### 3.2.3 Jalur belajar dan kursus
 
| ID | Kebutuhan | Kriteria penerimaan | Prioritas |
| --- | --- | --- | --- |
| FR-LRN-01 | Sistem harus menyediakan 5 kursus: SQL Dasar, PostgreSQL, MongoDB, Redis, SQLite. | Kelima kursus tampil di sheet pilih kursus | P1 |
| FR-LRN-02 | Progres tiap kursus harus disimpan terpisah, sehingga pengguna bisa pindah kursus kapan saja. | Pindah kursus lalu kembali memulihkan posisi terakhir | P1 |
| FR-LRN-03 | Tiap kasus harus berisi 6 node: 3 misi, 1 kotak bukti, 1 misi, 1 interogasi. | Kasus 01 setiap kursus memenuhi pola ini | P1 |
| FR-LRN-04 | Node harus punya status selesai, sekarang, atau terkunci; node terkunci tidak bisa dimulai. | Ketuk node terkunci tidak membuka misi | P1 |
| FR-LRN-05 | Node yang sudah selesai harus bisa diulang dengan hadiah XP lebih kecil (5 XP, bukan 10 XP). | Ulangan menambah 5 XP | P1 |
| FR-LRN-06 | Header jalur harus menampilkan nama kasus, jumlah misi selesai, materi kasus, dan cerita kasus dalam accordion. | Cerita bisa dibuka dan ditutup | P1 |
| FR-LRN-07 | Maskot di jalur harus bisa disapa dan memberi tip bergilir sesuai kursus. | Tiap ketukan menampilkan tip berikutnya | P2 |
| FR-LRN-08 | Membuka kotak bukti harus memberi hadiah koin petunjuk. | Saldo koin bertambah | P2 |
 
#### 3.2.4 Misi dan soal
 
| ID | Kebutuhan | Kriteria penerimaan | Prioritas |
| --- | --- | --- | --- |
| FR-MIS-01 | Misi harus mendukung 3 jenis soal: pilih jawaban, susun query dari ubin, dan tulis query. | Ketiganya bisa dijawab dan dinilai | P1 |
| FR-MIS-02 | Setelah dicek, sistem harus menampilkan umpan balik benar atau salah beserta penjelasan dan jawaban yang benar. | Umpan balik muncul di panel bawah dengan tombol Lanjut | P1 |
| FR-MIS-03 | Soal yang dijawab salah harus diulang di akhir antrean misi. | Misi baru selesai setelah semua soal benar | P1 |
| FR-MIS-04 | Jawaban salah harus mengurangi 1 nyawa, dengan animasi guncang dan maskot berekspresi salah. | Nyawa berkurang 1 | P1 |
| FR-MIS-05 | Layar misi selesai harus menampilkan XP, akurasi (%), waktu, skor dari 100, dan jumlah petunjuk dipakai. | Angka sesuai jalannya misi | P1 |
| FR-MIS-06 | Pengguna harus bisa keluar dari misi setelah konfirmasi bahwa jawaban tidak disimpan dan nyawa yang hilang tidak kembali. | Keluar tanpa menyimpan progres misi | P1 |
| FR-MIS-07 | Bila nyawa habis di tengah misi, sistem harus menghentikan misi dan menampilkan waktu nyawa berikutnya. | Misi tidak bisa dilanjutkan dengan 0 nyawa | P1 |
 
#### 3.2.5 Editor query, skema, dan petunjuk
 
| ID | Kebutuhan | Kriteria penerimaan | Prioritas |
| --- | --- | --- | --- |
| FR-EDT-01 | Editor harus menampilkan nomor baris dan pewarnaan sintaks (kata kunci, string, angka, komentar). | Kata kunci SQL tampil indigo tebal | P1 |
| FR-EDT-02 | Tombol Jalankan harus mengeksekusi query di data contoh kasus dan menampilkan tabel hasil serta jumlah baris. | Query valid menampilkan hasil | P1 |
| FR-EDT-03 | Query yang tidak valid harus menghasilkan pesan galat yang menjelaskan cara memperbaikinya dalam Bahasa Indonesia. | Contoh: "LIMIT ditulis paling akhir, setelah ORDER BY." | P1 |
| FR-EDT-04 | Di misi membaca bukti, sistem harus menolak perintah selain SELECT. | Muncul "Query harus diawali SELECT" | P1 |
| FR-EDT-05 | Panel skema harus menampilkan tabel dan kolom yang boleh dipakai di soal. | Sheet skema bisa dibuka dari misi | P1 |
| FR-EDT-06 | Petunjuk harus tersedia dalam 3 tingkat yang dibuka berurutan, makin jelas di tiap tingkat. | Tingkat 3 berupa kerangka query dengan bagian kosong | P1 |
| FR-EDT-07 | Tiap petunjuk yang dibuka harus mengurangi skor misi 10 poin. | Skor akhir = 100 dikurangi 10 per petunjuk, sebelum potongan lain | P1 |
| FR-EDT-08 | Membuka petunjuk sebaiknya memakai koin petunjuk saat koin tersedia. | Saldo koin berkurang | P2 |
 
#### 3.2.6 Gamifikasi
 
| ID | Kebutuhan | Kriteria penerimaan | Prioritas |
| --- | --- | --- | --- |
| FR-GAM-01 | Misi baru harus memberi 10 XP; misi ulangan 5 XP; XP berhitung naik di layar selesai. | Total XP bertambah sesuai | P1 |
| FR-GAM-02 | Nyawa harus berjumlah maksimal 5 dan bertambah 1 tiap 4 jam. | Sheet nyawa menampilkan sisa dan aturannya | P1 |
| FR-GAM-03 | Lentera beruntun harus bertambah tiap hari pengguna menyelesaikan minimal satu misi, dan padam jika satu hari terlewat. | Sheet lentera menampilkan 7 hari terakhir | P1 |
| FR-GAM-04 | Target harian harus dilacak dalam menit belajar per hari. | Profil menampilkan menit hari ini dibanding target | P1 |
| FR-GAM-05 | Sistem harus memberi lencana saat syaratnya terpenuhi dan menampilkan progres lencana yang belum didapat. | 6 lencana awal: Detektif Pemula, Tanpa Petunjuk, Query Kilat, Ahli JOIN, Lentera 30, Lima Kursus | P2 |
 
#### 3.2.7 Berkas kasus
 
| ID | Kebutuhan | Kriteria penerimaan | Prioritas |
| --- | --- | --- | --- |
| FR-BRK-01 | Tab Berkas harus menampilkan daftar berkas kasus dengan kursus, judul, progres misi, status, dan waktu diperbarui. | Berkas yang disematkan tampil paling atas | P1 |
| FR-BRK-02 | Pengguna harus bisa mencari berkas berdasarkan judul. | Tanpa hasil memunculkan "Tidak ada berkas" | P1 |
| FR-BRK-03 | Pengguna harus bisa memfilter berkas menurut status (semua, aktif, selesai, arsip) dan kursus. | Tombol Tampilkan menunjukkan jumlah hasil; Atur ulang menghapus filter | P1 |
| FR-BRK-04 | Pengguna harus bisa menyematkan, mengarsipkan, mengembalikan, dan menghapus berkas lewat swipe, tekan lama, atau tombol ⋯. | Arsip dan hapus menampilkan toast dengan Urungkan selama sekitar 3 detik | P1 |
| FR-BRK-05 | Detail berkas harus menampilkan cerita, bukti, tersangka, query terakhir beserta artinya dalam bahasa sehari-hari, dan tombol lanjut kasus. | Semua bagian terisi atau menampilkan teks kosong yang sesuai | P1 |
| FR-BRK-06 | Pull to refresh harus memperbarui daftar berkas. | Muncul toast "Berkas diperbarui" | P1 |
 
#### 3.2.8 Peringkat
 
| ID | Kebutuhan | Kriteria penerimaan | Prioritas |
| --- | --- | --- | --- |
| FR-RNK-01 | Tab Peringkat harus punya dua papan: Liga (mingguan) dan Kelas. | Segmen bisa dipindah | P1 |
| FR-RNK-02 | Papan liga harus berisi sekitar 30 peserta, mengurutkan XP minggu ini, dan menandai zona naik dan zona turun liga. | Baris pengguna sendiri disorot | P1 |
| FR-RNK-03 | Liga harus direset tiap minggu, dan pengguna naik atau turun jenjang sesuai zonanya. | Jenjang berubah setelah reset | P1 |
| FR-RNK-04 | Pengguna baru harus melihat keadaan kosong "Liga belum dimulai buatmu" sampai menyelesaikan misi pertama minggu itu. | Teks dan tombol Mulai misi tampil | P1 |
 
#### 3.2.9 Profil dan kelas
 
| ID | Kebutuhan | Kriteria penerimaan | Prioritas |
| --- | --- | --- | --- |
| FR-PRF-01 | Profil harus menampilkan nama, kelas, tanggal bergabung, hari beruntun, total XP, liga sekarang, dan kasus selesai. | Angka sama dengan data di tab lain | P1 |
| FR-PRF-02 | Profil harus menampilkan lencana, aktivitas 7 hari, dan target harian dalam accordion. | Bagian bisa dibuka dan ditutup | P1 |
| FR-PRF-03 | Pengguna harus bisa bergabung ke kelas dengan kode kelas saat onboarding atau dari Profil. | Kode valid menampilkan nama kelas, dosen, jumlah mahasiswa, tugas aktif | P1 |
| FR-PRF-04 | Kode kelas yang tidak ditemukan harus memunculkan pesan untuk mengecek ke dosen atau asisten. | Pengguna tetap bisa melewati langkah | P1 |
 
#### 3.2.10 Keadaan sistem
 
| ID | Kebutuhan | Kriteria penerimaan | Prioritas |
| --- | --- | --- | --- |
| FR-STA-01 | Setiap tab harus punya keadaan memuat berupa skeleton. | Skeleton tampil sampai data datang | P1 |
| FR-STA-02 | Setiap tab harus punya keadaan kosong dengan maskot, judul, penjelasan, dan satu tombol aksi. | Contoh Berkas: "Mejamu masih kosong" | P1 |
| FR-STA-03 | Galat server harus menampilkan maskot kaget, pesan bahwa progres aman, kode galat, dan tombol Coba lagi. | Contoh: "Kode galat 503" | P1 |
| FR-STA-04 | Saat offline, tab Belajar dan Berkas harus menampilkan banner offline dan data tersimpan; Peringkat harus menampilkan keadaan butuh internet. | Maskot tidur tampil di keadaan offline | P1 |
| FR-STA-05 | Jawaban misi yang dikerjakan offline harus dikirim otomatis saat tersambung lagi. | Progres tersinkron tanpa duplikasi XP | P2 |
 
### 3.3 Kualitas layanan
 
Angka target di bawah ini usulan awal untuk MVP. Angka ini perlu disepakati tim sebelum pengujian.
 
| ID | Kategori | Kebutuhan | Prioritas |
| --- | --- | --- | --- |
| NFR-PRF-01 | Performa | Largest Contentful Paint halaman Belajar harus di bawah 2,5 detik di ponsel Android kelas menengah dengan koneksi 4G. | P1 |
| NFR-PRF-02 | Performa | Hasil Jalankan dan Cek jawaban harus muncul dalam 1,5 detik pada persentil ke-95 dengan koneksi 4G. | P1 |
| NFR-PRF-03 | Performa | Animasi dan gesture harus berjalan 60 fps tanpa patah yang terlihat. | P1 |
| NFR-SEC-01 | Keamanan | Semua komunikasi dengan backend harus memakai HTTPS (TLS 1.2 atau lebih baru). | P1 |
| NFR-SEC-02 | Keamanan | Kata sandi harus disimpan sebagai hash bcrypt atau argon2, tidak pernah dalam bentuk teks. | P1 |
| NFR-SEC-03 | Keamanan | Token sesi harus disimpan di cookie HttpOnly, Secure, dan SameSite, tidak di localStorage. | P1 |
| NFR-SEC-04 | Keamanan | Query pengguna harus dijalankan di sandbox terisolasi per sesi, dengan batas waktu 3 detik dan batas jumlah baris, tanpa akses jaringan atau data pengguna lain. | P1 |
| NFR-SEC-05 | Keamanan | Data pribadi (nama, email) hanya boleh dipakai untuk akun, peringkat, dan kelas. Peringkat hanya menampilkan nama dan XP. | P1 |
| NFR-REL-01 | Keandalan | Progres misi yang sudah selesai tidak boleh hilang walau tab browser ditutup, halaman dimuat ulang, atau koneksi putus. | P1 |
| NFR-REL-02 | Keandalan | Sinkronisasi ulang harus idempoten: misi yang terkirim dua kali hanya menambah XP sekali. | P1 |
| NFR-AVA-01 | Ketersediaan | Backend sebaiknya tersedia 99,5% per bulan, di luar jendela perawatan yang diumumkan. | P2 |
| NFR-OBS-01 | Observability | Sistem harus mencatat galat JavaScript di browser dan galat API, tanpa menyimpan isi kata sandi atau token. | P1 |
| NFR-OBS-02 | Observability | Sistem sebaiknya mencatat event analitik: onboarding selesai, misi mulai, misi selesai, petunjuk dibuka, nyawa habis. | P2 |
| NFR-USA-01 | Usability | Target sentuh minimal 44 × 44 px. | P1 |
| NFR-USA-02 | Aksesibilitas | Semua kontrol harus punya label aksesibel (HTML semantik atau ARIA) yang terbaca TalkBack dan VoiceOver, bisa dipakai dengan keyboard, dan maskot dekoratif disembunyikan dari pembaca layar. | P1 |
| NFR-USA-03 | Aksesibilitas | Teks harus tetap terbaca tanpa terpotong saat zoom browser 200% atau ukuran font sistem diperbesar. | P2 |
| NFR-USA-04 | Aksesibilitas | Kontras teks harus memenuhi WCAG 2.1 AA (4,5:1). Benar dan salah tidak boleh dibedakan dengan warna saja. | P1 |
| NFR-USA-05 | Aksesibilitas | Saat prefers-reduced-motion aktif, animasi maskot, konfeti, dan guncang harus diganti transisi sederhana. | P1 |
| NFR-USA-06 | Usability | Pengguna baru harus bisa menyelesaikan onboarding dan misi pertama dalam 5 menit. | P1 |
 
### 3.4 Kepatuhan
 
| ID | Kebutuhan | Acuan | Prioritas |
| --- | --- | --- | --- |
| CMP-01 | Data pribadi pengguna harus diproses dengan persetujuan, dan pengguna harus bisa menghapus akunnya dari halaman Profil. | UU No. 27 Tahun 2022 tentang Pelindungan Data Pribadi | P1 |
| CMP-02 | Website hanya boleh memakai cookie yang diperlukan untuk sesi dan preferensi. Cookie analitik pihak ketiga butuh persetujuan pengguna. | UU No. 27 Tahun 2022 | P1 |
| CMP-03 | Ketentuan Layanan dan Kebijakan Privasi harus bisa dibuka dari halaman daftar sebelum akun dibuat. | Teks persetujuan di halaman daftar | P1 |
| CMP-04 | Maskot harus berupa karakter orisinal, bukan salinan logo resmi MySQL, PostgreSQL, MongoDB, Redis, atau SQLite. Nama engine hanya dipakai sebagai nama materi. | Kebijakan merek dagang masing-masing proyek | P1 |
| CMP-05 | Font harus dipakai sesuai lisensinya. | SIL Open Font License (Google Fonts) | P1 |
 
### 3.5 Desain dan implementasi
 
| ID | Kebutuhan | Prioritas |
| --- | --- | --- |
| DC-INS-01 | Website harus dibangun dengan Next.js, diakses lewat HTTPS, dan bisa dipasang sebagai PWA (manifest, ikon, service worker). | P1 |
| DC-BLD-01 | Kode disimpan di repositori GitHub mgalihpp/casebase, dengan build, lint, dan uji otomatis tiap pull request serta preview deployment per branch. | P1 |
| DC-MNT-01 | Konten kasus (cerita, soal, data contoh, petunjuk) harus disimpan sebagai data terpisah dari kode, sehingga kasus baru bisa ditambah tanpa deploy ulang. | P1 |
| DC-MNT-02 | Komponen UI harus memakai token dari design system v3 (CSS variables), bukan nilai warna atau ukuran yang ditulis langsung. | P1 |
| DC-REU-01 | Komponen maskot (5 karakter × 8 ekspresi) harus menjadi satu komponen yang dipakai ulang di semua halaman. | P1 |
| DC-POR-01 | Logika penilaian query sebaiknya dipisah dari UI agar bisa dipakai aplikasi native nanti. | P2 |
| DC-CST-01 | Biaya server sandbox sebaiknya ditekan dengan menilai SQL Dasar dan SQLite di browser bila memungkinkan. | P2 |
| DC-DL-01 | Tenggat rilis MVP belum ditentukan (lihat pertanyaan terbuka). | — |
| DC-CHG-01 | Perubahan kebutuhan dicatat di tabel riwayat revisi dokumen ini dengan nomor versi baru. | P1 |
 
## 4. Verifikasi
 
Setiap kebutuhan P1 harus lolos verifikasi sebelum MVP dirilis. Metode: Uji (tes otomatis atau manual), Demo (diperagakan di perangkat), Inspeksi (pemeriksaan desain atau kode), Analisis (pengukuran).
 
| Kebutuhan | Metode | Bukti yang diharapkan | Status |
| --- | --- | --- | --- |
| FR-AUTH-01 s.d. 07 | Uji UI, uji API | Skenario daftar, masuk, lupa sandi, keluar lolos | Belum diuji |
| FR-ONB-01 s.d. 06 | Demo, uji UI | Rekaman 7 langkah onboarding termasuk lewati dan kembali | Belum diuji |
| FR-LRN-01 s.d. 08 | Uji UI | Status node dan progres per kursus benar setelah pindah kursus | Belum diuji |
| FR-MIS-01 s.d. 07 | Uji unit, uji UI | Antrean soal salah, pengurangan nyawa, skor akhir | Belum diuji |
| FR-EDT-01 s.d. 08 | Uji unit penilai query | Kumpulan query benar dan salah per kursus dengan pesan galat yang diharapkan | Belum diuji |
| FR-GAM-01 s.d. 05 | Uji unit | XP, isi ulang nyawa 4 jam, lentera lintas hari | Belum diuji |
| FR-BRK-01 s.d. 06 | Uji UI | Cari, filter, sematkan, arsip, hapus, urungkan | Belum diuji |
| FR-RNK-01 s.d. 04 | Uji API | Reset mingguan dan perpindahan zona liga | Belum diuji |
| FR-PRF-01 s.d. 04 | Uji UI, uji API | Statistik konsisten; kode kelas valid dan tidak valid | Belum diuji |
| FR-STA-01 s.d. 05 | Demo | Tiap tab dalam keadaan memuat, kosong, galat, offline | Belum diuji |
| IF-UI-01 s.d. 10 | Inspeksi | Tinjauan desain terhadap design system v3 di 360, 390, 430 px dan desktop | Belum diuji |
| NFR-PRF-01 s.d. 03 | Analisis | Laporan Lighthouse dan Web Vitals di ponsel Android kelas menengah | Belum diuji |
| NFR-SEC-01 s.d. 05 | Inspeksi, uji penetrasi ringan | Upaya keluar dari sandbox query gagal | Belum diuji |
| NFR-REL-01 s.d. 02 | Uji | Tutup tab, muat ulang, dan putus koneksi saat misi selesai | Belum diuji |
| NFR-USA-01 s.d. 06 | Inspeksi, uji pengguna | Audit axe atau Lighthouse Accessibility; 5 pengguna baru selesai misi pertama dalam 5 menit | Belum diuji |
| CMP-01 s.d. 05 | Inspeksi | Checklist UU PDP dan lisensi font | Belum diuji |
 
## 5. Lampiran
 
### 5.1 Kasus 01 per kursus
 
| Kursus | Kasus 01 | Materi | Kasus berikutnya |
| --- | --- | --- | --- |
| SQL Dasar | Pencurian di Gudang | SELECT, WHERE, ORDER BY, LIMIT | Transaksi Gelap |
| PostgreSQL | Arsip yang Berantakan | CREATE TABLE, PRIMARY KEY, FOREIGN KEY, BEGIN dan COMMIT | Indeks yang Hilang |
| MongoDB | Kesaksian Tercecer | Koleksi, find(), filter, sort() | Jejak Agregasi |
| Redis | Pesan yang Menghilang | SET, GET, EXPIRE, INCR | Antrean Kurir |
| SQLite | Penyelidikan Tanpa Sinyal | .open, CREATE TABLE, INSERT, SELECT | Catatan yang Salah Tulis |
 
### 5.2 Pertanyaan terbuka
 
- [ ] Stack sudah diputuskan 27 Nov: Next.js, tRPC lewat route handler, PostgreSQL, Drizzle, Better Auth, Vercel. Penyedia PostgreSQL belum dipilih. Rinciannya ada di SDD.
- [ ] Model bisnis sudah diputuskan 27 Nov: gratis selama MVP. Nyawa dan koin hanya mekanik game.
- [ ] Berapa koin yang dibutuhkan untuk satu petunjuk, dan berapa koin dari kotak bukti?
- [ ] Apakah petunjuk tetap bisa dibuka saat koin habis, dengan potongan skor saja?
- [ ] Tenggat rilis MVP dan rilis 1.1.
- [ ] Apakah tes penempatan untuk pengguna tingkat 3 masuk MVP atau 1.1?
- [ ] Jenjang liga lengkap (prototipe baru menyebut Perunggu dan Safir) dan aturan jumlah naik atau turun per minggu.
- [ ] Panjang minimal kata sandi dan aturan kerumitannya.
- [ ] Nama final produk: SQL Quest atau CaseBase.
