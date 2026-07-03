export interface KComparison {
  k: number;
  accuracy: number;
  precision: number;
  recall: number;
  f1: number;
}

export interface PerClassMetric {
  letter: string;
  precision: number;
  recall: number;
  f1: number;
  support: number;
}

export interface ModelEvaluation {
  best_k: number;
  k_comparison: KComparison[];
  confusion_matrix: number[][];
  per_class_metrics: PerClassMetric[];
  total_train_samples: number;
  total_test_samples: number;
  evaluated_at: string;
}
