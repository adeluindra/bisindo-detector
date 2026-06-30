const FINGER_JOINTS: Record<string, number[]> = {
  thumb:  [0, 1, 2, 3, 4],
  index:  [0, 5, 6, 7, 8],
  middle: [0, 9, 10, 11, 12],
  ring:   [0, 13, 14, 15, 16],
  pinky:  [0, 17, 18, 19, 20],
};

function calculateAngle(p1: number[], p2: number[], p3: number[]): number {
  const v1 = p1.map((v, i) => v - p2[i]);
  const v2 = p3.map((v, i) => v - p2[i]);
  const dot = v1.reduce((sum, v, i) => sum + v * v2[i], 0);
  const norm1 = Math.sqrt(v1.reduce((s, v) => s + v * v, 0));
  const norm2 = Math.sqrt(v2.reduce((s, v) => s + v * v, 0));
  const cos = Math.max(-1, Math.min(1, dot / (norm1 * norm2 + 1e-6)));
  return (Math.acos(cos) * 180) / Math.PI; // Menggunakan derajat (0-180) agar cocok dengan dataset
}

export function calculateJointAngles(
  landmarks: { x: number; y: number; z: number }[]
): number[] {
  const points = landmarks.map((lm) => [lm.x, lm.y, lm.z]);
  const angles: number[] = [];

  for (const idx of Object.values(FINGER_JOINTS)) {
    for (let i = 1; i < 4; i++) {
      angles.push(calculateAngle(points[idx[i - 1]], points[idx[i]], points[idx[i + 1]]));
    }
  }
  return angles; // 15 nilai
}
