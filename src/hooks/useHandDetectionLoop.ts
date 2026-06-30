import { initHandLandmarker } from "@/lib/mediapipe/handLandmarker";
import { buildFeatureVector } from "@/lib/mediapipe/featureExtractor";

export function startDetectionLoop(
  video: HTMLVideoElement,
  onFrame: (features: number[] | null, landmarksList: { x: number; y: number; z: number }[][] | null) => void
) {
  let lastTimestamp = -1;
  let active = true;

  async function run() {
    try {
      const landmarker = await initHandLandmarker();
      
      function loop() {
        if (!active) return;
        try {
          const now = performance.now();

          // Guard: ensure video is ready and has valid dimensions before processing
          // This prevents MediaPipe "ROI width and height must be > 0" error
          const isVideoReady =
            video.readyState >= 2 &&
            video.videoWidth > 0 &&
            video.videoHeight > 0;

          if (isVideoReady && video.currentTime !== lastTimestamp) {
            lastTimestamp = video.currentTime;
            const result = landmarker.detectForVideo(video, now);

            if (result.landmarks && result.landmarks.length > 0) {
              const features = buildFeatureVector(result.landmarks, result.handedness);
              onFrame(features, result.landmarks);
            } else {
              onFrame(null, null);
            }
          }
        } catch (err) {
          // Suppress known MediaPipe WASM errors to prevent console spam
          const msg = String(err);
          if (!msg.includes("RET_CHECK") && !msg.includes("roi->width")) {
            console.error("Error in detection loop:", err);
          }
        }

        if (active) {
          requestAnimationFrame(loop);
        }
      }

      requestAnimationFrame(loop);
    } catch (err) {
      console.error("Failed to initialize hand landmarker in loop:", err);
    }
  }

  run();

  return () => {
    active = false;
  };
}

