# Draf BAB V (Implementasi) — Subbab 5.1

Dokumen ini berisi draf penulisan **BAB V (Implementasi) Subbab 5.1** dalam format bahasa Indonesia ilmiah untuk skripsi Anda. 

Dokumen ini dibagi menjadi dua bagian:
1. **Opsi 1: Adaptasi untuk Proyek Anda** (Sesuai dengan tech stack aktual proyek Anda: Next.js, TypeScript, KNN, MediaPipe Hands, Tailwind CSS, Firebase). **[Direkomendasikan]**
2. **Opsi 2: Transkripsi Harfiah (Literal)** (Persis sesuai dengan teks yang tertera pada foto buku/laporan yang Anda lampirkan, yang menggunakan LSTM, Flask, Bootstrap, MediaPipe Holistic).

---

## Opsi 1: Adaptasi Sesuai Proyek Anda (Next.js + KNN + MediaPipe Hands)

### BAB V
### IMPLEMENTASI

Bab ini menyajikan proses implementasi dari rancangan yang telah dibuat pada bab sebelumnya. Implementasi dilakukan dengan merealisasikan desain arsitektur, basis data, serta antarmuka ke dalam bentuk aplikasi yang dapat dijalankan secara langsung oleh pengguna. Pada bagian ini juga dijelaskan integrasi sistem pendeteksi isyarat yang terdiri dari *framework* MediaPipe Hands untuk ekstraksi landmark titik koordinat tangan, algoritma K-Nearest Neighbor (KNN) berbasis *client-side* untuk klasifikasi alfabet Bahasa Isyarat Indonesia (BISINDO), serta Cloud Firestore sebagai media penyimpanan riwayat pengujian dan data pengguna.

#### 5.1 Lingkungan Implementasi
Lingkungan implementasi merupakan sarana perangkat keras (*hardware*) dan perangkat lunak (*software*) yang digunakan dalam proses pengembangan serta pengujian sistem. Sistem yang dikembangkan adalah sebuah aplikasi berbasis web *real-time* untuk mengklasifikasi huruf/alfabet Bahasa Isyarat Indonesia (BISINDO) menggunakan metode MediaPipe Hands untuk ekstraksi fitur berupa koordinat landmark tangan dan algoritma K-Nearest Neighbor (KNN) untuk klasifikasi huruf dari hasil ekstraksi fitur tersebut.

##### 5.1.1 Perangkat Keras (Hardware)
Perangkat keras yang digunakan dalam pengembangan dan pengujian sistem ini memiliki spesifikasi sebagai berikut:
1. **Laptop ASUS** dengan spesifikasi:
   - *Processor*: Intel Core i3
   - *Random Access Memory (RAM)*: 12 GB
   - *Penyimpanan*: SSD 239 GB dan HDD 932 GB
2. **Kamera Web (Webcam)** internal laptop sebagai sensor penangkap citra tangan secara *real-time*.
3. **Jaringan Internet** untuk memuat model MediaPipe secara daring (*online*) serta melakukan sinkronisasi data dengan Firebase.

##### 5.1.2 Perangkat Lunak (Software)
Perangkat lunak yang digunakan dalam proses perancangan, pengembangan, dan pengujian sistem adalah sebagai berikut:
1. **Sistem Operasi**: Windows 10 / Windows 11 (64-bit) sebagai lingkungan pengembangan utama.
2. **Bahasa Pemrograman**:
   - **TypeScript / JavaScript**: Digunakan untuk menulis logika aplikasi, kalkulasi matematika algoritma KNN di sisi klien, dan rendering antarmuka pengguna.
   - **Python 3.10**: Digunakan untuk tahap *offline preprocessing* dataset gambar tangan dari Kaggle guna mengekstrak nilai landmark menjadi berkas data training (`model-pretrained.json`).
3. **Integrated Development Environment (IDE)**: Visual Studio Code sebagai editor kode program.
4. **Editor Gambar & Diagram**: Draw.io untuk perancangan diagram alur (*flowchart*), *use case*, dan arsitektur sistem.
5. **Framework Frontend**: Next.js 16.2.9 (App Router) berbasis React 19 untuk membangun antarmuka web yang interaktif dan responsif.
6. **Styling & CSS Framework**: Tailwind CSS v4 untuk penataan gaya (styling) antarmuka pengguna.
7. **Library Machine Learning / Computer Vision**:
   - **@mediapipe/tasks-vision (WASM)**: Library utama di sisi klien untuk mendeteksi 21 titik koordinat landmark tangan secara *real-time*.
   - **mediapipe (Python)**: Library untuk ekstraksi landmark tangan pada tahap *preprocessing* dataset secara *offline*.
8. **Library Visualisasi Data**: Recharts v3.9.1 untuk menampilkan grafik metrik evaluasi model (seperti bar chart akurasi per kelas huruf).
9. **Database & Backend Services**: Cloud Firestore (Firebase) untuk menyimpan riwayat sesi latihan dan data pengguna.
10. **Firebase SDK**: Firebase SDK Client v12.15.0 untuk integrasi otentikasi pengguna (*authentication*) dan basis data Firestore.
11. **Peramban Web (Browser)**: Google Chrome sebagai lingkungan pengujian aplikasi web dan konsol pengembang (*developer tools*).
12. **Dokumentasi & Laporan**: Microsoft Office 2019 / Microsoft Word untuk penyusunan laporan skripsi.

---

## Opsi 2: Transkripsi Harfiah dari Gambar (LSTM + Flask + Bootstrap)

### BAB V
### IMPLEMENTASI

Bab ini menyajikan proses implementasi dari rancangan yang telah dibuat pada bab sebelumnya. Implementasi dilakukan dengan merealisasikan desain arsitektur, basis data, serta antarmuka ke dalam bentuk aplikasi yang dapat dijalankan. Pada bagian ini juga dijelaskan integrasi model machine learning yang terdiri dari MediaPipe Holistic sebagai ekstraksi fitur, LSTM untuk pemodelan sekuensial, serta NLP berbasis aturan untuk penyusunan hasil terjemahan. Selain itu, dijelaskan pula bagaimana sistem diintegrasikan dengan platform web sehingga dapat digunakan oleh pengguna secara langsung.

#### 5.1 Lingkungan Implementasi
Lingkungan implementasi merupakan sarana perangkat keras (hardware) dan perangkat lunak (software) yang digunakan dalam proses pengembangan dan pengujian sistem. Sistem yang dikembangkan adalah sebuah aplikasi berbasis web untuk menerjemahkan Bahasa Isyarat Indonesia menggunakan metode MediaPipe Holistic untuk ekstraksi fitur, Long Short-Term Memory untuk klasifikasi gestur, dan Natural Language Processing berbasis aturan untuk membentuk kalimat dari hasil prediksi.

##### 5.1.1 Perangkat Keras (Hardware)
Perangkat keras yang digunakan dalam pengembangan sistem ini memiliki spesifikasi sebagai berikut:
1. Laptop ASUS (Processor Intel Core i3, RAM 12 GB, Storage 239 GB SSD dan 932 GB HDD)
2. Jaringan internet

##### 5.1.2 Perangkat Lunak (Software)
Berikut adalah perangkat lunak yang digunakan dalam pengembangan sistem:
1. Sistem Operasi : Windows 10 (64-bit)
2. Bahasa Pemrograman : Python 3.10.8
3. IDE : Visual Studio Code
4. Image Editor : Draw.io
5. Framework Backend : Flask 3.0.3
6. Framework Machine learning : TensorFlow 2.18.0, Keras 2.18.0
7. Library Landmark Detection : Mediapipe 0.10.21
8. Firebase SDK : Firebase-admin==6.5.0, Google-cloud-firestore==2.15.0
9. Frontend : HTML5, CSS3, Javascript (ES6), Bootstrap
10. Database : Cloud Firestore (Firebase)
11. Penyimpanan Video : Cloudinary
12. Browser : Google Chrome
13. Office Tool : Microsoft Office 2019
