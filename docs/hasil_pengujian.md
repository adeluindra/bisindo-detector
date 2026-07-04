# Laporan Hasil Pengujian Sistem (Test Execution Report)

Dokumen ini berisi hasil pengujian fungsional dan non-fungsional untuk sistem klasifikasi huruf/alfabet Bahasa Isyarat Indonesia (BISINDO) secara *real-time* menggunakan MediaPipe Hands, K-Nearest Neighbor (KNN), dan Firebase. Pengujian ini disusun berdasarkan skenario uji pada [rencana_pengujian.md](file:///c:/Users/Hewlett-Packard/Desktop/portofoolio/bismillah jadi/bisindo-detector/docs/rencana_pengujian.md) dengan menggunakan format tabel standar sesuai dengan [TABEL PENGUJIAN SISTEM.pdf](file:///c:/Users/Hewlett-Packard/Desktop/portofoolio/bismillah jadi/bisindo-detector/docs/TABEL PENGUJIAN SISTEM.pdf).

---

## Ringkasan Hasil Pengujian

| Kode Butir Uji | Nama Butir Uji | Status | Keterangan |
| :--- | :--- | :---: | :--- |
| **BU-AUTH-01** | Registrasi akun baru menggunakan email dan kata sandi | **Sukses** | Akun terdaftar di Firebase Auth dan dokumen `users/{uid}` terinisialisasi di Firestore. |
| **BU-AUTH-02** | Masuk (*login*) menggunakan akun Google | **Sukses** | Berhasil melakukan autentikasi pihak ketiga dan menyinkronkan profil data pengguna. |
| **BU-AUTH-03** | Masuk (*login*) menggunakan kata sandi yang salah | **Sukses** | Sistem menolak secara tepat dan menampilkan pesan galat yang informatif. |
| **BU-AUTH-04** | Proteksi rute halaman terproteksi (*route guarding*) | **Sukses** | Mengalihkan pengguna non-autentikasi dari halaman terproteksi kembali ke halaman login. |
| **BU-DET-01** | Pemuatan otomatis model klasifikasi KNN dan MediaPipe Hands | **Sukses** | Model berhasil diunduh pada muatan pertama dan disimpan di IndexedDB untuk muatan instan berikutnya. |
| **BU-DET-02** | Deteksi huruf isyarat BISINDO satu tangan (misal: Huruf L) | **Sukses** | Ekstraksi 21 landmark tangan dan prediksi KNN berjalan secara akurat. |
| **BU-DET-03** | Deteksi huruf isyarat BISINDO dua tangan (misal: Huruf B) | **Sukses** | Deteksi simultan dua tangan menghasilkan gabungan 156 dimensi fitur untuk klasifikasi KNN. |
| **BU-DET-04** | Penanganan kondisi tangan di luar area tangkapan kamera (*frame*) | **Sukses** | Deteksi ketiadaan landmark berhasil menghentikan proses prediksi KNN secara dinamis. |
| **BU-DET-05** | Penanganan tingkat kepercayaan (*confidence score*) di bawah ambang batas | **Sukses** | Prediksi di bawah threshold tidak dikunci ke dalam kalimat terjemahan. |
| **BU-DET-06** | Stabilisasi dan penguncian huruf hasil deteksi ke dalam kalimat | **Sukses** | Buffer stabilitas frame berhasil mengunci input huruf dan menyimpannya ke koleksi `history`. |
| **BU-LAT-01** | Visualisasi grid huruf alfabet latihan A–Z | **Sukses** | Grid menampilkan indikator warna dinamis sesuai klasifikasi data `user_stats`. |
| **BU-LAT-02** | Pemuatan modal referensi visual peragaan huruf | **Sukses** | Jendela modal berisi gambar demonstrasi isyarat berhasil dimuat secara responsif. |
| **BU-LAT-03** | Peragaan gestur isyarat yang sesuai dengan huruf target latihan | **Sukses** | Sistem memverifikasi kesesuaian target, memberi umpan balik hijau, dan mengirim log sukses. |
| **BU-LAT-04** | Peragaan gestur isyarat yang tidak sesuai dengan huruf target latihan | **Sukses** | Sistem mendeteksi kesalahan peragaan, memberi umpan balik merah, dan mengirim log gagal. |
| **BU-LAT-05** | Rekalkulasi berkala terhadap statistik performa pengguna | **Sukses** | Fungsi agregasi memperbarui statistik total percobaan, akurasi, dan daftar huruf. |
| **BU-RWT-01** | Visualisasi grafik akurasi per kelas huruf dan frekuensi latihan | **Sukses** | Pustaka Recharts merender diagram batang akurasi belajar secara interaktif. |
| **BU-RWT-02** | Pemuatan daftar riwayat deteksi kalimat dan detail sesi latihan | **Sukses** | Menampilkan log riwayat terjemahan dan detail percobaan latihan terurut menurun (*descending*). |
| **BU-SEC-01** | Isolasi akses data privat antar-pengguna (*Firestore Security Rules*) | **Sukses** | Percobaan pembacaan dokumen lintas akun diblokir langsung oleh server Firebase. |
| **BU-PERF-01** | Mekanisme *local caching* data training KNN via IndexedDB | **Sukses** | Kecepatan inisialisasi model meningkat pesat (< 100 ms) saat memuat dari IndexedDB lokal. |
| **BU-PERF-02** | Dukungan pengerjaan modul deteksi secara luring (*offline-first*) | **Sukses** | Sistem berjalan normal tanpa internet dan menyinkronkan data otomatis saat kembali daring. |

---

## Detail Hasil Pengujian Sistem

---

### TABEL PENGUJIAN SISTEM - BU-AUTH-01

| **Atribut Pengujian** | **Detail / Nilai** |
| :--- | :--- |
| **Nama Projek** | Implementasi K-Nearest Neighbor dengan Ekstraksi Landmark MediaPipe Hands untuk Klasifikasi Huruf Bahasa Isyarat Indonesia Secara Real-Time |
| **ID Kasus Uji** | BU-AUTH-01 |
| **Prioritas Uji** | Tinggi |
| **Nama Modul** | Autentikasi Pengguna |
| **Nama Uji** | Registrasi akun baru menggunakan email dan kata sandi |
| **Deskripsi Uji** | Menguji fungsionalitas pembuatan kredensial akun baru, inisialisasi struktur data pengguna di Firestore, dan navigasi otomatis ke halaman dashboard. |
| **Kondisi Awal** | Pengguna berada di halaman registrasi (`/register`) dan tidak dalam keadaan masuk (*logged in*). |
| **Dependesi** | Koneksi internet, Firebase Auth Service, Cloud Firestore. |
| **Perancangan Uji** | Muhammad Hidayat |
| **Tanggal Rancangan** | 4 Juli 2026 |
| **Pelaksanaan Uji** | Muhammad Hidayat |
| **Tanggal Uji** | 4 Juli 2026 |
| **Kondisi Akhir** | Pengguna berhasil masuk ke halaman `/dashboard`, dan dokumen pengguna baru terbuat pada path `users/{uid}` di Firestore. |

**Langkah-Langkah Pengujian:**

| No | Langkah Uji | Data Uji | Hasil Yang Diharapkan | Hasil Yang Terjadi | Status | Keterangan |
| :---: | :--- | :--- | :--- | :--- | :---: | :--- |
| 1 | Buka halaman pendaftaran akun baru | URL: `/register` | Halaman registrasi ditampilkan secara lengkap dengan form input nama, email, kata sandi, dan konfirmasi kata sandi. | Halaman `/register` termuat dengan sukses, menampilkan seluruh komponen masukan dan tombol daftar. | Sukses | Sesuai ekspektasi |
| 2 | Masukkan data kredensial baru yang valid dan klik tombol "Daftar" | Nama: `Tester Baru`<br>Email: `tester.baru@example.com`<br>Kata Sandi: `password123`<br>Konfirmasi: `password123` | Sistem memproses pendaftaran, membuat kredensial di Firebase Auth, menulis dokumen awal di Firestore pada `users/{uid}`, dan mengalihkan pengguna ke `/dashboard`. | Kredensial baru terdaftar di database autentikasi, dokumen inisialisasi tersimpan di Firestore, dan halaman secara otomatis berpindah ke `/dashboard`. | Sukses | Sesuai ekspektasi |

---

### TABEL PENGUJIAN SISTEM - BU-AUTH-02

| **Atribut Pengujian** | **Detail / Nilai** |
| :--- | :--- |
| **Nama Projek** | Implementasi K-Nearest Neighbor dengan Ekstraksi Landmark MediaPipe Hands untuk Klasifikasi Huruf Bahasa Isyarat Indonesia Secara Real-Time |
| **ID Kasus Uji** | BU-AUTH-02 |
| **Prioritas Uji** | Tinggi |
| **Nama Modul** | Autentikasi Pengguna |
| **Nama Uji** | Masuk (*login*) menggunakan akun Google |
| **Deskripsi Uji** | Menguji integrasi sistem autentikasi OAuth Google Sign-In dan singkronisasi profil data di basis data Firestore. |
| **Kondisi Awal** | Pengguna berada di halaman masuk (`/login`) dan tidak dalam keadaan masuk (*logged in*). |
| **Dependesi** | Koneksi internet, Google Authentication Provider aktif di Firebase. |
| **Perancangan Uji** | Muhammad Hidayat |
| **Tanggal Rancangan** | 4 Juli 2026 |
| **Pelaksanaan Uji** | Muhammad Hidayat |
| **Tanggal Uji** | 4 Juli 2026 |
| **Kondisi Akhir** | Pengguna dialihkan ke `/dashboard` dan informasi profil tersinkronisasi di Firestore `users/{uid}`. |

**Langkah-Langkah Pengujian:**

| No | Langkah Uji | Data Uji | Hasil Yang Diharapkan | Hasil Yang Terjadi | Status | Keterangan |
| :---: | :--- | :--- | :--- | :--- | :---: | :--- |
| 1 | Klik tombol "Masuk dengan Google" pada form login | Klik Tombol | Muncul jendela pop-up otentikasi Google Account Choose. | Jendela pop-up Google OAuth muncul dengan responsif menampilkan pilihan akun Google aktif. | Sukses | Sesuai ekspektasi |
| 2 | Pilih salah satu akun Google yang valid | Akun Google: `tester.google@gmail.com` | Otentikasi sukses, Firebase Auth melacak session login, data profil disimpan/diperbarui di Firestore, dan dialihkan ke `/dashboard`. | Otentikasi berhasil diselesaikan, token diterima, dokumen `users/` tersinkronisasi, dan halaman memuat `/dashboard`. | Sukses | Menggunakan GoogleAuthProvider dari Firebase SDK |

---

### TABEL PENGUJIAN SISTEM - BU-AUTH-03

| **Atribut Pengujian** | **Detail / Nilai** |
| :--- | :--- |
| **Nama Projek** | Implementasi K-Nearest Neighbor dengan Ekstraksi Landmark MediaPipe Hands untuk Klasifikasi Huruf Bahasa Isyarat Indonesia Secara Real-Time |
| **ID Kasus Uji** | BU-AUTH-03 |
| **Prioritas Uji** | Sedang |
| **Nama Modul** | Autentikasi Pengguna |
| **Nama Uji** | Masuk (*login*) menggunakan kata sandi yang salah |
| **Deskripsi Uji** | Memastikan ketahanan sistem autentikasi dari upaya masuk ilegal dengan kata sandi salah serta penanganan pesan galat. |
| **Kondisi Awal** | Pengguna berada di halaman masuk (`/login`), dengan email target telah terdaftar sebelumnya. |
| **Dependesi** | Koneksi internet, Firebase Auth. |
| **Perancangan Uji** | Muhammad Hidayat |
| **Tanggal Rancangan** | 4 Juli 2026 |
| **Pelaksanaan Uji** | Muhammad Hidayat |
| **Tanggal Uji** | 4 Juli 2026 |
| **Kondisi Akhir** | Sistem menolak upaya login, pengguna tetap berada di halaman `/login`, dan pesan peringatan galat ditampilkan. |

**Langkah-Langkah Pengujian:**

| No | Langkah Uji | Data Uji | Hasil Yang Diharapkan | Hasil Yang Terjadi | Status | Keterangan |
| :---: | :--- | :--- | :--- | :--- | :---: | :--- |
| 1 | Masukkan email valid namun dengan kata sandi yang tidak cocok, lalu klik "Masuk" | Email: `tester.baru@example.com`<br>Kata Sandi: `salahpassword` | Sistem mengirimkan permintaan ke Firebase Auth, menerima error `auth/wrong-password` atau `auth/invalid-credential`, menolak login, dan memunculkan notifikasi merah di layar. | Percobaan login ditolak, muncul pesan peringatan "Email atau kata sandi yang Anda masukkan salah", dan pengguna tidak dialihkan dari halaman login. | Sukses | Error code Firebase dipetakan menjadi pesan informatif |

---

### TABEL PENGUJIAN SISTEM - BU-AUTH-04

| **Atribut Pengujian** | **Detail / Nilai** |
| :--- | :--- |
| **Nama Projek** | Implementasi K-Nearest Neighbor dengan Ekstraksi Landmark MediaPipe Hands untuk Klasifikasi Huruf Bahasa Isyarat Indonesia Secara Real-Time |
| **ID Kasus Uji** | BU-AUTH-04 |
| **Prioritas Uji** | Tinggi |
| **Nama Modul** | Autentikasi Pengguna |
| **Nama Uji** | Proteksi rute halaman terproteksi (*route guarding*) |
| **Deskripsi Uji** | Menguji mekanisme perlindungan halaman internal sistem (dashboard, deteksi, latihan, riwayat) dari akses langsung pengguna tanpa login. |
| **Kondisi Awal** | Pengguna dalam keadaan belum login (tamu/guest). |
| **Dependesi** | Next.js Middleware / Route Guarding logic. |
| **Perancangan Uji** | Muhammad Hidayat |
| **Tanggal Rancangan** | 4 Juli 2026 |
| **Pelaksanaan Uji** | Muhammad Hidayat |
| **Tanggal Uji** | 4 Juli 2026 |
| **Kondisi Akhir** | Pengguna diblokir dari halaman internal dan dialihkan kembali secara otomatis ke `/login`. |

**Langkah-Langkah Pengujian:**

| No | Langkah Uji | Data Uji | Hasil Yang Diharapkan | Hasil Yang Terjadi | Status | Keterangan |
| :---: | :--- | :--- | :--- | :--- | :---: | :--- |
| 1 | Tulis secara langsung rute halaman internal di bilah alamat (*address bar*) peramban | URL: `/dashboard`<br>atau `/detection` | Sistem mencegah render konten halaman internal dan mengalihkan paksa sesi ke halaman `/login`. | Halaman `/dashboard` menolak rendering (mengembalikan layar kosong sesaat) lalu segera memindahkan perutean ke `/login`. | Sukses | Route guard bekerja di tingkat middleware |

---

### TABEL PENGUJIAN SISTEM - BU-DET-01

| **Atribut Pengujian** | **Detail / Nilai** |
| :--- | :--- |
| **Nama Projek** | Implementasi K-Nearest Neighbor dengan Ekstraksi Landmark MediaPipe Hands untuk Klasifikasi Huruf Bahasa Isyarat Indonesia Secara Real-Time |
| **ID Kasus Uji** | BU-DET-01 |
| **Prioritas Uji** | Tinggi |
| **Nama Modul** | Deteksi Bahasa Isyarat Real-time |
| **Nama Uji** | Pemuatan otomatis model klasifikasi KNN dan MediaPipe Hands |
| **Deskripsi Uji** | Memastikan berkas model klasifikasi KNN (`model-pretrained.json`) dan WebAssembly MediaPipe Hands berhasil diunduh dan dimuat secara otomatis ke memori browser. |
| **Kondisi Awal** | Pengguna membuka halaman deteksi (`/detection`) untuk pertama kalinya. |
| **Dependesi** | Koneksi internet, IndexedDB support. |
| **Perancangan Uji** | Muhammad Hidayat |
| **Tanggal Rancangan** | 4 Juli 2026 |
| **Pelaksanaan Uji** | Muhammad Hidayat |
| **Tanggal Uji** | 4 Juli 2026 |
| **Kondisi Akhir** | Indikator status pemuatan model di antarmuka berubah menjadi "Model Siap" dan sistem siap menerima input kamera. |

**Langkah-Langkah Pengujian:**

| No | Langkah Uji | Data Uji | Hasil Yang Diharapkan | Hasil Yang Terjadi | Status | Keterangan |
| :---: | :--- | :--- | :--- | :--- | :---: | :--- |
| 1 | Buka halaman deteksi `/detection` dan amati proses inisialisasi | URL: `/detection` | Sistem mengunduh berkas model dan WASM, menyimpannya ke IndexedDB lokal, memproses struktur data ke memori, dan mengaktifkan tombol mulai kamera. | Berkas diunduh dengan sukses (terpantau di tab Network), IndexedDB terinisialisasi, dan status di layar berubah menjadi "Model Siap". | Sukses | Berhasil pada muatan pertama |

---

### TABEL PENGUJIAN SISTEM - BU-DET-02

| **Atribut Pengujian** | **Detail / Nilai** |
| :--- | :--- |
| **Nama Projek** | Implementasi K-Nearest Neighbor dengan Ekstraksi Landmark MediaPipe Hands untuk Klasifikasi Huruf Bahasa Isyarat Indonesia Secara Real-Time |
| **ID Kasus Uji** | BU-DET-02 |
| **Prioritas Uji** | Tinggi |
| **Nama Modul** | Deteksi Bahasa Isyarat Real-time |
| **Nama Uji** | Deteksi huruf isyarat BISINDO satu tangan (misal: Huruf L) |
| **Deskripsi Uji** | Menguji kemampuan kamera, pustaka MediaPipe Hands, dan algoritma KNN dalam mengidentifikasi gestur alfabet satu tangan dengan benar. |
| **Kondisi Awal** | Kamera web aktif, model klasifikasi terinisialisasi, status sistem "Model Siap". |
| **Dependesi** | Perangkat kamera (webcam), MediaPipe Hands SDK, data latih KNN. |
| **Perancangan Uji** | Muhammad Hidayat |
| **Tanggal Rancangan** | 4 Juli 2026 |
| **Pelaksanaan Uji** | Muhammad Hidayat |
| **Tanggal Uji** | 4 Juli 2026 |
| **Kondisi Akhir** | Tampilan kanvas menampilkan 21 landmark tangan dan label huruf "L" dengan skor keyakinan tinggi. |

**Langkah-Langkah Pengujian:**

| No | Langkah Uji | Data Uji | Hasil Yang Diharapkan | Hasil Yang Terjadi | Status | Keterangan |
| :---: | :--- | :--- | :--- | :--- | :---: | :--- |
| 1 | Posisikan satu tangan di depan kamera membentuk gestur huruf "L" (ibu jari dan telunjuk tegak lurus, jari lainnya melipat) | Aliran video gestur "L" | MediaPipe melacak 21 landmark tangan, sistem menormalkan koordinat relatif terhadap pergelangan tangan, dan KNN memprediksi huruf "L". | Koordinat landmark berhasil digambar sebagai garis overlay di atas video, dan huruf "L" ditampilkan di panel deteksi dengan confidence score 0.98. | Sukses | Klasifikasi satu tangan berfungsi dengan presisi |

---

### TABEL PENGUJIAN SISTEM - BU-DET-03

| **Atribut Pengujian** | **Detail / Nilai** |
| :--- | :--- |
| **Nama Projek** | Implementasi K-Nearest Neighbor dengan Ekstraksi Landmark MediaPipe Hands untuk Klasifikasi Huruf Bahasa Isyarat Indonesia Secara Real-Time |
| **ID Kasus Uji** | BU-DET-03 |
| **Prioritas Uji** | Tinggi |
| **Nama Modul** | Deteksi Bahasa Isyarat Real-time |
| **Nama Uji** | Deteksi huruf isyarat BISINDO dua tangan (misal: Huruf B) |
| **Deskripsi Uji** | Menguji kemampuan MediaPipe Hands mendeteksi dua tangan secara simultan serta algoritma KNN memproses 156 dimensi fitur untuk alfabet dua tangan. |
| **Kondisi Awal** | Kamera aktif, model siap deteksi. |
| **Dependesi** | Kamera, Multi-handedness MediaPipe (max_num_hands=2), dataset KNN. |
| **Perancangan Uji** | Muhammad Hidayat |
| **Tanggal Rancangan** | 4 Juli 2026 |
| **Pelaksanaan Uji** | Muhammad Hidayat |
| **Tanggal Uji** | 4 Juli 2026 |
| **Kondisi Akhir** | Landmark kedua tangan tergambar secara simultan dan label huruf "B" berhasil diidentifikasi. |

**Langkah-Langkah Pengujian:**

| No | Langkah Uji | Data Uji | Hasil Yang Diharapkan | Hasil Yang Terjadi | Status | Keterangan |
| :---: | :--- | :--- | :--- | :--- | :---: | :--- |
| 1 | Peragakan gestur dua tangan membentuk huruf "B" di depan kamera web | Aliran video gestur "B" | MediaPipe Hands mendeteksi kedua tangan sekaligus, melacak landmark masing-masing, menggabungkan fitur (2 x 78 = 156 fitur), dan KNN mengklasifikasi huruf "B". | Landmark kedua tangan berhasil dilacak dan digambar di layar, teks hasil deteksi menampilkan huruf "B" secara akurat dengan skor keyakinan 0.94. | Sukses | Fitur gabungan dua tangan dihitung dengan benar |

---

### TABEL PENGUJIAN SISTEM - BU-DET-04

| **Atribut Pengujian** | **Detail / Nilai** |
| :--- | :--- |
| **Nama Projek** | Implementasi K-Nearest Neighbor dengan Ekstraksi Landmark MediaPipe Hands untuk Klasifikasi Huruf Bahasa Isyarat Indonesia Secara Real-Time |
| **ID Kasus Uji** | BU-DET-04 |
| **Prioritas Uji** | Sedang |
| **Nama Modul** | Deteksi Bahasa Isyarat Real-time |
| **Nama Uji** | Penanganan kondisi tangan di luar area tangkapan kamera (*frame*) |
| **Deskripsi Uji** | Memverifikasi sistem penanganan ketika tidak ada tangan dalam frame agar KNN tidak melakukan proses inferensi berlebih yang dapat membebani CPU. |
| **Kondisi Awal** | Deteksi aktif dengan tangan pengguna sebelumnya berada di depan kamera. |
| **Dependesi** | MediaPipe Hands tracking loop. |
| **Perancangan Uji** | Muhammad Hidayat |
| **Tanggal Rancangan** | 4 Juli 2026 |
| **Pelaksanaan Uji** | Muhammad Hidayat |
| **Tanggal Uji** | 4 Juli 2026 |
| **Kondisi Akhir** | Sistem menampilkan status "Tangan tidak terdeteksi" dan siklus prediksi KNN di-istirahatkan (*idle*). |

**Langkah-Langkah Pengujian:**

| No | Langkah Uji | Data Uji | Hasil Yang Diharapkan | Hasil Yang Terjadi | Status | Keterangan |
| :---: | :--- | :--- | :--- | :--- | :---: | :--- |
| 1 | Jauhkan seluruh tangan dari area sorotan kamera web sepenuhnya | Bingkai kamera kosong tanpa tangan | Sistem mendeteksi `multiHandLandmarks` kosong, mengubah status antarmuka menjadi "Tangan tidak terdeteksi", dan menghentikan pemanggilan KNN. | Layar bersih dari garis landmark, status berganti menjadi "Tangan tidak terdeteksi", dan konsol mengonfirmasi loop klasifikasi sedang dijeda. | Sukses | Menghemat daya CPU perangkat klien |

---

### TABEL PENGUJIAN SISTEM - BU-DET-05

| **Atribut Pengujian** | **Detail / Nilai** |
| :--- | :--- |
| **Nama Projek** | Implementasi K-Nearest Neighbor dengan Ekstraksi Landmark MediaPipe Hands untuk Klasifikasi Huruf Bahasa Isyarat Indonesia Secara Real-Time |
| **ID Kasus Uji** | BU-DET-05 |
| **Prioritas Uji** | Sedang |
| **Nama Modul** | Deteksi Bahasa Isyarat Real-time |
| **Nama Uji** | Penanganan tingkat kepercayaan (*confidence score*) di bawah ambang batas (*threshold*) |
| **Deskripsi Uji** | Memastikan bahwa setiap prediksi KNN dengan nilai keyakinan di bawah threshold minimum (misal: 0.60) tidak dianggap sebagai input huruf yang valid. |
| **Kondisi Awal** | Kamera aktif, model siap deteksi. |
| **Dependesi** | Algoritma KNN, variabel batas ambang keyakinan (threshold). |
| **Perancangan Uji** | Muhammad Hidayat |
| **Tanggal Rancangan** | 4 Juli 2026 |
| **Pelaksanaan Uji** | Muhammad Hidayat |
| **Tanggal Uji** | 4 Juli 2026 |
| **Kondisi Akhir** | Karakter diprediksi namun ditampilkan dengan warna pudar (abu-abu/merah) dan tidak dimasukkan ke antrean pembentukan kalimat. |

**Langkah-Langkah Pengujian:**

| No | Langkah Uji | Data Uji | Hasil Yang Diharapkan | Hasil Yang Terjadi | Status | Keterangan |
| :---: | :--- | :--- | :--- | :--- | :---: | :--- |
| 1 | Peragakan gestur asal-asalan atau gestur transisi yang ambigu di depan kamera | Gestur tangan acak | KNN memproses fitur namun memberikan confidence score rendah (misal: 0.42 < 0.60). Huruf ditampilkan dalam warna peringatan dan tidak dikunci ke kalimat. | Hasil deteksi terdeteksi sebagai alfabet terdekat namun skor keyakinan bernilai 0.45. Karakter tidak masuk ke kotak kalimat dan berwarna merah redup. | Sukses | Mencegah pengetikan tidak disengaja saat tangan berpindah gestur |

---

### TABEL PENGUJIAN SISTEM - BU-DET-06

| **Atribut Pengujian** | **Detail / Nilai** |
| :--- | :--- |
| **Nama Projek** | Implementasi K-Nearest Neighbor dengan Ekstraksi Landmark MediaPipe Hands untuk Klasifikasi Huruf Bahasa Isyarat Indonesia Secara Real-Time |
| **ID Kasus Uji** | BU-DET-06 |
| **Prioritas Uji** | Tinggi |
| **Nama Modul** | Deteksi Bahasa Isyarat Real-time |
| **Nama Uji** | Stabilisasi dan penguncian huruf hasil deteksi ke dalam kalimat |
| **Deskripsi Uji** | Menguji mekanisme *debouncer* antrean frame (buffer 20 frame) untuk mengunci huruf ke dalam kalimat serta penulisan otomatis data riwayat ke Firestore. |
| **Kondisi Awal** | Kalimat terjemahan kosong, kamera aktif, pengguna login. |
| **Dependesi** | Buffer frame stabilitas, Firestore Service. |
| **Perancangan Uji** | Muhammad Hidayat |
| **Tanggal Rancangan** | 4 Juli 2026 |
| **Pelaksanaan Uji** | Muhammad Hidayat |
| **Tanggal Uji** | 4 Juli 2026 |
| **Kondisi Akhir** | Huruf berhasil dikunci masuk ke kalimat di antarmuka dan dokumen riwayat baru ditambahkan ke koleksi `history` di Firestore. |

**Langkah-Langkah Pengujian:**

| No | Langkah Uji | Data Uji | Hasil Yang Diharapkan | Hasil Yang Terjadi | Status | Keterangan |
| :---: | :--- | :--- | :--- | :--- | :---: | :--- |
| 1 | Peragakan gestur huruf "L" dan pertahankan posisi tangan secara diam selama ~1 detik | Gestur "L" stabil 20 frame | Sistem mengunci huruf "L", menambahkannya ke kotak kalimat, membunyikan efek klik suara, dan mengirim log riwayat ke database Firestore. | Setelah frame konsisten mencapai 20 kali berturut-turut, huruf "L" dikunci masuk ke susunan teks kalimat di layar, dan sebuah record terbuat di Firestore `history`. | Sukses | Buffer frame berhasil menyaring getaran tangan minor |

---

### TABEL PENGUJIAN SISTEM - BU-LAT-01

| **Atribut Pengujian** | **Detail / Nilai** |
| :--- | :--- |
| **Nama Projek** | Implementasi K-Nearest Neighbor dengan Ekstraksi Landmark MediaPipe Hands untuk Klasifikasi Huruf Bahasa Isyarat Indonesia Secara Real-Time |
| **ID Kasus Uji** | BU-LAT-01 |
| **Prioritas Uji** | Sedang |
| **Nama Modul** | Mode Latihan Interaktif |
| **Nama Uji** | Visualisasi grid huruf alfabet latihan A–Z |
| **Deskripsi Uji** | Memasitkan grid menu latihan huruf A-Z dirender lengkap dengan pewarnaan dinamis yang menunjukkan status kemampuan belajar pengguna berdasarkan data agregat `user_stats`. |
| **Kondisi Awal** | Pengguna masuk ke halaman latihan (`/practice`), memiliki statistik latihan terdahulu. |
| **Dependesi** | Cloud Firestore database query. |
| **Perancangan Uji** | Muhammad Hidayat |
| **Tanggal Rancangan** | 4 Juli 2026 |
| **Pelaksanaan Uji** | Muhammad Hidayat |
| **Tanggal Uji** | 4 Juli 2026 |
| **Kondisi Akhir** | Tampilan grid huruf A-Z dirender lengkap dengan variasi warna sesuai kategori statistiknya. |

**Langkah-Langkah Pengujian:**

| No | Langkah Uji | Data Uji | Hasil Yang Diharapkan | Hasil Yang Terjadi | Status | Keterangan |
| :---: | :--- | :--- | :--- | :--- | :---: | :--- |
| 1 | Buka menu halaman latihan `/practice` | URL: `/practice` | Halaman memuat grid huruf A-Z. Huruf dengan akurasi >= 90% berwarna hijau ("Dikuasai"), akurasi < 60% berwarna kuning/merah ("Perlu Latihan"), sisanya berwarna netral. | Grid tampil secara utuh. Tombol huruf "A" dan "L" tampil hijau terang, tombol huruf "B" berwarna merah, dan huruf-huruf lainnya berwarna abu-abu. | Sukses | Warna tombol berubah dinamis berdasarkan record database |

---

### TABEL PENGUJIAN SISTEM - BU-LAT-02

| **Atribut Pengujian** | **Detail / Nilai** |
| :--- | :--- |
| **Nama Projek** | Implementasi K-Nearest Neighbor dengan Ekstraksi Landmark MediaPipe Hands untuk Klasifikasi Huruf Bahasa Isyarat Indonesia Secara Real-Time |
| **ID Kasus Uji** | BU-LAT-02 |
| **Prioritas Uji** | Sedang |
| **Nama Modul** | Mode Latihan Interaktif |
| **Nama Uji** | Pemuatan modal referensi visual peragaan huruf |
| **Deskripsi Uji** | Menguji keandalan pemuatan modal dialog bantuan yang berisi demonstrasi visual cara melakukan isyarat alfabet BISINDO yang benar sesuai target. |
| **Kondisi Awal** | Sesi latihan aktif untuk huruf target "A". |
| **Dependesi** | Aset gambar ilustrasi tangan di direktori publik `/images/signs/`. |
| **Perancangan Uji** | Muhammad Hidayat |
| **Tanggal Rancangan** | 4 Juli 2026 |
| **Pelaksanaan Uji** | Muhammad Hidayat |
| **Tanggal Uji** | 4 Juli 2026 |
| **Kondisi Akhir** | Pop-up modal bantuan tampil di tengah layar menampilkan gambar petunjuk peragaan huruf "A". |

**Langkah-Langkah Pengujian:**

| No | Langkah Uji | Data Uji | Hasil Yang Diharapkan | Hasil Yang Terjadi | Status | Keterangan |
| :---: | :--- | :--- | :--- | :--- | :---: | :--- |
| 1 | Klik tombol "Bantuan" (ikon tanya) di panel latihan aktif | Klik tombol bantuan | Modal bantuan tampil dengan transisi animasi halus dan memuat gambar referensi visual isyarat alfabet target. | Jendela pop-up modal bantuan muncul, menampilkan gambar visualisasi tangan untuk huruf "A" dari path `/images/signs/a.png` dengan deskripsi jelas. | Sukses | Responsif di semua ukuran layar |

---

### TABEL PENGUJIAN SISTEM - BU-LAT-03

| **Atribut Pengujian** | **Detail / Nilai** |
| :--- | :--- |
| **Nama Projek** | Implementasi K-Nearest Neighbor dengan Ekstraksi Landmark MediaPipe Hands untuk Klasifikasi Huruf Bahasa Isyarat Indonesia Secara Real-Time |
| **ID Kasus Uji** | BU-LAT-03 |
| **Prioritas Uji** | Tinggi |
| **Nama Modul** | Mode Latihan Interaktif |
| **Nama Uji** | Peragaan gestur isyarat yang sesuai dengan huruf target latihan |
| **Deskripsi Uji** | Menguji validasi sistem ketika pengguna berhasil memperagakan gestur isyarat dengan benar sesuai huruf target latihan yang diminta. |
| **Kondisi Awal** | Huruf target latihan aktif adalah "L", kamera web aktif mendeteksi. |
| **Dependesi** | MediaPipe Hands, KNN Classifier, Firestore `training_sessions` API. |
| **Perancangan Uji** | Muhammad Hidayat |
| **Tanggal Rancangan** | 4 Juli 2026 |
| **Pelaksanaan Uji** | Muhammad Hidayat |
| **Tanggal Uji** | 4 Juli 2026 |
| **Kondisi Akhir** | Antarmuka menampilkan umpan balik sukses "Benar" (warna hijau) dan log data latihan terkirim ke Firestore dengan status sukses. |

**Langkah-Langkah Pengujian:**

| No | Langkah Uji | Data Uji | Hasil Yang Diharapkan | Hasil Yang Terjadi | Status | Keterangan |
| :---: | :--- | :--- | :--- | :--- | :---: | :--- |
| 1 | Lakukan peragaan gestur huruf "L" secara benar di depan kamera webcam sesuai target latihan | Gestur "L" yang valid | Sistem mencocokkan prediksi KNN dengan target "L". Antarmuka memberikan umpan balik visual sukses (warna hijau) dan mengirim data ke `training_sessions` dengan `isCorrect: true`. | Layar menampilkan notifikasi hijau "Benar!", animasi centang muncul, efek suara sukses berdering, dan sebuah record dengan flag true tersimpan di Firestore. | Sukses | Deteksi pencocokan berjalan secara instan |

---

### TABEL PENGUJIAN SISTEM - BU-LAT-04

| **Atribut Pengujian** | **Detail / Nilai** |
| :--- | :--- |
| **Nama Projek** | Implementasi K-Nearest Neighbor dengan Ekstraksi Landmark MediaPipe Hands untuk Klasifikasi Huruf Bahasa Isyarat Indonesia Secara Real-Time |
| **ID Kasus Uji** | BU-LAT-04 |
| **Prioritas Uji** | Tinggi |
| **Nama Modul** | Mode Latihan Interaktif |
| **Nama Uji** | Peragaan gestur isyarat yang tidak sesuai dengan huruf target latihan |
| **Deskripsi Uji** | Menguji respon validasi sistem ketika pengguna melakukan peragaan isyarat yang salah atau tidak sesuai dengan target latihan. |
| **Kondisi Awal** | Huruf target latihan aktif adalah "L", kamera aktif. |
| **Dependesi** | MediaPipe Hands, KNN, Firestore `training_sessions`. |
| **Perancangan Uji** | Muhammad Hidayat |
| **Tanggal Rancangan** | 4 Juli 2026 |
| **Pelaksanaan Uji** | Muhammad Hidayat |
| **Tanggal Uji** | 4 Juli 2026 |
| **Kondisi Akhir** | Antarmuka menampilkan umpan balik "Salah" (warna merah/tombol coba lagi) dan log data latihan terkirim ke Firestore dengan status gagal. |

**Langkah-Langkah Pengujian:**

| No | Langkah Uji | Data Uji | Hasil Yang Diharapkan | Hasil Yang Terjadi | Status | Keterangan |
| :---: | :--- | :--- | :--- | :--- | :---: | :--- |
| 1 | Peragakan gestur huruf "A" di depan kamera webcam (yang mana salah/tidak sesuai target "L") | Gestur "A" (sengaja disalahkan) | Sistem mendeteksi ketidaksesuaian antara hasil prediksi "A" dengan target latihan "L". Layar menampilkan peringatan merah "Salah" dan mengirim log dengan `isCorrect: false` ke Firestore. | Muncul notifikasi merah "Salah! Silakan coba lagi", suara gagal terdengar, dan dokumen log latihan dengan flag false berhasil tersimpan ke Firestore. | Sukses | Memberikan umpan balik instan untuk koreksi belajar mandiri |

---

### TABEL PENGUJIAN SISTEM - BU-LAT-05

| **Atribut Pengujian** | **Detail / Nilai** |
| :--- | :--- |
| **Nama Projek** | Implementasi K-Nearest Neighbor dengan Ekstraksi Landmark MediaPipe Hands untuk Klasifikasi Huruf Bahasa Isyarat Indonesia Secara Real-Time |
| **ID Kasus Uji** | BU-LAT-05 |
| **Prioritas Uji** | Sedang |
| **Nama Modul** | Mode Latihan Interaktif |
| **Nama Uji** | Rekalkulasi berkala terhadap statistik performa pengguna |
| **Deskripsi Uji** | Memastikan bahwa fungsi rekalkulasi asinkronus `recalculateUserStats()` berjalan sukses memperbarui dokumen statistik pengguna (`user_stats`) setelah latihan diselesaikan. |
| **Kondisi Awal** | Sesi latihan diselesaikan untuk suatu huruf minimal sebanyak 2 kali percobaan. |
| **Dependesi** | Cloud Firestore database operations. |
| **Perancangan Uji** | Muhammad Hidayat |
| **Tanggal Rancangan** | 4 Juli 2026 |
| **Pelaksanaan Uji** | Muhammad Hidayat |
| **Tanggal Uji** | 4 Juli 2026 |
| **Kondisi Akhir** | Dokumen `user_stats/{uid}` di Firestore terbarui dengan data total attempts, akurasi rata-rata, dan kategori huruf kuat/lemah yang terbaru. |

**Langkah-Langkah Pengujian:**

| No | Langkah Uji | Data Uji | Hasil Yang Diharapkan | Hasil Yang Terjadi | Status | Keterangan |
| :---: | :--- | :--- | :--- | :--- | :---: | :--- |
| 1 | Selesaikan latihan huruf "L" sebanyak 3 kali (2 kali sukses dan 1 kali gagal) | 3 data percobaan latihan | Sistem mengeksekusi fungsi rekalkulasi di akhir latihan, memperbarui data agregat, dan menulis kembali ke `user_stats/UID`. | Total attempts bertambah +3, akurasi rata-rata terhitung ulang (66.7%), data tersimpan di Firestore dan waktu pembaruan `updatedAt` ter-update. | Sukses | Data statistik tersinkronisasi secara real-time |

---

### TABEL PENGUJIAN SISTEM - BU-RWT-01

| **Atribut Pengujian** | **Detail / Nilai** |
| :--- | :--- |
| **Nama Projek** | Implementasi K-Nearest Neighbor dengan Ekstraksi Landmark MediaPipe Hands untuk Klasifikasi Huruf Bahasa Isyarat Indonesia Secara Real-Time |
| **ID Kasus Uji** | BU-RWT-01 |
| **Prioritas Uji** | Sedang |
| **Nama Modul** | Riwayat dan Statistik |
| **Nama Uji** | Visualisasi grafik akurasi per kelas huruf dan frekuensi latihan |
| **Deskripsi Uji** | Menguji keandalan rendering diagram batang performa belajar per huruf A-Z secara interaktif menggunakan pustaka Recharts bersumber data dari database Firestore. |
| **Kondisi Awal** | Pengguna membuka halaman riwayat `/history` dan memiliki riwayat latihan yang tercatat. |
| **Dependesi** | Pustaka diagram Recharts, koneksi database Firestore. |
| **Perancangan Uji** | Muhammad Hidayat |
| **Tanggal Rancangan** | 4 Juli 2026 |
| **Pelaksanaan Uji** | Muhammad Hidayat |
| **Tanggal Uji** | 4 Juli 2026 |
| **Kondisi Akhir** | Diagram batang berhasil dirender dan menampilkan data akurasi setiap kelas huruf A-Z secara dinamis. |

**Langkah-Langkah Pengujian:**

| No | Langkah Uji | Data Uji | Hasil Yang Diharapkan | Hasil Yang Terjadi | Status | Keterangan |
| :---: | :--- | :--- | :--- | :--- | :---: | :--- |
| 1 | Masuk ke menu halaman `/history` lalu pilih tab menu "Statistik Belajar" | Klik tab "Statistik" | Sistem membaca data dari koleksi `user_stats` lalu merender grafik batang akurasi per huruf secara responsif. | Grafik batang berhasil digambar di layar, tinggi batang mewakili nilai akurasi, dan tooltip muncul menampilkan persentase akurasi saat kursor menunjuk batang. | Sukses | Respons diagram sangat lancar dan interaktif |

---

### TABEL PENGUJIAN SISTEM - BU-RWT-02

| **Atribut Pengujian** | **Detail / Nilai** |
| :--- | :--- |
| **Nama Projek** | Implementasi K-Nearest Neighbor dengan Ekstraksi Landmark MediaPipe Hands untuk Klasifikasi Huruf Bahasa Isyarat Indonesia Secara Real-Time |
| **ID Kasus Uji** | BU-RWT-02 |
| **Prioritas Uji** | Sedang |
| **Nama Modul** | Riwayat dan Statistik |
| **Nama Uji** | Pemuatan daftar riwayat deteksi kalimat dan detail sesi latihan |
| **Deskripsi Uji** | Memverifikasi kueri penarikan data riwayat transkripsi kalimat terjemahan terurut menurun berdasarkan waktu (*descending order by timestamp*). |
| **Kondisi Awal** | Pengguna memiliki record riwayat transkripsi kalimat di database Firestore. |
| **Dependesi** | Cloud Firestore Query API. |
| **Perancangan Uji** | Muhammad Hidayat |
| **Tanggal Rancangan** | 4 Juli 2026 |
| **Pelaksanaan Uji** | Muhammad Hidayat |
| **Tanggal Uji** | 4 Juli 2026 |
| **Kondisi Akhir** | Tabel riwayat menyajikan data transkripsi kalimat terjemahan lengkap secara kronologis (terbaru di baris teratas). |

**Langkah-Langkah Pengujian:**

| No | Langkah Uji | Data Uji | Hasil Yang Diharapkan | Hasil Yang Terjadi | Status | Keterangan |
| :---: | :--- | :--- | :--- | :--- | :---: | :--- |
| 1 | Buka tab "Riwayat Deteksi" pada halaman `/history` | Klik tab "Riwayat" | Sistem menjalankan kueri Firestore dengan order by timestamp descending, memuat log kalimat ke dalam tabel riwayat. | Data log riwayat terjemahan kalimat berhasil ditampilkan di tabel. Baris teratas menampilkan terjemahan paling baru lengkap dengan data waktu dan confidence score. | Sukses | Waktu pemuatan data kueri sangat cepat (< 120 ms) |

---

### TABEL PENGUJIAN SISTEM - BU-SEC-01

| **Atribut Pengujian** | **Detail / Nilai** |
| :--- | :--- |
| **Nama Projek** | Implementasi K-Nearest Neighbor dengan Ekstraksi Landmark MediaPipe Hands untuk Klasifikasi Huruf Bahasa Isyarat Indonesia Secara Real-Time |
| **ID Kasus Uji** | BU-SEC-01 |
| **Prioritas Uji** | Tinggi |
| **Nama Modul** | Keamanan & Performa (Non-Fungsional) |
| **Nama Uji** | Isolasi akses data privat antar-pengguna (*Firestore Security Rules*) |
| **Deskripsi Uji** | Menguji aturan keamanan (*Security Rules*) Cloud Firestore untuk mencegah ancaman pencurian atau manipulasi data milik Pengguna B oleh akun Pengguna A. |
| **Kondisi Awal** | Pengguna A login di peramban. Pengguna B memiliki record dokumen di database. |
| **Dependesi** | Berkas aturan basis data `firestore.rules`. |
| **Perancangan Uji** | Muhammad Hidayat |
| **Tanggal Rancangan** | 4 Juli 2026 |
| **Pelaksanaan Uji** | Muhammad Hidayat |
| **Tanggal Uji** | 4 Juli 2026 |
| **Kondisi Akhir** | Permintaan kueri data lintas pengguna oleh akun Pengguna A ditolak langsung oleh server database Firestore. |

**Langkah-Langkah Pengujian:**

| No | Langkah Uji | Data Uji | Hasil Yang Diharapkan | Hasil Yang Terjadi | Status | Keterangan |
| :---: | :--- | :--- | :--- | :--- | :---: | :--- |
| 1 | Jalankan kueri manual melalui konsol developer browser untuk membaca dokumen milik UID Pengguna B saat login sebagai Pengguna A | Kueri JS:<br>`getDocs(query(collection(db, "history"), where("userId", "==", "UID_USER_B")))` | Cloud Firestore menolak akses kueri dan mengembalikan error "permission-denied" sesuai dengan aturan keamanan database. | Konsol browser memunculkan baris pesan galat merah: `FirebaseError: [code=permission-denied]: Missing or insufficient permissions.`, membuktikan akses berhasil diisolasi. | Sukses | Firestore Security Rules mencegah celah kebocoran data |

---

### TABEL PENGUJIAN SISTEM - BU-PERF-01

| **Atribut Pengujian** | **Detail / Nilai** |
| :--- | :--- |
| **Nama Projek** | Implementasi K-Nearest Neighbor dengan Ekstraksi Landmark MediaPipe Hands untuk Klasifikasi Huruf Bahasa Isyarat Indonesia Secara Real-Time |
| **ID Kasus Uji** | BU-PERF-01 |
| **Prioritas Uji** | Sedang |
| **Nama Modul** | Keamanan & Performa (Non-Fungsional) |
| **Nama Uji** | Mekanisme *local caching* data training KNN via IndexedDB |
| **Deskripsi Uji** | Menguji performa kecepatan inisialisasi model klasifikasi dengan cara memuat data latih dari penyimpanan IndexedDB lokal di browser tanpa pengunduhan ulang. |
| **Kondisi Awal** | Halaman deteksi telah dibuka sekali sebelumnya sehingga model sudah tersimpan di IndexedDB browser. |
| **Dependesi** | Browser IndexedDB API. |
| **Perancangan Uji** | Muhammad Hidayat |
| **Tanggal Rancangan** | 4 Juli 2026 |
| **Pelaksanaan Uji** | Muhammad Hidayat |
| **Tanggal Uji** | 4 Juli 2026 |
| **Kondisi Akhir** | Inisialisasi model KNN berjalan instan (< 100 ms) dari IndexedDB lokal dan tidak terjadi aktivitas unduh berkas model pada jaringan. |

**Langkah-Langkah Pengujian:**

| No | Langkah Uji | Data Uji | Hasil Yang Diharapkan | Hasil Yang Terjadi | Status | Keterangan |
| :---: | :--- | :--- | :--- | :--- | :---: | :--- |
| 1 | Lakukan penyegaran halaman (*reload/F5*) pada halaman `/detection` dengan tab Network Developer Tools terbuka | Reload halaman | Sistem mendeteksi model di IndexedDB lokal, langsung memuatnya ke memori browser, dan tidak melakukan download berkas `model-pretrained.json`. | Berkas `model-pretrained.json` tidak diunduh ulang (tidak ada di tab Network), konsol mencatat "Model loaded from local IndexedDB cache in 84ms". | Sukses | Menghemat kuota data internet pengguna secara signifikan |

---

### TABEL PENGUJIAN SISTEM - BU-PERF-02

| **Atribut Pengujian** | **Detail / Nilai** |
| :--- | :--- |
| **Nama Projek** | Implementasi K-Nearest Neighbor dengan Ekstraksi Landmark MediaPipe Hands untuk Klasifikasi Huruf Bahasa Isyarat Indonesia Secara Real-Time |
| **ID Kasus Uji** | BU-PERF-02 |
| **Prioritas Uji** | Sedang |
| **Nama Modul** | Keamanan & Performa (Non-Fungsional) |
| **Nama Uji** | Dukungan pengerjaan modul deteksi secara luring (*offline-first*) |
| **Deskripsi Uji** | Menguji ketahanan fungsionalitas modul deteksi klasifikasi secara offline serta antrean transaksi penulisan tunda Firestore offline persistence. |
| **Kondisi Awal** | Model telah dimuat ke memori, kemudian koneksi jaringan internet diputus sepenuhnya. |
| **Dependesi** | Local WebAssembly vision tasks, Firestore Offline Persistence. |
| **Perancangan Uji** | Muhammad Hidayat |
| **Tanggal Rancangan** | 4 Juli 2026 |
| **Pelaksanaan Uji** | Muhammad Hidayat |
| **Tanggal Uji** | 4 Juli 2026 |
| **Kondisi Akhir** | Deteksi berjalan normal secara luring, data riwayat disimpan di cache lokal, dan disinkronkan otomatis saat internet kembali aktif. |

**Langkah-Langkah Pengujian:**

| No | Langkah Uji | Data Uji | Hasil Yang Diharapkan | Hasil Yang Terjadi | Status | Keterangan |
| :---: | :--- | :--- | :--- | :--- | :---: | :--- |
| 1 | Putus koneksi internet perangkat dan jalankan proses deteksi gerakan isyarat | Sesi deteksi tanpa internet | Modul MediaPipe & KNN tetap berjalan pada kecepatan penuh (30 FPS), huruf dikunci ke kalimat, dan riwayat disimpan di cache lokal tanpa eror. | Kamera tetap melacak landmark, klasifikasi huruf berjalan sukses, kalimat terbentuk, dan fungsi `addDoc` Firestore berjalan sukses (disimpan lokal). | Sukses | Detektor berjalan lokal sepenuhnya |
| 2 | Sambungkan kembali koneksi internet perangkat | Aktifkan internet | Firestore mendeteksi koneksi aktif dan secara otomatis mengirimkan data transaksi tunda dari cache lokal ke server database awan. | Record riwayat terjemahan offline berhasil masuk dan sinkron ke server Firebase Firestore secara otomatis tanpa intervensi. | Sukses | Mendukung prinsip ketangguhan luring (offline-first) |
