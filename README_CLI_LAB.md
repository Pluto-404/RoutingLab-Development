# RoutingLab UAS — CLI Lab Foundation v0.1

## Memasang
1. Commit cadangan proyek lokal Anda.
2. Ekstrak isi ZIP **langsung ke dalam** folder `RoutingLab-Development/` (jangan membuat subfolder tambahan).
3. Buka `cli-lab.html` melalui VS Code Live Server. Jangan membuka file secara langsung jika browser memblokir sumber lokal.
4. Dari R1: `enable` → `configure terminal` → `ip route 192.168.2.0 255.255.255.0 10.10.10.2` → `end`.
5. Pilih R2, lalu `enable` → `configure terminal` → `ip route 192.168.1.0 255.255.255.0 10.10.10.1` → `end`.
6. Uji `ping 192.168.1.10` di R2 atau `ping 192.168.2.10` di R1, kemudian klik **Periksa Misi**.

## File ditambahkan (file lama tidak diubah)
- `cli-lab.html`
- `css/cli-lab.css`
- `js/cli-engine.js`
- `js/cli-lab.js`
- `tests/cli-engine.test.js`

## Pengujian opsional
`node tests/cli-engine.test.js`

## Batasan penting
- Tidak ada integrasi login, Supabase atau nilai resmi pada paket ini.
- Engine hanya menjalankan subset perintah Cisco dan satu skenario dua-router.
- Topologi terbatas, belum emulasi ARP/L2, IPv4 routing dinamis, packet timing, dan Cisco IOS sepenuhnya.
- `ping` hanya dinilai untuk tujuan PC jarak jauh yang disebut dalam skenario. Jangan menganggap setiap alamat ping didukung.
- Router state tersimpan di memori browser selama halaman aktif; reload mengembalikan konfigurasi ke awal.
- Tombol dashboard mengarah ke `dashboard-siswa.html`, sesuai struktur proyek terdahulu.
