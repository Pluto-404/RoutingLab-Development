# RoutingLab Sprint 4B — Advanced Network Simulation (topologi tetap)

Paket **langsung ekstrak ke root** `RoutingLab-Development/` lalu konfirmasi Replace. Tidak memiliki folder pembungkus dan tidak menyertakan `.git`.

Perubahan: `cli-lab.html`, `css/cli-sprint4b.css`, `js/cli-engine.js`, `js/cli-lab.js`, `tests/cli-sprint4b.test.cjs`.

## Fitur
- Trace paket PC0→PC1 dan PC1→PC0 per-hop, disertai penjelasan lokasi gagal.
- Static routing menggunakan pencocokan prefix dan pemilihan longest-prefix match untuk 2 router/2 LAN.
- Link aktif, IP/mask WAN, next-hop reachable, rute pergi dan balik diperiksa.
- Skenario: kosong, route balik hilang, interface WAN shutdown, next-hop salah.
- CLI R1/R2 yang sudah ada tetap digunakan. Tidak memakai Supabase pada Sprint ini.

## Penggunaan
Buka `cli-lab.html` menggunakan Live Server. Pilih skenario, klik **Muat skenario**, lihat `show ip route` / `show ip interface brief`, perbaiki melalui CLI, tekan **Kirim Paket** dan **Periksa Misi**. Untuk menguji CLI gunakan `node tests/cli-engine.test.js` dan `node tests/cli-sprint4b.test.cjs`.

## Batasan yang perlu dipahami
Simulator mendukung topologi tetap 2 router / 2 LAN. Trace merupakan model edukatif terbatas: belum mensimulasikan ARP, TTL sebenarnya, routing dinamis, PC CLI, collision, delay jaringan, maupun tabel FIB Cisco. Perintah `ping` CLI masih dibatasi alamat yang ditetapkan. Konfigurasi masih hanya ada selama tab dibuka. Perbaikan nanti dapat menambahkan network engine topologi dinamis dan integrasi Supabase.
