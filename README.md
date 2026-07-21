# 🕌 Sistem Laporan Keuangan DKM Masjid (Web-Based)

Sistem Laporan Keuangan DKM Masjid adalah aplikasi web modern, responsif, dan **100% gratis** yang dirancang untuk membantu pengurus atau bendahara DKM (Dewan Kemakmuran Masjid) mencatat, memantau, dan melaporkan keuangan kas masjid secara transparan, rapi, dan profesional.

---

## ✨ Fitur Utama
1. **Dashboard Ringkasan Keuangan**:
   * Menampilkan **Total Saldo Kas**, **Total Pemasukan**, dan **Total Pengeluaran** secara real-time.
   * Indikator status kesehatan keuangan otomatis (Sangat Sehat, Stabil, Defisit).
2. **Grafik Interaktif (Chart.js)**:
   * Grafik Batang bulanan yang membandingkan pemasukan dan pengeluaran.
   * Grafik Lingkaran (Doughnut) untuk melihat persentase penyebaran alokasi dana per kategori kas.
3. **Pencatatan Transaksi Kas Masuk & Kas Keluar**:
   * Formulir input tanggal, kategori kas, nominal, dan keterangan lengkap.
   * Fitur **Edit** dan **Hapus** transaksi untuk memperbaiki kesalahan ketik.
4. **Penyaringan & Pencarian Cerdas**:
   * Cari transaksi berdasarkan kata kunci keterangan.
   * Filter transaksi berdasarkan Kategori Kas tertentu, Bulan, atau Tahun.
5. **Cetak Laporan Siap Pakai (Print-Friendly)**:
   * Cukup klik tombol **Cetak Laporan** (atau tekan `Ctrl + P` / menu cetak browser).
   * Halaman cetak otomatis disesuaikan secara khusus untuk kertas ukuran A4, menyembunyikan tombol-tombol web, memperluas daftar tabel (tanpa batasan halaman), serta menambahkan **kolom tanda tangan pengurus** (Ketua DKM dan Bendahara) yang rapi.
6. **Ekspor Data ke Excel/CSV**:
   * Unduh data yang sedang disaring langsung ke format CSV untuk diolah lebih lanjut menggunakan Microsoft Excel atau Google Sheets.
7. **Keamanan Data Mandiri (Backup & Restore)**:
   * Seluruh data disimpan dengan aman di peramban (browser) Anda menggunakan teknologi `LocalStorage`.
   * Dilengkapi fitur **Unduh Cadangan (.json)** agar data bisa diselamatkan ke HP/Komputer, serta **Impor Data Cadangan** untuk memulihkan data jika Anda berganti perangkat atau menghapus riwayat browser.
8. **Kustomisasi Sistem**:
   * Ubah nama masjid/instansi melalui modal Pengaturan.
   * Tambahkan atau hapus kategori kas sesuai kebutuhan DKM (misalnya: Kas Anak Yatim, Kas Renovasi, Kas Operasional, dll.). Kategori kas yang sedang digunakan dalam transaksi otomatis terkunci demi keamanan data.

---

## 🚀 Cara Menjalankan Aplikasi di HP / Laptop (Lokal)

Aplikasi ini **sangat ringan dan mandiri** (tidak memerlukan server backend). Anda bisa langsung menjalankannya tanpa instalasi apa pun:

1. Salin seluruh folder `dkm-keuangan` ke komputer atau HP Anda.
2. Cukup klik ganda (double-click) file **`index.html`** untuk membukanya di browser Google Chrome, Edge, Safari, atau Firefox Anda.
3. Aplikasi siap langsung digunakan! Data yang Anda input akan tetap tersimpan meskipun browser ditutup atau HP dimatikan.

---

## 🌐 Cara Hosting (Mempublikasikan) Web secara Online (100% GRATIS Selamanya!)

Agar web ini bisa diakses oleh pengurus DKM lain atau jamaah masjid secara online lewat internet, Anda dapat menghostingnya menggunakan layanan gratis berikut. Karena aplikasi ini murni HTML, CSS, dan JavaScript statis, prosesnya hanya memakan waktu 2 menit:

### Pilihan 1: Menggunakan Netlify (Sangat Mudah - Cukup Tarik & Lepas / Drag & Drop)
1. Buka situs [https://www.netlify.com/](https://www.netlify.com/) dan buat akun gratis (bisa menggunakan email).
2. Setelah masuk, buka halaman dashboard Anda lalu cari bagian **Add New Site** -> **Deploy Manually** atau langsung kunjungi halaman: [https://app.netlify.com/drop](https://app.netlify.com/drop).
3. Tarik (drag) seluruh folder `dkm-keuangan` lalu lepaskan (drop) ke dalam kotak unggah yang disediakan di halaman Netlify Drop tersebut.
4. Tunggu beberapa detik hingga proses unggah selesai.
5. Netlify akan memberikan Anda sebuah alamat tautan web gratis (misalnya: `masjid-alfalah.netlify.app`). Anda bisa membagikan alamat tautan ini kepada seluruh pengurus masjid atau jamaah!

### Pilihan 2: Menggunakan Vercel (Sangat Populer & Cepat)
1. Buka [https://vercel.com/](https://vercel.com/) dan masuk menggunakan akun gratis.
2. Anda bisa menghubungkan akun GitHub Anda untuk mengotomatiskan deploy setiap kali ada pembaruan kode, atau menggunakan Vercel CLI untuk deploy instan langsung dari terminal.
3. Untuk deployment paling sederhana tanpa coding, Anda juga bisa mengunggah folder ini secara langsung melalui dashboard panel web Vercel.

### Pilihan 3: Menggunakan GitHub Pages
1. Buat sebuah repositori baru di GitHub dengan nama bebas (misalnya `keuangan-masjid`).
2. Unggah file `index.html`, `app.js`, dan `README.md` ke repositori tersebut.
3. Buka tab **Settings** di repositori GitHub Anda, cari menu **Pages** di bilah sisi kiri.
4. Pada bagian **Build and deployment**, atur Source ke **Deploy from a branch**, lalu pilih branch **main** (atau `master`) dan folder **`/ (root)`**. Klik **Save**.
5. Tunggu sekitar 1-2 menit, lalu segarkan halaman. GitHub akan memberikan tautan resmi gratis Anda (misalnya: `username.github.io/keuangan-masjid`).

---

## 🔒 Tips Keamanan Data
Karena data keuangan Anda disimpan secara lokal di dalam browser perangkat Anda (`LocalStorage`):
* **Lakukan Cadangan Berkala:** Selalu klik ikon database di pojok kanan atas, lalu pilih **Unduh Cadangan (.json)** minimal seminggu sekali atau setelah melakukan transaksi besar. Simpan file cadangan tersebut di Google Drive, WhatsApp, atau flashdisk.
* **Jangan bersihkan cache/cookies browser sembarangan:** Jika Anda melakukan pembersihan "Clear History & Cookies" secara menyeluruh di browser, data transaksi lokal akan terhapus. Namun, Anda tidak perlu khawatir jika rutin melakukan unduh cadangan, karena data bisa dipulihkan kembali dalam 2 detik menggunakan tombol **Impor Data Cadangan**.

---

*Dibuat dengan penuh rasa hormat untuk membantu memakmurkan masjid dan mewujudkan pengelolaan kas masjid yang transparan, amanah, dan profesional.* 🕌✨
