# 📖 Panduan Lengkap Konfigurasi Firebase untuk Pemula

Dokumen ini memandu Anda langkah demi langkah untuk mengonfigurasi Firebase pada proyek **Deteksi Alfabet BISINDO**. Panduan ini ditulis secara sederhana khusus untuk Anda yang baru pertama kali menggunakan Firebase.

---

## 🔍 Mengenal Komponen Firebase yang Kita Gunakan

Dalam skripsi ini, kita menggunakan dua layanan utama dari Firebase:
1. **Firebase Authentication (Auth)**: Digunakan untuk mengelola pendaftaran (*register*) dan masuk (*login*) pengguna secara aman (baik menggunakan Email/Password maupun Akun Google).
2. **Cloud Firestore**: Database NoSQL berbasis awan (*cloud*) untuk menyimpan riwayat deteksi, sesi latihan, dan nilai statistik akurasi Anda secara real-time.

---

## 🛠️ Langkah Demi Langkah Konfigurasi

### Langkah 1: Registrasi & Membuat Proyek Baru
1. Buka browser Anda dan masuk ke **[Firebase Console](https://console.firebase.google.com/)**.
2. Masuk menggunakan akun Google Anda.
3. Klik tombol **"Add project"** (atau **"Create a project"**).
4. Masukkan nama proyek Anda: `bisindo-detector` (atau nama lain bebas). Klik **Continue**.
5. Pada bagian *Google Analytics*, geser tombol ke posisi **Disabled** (tidak aktif) agar proses pembuatan proyek lebih cepat dan ringkas. Klik **Create project**.
6. Tunggu sekitar 10-15 detik hingga database siap di awan, lalu klik **Continue**.

---

### Langkah 2: Mendaftarkan Aplikasi Web & Mengambil Kredensial
Firebase adalah layanan multi-platform. Kita perlu memberi tahu Firebase bahwa kita ingin menghubungkannya ke aplikasi web Next.js kita:
1. Di halaman utama proyek Anda (Dashboard), cari tombol dengan ikon **Web (`</>`)** di bagian tengah. Klik ikon tersebut.
2. Masukkan nama panggilan aplikasi Anda, misalnya: `bisindo-app-web`.
3. Biarkan opsi *Firebase Hosting* tidak dicentang (karena kita akan deploy ke Vercel nanti). Klik **Register app**.
4. Firebase akan menampilkan baris kode konfigurasi. Anda hanya membutuhkan bagian di dalam objek `firebaseConfig`, seperti ini:
   ```javascript
   const firebaseConfig = {
     apiKey: "AIzaSyA123_contoh_api_key...",
     authDomain: "bisindo-detector.firebaseapp.com",
     projectId: "bisindo-detector",
     storageBucket: "bisindo-detector.appspot.com",
     messagingSenderId: "1234567890",
     appId: "1:1234567890:web:abcd1234efgh"
   };
   ```
5. Buka berkas **[.env.local](file:///c:/Users/Hewlett-Packard/Desktop/portofoolio/bismillah%20jadi/bisindo-detector/.env.local)** di VS Code proyek Anda.
6. Salin nilai-nilai string tersebut ke dalam berkas `.env.local` seperti di bawah ini (pastikan tanpa tanda kutip di Next.js env):
   ```env
   NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSyA123_contoh_api_key...
   NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=bisindo-detector.firebaseapp.com
   NEXT_PUBLIC_FIREBASE_PROJECT_ID=bisindo-detector
   NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=bisindo-detector.appspot.com
   NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=1234567890
   NEXT_PUBLIC_FIREBASE_APP_ID=1:1234567890:web:abcd1234efgh
   ```
7. Simpan berkas `.env.local` tersebut (**Ctrl + S**).

---

### Langkah 3: Mengaktifkan Layanan Login (Authentication)
Kita perlu mengizinkan pengguna untuk mendaftar dan masuk ke aplikasi:
1. Di menu navigasi sebelah kiri Firebase Console, klik **Build** lalu pilih **Authentication**.
2. Klik tombol **Get started**.
3. Anda akan diarahkan ke tab **Sign-in method**. Di sini kita akan mengaktifkan dua metode:
   - **Email/Password**:
     * Klik baris **Email/Password** di bagian *Native providers*.
     * Geser tombol **Enable** pada baris pertama ke posisi aktif.
     * Klik **Save**.
   - **Google (Google Sign-In)**:
     * Klik tombol **Add new provider**, lalu pilih **Google**.
     * Geser tombol **Enable** ke posisi aktif.
     * Di kolom *Project support email*, pilih alamat email Google Anda dari daftar pilihan.
     * Klik **Save**.

---

### Langkah 4: Membuat Database Firestore & Mengamankannya
1. Di menu navigasi sebelah kiri Firebase Console, klik **Build** lalu pilih **Firestore Database**.
2. Klik tombol **Create database**.
3. **Database location**: Pilih region terdekat dengan pengguna. Kami menyarankan **`asia-southeast2`** (region Jakarta) atau **`asia-southeast1`** (Singapore) agar koneksi sangat cepat. Klik **Next**.
4. **Security rules**: Pilih **Start in production mode** (sangat disarankan agar data aman sejak awal). Klik **Create**.
5. Tunggu beberapa detik hingga database selesai disiapkan.
6. Setelah database tampil di layar, klik tab **Rules** di bagian atas menu Firestore Database Anda.
7. Di kotak editor aturan keamanan tersebut, hapus seluruh aturan bawaan, lalu salin dan tempelkan aturan di bawah ini:
   ```rules
   rules_version = '2';

   service cloud.firestore {
     match /databases/{database}/documents {

       // Koleksi 'users': setiap user hanya bisa membaca dan menulis data profilnya sendiri
       match /users/{userId} {
         allow read, write: if request.auth != null && request.auth.uid == userId;
       }

       // Koleksi 'history': riwayat deteksi huruf real-time
       match /history/{docId} {
         allow read: if request.auth != null && request.auth.uid == resource.data.userId;
         allow create: if request.auth != null && request.auth.uid == request.resource.data.userId;
         allow update, delete: if false; // Riwayat tidak boleh diubah atau dihapus (append-only)
       }

       // Koleksi 'training_sessions': riwayat latihan tebak isyarat huruf
       match /training_sessions/{docId} {
         allow read: if request.auth != null && request.auth.uid == resource.data.userId;
         allow create: if request.auth != null && request.auth.uid == request.resource.data.userId;
         allow update, delete: if false; // Riwayat latihan bersifat permanen untuk statistik
       }

       // Koleksi 'user_stats': ringkasan statistik per-pengguna
       match /user_stats/{userId} {
         allow read, write: if request.auth != null && request.auth.uid == userId;
       }
     }
   }
   ```
8. Klik tombol **Publish** di pojok kanan atas halaman aturan tersebut untuk menerapkan tingkat keamanan data ini.

---

## 🧪 Menguji Hasil Konfigurasi
Setelah konfigurasi di atas selesai:
1. Jalankan aplikasi web lokal Anda:
   ```bash
   cd bisindo-detector
   npm run dev
   ```
2. Buka `http://localhost:3000` di browser.
3. Klik tombol **Mulai Belajar & Deteksi**.
4. Coba lakukan pendaftaran akun baru pada halaman **Daftar Sekarang** menggunakan Email & Password asal/baru.
5. Jika pendaftaran berhasil dan Anda dialihkan ke halaman **Dashboard**, maka konfigurasi Firebase Anda **100% SUKSES!**
6. Anda bisa memeriksa Firestore Database di konsol Firebase Anda; Anda akan melihat koleksi baru bernama `users` secara otomatis terbuat beserta ID akun unik Anda.
