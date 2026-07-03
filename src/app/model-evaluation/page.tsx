"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type { ModelEvaluation } from "@/types/evaluation";
import { ModelStatusCards } from "@/components/evaluation/ModelStatusCards";
import { KComparisonTable } from "@/components/evaluation/KComparisonTable";
import { KComparisonChart } from "@/components/evaluation/KComparisonChart";
import { ConfusionMatrixHeatmap } from "@/components/evaluation/ConfusionMatrixHeatmap";
import { PerClassMetricsChart } from "@/components/evaluation/PerClassMetricsChart";

export default function ModelEvaluationPage() {
  const router = useRouter();
  const [evaluation, setEvaluation] = useState<ModelEvaluation | null>(null);
  const [classes, setClasses] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/model-pretrained.json")
      .then((r) => r.json())
      .then((data) => {
        if (!data.evaluation) {
          setError(
            "Field 'evaluation' belum tersedia di model-pretrained.json. Jalankan 'npx tsx scripts/evaluateK.ts' terlebih dahulu."
          );
          return;
        }
        setEvaluation(data.evaluation);
        setClasses(data.classes || [..."ABCDEFGHIJKLMNOPQRSTUVWXYZ"]);
      })
      .catch((err) => {
        console.error("Failed to load evaluation data:", err);
        setError("Gagal memuat data evaluasi.");
      });
  }, []);

  // Loading skeleton
  if (!evaluation && !error) {
    return (
      <div className="relative min-h-screen bg-slate-950 text-slate-100">
        {/* Background gradients */}
        <div className="fixed top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-indigo-900/10 blur-[100px] pointer-events-none" />
        <div className="fixed bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-violet-900/10 blur-[100px] pointer-events-none" />

        <div className="relative z-10 max-w-6xl mx-auto px-6 py-10 space-y-6">
          <div className="h-10 w-80 rounded-xl bg-slate-900/60 animate-pulse" />
          <div className="h-5 w-96 rounded-lg bg-slate-900/40 animate-pulse" />
          <div className="grid grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-28 rounded-2xl bg-slate-900/50 animate-pulse" />
            ))}
          </div>
          <div className="h-64 rounded-2xl bg-slate-900/50 animate-pulse" />
          <div className="h-64 rounded-2xl bg-slate-900/50 animate-pulse" />
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="relative min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center">
        <div className="max-w-md text-center space-y-4 p-8">
          <div className="text-5xl mb-4">⚠️</div>
          <h2 className="text-xl font-bold text-slate-100">Data Evaluasi Belum Tersedia</h2>
          <p className="text-sm text-slate-400 leading-relaxed">{error}</p>
          <div className="flex gap-3 justify-center pt-4">
            <button
              onClick={() => router.push("/dashboard")}
              className="px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 text-sm font-semibold transition-all cursor-pointer"
            >
              ← Kembali ke Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  const bestK = evaluation!.k_comparison.find((k) => k.k === evaluation!.best_k)!;

  return (
    <div className="relative min-h-screen bg-slate-950 text-slate-100 font-sans overflow-x-hidden">
      {/* Background gradients */}
      <div className="fixed top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-indigo-900/10 blur-[100px] pointer-events-none" />
      <div className="fixed bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-violet-900/10 blur-[100px] pointer-events-none" />

      {/* Navbar */}
      <header className="sticky top-0 z-50 border-b border-slate-900/80 bg-slate-950/80 backdrop-blur-xl">
        <div className="max-w-6xl w-full mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.push("/dashboard")}
              className="text-sm text-slate-500 hover:text-slate-300 transition-colors cursor-pointer"
            >
              ← Kembali
            </button>
            <span className="text-slate-800">|</span>
            <span className="text-lg font-bold tracking-wider text-indigo-400">
              Evaluasi Model
            </span>
          </div>
          <span className="text-xs text-slate-600">
            Dievaluasi: {evaluation!.evaluated_at}
          </span>
        </div>
      </header>

      {/* Main Content */}
      <main className="relative z-10 max-w-6xl w-full mx-auto px-6 py-8 space-y-10">
        {/* Header */}
        <div>
          <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight">
            <span className="bg-gradient-to-r from-indigo-400 via-purple-400 to-violet-400 bg-clip-text text-transparent">
              Evaluasi Model KNN
            </span>
          </h1>
          <p className="text-slate-400 text-sm md:text-base mt-2 max-w-2xl leading-relaxed">
            Hasil eksperimen perbandingan nilai K dan performa klasifikasi 26 huruf BISINDO.
            Visualisasi ini merupakan representasi langsung dari BAB VI skripsi.
          </p>
        </div>

        {/* Section 1: Status Cards */}
        <ModelStatusCards evaluation={evaluation!} bestK={bestK} />

        {/* Section 2: K Comparison */}
        <div className="space-y-4">
          <div>
            <h2 className="text-xl font-bold text-slate-100">Perbandingan Nilai K</h2>
            <p className="text-xs text-slate-500 mt-1">
              Perbandingan metrik evaluasi untuk K = 1, 3, 5, 7, 9 menggunakan stratified 80/20 split
            </p>
          </div>
          <KComparisonTable data={evaluation!.k_comparison} bestK={evaluation!.best_k} />
          <KComparisonChart data={evaluation!.k_comparison} />
        </div>

        {/* Section 3: Confusion Matrix */}
        <div className="space-y-4">
          <div>
            <h2 className="text-xl font-bold text-slate-100">Confusion Matrix</h2>
            <p className="text-xs text-slate-500 mt-1">
              Visualisasi matriks kebingungan 26×26 untuk K = {evaluation!.best_k}
            </p>
          </div>
          <ConfusionMatrixHeatmap
            matrix={evaluation!.confusion_matrix}
            classes={classes}
          />
        </div>

        {/* Section 4: Per-Class F1-Score */}
        <div className="space-y-4">
          <div>
            <h2 className="text-xl font-bold text-slate-100">F1-Score per Kelas</h2>
            <p className="text-xs text-slate-500 mt-1">
              Performa klasifikasi individual untuk setiap huruf alfabet BISINDO
            </p>
          </div>
          <PerClassMetricsChart data={evaluation!.per_class_metrics} />
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 border-t border-slate-900/80 bg-slate-950/90 py-6 text-center text-xs text-slate-500 mt-8">
        <p>© 2026. Deteksi Alfabet BISINDO - K-Nearest Neighbor & MediaPipe Hands.</p>
      </footer>
    </div>
  );
}
