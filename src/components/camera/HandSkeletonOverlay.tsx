"use client";

import React, { useEffect, useRef } from "react";

// Standard MediaPipe hand connections
const HAND_CONNECTIONS = [
  // Thumb
  [0, 1], [1, 2], [2, 3], [3, 4],
  // Index Finger
  [0, 5], [5, 6], [6, 7], [7, 8],
  // Middle Finger
  [9, 10], [10, 11], [11, 12],
  // Ring Finger
  [13, 14], [14, 15], [15, 16],
  // Pinky
  [0, 17], [17, 18], [18, 19], [19, 20],
  // Palm base connection
  [5, 9], [9, 13], [13, 17]
];

interface HandSkeletonOverlayProps {
  landmarksList: { x: number; y: number; z: number }[][] | null;
  className?: string;
}

export default function HandSkeletonOverlay({
  landmarksList,
  className = "",
}: HandSkeletonOverlayProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Clear previous drawing
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (!landmarksList || landmarksList.length === 0) return;

    // Set styling for joints and bones
    const jointRadius = 4;
    const jointColor = "#3b82f6"; // bright blue
    const tipColor = "#ef4444";   // red for tips (4, 8, 12, 16, 20)
    const boneColor = "rgba(255, 255, 255, 0.8)";
    const boneWidth = 2;

    landmarksList.forEach((landmarks) => {
      // 1. Draw connections (Bones)
      ctx.beginPath();
      ctx.strokeStyle = boneColor;
      ctx.lineWidth = boneWidth;

      HAND_CONNECTIONS.forEach(([start, end]) => {
        const pt1 = landmarks[start];
        const pt2 = landmarks[end];

        if (pt1 && pt2) {
          // Multiply normalized coords [0, 1] by canvas dimensions
          const x1 = pt1.x * canvas.width;
          const y1 = pt1.y * canvas.height;
          const x2 = pt2.x * canvas.width;
          const y2 = pt2.y * canvas.height;

          ctx.moveTo(x1, y1);
          ctx.lineTo(x2, y2);
        }
      });
      ctx.stroke();

      // 2. Draw landmarks (Joints)
      landmarks.forEach((lm, idx) => {
        const x = lm.x * canvas.width;
        const y = lm.y * canvas.height;

        ctx.beginPath();
        ctx.arc(x, y, jointRadius, 0, 2 * Math.PI);
        
        // Highlight finger tips
        const isTip = [4, 8, 12, 16, 20].includes(idx);
        ctx.fillStyle = isTip ? tipColor : jointColor;
        
        ctx.shadowBlur = 4;
        ctx.shadowColor = isTip ? "rgba(239, 68, 68, 0.6)" : "rgba(59, 130, 246, 0.6)";
        ctx.fill();
        
        // Reset shadow
        ctx.shadowBlur = 0;
      });
    });
  }, [landmarksList]);

  return (
    <canvas
      ref={canvasRef}
      width={640}
      height={480}
      className={`absolute inset-0 h-full w-full object-cover scale-x-[-1] pointer-events-none ${className}`} // scale-x-[-1] to match mirrored video
    />
  );
}
