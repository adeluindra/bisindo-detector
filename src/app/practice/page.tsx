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
import { saveTrainingAttempt, getUserStats } from "@/lib/firebase/firestore";
import { recalculateUserStats } from "@/lib/stats/updateStats";

const DEFAULT_K = 5;
const CONFIDENCE_THRESHOLD = 0.55;
const LETTERS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");

export default function PracticePage() {
  const { user, loading: authLoading } = useRequireAuth();
  const videoRef = useRef<HTMLVideoElement | null>(null);

  const [classifier, setClassifier] = useState<KNNClassifier | null>(null);
  const [modelReady, setModelReady] = useState(false);
  const [status, setStatus] = useState("Memuat model...");
  const [targetLetter, setTargetLetter] = useState<string>("A");
  const [prediction, setPrediction] = useState<string | null>(null);
  const [confidence, setConfidence] = useState(0);
  const [stabilityProgress, setStabilityProgress] = useState(0);
  const [landmarks, setLandmarks] = useState<{ x: number; y: number; z: number }[][] | null>(null);
  
  // Stats
  const [weakLetters, setWeakLetters] = useState<string[]>([]);
  const [strongLetters, setStrongLetters] = useState<string[]>([]);
  
  // Feedback States
  const [feedback, setFeedback] = useState<{ type: "correct" | "incorrect" | null; text: string }>({
    type: null,
    text: "",
  });

  // Modal State
  const [showModal, setShowModal] = useState(false);
  
  const stabilityTracker = useStabilityTracker(20);

  // Fetch Stats on load
  const fetchStats = async (uid: string) => {
    try {
      const stats = await getUserStats(uid);
      if (stats) {
        setWeakLetters(stats.weakLetters || []);
        setStrongLetters(stats.strongLetters || []);
      }
    } catch (err) {
      console.error("Failed to fetch user stats:", err);
    }
  };

  useEffect(() => {
    if (!user) return;
    fetchStats(user.uid);
  }, [user]);

  // Init KNN Model
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
        setStatus(`Silakan peragakan isyarat huruf ${targetLetter}...`);
      } catch (err) {
        console.error(err);
        setStatus("Gagal menginisialisasi model.");
      }
    }

    setupKNN();
  }, [user, targetLetter]);

  // Detection loop
  useEffect(() => {
    if (!modelReady || !classifier || !videoRef.current || !user || feedback.type !== null) return;

    const video = videoRef.current;
    
    const stopLoop = startDetectionLoop(video, (features, landmarksList) => {
      setLandmarks(landmarksList);

      if (!features) {
        setPrediction(null);
        setConfidence(0);
        setStabilityProgress(0);
        return;
      }

      const result = classifier.predict(features, DEFAULT_K);

      if (result.confidence < CONFIDENCE_THRESHOLD) {
        setPrediction(null);
        setConfidence(result.confidence);
        setStabilityProgress(0);
        return;
      }

      setPrediction(result.label);
      setConfidence(result.confidence);

      // Track stability against the target letter
      const { isLocked, progress } = stabilityTracker.update(result.label);
      setStabilityProgress(progress);

      if (isLocked) {
        const isCorrect = result.label === targetLetter;
        
        // Log training attempt to Firestore
        saveTrainingAttempt(user.uid, targetLetter, result.label, isCorrect, result.confidence)
          .then(() => recalculateUserStats(user.uid))
          .then(() => fetchStats(user.uid))
          .catch((err) => console.error("Failed to update stats:", err));

        // Trigger visual feedback and pause loop
        if (isCorrect) {
          setFeedback({
            type: "correct",
            text: `Hebat! Anda berhasil memperagakan isyarat huruf "${targetLetter}" dengan benar.`,
          });
        } else {
          setFeedback({
            type: "incorrect",
            text: `Ups! Isyarat Anda terdeteksi sebagai huruf "${result.label}". Coba lagi.`,
          });
        }
        
        setStabilityProgress(0);
      }
    });

    return () => {
      stopLoop();
    };
  }, [modelReady, classifier, targetLetter, user, feedback.type]);

  const handleNextLetter = () => {
    setFeedback({ type: null, text: "" });
    setPrediction(null);
    setConfidence(0);
    setStabilityProgress(0);
    setLandmarks(null);
    
    // Select next letter in alphabetical order
    const currentIndex = LETTERS.indexOf(targetLetter);
    const nextIndex = (currentIndex + 1) % LETTERS.length;
    setTargetLetter(LETTERS[nextIndex]);
  };

  const handleRetry = () => {
    setFeedback({ type: null, text: "" });
    setPrediction(null);
    setConfidence(0);
    setStabilityProgress(0);
    setLandmarks(null);
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
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-purple-900/10 blur-[100px] pointer-events-none" />

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
          <h1 className="text-lg font-bold tracking-tight">Latihan Interaktif</h1>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="px-4 py-2 text-xs font-semibold rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white transition-all cursor-pointer flex items-center gap-1"
        >
          📖 Contoh Gestur
        </button>
      </header>

      {/* Main Content Layout */}
      <div className="flex-1 flex flex-col lg:flex-row z-10">
        {/* Left column: Camera view & feedback */}
        <div className="flex-1 p-6 flex flex-col items-center justify-center border-r border-slate-900 gap-6">
          
          {/* Target Prompt */}
          <div className="text-center">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-450 mb-1">Target Huruf</h2>
            <div className="text-6xl font-black text-indigo-400">{targetLetter}</div>
          </div>

          <div className="relative w-full max-w-xl aspect-[4/3] rounded-3xl overflow-hidden shadow-2xl border border-slate-800 bg-slate-900">
            {/* The Camera View - Active only when no feedback is active */}
            {feedback.type === null ? (
              <>
                <CameraView videoRef={videoRef} className="w-full h-full" />
                <HandSkeletonOverlay landmarksList={landmarks} />
                
                {/* Overlay target and status */}
                <div className="absolute top-4 left-4 bg-slate-950/85 backdrop-blur-md px-4 py-2 rounded-2xl border border-slate-800 text-xs font-semibold text-slate-300">
                  Peragakan: <span className="text-sm font-bold text-indigo-400">{targetLetter}</span>
                </div>
                
                {/* Hold locking progress bar */}
                <div className="absolute bottom-4 left-4 right-4 bg-slate-950/85 backdrop-blur-md p-4 rounded-2xl border border-slate-800 flex flex-col gap-2">
                  <div className="flex justify-between text-xs font-semibold text-slate-350">
                    <span>Mencocokkan...</span>
                    <span>{(stabilityProgress * 100).toFixed(0)}%</span>
                  </div>
                  <div className="w-full h-1.5 bg-slate-900 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-purple-500 to-pink-500 transition-all duration-100"
                      style={{ width: `${stabilityProgress * 100}%` }}
                    />
                  </div>
                </div>
              </>
            ) : (
              /* Success / Failure Screen */
              <div className={`absolute inset-0 flex flex-col items-center justify-center p-8 text-center ${
                feedback.type === "correct" 
                  ? "bg-emerald-950/40 backdrop-blur-lg border border-emerald-500/20" 
                  : "bg-red-950/40 backdrop-blur-lg border border-red-500/20"
              }`}>
                <div className="text-6xl mb-6">
                  {feedback.type === "correct" ? "🎉" : "❌"}
                </div>
                <h3 className={`text-2xl font-black mb-3 ${
                  feedback.type === "correct" ? "text-emerald-400" : "text-red-400"
                }`}>
                  {feedback.type === "correct" ? "BENAR!" : "SALAH!"}
                </h3>
                <p className="text-slate-300 max-w-md text-sm leading-relaxed mb-8">
                  {feedback.text}
                </p>
                <div className="flex gap-4">
                  {feedback.type === "correct" ? (
                    <button
                      onClick={handleNextLetter}
                      className="px-6 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-sm transition-all cursor-pointer shadow-lg shadow-emerald-600/20"
                    >
                      Huruf Selanjutnya →
                    </button>
                  ) : (
                    <button
                      onClick={handleRetry}
                      className="px-6 py-3 rounded-xl bg-red-650 hover:bg-red-600 text-white font-semibold text-sm transition-all cursor-pointer shadow-lg shadow-red-600/20"
                    >
                      Coba Lagi
                    </button>
                  )}
                  <button
                    onClick={handleRetry}
                    className="px-6 py-3 rounded-xl border border-slate-800 hover:bg-slate-800 text-slate-300 text-sm font-semibold transition-all cursor-pointer"
                  >
                    Ulang Sesi
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right column: LetterGrid */}
        <div className="w-full lg:w-[360px] p-6 bg-slate-900/10 flex flex-col justify-between gap-6 border-t lg:border-t-0 border-slate-900">
          <div>
            <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-450 mb-3">Pilih Huruf Latihan</h2>
            
            {/* The Grid of A-Z */}
            <div className="grid grid-cols-5 gap-2.5">
              {LETTERS.map((letter) => {
                const isTarget = letter === targetLetter;
                const isStrong = strongLetters.includes(letter);
                const isWeak = weakLetters.includes(letter);

                let bgClass = "bg-slate-900 border-slate-850 hover:border-slate-800 text-slate-300";
                if (isTarget) {
                  bgClass = "bg-indigo-650 border-indigo-500 text-white shadow-lg shadow-indigo-600/20";
                } else if (isStrong) {
                  bgClass = "bg-emerald-950/40 border-emerald-500/30 text-emerald-450 hover:bg-emerald-950/60";
                } else if (isWeak) {
                  bgClass = "bg-red-950/40 border-red-500/30 text-red-450 hover:bg-red-950/60";
                }

                return (
                  <button
                    key={letter}
                    onClick={() => {
                      setTargetLetter(letter);
                      setFeedback({ type: null, text: "" });
                      setStabilityProgress(0);
                    }}
                    className={`h-11 rounded-xl border font-bold text-sm transition-all cursor-pointer flex items-center justify-center ${bgClass}`}
                  >
                    {letter}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Color Guides */}
          <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-850 space-y-3 text-xs">
            <h3 className="font-semibold text-slate-300">💡 Keterangan Warna:</h3>
            <div className="flex items-center gap-3">
              <span className="w-4 h-4 rounded-md bg-indigo-650 border border-indigo-500 block" />
              <span className="text-slate-400">Target Belajar Saat Ini</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="w-4 h-4 rounded-md bg-emerald-950/40 border border-emerald-500/30 block" />
              <span className="text-slate-400">Dikuasai (Akurasi ≥ 90%)</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="w-4 h-4 rounded-md bg-red-950/40 border border-red-500/30 block" />
              <span className="text-slate-400">Perlu Latihan (Akurasi &lt; 60%)</span>
            </div>
          </div>
        </div>
      </div>

      {/* Gesture Reference Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-md p-6 relative shadow-2xl">
            <button
              onClick={() => setShowModal(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white text-lg font-bold cursor-pointer"
            >
              ✕
            </button>
            <h3 className="text-lg font-bold mb-4 tracking-tight">Contoh Isyarat Huruf {targetLetter}</h3>
            
            <div className="aspect-[4/3] rounded-2xl bg-slate-950 border border-slate-850 flex items-center justify-center overflow-hidden mb-6 relative">
              {/* Reference Image with elegant fallback if image does not exist */}
              <img
                src={`/gestures/${targetLetter}.png`}
                alt={`Gestur BISINDO Huruf ${targetLetter}`}
                className="w-full h-full object-contain"
                onError={(e) => {
                  // Replace with visual placeholder if image doesn't exist
                  e.currentTarget.style.display = "none";
                  const placeholder = document.getElementById("gesture-placeholder");
                  if (placeholder) placeholder.style.display = "flex";
                }}
              />
              <div
                id="gesture-placeholder"
                className="hidden absolute inset-0 flex-col items-center justify-center p-4 text-center text-slate-500"
              >
                <span className="text-7xl font-black text-indigo-950 mb-2">{targetLetter}</span>
                <p className="text-xs max-w-[240px]">
                  Gambar panduan gestur `/gestures/${targetLetter}.png` belum diunggah. Silakan letakkan gambar referensi Anda di folder `public/gestures/`.
                </p>
              </div>
            </div>

            <button
              onClick={() => setShowModal(false)}
              className="w-full py-3 rounded-xl bg-slate-950 hover:bg-slate-950/80 text-slate-350 hover:text-white font-semibold text-xs transition-all border border-slate-850 cursor-pointer"
            >
              Tutup Panduan
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
