# Draf BAB V (Implementasi) — Subbab 5.2.8

### 5.2.8 Integrasi Cloud Firestore

Untuk memfasilitasi kebutuhan penyimpanan persisten dan pelacakan perkembangan belajar pengguna secara *real-time*, sistem diintegrasikan dengan **Cloud Firestore** dari Firebase. Cloud Firestore dipilih karena merupakan basis data berjenis NoSQL dokumen berbasis awan (*cloud database*) yang memiliki skalabilitas tinggi, kompatibilitas integrasi langsung dengan pustaka klien JavaScript, serta mendukung sinkronisasi data asinkronus secara instan.

Berikut adalah pembahasan mengenai integrasi basis data Cloud Firestore pada sistem:

#### A. Struktur Koleksi Firestore (Skema Database)
Cloud Firestore tidak menggunakan baris dan kolom seperti pada basis data relasional tradisional. Firestore menyimpan data dalam bentuk dokumen (*documents*) yang dikelompokkan ke dalam wadah koleksi (*collections*). 

Pada sistem ini, diimplementasikan tiga buah koleksi utama untuk mengelola seluruh data pengguna:

1.  **Koleksi `history`**: Menyimpan riwayat log hasil transkripsi alfabet BISINDO yang terdeteksi stabil di halaman penerjemah. Dokumen pada koleksi ini memiliki skema atribut:
    *   `userId` (String): Pengenal unik akun pengguna yang terotentikasi.
    *   `sessionId` (String): ID acak yang mengelompokkan kata/kalimat dalam satu sesi deteksi.
    *   `letter` (String): Karakter huruf BISINDO yang berhasil diidentifikasi secara stabil.
    *   `confidence` (Number): Persentase skor keyakinan hasil klasifikasi KNN.
    *   `timestamp` (ServerTimestamp): Waktu perekaman dari server Firebase.

2.  **Koleksi `training_sessions`**: Mencatat log aktivitas setiap kali pengguna memperagakan isyarat pada modul latihan mandiri. Atributnya meliputi:
    *   `userId` (String): ID pengenal pengguna.
    *   `targetLetter` (String): Huruf alfabet yang diinstruksikan oleh sistem.
    *   `predictedLetter` (String): Huruf hasil deteksi tangan dan klasifikasi KNN.
    *   `isCorrect` (Boolean): Status kebenaran peragaan (`true` jika tebakan KNN sama dengan target, `false` jika salah).
    *   `confidence` (Number): Persentase keyakinan model klasifikasi.
    *   `timestamp` (ServerTimestamp): Waktu pencatatan sesi latihan.

3.  **Koleksi `user_stats`**: Menyimpan ringkasan data agregat statistik performa belajar pengguna. Data ini diperbarui secara otomatis menggunakan fungsi rekalkulasi asinkronus. Skema atributnya terdiri dari:
    *   `userId` (String): ID pengguna sebagai kunci pencarian utama.
    *   `overallAccuracy` (Number): Rasio jawaban benar dibanding total frekuensi latihan.
    *   `weakLetters` (Array of String): Daftar huruf yang memiliki akurasi di bawah 60% (setelah minimal dilatih sebanyak 2 kali) sebagai anjuran huruf untuk dilatih kembali.
    *   `strongLetters` (Array of String): Daftar huruf dengan akurasi di atas atau sama dengan 90% (setelah minimal dilatih sebanyak 2 kali).
    *   `totalAttempts` (Number): Jumlah total percobaan latihan yang telah dilakukan.
    *   `updatedAt` (ServerTimestamp): Waktu pembaruan statistik terakhir dari server.

> **Rekomendasi Gambar Pendukung:**
>
> [Gambar 5.19: Tangkapan Layar Konsol Database Firebase Firestore Menampilkan Struktur Koleksi dan Contoh Dokumen 'history']
> 
> [Gambar 5.20: Tangkapan Layar Konsol Database Firebase Firestore Menampilkan Struktur Koleksi dan Contoh Dokumen 'user_stats']

#### B. Penyimpanan Hasil Deteksi dan Riwayat Pengguna
Penyimpanan log hasil deteksi ke Firestore dilakukan menggunakan operasi tulis asinkronus. Sistem memanggil fungsi `saveDetectionHistory()` untuk menulis log transkripsi huruf stabil secara otomatis saat pengguna melakukan penerjemahan di halaman deteksi. 

Fungsi penulisan data memanfaatkan Firebase SDK Client v9 berbasis modul, di antaranya fungsi `collection()` untuk menunjuk target koleksi dan fungsi `addDoc()` untuk menyisipkan dokumen baru. Untuk mencatat waktu secara akurat tanpa terpengaruh oleh perbedaan setelan zona waktu pada perangkat keras klien, atribut waktu diatur secara dinamis menggunakan nilai `serverTimestamp()`.

#### C. Pengambilan Data (*Querying*)
Untuk menyajikan data riwayat dan dashboard secara dinamis, sistem melakukan penarikan data (*querying*) dari Firestore. 
*   **Pengambilan Riwayat**: Sistem mengeksekusi fungsi `getUserHistory()` untuk menarik log transkripsi pengguna dengan filter pencocokan `where("userId", "==", userId)`. Data yang ditarik kemudian diurutkan secara menurun (*descending*) berdasarkan atribut `timestamp` agar transkripsi terbaru ditampilkan di baris paling atas pada tabel riwayat.
*   **Sinkronisasi Real-time**: Pemanfaatan SDK Firestore mempermudah integrasi pengambilan data asinkronus langsung ke *React State*, sehingga data riwayat yang baru saja tersimpan saat penerjemahan akan langsung termuat secara instan di antarmuka pengguna tanpa memicu pemuatan ulang halaman (*reload page*).

#### D. Rekalkulasi dan Sinkronisasi Statistik Belajar
Untuk menghitung performa belajar pengguna tanpa membebani biaya pembacaan (*read calls*) database secara berlebihan, diimplementasikan mekanisme agregasi asinkronus. Setiap kali pengguna selesai menjawab sebuah peragaan huruf pada modul latihan, sistem mengeksekusi fungsi `saveTrainingAttempt()` diikuti dengan memicu fungsi rekalkulasi asinkronus `recalculateUserStats()`.

Logika rekalkulasi statistik berjalan dengan tahapan berikut:
1.  **Pengambilan Sesi Latihan**: Mengunduh seluruh dokumen latihan milik pengguna dari koleksi `training_sessions`.
2.  **Pemetaan Per Huruf**: Menghitung jumlah peragaan benar (*correct*) dan frekuensi percobaan (*total*) secara individual untuk setiap alfabet A-Z.
3.  **Klasifikasi Huruf Kuat dan Lemah**: Menganalisis tingkat akurasi huruf. Guna menghindari bias data pada awal percobaan, huruf hanya akan dikategorikan jika telah dicoba minimal sebanyak 2 kali (`total >= 2`):
    *   Jika nilai akurasi di bawah 60% ($< 0.6$), huruf dimasukkan ke dalam daftar huruf lemah (`weakLetters`).
    *   Jika nilai akurasi di atas atau sama dengan 90% ($\ge 0.9$), huruf dimasukkan ke dalam daftar huruf kuat (`strongLetters`).
4.  **Pembaruan Agregat**: Menghitung rasio akurasi keseluruhan dan menuliskan seluruh objek agregat statistik tersebut ke dalam koleksi `user_stats` dengan fungsi `updateUserStats()` menggunakan operasi `.setDoc()` dengan parameter `{ merge: true }` agar tidak menimpa atribut data lainnya.

Implementasi lengkap kode integrasi Cloud Firestore dan skrip rekalkulasi statistik belajar disajikan pada Kode Program 5.29.

```typescript
// Kode Program 5.29 Operasi Database Firestore dan Rekalkulasi Statistik (src/lib/firebase/firestore.ts, src/lib/stats/updateStats.ts)

// 1. Fungsi Database Firestore (src/lib/firebase/firestore.ts)
import { db } from "./config";
import {
  collection,
  addDoc,
  doc,
  setDoc,
  query,
  where,
  getDocs,
  serverTimestamp,
} from "firebase/firestore";

// Menyimpan log riwayat penerjemah
export async function saveDetectionHistory(
  userId: string,
  sessionId: string,
  letter: string,
  confidence: number
) {
  await addDoc(collection(db, "history"), {
    userId,
    sessionId,
    letter,
    confidence,
    timestamp: serverTimestamp(),
  });
}

// Menyimpan log sesi latihan mandiri
export async function saveTrainingAttempt(
  userId: string,
  targetLetter: string,
  predictedLetter: string,
  isCorrect: boolean,
  confidence: number
) {
  await addDoc(collection(db, "training_sessions"), {
    userId,
    targetLetter,
    predictedLetter,
    isCorrect,
    confidence,
    timestamp: serverTimestamp(),
  });
}

// Memperbarui profil statistik agregat di Firestore
export async function updateUserStats(
  userId: string,
  stats: {
    overallAccuracy: number;
    weakLetters: string[];
    strongLetters: string[];
    totalAttempts: number;
  }
) {
  await setDoc(
    doc(db, "user_stats", userId),
    {
      userId,
      ...stats,
      updatedAt: serverTimestamp(),
    },
    { merge: true } // Parameter penggabungan agar data tidak terhapus
  );
}

// 2. Fungsi Rekalkulasi Asinkronus Statistik Belajar (src/lib/stats/updateStats.ts)
import { getUserTrainingSessions } from "../firebase/firestore";

export async function recalculateUserStats(userId: string): Promise<void> {
  // Ambil semua log latihan milik pengguna
  const sessions = await getUserTrainingSessions(userId);

  if (sessions.length === 0) {
    await updateUserStats(userId, {
      overallAccuracy: 0,
      weakLetters: [],
      strongLetters: [],
      totalAttempts: 0,
    });
    return;
  }

  // Hitung jumlah benar dan total percobaan untuk setiap alfabet
  const perLetter: Record<string, { correct: number; total: number }> = {};
  for (const s of sessions) {
    const target = s.targetLetter;
    if (!perLetter[target]) {
      perLetter[target] = { correct: 0, total: 0 };
    }
    perLetter[target].total++;
    if (s.isCorrect) perLetter[target].correct++;
  }

  const weakLetters: string[] = [];
  const strongLetters: string[] = [];

  // Kategorikan huruf kuat dan huruf lemah (minimal dicoba 2 kali)
  for (const [letter, { correct, total }] of Object.entries(perLetter)) {
    const acc = correct / total;
    if (total >= 2) {
      if (acc < 0.6) {
        weakLetters.push(letter); // Akurasi di bawah 60%
      } else if (acc >= 0.9) {
        strongLetters.push(letter); // Akurasi di atas 90%
      }
    }
  }

  const overallCorrect = sessions.filter((s) => s.isCorrect).length;
  
  // Kirim data pembaruan agregat terbaru ke Firestore
  await updateUserStats(userId, {
    overallAccuracy: overallCorrect / sessions.length,
    weakLetters,
    strongLetters,
    totalAttempts: sessions.length,
  });
}
```
