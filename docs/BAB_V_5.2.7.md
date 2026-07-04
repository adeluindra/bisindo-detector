# Draf BAB V (Implementasi) — Subbab 5.2.7

### 5.2.7 Implementasi Antarmuka Sistem

Implementasi antarmuka pengguna (*frontend*) dari sistem penerjemah Bahasa Isyarat Indonesia (BISINDO) dibangun menggunakan framework **Next.js** berbasis React dengan memanfaatkan konsep *App Router* dan didesain secara modern menggunakan Tailwind CSS. Seluruh elemen antarmuka dirancang untuk mempermudah navigasi, menyajikan umpan balik visual secara real-time, serta menampilkan metrik visualisasi evaluasi secara dinamis.

Berikut adalah penjelasan mengenai tujuan, fitur utama, dan susunan visual dari lima modul antarmuka utama sistem:

---

#### 5.2.7.1 Landing Page (Halaman Utama)
*Landing Page* merupakan halaman pintu gerbang utama yang diakses oleh pengguna saat pertama kali membuka tautan situs web aplikasi. 
*   **Tujuan Halaman**: Memperkenalkan aplikasi kepada publik, memaparkan kegunaan sistem deteksi BISINDO, dan membimbing pengguna baru untuk masuk ke modul latihan atau penerjemah.
*   **Fitur Utama**:
    *   *Hero Section*: Judul utama aplikasi penangkap isyarat BISINDO yang dirancang dengan warna gradien modern berbasis *Tailwind CSS*.
    *   *Aksi Navigasi (Call-to-Action)*: Tombol interaktif untuk langsung mengarahkan pengguna ke halaman pendaftaran (*register*) atau halaman masuk (*login*).
    *   *Kartu Informasi Fitur*: Kolom kartu informasi interaktif yang menjabarkan fitur penerjemahan real-time, modul latihan mandiri, dan visualisasi grafik evaluasi akurasi model.

> **Rekomendasi Gambar Pendukung:**
>
> [Gambar 5.14: Tangkapan Layar Tampilan Landing Page Halaman Awal Aplikasi Web Penerjemah BISINDO]

---

#### 5.2.7.2 Dashboard (Halaman Panel Kontrol Pengguna)
*Dashboard* (/dashboard) merupakan panel kontrol utama yang ditujukan khusus bagi pengguna terotentikasi sebagai rangkuman profil dan progres kemajuan belajar mereka.
*   **Tujuan Halaman**: Menyajikan visualisasi data statistik hasil latihan pengguna secara ringkas, informatif, dan mudah dipahami agar memotivasi pengguna untuk melatih isyarat yang masih lemah.
*   **Fitur Utama**:
    *   *Metrik Statistik Utama*: Kartu informasi yang memaparkan total frekuensi latihan mandiri, jumlah jawaban peragaan yang benar, dan tingkat akurasi rata-rata belajar pengguna.
    *   *Kartu Rekomendasi Huruf Terkuat (Strongest Letters)*: Menampilkan daftar huruf BISINDO yang paling mahir diperagakan oleh pengguna (akurasi $\ge 90\%$).
    *   *Kartu Rekomendasi Huruf Terlemah (Weakest Letters)*: Menampilkan daftar huruf yang paling sering salah diperagakan oleh pengguna (akurasi $< 60\%$), dilengkapi tombol cepat "Latih Sekarang" untuk langsung mengarah ke huruf tersebut pada modul latihan.

> **Rekomendasi Gambar Pendukung:**
>
> [Gambar 5.15: Tangkapan Layar Tampilan Halaman Dashboard Pengguna Terdaftar yang Menampilkan Statistik Agregat Belajar]

---

#### 5.2.7.3 Halaman Deteksi (Modul Penerjemah Real-time)
Halaman deteksi (/detect) merupakan modul fungsionalitas paling krusial dari aplikasi ini, di mana proses transkripsi bahasa isyarat ke teks dilakukan.
*   **Tujuan Halaman**: Mengambil umpan kamera webcam pengguna, menggambarkan struktur skeleton jari, memprediksi huruf, dan merangkai huruf menjadi kalimat terjemahan utuh secara langsung.
*   **Fitur Utama**:
    *   *Frame Video Webcam*: Panel tangkapan kamera pengguna yang terhubung langsung dengan vision task MediaPipe Hands.
    *   *Overlay Skeleton Kanvas*: Kanvas transparan di atas video untuk merender 21 titik koordinat landmark tangan dan garis-garis kerangka jari secara real-time.
    *   *Panel Status & FPS*: Menampilkan informasi FPS (Frame Per Second) kamera, tingkat latensi inferensi KNN (dalam milidetik), dan status pembacaan tangan.
    *   *Panel Prediksi Terkini*: Box visual besar yang memperlihatkan huruf prediksi klasifikasi teratas beserta nilai persentase tingkat kepercayaannya.
    *   *Kotak Kalimat Terjemahan*: Panel teks yang menampung kumpulan kata/kalimat terjemahan dari huruf-huruf stabil yang berhasil dirangkai, dilengkapi tombol aksi Hapus (Backspace) dan Bersihkan (Clear).

> **Rekomendasi Gambar Pendukung:**
>
> [Gambar 5.16: Tangkapan Layar Halaman Deteksi (Translator Page) Saat Mengidentifikasi Isyarat Huruf secara Real-Time]

---

#### 5.2.7.4 Halaman Riwayat (Log Penerjemahan)
Halaman riwayat (/history) menyajikan penayangan log sesi penerjemahan terdahulu yang pernah dilakukan pengguna.
*   **Tujuan Halaman**: Memfasilitasi pengguna untuk meninjau kembali catatan transkripsi isyarat terdahulu tanpa perlu memperagakannya kembali di depan kamera.
*   **Fitur Utama**:
    *   *Tabel Riwayat Interaktif*: Menyajikan tabel rapi yang memuat kolom tanggal peragaan, ID pengenal sesi, daftar huruf-huruf stabil yang terangkai, dan persentase rata-rata nilai kepercayaan deteksi.
    *   *Pencarian & Filter*: Filter pencarian berdasarkan rentang tanggal atau ID sesi tertentu untuk memudahkan penemuan log.

> **Rekomendasi Gambar Pendukung:**
>
> [Gambar 5.17: Tangkapan Layar Halaman Riwayat yang Menampilkan Daftar Tabel Log Deteksi Terdahulu Pengguna dari Cloud Firestore]

---

#### 5.2.7.5 Halaman Evaluasi Model (Visualisasi Performa KNN)
Halaman evaluasi model (/model-evaluation) ditujukan bagi pengembang maupun penguji akademis untuk meninjau efektivitas parameter $K$ optimal pada model latih.
*   **Tujuan Halaman**: Memvisualisasikan hasil kalkulasi evaluasi lintang (*cross-validation*) model secara interaktif untuk kebutuhan analisis performa sistem.
*   **Fitur Utama**:
    *   *Kartu Status Model*: Ringkasan informasi total data latih, total data uji, dan nilai parameter K terpilih ($K=5$) yang memiliki keakuratan tertinggi.
    *   *Tabel dan Chart Perbandingan K*: Bagan grafik perbandingan metrik Akurasi, Presisi, Recall, dan F1-Score pada beberapa variasi nilai parameter K (1, 3, 5, 7, 9).
    *   *Visualisasi Heatmap Confusion Matrix*: Peta panas digital berukuran 26x26 kelas alfabet yang digambar secara interaktif menggunakan penataan warna CSS. Skema warna peta panas akan berwarna pekat pada garis diagonal (merepresentasikan prediksi benar) dan berwarna tipis di luar diagonal (merepresentasikan tingkat kesalahan/kekeliruan deteksi).
    *   *Bagan Grafik Per-Class Metrics*: Grafik batang horizontal menggunakan library Recharts untuk menampilkan metrik performa presisi dan recall spesifik dari huruf A sampai Z secara individual.

> **Rekomendasi Gambar Pendukung:**
>
> [Gambar 5.18: Tangkapan Layar Halaman Evaluasi Model yang Menampilkan Perbandingan Grafik Nilai K, Grafik Batang Per-Class, dan Heatmap Confusion Matrix]

---

Sebagai gambaran implementasi antarmuka, struktur tata letak rendering elemen HTML/JSX pada halaman modul penerjemah real-time disajikan pada Kode Program 5.28.

```typescript
// Kode Program 5.28 Struktur Tata Letak Halaman Deteksi (src/app/detect/page.tsx - Bagian Rendering)
import React from "react";
import CameraView from "@/components/camera/CameraView";
import HandSkeletonOverlay from "@/components/camera/HandSkeletonOverlay";

// Potongan JSX untuk merender elemen video kamera, kanvas skeleton, dan hasil deteksi
return (
  <main className="min-h-screen bg-slate-950 text-slate-100 flex flex-col relative overflow-hidden">
    <div className="max-w-6xl w-full mx-auto px-6 py-8 grid grid-cols-1 lg:grid-cols-12 gap-8 z-10">
      
      {/* 1. Kolom Kiri: Webcam Stream & Overlay Skeleton */}
      <section className="lg:col-span-8 flex flex-col items-center gap-4">
        <div className="relative aspect-video w-full rounded-3xl overflow-hidden bg-slate-900 border border-slate-800 shadow-2xl">
          {/* Komponen Kamera Feed */}
          <CameraView videoRef={videoRef} />
          
          {/* Komponen Kanvas Overlay untuk menggambar skeleton tangan */}
          {landmarks && <HandSkeletonOverlay landmarks={landmarks} />}
        </div>
        
        {/* Indikator Kecepatan Pemrosesan Frame */}
        <div className="flex justify-between w-full text-xs font-semibold text-slate-500">
          <span>FPS: {fps}</span>
          <span>Latensi Inferensi: {latency} ms</span>
        </div>
      </section>

      {/* 2. Kolom Kanan: Hasil Klasifikasi & Rangkaian Kalimat */}
      <aside className="lg:col-span-4 flex flex-col gap-6">
        
        {/* Panel Prediksi Huruf Terkini */}
        <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl flex flex-col">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">Prediksi</h3>
          <div className="text-8xl font-black text-indigo-400 text-center py-6">
            {prediction ? prediction : "-"}
          </div>
          <div className="flex justify-between text-sm text-slate-400">
            <span>Kepercayaan:</span>
            <span>{(confidence * 100).toFixed(0)}%</span>
          </div>
        </div>

        {/* Panel Kalimat Hasil Terjemahan */}
        <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl flex flex-col flex-grow">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">Teks Terjemahan</h3>
          <p className="text-lg font-medium text-slate-200 min-h-[4rem] flex-grow">
            {sentence ? sentence : <span className="text-slate-600">Belum ada input isyarat...</span>}
          </p>
          
          {/* Tombol Kontrol Kalimat */}
          <div className="flex gap-3 mt-4">
            <button onClick={handleBackspace} className="flex-1 py-3 rounded-2xl bg-slate-850 hover:bg-slate-800 border border-slate-800 text-slate-300 text-sm font-semibold transition-all">
              Hapus (Backspace)
            </button>
            <button onClick={handleClear} className="flex-1 py-3 rounded-2xl bg-red-950 hover:bg-red-900 border border-red-900/50 text-red-200 text-sm font-semibold transition-all">
              Bersihkan
            </button>
          </div>
        </div>

      </aside>
    </div>
  </main>
);
```
