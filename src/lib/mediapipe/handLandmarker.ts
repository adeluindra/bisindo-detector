import {
  HandLandmarker,
  FilesetResolver,
} from "@mediapipe/tasks-vision";

// Filter out MediaPipe WASM log spam from console.error so Next.js overlay doesn't intercept it as a crash
if (typeof window !== "undefined") {
  const originalError = console.error;
  console.error = (...args: any[]) => {
    const msg = typeof args[0] === "string" ? args[0] : String(args[0]);
    if (
      msg.includes("INFO:") ||
      msg.includes("Created TensorFlow Lite") ||
      msg.includes("XNNPACK") ||
      msg.includes("delegate") ||
      msg.includes("RET_CHECK") ||
      msg.includes("image_to_tensor") ||
      msg.includes("roi->width") ||
      msg.includes("ROI width")
    ) {
      // Suppress MediaPipe WASM info/internal messages
      return;
    }
    originalError.apply(console, args);
  };
}

let handLandmarker: HandLandmarker | null = null;

export async function initHandLandmarker(): Promise<HandLandmarker> {
  if (handLandmarker) return handLandmarker;

  const vision = await FilesetResolver.forVisionTasks(
    "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm"
  );

  handLandmarker = await HandLandmarker.createFromOptions(vision, {
    baseOptions: {
      modelAssetPath:
        "https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task",
    },
    runningMode: "VIDEO",
    numHands: 2,
    minHandDetectionConfidence: 0.5,
    minHandPresenceConfidence: 0.5,
    minTrackingConfidence: 0.5,
  });

  return handLandmarker;
}
