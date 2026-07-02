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

function evaluateForK(
  classifier: KNNClassifier,
  testSamples: { features: number[]; label: string }[],
  k: number,
  classes: string[]
): EvalMetrics {
  // Confusion matrix: confusion[actual][predicted] = count
  const confusion: Record<string, Record<string, number>> = {};
  classes.forEach((c) => {
    confusion[c] = {};
    classes.forEach((pred) => {
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

  for (const actual of classes) {
    let tp = confusion[actual][actual] || 0;
    let fn = 0;
    let fp = 0;

    for (const predicted of classes) {
      const count = confusion[actual][predicted] || 0;
      total += count;
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
  }

  return {
    k,
    accuracy: correct / total,
    precision: precisions.reduce((a, b) => a + b, 0) / precisions.length,
    recall: recalls.reduce((a, b) => a + b, 0) / recalls.length,
    f1: f1s.reduce((a, b) => a + b, 0) / f1s.length,
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

  console.log("\nEvaluating K values...");
  for (const k of kValues) {
    const start = Date.now();
    const metrics = evaluateForK(classifier, testSamples, k, classes);
    const duration = Date.now() - start;
    console.log(`K = ${k} evaluated in ${duration}ms.`);
    results.push(metrics);
  }

  console.log("\n### KNN Evaluation Results ###\n");
  console.log("| K Value | Accuracy (%) | Precision (%) | Recall (%) | F1-Score (%) |");
  console.log("|---------|--------------|---------------|------------|--------------|");
  for (const res of results) {
    console.log(
      `| K = ${res.k}   | ${(res.accuracy * 100).toFixed(2)}%       | ${(res.precision * 100).toFixed(2)}%        | ${(res.recall * 100).toFixed(2)}%      | ${(res.f1 * 100).toFixed(2)}%        |`
    );
  }

  // Find most confused pairs for K = 5 (or the best K)
  const bestK = 5; // standard K
  console.log(`\n### Top Confused Pairs for K = ${bestK} ###`);
  const confusion: Record<string, Record<string, number>> = {};
  classes.forEach((c: string) => {
    confusion[c] = {};
    classes.forEach((pred: string) => {
      confusion[c][pred] = 0;
    });
  });

  for (const sample of testSamples) {
    const result = classifier.predict(sample.features, bestK);
    confusion[sample.label][result.label] = (confusion[sample.label][result.label] || 0) + 1;
  }

  const pairs: { actual: string; predicted: string; count: number }[] = [];
  for (const actual of classes) {
    for (const predicted of classes) {
      const count = confusion[actual][predicted] || 0;
      if (actual !== predicted && count > 0) {
        pairs.push({ actual, predicted, count });
      }
    }
  }

  pairs.sort((a, b) => b.count - a.count);
  console.log("\n| Actual Letter | Predicted (Confused) | Count |");
  console.log("|---------------|----------------------|-------|");
  pairs.slice(0, 10).forEach((p) => {
    console.log(`| ${p.actual}             | ${p.predicted}                    | ${p.count}     |`);
  });
}

main();
