# Draf BAB V (Implementasi) — Subbab 5.2.3

### 5.2.3 Penyimpanan Model ke IndexedDB

Setelah model pretrained (`model-pretrained.json`) berhasil dibuat dan dievaluasi secara *offline*, berkas tersebut harus diintegrasikan ke dalam sistem peramban web agar klasifikasi dapat berjalan secara instan. Pada subbab ini dijelaskan mekanisme penyimpanan model menggunakan **IndexedDB** di sisi klien (*client-side*) sebagai media penyimpanan lokal (*caching*).

Berikut adalah pembahasan rinci mengenai implementasi penyimpanan model ke dalam IndexedDB:

#### A. Alasan Penggunaan IndexedDB
Dalam aplikasi web real-time yang memproses data berukuran besar secara lokal, pemilihan media penyimpanan sangat memengaruhi pengalaman pengguna (*user experience*). Terdapat beberapa alasan teknis mengapa IndexedDB dipilih dibandingkan media penyimpanan web lainnya seperti `localStorage` atau mengandalkan permintaan HTTP berulang (*recurrent network requests*):

1.  **Kapasitas Penyimpanan yang Besar**: Berkas model training `model-pretrained.json` menyimpan ribuan koordinat landmark dan sudut sendi dari 26 kelas alfabet BISINDO. Berkas ini memiliki ukuran yang melebihi batas kapasitas maksimal `localStorage` (yang dibatasi hanya 5 MB pada sebagian besar peramban web modern). IndexedDB tidak memiliki batas ketat seperti itu dan mampu menampung data hingga ratusan megabytes (tergantung kapasitas penyimpanan sisa perangkat pengguna).
2.  **Operasi Asinkronus (*Non-Blocking*)**: Berbeda dengan `localStorage` yang operasinya bersifat sinkronus (*blocking*), IndexedDB bekerja secara asinkronus menggunakan konsep *event-driven* atau berbasis *promise*. Hal ini menjamin bahwa proses membaca atau menulis data model yang besar tidak akan menginterupsi *thread* rendering utama aplikasi web, sehingga antarmuka visual (terutama feed kamera dan kanvas skeleton) tetap berjalan mulus tanpa adanya getaran atau jeda gambar (*screen stuttering*).
3.  **Struktur Data Berorientasi Objek**: IndexedDB mampu menyimpan objek JavaScript atau larik objek terstruktur secara langsung tanpa perlu melakukan konversi string JSON berulang kali menggunakan `JSON.stringify()` dan `JSON.parse()`. Hal ini menghemat siklus komputasi CPU klien secara signifikan.

#### B. Proses Penyimpanan Model (*Caching*)
Proses penyimpanan model ke dalam IndexedDB dilakukan secara asinkronus menggunakan pustaka pembungkus `idb` yang berbasis *promise*. Alur penyimpanan ini dirancang dengan langkah-langkah transaksional berikut:

1.  **Inisialisasi Database**: Saat pengguna membuka halaman aplikasi, sistem memanggil fungsi `getDB()` untuk membuka koneksi ke basis data lokal bernama `bisindo-knn-db` pada versi 1. Jika basis data belum pernah dibuat, peramban akan memicu fungsi `upgrade` untuk membuat toko objek (*object store*) bernama `training-data`.
2.  **Pemeriksaan Data Lokal**: Sistem mengirimkan permintaan query `.get(STORE_NAME, "train")` untuk memeriksa keberadaan data latih di dalam toko objek.
3.  **Penanganan Cache Miss**: Jika data tidak ditemukan (mengembalikan nilai kosong/null), sistem akan melakukan permintaan unduh jaringan menggunakan fungsi `fetch("/model-pretrained.json")` untuk mengambil berkas JSON dari server publik.
4.  **Ekstraksi dan Pemetaan**: Berkas JSON yang terunduh dipetakan (*mapping*) secara efisien ke dalam format data `TrainingSample[]` (larik berisi objek koordinat landmark dan label huruf).
5.  **Transaksi Penulisan**: Sistem membuka transaksi baca-tulis (*readwrite transaction*) ke IndexedDB dan menyimpan larik data training ke dalam toko objek dengan kata kunci `train` menggunakan operasi `.put()`.

> **Rekomendasi Gambar Pendukung:**
>
> [Gambar 5.8: Alur Diagram Blok Proses Unduh (Fetch) Model JSON dan Caching ke IndexedDB pada Kunjungan Pertama]
> 
> [Gambar 5.9: Tangkapan Layar Struktur Object Store IndexedDB 'bisindo-knn-db' yang Terlihat pada Menu Developer Tools Application Tab di Google Chrome]

#### C. Proses Memuat Kembali Model (*Cache Hit*)
Pada kunjungan-kunjungan berikutnya, proses memuat kembali data model latih dirancang agar sepenuhnya melewati alur jaringan internet. 

Saat fungsi `loadModelIntoIndexedDB()` dijalankan:
1. Sistem membuka basis data IndexedDB `bisindo-knn-db`.
2. Pencarian data dengan kunci `train` menghasilkan data latih yang lengkap (*cache hit*).
3. Sistem mendeteksi keberadaan data latih lokal tersebut dan langsung membatalkan perintah `fetch()` ke server (`return`).
4. Fungsi `getTrainingData()` dijalankan untuk mengambil larik objek secara lokal dari memori penyimpanan fisik perangkat pengguna, lalu melimpahkannya ke dalam instansi klasifikasi KNN.

#### D. Keuntungan Penggunaan Penyimpanan Lokal
Implementasi caching model menggunakan IndexedDB memberikan beberapa keuntungan operasional bagi sistem:
*   **Pengurangan Beban Bandwidth Server**: Server web tidak perlu melayani permintaan unduh berkas berkuran besar secara berulang untuk pengguna yang sama, menghemat sumber daya *bandwidth* hosting.
*   **Waktu Startup yang Instan**: Waktu pemuatan model terpangkas secara drastis dari beberapa detik (tergantung kecepatan internet klien) menjadi hanya di bawah 100 milidetik karena data dibaca langsung dari penyimpanan lokal SSD/Flash perangkat.
*   **Ketahanan Offline**: Aplikasi dapat tetap berjalan dan melakukan proses inisialisasi model klasifikasi meskipun pengguna mengalami gangguan koneksi internet atau dalam mode luring (*offline*), asalkan halaman web utama sudah termuat sebelumnya.

Implementasi logika manajemen penyimpanan lokal model latih IndexedDB disajikan pada Kode Program 5.24.

```typescript
// Kode Program 5.24 Integrasi Penyimpanan Model IndexedDB (src/lib/knn/loadModel.ts)
import { openDB } from "idb";
import type { TrainingSample } from "@/types/knn";

const DB_NAME = "bisindo-knn-db";
const STORE_NAME = "training-data";

// Fungsi pembantu untuk membuat dan membuka koneksi ke IndexedDB secara asinkronus
async function getDB() {
  return openDB(DB_NAME, 1, {
    upgrade(db) {
      // Membuat object store training-data jika belum ada
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    },
  });
}

// Fungsi utama untuk memproses caching model JSON ke IndexedDB
export async function loadModelIntoIndexedDB(): Promise<void> {
  const db = await getDB();
  
  // Mencari apakah data latih sudah tersimpan di penyimpanan lokal
  const existing = await db.get(STORE_NAME, "train");
  
  // Cache Hit: batalkan unduhan jika data sudah tersimpan secara lokal
  if (existing && existing.length > 0) return;

  // Cache Miss: unduh berkas model pretrained dari server melalui jaringan
  const res = await fetch("/model-pretrained.json");
  const data = await res.json();

  const rawSamples = data.samples || data.train || [];
  
  // Pemetaan larik objek JSON ke struktur tipe data TrainingSample
  const trainingData = rawSamples.map((s: any) => ({
    label: s.label,
    features: s.landmarks || s.features || [],
  }));

  // Simpan larik data training ke dalam object store secara persisten
  await db.put(STORE_NAME, trainingData, "train");
}

// Fungsi untuk mengambil data training langsung dari IndexedDB lokal
export async function getTrainingData(): Promise<TrainingSample[]> {
  const db = await getDB();
  const data = await db.get(STORE_NAME, "train");
  return (data && data.length > 0) ? data : [];
}
```
