# Draf BAB V (Implementasi) — Subbab 5.2.5

### 5.2.5 Implementasi KNN Classifier dan Evaluasi Nilai K

Setelah vektor fitur 156-dimensi berhasil dibentuk dari frame video webcam secara *real-time*, data tersebut langsung dikirimkan ke mesin klasifikasi *K-Nearest Neighbor* (KNN) di sisi klien. Pada subbab ini dijelaskan secara rinci implementasi kelas klasifikasi KNN, pencarian tetangga terdekat, mekanisme pembobotan suara (*weighted voting*), penentuan nilai kepercayaan (*confidence score*), serta analisis performa dari hasil pengujian variasi nilai parameter $K$.

Berikut adalah pembahasan rinci mengenai implementasi KNN Classifier dan Evaluasi Nilai K:

#### A. Alur Proses Klasifikasi KNN
Proses klasifikasi dari input vektor fitur mentah hingga diperoleh prediksi huruf BISINDO mengalir melalui tahapan diagram berikut:

```
Feature Vector (156)
         │
         ▼
Euclidean Distance
         │
         ▼
      Sorting
         │
         ▼
K Nearest Neighbors
         │
         ▼
  Weighted Voting
         │
         ▼
     Prediction
```

1.  **Input Feature Vector**: Vektor masukan 156-dimensi dibaca dari detektor tangan klien.
2.  **Euclidean Distance**: Mengukur jarak geometris fitur input dengan seluruh sampel training yang tersimpan di IndexedDB.
3.  **Sorting**: Mengurutkan seluruh sampel training berdasarkan jarak Euclidean dari yang terkecil ke terbesar.
4.  **K Nearest Neighbors**: Mengambil sebanyak $K$ sampel teratas (tetangga terdekat).
5.  **Weighted Voting**: Menghitung bobot kontribusi setiap tetangga menggunakan rumus kebalikan jarak.
6.  **Prediction**: Menentukan kelas dengan bobot tertinggi sebagai prediksi huruf akhir beserta skor kepercayaannya.

> **Rekomendasi Gambar Pendukung:**
>
> [Gambar 5.12: Bagan Alur Kerja Proses Perhitungan Klasifikasi KNN Client-Side secara Real-Time]

#### B. Perhitungan Jarak Euclidean (*Euclidean Distance*)
Ketika vektor fitur masukan $x$ dibaca, sistem menghitung jarak Euclidean terhadap setiap sampel latih $y$ yang tersimpan di memori browser. Perhitungan jarak ini diimplementasikan menggunakan fungsi pembantu `euclideanDistance`. Fungsi ini melakukan kalkulasi matematika berupa selisih kuadrat untuk setiap dimensi fitur, menjumlahkannya, lalu melakukan operasi akar kuadrat.

Rumus matematika Jarak Euclidean dituliskan sebagai berikut:

$$d(x, y) = \sqrt{\sum_{i=1}^{156} (x_i - y_i)^2}$$

Sistem memanfaatkan perulangan *looping* linear untuk menghitung jarak ke seluruh data training yang ada di IndexedDB. Hasil perhitungan berupa larik objek yang menampung label kelas dan nilai jarak Euclidean masing-masing sampel.

#### C. Pemilihan Nilai Parameter K
Nilai parameter $K$ menetapkan jumlah tetangga terdekat yang digunakan untuk melakukan pemungutan suara (*voting*). Pada implementasi web deteksi real-time, nilai default diatur sebesar $K = 5$. 

Setelah seluruh sampel dihitung jaraknya, larik jarak tersebut diurutkan secara menaik (*ascending sort*) berdasarkan nilai jarak Euclidean terkecil. Fungsi pengurutan memanfaatkan metode bawaan JavaScript `.sort((a, b) => a.distance - b.distance)`. Setelah terurut, sistem memotong larik menggunakan operasi `.slice(0, k)` untuk mengambil $K$ sampel tetangga terdekat teratas.

#### D. Weighted Voting dan Confidence Score
Untuk menentukan huruf keputusan akhir dari $K$ tetangga tersebut, diimplementasikan mekanisme pembobotan suara berbasis kebalikan jarak (*weighted voting*). Tetangga yang posisinya sangat dekat dengan data uji diberi bobot suara (*weight*) lebih tinggi dibandingkan tetangga yang letaknya lebih jauh.

Bobot suara $w_i$ untuk tetangga ke-$i$ dihitung dengan rumus:

$$w_i = \frac{1}{d_i + \epsilon}$$

Di mana $\epsilon = 10^{-6}$ adalah nilai konstanta kecil (*epsilon*) untuk menghindari kesalahan pembagian dengan nol apabila data masukan identik dengan sampel latih ($d_i = 0$).

Sistem mengakumulasikan nilai bobot untuk setiap kelas label huruf (A sampai Z) yang diwakili oleh $K$ tetangga tersebut:

$$W(C) = \sum_{y_i \in N_K(x) \land \text{Class}(y_i) = C} w_i$$

Kelas dengan total akumulasi bobot tertinggi ($W(C)$ terbesar) keluar sebagai kelas pemenang ($C^*$) yang menjadi hasil prediksi huruf BISINDO. Selanjutnya, tingkat kepercayaan klasifikasi (*confidence score*) dihitung untuk menentukan kelayakan prediksi:

$$\text{Confidence}(x) = \frac{W(C^*)}{\sum_{i=1}^{K} w_i}$$

Jika tingkat kepercayaan klasifikasi berada di bawah batas ambang kepercayaan (*confidence threshold*) sebesar $0.55$, sistem akan menolak hasil prediksi dengan status "Isyarat kurang jelas" untuk menjaga presisi data terjemahan.

#### E. Analisis Perbandingan Beberapa Nilai K
Berdasarkan skrip pengujian offline [evaluateK.ts](file:///c:/Users/Hewlett-Packard/Desktop/portofoolio/bismillah%20jadi/bisindo-detector/scripts/evaluateK.ts) yang menguji variasi nilai parameter $K \in \{1, 3, 5, 7, 9\}$ terhadap 20% data uji, diperoleh analisis komparatif performa model. 

Pengujian performa dianalisis dengan indikator berikut:
*   **Nilai K = 1**: Rentan terhadap getaran data (*outliers*) karena keputusan hanya bergantung pada satu sampel terdekat tunggal.
*   **Nilai K = 3 & K = 5**: Memberikan stabilitas klasifikasi yang optimal. K = 5 memiliki akurasi yang seimbang serta toleransi getaran yang baik pada saat dijalankan di browser klien.
*   **Nilai K = 7 & K = 9**: Mulai mengalami sedikit penurunan akurasi (*underfitting*) karena area pengambilan tetangga yang terlalu luas sehingga mencampur suara dari kelas huruf yang bentuk isyaratnya mirip.

Data perbandingan akurasi ini disajikan pada antarmuka web halaman evaluasi untuk mempermudah pengamat menganalisis dampak nilai parameter terhadap efisiensi inferensi.

Implementasi logika perhitungan jarak Euclidean dan kelas KNN Classifier di sisi klien disajikan pada Kode Program 5.26.

```typescript
// Kode Program 5.26 Implementasi Klasifikasi KNN Client-side (src/lib/knn/distance.ts, classifier.ts)

// 1. Fungsi Perhitungan Jarak Euclidean
export function euclideanDistance(a: number[], b: number[]): number {
  if (a.length !== b.length) {
    throw new Error(`Feature length mismatch: ${a.length} vs ${b.length}`);
  }
  let sum = 0;
  for (let i = 0; i < a.length; i++) {
    const diff = a[i] - b[i];
    sum += diff * diff; // Selisih kuadrat
  }
  return Math.sqrt(sum); // Akar kuadrat
}

// 2. Kelas Klasifikasi KNN dengan Weighted Voting
import type { TrainingSample, KNNResult } from "@/types/knn";

export class KNNClassifier {
  private trainingData: TrainingSample[] = [];

  // Pemuatan data latih ke dalam memori
  loadTrainingData(samples: TrainingSample[]) {
    this.trainingData = samples;
  }

  // Metode untuk memprediksi masukan baru
  predict(input: number[], k = 5): KNNResult {
    if (this.trainingData.length === 0) {
      throw new Error("Training data belum dimuat");
    }

    // A. Hitung jarak Euclidean ke semua data training
    const distances = this.trainingData.map((sample) => ({
      label: sample.label,
      distance: euclideanDistance(input, sample.features),
    }));

    // B. Urutkan berdasarkan jarak terkecil dan ambil K tetangga
    distances.sort((a, b) => a.distance - b.distance);
    const neighbors = distances.slice(0, k);

    // C. Kalkulasi bobot suara (weighted voting) menggunakan kebalikan jarak
    const weightPerClass: Record<string, number> = {};
    let totalWeight = 0;

    for (const n of neighbors) {
      const weight = 1 / (n.distance + 1e-6); // Epsilon 1e-6
      weightPerClass[n.label] = (weightPerClass[n.label] || 0) + weight;
      totalWeight += weight;
    }

    // D. Cari kelas dengan bobot tertinggi sebagai pemenang keputusan
    let bestLabel = neighbors[0].label;
    let bestWeight = 0;
    for (const [label, weight] of Object.entries(weightPerClass)) {
      if (weight > bestWeight) {
        bestWeight = weight;
        bestLabel = label;
      }
    }

    // Mengembalikan label hasil prediksi, tingkat kepercayaan, dan daftar tetangga
    return {
      label: bestLabel,
      confidence: totalWeight > 0 ? bestWeight / totalWeight : 0,
      neighbors,
    };
  }
}
```
