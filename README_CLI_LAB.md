# RoutingLab Sprint 3 — Responsive CLI Lab

## Instalasi (langsung replace)
1. Simpan versi sebelumnya dengan `git add . && git commit -m "backup before sprint3"` (jika ada perubahan).
2. Ekstrak seluruh isi ZIP **langsung ke folder root** `RoutingLab-Development`. ZIP tidak memiliki folder pembungkus.
3. Setujui penggantian hanya untuk `cli-lab.html`, `css/cli-lab.css`, `js/cli-lab.js`, dan `js/cli-engine.js`.
4. Buka `cli-lab.html` menggunakan Live Server, lalu reload dengan Ctrl+Shift+R.

## Yang baru
- Responsif laptop (dua kolom fleksibel) / tablet / mobile (tab Topologi & Misi ↔ Terminal CLI).
- Klik R1/R2 dari topologi langsung pindah ke tab Terminal pada mobile.
- Status WAN, route pergi, dan route balik terbarui setelah perintah.
- Pemeriksaan konektivitas juga memerlukan IP antarmuka LAN yang sesuai skenario.
- Fokus keyboard dan aksesibilitas diperbaiki; terminal masih simulator edukatif terbatas.

## Uji
- Desktop: lebar 1366px/1920px; tablet: 768px; mobile: 390px/320px.
- Di R1: `enable` → `conf t` → `ip route 192.168.2.0 255.255.255.0 10.10.10.2` → `end`.
- Klik R2: `enable` → `conf t` → `ip route 192.168.1.0 255.255.255.0 10.10.10.1` → `end`.
- Periksa Misi harus sukses, ubah `shutdown` pada interface maka status WAN menjadi gagal.
- Unit test: `node tests/cli-engine.test.js`.

## Menu sidebar situs lama
**Belum diubah**, karena versi file dashboard/sidebar terbaru belum tersedia dalam paket yang telah diunggah.
Masukkan tautan `<a href="cli-lab.html">CLI Lab</a>` ke sidebar yang benar setelah mengecek kode repo aktual. File lama sengaja tidak ditimpa agar tidak merusak navigasi.

## Belum tersedia
- Database Supabase, autentikasi, penyimpanan nilai, multiple challenge, validasi server.
