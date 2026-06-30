import { FieldValue } from "firebase/firestore";

export interface UserDoc {
  uid: string;
  name: string;
  email: string | null;
  createdAt: FieldValue;
  totalSessions: number;
}

export interface HistoryDoc {
  userId: string;
  sessionId: string;
  letter: string;
  confidence: number;
  timestamp: FieldValue;
}

export interface TrainingSessionDoc {
  userId: string;
  targetLetter: string;
  predictedLetter: string;
  isCorrect: boolean;
  confidence: number;
  timestamp: FieldValue;
}

export interface UserStatsDoc {
  userId: string;
  overallAccuracy: number;
  weakLetters: string[];
  strongLetters: string[];
  totalAttempts: number;
  updatedAt: FieldValue;
}
