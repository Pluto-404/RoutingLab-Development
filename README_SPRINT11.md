# RoutingLab Sprint 11 — Evaluasi Kelas + UI Cleanup

Patch ini disusun **berdasarkan ZIP `RoutingLab-Development-main (1)(1).zip`**, bukan template atau kode lama.

## Cara instal (wajib urut)

1. **Backup** folder proyek lokal sebelum mengganti file.
2. Ekstrak ZIP PATCH **langsung ke root** `RoutingLab-Development/`, tanpa folder pembungkus. Pilih **Replace** untuk file yang sama. File CSS tetap hanya `css/style.css` dan `css/cli-lab.css`.
3. Buka Supabase **SQL Editor → New query**. Salin dan jalankan **sekali** isi `supabase/migrations/20261031_sprint11.sql`. SQL memakai `CREATE TABLE IF NOT EXISTS` / `CREATE OR REPLACE FUNCTION`; tidak me-reset data yang ada.
4. Buka website lokal menggunakan Live Server, reload paksa (`Ctrl+Shift+R`). **Jangan push sebelum menguji**, karena setelah push Cloudflare Pages akan otomatis menerapkan frontend baru.
5. Login akun **guru** → Dashboard Guru → **Kelola Evaluasi**, atau buka `evaluasi-guru.html`. Buat evaluasi, tambahkan soal dengan 4 opsi dan kunci, tugaskan ke kelas. Guru bisa mengubah/menghapus **draft**; soal akan terkunci setelah pernah ditugaskan untuk menjaga konsistensi hasil.
6. Login akun **siswa** yang tergabung pada kelas → **Evaluasi** → **Evaluasi dari Guru** → **Kerjakan** → **Kumpulkan jawaban**. Lihat nilai dan pembahasan. Kembali ke akun guru → **Evaluasi Kelas** untuk memeriksa hasil. Coba nonaktifkan tugas untuk mengecek siswa tak bisa membuka tugas baru.
7. Uji halaman Materi, Mini Lab, Troubleshooting pada laptop dan HP. Contoh perintah terpisah per baris; perintah panjang digeser **di dalam kotak**, bukan memperlebar halaman. Topologi Materi mobile digeser horizontal untuk menjaga urutan koneksi.
8. Periksa Akun & Kelas: **form Uji progres latihan hilang**, tetapi gabung kelas dan progres yang sudah tersimpan tidak dihapus.
9. Setelah seluruh pengujian berhasil, gunakan Git `git status`, `git add -A`, `git diff --cached --check`, `git commit -m "feat: Sprint 11 class evaluations and UI cleanup"`, `git push origin main`. Cloudflare Pages otomatis rebuild.

## Hal yang berubah

- **Evaluasi guru**: halaman baru `evaluasi-guru.html` (dipisahkan dari dashboard supaya lebih ringkas); buat/edit/hapus draft evaluasi, CRUD soal A–D (kunci & pembahasan), penugasan kelas, nonaktif/aktif tugas, filter dan hasil siswa.
- **Evaluasi siswa**: bagian tugas kelas pada `evaluasi.html`, dengan kunci jawaban tidak dikirim sebelum siswa mengumpulkan jawaban; skor dihitung di fungsi SQL Supabase (tidak menerima skor dari browser). Latihan mandiri 5 soal lama tetap ada dan terpisah dari evaluasi yang dinilai server.
- **SQL**: tabel `evaluation_sets`, `evaluation_questions`, `evaluation_assignments`, `evaluation_attempts`, RLS, revoke akses langsung dari browser, RPC yang memeriksa guru pemilik kelas dan keanggotaan siswa.
- **Materi / Mini Lab / Troubleshooting**: perbaikan blok kode yang semula menyatu serta overflow mobile.
- **Topologi Materi mobile**: koneksi berurutan PC0–Switch0–R1–R2–Switch1–PC1; scroll horizontal, tidak memecah jalur menjadi grid terputus.
- **Akun & Kelas**: hapus UI input progres manual dan handler Javascript-nya. Progres yang sudah ada tidak diubah.
- **Penyederhanaan tampilan**: hapus beberapa label `Supabase Connected`, footer duplikat, bagian Arsitektur Pembelajaran yang repetitif; ringkasan dashboard guru menggantikan formulir evaluasi panjang; notifikasi sinkronisasi sukses tidak lagi menutupi tombol (error sinkronisasi tetap ditampilkan).

## Batas keamanan dan pengujian

- **Jangan** menjalankan SQL di frontend atau menggunakan service-role/secret key di browser. RPC hanya untuk sesi terautentikasi; key publik Supabase tetap memakai konfigurasi build Cloudflare yang ada.
- Penilaian **evaluasi yang ditugaskan guru** dihitung di server dan disimpan di `evaluation_attempts`. Data latihan lama di `user_progress` dan misi CLI masih **formatif/self-reported dari browser**, bukan nilai ujian anti-kecurangan. Menghilangkan form edit progres bukan pengganti validasi server untuk semua kegiatan.
- Hasil otomatis dan simulasi UI telah diuji **offline**. Integrasi dengan database Supabase pengguna **tidak dapat diuji dari sini**, sehingga setelah migrasi jalankan uji guru→siswa→guru dan periksa Postgres/RLS secara langsung sebelum push.
- Tidak ada `.env`, `js/supabase-config.js`, token, atau file rahasia dalam ZIP. Cloudflare Pages memakai `scripts/build-pages.cjs` yang sudah ada; tidak ada build config yang perlu diubah.
- Untuk memeriksa ulang tes: `node tests/test-sprint11.cjs` dan berkas tes Sprint 1–9.
