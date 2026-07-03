"use client";

import React from "react";
import type { KComparison } from "@/types/evaluation";

interface KComparisonTableProps {
  data: KComparison[];
  bestK: number;
}

export function KComparisonTable({ data, bestK }: KComparisonTableProps) {
  return (
    <div className="overflow-hidden rounded-2xl bg-slate-900/50 border border-slate-800">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-slate-800 text-slate-500 text-xs uppercase tracking-wider">
            <th className="p-4 text-left font-medium">Nilai K</th>
            <th className="p-4 text-right font-medium">Akurasi</th>
            <th className="p-4 text-right font-medium">Presisi</th>
            <th className="p-4 text-right font-medium">Recall</th>
            <th className="p-4 text-right font-medium">F1-Score</th>
          </tr>
        </thead>
        <tbody>
          {data.map((row) => (
            <tr
              key={row.k}
              className={
                row.k === bestK
                  ? "bg-indigo-500/10 border-l-2 border-l-indigo-500 text-slate-100"
                  : "border-b border-slate-800/50 text-slate-300 hover:bg-slate-900/70 transition-colors"
              }
            >
              <td className="p-4 font-semibold">
                K = {row.k}
                {row.k === bestK && (
                  <span className="ml-2 inline-block rounded-full bg-indigo-500/20 px-2.5 py-0.5 text-[10px] font-bold text-indigo-400 uppercase tracking-wide">
                    Terbaik
                  </span>
                )}
              </td>
              <td className="p-4 text-right font-mono">
                {(row.accuracy * 100).toFixed(2)}%
              </td>
              <td className="p-4 text-right font-mono">
                {(row.precision * 100).toFixed(2)}%
              </td>
              <td className="p-4 text-right font-mono">
                {(row.recall * 100).toFixed(2)}%
              </td>
              <td className="p-4 text-right font-mono">
                {(row.f1 * 100).toFixed(2)}%
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
