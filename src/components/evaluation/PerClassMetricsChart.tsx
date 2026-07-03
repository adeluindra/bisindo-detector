"use client";

import React from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Cell,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";
import type { PerClassMetric } from "@/types/evaluation";

interface PerClassMetricsChartProps {
  data: PerClassMetric[];
}

function getColor(f1: number): string {
  if (f1 >= 0.9) return "#22c55e";  // green
  if (f1 >= 0.6) return "#f59e0b";  // amber
  return "#ef4444";                  // red
}

export function PerClassMetricsChart({ data }: PerClassMetricsChartProps) {
  const chartData = data.map((d) => ({
    name: d.letter,
    f1: +(d.f1 * 100).toFixed(1),
    rawF1: d.f1,
  }));

  return (
    <div className="rounded-2xl bg-slate-900/50 border border-slate-800 p-6">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-base font-bold text-slate-100">F1-Score per Kelas</h3>
      </div>
      <div className="flex items-center gap-4 text-[10px] text-slate-500 mb-6">
        <div className="flex items-center gap-1.5">
          <div className="w-2.5 h-2.5 rounded-full bg-green-500" />
          <span>≥ 90%</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-2.5 h-2.5 rounded-full bg-amber-500" />
          <span>60–89%</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-2.5 h-2.5 rounded-full bg-red-500" />
          <span>&lt; 60%</span>
        </div>
      </div>

      <ResponsiveContainer width="100%" height={580}>
        <BarChart
          data={chartData}
          layout="vertical"
          margin={{ left: 4, right: 20 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.06)" horizontal={false} />
          <XAxis
            type="number"
            domain={[0, 100]}
            stroke="#64748b"
            tick={{ fill: "#94a3b8", fontSize: 11 }}
            tickFormatter={(v) => `${v}%`}
            axisLine={{ stroke: "rgba(148,163,184,0.15)" }}
          />
          <YAxis
            type="category"
            dataKey="name"
            stroke="#64748b"
            tick={{ fill: "#cbd5e1", fontSize: 12, fontWeight: 600 }}
            width={24}
            axisLine={{ stroke: "rgba(148,163,184,0.15)" }}
          />
          <Tooltip
            contentStyle={{
              background: "#0f172a",
              border: "1px solid rgba(255,255,255,0.08)",
              borderRadius: "12px",
              color: "#fff",
              fontSize: "12px",
            }}
            formatter={(v) => [`${v}%`, "F1-Score"]}
          />
          <Bar dataKey="f1" radius={[0, 4, 4, 0]} barSize={16}>
            {chartData.map((entry, i) => (
              <Cell key={`cell-${i}`} fill={getColor(entry.rawF1)} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
