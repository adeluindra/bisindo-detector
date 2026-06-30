export function normalizeLandmarks(landmarks: { x: number; y: number; z: number }[]): number[] {
  const wrist = landmarks[0];
  const relative = landmarks.map((lm) => [
    lm.x - wrist.x,
    lm.y - wrist.y,
    lm.z - wrist.z,
  ]);

  const maxVal = Math.max(
    ...relative.flat().map((v) => Math.abs(v)),
    1e-6
  );

  return relative.flat().map((v) => v / maxVal); // 63 nilai
}
