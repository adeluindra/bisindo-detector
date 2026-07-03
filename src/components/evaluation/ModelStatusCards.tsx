"use client";

import React from "react";
import type { ModelEvaluation, KComparison } from "@/types/evaluation";

interface ModelStatusCardsProps {
  evaluation: ModelEvaluation;
  bestK: KComparison;
}

const stats = [
  { key: "train", icon: "🗂️", label: "Total Data Training" },
  { key: "bestk", icon: "🎯", label: "Nilai K Terbaik" },
  { key: "accuracy", icon: "📈", label: "Akurasi Terbaik" },
  { key: "features", icon: "🧬", label: "Dimensi Fitur" },
] as const;

export function ModelStatusCards({ evaluation, bestK }: ModelStatusCardsProps) {
  const values: Record<string, { value: string; sub: string }> = {
    train: {
      value: evaluation.total_train_samples.toLocaleString(),
      sub: `${evaluation.total_test_samples.toLocaleString()} data uji`,
    },
    bestk: {
      value: `K = ${evaluation.best_k}`,
      sub: "dari eksperimen K=1,3,5,7,9",
    },
    accuracy: {
      value: `${(bestK.accuracy * 100).toFixed(2)}%`,
      sub: `F1-Score: ${(bestK.f1 * 100).toFixed(2)}%`,
    },
    features: {
      value: "156",
      sub: "63 koordinat + 15 sudut × 2 tangan",
    },
  };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {stats.map((stat) => {
        const v = values[stat.key];
        return (
          <div
            key={stat.key}
            className="relative overflow-hidden rounded-2xl bg-slate-900/50 border border-slate-800 p-5 transition-all hover:border-indigo-500/30 hover:shadow-lg hover:shadow-indigo-500/5 hover:-translate-y-0.5 duration-300"
          >
            {/* Subtle gradient glow */}
            <div className="absolute top-0 right-0 w-20 h-20 bg-indigo-500/5 rounded-full blur-2xl pointer-events-none" />

            <div className="text-2xl mb-3">{stat.icon}</div>
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-1">
              {stat.label}
            </p>
            <p className="text-2xl font-extrabold text-slate-100 tracking-tight">
              {v.value}
            </p>
            <p className="text-xs text-slate-500 mt-1">{v.sub}</p>
          </div>
        );
      })}
    </div>
  );
}
