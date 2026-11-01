# RoutingLab Sprint 12 — Monitoring, UI/UX & Security Audit

Paket ini mengubah file aplikasi dan menambahkan SQL; **tidak menghapus data, akun, kelas, nilai, atau progres**.

## Instalasi lokal (WAJIB sebelum Git push)

1. Backup folder `RoutingLab-Development`. Ekstrak isi ZIP PATCH ke folder tersebut, pilih Replace.
2. Buka Supabase → SQL Editor → New Query, jalankan seluruh isi `supabase/migrations/20261101_sprint12.sql` (akun administrator). **Jangan jalankan ulang migrasi lama atau reset database**.
3. Jika berhasil, jalankan `supabase/SECURITY_CHECK_SPRINT12.sql` untuk membaca status RLS dan izin fungsi. Tidak mengubah data.
4. Jalankan Live Server; refresh paksa (`Ctrl + Shift + R`).
5. Tes dengan akun **guru**: dashboard kini menampilkan ringkasan evaluasi aktif per tugas/kelas (nilai rata-rata dari skor **terbaik per siswa dalam tiap penugasan**) dan rincian aktivitas yang bisa dibuka. Ganti filter kelas untuk memastikan data berubah sesuai kelas.
6. Tes dengan akun **siswa**: buka Visualisasi dan periksa hanya menu Visualisasi yang menyala, CLI Lab tidak ikut aktif. Cek tampilan CLI Lab desktop/HP; hanya aksen yang berganti biru, warna hijau/merah/oranye status koneksi tetap berbeda.
7. Tes keamanan menggunakan dua akun siswa dan dua akun guru berlainan kelas: siswa tidak dapat mengakses fitur guru, guru A tidak dapat membaca kelas guru B, data siswa A tidak dapat dibaca siswa B. Uji melalui akses normal maupun request REST menggunakan token akun masing-masing (jangan membagikan token).
8. Setelah seluruhnya normal, periksa `git diff --cached --check` dan file yang akan di-push; lanjut commit/push. Cloudflare Pages auto-deploy ke `routinglab.my.id`.

Tidak perlu mengubah dua environment variables Cloudflare. `scripts/build-pages.cjs` tetap menerima `sb_publishable_...` dan legacy anon JWT; **secret/service_role ditolak**, dan `_headers` dibawa ke output deploy.

## Ringkasan perubahan

- Sidebar: satu tautan `active` / `aria-current="page"` berdasarkan URL; **kotak indikator kecil dipertahankan**. CLI Lab tidak lagi disorot permanen.
- CLI Lab: header, tombol, panel, dan pilihan R1/R2 diseragamkan ke biru. Terminal tetap gelap; titik konektivitas tetap warna status.
- Guru: statistik evaluasi kelas aktif, total tugas-siswa sudah/belum mengerjakan, rata-rata nilai berdasarkan skor terbaik yang tersimpan di server; rincian per evaluasi dan per aktivitas dapat dibuka tanpa membuat halaman terlalu ramai.
- Siswa: teks berulang pada hero, dashboard dan kartu belajar dikurangi; skor kuis mandiri **lokal** dibedakan dari hasil evaluasi kelas yang dinilai server.
- Security: RLS dipastikan aktif, izin tabel sensitif diperketat, aturan pembaruan progres hanya untuk siswa sendiri, dan RPC guru terikat `auth.uid()` + kelas guru. Trigger helpers tidak dapat dipanggil sebagai fungsi publik.
- Cloudflare: validasi publishable/anon key pada build, `_headers` (nosniff, referrer, anti-frame, permissions) dan konfigurasi publik tidak di-cache.
- **Tetap dua CSS**: `css/style.css` dan `css/cli-lab.css`.

## Batas keamanan yang perlu dipahami

- **Publishable key** secara sengaja tersedia di browser; itu bukan kunci admin. Jangan pernah masukkan `service_role`, `sb_secret_...`, atau database password ke frontend maupun GitHub.
- `user_progress`, `practice_events`, dan penyelesaian misi CLI merupakan **aktivitas formatif yang dilaporkan browser**. Siswa bisa mencoba memodifikasi persentase miliknya sendiri melalui browser meskipun formulir uji progres telah dihapus. Data tersebut **bukan nilai ujian resmi**. Menolak manipulasi total memerlukan sistem penilaian server berdasarkan interaksi yang dapat diverifikasi, bukan hanya RLS.
- Nilai *evaluasi kelas* dihitung di fungsi database; siswa tidak dapat langsung mengubah tabel hasil, tetapi **latihan ini memungkinkan pengulangan dan memperlihatkan jawaban setelah dikumpulkan**. Jangan jadikan itu ujian berisiko tinggi tanpa aturan percobaan/soal yang lebih ketat.
- Audit ini bersumber dari **kode dan migrasi**, bukan pengujian langsung terhadap project Supabase/Cloudflare pengguna. Pastikan SQL migrasi benar-benar berhasil dan jalankan pengujian dua akun sebelum menganggap keamanan produksi terverifikasi.
- Jangan langsung push bila ada error SQL, autentikasi, laporan guru, atau tampilan yang tidak sesuai.

## Pemeriksaan teknis

```powershell
Get-ChildItem tests/*.cjs, tests/*.js | ForEach-Object { node $_.FullName }
node --check js/guru.js
node --check js/common.js
# Command build berjalan hanya bila variabel publik Supabase tersedia.
```

Pembaruan CSS dan JavaScript tidak memerlukan update tabel selain migrasi Sprint 12 yang disediakan. SQL Sprint 12 aman dijalankan kembali (menggunakan `CREATE OR REPLACE`/`DROP POLICY IF EXISTS`) dan tidak memuat operasi penghapusan data.
