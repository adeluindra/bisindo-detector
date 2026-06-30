import { useRef } from "react";

export function useStabilityTracker(stableFrameThreshold = 20) {
  const currentLabelRef = useRef<string | null>(null);
  const stableCountRef = useRef<number>(0);

  function update(predictedLabel: string): { isLocked: boolean; progress: number } {
    if (predictedLabel === currentLabelRef.current) {
      stableCountRef.current++;
    } else {
      currentLabelRef.current = predictedLabel;
      stableCountRef.current = 1;
    }

    const isLocked = stableCountRef.current >= stableFrameThreshold;
    const progress = Math.min(stableCountRef.current / stableFrameThreshold, 1);

    if (isLocked) {
      // Reset counter after locking to start counting for the next letter
      stableCountRef.current = 0;
      currentLabelRef.current = null;
    }

    return { isLocked, progress };
  }

  function reset() {
    currentLabelRef.current = null;
    stableCountRef.current = 0;
  }

  return { update, reset };
}
