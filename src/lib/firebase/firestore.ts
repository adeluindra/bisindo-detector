import { db } from "./config";
import {
  collection,
  addDoc,
  doc,
  setDoc,
  getDoc,
  query,
  where,
  orderBy,
  getDocs,
  serverTimestamp,
} from "firebase/firestore";

export async function saveDetectionHistory(
  userId: string,
  sessionId: string,
  letter: string,
  confidence: number
) {
  await addDoc(collection(db, "history"), {
    userId,
    sessionId,
    letter,
    confidence,
    timestamp: serverTimestamp(),
  });
}

export async function saveTrainingAttempt(
  userId: string,
  targetLetter: string,
  predictedLetter: string,
  isCorrect: boolean,
  confidence: number
) {
  await addDoc(collection(db, "training_sessions"), {
    userId,
    targetLetter,
    predictedLetter,
    isCorrect,
    confidence,
    timestamp: serverTimestamp(),
  });
}

export async function getUserHistory(userId: string) {
  const q = query(
    collection(db, "history"),
    where("userId", "==", userId)
  );
  const docs = (await getDocs(q)).docs.map((d) => ({
    id: d.id,
    ...d.data(),
  })) as any[];

  return docs.sort((a, b) => {
    const timeA = a.timestamp?.seconds || 0;
    const timeB = b.timestamp?.seconds || 0;
    return timeB - timeA;
  });
}

export async function getUserTrainingSessions(userId: string) {
  const q = query(
    collection(db, "training_sessions"),
    where("userId", "==", userId)
  );
  const docs = (await getDocs(q)).docs.map((d) => ({
    id: d.id,
    ...d.data(),
  })) as any[];

  return docs.sort((a, b) => {
    const timeA = a.timestamp?.seconds || 0;
    const timeB = b.timestamp?.seconds || 0;
    return timeB - timeA;
  });
}

export async function getUserStats(userId: string) {
  const ref = doc(db, "user_stats", userId);
  const snap = await getDoc(ref);
  return snap.exists() ? snap.data() : null;
}

export async function updateUserStats(
  userId: string,
  stats: {
    overallAccuracy: number;
    weakLetters: string[];
    strongLetters: string[];
    totalAttempts: number;
  }
) {
  await setDoc(
    doc(db, "user_stats", userId),
    {
      userId,
      ...stats,
      updatedAt: serverTimestamp(),
    },
    { merge: true }
  );
}
