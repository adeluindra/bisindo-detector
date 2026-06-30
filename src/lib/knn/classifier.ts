import { euclideanDistance } from "./distance";
import type { TrainingSample, KNNResult } from "@/types/knn";

export class KNNClassifier {
  private trainingData: TrainingSample[] = [];

  loadTrainingData(samples: TrainingSample[]) {
    this.trainingData = samples;
  }

  predict(input: number[], k = 5): KNNResult {
    if (this.trainingData.length === 0) {
      throw new Error("Training data belum dimuat");
    }

    // 1. Hitung jarak ke semua data training
    const distances = this.trainingData.map((sample) => ({
      label: sample.label,
      distance: euclideanDistance(input, sample.features),
    }));

    // 2. Urutkan & ambil K tetangga terdekat
    distances.sort((a, b) => a.distance - b.distance);
    const neighbors = distances.slice(0, k);

    // 3. Weighted voting (bobot = 1/jarak, dengan epsilon untuk hindari div/0)
    const weightPerClass: Record<string, number> = {};
    let totalWeight = 0;

    for (const n of neighbors) {
      const weight = 1 / (n.distance + 1e-6);
      weightPerClass[n.label] = (weightPerClass[n.label] || 0) + weight;
      totalWeight += weight;
    }

    // 4. Tentukan kelas pemenang
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
