# RoutingLab Sprint 5 — Integrasi Supabase Tahap 1 (aman dan terpisah)

## Yang sudah tersedia
- Halaman baru `akun.html`, tanpa merusak login demo versi UTS.
- Supabase Auth: registrasi siswa dan email/password login.
- RLS + SQL migration: profil, kelas, anggota kelas, dan progres latihan.
- Guru membuat kelas beserta kode acak; siswa dapat gabung memakai kode.
- Penyimpanan progres percobaan ke PostgreSQL (bukan nilai resmi).
- Desain responsif dan `.gitignore` yang mengecualikan file rahasia.

## Cara mengaktifkan
1. Buat proyek Free pada https://supabase.com/ dan buka **SQL Editor**.
2. Jalankan seluruh isi `supabase/migrations/20261026_sprint5.sql`.
3. Dari **Project Settings > API**, copy **Project URL** dan **publishable key** (`sb_publishable_...`) atau legacy **anon** public key.
4. Copy `js/supabase-config.example.js` menjadi `js/supabase-config.js`, lalu isi URL dan **publishable/anon** key. File ini boleh dilihat browser; JANGAN masukkan service_role, secret key, JWT signing secret atau database password.
5. Buka dengan VS Code Live Server; akses `akun.html`. Supabase Auth memerlukan domain HTTP(S), jangan `file://`.
6. Atur **Authentication > URL Configuration**: Site URL dan redirect URLs sesuai localhost Live Server dan domain Cloudflare Pages saat terpasang. Untuk pendaftaran dengan email confirmation, aktifkan pengiriman email sesuai kemampuan layanan.
7. Daftar siswa, konfirmasi email apabila diaktifkan, login, dan simpan progres uji.
8. Untuk akun guru: buat akun dari Supabase Auth > Users (atau signup biasa), lalu di SQL Editor cari UUID pada `auth.users`, lakukan `update public.profiles set role='guru' where id='UUID_GURU';` **hanya untuk UUID yang dipercaya**. Login kembali sebagai guru, lalu buat kelas dan bagikan kodenya.

## Penting: batasan Sprint 5
- Halaman lama menggunakan `RoutingAuth` demo / localStorage, sengaja **belum diganti** agar proyek tetap berfungsi. Portal Supabase tidak otomatis login ke dashboard lama.
- CLI Lab, kuis lama, dan progress lama belum disinkronkan. Form progres di portal adalah uji integrasi, bukan nilai resmi.
- Skor yang berasal dari browser belum boleh dijadikan nilai resmi karena bisa dimanipulasi siswa. Sprint lanjutan memerlukan validasi misi di server.
- Guru belum bisa melihat progres seluruh anggota kelas melalui RLS tahap pertama. Fitur monitoring akan ditambahkan dengan kebijakan akses kelas yang aman.
- Undangan guru otomatis dan manajemen akun guru akan ditambahkan setelah mekanisme admin utama selesai.
- `js/supabase-config.js` dimasukkan `.gitignore` demi konsistensi setup lokal. Di Cloudflare Pages, kelak buat file konfigurasi publik ketika deployment; hanya isi URL + publishable key, **tanpa rahasia**.
- Backend Supabase menggunakan kuota Free dan dapat dijeda apabila lama tidak aktif. Perlu pemantauan kuota dan backup data sendiri.

## Uji keamanan sebelum push
```
git status --short
git ls-files | findstr /i "env secret token pem key supabase-config"
git grep -n -i -E "service_role|sb_secret_|SUPABASE_SECRET_KEY|PRIVATE KEY"
```
Catatan: `.gitignore` hanya mencegah file baru ter-track. Jika file rahasia pernah ter-commit, cabut dari index, ROTATE key, dan tangani riwayat Git.

## Push
```
git add .
git status --short
git commit -m "feat: add Supabase auth and classroom integration portal"
git push origin main
```
