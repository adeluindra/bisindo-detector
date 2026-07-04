# BAB V
# IMPLEMENTASI

## 5.2 Implementasi Sistem Penerjemah Bahasa Isyarat Indonesia Berbasis Web

Subbab ini menjelaskan implementasi teknis sistem penerjemah Bahasa Isyarat Indonesia (BISINDO) yang telah dibangun. Pembahasan dalam bab ini disusun secara sistematis mengikuti alur pemrosesan data, dimulai dari pengolahan dataset secara *offline*, proses pelatihan dan evaluasi model, penyimpanan model lokal, ekstraksi fitur *real-time* di peramban, klasifikasi KNN *client-side*, stabilisasi prediksi, perancangan antarmuka pengguna, hingga sinkronisasi data dengan basis data Cloud Firestore.

---

### 5.2.1 Preprocessing Dataset Offline

Tahap *preprocessing* dataset secara *offline* bertujuan untuk mengolah gambar mentah alfabet BISINDO menjadi data numerik terstruktur yang siap dibaca oleh algoritma klasifikasi. Proses ini diimplementasikan menggunakan bahasa pemrograman Python 3.10 dengan pustaka OpenCV untuk pemrosesan citra dan MediaPipe Hands untuk pelacakan koordinat titik kunci tangan.

Langkah-langkah preprocessing offline didefinisikan sebagai berikut:

1.  **Sumber dan Struktur Dataset**: Dataset mentah terdiri dari gambar tangan isyarat alfabet BISINDO dari huruf A sampai Z yang diperoleh dari repositori publik Kaggle. Gambar dikelompokkan ke dalam direktori terpisah berdasarkan label kelasnya (A hingga Z).
2.  **Pembagian Data (Training dan Testing)**: Skrip Python melakukan pembacaan seluruh file gambar, kemudian membaginya secara berstrata (*stratified split*) dengan proporsi 80% untuk data latihan (*training*) dan 20% untuk data uji (*testing*).
3.  **Deteksi Landmark Menggunakan MediaPipe Hands**: Setiap gambar dibaca menggunakan fungsi `cv2.imread()`, diubah warnanya dari format BGR bawaan OpenCV ke format RGB menggunakan `cv2.cvtColor()`, lalu diproses dengan modul `hands.process()` dari MediaPipe Hands untuk mengekstrak 21 koordinat landmark tangan 3D ($x, y, z$).
4.  **Normalisasi Koordinat Landmark**: Untuk menghilangkan pengaruh jarak tangan ke kamera (*scale invariant*) dan posisi pergeseran tangan di dalam bingkai citra (*translation invariant*), seluruh koordinat diselaraskan secara relatif terhadap titik pergelangan tangan (*wrist* indeks ke-0, $P_0$) dan dibagi dengan jarak absolut koordinat terbesar ($V_{\max}$):
    $$P'_i = P_i - P_0$$
    $$V_{\max} = \max_{i, d \in \{x, y, z\}} |P'_{i,d}|$$
    $$P''_i = \frac{P'_i}{V_{\max}}$$
5.  **Perhitungan Joint Angle (Sudut Sendi)**: Untuk setiap tangan, dihitung 15 sudut derajat tekukan persendian jari menggunakan rumus cosinus sudut antara dua vektor $\vec{v}_1 = P_1 - P_2$ dan $\vec{v}_2 = P_3 - P_2$:
    $$\cos\theta = \frac{\vec{v}_1 \cdot \vec{v}_2}{\|\vec{v}_1\| \|\vec{v}_2\|}$$
    $$\theta = \arccos(\cos\theta) \times \frac{180}{\pi}$$
6.  **Pembentukan Feature Vector (156 Fitur)**: Fitur tangan kiri dan kanan digabungkan. Setiap tangan menghasilkan 78 fitur (63 koordinat normalisasi + 15 sudut sendi). Jika salah satu tangan tidak terdeteksi, posisinya digantikan oleh larik berisi 78 nilai nol.
7.  **Penyimpanan Hasil Preprocessing**: Kumpulan larik fitur beserta label kelasnya diekspor ke dalam berkas tunggal berformat JSON bernama `model-pretrained.json`.

Kode program Python untuk ekstraksi fitur dataset secara offline disajikan pada Kode Program 5.15.

```python
# Kode Program 5.15 Ekstraksi Fitur Preprocessing (scripts/preprocess.py)
import cv2
import mediapipe as mp
import numpy as np
import json
import os
from tqdm import tqdm

mp_hands = mp.solutions.hands
hands = mp_hands.Hands(static_image_mode=True, max_num_hands=2, min_detection_confidence=0.5)

def normalize_landmarks(landmarks):
    wrist = landmarks[0]
    relative = np.array([[lm[0] - wrist[0], lm[1] - wrist[1], lm[2] - wrist[2]] for lm in landmarks])
    max_val = np.max(np.abs(relative)) or 1e-6
    return (relative / max_val).flatten().tolist() # 63 nilai

def calculate_angle(p1, p2, p3):
    v1 = np.array(p1) - np.array(p2)
    v2 = np.array(p3) - np.array(p2)
    cos_angle = np.dot(v1, v2) / (np.linalg.norm(v1) * np.linalg.norm(v2) + 1e-6)
    angle_rad = np.arccos(np.clip(cos_angle, -1.0, 1.0))
    return (angle_rad * 180.0) / np.pi

def calculate_joint_angles(landmarks):
    angles = []
    finger_joints = [[0,1,2,3,4], [0,5,6,7,8], [0,9,10,11,12], [0,13,14,15,16], [0,17,18,19,20]]
    for idx in finger_joints:
        for i in range(1, 4):
            angles.append(calculate_angle(landmarks[idx[i-1]], landmarks[idx[i]], landmarks[idx[i+1]]))
    return angles # 15 nilai

def extract_hand_features(landmarks):
    coords = [(lm.x, lm.y, lm.z) for lm in landmarks]
    return normalize_landmarks(coords) + calculate_joint_angles(coords) # 78 nilai

def build_feature_vector(results):
    left_features, right_features = [0.0] * 78, [0.0] * 78
    if results.multi_hand_landmarks:
        for landmarks, handedness in zip(results.multi_hand_landmarks, results.multi_handedness):
            label = handedness.classification[0].label
            features = extract_hand_features(landmarks.landmark)
            if label == "Left": left_features = features
            else: right_features = features
    return left_features + right_features # 156 nilai
```

---

### 5.2.2 Pelatihan Model K-Nearest Neighbor

Metode klasifikasi yang digunakan pada penelitian ini adalah *K-Nearest Neighbor* (KNN). Algoritma KNN merupakan metode pembelajaran malas (*lazy learning*), di mana model tidak melakukan kalkulasi bobot matematika saat fase latihan, melainkan langsung menyimpan dataset hasil preprocessing ke dalam memori untuk dibandingkan dengan data uji baru pada tahap klasifikasi.

Proses pelatihan dan evaluasi model KNN dilakukan sebagai berikut:

1.  **Membaca Dataset JSON**: Sistem memuat kumpulan larik data latih dan data uji dari berkas `model-pretrained.json`.
2.  **Euclidean Distance**: Mengukur kedekatan antara data uji baru dengan sampel data latih berdasarkan perhitungan jarak geometris ruang multidimensi.
3.  **Weighted Voting**: Tetangga terdekat diberi bobot keputusan berdasarkan kebalikan dari jarak Euclid-nya. Hal ini memastikan tetangga yang letaknya lebih dekat memiliki pengaruh suara yang lebih signifikan dalam menentukan hasil prediksi akhir.
4.  **Penentuan Nilai K Terbaik**: Pengujian dilakukan menggunakan skrip Node.js untuk mengevaluasi akurasi klasifikasi dengan beberapa parameter $K$, yaitu $K = 1, 3, 5, 7, 9$.
5.  **Penyimpanan Model**: Hasil kalkulasi metrik evaluasi model (tabel akurasi per $K$, per-class precision, recall, F1-score, dan confusion matrix) ditulis kembali ke dalam berkas JSON model latih agar dapat disajikan langsung di antarmuka web pengembang.

Implementasi skrip evaluasi performa model dan pencarian nilai $K$ optimal disajikan pada Kode Program 5.16.

```typescript
// Kode Program 5.16 Evaluasi Parameter K Optimal (scripts/evaluateK.ts)
import { KNNClassifier } from "../src/lib/knn/classifier";
import * as fs from "fs";
import * as path from "path";

function evaluateForK(
  classifier: KNNClassifier,
  testSamples: { features: number[]; label: string }[],
  k: number,
  classes: string[]
) {
  const confusion: Record<string, Record<string, number>> = {};
  classes.forEach((c) => {
    confusion[c] = {};
    classes.forEach((pred) => { confusion[c][pred] = 0; });
  });

  for (const sample of testSamples) {
    const result = classifier.predict(sample.features, k);
    confusion[sample.label][result.label] = (confusion[sample.label][result.label] || 0) + 1;
  }

  let correct = 0, total = 0;
  const precisions: number[] = [], recalls: number[] = [], f1s: number[] = [];

  for (const actual of classes) {
    let tp = confusion[actual][actual] || 0;
    let fn = 0, fp = 0;

    for (const predicted of classes) {
      const count = confusion[actual][predicted] || 0;
      total += count;
      if (predicted === actual) correct += count;
      else fn += count;
    }
    for (const otherActual of classes) {
      if (otherActual !== actual) fp += confusion[otherActual][actual] || 0;
    }

    const precision = tp + fp === 0 ? 0 : tp / (tp + fp);
    const recall = tp + fn === 0 ? 0 : tp / (tp + fn);
    const f1 = precision + recall === 0 ? 0 : (2 * precision * recall) / (precision + recall);

    precisions.push(precision);
    recalls.push(recall);
    f1s.push(f1);
  }

  return {
    metrics: {
      k,
      accuracy: correct / total,
      precision: precisions.reduce((a, b) => a + b, 0) / precisions.length,
      recall: recalls.reduce((a, b) => a + b, 0) / recalls.length,
      f1: f1s.reduce((a, b) => a + b, 0) / f1s.length,
    },
    confusionMatrix: classes.map((act) => classes.map((pred) => confusion[act][pred] || 0))
  };
}
```

---

### 5.2.3 Penyimpanan Model ke IndexedDB

Setelah model siap digunakan oleh peramban web, langkah penting berikutnya adalah pemuatan data model tersebut ke memori lokal klien secara efisien. Proyek ini menggunakan **IndexedDB** untuk caching data latih di sisi browser.

1.  **Alasan Penggunaan IndexedDB**: Berkas `model-pretrained.json` berukuran cukup besar karena menyimpan koordinat ribuan sampel data training. Pengunduhan berulang setiap kali pengguna membuka halaman deteksi akan menghasilkan latensi pemuatan jaringan yang tinggi. Media penyimpanan web seperti `localStorage` tidak cocok karena memiliki batas kapasitas maksimal sebesar 5 MB dan memblokir thread utama web (*synchronous*). IndexedDB menyediakan kapasitas penyimpanan hingga ratusan megabytes secara asinkronus (*non-blocking*).
2.  **Proses Penyimpanan Model**: Sistem melakukan pemeriksaan basis data `bisindo-knn-db` dan *object store* `training-data`. Apabila data belum tersimpan lokal (*cache miss*), sistem memicu perintah `fetch()` untuk mengunduh JSON dari server, memetakannya ke larik tipe data training, dan menulisnya persisten ke IndexedDB dengan kata kunci `train`.
3.  **Proses Memuat Kembali Model**: Kunjungan web berikutnya langsung memanggil fungsi `getTrainingData()` untuk membaca larik dari IndexedDB secara lokal tanpa melalui lalu lintas jaringan (*caching hit*).
4.  **Keuntungan Penggunaan Penyimpanan Lokal**: Mengurangi konsumsi kuota data internet pengguna, menghilangkan latensi unduhan jaringan, dan mempercepat waktu inisialisasi klasifikasi KNN hingga di bawah 100 milidetik saat aplikasi pertama dibuka.

Kode program penanganan penyimpanan model lokal ter-caching disajikan pada Kode Program 5.17.

```typescript
// Kode Program 5.17 Pemuatan Model IndexedDB (src/lib/knn/loadModel.ts)
import { openDB } from "idb";
import type { TrainingSample } from "@/types/knn";

const DB_NAME = "bisindo-knn-db";
const STORE_NAME = "training-data";

async function getDB() {
  return openDB(DB_NAME, 1, {
    upgrade(db) {
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    },
  });
}

export async function loadModelIntoIndexedDB(): Promise<void> {
  const db = await getDB();
  const existing = await db.get(STORE_NAME, "train");
  if (existing && existing.length > 0) return; // Jika data sudah tercache

  const res = await fetch("/model-pretrained.json");
  const data = await res.json();
  const rawSamples = data.samples || data.train || [];
  const trainingData = rawSamples.map((s: any) => ({
    label: s.label,
    features: s.landmarks || s.features || [],
  }));

  await db.put(STORE_NAME, trainingData, "train");
}

export async function getTrainingData(): Promise<TrainingSample[]> {
  const db = await getDB();
  const data = await db.get(STORE_NAME, "train");
  return (data && data.length > 0) ? data : [];
}
```

---

### 5.2.4 Ekstraksi Fitur Real-time Menggunakan MediaPipe Hands

Alur ekstraksi fitur real-time berjalan di sisi klien peramban web dengan skema sebagai berikut:

```
Webcam ---> MediaPipe Hands ---> 21 Landmark ---> Normalisasi ---> Joint Angle ---> Feature Vector (156)
```

Proses ini diimplementasikan dengan tahapan-tahapan di bawah ini:

1.  **Aktivasi Webcam**: Aplikasi meminta hak akses kamera pengguna melalui pustaka `CameraView`, lalu mengalirkan stream video ke elemen tag `<video>` di DOM halaman web.
2.  **Deteksi Tangan**: Frame gambar video kamera dibaca secara kontinu menggunakan perulangan callback `requestAnimationFrame` dan diproses menggunakan modul vision task `@mediapipe/tasks-vision` untuk mengidentifikasi keberadaan tangan.
3.  **Ekstraksi Landmark**: Menghasilkan 21 koordinat landmark 3D untuk setiap tangan yang berhasil dideteksi dalam frame visual.
4.  **Normalisasi & Perhitungan Joint Angle**: Koordinat landmark mentah ditranslasikan dan disamakan skalanya secara dinamis di browser, kemudian sudut 15 sendi jari tangan dihitung menggunakan rumus dot product cosinus vektor.
5.  **Pembentukan Feature Vector**: Hasil normalisasi koordinat (63) dan sudut sendi (15) digabungkan membentuk vektor fitur tangan kiri dan tangan kanan berukuran 156-dimensi.

Kode program TypeScript untuk mengekstrak fitur secara real-time pada browser klien disajikan pada Kode Program 5.18.

```typescript
// Kode Program 5.18 Ekstraksi Fitur Real-time (src/lib/mediapipe/normalize.ts, jointAngles.ts)
// A. Normalisasi Landmark Tangan
export function normalizeLandmarks(landmarks: { x: number; y: number; z: number }[]): number[] {
  const wrist = landmarks[0];
  const relative = landmarks.map((lm) => [lm.x - wrist.x, lm.y - wrist.y, lm.z - wrist.z]);
  const maxVal = Math.max(...relative.flat().map((v) => Math.abs(v)), 1e-6);
  return relative.flat().map((v) => v / maxVal);
}

// B. Penghitungan Sudut Sendi Jari
export function calculateJointAngles(landmarks: { x: number; y: number; z: number }[]): number[] {
  const points = landmarks.map((lm) => [lm.x, lm.y, lm.z]);
  const angles: number[] = [];
  const joints = [[0,1,2,3,4], [0,5,6,7,8], [0,9,10,11,12], [0,13,14,15,16], [0,17,18,19,20]];

  for (const idx of joints) {
    for (let i = 1; i < 4; i++) {
      const v1 = points[idx[i-1]].map((v, idxJ) => v - points[idx[i]][idxJ]);
      const v2 = points[idx[i+1]].map((v, idxJ) => v - points[idx[i]][idxJ]);
      const dot = v1.reduce((sum, v, idxJ) => sum + v * v2[idxJ], 0);
      const norm1 = Math.sqrt(v1.reduce((s, v) => s + v * v, 0));
      const norm2 = Math.sqrt(v2.reduce((s, v) => s + v * v, 0));
      const cos = Math.max(-1, Math.min(1, dot / (norm1 * norm2 + 1e-6)));
      angles.push((Math.acos(cos) * 180) / Math.PI);
    }
  }
  return angles;
}
```

---

### 5.2.5 Implementasi KNN Classifier dan Evaluasi Nilai K

Setelah vektor fitur 156-dimensi siap, sistem menjalankan logika klasifikasi KNN langsung pada thread frontend web browser pengguna.

Alur klasifikasi KNN didefinisikan sebagai berikut:

```
Vektor Fitur (156) ---> Jarak Euclidean ---> Pengurutan Tetangga ---> Pemilihan K ---> Weighted Voting ---> Prediksi Huruf
```

1.  **Input Feature Vector**: Vektor fitur 156-dimensi hasil ekstraksi real-time dilemparkan sebagai masukan metode `.predict()` pada instansi kelas `KNNClassifier`.
2.  **Perhitungan Euclidean Distance**: Sistem menghitung selisih kuadrat untuk setiap dimensi fitur masukan dengan sampel data latih dalam memori, lalu menarik akar kuadratnya untuk memperoleh jarak kedekatan geometris.
3.  **Pemilihan K**: Nilai default tetangga terdekat diatur pada $K = 5$. Dari seluruh sampel, dipilih 5 tetangga terdekat dengan jarak Euclidean terkecil.
4.  **Weighted Voting**: Setiap tetangga memberikan suara (*vote*) yang bobotnya berbanding terbalik dengan jaraknya ($w = 1 / (d + \epsilon)$). Kelas dengan jumlah bobot suara terbesar keluar sebagai kelas pemenang.
5.  **Confidence Score**: Mengukur derajat keyakinan klasifikasi dengan membandingkan bobot kelas pemenang dengan total bobot seluruh tetangga terdekat. Jika confidence di bawah ambang batas $0.55$, sistem menolak hasil prediksi dengan status "Isyarat kurang jelas".

Kode program mesin klasifikasi KNN disajikan pada Kode Program 5.19.

```typescript
// Kode Program 5.19 Klasifikasi KNN Client-side (src/lib/knn/classifier.ts)
import { euclideanDistance } from "./distance";
import type { TrainingSample, KNNResult } from "@/types/knn";

export class KNNClassifier {
  private trainingData: TrainingSample[] = [];

  loadTrainingData(samples: TrainingSample[]) {
    this.trainingData = samples;
  }

  predict(input: number[], k = 5): KNNResult {
    if (this.trainingData.length === 0) throw new Error("Training data belum dimuat");

    // 1. Hitung jarak ke seluruh sampel
    const distances = this.trainingData.map((sample) => ({
      label: sample.label,
      distance: euclideanDistance(input, sample.features),
    }));

    // 2. Sortir jarak dan ambil K tetangga terdekat
    distances.sort((a, b) => a.distance - b.distance);
    const neighbors = distances.slice(0, k);

    // 3. Hitung bobot suara (weighted voting)
    const weightPerClass: Record<string, number> = {};
    let totalWeight = 0;

    for (const n of neighbors) {
      const weight = 1 / (n.distance + 1e-6); // Epsilon pencegah div/0
      weightPerClass[n.label] = (weightPerClass[n.label] || 0) + weight;
      totalWeight += weight;
    }

    // 4. Ambil kelas dengan bobot tertinggi sebagai prediksi pemenang
    let bestLabel = neighbors[0].label;
    let bestWeight = 0;
    for (const [label, weight] of Object.entries(weightPerClass)) {
      if (weight > bestWeight) {
        bestWeight = weight;
        bestLabel = label;
      }
    }

    return {
      label: bestLabel,
      confidence: totalWeight > 0 ? bestWeight / totalWeight : 0,
      neighbors,
    };
  }
}
```

---

### 5.2.6 Implementasi Stability Tracker dan Penyusunan Kalimat

Untuk merangkai hasil prediksi per frame menjadi untaian teks yang bermakna, diimplementasikan modul stabilisasi prediksi untuk menghindari transisi huruf yang goyah (*debouncing*).

Alur proses penyusunan kalimat dari huruf stabil disajikan pada diagram berikut:

```
Prediksi KNN ---> Stability Tracker (Threshold 20 Frame) ---> Huruf Terkunci ---> Penyusunan Kata/Kalimat
```

1.  **Confidence Threshold**: Huruf hasil klasifikasi hanya diteruskan ke modul stabilisasi jika memiliki *confidence score* $\ge 0.55$.
2.  **Stability Tracker**: Modul melacak konsistensi huruf yang masuk. Jika huruf yang diprediksi sama dengan frame sebelumnya, hitungan stabilitas bertambah ($C = C + 1$). Jika huruf berubah, hitungan diulang dari awal ($C = 1$).
3.  **Huruf Stabil**: Ketika hitungan konsistensi mencapai ambang batas $20$ frame berturut-turut ($C \ge 20$), huruf tersebut dinyatakan stabil dan dikunci (`isLocked = true`). Setelah terkunci, pencitung stabilitas direset kembali ke nol.
4.  **Penyusunan Kalimat**: Huruf stabil diakumulasikan ke dalam string kalimat utama. Pengguna juga disediakan tombol interaktif untuk menghapus karakter terakhir (*backspace*) menggunakan metode `.slice(0, -1)` dan membersihkan seluruh kalimat (*clear*).

Kode program React Hook untuk implementasi stability tracker disajikan pada Kode Program 5.20.

```typescript
// Kode Program 5.20 Pelacak Kestabilan Deteksi (src/hooks/useStablePrediction.ts)
import { useRef } from "react";

export function useStabilityTracker(stableFrameThreshold = 20) {
  const currentLabelRef = useRef<string | null>(null);
  const stableCountRef = useRef<number>(0);

  function update(predictedLabel: string): { isLocked: boolean; progress: number } {
    if (predictedLabel === currentLabelRef.current) {
      stableCountRef.current++;
    } else {
      currentLabelRef.current = predictedLabel;
      stableCountRef.current = 1;
    }

    const isLocked = stableCountRef.current >= stableFrameThreshold;
    const progress = Math.min(stableCountRef.current / stableFrameThreshold, 1);

    if (isLocked) {
      stableCountRef.current = 0;
      currentLabelRef.current = null;
    }
    return { isLocked, progress };
  }

  function reset() {
    currentLabelRef.current = null;
    stableCountRef.current = 0;
  }
  return { update, reset };
}
```

---

### 5.2.7 Implementasi Antarmuka Sistem

Antarmuka sistem dirancang dengan mengedepankan aspek fungsionalitas dan kenyamanan interaksi pengguna. Berikut adalah pembagian modul halaman pada aplikasi web penerjemah BISINDO:

*   **5.2.7.1 Landing Page**: Halaman awal yang menyajikan pengenalan singkat sistem deteksi BISINDO, instruksi penggunaan dasar web, tombol navigasi masuk sistem, dan visualisasi dekoratif modern.
*   **5.2.7.2 Dashboard**: Panel utama setelah pengguna masuk. Halaman ini memuat visualisasi perkembangan hasil belajar, ringkasan jumlah sesi latihan, tingkat akurasi rata-rata belajar, serta rekomendasi huruf terlemah untuk memotivasi latihan berkelanjutan.
*   **5.2.7.3 Halaman Deteksi (/detect)**: Halaman utama penerjemahan. Terdiri dari umpan kamera webcam pengguna, kanvas dinamis rendering visual kerangka tangan, panel hasil deteksi huruf saat ini, status keakuratan prediksi, serta kotak hasil teks terjemahan yang terkumpul.
*   **5.2.7.4 Halaman Riwayat (/history)**: Halaman yang memuat daftar tabel riwayat sesi terjemahan terdahulu. Menampilkan kolom ID sesi, huruf-huruf yang telah dirangkai, tingkat rata-rata keyakinan klasifikasi, serta tanggal perekaman sesi.
*   **5.2.7.5 Halaman Evaluasi Model (/model-evaluation)**: Halaman khusus pengembang yang menyajikan kartu metrik evaluasi model offline, grafik perbandingan nilai K, visualisasi heatmap matriks konfusi (confusion matrix) dinamis, dan chart akurasi per kelas dari A sampai Z.

---

### 5.2.8 Integrasi Cloud Firestore

Sistem mengintegrasikan Cloud Firestore sebagai basis data NoSQL terdistribusi untuk melacak data aktivitas belajar pengguna secara langsung.

1.  **Struktur Koleksi Firestore**: Basis data diatur ke dalam tiga koleksi dokumen:
    *   `history`: Menyimpan log huruf terjemahan stabil beserta keyakinan (*confidence*) dan ID sesi untuk visualisasi tabel riwayat.
    *   `training_sessions`: Mencatat aktivitas latihan mandiri pengguna (huruf target, jawaban pengguna, kebenaran klasifikasi, tingkat kepercayaan, dan waktu pencatatan).
    *   `user_stats`: Menyimpan agregasi statistik akumulatif performa belajar pengguna.
2.  **Penyimpanan Hasil Deteksi & Riwayat Pengguna**: Data disimpan menggunakan fungsi `addDoc()` dari Firebase Firestore SDK dengan atribut timestamp server terstandarisasi via `serverTimestamp()`.
3.  **Pengambilan & Sinkronisasi Data**: Data dibaca secara efisien menggunakan metode query Firestore dengan filter pencocokan `where("userId", "==", userId)`.
4.  **Rekalkulasi Statistik Agregat**: Setiap kali dokumen riwayat latihan ditambahkan ke koleksi `training_sessions`, sistem akan memicu fungsi `recalculateUserStats()`. Fungsi ini membaca total latihan pengguna, menghitung tingkat akurasi untuk tiap huruf, mengkategorikan huruf kuat (akurasi $\ge 90\%$) dan huruf lemah (akurasi $< 60\%$), kemudian memperbarui dokumen statistik agregat pengguna di koleksi `user_stats`.

Kode program sinkronisasi basis data Firestore dan rekalkulasi statistik agregat disajikan pada Kode Program 5.21.

```typescript
// Kode Program 5.21 Logika Rekalkulasi Statistik Belajar (src/lib/stats/updateStats.ts)
import { getUserTrainingSessions, updateUserStats } from "@/lib/firebase/firestore";

export async function recalculateUserStats(userId: string): Promise<void> {
  const sessions = await getUserTrainingSessions(userId);
  if (sessions.length === 0) {
    await updateUserStats(userId, { overallAccuracy: 0, weakLetters: [], strongLetters: [], totalAttempts: 0 });
    return;
  }

  // Mengelompokkan total benar dan total percobaan untuk setiap huruf alfabet
  const perLetter: Record<string, { correct: number; total: number }> = {};
  for (const s of sessions) {
    const target = s.targetLetter;
    if (!perLetter[target]) perLetter[target] = { correct: 0, total: 0 };
    perLetter[target].total++;
    if (s.isCorrect) perLetter[target].correct++;
  }

  const weakLetters: string[] = [];
  const strongLetters: string[] = [];

  // Klasifikasikan huruf lemah dan kuat (hanya jika telah dicoba minimal 2 kali)
  for (const [letter, { correct, total }] of Object.entries(perLetter)) {
    const acc = correct / total;
    if (total >= 2) {
      if (acc < 0.6) weakLetters.push(letter);
      else if (acc >= 0.9) strongLetters.push(letter);
    }
  }

  const overallCorrect = sessions.filter((s) => s.isCorrect).length;
  
  // Perbarui dokumen agregat stats pengguna secara persisten di Cloud Firestore
  await updateUserStats(userId, {
    overallAccuracy: overallCorrect / sessions.length,
    weakLetters,
    strongLetters,
    totalAttempts: sessions.length,
  });
}
```

---

Melalui implementasi menyeluruh dari kedelapan modul sistem di atas, aplikasi pendeteksi isyarat BISINDO ini berhasil diintegrasikan ke dalam sebuah ekosistem aplikasi web berkinerja tinggi, yang mampu menyajikan proses penerjemahan isyarat secara interaktif dan pelacakan hasil belajar pengguna secara akurat dan persisten.
