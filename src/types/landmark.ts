// 1 titik landmark mentah dari MediaPipe
export interface RawLandmark {
  x: number;
  y: number;
  z: number;
}

// Hasil ekstraksi 1 tangan: 21 landmark + handedness
export interface HandData {
  landmarks: RawLandmark[];   // panjang 21
  handedness: "Left" | "Right";
}

// Vektor fitur final per frame: 156 dimensi
// 78 fitur/tangan (63 koordinat ternormalisasi + 15 sudut sendi) × 2 tangan
export type FeatureVector = number[]; // length === 156

export interface TrainingSample {
  features: FeatureVector;
  label: string; // "A" - "Z"
}
