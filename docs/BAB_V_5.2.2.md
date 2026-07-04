# Draf BAB V (Implementasi) — Subbab 5.2.2

### 5.2.2 Pelatihan Model K-Nearest Neighbor

Setelah seluruh dataset citra diolah dan diekstrak fiturnya ke dalam berkas `model-pretrained.json`, langkah selanjutnya adalah melakukan pelatihan model menggunakan algoritma *K-Nearest Neighbor* (KNN). Algoritma KNN dipilih karena implementasinya yang sederhana, tidak memerlukan waktu pelatihan (*training time*) yang lama, serta sangat efisien untuk dijalankan langsung di sisi peramban klien (*client-side*) secara *real-time*.

Berikut adalah penjelasan rinci mengenai tahapan proses pelatihan dan evaluasi model KNN pada sistem:

#### A. Membaca Dataset JSON
Fase awal dari pemrosesan model di sisi web maupun skrip pengujian dimulai dengan memuat berkas dataset `model-pretrained.json`. Berkas ini dibaca secara asinkronus ke dalam memori komputer. Struktur data dari berkas tersebut kemudian dipetakan ke dalam struktur larik objek *TypeScript* yang merepresentasikan sampel latihan (*training samples*), di mana setiap sampel memiliki dua atribut utama:
*   `label` (String): Huruf alfabet target (A sampai Z).
*   `features` (Array of Number): Larik berisi 156 nilai fitur numerik hasil normalisasi koordinat landmark dan sudut sendi tangan.

#### B. Proses Pelatihan KNN (*Lazy Learning*)
Algoritma KNN diklasifikasikan sebagai *instance-based learning* atau *lazy learner*. Karakteristik utama dari *lazy learning* adalah **tidak adanya fase pelatihan eksplisit** yang memakan waktu komputasi besar (seperti komputasi bobot pada jaringan saraf tiruan atau pohon keputusan). 

Pada sistem ini, proses "pelatihan" model diselesaikan secara instan hanya dengan memuat data latih dari berkas JSON dan memasukannya ke dalam struktur data memori lokal aplikasi menggunakan metode `loadTrainingData()`. Model akan langsung siap digunakan untuk memprediksi data masukan baru dengan melakukan pencarian tetangga terdekat secara *on-the-fly*.

#### C. Perhitungan Jarak Euclidean (*Euclidean Distance*)
Ketika pengguna memperagakan suatu isyarat tangan di depan kamera, sistem akan mengekstrak vektor fitur baru $x$ berdimensi 156. Untuk mengidentifikasi huruf tersebut, sistem menghitung jarak geometris antara vektor input $x$ dengan seluruh vektor sampel data latih $y$ yang tersimpan di dalam memori.

Metrik jarak yang digunakan adalah **Jarak Euclidean**. Jarak Euclidean mengukur panjang garis lurus terkecil antara dua titik dalam ruang multidimensi (156 dimensi). Secara matematis, rumus Jarak Euclidean didefinisikan sebagai berikut:

$$d(x, y) = \sqrt{\sum_{i=1}^{n} (x_i - y_i)^2}$$

Di mana:
*   $d(x, y)$ adalah nilai jarak Euclidean antara input $x$ dan sampel $y$.
*   $x_i$ adalah nilai fitur ke-$i$ dari vektor input masukan baru.
*   $y_i$ adalah nilai fitur ke-$i$ dari vektor sampel data latih yang tersimpan di memori.
*   $n$ adalah jumlah total dimensi fitur, yaitu $156$.

Semakin kecil nilai jarak $d(x, y)$, semakin mirip bentuk isyarat tangan masukan pengguna dengan sampel data latih tersebut.

#### D. Pembobotan Suara Berbasis Kebalikan Jarak (*Weighted Voting*)
Setelah menghitung jarak Euclidean ke seluruh sampel data latih, sistem akan menyortir sampel dari jarak terkecil ke terbesar dan mengambil sebanyak $K$ tetangga terdekat. Untuk menentukan kelas keputusan final dari $K$ tetangga tersebut, diimplementasikan mekanisme pembobotan suara berbasis kebalikan jarak (*weighted voting*).

Pada *simple majority voting*, setiap tetangga memiliki hak suara yang sama (nilai 1) tanpa memedulikan seberapa jauh letaknya dari data masukan. Hal ini rentan menghasilkan prediksi bias jika terdapat gangguan data (*outliers*). Dengan *weighted voting*, tetangga terdekat yang memiliki jarak lebih dekat (nilai jarak kecil) diberi bobot suara yang lebih besar.

Formula pembobotan suara $w_i$ untuk tetangga terdekat ke-$i$ dirumuskan sebagai berikut:

$$w_i = \frac{1}{d_i + \epsilon}$$

Di mana:
*   $d_i$ adalah jarak Euclidean tetangga ke-$i$.
*   $\epsilon$ adalah konstanta kecil (*epsilon*) bernilai $10^{-6}$ yang ditambahkan untuk mencegah terjadinya kesalahan pembagian dengan nol (*division by zero*) apabila jarak masukan identik sempurna ($d_i = 0$).

Total bobot untuk masing-masing kelas dihitung dengan menjumlahkan bobot suara dari seluruh tetangga terdekat yang memiliki label kelas yang sama:

$$W(C) = \sum_{y_i \in N_K(x) \land \text{Class}(y_i) = C} w_i$$

Kelas dengan total akumulasi bobot tertinggi ($W(C)$ terbesar) dinobatkan sebagai label huruf hasil klasifikasi akhir ($C^*$). Selanjutnya, tingkat kepercayaan (*confidence score*) dihitung dengan rasio bobot kelas pemenang dibagi total bobot seluruh tetangga terpilih:

$$\text{Confidence}(x) = \frac{W(C^*)}{\sum_{i=1}^{K} w_i}$$

#### E. Evaluasi Model dan Penentuan Nilai K Terbaik
Untuk menemukan konfigurasi performa klasifikasi terbaik, pengembang menjalankan pengujian lintang (*cross-evaluation*) secara offline menggunakan skrip Node.js pada berkas [evaluateK.ts](file:///c:/Users/Hewlett-Packard/Desktop/portofoolio/bismillah%20jadi/bisindo-detector/scripts/evaluateK.ts). Pengujian ini membandingkan kinerja model pada beberapa variasi nilai parameter $K$, yaitu $K = 1, 3, 5, 7, 9$ dengan mengukur metrik Akurasi, Presisi (*macro-average*), Recall, dan F1-Score.

Skrip pengujian memisahkan 20% data uji dari dataset secara terpisah, mengeksekusi prediksi KNN, lalu membandingkan hasil prediksi dengan label asli untuk menghasilkan *Confusion Matrix* (matriks kekacauan). Matriks ini berguna untuk melihat secara spesifik huruf-huruf mana yang paling sering membingungkan sistem (misalnya huruf 'M' yang terdeteksi sebagai 'N', atau 'V' sebagai 'W').

Berdasarkan hasil pengujian otomatis tersebut, diperoleh data perbandingan kinerja nilai $K$ dan visualisasi persebaran kesalahan kelas yang disimpan langsung pada berkas JSON.

> **Rekomendasi Gambar Pendukung:**
>
> [Gambar 5.5: Tabel Perbandingan Akurasi, Presisi, Recall, dan F1-score untuk Nilai K = 1, 3, 5, 7, 9]
> 
> [Gambar 5.6: Grafik Batang (Chart) Tren Akurasi Terhadap Perubahan Nilai Parameter K]
> 
> [Gambar 5.7: Heatmap Confusion Matrix (Matriks Konfusi) 26x26 untuk Nilai Parameter K Terbaik]

#### F. Penyimpanan Model
Setelah proses evaluasi lintang rampung, seluruh objek data evaluasi (akurasi per nilai $K$, koordinat matriks konfusi, dan metrik akurasi per kelas huruf) digabungkan dan disimpan secara permanen di dalam berkas `model-pretrained.json` pada objek atribut `evaluation`. 

Dengan menyatukan data latih dan metrik evaluasi di satu berkas, sistem web dapat memuat data pelatihan sekaligus menyajikan halaman visualisasi evaluasi performa model yang interaktif bagi pengguna tanpa memerlukan pemrosesan komputasi ulang.

Implementasi potongan fungsi utama evaluasi performa klasifikasi KNN offline disajikan pada Kode Program 5.23.

```typescript
// Kode Program 5.23 Fungsi Evaluasi Performa Model KNN (scripts/evaluateK.ts)
import { KNNClassifier } from "../src/lib/knn/classifier";
import type { EvalMetrics, PerClassMetric } from "./types";

function evaluateForK(
  classifier: KNNClassifier,
  testSamples: { features: number[]; label: string }[],
  k: number,
  classes: string[]
): { metrics: EvalMetrics; confusionMatrix: number[][]; perClassMetrics: PerClassMetric[] } {
  
  // 1. Inisialisasi matriks konfusi dengan nilai 0 untuk setiap pasangan aktual-prediksi
  const confusion: Record<string, Record<string, number>> = {};
  classes.forEach((c: string) => {
    confusion[c] = {};
    classes.forEach((pred: string) => {
      confusion[c][pred] = 0;
    });
  });

  // 2. Lakukan prediksi untuk setiap sampel data uji
  for (const sample of testSamples) {
    const result = classifier.predict(sample.features, k);
    confusion[sample.label][result.label] = (confusion[sample.label][result.label] || 0) + 1;
  }

  let correct = 0;
  let total = 0;
  const precisions: number[] = [];
  const recalls: number[] = [];
  const f1s: number[] = [];
  const perClassMetrics: PerClassMetric[] = [];

  // 3. Kalkulasi metrik True Positive, False Positive, dan False Negative per kelas
  for (const actual of classes) {
    let tp = confusion[actual][actual] || 0;
    let fn = 0;
    let fp = 0;
    let support = 0;

    for (const predicted of classes) {
      const count = confusion[actual][predicted] || 0;
      total += count;
      support += count;
      if (predicted === actual) {
        correct += count;
      } else {
        fn += count;
      }
    }

    for (const otherActual of classes) {
      if (otherActual !== actual) {
        fp += confusion[otherActual][actual] || 0;
      }
    }

    // Perhitungan matematis Presisi, Recall, dan F1-Score per kelas huruf
    const precision = tp + fp === 0 ? 0 : tp / (tp + fp);
    const recall = tp + fn === 0 ? 0 : tp / (tp + fn);
    const f1 = precision + recall === 0 ? 0 : (2 * precision * recall) / (precision + recall);

    precisions.push(precision);
    recalls.push(recall);
    f1s.push(f1);

    perClassMetrics.push({
      letter: actual,
      precision: +precision.toFixed(4),
      recall: +recall.toFixed(4),
      f1: +f1.toFixed(4),
      support,
    });
  }

  // 4. Konversi objek matriks konfusi menjadi larik 2-dimensi numerik (26x26)
  const confusionMatrix = classes.map((actual: string) =>
    classes.map((predicted: string) => confusion[actual][predicted] || 0)
  );

  return {
    metrics: {
      k,
      accuracy: correct / total,
      precision: precisions.reduce((a, b) => a + b, 0) / precisions.length, // Macro-average
      recall: recalls.reduce((a, b) => a + b, 0) / recalls.length,       // Macro-average
      f1: f1s.reduce((a, b) => a + b, 0) / f1s.length,                   // Macro-average
    },
    confusionMatrix,
    perClassMetrics,
  };
}
```
