# RoutingLab — UI/UX Polish (setelah Sprint 7)

Paket ini **khusus desain dan layout**, tidak menambah tabel Supabase dan tidak mengganti autentikasi atau logika CLI.

## Cara pasang
1. Backup atau commit proyek lokal dahulu.
2. Ekstrak ZIP **langsung ke root `RoutingLab-Development/`**. Tidak ada folder pembungkus; pilih Replace untuk file HTML yang berubah.
3. Jalankan `index.html` dengan Live Server dan hard reload `Ctrl + Shift + R`.
4. Jika menggunakan Cloudflare Pages nanti, pastikan file CSS baru ikut dipush.

## Perubahan
- Tipografi lebih ringkas dan konsisten untuk desktop, laptop, dan ponsel.
- Desain shell/sidebar, topbar, kartu, formulir, tabel, dan banner dirapikan.
- CLI Lab **topologi + indikator diletakkan paling atas di kiri** dan terminal di kanan; panel panduan, pengalamatan, tracer, dan contoh konfigurasi bisa dibuka/tutup.
- Desktop: dua panel CLI mengisi tinggi viewport; **output terminal dan panel topologi saja** yang boleh scroll jika konten panjang, bukan scroll kosong seluruh dokumen.
- Portal Akun & Kelas: mode guest/login dioptimalkan untuk satu viewport pada desktop dengan tinggi yang cukup; mode dashboard setelah login dapat scroll alami apabila daftar kelas dan formulir lebih panjang.
- Mobile: layout bertumpuk/tab; layar kecil tetap boleh scroll untuk menghindari pemotongan konten.
- Tidak ada fungsi yang dihapus, termasuk tombol `Muat skenario`, `Periksa Misi`, `Reset`, `Kirim Paket`, dan input CLI.

## Uji cepat
- Desktop: 1920×1080, 1440×900, 1366×768, 1280×720. Tidak ada scroll *dokumen* kosong pada login, portal guest dan CLI Lab; CLI boleh memiliki scroll *di dalam* panel.
- Mobile: 390×844 dan 320×700; tab topologi dan terminal tetap bisa dipilih.
- Supabase: uji login siswa/guru, database progress/riwayat latihan, CLI Lab 4 skenario.
- Tes Node: jalankan `node tests/cli-sprint4b.test.cjs` serta tes sprint lain yang sudah ada.

## Keamanan Git
ZIP **tidak menyertakan** `js/supabase-config.js`, `.env`, `.git`, token, password, atau konfigurasi privat. Jangan menghapus ignore `/js/supabase-config.js` dari `.gitignore`.

## Catatan kompatibilitas
Logo, topologi, dan ilustrasi merupakan aset proyek asli. Referensi desain teman digunakan sebagai inspirasi tata letak, bukan disalin mentah atau memasukkan aset mereka.
