# BAB V
# IMPLEMENTASI

## 5.2 Implementasi Sistem Penerjemah Bahasa Isyarat Indonesia Berbasis Web

Subbab ini menjelaskan detail teknis implementasi sistem penerjemah Bahasa Isyarat Indonesia (BISINDO) yang dibangun. Urutan pembahasan disusun secara runtun mengikuti alur kerja sistem, dimulai dari pemrosesan dataset secara offline, perancangan model klasifikasi, penyimpanan lokal, hingga integrasi backend dan antarmuka visual pengguna.

### 5.2.1 Preprocessing Dataset Offline

Tahap awal sebelum model klasifikasi diuji dan ditayangkan pada peramban web adalah *preprocessing* dataset secara *offline*. Tahap ini bertujuan untuk mentransformasikan sekumpulan berkas citra mentah gerakan tangan menjadi bentuk vektor fitur numerik terstruktur yang siap dibaca oleh algoritma klasifikasi *K-Nearest Neighbor* (KNN). Pemrosesan ini diimplementasikan menggunakan skrip Python 3.10 dengan memanfaatkan pustaka OpenCV untuk manajemen berkas gambar dan manipulasi warna citra, serta framework kecerdasan buatan MediaPipe Hands untuk melacak dan mengekstrak koordinat landmark 3D dari tangan.

Berikut adalah penjabaran langkah-langkah dalam tahap preprocessing offline:

#### A. Sumber dan Struktur Dataset
Dataset citra gerakan tangan alfabet BISINDO (huruf A sampai Z) diperoleh dari repositori publik Kaggle. Gambar-gambar ini disimpan di dalam folder lokal komputer pengembangan dengan struktur direktori yang rapi. Folder utama diberi nama `dataset/`, dan di dalamnya terdapat 26 subfolder masing-masing bernama `A/`, `B/`, `C/`, sampai dengan `Z/`. Setiap subfolder menampung berkas citra berformat `.jpg` atau `.png` yang menampilkan berbagai posisi tangan pengguna saat memperagakan alfabet terkait.

> **Rekomendasi Gambar Pendukung:**
>
> [Gambar 5.1: Tangkapan Layar Struktur Direktori Folder Dataset Mentah A-Z pada File Explorer]
> 
> [Gambar 5.2: Contoh Sampel Gambar Dataset Mentah untuk Kelas Isyarat Huruf 'A', 'B', dan 'C']

#### B. Pembagian Data (Training dan Testing)
Untuk keperluan evaluasi performa model klasifikasi secara objektif, seluruh kumpulan citra yang ada di dalam dataset harus dibagi menjadi data latih (*training*) dan data uji (*testing*). Pada sistem ini, pembagian data dilakukan secara otomatis menggunakan metode pembagian berstrata (*stratified split*) dengan proporsi 80% untuk data training dan 20% untuk data testing. Pembagian secara berstrata sangat penting untuk memastikan keseimbangan distribusi kelas, sehingga setiap kelas huruf dari A sampai Z secara individual akan diambil tepat 80% dari total gambarnya untuk dilatih, dan 20% sisanya disimpan khusus sebagai data uji. Hal ini mencegah terjadinya ketidakseimbangan kelas (*class imbalance*) yang dapat menurunkan akurasi model untuk huruf-huruf tertentu.

#### C. Deteksi Landmark Menggunakan MediaPipe Hands
MediaPipe Hands digunakan sebagai ekstraktor fitur utama. Dalam fase offline preprocessing, MediaPipe Hands dikonfigurasi menggunakan mode gambar diam dengan parameter `static_image_mode=True`. Pengaturan ini memaksa model deteksi untuk memperlakukan setiap citra gambar sebagai file independen yang terpisah dan bukan sebagai aliran video berurutan, sehingga menghasilkan akurasi koordinat landmark yang lebih presisi pada citra foto diam. 

Proses pembacaan citra diawali dengan memuat gambar dari disk menggunakan fungsi `cv2.imread(path)` untuk menghasilkan representasi matriks piksel BGR (*Blue-Green-Red*). Setelah itu, citra dikonversi menjadi format RGB (*Red-Green-Blue*) melalui fungsi `cv2.cvtColor(image, cv2.COLOR_BGR2RGB)` karena model deteksi MediaPipe Hands dilatih secara khusus menggunakan gambar berskema warna RGB. Citra RGB kemudian diproses lewat modul `hands.process(image_rgb)` untuk melacak struktur tangan dan mengekstrak koordinat geometris dari 21 titik kunci tangan. Setiap titik kunci tangan yang terdeteksi memiliki koordinat 3 dimensi $P_i = (x_i, y_i, z_i)$ yang nilainya dinormalisasi secara bawaan oleh MediaPipe relatif terhadap dimensi lebar dan tinggi gambar.

> **Rekomendasi Gambar Pendukung:**
>
> [Gambar 5.3: Ilustrasi 21 Titik Landmark Tangan MediaPipe Hands Beserta Penomoran Indeksnya (0 s.d. 20)]

#### D. Normalisasi Koordinat Landmark
Titik koordinat yang dihasilkan oleh MediaPipe Hands secara bawaan masih dipengaruhi oleh jarak tangan pengguna ke kamera (*scale-dependent*) dan lokasi tangan di dalam layar (*translation-dependent*). Sebagai contoh, jika tangan pengguna bergeser sedikit ke kiri atau menjauh dari kamera, nilai koordinat $x, y, z$ akan berubah secara drastis meskipun bentuk isyarat tangan yang diperagakan tetap sama.

Normalisasi koordinat dilakukan melalui beberapa tahapan perhitungan matematis. Pertama, sistem melakukan translasi relatif dengan menetapkan titik pergelangan tangan (*wrist* indeks ke-0, $P_0$) sebagai titik pusat origin $(0,0,0)$, di mana seluruh koordinat landmark lainnya ($P_1$ sampai $P_{20}$) dikurangi dengan nilai koordinat pergelangan tangan tersebut sehingga menghasilkan vektor koordinat relatif $P'_i = P_i - P_0 = (x_i - x_0, y_i - y_0, z_i - z_0)$. Kedua, sistem mencari nilai skala maksimum ($V_{\max}$) yang didefinisikan sebagai nilai absolut koordinat relatif terbesar dari seluruh sumbu melalui rumus $V_{\max} = \max_{i, d \in \{x, y, z\}} |P'_{i,d}|$. Ketiga, seluruh koordinat relatif dibagi dengan nilai $V_{\max}$ tersebut ($P''_i = P'_i / V_{\max}$) untuk menyelaraskan ukuran tangan ke dalam rentang $[-1.0, 1.0]$ agar menghasilkan koordinat normal yang terbebas dari jarak jangkauan objek ke sensor.

#### E. Perhitungan Sudut Sendi Jari (*Joint Angle*)
Untuk memperkaya fitur klasifikasi selain koordinat spasial, dihitung pula sudut derajat tekukan dari persendian jari tangan (*joint angles*). Fitur sudut sendi sangat efektif untuk membedakan bentuk isyarat jari karena sifatnya yang kokoh terhadap rotasi tangan (*rotation-invariant*). Setiap tangan memiliki 5 jari, dan setiap jari memiliki 3 sudut persendian utama yang diukur, menghasilkan total 15 fitur sudut sendi jari. Penghitungan sudut $\theta$ dihitung pada titik sendi tengah $P_2$ yang dibentuk oleh tiga buah titik landmark berurutan ($P_1, P_2, P_3$). Rumus perhitungan sudut menggunakan fungsi arccosinus dari dot product antara vektor $\vec{v}_1 = P_1 - P_2$ dan $\vec{v}_2 = P_3 - P_2$:

$$\cos\theta = \frac{\vec{v}_1 \cdot \vec{v}_2}{\|\vec{v}_1\| \|\vec{v}_2\|}$$
$$\theta = \arccos(\cos\theta) \times \frac{180}{\pi}$$

Konversi ke derajat sudut ($0^\circ$ hingga $180^\circ$) dilakukan agar data bernilai lebih intuitif dalam pengolahan.

#### F. Pembentukan Vektor Fitur 156-Dimensi
Sistem klasifikasi harus mampu mengidentifikasi isyarat BISINDO yang diperagakan baik menggunakan satu tangan saja maupun menggunakan kedua tangan (tangan kanan dan kiri) tanpa memicu ketidakcocokan dimensi data (*feature size mismatch*).

Untuk memfasilitasi kebutuhan dimensi input yang konsisten, program menggabungkan fitur tangan kiri dan kanan secara berurutan dengan dimensi statis berukuran 156 elemen. Fitur tangan kiri tersusun atas 63 nilai koordinat ternormalisasi ditambah 15 nilai sudut sendi jari sehingga membentuk 78 fitur pertama. Selanjutnya, fitur tangan kanan yang dihitung melalui metode serupa juga menyumbang 78 fitur berikutnya untuk disandingkan di sisi kanan larik. Vektor fitur akhir dibentuk dengan menggabungkan larik tangan kiri dan kanan secara langsung. Apabila salah satu tangan tidak terdeteksi dalam citra gambar, slot fitur untuk tangan yang kosong tersebut akan secara otomatis diisi dengan larik penyangga berisi nilai $0.0$ sebanyak 78 elemen untuk menjamin keutuhan panjang input 156-dimensi.

#### G. Penyimpanan Hasil Preprocessing ke File JSON
Setelah seluruh gambar dataset berhasil diproses dan dikonversi menjadi vektor fitur 156-dimensi, kumpulan data latih beserta label alfabetnya disimpan ke dalam berkas terpadu berformat JSON bernama `model-pretrained.json`. Berkas ini diletakkan pada folder `/public` pada struktur proyek web Next.js agar dapat diunduh secara instan oleh browser klien untuk proses klasifikasi KNN.

> **Rekomendasi Gambar Pendukung:**
>
> [Gambar 5.4: Contoh Potongan Teks Berformat JSON Hasil Ekspor preprocessing model-pretrained.json]

Implementasi logika utama dari fungsi pengekstraksi koordinat landmark, kalkulasi sudut persendian jari, serta pembentukan vektor fitur gabungan disajikan pada Kode Program 5.22.

```python
# Kode Program 5.22 Fungsi Inti Ekstraksi Fitur (scripts/preprocess.py)
import numpy as np

# Definisi urutan indeks landmark untuk setiap jari tangan
FINGER_JOINTS = {
    "thumb":  [0, 1, 2, 3, 4],
    "index":  [0, 5, 6, 7, 8],
    "middle": [0, 9, 10, 11, 12],
    "ring":   [0, 13, 14, 15, 16],
    "pinky":  [0, 17, 18, 19, 20],
}

def normalize_landmarks(landmarks):
    """Mengecilkan pergeseran posisi tangan dan menyelaraskan skala ukuran"""
    wrist = landmarks[0]
    relative = np.array([
        [lm[0] - wrist[0], lm[1] - wrist[1], lm[2] - wrist[2]]
        for lm in landmarks
    ])
    max_val = np.max(np.abs(relative)) or 1e-6
    normalized = relative / max_val
    return normalized.flatten().tolist()  # Mengembalikan larik 63 elemen

def calculate_angle(p1, p2, p3):
    """Menghitung sudut tekukan sendi tengah p2 menggunakan rumus cosinus"""
    v1 = np.array(p1) - np.array(p2)
    v2 = np.array(p3) - np.array(p2)
    cos_angle = np.dot(v1, v2) / (np.linalg.norm(v1) * np.linalg.norm(v2) + 1e-6)
    angle_rad = np.arccos(np.clip(cos_angle, -1.0, 1.0))
    return (angle_rad * 180.0) / np.pi

def calculate_joint_angles(landmarks):
    """Mengekstrak 15 nilai sudut derajat persendian jari tangan"""
    angles = []
    for finger, idx in FINGER_JOINTS.items():
        for i in range(1, 4):
            angles.append(calculate_angle(
                landmarks[idx[i - 1]],
                landmarks[idx[i]],
                landmarks[idx[i + 1]]
            ))
    return angles

def build_feature_vector(results):
    """Menggabungkan fitur tangan kiri dan kanan menjadi vektor 156-dimensi"""
    left_features = [0.0] * 78
    right_features = [0.0] * 78

    if results.multi_hand_landmarks:
        for landmarks, handedness in zip(
            results.multi_hand_landmarks,
            results.multi_handedness
        ):
            # Identifikasi klasifikasi tangan kiri atau kanan
            label = handedness.classification[0].label
            
            # Ekstraksi koordinat normalisasi (63) + sudut sendi (15) = 78 fitur
            coords = [(lm.x, lm.y, lm.z) for lm in landmarks.landmark]
            features = normalize_landmarks(coords) + calculate_joint_angles(coords)
            
            if label == "Left":
                left_features = features
            else:
                right_features = features

    return left_features + right_features  # Menggabungkan total 156 fitur
```

Fungsi `normalize_landmarks` diimplementasikan untuk melakukan translasi koordinat dengan mengurangkan setiap titik landmark terhadap titik pergelangan tangan (indeks ke-0), dilanjutkan dengan membagi seluruh nilai relatif tersebut dengan nilai absolut koordinat terbesar untuk menghasilkan fitur berskala seragam. Untuk ekstraksi sudut persendian jari, fungsi `calculate_angle` menghitung sudut derajat lekukan pada titik sendi tengah menggunakan invers cosinus dari perkalian dot vektor dibagi dengan hasil perkalian norma magnitudo masing-masing vektor. Fungsi `calculate_joint_angles` secara otomatis mengulangi perhitungan sudut tersebut di sepanjang 15 persendian utama jari tangan yang telah ditentukan pada pemetaan indeks. Akhirnya, fungsi `build_feature_vector` mengumpulkan seluruh fitur koordinat dan sudut untuk tangan kiri dan kanan, serta memastikan jika salah satu tangan tidak terdeteksi oleh MediaPipe, maka bagian fiturnya akan disisipi nilai nol sebanyak 78 elemen sehingga total dimensi vektor masukan yang dikirim ke model klasifikasi KNN selalu konsisten sepanjang 156 dimensi.
