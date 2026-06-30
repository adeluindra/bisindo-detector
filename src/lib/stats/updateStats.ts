import { getUserTrainingSessions, updateUserStats } from "@/lib/firebase/firestore";

export async function recalculateUserStats(userId: string): Promise<void> {
  const sessions = await getUserTrainingSessions(userId);

  if (sessions.length === 0) {
    await updateUserStats(userId, {
      overallAccuracy: 0,
      weakLetters: [],
      strongLetters: [],
      totalAttempts: 0,
    });
    return;
  }

  const perLetter: Record<string, { correct: number; total: number }> = {};
  for (const s of sessions) {
    const target = s.targetLetter;
    if (!perLetter[target]) {
      perLetter[target] = { correct: 0, total: 0 };
    }
    perLetter[target].total++;
    if (s.isCorrect) {
      perLetter[target].correct++;
    }
  }

  const weakLetters: string[] = [];
  const strongLetters: string[] = [];

  for (const [letter, { correct, total }] of Object.entries(perLetter)) {
    const acc = correct / total;
    // Only classify as weak/strong if attempted at least 3 times to prevent early bias
    if (total >= 2) {
      if (acc < 0.6) {
        weakLetters.push(letter);
      } else if (acc >= 0.9) {
        strongLetters.push(letter);
      }
    }
  }

  const overallCorrect = sessions.filter((s) => s.isCorrect).length;
  await updateUserStats(userId, {
    overallAccuracy: overallCorrect / sessions.length,
    weakLetters,
    strongLetters,
    totalAttempts: sessions.length,
  });
}
