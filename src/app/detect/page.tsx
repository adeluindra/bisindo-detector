"use client";

import React, { useEffect, useRef, useState } from "react";
import Link from "next/link";
import CameraView from "@/components/camera/CameraView";
import HandSkeletonOverlay from "@/components/camera/HandSkeletonOverlay";
import { useRequireAuth } from "@/hooks/useRequireAuth";
import { startDetectionLoop } from "@/hooks/useHandDetectionLoop";
import { useStabilityTracker } from "@/hooks/useStablePrediction";
import { KNNClassifier } from "@/lib/knn/classifier";
import { getTrainingData, loadModelIntoIndexedDB } from "@/lib/knn/loadModel";
import { saveDetectionHistory } from "@/lib/firebase/firestore";

const DEFAULT_K = 5;
const CONFIDENCE_THRESHOLD = 0.55;

export default function DetectPage() {
  const { user, loading: authLoading } = useRequireAuth();
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const sessionIdRef = useRef<string>(`session-${Date.now()}`);

  const [classifier, setClassifier] = useState<KNNClassifier | null>(null);
  const [modelReady, setModelReady] = useState(false);
  const [status, setStatus] = useState("Memuat model...");
  const [prediction, setPrediction] = useState<string | null>(null);
  const [confidence, setConfidence] = useState(0);
  const [stabilityProgress, setStabilityProgress] = useState(0);
  const [sentence, setSentence] = useState("");
  const [landmarks, setLandmarks] = useState<{ x: number; y: number; z: number }[][] | null>(null);
  const stabilityTracker = useStabilityTracker(20);

  // Performance monitoring
  const [fps, setFps] = useState(0);
  const [latency, setLatency] = useState(0);
  const frameCountRef = useRef(0);
  const lastFpsUpdateRef = useRef(performance.now());

  useEffect(() => {
    if (!user) return;

    async function setupKNN() {
      try {
        setStatus("Memuat model...");
        await loadModelIntoIndexedDB();
        const trainingData = await getTrainingData();
        if (trainingData.length === 0) {
          setStatus("Data model kosong.");
          return;
        }
        const knn = new KNNClassifier();
        knn.loadTrainingData(trainingData);
        setClassifier(knn);
        setModelReady(true);
        setStatus("Posisikan tangan Anda di depan kamera...");
      } catch (err) {
        console.error(err);
        setStatus("Gagal menginisialisasi model.");
      }
    }

    setupKNN();
  }, [user]);

  useEffect(() => {
    if (!modelReady || !classifier || !videoRef.current || !user) return;

    const video = videoRef.current;
    
    // Setup and start detection loop
    const stopLoop = startDetectionLoop(video, (features, landmarksList) => {
      // Calculate FPS
      frameCountRef.current++;
      const now = performance.now();
      const delta = now - lastFpsUpdateRef.current;
      if (delta >= 1000) {
        setFps(Math.round((frameCountRef.current * 1000) / delta));
        frameCountRef.current = 0;
        lastFpsUpdateRef.current = now;
      }

      setLandmarks(landmarksList);

      if (!features) {
        setStatus("Tangan tidak terdeteksi");
        setPrediction(null);
        setConfidence(0);
        setStabilityProgress(0);
        return;
      }

      // Predict with latency measurement
      const startInference = performance.now();
      const result = classifier.predict(features, DEFAULT_K);
      const endInference = performance.now();
      setLatency(Math.round(endInference - startInference));

      if (result.confidence < CONFIDENCE_THRESHOLD) {
        setStatus("Isyarat kurang jelas");
        setPrediction(null);
        setConfidence(result.confidence);
        setStabilityProgress(0);
        return;
      }

      setStatus("Mendeteksi isyarat...");
      setPrediction(result.label);
      setConfidence(result.confidence);

      // Track stability
      const { isLocked, progress } = stabilityTracker.update(result.label);
      setStabilityProgress(progress);

      if (isLocked) {
        setSentence((prev) => prev + result.label);
        // Save to Firestore
        saveDetectionHistory(user.uid, sessionIdRef.current, result.label, result.confidence)
          .catch((err) => console.error("Failed to save history:", err));
      }
    });

    return () => {
      stopLoop();
    };
  }, [modelReady, classifier, user]);

  const handleBackspace = () => {
    setSentence((prev) => prev.slice(0, -1));
  };

  const handleClear = () => {
    setSentence("");
    sessionIdRef.current = `session-${Date.now()}`;
  };

  if (authLoading) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center bg-slate-950 text-slate-350">
        <span className="w-8 h-8 border-4 border-indigo-650/20 border-t-indigo-500 rounded-full animate-spin mr-3" />
        <span>Memuat...</span>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans flex flex-col relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute top-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-indigo-900/10 blur-[100px] pointer-events-none" />

      {/* Header */}
      <header className="border-b border-slate-900 bg-slate-950/80 backdrop-blur-md px-6 py-4 flex items-center justify-between z-20">
        <div className="flex items-center gap-3">
          <Link
            href="/dashboard"
            className="text-slate-400 hover:text-white transition-colors text-sm font-semibold flex items-center gap-1.5"
          >
            ← Kembali
          </Link>
          <span className="text-slate-700">|</span>
          <h1 className="text-lg font-bold tracking-tight">Deteksi Real-Time</h1>
        </div>

        {/* Perf indicators */}
        <div className="flex items-center gap-4 text-xs text-slate-400">
          <div className="bg-slate-900 border border-slate-850 rounded-lg px-2.5 py-1">
            FPS: <span className={fps >= 24 ? "text-emerald-400 font-bold" : "text-amber-400 font-bold"}>{fps}</span>
          </div>
          <div className="bg-slate-900 border border-slate-850 rounded-lg px-2.5 py-1">
            Latensi: <span className={latency < 50 ? "text-emerald-400 font-bold" : "text-amber-400 font-bold"}>{latency}ms</span>
          </div>
        </div>
      </header>

      {/* Main Content Layout */}
      <div className="flex-1 flex flex-col md:flex-row z-10">
        {/* Left column: Video feed */}
        <div className="flex-1 p-6 flex flex-col items-center justify-center border-r border-slate-900">
          <div className="relative w-full max-w-2xl aspect-[4/3] rounded-3xl overflow-hidden shadow-2xl border border-slate-800">
            {/* The Webcam View */}
            <CameraView videoRef={videoRef} className="w-full h-full" />
            
            {/* The SVG/Canvas hand skeleton layer */}
            <HandSkeletonOverlay landmarksList={landmarks} />

            {/* Prediction overlay */}
            {prediction && (
              <div className="absolute top-4 left-4 bg-slate-950/80 backdrop-blur-md px-4 py-2 rounded-2xl border border-slate-800 flex items-center gap-3">
                <span className="text-2xl font-black text-indigo-400">{prediction}</span>
                <span className="text-xs font-semibold text-slate-400">{(confidence * 100).toFixed(0)}% Match</span>
              </div>
            )}

            {/* Status bar */}
            <div className="absolute bottom-4 left-4 right-4 bg-slate-950/80 backdrop-blur-md px-4 py-3 rounded-2xl border border-slate-800 text-center text-sm font-semibold text-slate-300">
              {status}
            </div>
          </div>
        </div>

        {/* Right column: Results and sentences */}
        <div className="w-full md:w-[380px] p-6 flex flex-col justify-between bg-slate-900/10 gap-6">
          {/* Top segment: Prediction metrics */}
          <div className="space-y-6">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-450">Hasil Prediksi</h2>
            
            {/* Prediction Card */}
            <div className="p-8 rounded-3xl bg-slate-900 border border-slate-850 flex flex-col items-center justify-center relative shadow-inner">
              <div className="text-8xl font-black tracking-tight text-indigo-400 mb-4 h-24 flex items-center justify-center min-w-[120px]">
                {prediction || "-"}
              </div>
              <p className="text-xs text-slate-400 font-semibold mb-6">Huruf Terdeteksi</p>

              {/* Confidence and Stability Bars */}
              <div className="w-full space-y-4">
                {/* Match percentage */}
                <div>
                  <div className="flex justify-between text-xs font-semibold text-slate-300 mb-1.5">
                    <span>Kecocokan</span>
                    <span>{(confidence * 100).toFixed(0)}%</span>
                  </div>
                  <div className="w-full h-2 bg-slate-950 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-indigo-500 to-indigo-400 transition-all duration-150"
                      style={{ width: `${confidence * 100}%` }}
                    />
                  </div>
                </div>

                {/* Stability Progress (Hold timer) */}
                <div>
                  <div className="flex justify-between text-xs font-semibold text-slate-300 mb-1.5">
                    <span>Penguncian Huruf (20 frame)</span>
                    <span>{(stabilityProgress * 100).toFixed(0)}%</span>
                  </div>
                  <div className="w-full h-2 bg-slate-950 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-purple-500 to-pink-500 transition-all duration-100"
                      style={{ width: `${stabilityProgress * 100}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Instruction list */}
            <div className="p-4 rounded-2xl border border-slate-850 text-xs text-slate-400 space-y-2">
              <p className="font-semibold text-slate-300">💡 Cara Menginput Huruf:</p>
              <p>1. Lakukan isyarat tangan BISINDO secara konstan.</p>
              <p>2. Tahan gerakan tangan Anda selama 20 frame sampai bar penguncian penuh.</p>
              <p>3. Huruf akan otomatis terketik di panel kalimat.</p>
            </div>
          </div>

          {/* Bottom segment: Accumulated Sentence */}
          <div className="space-y-4">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-450">Kalimat Terbentuk</h2>
            
            {/* Sentence panel */}
            <div className="p-4 rounded-2xl bg-slate-900 border border-slate-850 min-h-[90px] flex flex-wrap items-center gap-1 text-lg font-bold tracking-wide break-all text-indigo-300">
              {sentence ? sentence : <span className="text-slate-600 text-sm font-medium">Belum ada input huruf...</span>}
            </div>

            {/* Sentence control buttons */}
            <div className="grid grid-cols-2 gap-4">
              <button
                onClick={handleBackspace}
                className="py-2.5 rounded-xl border border-slate-850 hover:border-slate-800 bg-slate-950/40 hover:bg-slate-950/90 text-slate-300 text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5"
              >
                <span>⬅️</span> Hapus
              </button>
              <button
                onClick={handleClear}
                className="py-2.5 rounded-xl bg-red-950/20 hover:bg-red-950/40 border border-red-900/30 hover:border-red-900/50 text-red-300 text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5"
              >
                <span>🗑️</span> Bersihkan
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
