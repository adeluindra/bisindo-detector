# Draf BAB V (Implementasi) — Subbab 5.2.4

### 5.2.4 Ekstraksi Fitur Real-time Menggunakan MediaPipe Hands

Setelah model latih berhasil dipersiapkan secara lokal di IndexedDB, sistem dapat memulai proses penerjemahan secara langsung. Tahap ini dinamakan ekstraksi fitur *real-time*, di mana citra visual dari kamera pengguna (*webcam*) ditangkap frame demi frame, kemudian dilacak dan dikonversi menjadi vektor fitur 156-dimensi di dalam browser klien menggunakan pustaka MediaPipe Hands secara berkelanjutan.

Berikut adalah penjelasan tahapan alur proses ekstraksi fitur real-time:

#### A. Alur Ekstraksi Fitur Real-time
Proses transformasi citra video menjadi koordinat landmark terstandarisasi dirancang mengalir melalui diagram blok berikut:

```
Webcam
   │
   ▼
MediaPipe Hands
   │
   ▼
21 Landmark
   │
   ▼
Normalisasi
   │
   ▼
Joint Angle
   │
   ▼
Feature Vector (156)
```

1.  **Aktivasi Webcam**: Sistem mengakses perangkat keras kamera video menggunakan API bawaan browser `navigator.mediaDevices.getUserMedia()`. Aliran video mentah dialirkan ke dalam elemen `<video>` HTML5 secara *real-time*.
2.  **Deteksi Tangan**: Frame gambar video kamera dibaca secara kontinu menggunakan perulangan callback `requestAnimationFrame` dan diproses menggunakan modul vision task `@mediapipe/tasks-vision` untuk mengidentifikasi keberadaan tangan.
3.  **Ekstraksi Landmark**: Menghasilkan 21 koordinat landmark 3D untuk setiap tangan yang berhasil dideteksi dalam frame visual.
4.  **Normalisasi**: Koordinat landmark mentah ditranslasikan dan disamakan skalanya secara dinamis di browser, kemudian sudut 15 sendi jari tangan dihitung menggunakan rumus dot product cosinus vektor.
5.  **Pembentukan Feature Vector**: Hasil normalisasi koordinat (63) dan sudut sendi (15) digabungkan membentuk vektor fitur tangan kiri dan tangan kanan berukuran 156-dimensi.

> **Rekomendasi Gambar Pendukung:**
>
> [Gambar 5.10: Diagram Blok Alur Pemrosesan Ekstraksi Fitur Tangan Real-time dari Webcam Klien]
> 
> [Gambar 5.11: Tangkapan Layar Umpan Video Kamera dan Kanvas Skeleton Overlay yang Berhasil Melacak 21 Koordinat Sendi Jari Tangan Klien]

#### B. Aktivasi Webcam dan Deteksi Tangan
Penerjemahan real-time diawali dengan mengaktifkan kamera pengguna. Aliran kamera dibaca oleh peramban web pada thread rendering utama. Penggunaan loop pemrosesan frame kamera diimplementasikan menggunakan fungsi `startDetectionLoop` yang dirancang dengan metode asinkronus menggunakan `requestAnimationFrame` untuk mencegah kemacetan interaksi UI (*freezing*). 

Sistem menginisialisasi modul deteksi tangan MediaPipe Hands `HandLandmarker` menggunakan berkas biner WebAssembly (WASM) yang dideploy di CDN Google agar performa eksekusinya mendekati kecepatan bahasa tingkat rendah (C++). Detektor hands dikonfigurasi dengan:
*   `runningMode: "VIDEO"`: Dioptimalkan untuk mendeteksi frame aliran video kontinu, bukan gambar diam.
*   `numHands: 2`: Mendukung deteksi hingga dua tangan secara simultan.
*   `minHandDetectionConfidence: 0.5`: Batas toleransi terendah pengenalan tangan di layar kamera.

#### C. Ekstraksi Landmark dan Normalisasi Koordinat Spasial
Setiap frame video yang masuk diproses oleh detektor hands untuk menghasilkan struktur koordinat 21 titik kunci tangan. Koordinat landmark mentah memiliki rentang nilai pixel yang bervariasi bergantung pada resolusi kamera dan jarak tangan.

Untuk mengeliminasi dependensi skala dan translasi, koordinat landmark 3D $P_i = (x_i, y_i, z_i)$ langsung dinormalisasi di sisi klien menggunakan rumus translasi relatif dan pembagian skala:

$$P'_i = P_i - P_0$$
$$V_{\max} = \max_{i, d \in \{x, y, z\}} |P'_{i,d}|$$
$$P''_i = \frac{P'_i}{V_{\max}}$$

Di mana $P_0$ adalah koordinat pergelangan tangan (*wrist*). Hasil akhir dari proses normalisasi ini berupa larik 63 nilai fitur spasial terstandarisasi untuk satu tangan.

#### D. Perhitungan Sudut Sendi Jari (*Joint Angle*)
Secara paralel, sistem menghitung sudut derajat tekukan sendi jari dari 21 titik koordinat untuk mempermudah KNN membedakan konfigurasi jari yang menekuk atau tegak. Tiap tangan memiliki 5 jari yang masing-masing dihitung 3 sudut sendi utamanya.

Penghitungan sudut $\theta$ pada sendi tengah $P_2$ dari tiga landmark berurutan ($P_1, P_2, P_3$) dihitung menggunakan dot product vektor cosinus:

$$\vec{v}_1 = P_1 - P_2, \quad \vec{v}_2 = P_3 - P_2$$
$$\cos\theta = \frac{\vec{v}_1 \cdot \vec{v}_2}{\|\vec{v}_1\| \|\vec{v}_2\|}$$
$$\theta = \arccos(\cos\theta) \times \frac{180}{\pi}$$

Hasil dari kalkulasi ini adalah 15 nilai sudut sendi jari per tangan.

#### E. Pembentukan Vektor Fitur 156-Dimensi
Vektor fitur gabungan dibentuk dengan menggabungkan fitur tangan kiri dan tangan kanan secara berurutan. Setiap tangan menghasilkan 78 fitur (63 koordinat + 15 sudut sendi). Panjang total vektor fitur gabungan adalah $78 \times 2 = 156$ fitur. 

Apabila hanya ada satu tangan yang terdeteksi di dalam frame kamera, larik 78 fitur tangan yang tidak terdeteksi tersebut akan diisi dengan larik bernilai nol ($0.0$) agar dimensi masukan yang dikirimkan ke model klasifikasi KNN selalu konsisten sepanjang 156 elemen.

Implementasi lengkap modul pengekstraksi fitur real-time (normalisasi, joint angle, dan gabungan fitur) disajikan pada Kode Program 5.25.

```typescript
// Kode Program 5.25 Implementasi Ekstraksi Fitur Klien (src/lib/mediapipe/normalize.ts, jointAngles.ts, featureExtractor.ts)

// 1. Normalisasi Koordinat Landmark
export function normalizeLandmarks(landmarks: { x: number; y: number; z: number }[]): number[] {
  const wrist = landmarks[0];
  const relative = landmarks.map((lm) => [
    lm.x - wrist.x,
    lm.y - wrist.y,
    lm.z - wrist.z,
  ]);
  const maxVal = Math.max(...relative.flat().map((v) => Math.abs(v)), 1e-6);
  return relative.flat().map((v) => v / maxVal); // Menghasilkan 63 nilai
}

// 2. Penghitungan Sudut Sendi Jari Tangan
const FINGER_JOINTS: Record<string, number[]> = {
  thumb:  [0, 1, 2, 3, 4],
  index:  [0, 5, 6, 7, 8],
  middle: [0, 9, 10, 11, 12],
  ring:   [0, 13, 14, 15, 16],
  pinky:  [0, 17, 18, 19, 20],
};

function calculateAngle(p1: number[], p2: number[], p3: number[]): number {
  const v1 = p1.map((v, i) => v - p2[i]);
  const v2 = p3.map((v, i) => v - p2[i]);
  const dot = v1.reduce((sum, v, i) => sum + v * v2[i], 0);
  const norm1 = Math.sqrt(v1.reduce((s, v) => s + v * v, 0));
  const norm2 = Math.sqrt(v2.reduce((s, v) => s + v * v, 0));
  const cos = Math.max(-1, Math.min(1, dot / (norm1 * norm2 + 1e-6)));
  return (Math.acos(cos) * 180) / Math.PI; // Mengembalikan sudut (0 s.d. 180 derajat)
}

export function calculateJointAngles(landmarks: { x: number; y: number; z: number }[]): number[] {
  const points = landmarks.map((lm) => [lm.x, lm.y, lm.z]);
  const angles: number[] = [];

  for (const idx of Object.values(FINGER_JOINTS)) {
    for (let i = 1; i < 4; i++) {
      angles.push(calculateAngle(points[idx[i - 1]], points[idx[i]], points[idx[i + 1]]));
    }
  }
  return angles; // Menghasilkan 15 nilai sudut sendi
}

// 3. Penggabungan Vektor Fitur Kiri-Kanan (Feature Extractor)
import { normalizeLandmarks } from "./normalize";
import { calculateJointAngles } from "./jointAngles";

export function buildFeatureVector(
  handLandmarksList: { x: number; y: number; z: number }[][],
  handedness: { categoryName: string }[][]
): number[] {
  let left = new Array(78).fill(0);
  let right = new Array(78).fill(0);

  handLandmarksList.forEach((landmarks, i) => {
    const label = handedness[i][0].categoryName; // "Left" atau "Right"
    const coords = normalizeLandmarks(landmarks);      // 63 nilai
    const angles = calculateJointAngles(landmarks);     // 15 nilai
    const features = [...coords, ...angles];            // 78 nilai

    if (label === "Left") left = features;
    else right = features;
  });

  return [...left, ...right]; // Gabungan 156-dimensi
}
```
