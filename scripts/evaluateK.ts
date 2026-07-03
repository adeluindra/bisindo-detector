import { KNNClassifier } from "../src/lib/knn/classifier";
import * as fs from "fs";
import * as path from "path";

interface EvalMetrics {
  k: number;
  accuracy: number;
  precision: number; // macro-average
  recall: number;     // macro-average
  f1: number;         // macro-average
}

interface PerClassMetric {
  letter: string;
  precision: number;
  recall: number;
  f1: number;
  support: number;
}

function evaluateForK(
  classifier: KNNClassifier,
  testSamples: { features: number[]; label: string }[],
  k: number,
  classes: string[]
): { metrics: EvalMetrics; confusionMatrix: number[][]; perClassMetrics: PerClassMetric[] } {
  // Confusion matrix: confusion[actual][predicted] = count
  const confusion: Record<string, Record<string, number>> = {};
  classes.forEach((c: string) => {
    confusion[c] = {};
    classes.forEach((pred: string) => {
      confusion[c][pred] = 0;
    });
  });

  for (const sample of testSamples) {
    const result = classifier.predict(sample.features, k);
    confusion[sample.label][result.label] =
      (confusion[sample.label][result.label] || 0) + 1;
  }

  let correct = 0;
  let total = 0;
  const precisions: number[] = [];
  const recalls: number[] = [];
  const f1s: number[] = [];
  const perClassMetrics: PerClassMetric[] = [];

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

  // Build numeric confusion matrix (26×26)
  const confusionMatrix = classes.map((actual: string) =>
    classes.map((predicted: string) => confusion[actual][predicted] || 0)
  );

  return {
    metrics: {
      k,
      accuracy: correct / total,
      precision: precisions.reduce((a, b) => a + b, 0) / precisions.length,
      recall: recalls.reduce((a, b) => a + b, 0) / recalls.length,
      f1: f1s.reduce((a, b) => a + b, 0) / f1s.length,
    },
    confusionMatrix,
    perClassMetrics,
  };
}

function main() {
  const modelPath = path.join(__dirname, "../public/model-pretrained.json");
  console.log(`Loading dataset from ${modelPath}...`);

  if (!fs.existsSync(modelPath)) {
    console.error("Error: model-pretrained.json not found in public/ directory.");
    process.exit(1);
  }

  const rawData = fs.readFileSync(modelPath, "utf-8");
  const data = JSON.parse(rawData);

  let trainSamples = data.train;
  let testSamples = data.test;

  if (!trainSamples || !testSamples) {
    console.log("No pre-split train/test data found. Performing a stratified 80/20 split...");
    const rawSamples = data.samples || [];
    const grouped: Record<string, any[]> = {};
    
    rawSamples.forEach((s: any) => {
      const label = s.label;
      if (!grouped[label]) grouped[label] = [];
      grouped[label].push({
        label: s.label,
        features: s.landmarks || s.features || []
      });
    });

    const train: any[] = [];
    const test: any[] = [];
    for (const label of Object.keys(grouped)) {
      const list = grouped[label];
      const splitIdx = Math.floor(list.length * 0.8);
      train.push(...list.slice(0, splitIdx));
      test.push(...list.slice(splitIdx));
    }
    trainSamples = train;
    testSamples = test;
  } else {
    trainSamples = trainSamples.map((s: any) => ({
      label: s.label,
      features: s.landmarks || s.features || []
    }));
    testSamples = testSamples.map((s: any) => ({
      label: s.label,
      features: s.landmarks || s.features || []
    }));
  }

  const classes = data.classes || [..."ABCDEFGHIJKLMNOPQRSTUVWXYZ"];

  console.log(`Loaded ${trainSamples.length} training samples and ${testSamples.length} test samples.`);

  const classifier = new KNNClassifier();
  classifier.loadTrainingData(trainSamples);

  const kValues = [1, 3, 5, 7, 9];
  const results: EvalMetrics[] = [];
  let bestConfusionMatrix: number[][] = [];
  let bestPerClassMetrics: PerClassMetric[] = [];

  console.log("\nEvaluating K values...");
  for (const k of kValues) {
    const start = Date.now();
    const { metrics, confusionMatrix, perClassMetrics } = evaluateForK(classifier, testSamples, k, classes);
    const duration = Date.now() - start;
    console.log(`K = ${k} evaluated in ${duration}ms.`);
    results.push(metrics);

    // Save confusion matrix and per-class metrics for the best K
    if (k === 3) {
      bestConfusionMatrix = confusionMatrix;
      bestPerClassMetrics = perClassMetrics;
    }
  }

  // Determine best K by highest accuracy
  const bestResult = results.reduce((best, curr) => curr.accuracy > best.accuracy ? curr : best, results[0]);
  const bestK = bestResult.k;

  // If best K is not 3, re-evaluate for the actual best K
  if (bestK !== 3) {
    const { confusionMatrix, perClassMetrics } = evaluateForK(classifier, testSamples, bestK, classes);
    bestConfusionMatrix = confusionMatrix;
    bestPerClassMetrics = perClassMetrics;
  }

  console.log("\n### KNN Evaluation Results ###\n");
  console.log("| K Value | Accuracy (%) | Precision (%) | Recall (%) | F1-Score (%) |");
  console.log("|---------|--------------|---------------|------------|--------------|");
  for (const res of results) {
    console.log(
      `| K = ${res.k}   | ${(res.accuracy * 100).toFixed(2)}%       | ${(res.precision * 100).toFixed(2)}%        | ${(res.recall * 100).toFixed(2)}%      | ${(res.f1 * 100).toFixed(2)}%        |`
    );
  }

  // Print most confused pairs
  console.log(`\n### Top Confused Pairs for K = ${bestK} ###`);
  const pairs: { actual: string; predicted: string; count: number }[] = [];
  for (let i = 0; i < classes.length; i++) {
    for (let j = 0; j < classes.length; j++) {
      if (i !== j && bestConfusionMatrix[i][j] > 0) {
        pairs.push({ actual: classes[i], predicted: classes[j], count: bestConfusionMatrix[i][j] });
      }
    }
  }

  pairs.sort((a, b) => b.count - a.count);
  console.log("\n| Actual Letter | Predicted (Confused) | Count |");
  console.log("|---------------|----------------------|-------|");
  pairs.slice(0, 10).forEach((p) => {
    console.log(`| ${p.actual}             | ${p.predicted}                    | ${p.count}     |`);
  });

  // ===== Write evaluation data into model-pretrained.json =====
  const evaluation = {
    best_k: bestK,
    k_comparison: results.map((r) => ({
      k: r.k,
      accuracy: +r.accuracy.toFixed(4),
      precision: +r.precision.toFixed(4),
      recall: +r.recall.toFixed(4),
      f1: +r.f1.toFixed(4),
    })),
    confusion_matrix: bestConfusionMatrix,
    per_class_metrics: bestPerClassMetrics,
    total_train_samples: trainSamples.length,
    total_test_samples: testSamples.length,
    evaluated_at: new Date().toISOString().split("T")[0],
  };

  // Merge evaluation into existing data
  data.evaluation = evaluation;

  const outputPath = path.join(__dirname, "../public/model-pretrained.json");
  console.log(`\nWriting evaluation data to ${outputPath}...`);
  fs.writeFileSync(outputPath, JSON.stringify(data));
  console.log("✅ Evaluation data has been written to model-pretrained.json!");
  console.log(`   Best K: ${bestK} (Accuracy: ${(bestResult.accuracy * 100).toFixed(2)}%)`);
}

main();
