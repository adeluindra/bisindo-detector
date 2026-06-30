"use client";

import React, { useEffect, useRef, useCallback } from "react";

export function useCameraStream(videoRef: React.RefObject<HTMLVideoElement | null>) {
  const streamRef = useRef<MediaStream | null>(null);

  // Centralized cleanup function that stops all tracks and clears the video element
  const stopCamera = useCallback(() => {
    // Stop all tracks on the stored stream ref
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => {
        track.stop();
      });
      streamRef.current = null;
    }

    // Also stop tracks directly from the video element's srcObject (safety net)
    if (videoRef.current?.srcObject) {
      const mediaStream = videoRef.current.srcObject as MediaStream;
      mediaStream.getTracks().forEach((track) => track.stop());
      videoRef.current.srcObject = null;
      videoRef.current.pause();
    }
  }, [videoRef]);

  useEffect(() => {
    let cancelled = false;

    async function startCamera() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { width: 640, height: 480, facingMode: "user" },
          audio: false,
        });

        // If component unmounted while waiting for getUserMedia, stop immediately
        if (cancelled) {
          stream.getTracks().forEach((track) => track.stop());
          return;
        }

        streamRef.current = stream;

        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.setAttribute("playsinline", "true");
          try {
            await videoRef.current.play();
          } catch (playErr: any) {
            if (playErr.name !== "AbortError") {
              console.error("Error playing video stream:", playErr);
            }
          }
        }
      } catch (err) {
        console.error("Error accessing webcam:", err);
      }
    }

    startCamera();

    return () => {
      cancelled = true;
      stopCamera();
    };
  }, [videoRef, stopCamera]);
}

interface CameraViewProps {
  videoRef: React.RefObject<HTMLVideoElement | null>;
  className?: string;
}

export default function CameraView({ videoRef, className = "" }: CameraViewProps) {
  useCameraStream(videoRef);

  return (
    <div className={`relative overflow-hidden rounded-2xl bg-slate-900 shadow-xl ${className}`}>
      <video
        ref={videoRef}
        className="h-full w-full object-cover scale-x-[-1]" // mirror effect
        muted
        playsInline
      />
    </div>
  );
}

