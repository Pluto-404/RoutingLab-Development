# RoutingLab — Prototype UTS Teknologi Pembelajaran

Prototype front-end statis untuk media pembelajaran routing statis.

## Akun demo
- Siswa: `siswa01` / `123456`
- Guru/Admin: `guru01` / `123456`

## Fitur yang berfungsi
- Login demo berbasis JavaScript
- Dashboard siswa
- Materi routing statis
- Visualisasi alur paket
- Mini Lab static route
- Troubleshooting satu kasus
- Evaluasi 5 soal + skor
- Progress localStorage
- Dashboard Guru/Admin sederhana

## Penting
Prototype ini **bukan sistem autentikasi produksi**. Password ada di JavaScript dan data progress hanya tersimpan di browser melalui `localStorage`.

## Deploy ke GitHub Pages
1. Ekstrak ZIP.
2. Buat repository GitHub baru.
3. Upload **isi folder `RoutingLab_Prototype_GitHubPages`** ke root repository. Pastikan `index.html` berada di root repo.
4. Commit & push.
5. Buka `Settings` → `Pages`.
6. Pada `Build and deployment`, pilih `Deploy from a branch`.
7. Pilih branch `main` dan folder `/ (root)`, lalu Save.
8. Tunggu GitHub menampilkan URL publik.

Tidak perlu build command, Node.js, atau server.
