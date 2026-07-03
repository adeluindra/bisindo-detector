"use client";

import React, { useState } from "react";

interface ConfusionMatrixHeatmapProps {
  matrix: number[][];
  classes: string[];
}

export function ConfusionMatrixHeatmap({ matrix, classes }: ConfusionMatrixHeatmapProps) {
  const [hoveredCell, setHoveredCell] = useState<{ row: number; col: number } | null>(null);
  const maxVal = Math.max(...matrix.flat());

  // Compute most confused pairs
  const pairs: { actual: string; predicted: string; count: number }[] = [];
  for (let i = 0; i < classes.length; i++) {
    for (let j = 0; j < classes.length; j++) {
      if (i !== j && matrix[i][j] > 0) {
        pairs.push({ actual: classes[i], predicted: classes[j], count: matrix[i][j] });
      }
    }
  }
  const top5 = pairs.sort((a, b) => b.count - a.count).slice(0, 5);

  return (
    <div className="rounded-2xl bg-slate-900/50 border border-slate-800 p-6">
      <h3 className="text-base font-bold text-slate-100 mb-1">Confusion Matrix</h3>
      <p className="text-xs text-slate-500 mb-6">
        Diagonal (ungu) = prediksi benar. Off-diagonal (merah) = kesalahan klasifikasi.
      </p>

      {/* Matrix grid */}
      <div className="overflow-x-auto pb-4">
        <div className="inline-block">
          {/* Column labels */}
          <div className="flex">
            <div className="w-7 h-7 shrink-0" /> {/* spacer */}
            {classes.map((c, j) => (
              <div
                key={`col-${c}`}
                className={`w-7 h-7 flex items-center justify-center text-[9px] font-bold transition-colors ${
                  hoveredCell?.col === j ? "text-indigo-400" : "text-slate-500"
                }`}
              >
                {c}
              </div>
            ))}
          </div>

          {/* Matrix rows */}
          {matrix.map((row, i) => (
            <div key={`row-${i}`} className="flex items-center">
              {/* Row label */}
              <div
                className={`w-7 h-7 flex items-center justify-center text-[9px] font-bold transition-colors ${
                  hoveredCell?.row === i ? "text-indigo-400" : "text-slate-500"
                }`}
              >
                {classes[i]}
              </div>
              {/* Cells */}
              {row.map((val, j) => {
                const isDiagonal = i === j;
                const intensity = maxVal > 0 ? val / maxVal : 0;
                const isHovered = hoveredCell?.row === i && hoveredCell?.col === j;

                return (
                  <div
                    key={`cell-${i}-${j}`}
                    className={`w-7 h-7 flex items-center justify-center text-[8px] font-medium rounded-sm transition-all cursor-default ${
                      isHovered ? "ring-1 ring-white/40 z-10" : ""
                    }`}
                    style={{
                      background: isDiagonal
                        ? `rgba(139,92,246,${Math.max(intensity * 0.85, 0.05)})`
                        : val > 0
                        ? `rgba(239,68,68,${Math.max(intensity * 0.85, 0.1)})`
                        : "transparent",
                      color: val > 0 ? "#fff" : "#334155",
                    }}
                    title={`Aktual: ${classes[i]} → Prediksi: ${classes[j]} | Count: ${val}`}
                    onMouseEnter={() => setHoveredCell({ row: i, col: j })}
                    onMouseLeave={() => setHoveredCell(null)}
                  >
                    {val > 0 ? val : ""}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>

      {/* Color legend */}
      <div className="flex items-center gap-6 text-[10px] text-slate-500 mt-2 mb-6">
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-sm bg-violet-500/60" />
          <span>Prediksi Benar (Diagonal)</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-sm bg-red-500/60" />
          <span>Kesalahan Klasifikasi</span>
        </div>
      </div>

      {/* Most confused pairs */}
      <div className="border-t border-slate-800 pt-5">
        <p className="text-xs font-semibold text-slate-400 mb-3 uppercase tracking-wider">
          5 Pasangan Huruf Paling Sering Tertukar
        </p>
        <div className="space-y-2">
          {top5.map((p, i) => (
            <div key={i} className="flex items-center gap-3 text-xs">
              <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-red-500/15 text-red-400 font-bold text-[10px]">
                {i + 1}
              </span>
              <span className="font-bold text-slate-200 tracking-wide">
                {p.actual} → {p.predicted}
              </span>
              <span className="text-slate-500">
                {p.count}× salah diklasifikasi
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
