# RoutingLab — Clean UI & Realistic CLI Topology

Patch ini menyederhanakan halaman login, merapikan panel CLI Lab, menampilkan perangkat jaringan dari aset PNG pengguna, dan menambahkan animasi aliran paket pada kabel SVG.

## Instalasi
1. Backup proyek lokal.
2. Ekstrak isi ZIP ke root RoutingLab-Development (Replace).
3. Jalankan via Live Server dengan konfigurasi Supabase lokal yang sudah ada.
4. Pastikan menu CLI Lab, memilih R1/R2, perintah, Reset, skenario, dan penilaian misi berfungsi.
5. Uji viewport desktop dan mobile. Di mobile, topologi dapat digeser horizontal agar urutan jaringan tetap terlihat.
6. Jika normal, git add -A, commit dan push. Cloudflare Pages akan deploy otomatis.

## Perilaku animasi
- Kabel merupakan SVG asli, disusun otomatis sesuai posisi perangkat.
- Ketika koneksi end-to-end berhasil, pulsa biru mengalir di seluruh kabel.
- Jika sambungan WAN gagal, kabel antar R1–R2 tampil putus-putus merah.
- Pengguna dengan `prefers-reduced-motion` tidak mendapatkan animasi berulang.

Tidak ada perubahan SQL, Supabase Auth, kebijakan RLS, atau CLI Engine. Tidak ada kredensial atau `supabase-config.js` di ZIP.
