# RoutingLab Sprint 4A — Integrasi menu dan desain responsif

Paket ini memiliki isi pada akar ZIP. Ekstrak langsung di dalam `RoutingLab-Development`, konfirmasi *Replace*. Jangan ekstrak dengan pilihan yang menghasilkan folder pembungkus.

## Perubahan
- Menu CLI Lab di sidebar seluruh halaman siswa dan kartu pintasan dari Dashboard Siswa.
- Drawer navigasi HP/tablet, backdrop dan penutupan dengan Escape.
- Penyegaran warna, tipografi, kartu, tombol dan jarak; tata letak responsif.
- Layout CLI Lab untuk laptop, tablet, dan HP.
- `.gitignore` melindungi file `.env` untuk tahap Supabase.
- Logika CLI dan progres TIDAK diubah pada sprint ini.

## Uji manual
1. Login demo siswa `siswa01` / `123456`.
2. Buka menu CLI Lab dari dashboard/sidebar dan coba perintah R1/R2.
3. Ubah lebar browser ke 1440, 1024, 768, 390, dan 320 piksel.
4. Di layar <=1100px, tekan tombol `Menu RoutingLab` lalu tutup melalui backdrop dan tombol Escape.
5. Di CLI Lab pada HP, cek tab Topologi dan Terminal.
6. Uji menu halaman lain, tombol logout dan hasil kuis.

Jika tampilan lama masih ter-cache, tekan Ctrl+Shift+R. Lakukan commit Git sebelum mengganti file.

Catatan: prototipe masih memakai login demo dan localStorage; belum memakai Supabase.
