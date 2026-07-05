# Draf BAB V (Implementasi) — Subbab 5.2.7

### 5.2.7 Implementasi Antarmuka Sistem

Implementasi antarmuka pengguna (*frontend*) dari sistem penerjemah Bahasa Isyarat Indonesia (BISINDO) dibangun menggunakan framework **Next.js** berbasis React dengan memanfaatkan konsep *App Router* dan didesain secara modern menggunakan Tailwind CSS. Seluruh elemen antarmuka dirancang untuk mempermudah navigasi, menyajikan umpan balik visual secara real-time, serta menampilkan metrik visualisasi evaluasi secara dinamis.

Berikut adalah penjelasan mengenai tujuan, fitur utama, susunan visual, dan implementasi kode penting dari lima modul antarmuka utama sistem:

---

#### 5.2.7.1 Landing Page (Halaman Utama)
*Landing Page* merupakan halaman pintu gerbang utama yang diakses oleh pengguna saat pertama kali membuka tautan situs web aplikasi. Tujuan utama halaman ini adalah untuk memperkenalkan aplikasi kepada publik, memaparkan kegunaan sistem deteksi BISINDO, dan membimbing pengguna baru untuk masuk ke modul latihan atau penerjemah. Halaman ini memiliki beberapa fitur utama seperti *hero section* yang dirancang dengan warna gradien menarik, tombol aksi navigasi (*call-to-action*) menuju pendaftaran atau masuk aplikasi, dan kolom kartu informasi interaktif yang memaparkan detail fitur real-time dan statistik belajar.

> **Rekomendasi Gambar Pendukung:**
>
> [Gambar 5.14: Tangkapan Layar Tampilan Landing Page Halaman Awal Aplikasi Web Penerjemah BISINDO]

Potongan kode penting untuk mengimplementasikan elemen navigasi utama dan struktur visual dari bagian *hero* halaman utama disajikan pada Kode Program 5.28.

```tsx
// Kode Program 5.28 Potongan Kode Tampilan Hero Landing Page (src/app/page.tsx)
import React from "react";
import Link from "next/link";

export default function Home() {
  return (
    <div className="relative bg-slate-950 text-slate-100 font-sans">
      <header className="sticky top-0 bg-slate-950/80 backdrop-blur-xl border-b border-slate-900/50 z-50">
        <div className="max-w-6xl w-full mx-auto px-6 py-4 flex items-center justify-between">
          <span className="text-xl font-black tracking-wider text-indigo-400">🫵 BISINDO</span>
          <Link href="/login" className="px-4 py-2 text-xs font-semibold rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white transition-all shadow-md">
            Masuk Aplikasi
          </Link>
        </div>
      </header>

      <section className="relative z-10 min-h-[calc(100vh-64px)] flex flex-col items-center justify-center text-center px-6">
        <h1 className="text-3xl md:text-5xl font-black tracking-tight leading-tight mb-6 bg-gradient-to-r from-indigo-300 via-purple-300 to-pink-300 bg-clip-text text-transparent">
          Klasifikasi Huruf Bahasa Isyarat Indonesia (BISINDO) Secara Real-Time
        </h1>
        <p className="text-slate-400 text-sm md:text-lg max-w-2xl leading-relaxed mb-10">
          Implementasi Algoritma K-Nearest Neighbor (KNN) dengan ekstraksi landmark MediaPipe Hands untuk mendeteksi alfabet isyarat langsung di browser Anda secara instan dan efisien.
        </p>
        <Link href="/login" className="px-8 py-3.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-sm transition-all shadow-lg">
          Mulai Belajar & Deteksi
        </Link>
      </section>
    </div>
  );
}
```

Potongan kode di atas menguraikan struktur kontainer halaman berlatar belakang gelap dengan gradasi indigo dan ungu. Di dalamnya terdapat komponen tautan masuk Next.js yang mengarahkan pengguna ke halaman login secara dinamis, serta judul utama bertuliskan klasifikasi real-time BISINDO menggunakan teknik pewarnaan gradien teks Tailwind CSS untuk memberikan impresi antarmuka modern yang estetik.

---

#### 5.2.7.2 Dashboard (Halaman Panel Kontrol Pengguna)
*Dashboard* (/dashboard) merupakan panel kontrol utama yang ditujukan khusus bagi pengguna terotentikasi sebagai rangkuman profil dan progres kemajuan belajar mereka. Tujuan halaman ini adalah menyajikan visualisasi data statistik hasil latihan pengguna secara ringkas, informatif, dan mudah dipahami agar memotivasi pengguna untuk melatih isyarat yang masih lemah. Fitur utama yang ditawarkan meliputi metrik ringkasan akurasi, daftar huruf terkuat (akurasi di atas 90%), serta daftar huruf terlemah (akurasi di bawah 60%) untuk memberikan rekomendasi latihan yang terarah.

> **Rekomendasi Gambar Pendukung:**
>
> [Gambar 5.15: Tangkapan Layar Tampilan Halaman Dashboard Pengguna Terdaftar yang Menampilkan Statistik Agregat Belajar]

Potongan kode penting untuk mengimplementasikan inisialisasi basis data lokal IndexedDB pada dashboard serta memetakan daftar navigasi fitur utama disajikan pada Kode Program 5.29.

```tsx
// Kode Program 5.29 Potongan Kode Inisialisasi dan Menu Dashboard (src/app/dashboard/page.tsx)
import React, { useEffect, useState } from "react";
import { loadModelIntoIndexedDB } from "@/lib/knn/loadModel";

export default function DashboardPage() {
  const [modelStatus, setModelStatus] = useState<"loading" | "ready" | "error">("loading");

  useEffect(() => {
    async function initModel() {
      try {
        await loadModelIntoIndexedDB(); // Pemuatan data latih secara lokal
        setModelStatus("ready");
      } catch (err) {
        console.error("Failed to load KNN model into IndexedDB:", err);
        setModelStatus("error");
      }
    }
    initModel();
  }, []);

  const features = [
    {
      title: "Deteksi Real-Time",
      description: "Gunakan kamera untuk mendeteksi gestur tangan alfabet BISINDO Anda secara langsung di layar.",
      icon: "📹",
      path: "/detect",
    },
    {
      title: "Latihan Mandiri",
      description: "Pelajari abjad BISINDO satu per satu dengan instruksi langsung dari sistem dan dapatkan umpan balik instan.",
      icon: "🎯",
      path: "/practice",
    }
  ];
}
```

Potongan kode dashboard di atas mengelola status loading model latih pada saat halaman pertama kali dirender. Fungsi pemuatan dijalankan di dalam kait efek React untuk memastikan data training model JSON tersimpan persisten ke dalam basis data lokal browser, kemudian sistem mendefinisikan larik objek berisi daftar fitur utama beserta alamat rute halamannya masing-masing untuk di-render ke bentuk komponen kartu navigasi dashboard secara dinamis.

---

#### 5.2.7.3 Halaman Deteksi (Modul Penerjemah Real-time)
Halaman deteksi (/detect) merupakan modul fungsionalitas paling krusial dari aplikasi ini, di mana proses transkripsi bahasa isyarat ke teks dilakukan. Tujuan utama halaman ini adalah untuk mengambil umpan kamera webcam pengguna, menggambarkan struktur skeleton jari, memprediksi huruf, dan merangkai huruf menjadi kalimat terjemahan utuh secara langsung. Fitur utama yang diimplementasikan di antaranya panel tangkapan video, kanvas transparan skeleton tangan, indikator kecepatan inferensi FPS dan latensi milidetik, serta kotak kalimat terjemahan yang dinamis.

> **Rekomendasi Gambar Pendukung:**
>
> [Gambar 5.16: Tangkapan Layar Halaman Deteksi (Translator Page) Saat Mengidentifikasi Isyarat Huruf secara Real-Time]

Potongan kode penting yang menangani proses integrasi loop inisialisasi deteksi kamera serta rendering overlay kanvas disajikan pada Kode Program 5.30.

```tsx
// Kode Program 5.30 Potongan Kode Kontrol Deteksi Real-Time (src/app/detect/page.tsx)
import React, { useEffect, useRef, useState } from "react";
import CameraView from "@/components/camera/CameraView";
import HandSkeletonOverlay from "@/components/camera/HandSkeletonOverlay";
import { startDetectionLoop } from "@/hooks/useHandDetectionLoop";

export default function DetectPage() {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [landmarks, setLandmarks] = useState<{ x: number; y: number; z: number }[][] | null>(null);

  useEffect(() => {
    if (!videoRef.current) return;
    const video = videoRef.current;
    
    // Memulai loop deteksi frame video kamera
    const stopLoop = startDetectionLoop(video, (features, landmarksList) => {
      setLandmarks(landmarksList); // Simpan koordinat landmark untuk di-render ke kanvas
    });

    return () => {
      stopLoop(); // Hentikan loop saat pengguna keluar halaman
    };
  }, []);
}
```

Potongan kode halaman deteksi di atas memanfaatkan referensi React untuk memegang elemen DOM video kamera secara langsung tanpa memicu render ulang yang tidak perlu. Pemrosesan frame diikat di dalam kait efek siklus hidup halaman untuk memicu loop MediaPipe, mengalirkan hasil pelacakan koordinat ke *state landmarks*, serta melakukan pembersihan memori (*cleanup function*) berupa pemanggilan fungsi penghenti loop deteksi saat komponen halaman dihancurkan.

---

#### 5.2.7.4 Halaman Riwayat (Log Penerjemahan)
Halaman riwayat (/history) menyajikan penayangan log sesi penerjemahan terdahulu yang pernah dilakukan pengguna. Tujuan halaman ini adalah memfasilitasi pengguna untuk meninjau kembali catatan transkripsi isyarat terdahulu tanpa perlu memperagakannya kembali di depan kamera. Halaman ini dilengkapi dengan fitur tabel riwayat transaksi, informasi nilai kepercayaan, timestamp, dan fitur pembagian halaman (*pagination*) untuk navigasi log berukuran besar.

> **Rekomendasi Gambar Pendukung:**
>
> [Gambar 5.17: Tangkapan Layar Halaman Riwayat yang Menampilkan Daftar Tabel Log Deteksi Terdahulu Pengguna dari Cloud Firestore]

Potongan kode penting untuk mengunduh log riwayat peragaan latihan mandiri dari Firestore dan merendernya dalam bentuk tabel dinamis ber-paginasi disajikan pada Kode Program 5.31.

```tsx
// Kode Program 5.31 Potongan Kode Riwayat Latihan (src/app/history/page.tsx)
import React, { useEffect, useState } from "react";
import { getUserTrainingSessions } from "@/lib/firebase/firestore";

export default function HistoryPage() {
  const [sessionsList, setSessionsList] = useState<any[]>([]);
  const [practicePage, setPracticePage] = useState(1);
  const itemsPerPage = 8;

  const currentPracticeData = sessionsList.slice(
    (practicePage - 1) * itemsPerPage,
    practicePage * itemsPerPage
  );

  return (
    <div className="overflow-x-auto rounded-2xl border border-slate-900 bg-slate-900/40">
      <table className="w-full text-left text-sm text-slate-300">
        <tbody className="divide-y divide-slate-850/50">
          {currentPracticeData.map((s) => (
            <tr key={s.id} className="hover:bg-slate-900/60 transition-colors">
              <td className="px-6 py-3.5 text-xs text-slate-450">{s.targetLetter}</td>
              <td className="px-6 py-3.5 font-bold text-slate-200">{s.predictedLetter}</td>
              <td className="px-6 py-3.5 text-center">
                <span className={`inline-flex px-2.5 py-1 text-xs font-semibold rounded-full ${
                  s.isCorrect ? "bg-emerald-950/40 text-emerald-400" : "bg-red-950/40 text-red-400"
                }`}>
                  {s.isCorrect ? "Benar" : "Salah"}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
```

Potongan kode halaman riwayat di atas memproses teknik pemotongan larik data (*array slicing*) untuk kebutuhan pembagian halaman data statis secara dinamis berdasarkan parameter halaman aktif dan batas jumlah item per halaman. Elemen tabel di-render menggunakan perulangan metode peta JavaScript untuk menghasilkan baris-baris data transaksi latihan mandiri pengguna secara berurutan dan menerapkan indikator warna status kelulusan visual berbasis ekspresi logika *ternary*.

---

#### 5.2.7.5 Halaman Evaluasi Model (Visualisasi Performa KNN)
Halaman evaluasi model (/model-evaluation) ditujukan bagi pengembang maupun penguji akademis untuk meninjau efektivitas parameter $K$ optimal pada model latih. Tujuan halaman ini adalah memvisualisasikan hasil kalkulasi evaluasi lintang (*cross-validation*) model secara interaktif untuk kebutuhan analisis performa sistem. Fitur utama yang diimplementasikan di antaranya grafik batang perbandingan K, grafik batang per kelas abjad A-Z menggunakan pustaka Recharts, dan peta panas matriks konfusi (Confusion Matrix Heatmap) interaktif.

> **Rekomendasi Gambar Pendukung:**
>
> [Gambar 5.18: Tangkapan Layar Halaman Evaluasi Model yang Menampilkan Perbandingan Grafik Nilai K, Grafik Batang Per-Class, dan Heatmap Confusion Matrix]

Potongan kode penting untuk membaca berkas JSON model dan memeriksa keberadaan objek evaluasi performa model KNN disajikan pada Kode Program 5.32.

```tsx
// Kode Program 5.32 Potongan Kode Pemuatan Metrik Evaluasi (src/app/model-evaluation/page.tsx)
import React, { useEffect, useState } from "react";
import type { ModelEvaluation } from "@/types/evaluation";

export default function ModelEvaluationPage() {
  const [evaluation, setEvaluation] = useState<ModelEvaluation | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/model-pretrained.json")
      .then((res) => res.json())
      .then((data) => {
        if (!data.evaluation) {
          setError("Field 'evaluation' belum tersedia di model-pretrained.json.");
          return;
        }
        setEvaluation(data.evaluation); // Simpan objek evaluasi ke state
      })
      .catch((err) => {
        console.error("Failed to load evaluation data:", err);
        setError("Gagal memuat data evaluasi.");
      });
  }, []);
}
```

Potongan kode evaluasi model di atas menguji pemuatan terintegrasi berkas model dari direktori publik server. Fungsi tersebut mengembalikan tanggapan berupa objek JSON, memverifikasi ketersediaan field metrik evaluasi yang dihasilkan skrip Node.js, menangani pesan kegagalan (*exception handling*) secara aman, dan menyimpan data metrik tersebut ke dalam variabel *state* agar siap dibaca oleh komponen bagan Recharts dan modul penampil matriks konfusi.
