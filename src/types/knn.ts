export interface TrainingSample {
  features: number[]; // 156 dimensi
  label: string;       // "A" - "Z"
}

export interface KNNResult {
  label: string;
  confidence: number;       // 0–1, proporsi bobot kelas pemenang
  neighbors: { label: string; distance: number }[];
}
