# RoutingLab — Interactive Network Learning Platform

Media pembelajaran interaktif routing statis dan troubleshooting untuk siswa X TJKT.
Frontend **HTML / CSS / JavaScript**, backend **Supabase Auth + PostgreSQL + RLS**, hosting yang direncanakan **Cloudflare Pages**.

## Fitur
- Satu login email/password melalui Supabase, dengan dua role `siswa` dan `guru`.
- Daftar siswa (verifikasi email), gabung kelas dengan kode, akun guru melalui admin SQL.
- Materi, visualisasi, Mini Lab, CLI Lab, troubleshooting, evaluasi formatif.
- Progres latihan disinkronkan per akun ke Supabase.
- Dashboard guru membaca ringkasan kelas miliknya menggunakan RPC terproteksi.
- Layout desktop dan mobile responsif; scroll hanya bila ada konten yang memerlukannya.

## Menjalankan lokal
1. Jalankan migrasi SQL Sprint 5 yang telah disediakan dan sudah berhasil diuji.
2. Tambahkan migrasi baru `supabase/migrations/20261027_sprint6.sql` lewat Supabase SQL Editor.
3. Salin `js/supabase-config.example.js` menjadi **`js/supabase-config.js`** dan isi `url` (tanpa `/rest/v1/`) serta **publishable key**. File lokal ini diabaikan oleh Git.
4. Buka `index.html` menggunakan Live Server (bukan `file://`).
5. Masuk menggunakan **email dan password Supabase**, bukan kredensial demo UTS.

**JANGAN** meletakkan `service_role`, `sb_secret_`, token privat, atau password database di frontend. Semua progres adalah **latihan formatif**; skor evaluasi lokal belum penilaian resmi yang diverifikasi di server.

Lihat [README_SPRINT6.md](README_SPRINT6.md) untuk urutan upgrade, pengujian role guru, backup, keamanan Git, dan deployment.
