# RoutingLab Sprint 8 — Mission Management dan Penugasan CLI Lab

Dibuat berdasarkan ZIP GitHub `RoutingLab-Development-main(1).zip` (29 Oktober 2026). Patch ini **hanya memuat file baru/berubah**, dengan path langsung dari root repository. **Tidak** berisi `.env`, `js/supabase-config.js`, kunci Supabase, file `.git`, atau pengaturan akun.

## Apa yang ditambahkan?

1. **Dashboard Guru:** form memilih kelas + misi, tombol Tugaskan Misi, nonaktifkan/aktifkan ulang tugas, jumlah siswa yang memulai/menyelesaikan, jumlah percobaan, serta riwayat percobaan. Filter *Monitoring Kelas* di bagian atas memengaruhi laporan misi juga. Form penugasan memiliki pilihan kelas sendiri.
2. **Dashboard Siswa:** menampilkan hanya misi aktif pada kelas yang diikuti siswa, dengan status *Belum dimulai / Perlu dilanjutkan / Selesai*, jumlah percobaan, dan tombol masuk langsung ke CLI Lab.
3. **CLI Lab:** membuka skenario otomatis sesuai misi kelas dari tautan `cli-lab.html?assignment=...`; penggantian skenario dikunci saat mengerjakan tugas; tombol **Periksa Misi** menyimpan hasil ke penugasan kelas yang sesuai. Misi Static Routing Dasar tetap memiliki petunjuk langkah; skenario troubleshooting menyembunyikan petunjuk solusi.
4. **Supabase:** katalog 4 misi tetap (`mission_catalog`), penugasan per kelas (`class_assignments`), dan percobaan per siswa (`mission_attempts`), diakses hanya lewat RPC yang memeriksa role/keanggotaan/pemilik kelas.

**Catatan penting:** hasil `passed/retry` berasal dari perhitungan simulator di browser, sehingga data ini **FORMATIF, BUKAN NILAI RESMI**. Guru tidak boleh memakai hitungan penyelesaian tersebut sebagai nilai ujian yang terverifikasi. Tidak menyimpan perintah CLI mentah atau kata sandi. Semua skenario menggunakan topologi R1/R2 yang sama, bukan emulator Cisco IOS asli.

## Instalasi — urut sesuai ini

1. Backup/commit perubahan lokal, lalu **ekstrak ZIP ini ke root** folder `RoutingLab-Development` (pilih Replace file yang berubah). Tidak ada folder pembungkus.
2. Masuk ke **Supabase → SQL Editor → New query**. Buka file `supabase/migrations/20261029_sprint8.sql`, salin **seluruh isinya**, lalu klik **Run**. Migrasi Sprint 5, 6, dan 7 harus sudah berjalan. Tidak perlu mengulang SQL lama. Hasil normal: `Success. No rows returned`.
3. Supabase → **Table Editor**, pastikan ada 3 tabel baru `mission_catalog` (4 baris), `class_assignments`, dan `mission_attempts`. Dua tabel terakhir **kosong** sebelum misi diberikan dan dikerjakan; itu normal. Jangan menonaktifkan RLS.
4. Pastikan file lokal `js/supabase-config.js` **tetap ada** (tidak ikut ZIP dan tidak perlu diubah). Jalankan melalui **Live Server**; hard refresh `Ctrl+Shift+R`.
5. Login **guru**, buka Dashboard Guru → bagian **Penugasan Misi** → pilih kelas yang sudah dibuat → pilih misalnya `Wrong Next Hop` → **Tugaskan Misi**. Penugasan aktif muncul di tabel.
6. Login **siswa yang sudah bergabung di kelas itu**, buka Dashboard Siswa → **Misi dari Guru** → **Mulai misi**. CLI Lab akan membuka gangguan yang ditugaskan. Perbaiki, lalu klik **Periksa Misi**. Status penyimpanan percobaan akan muncul di panel misi.
7. Kembali ke Dashboard Guru → klik **↻ Perbarui** di bagian Penugasan Misi; periksa kolom **Selesai, Memulai, Percobaan** dan tabel **Riwayat Pengerjaan Misi**.

## Uji tambahan yang penting

- **Tes misi baru:** `node tests/test-sprint8.cjs`.
- **Tes regresi semua:** PowerShell: `Get-ChildItem tests -File | ForEach-Object { node $_.FullName }`.
- Guru A **tidak boleh** melihat/mengubah tugas guru B. Siswa yang tidak bergabung ke suatu kelas **tidak boleh** dapat mengakses atau mencatat percobaan pada tugas kelas itu, meskipun memiliki tautan assignment ID.
- Menonaktifkan tugas menyembunyikannya dari dashboard siswa; tugas lama masih ada di laporan guru. Mengaktifkannya kembali mempertahankan riwayat.
- Buka CLI Lab **tanpa** parameter `assignment` → latihan mandiri dan progres lama harus tetap bisa digunakan; namun hasilnya **tidak** dicatat ke kelas tertentu.
- Setelah setiap penugasan baru, pastikan siswa sudah bergabung kelas melalui menu **Akun & Kelas**.
- Kode status berhasil tidak otomatis dinilai server; RPC mengecek siapa yang boleh menyimpan hasil, **bukan** membuktikan bahwa siswa benar-benar berhasil melakukan konfigurasi.

## Bila muncul error

- `Could not find function student_mission_board` atau `teacher_mission_report` → jalankan SQL **Sprint 8** di proyek Supabase yang sama dengan aplikasi.
- `permission denied` → pastikan migrasi tuntas dan login dengan role yang benar. **Jangan** matikan RLS/beri hak akses anonim.
- Tugas tidak muncul pada siswa → pastikan siswa sudah bergabung ke kelas **yang benar**, misi masih aktif, lalu refresh.
- Riwayat tidak muncul → klik Periksa Misi dan tunggu status "tersimpan". Cek jaringan/Supabase Console jika gagal.

## Pengiriman Git

```powershell
git status
git add .
git diff --cached --name-only
git diff --cached --check
git check-ignore -v js/supabase-config.js
git commit -m "feat: Sprint 8 classroom CLI mission assignments"
git push origin main
```

Pastikan `.env` dan `js/supabase-config.js` tidak ada di staged file. Tes otomatis hanya memeriksa kode lokal/mock; **pengujian end-to-end memakai dua akun dan Supabase nyata belum dilakukan di sini**, sehingga gunakan langkah tes guru/siswa setelah migrasi.
