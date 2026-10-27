# RoutingLab Sprint 7 — Riwayat Latihan & Monitoring Guru

Patch ini dibuat di atas **Sprint 6** yang sudah di-push ke commit `65ebe93`. ZIP tidak memiliki folder induk; ekstrak **langsung** ke root `RoutingLab-Development`. Tidak memuat file `.git`, `.env`, `js/supabase-config.js`, password, token, atau data akun nyata.

## Urutan instalasi

1. **Backup atau commit** kode lokal jika belum bersih. Ekstrak ZIP dan pilih *Replace* untuk file yang berubah.
2. Buka Supabase → SQL Editor → New Query. Salin **seluruh** isi `supabase/migrations/20261027_sprint7.sql` → **Run**. Sprint 5 dan Sprint 6 harus sudah diterapkan; tidak perlu mengulang migrasinya.
3. Pastikan SQL berhasil (biasanya `Success. No rows returned`). Table Editor sekarang memiliki tabel **`practice_events`**. Tabel ini kosong sampai ada latihan baru. Migration juga memasang trigger `updated_at` dan RPC baru khusus guru `teacher_progress_report` serta `teacher_recent_events`.
4. Pastikan `js/supabase-config.js` milikmu **tetap tersimpan secara lokal** dan tidak terunggah ke GitHub. Jalankan `index.html` lewat Live Server lalu refresh dengan `Ctrl+Shift+R`.
5. Login sebagai siswa → buka CLI Lab → pilih skenario dan klik **Periksa Misi** (berhasil/gagal), atau kerjakan Mini Lab / Evaluasi → buka menu **Progress**. Harus muncul riwayat yang nyata, *bukan* data contoh. `practice_events` juga bisa dilihat dari Table Editor Supabase.
6. Logout → login sebagai **Guru** → buka Dashboard Guru → coba filter kelas, tombol Perbarui, aktivitas terbaru, dan **Ekspor CSV**. Data hanya dari kelas milik guru yang sedang login.

## Data dan penilaian

- `public.user_progress`: **persentase terakhir** per aktivitas. Saat siswa mengubah persentase, kolom `updated_at` kini ikut diperbarui.
- `public.practice_events`: **riwayat baru mulai Sprint 7**, dengan siswa, aktivitas, status berhasil/perlu mengulang, skor latihan jika tersedia, dan waktu. Data riwayat lama sebelum Sprint 7 tidak bisa muncul otomatis.
- Evaluasi menyimpan skor per percobaan **sebagai angka yang dikirim browser**, bukan nilai ujian terverifikasi. Tidak ada riwayat *raw* perintah terminal atau password yang disimpan.
- Reset Progress mengubah persentase terakhir ke nol tetapi **tidak menghapus riwayat latihan**.
- **Progres masih tingkat akun siswa (bukan tingkat kelas).** Guru hanya dapat mengakses siswa yang menjadi anggota kelasnya, tetapi apabila seorang siswa bergabung ke beberapa kelas, riwayat/progres akun yang sama akan terlihat pada setiap guru kelas tersebut. Jangan gunakan data ini untuk membandingkan capaian *per kelas* pada siswa yang mengikuti lebih dari satu kelas; pengaitan aktivitas dengan kelas perlu dibuat pada pengembangan berikutnya.
- Jika siswa tergabung ke dua kelas milik guru yang sama, baris per kelas akan muncul dua kali di laporan kelas gabungan. Statistik jumlah siswa menghitung akun unik, sedangkan rata-rata dihitung per anggota kelas.
- **Tidak ada nilai resmi / sertifikasi** dan tidak ada verifikasi server terhadap kebenaran skor siswa. Ini monitoring formatif.

## Validasi dan troubleshooting

- Jalankan `node tests/test-sprint7.cjs` dan tes-tes sebelumnya pada folder `tests/`.
- Jika muncul `relation "practice_events" does not exist` atau `Could not find function teacher_progress_report`, jalankan SQL Sprint 7 pada **proyek Supabase yang benar**. Refresh halaman sesudahnya.
- Jika muncul `permission denied`, pastikan seluruh query migrasi berjalan sukses. **Jangan menonaktifkan RLS** atau mengubah izin menjadi `anon` demi mengatasi error.
- Jika riwayat kosong, lakukan latihan baru setelah SQL dijalankan. Riwayat sebelum Sprint 7 tidak di-backfill.
- Pengujian UI lokal dan mock tidak menggantikan pengujian autentikasi end-to-end pada Supabase asli.

## Pemeriksaan Git sebelum push

Di terminal VS Code (PowerShell):

```powershell
git check-ignore -v js/supabase-config.js
git add .
git diff --cached --name-only
git diff --cached --check
git grep --cached -n -i -E "sb_secret_|service_role|DATABASE_URL|PRIVATE KEY|ghp_"
```

Cek hasilnya. `js/supabase-config.js` tidak boleh masuk staging dan `js/supabase-config.example.js` harus tetap placeholder. Kode SQL migrasi dan JS baru memang boleh masuk GitHub. Setelah pengujian berhasil:

```powershell
git commit -m "feat: Sprint 7 formative activity history and teacher analytics"
git push origin main
```

## Batasan

Akses tabel dan RPC dibatasi melalui RLS, `auth.uid()`, dan pengecekan guru pemilik kelas; tetap lakukan uji silang dua akun guru pada proyek asli. Frontend belum memiliki mekanisme antrean offline untuk event; apabila koneksi putus, beberapa riwayat baru mungkin tidak tersimpan, meski progres utama berusaha menyinkronkan terpisah. Gunakan Chrome DevTools Network/Console saat uji. Backend Supabase tetap dapat menggunakan Free Plan jika pemakaian berada dalam kuota.
