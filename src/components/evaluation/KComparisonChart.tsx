"use client";

import React from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";
import type { KComparison } from "@/types/evaluation";

interface KComparisonChartProps {
  data: KComparison[];
}

export function KComparisonChart({ data }: KComparisonChartProps) {
  const chartData = data.map((d) => ({
    name: `K=${d.k}`,
    Akurasi: +(d.accuracy * 100).toFixed(2),
    Presisi: +(d.precision * 100).toFixed(2),
    Recall: +(d.recall * 100).toFixed(2),
    "F1-Score": +(d.f1 * 100).toFixed(2),
  }));

  return (
    <div className="rounded-2xl bg-slate-900/50 border border-slate-800 p-6">
      <h3 className="text-base font-bold text-slate-100 mb-6">
        Grafik Perbandingan Nilai K
      </h3>
      <ResponsiveContainer width="100%" height={320}>
        <BarChart data={chartData} barGap={4} barCategoryGap="20%">
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.08)" />
          <XAxis
            dataKey="name"
            stroke="#64748b"
            tick={{ fill: "#94a3b8", fontSize: 12 }}
            axisLine={{ stroke: "rgba(148,163,184,0.15)" }}
          />
          <YAxis
            domain={[85, 100]}
            stroke="#64748b"
            tick={{ fill: "#94a3b8", fontSize: 12 }}
            tickFormatter={(v) => `${v}%`}
            axisLine={{ stroke: "rgba(148,163,184,0.15)" }}
          />
          <Tooltip
            contentStyle={{
              background: "#0f172a",
              border: "1px solid rgba(255,255,255,0.08)",
              borderRadius: "12px",
              color: "#ffffff",
              fontSize: "12px",
            }}
            formatter={(v) => [`${v}%`]}
          />
          <Legend
            wrapperStyle={{ color: "#94a3b8", fontSize: "12px", paddingTop: "12px" }}
          />
          <Bar dataKey="Akurasi" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
          <Bar dataKey="Presisi" fill="#6366f1" radius={[4, 4, 0, 0]} />
          <Bar dataKey="Recall" fill="#14b8a6" radius={[4, 4, 0, 0]} />
          <Bar dataKey="F1-Score" fill="#06b6d4" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
