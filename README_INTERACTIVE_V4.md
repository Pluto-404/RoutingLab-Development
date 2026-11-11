# RoutingLab — v4 Interactive Learning Polish

## Pemasangan
Patch v4 diterapkan **setelah v1, v2, dan v3**. Ekstrak isinya langsung ke root folder `RoutingLab-Development` lalu pilih Replace. Tidak ada konfigurasi rahasia, migrasi SQL, atau perubahan database.

## Perubahan
- Visualisasi: Play Otomatis, Jeda, Sebelumnya, Langkah Berikutnya, Reset, progress tahap 1–6, dan penjelasan perangkat. Pengiriman adalah **demonstrasi topologi contoh yang rutenya sudah benar**; bukan pengujian CLI yang sedang aktif.
- CLI Lab: highlight link yang benar-benar dilewati trace dari `app.trace()`, efek kabel saat link WAN down, paket berhenti pada titik kegagalan menurut simulator. Mesin CLI tidak diganti.
- Materi: contoh perintah interaktif (Enable, Configure, Static Route, Verifikasi) beserta deskripsi dan salin perintah.
- Dua stylesheet yang ada tetap digunakan.

## Uji lokal sebelum push
1. Pastikan `js/supabase-config.js` lokal tetap tersedia dan di-ignore Git.
2. Buka Materi, klik keempat tab contoh, cek penjelasan dan Salin.
3. Buka Visualisasi, uji Play, Jeda, Next, Previous, Reset, dan sampai selesai.
4. CLI Lab: load preset `missing-return`, kirim paket depan/balik dan lihat jalur gagal. Lengkapi static route pada dua router, periksa misi dan kirim paket lagi.
5. Pastikan login, evaluasi dan simpan progres masih berjalan di lokal. Setelah aman baru push.

## Keterbatasan
- Paket visualisasi merupakan ilustrasi logis protokol, bukan emulasi frame sungguhan.
- Status koneksi CLI bergantung pada mesin simulasi yang memang sudah ada dan fitur perintah yang didukung.
- Perubahan tidak melakukan audit keamanan langsung ke Supabase produksi.
