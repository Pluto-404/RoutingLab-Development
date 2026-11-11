# RoutingLab — Redesign v3 (revisi visual)

## Prasyarat
Pasang patch Clean Redesign v1 dan PATCH v2 terlebih dahulu. Patch v3 ini hanya berisi file baru/yang berubah setelah v2.

## Perubahan
- Materi dan Visualisasi: perangkat R1/R2 memakai gambar router Cisco bergaya enterprise; detail RJ45 biru pada legenda.
- Visualisasi: paket neon yang lebih besar dan menonjol di atas perangkat, alur kabel biru menyala, status per tahap, serta tombol **Ulangi**. Nilai dan progres siswa tetap mengikuti mekanisme semula.
- CLI Lab: router R1/R2 diganti, topologi desktop tetap tanpa scrollbar horizontal dan mobile dapat digeser. Kirim Paket/Kirim Balik di dalam panel Simulasi paket & skenario menampilkan paket neon yang bergerak mengikuti jalur trace yang benar-benar diperoleh dari simulator.
- Tetap menggunakan dua stylesheet utama (`css/style.css`, `css/cli-lab.css`). Tidak ada perubahan SQL, Auth, RLS, atau konfigurasi Cloudflare.

## Instalasi
1. Buat cadangan folder kerja.
2. Ekstrak ZIP di root `RoutingLab-Development` (isi ZIP langsung folder `css/`, `js/`, `assets/` dan tiga HTML, tanpa folder pembungkus).
3. Pilih **Replace** saat diminta.
4. Uji lokal: Materi, Visualisasi → Kirim Paket/Ulangi; CLI Lab → konfigurasi R1/R2, Periksa Misi, Simulasi paket & skenario → Kirim Paket/Kirim Balik. Cek tampilan HP dan desktop.
5. Baru lakukan git commit/push jika semua lolos.

## Batasan
Animasi paket adalah demonstrasi, bukan transfer data jaringan sungguhan. Status trace CLI Lab mengikuti mesin simulasi yang sudah ada. Mockup gambar adalah inspirasi visual, bukan screenshot implementasi.
