# Backlog dan sprint MVP 1.0 (draf, 27 Nov 2026)

Dokumen ini memecah semua FR P1 dari SRS v0.2 menjadi tugas. Urutannya mengikuti papan: akun, misi, gamifikasi, berkas, lalu PWA. Onboarding dan kelas masuk ke bagian akun. Peringkat dan profil masuk ke bagian berkas. FR P2 tidak masuk MVP.

Singkatan: SRS (Software Requirements Specification), SDD (Software Design Description), FR (kebutuhan fungsional), IF (antarmuka), NFR (kebutuhan kualitas), DC (batasan desain), CMP (kepatuhan).

Durasi sprint belum ditentukan karena tenggat MVP belum ada (DC-DL-01). Tim memakai urutan sprint di bawah, bukan lamanya sprint.

## 1. Akun, onboarding, dan kelas

| Tugas | FR / IF / NFR | Catatan |
| --- | --- | --- |
| Layar sambutan dengan 5 maskot | FR-AUTH-01 | Tip kursus 2,4 detik |
| Daftar dengan email dan Google | FR-AUTH-02, IF-SW-02 | Better Auth (D-09) |
| Validasi formulir daftar | FR-AUTH-03 | Pesan galat per kolom |
| Masuk dan galat kredensial | FR-AUTH-04 | |
| Atur ulang kata sandi lewat email | FR-AUTH-05, IF-SW-03 | Butuh layanan email |
| Keluar dengan konfirmasi | FR-AUTH-07 | |
| Hash kata sandi dan cookie sesi | NFR-SEC-02, NFR-SEC-03 | |
| Onboarding 7 langkah dan tombol Lanjut | FR-ONB-01, FR-ONB-02, FR-ONB-06 | Pilihan tiap langkah disimpan di browser sampai akun dibuat |
| Target harian dan pengingat | FR-ONB-03, FR-ONB-05 | Pengingat memakai Web Push, dikerjakan di tugas PWA |
| Lewati langkah kode kelas dan pengingat | FR-ONB-04 | |
| Gabung kelas dengan kode | FR-PRF-03, FR-PRF-04 | `class.lookup` dan `class.join` |
| Persetujuan data dan halaman hapus akun | CMP-01, CMP-03 | Hapus akun di Profil |

## 2. Misi: jalur, soal, editor, dan penilaian

| Tugas | FR / IF / NFR | Catatan |
| --- | --- | --- |
| Data kursus dan jalur 6 node | FR-LRN-01 sampai 04, FR-LRN-06 | `course.list` dan `course.path`; status node dari angka progres |
| Progres per kursus | FR-LRN-02 | Pindah kursus memulihkan posisi |
| Soal pilih jawaban dan susun query | FR-MIS-01 (sebagian) | |
| Soal tulis query dengan penilai | FR-MIS-01 (sebagian), FR-MIS-02 | Penilai di worker thread (SDD 3.1, 3.7.1) |
| Editor dengan sorot sintaks dan nomor baris | FR-EDT-01 | JetBrains Mono |
| Tombol Jalankan di Web Worker dengan batas 3 detik | FR-EDT-02, NFR-PRF-03, IF-SW-06 | Mesin sql.js dan PGlite (SDD 3.8) |
| Pesan galat dalam Bahasa Indonesia | FR-EDT-03 | Terjemahan dari teks sql.js dan SQLSTATE PGlite |
| Batasi perintah di misi membaca | FR-EDT-04 | |
| Panel skema | FR-EDT-05 | |
| Antrean soal salah dan pengurangan nyawa | FR-MIS-03, FR-MIS-04 | Nyawa disimpan dengan `hearts_updated_at` (SDD 3.7.3) |
| Layar selesai menampilkan XP, akurasi, waktu, dan skor | FR-MIS-05, FR-GAM-01 | Skor dihitung di server |
| Keluar dari misi dengan konfirmasi | FR-MIS-06 | |
| Nyawa habis menghentikan misi | FR-MIS-07, FR-GAM-02 | |
| Petunjuk tiga tingkat dengan potongan skor | FR-EDT-06, FR-EDT-07 | `mission.hint` |
| Node selesai bisa diulang (5 XP) | FR-LRN-05 | |
| Konten Kasus 01 masuk database | DC-MNT-01 | Setelah draf konten disetujui |
| Uji penilai query per kursus | FR-EDT-01 sampai 08 (verifikasi) | Lihat bagian 4 SRS |

## 3. Gamifikasi

| Tugas | FR / IF / NFR | Catatan |
| --- | --- | --- |
| XP dan akurasi | FR-GAM-01 | Sekali per id percobaan (SDD 3.7.2) |
| Nyawa bertambah 1 tiap 4 jam | FR-GAM-02 | Dihitung saat dibaca, tanpa cron (SDD 3.7.3) |
| Lentera beruntun | FR-GAM-03 | Zona waktu Asia/Jakarta |
| Target harian dan menit belajar | FR-GAM-04 | Dari durasi percobaan |

Lencana (FR-GAM-05) berstatus P2 dan tidak masuk MVP.

## 4. Berkas, peringkat, dan profil

| Tugas | FR / IF / NFR | Catatan |
| --- | --- | --- |
| Daftar berkas dengan sematkan dan filter | FR-BRK-01, FR-BRK-03 | `caseFile.list` |
| Cari berkas | FR-BRK-02 | |
| Sematkan, arsip, hapus, urungkan | FR-BRK-04 | `caseFile.update`, `delete`, `restore` |
| Detail berkas dengan cerita dan query terakhir | FR-BRK-05 | `caseFile.get` |
| Pull to refresh | FR-BRK-06 | |
| Papan liga dan zona naik turun | FR-RNK-01 sampai 02 | `league.board`, sekitar 30 peserta |
| Reset liga tiap Senin | FR-RNK-03 | Vercel Cron, jumlah zona belum ditentukan |
| Keadaan kosong liga | FR-RNK-04 | |
| Profil: statistik dan kelas | FR-PRF-01, FR-PRF-02 | Angka harus sama dengan tab lain |

## 5. PWA dan keadaan sistem

| Tugas | FR / IF / NFR | Catatan |
| --- | --- | --- |
| Manifest, ikon, dan service worker | DC-INS-01, IF-SW-01 | Dasar agar bisa dipasang |
| Ajakan "Pasang di layar utama" | IF-UI-10 | |
| Cache halaman, mesin query, dan berkas untuk offline | FR-STA-04, IF-SW-04 | Berkas PGlite disimpan .gz |
| Pengingat harian lewat Web Push | IF-SW-04, FR-ONB-05 | iOS perlu website dipasang dulu (SRS 2.5) |
| Keadaan memuat, kosong, galat, dan offline di setiap tab | FR-STA-01 sampai 03 | |
| Tampilan sesuai design system v3 | IF-UI-01 sampai 09, DC-MNT-02, DC-REU-01 | 5 maskot, masing-masing 8 ekspresi |
| Aksesibilitas dasar | NFR-USA-01, NFR-USA-02, NFR-USA-04, NFR-USA-05 | |
| Log galat dan event minimal | NFR-OBS-01 | |
| Halaman Ketentuan dan Kebijakan Privasi | CMP-02, CMP-03, CMP-04, CMP-05 | Cek merek dagang maskot dan lisensi font |

## 6. Urutan sprint (usulan)

1. **Sprint 1, akun dan onboarding.** Bagian 1 penuh.
2. **Sprint 2, jalur dan soal.** Bagian 2 sampai editor dan Jalankan.
3. **Sprint 3, penilaian dan gamifikasi.** Sisa bagian 2 (penilai, nyawa, petunjuk, layar selesai) dan bagian 3.
4. **Sprint 4, berkas, peringkat, dan profil.** Bagian 4.
5. **Sprint 5, PWA dan keadaan sistem.** Bagian 5, lalu verifikasi bagian 4 SRS.

## 7. Risiko

- SRS dan SDD belum sepakat soal mesin SQL Dasar, MySQL atau SQLite. Keputusan ini memengaruhi Kasus 01 dan penilai.
- Muat PGlite sekitar 12 detik di HP (emulasi). Strategi unduh saat kursus dibuka dan cache IndexedDB harus siap sebelum Sprint 2 selesai.
- Batas memori WASM di Vercel belum diuji.
- Jumlah zona naik dan turun liga, serta koin petunjuk, masih terbuka (SRS 5.2, SDD 5.2).
