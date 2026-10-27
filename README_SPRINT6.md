# Sprint 6 — Unified Authentication + Responsive Refresh

Paket patch ini **tidak memuat folder induk**. Ekstrak ZIP **langsung** ke root `RoutingLab-Development` dan pilih replace. Semua perubahan berdasarkan ZIP pengguna `RoutingLab-Development - Copy.zip` (27 Oktober 2026). Cadangkan/commit kondisi sebelumnya sebelum ekstrak.

## Sebelum membuka website
1. Pastikan file lokal `js/supabase-config.js` **tetap ada** di komputermu setelah ekstrak. ZIP ini tidak menyertakan maupun menghapusnya. File contoh `js/supabase-config.example.js` tetap hanya placeholder.
2. Buka Supabase -> SQL Editor -> New Query dan jalankan **hanya** file `supabase/migrations/20261027_sprint6.sql`. Migrasi Sprint 5 tidak perlu diulang. Fungsi baru `teacher_dashboard()` membatasi hasil ke kelas guru yang sedang login.
3. Pastikan menu Authentication -> URL Configuration mengizinkan Live Server yang benar (`127.0.0.1:5500/**` atau port milikmu); email confirmations harus dilakukan di browser yang bisa membuka Live Server.
4. Buka `index.html` melalui **Live Server**, bukan `file://`. Library Supabase berasal dari CDN; internet diperlukan.

## Yang berubah
- `index.html` login **email/password Supabase** menggantikan akun demo JavaScript; sesi diverifikasi lagi pada setiap halaman terproteksi.
- Guru -> `dashboard-guru.html`, siswa -> `dashboard-siswa.html`. Navigasi salah role dialihkan.
- `akun.html` tetap tersedia untuk **registrasi siswa dan kelola kelas**, menggunakan sistem Auth yang sama; tidak ada lagi database akun demo terpisah.
- Persentase materi/visualisasi/mini lab/troubleshooting/evaluasi disimpan di `public.user_progress` per akun. CLI Lab menyimpan `cliLab=100` setelah misi berhasil; tidak ada klaim bahwa command history atau konfigurasi Cisco tersimpan permanen.
- Skor tertinggi kuis dan riwayat percobaan **masih lokal per perangkat**, bukan nilai ujian resmi di Supabase.
- Dashboard guru memakai RPC `teacher_dashboard()`; tidak menampilkan data dummy. Jika migrasi belum diterapkan, muncul pesan yang menjelaskan.
- Login (`index.html`) dan halaman akun (`akun.html`) dirancang memenuhi satu viewport pada desktop 1280×720, 1366×768, 1440×900; layar sempit atau konten panjang tetap boleh scroll.
- Halaman materi/dashboard/panel lab tetap menggulir secara normal karena banyak konten, tanpa scroll horizontal pada viewport mobile umum.

## Urutan pengujian yang disarankan
1. Gunakan siswa yang sudah kamu daftarkan dan sudah confirmed; login melalui `index.html` lalu pastikan masuk `dashboard-siswa.html`.
2. Buka Materi -> klik Tandai Selesai -> cek `user_progress` pada Supabase Table Editor. Pastikan baris `materi` menjadi `100`.
3. Buka CLI Lab -> selesaikan konfigurasi R1/R2 -> **Periksa Misi** -> cek `cliLab=100` di `user_progress`. Command history/konfigurasi router adalah sesi latihan sementara.
4. Logout, login sebagai akun guru. Pastikan menu dashboard siswa tidak dapat diakses oleh guru dan sebaliknya.
5. Pada dashboard guru, pastikan kelas dan siswa yang menjadi anggota muncul dengan progres. Jika muncul error fungsi tidak ditemukan, SQL Sprint 6 belum dijalankan.
6. Buka `akun.html`, guru dapat melihat kelas dan kode; siswa dapat menggunakan kode untuk bergabung.
7. Cek tampilan pada 1440×900, 1366×768, 1024×768, 390×844, dan 320×700. Form boleh scroll secara vertikal pada layar kecil, **tidak boleh overflow horizontal**.

## Git & keamanan
- Pastikan `.gitignore` tetap berisi `/js/supabase-config.js`, `.env`, dan pola private key.
- Sebelum push: `git check-ignore -v js/supabase-config.js`, `git diff --cached --name-only`, lalu `git grep --cached -n -i -E "sb_secret_|service_role|PRIVATE KEY|DATABASE_URL"`.
- Pencarian yang menemukan **kata** di komentar belum tentu menemukan kredensial sungguhan. Jangan unggah password database ataupun token privat.
- Cloudflare Pages: karena config lokal di-ignore, deployment **tidak otomatis memiliki** `supabase-config.js`. Perlu menghasilkan file konfigurasi publik khusus produksi saat build dari Cloudflare environment variables (hanya URL dan publishable key). Jangan pernah memasukkan secret key ke frontend.

## Batasan & kejujuran data
- Persentase progres disimpan dari browser sebagai **latihan formatif**. Saat ini belum ada sistem penilaian resmi di server, sehingga pengguna teknis masih bisa memanipulasi progres sendiri melalui browser; RLS membatasi supaya tidak bisa menulis milik siswa lain.
- Tidak ada data siswa atau nilai database asli di ZIP. Hasil end-to-end terhadap proyek Supabase milik pengguna harus diuji di komputernya. Pengujian otomatis kode lokal dan layout CSS tidak dapat membuktikan koneksi ke proyek Supabase itu.
