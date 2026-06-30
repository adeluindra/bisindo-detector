import { normalizeLandmarks } from "./normalize";
import { calculateJointAngles } from "./jointAngles";

export function buildFeatureVector(
  handLandmarksList: { x: number; y: number; z: number }[][],
  handedness: { categoryName: string }[][]
): number[] {
  let left = new Array(78).fill(0);
  let right = new Array(78).fill(0);

  handLandmarksList.forEach((landmarks, i) => {
    const label = handedness[i][0].categoryName; // "Left" | "Right"
    const coords = normalizeLandmarks(landmarks);      // 63
    const angles = calculateJointAngles(landmarks);     // 15
    const features = [...coords, ...angles];            // 78

    if (label === "Left") left = features;
    else right = features;
  });

  return [...left, ...right]; // 156
}
