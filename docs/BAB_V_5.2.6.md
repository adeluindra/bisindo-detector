# Draf BAB V (Implementasi) — Subbab 5.2.6

### 5.2.6 Implementasi Stability Tracker dan Penyusunan Kalimat

Ketika klasifikasi real-time dioperasikan langsung melalui peramban web klien, sistem memproses citra webcam dengan kecepatan tinggi (berkisar antara 20 hingga 30 frame per detik). Sifat pembacaan data kontinu ini rentan menghasilkan prediksi huruf yang berfluktuasi (*noisy prediction*) akibat getaran halus pada tangan pengguna (*micro-shaking*), pergeseran sudut cahaya, maupun selama masa transisi gerakan tangan dari satu bentuk isyarat huruf ke huruf lainnya. 

Jika hasil prediksi mentah langsung dimasukkan ke dalam kalimat, maka teks terjemahan akan dipenuhi karakter berulang secara tidak beraturan (contohnya isyarat huruf "B" yang diperagakan selama 2 detik dapat menghasilkan output "BBBBBBBBBBBBBBBBB"). Untuk mengatasi masalah tersebut, diimplementasikan modul **Stability Tracker** berbasis *React Hook* kustom serta antrean penyusunan kalimat berbasis aturan (*rules-based*).

Berikut adalah pembahasan rinci mengenai implementasi stability tracker dan penyusunan kalimat:

#### A. Alur Stabilisasi dan Rangkaian Kata
Mekanisme penyaringan huruf tidak stabil hingga dikunci menjadi barisan kata atau kalimat dirancang mengalir melalui diagram blok berikut:

```
Prediction
    │
    ▼
Stability Tracker
    │
    ▼
Huruf Stabil
    │
    ▼
Penyusunan Kata
    │
    ▼
 Kalimat
```

1.  **Prediction**: Hasil prediksi klasifikasi diperoleh per frame video webcam dari KNN Classifier.
2.  **Stability Tracker**: Memantau konsistensi huruf yang sama dalam sejumlah frame berurutan menggunakan counter.
3.  **Huruf Stabil**: Mengunci huruf hasil klasifikasi jika counter berhasil melewati ambang batas threshold.
4.  **Penyusunan Kata**: Merangkai huruf-huruf stabil yang terdeteksi secara berurutan.
5.  **Kalimat**: Menyimpan untaian kata ke dalam state kalimat utama dan melakukan operasi penulisan spasial (spasi atau penghapusan).

> **Rekomendasi Gambar Pendukung:**
>
> [Gambar 5.13: Diagram Blok Alur Penyaringan Kestabilan Prediksi Huruf BISINDO]

#### B. Pengecekan Ambang Batas Keyakinan (*Confidence Threshold*)
Sebelum data prediksi dari kelas KNN dikirimkan ke modul penstabil, data tersebut harus lolos pengecekan kelayakan nilai kepercayaan terlebih dahulu. Konstanta ambang batas kepercayaan diatur sebesar `CONFIDENCE_THRESHOLD = 0.55`. 

Apabila nilai keyakinan prediksi yang dihasilkan KNN di bawah batas $0.55$, sistem langsung menyatakan bahwa gestur tangan pengguna kurang jelas atau tidak sempurna. Sistem akan mereset indikator kestabilan dan mengubah teks status menjadi "Isyarat kurang jelas" serta menolak untuk meneruskan data ke stability tracker. Hal ini penting untuk menyaring data transisi acak agar tidak memicu deteksi huruf salah (*false positive*).

#### C. Logika Pelacak Kestabilan (*Stability Tracker*)
Logika pelacak kestabilan bertindak sebagai penyaring (*debouncer*) real-time. Modul ini melacak konsistensi huruf masukan secara berurutan. Algoritma ini dirancang dengan parameter `stableFrameThreshold = 20` (sekitar 0.8 detik pada performa video 25 FPS). 

Mekanisme kerja dari modul ini dijabarkan sebagai berikut:
1.  **Pencocokan Label**: Untuk setiap frame video ke-$t$, sistem memeriksa hasil klasifikasi $L_t$:
    *   Jika $L_t$ sama dengan huruf yang sedang dilacak pada frame sebelumnya ($L_{t-1}$), maka nilai hitungan konsistensi ditambahkan satu ($C = C + 1$).
    *   Jika $L_t$ berbeda dengan huruf yang sedang dilacak sebelumnya, sistem mendeteksi adanya getaran atau perubahan gestur. Label pelacakan diubah menjadi $L_t$ dan nilai hitungan kestabilan direset dari awal ($C = 1$).
2.  **Rasio Kemajuan Kestabilan (*Progress*)**: Rasio kemajuan dihitung secara dinamis di setiap frame dengan rumus $P = C / T_{stable}$ (dibatasi maksimal 1.0). Rasio ini digunakan oleh antarmuka frontend Next.js untuk menggambarkan lingkaran progres visual (*circular loading ring*) yang berjalan mengelilingi kotak tangan pengguna. Ini memberikan petunjuk visual yang interaktif kepada pengguna untuk menahan posisi tangannya hingga lingkaran terisi penuh.
3.  **Penguncian Huruf**: Ketika hitungan konsistensi berhasil menyentuh ambang batas ($C \ge 20$), huruf tersebut dinyatakan stabil dan sistem memicu status penguncian (`isLocked = true`). Setelah terkunci, hitungan direset kembali ke nol ($C = 0$) dan label pelacakan dinetralkan untuk mendeteksi huruf berikutnya.

#### D. Penyusunan Kata dan Kalimat
Setelah status penguncian huruf stabil dipicu (`isLocked = true`), huruf tersebut dilemparkan ke dalam fungsi pengolah kalimat di halaman utama. Alur perangkaian huruf menjadi kalimat utuh diatur dengan ketentuan aturan berikut:

1.  **Akumulasi Karakter**: Huruf yang baru saja terkunci ditambahkan langsung ke bagian akhir dari teks string kalimat utama yang sedang aktif di dalam *React State*:
    $$\text{Kalimat}_{\text{baru}} = \text{Kalimat}_{\text{lama}} + \text{Huruf}_{\text{baru}}$$
2.  **Penghapusan Karakter (*Backspace*)**: Jika pengguna melakukan kesalahan peragaan isyarat dan huruf yang salah terlanjur masuk ke dalam kalimat, disediakan tombol aksi "Hapus Karakter" (*backspace*). Tombol ini memotong huruf terakhir dari teks string menggunakan metode:
    $$\text{Kalimat} = \text{Kalimat.slice}(0, -1)$$
3.  **Pembersihan Kalimat (*Clear*)**: Menyediakan tombol aksi "Bersihkan" (*clear*) untuk mengosongkan seluruh string kalimat agar pengguna dapat memulai transkripsi sesi baru. Bersamaan dengan itu, pengenal sesi unik baru (`sessionId`) dibangkitkan ulang untuk memisahkan log riwayat penyimpanan database berikutnya.

Mekanisme filter kestabilan dan penyusunan kalimat ini terbukti secara empiris mampu mereduksi kesalahan pengetikan ganda (*double-typing error*) akibat getaran frame kamera serta menghasilkan penyusunan teks terjemahan yang presisi dan mulus.

Implementasi lengkap modul stability tracker dalam berkas kustom React Hook disajikan pada Kode Program 5.27.

```typescript
// Kode Program 5.27 Pelacak Kestabilan Prediksi Huruf (src/hooks/useStablePrediction.ts)
import { useRef } from "react";

// Hook kustom dengan parameter default ambang batas stabil 20 frame
export function useStabilityTracker(stableFrameThreshold = 20) {
  const currentLabelRef = useRef<string | null>(null);
  const stableCountRef = useRef<number>(0);

  // Fungsi utama untuk memperbarui status kestabilan huruf masukan baru
  function update(predictedLabel: string): { isLocked: boolean; progress: number } {
    // Jika prediksi sama dengan frame sebelumnya, tambahkan nilai counter
    if (predictedLabel === currentLabelRef.current) {
      stableCountRef.current++;
    } else {
      // Jika prediksi berubah, ubah huruf aktif yang dilacak dan reset counter ke 1
      currentLabelRef.current = predictedLabel;
      stableCountRef.current = 1;
    }

    // Periksa apakah counter kestabilan telah mencapai ambang batas
    const isLocked = stableCountRef.current >= stableFrameThreshold;
    const progress = Math.min(stableCountRef.current / stableFrameThreshold, 1);

    if (isLocked) {
      // Reset counter jika huruf sudah berhasil terkunci (locked)
      stableCountRef.current = 0;
      currentLabelRef.current = null;
    }

    return { isLocked, progress };
  }

  // Fungsi untuk mereset pelacakan kestabilan
  function reset() {
    currentLabelRef.current = null;
    stableCountRef.current = 0;
  }

  return { update, reset };
}
```
