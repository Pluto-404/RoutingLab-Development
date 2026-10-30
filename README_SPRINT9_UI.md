# RoutingLab — Sprint 9 / UI Cleanup

## Perubahan
- Hanya **2 file CSS**: `css/style.css` untuk halaman umum/akun, dan `css/cli-lab.css` untuk simulator.
- Setiap halaman memanggil satu stylesheet. `data-rl-css` menjaga aturan asli dari halaman tersebut tetap aktif dan mencegah CSS akun bercampur dengan dashboard.
- Seluruh logo sidebar sudah menggunakan `assets/logoo.png` (simbol RL transparan dari gambar yang diberikan). Logo penuh ada di `assets/logo-full.png`.
- Terminal CLI pada desktop/tablet memiliki tinggi stabil; baris perintah yang banyak membuat bagian output di-scroll, bukan halaman.
- Panel **Contoh perintah & bantuan CLI** tidak mengubah tinggi terminal. Membuka **Panduan konfigurasi** atau **Tabel pengalamatan** mengaktifkan layout terminal fleksibel seperti sebelumnya.
- Perilaku terminal di HP tetap memakai tampilan responsif/tab.

## Pemasangan
1. Ekstrak ZIP patch di root `RoutingLab-Development/` (Replace).
2. **Hapus 13 CSS lama** yang sudah tidak digunakan (daftar ada di bawah). Jangan hanya menimpa file.
3. Buka lewat Live Server, hard refresh `Ctrl+Shift+R`.
4. Uji dashboard guru/siswa, akun, login, Evaluasi, dan CLI Lab di desktop serta HP.
5. Setelah lulus uji, `git add -A`, `git commit`, `git push`.

CSS lama yang harus dihapus: `bootstrap-blue.css`, `cli-polish.css`, `cli-sprint4a.css`, `cli-sprint4b.css`, `portal-polish.css`, `responsive.css`, `sprint4a.css`, `sprint6-cli.css`, `sprint6.css`, `sprint7.css`, `sprint8.css`, `supabase-portal.css`, `ui-polish.css` (semua dalam `css/`).

Tidak perlu migrasi SQL. ZIP patch ini tidak menyertakan `.env`, `js/supabase-config.js`, maupun kredensial Supabase.
