import { openDB } from "idb";
import type { TrainingSample } from "@/types/knn";

const DB_NAME = "bisindo-knn-db";
const STORE_NAME = "training-data";

async function getDB() {
  return openDB(DB_NAME, 1, {
    upgrade(db) {
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    },
  });
}

export async function loadModelIntoIndexedDB(): Promise<void> {
  const db = await getDB();
  const existing = await db.get(STORE_NAME, "train");
  if (existing && existing.length > 0) return; // Already loaded

  const res = await fetch("/model-pretrained.json");
  const data = await res.json();

  const rawSamples = data.samples || data.train || [];
  const trainingData = rawSamples.map((s: any) => ({
    label: s.label,
    features: s.landmarks || s.features || [],
  }));

  await db.put(STORE_NAME, trainingData, "train");
}

export async function getTrainingData(): Promise<TrainingSample[]> {
  const db = await getDB();
  const data = await db.get(STORE_NAME, "train");
  return (data && data.length > 0) ? data : [];
}
