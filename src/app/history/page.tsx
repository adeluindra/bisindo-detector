"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRequireAuth } from "@/hooks/useRequireAuth";
import { getUserHistory, getUserTrainingSessions, getUserStats } from "@/lib/firebase/firestore";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";

type TabType = "stats" | "practice" | "detect";

export default function HistoryPage() {
  const { user, loading: authLoading } = useRequireAuth();
  const [activeTab, setActiveTab] = useState<TabType>("stats");
  const [loadingData, setLoadingData] = useState(true);

  // Firestore Data State
  const [historyList, setHistoryList] = useState<any[]>([]);
  const [sessionsList, setSessionsList] = useState<any[]>([]);
  const [statsDoc, setStatsDoc] = useState<any>(null);

  // Summary Metrics
  const [totalDetections, setTotalDetections] = useState(0);
  const [totalAttempts, setTotalAttempts] = useState(0);
  const [overallAcc, setOverallAcc] = useState(0);
  const [activeDays, setActiveDays] = useState(0);

  // Chart Data State
  const [chartData, setChartData] = useState<{ name: string; akurasi: number; frekuensi: number }[]>([]);

  // Pagination states
  const [practicePage, setPracticePage] = useState(1);
  const [detectPage, setDetectPage] = useState(1);
  const itemsPerPage = 8;

  useEffect(() => {
    if (!user) return;

    async function loadData() {
      try {
        setLoadingData(true);
        const [hist, sess, stats] = await Promise.all([
          getUserHistory(user.uid),
          getUserTrainingSessions(user.uid),
          getUserStats(user.uid),
        ]);

        setHistoryList(hist);
        setSessionsList(sess);
        setStatsDoc(stats);

        // Calculate summary metrics
        setTotalDetections(hist.length);
        setTotalAttempts(sess.length);
        
        if (stats) {
          setOverallAcc(stats.overallAccuracy || 0);
        } else if (sess.length > 0) {
          const correct = sess.filter((s) => s.isCorrect).length;
          setOverallAcc(correct / sess.length);
        }

        // Calculate active days (unique dates from both collections)
        const uniqueDates = new Set<string>();
        const extractDate = (timestamp: any) => {
          if (!timestamp) return null;
          const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp.seconds * 1000);
          return date.toDateString();
        };

        hist.forEach((h) => {
          const d = extractDate(h.timestamp);
          if (d) uniqueDates.add(d);
        });

        sess.forEach((s) => {
          const d = extractDate(s.timestamp);
          if (d) uniqueDates.add(d);
        });

        setActiveDays(uniqueDates.size);

        // Process data for charts (A-Z)
        const letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");
        const perLetterMap: Record<string, { correct: number; total: number }> = {};
        letters.forEach((l) => {
          perLetterMap[l] = { correct: 0, total: 0 };
        });

        sess.forEach((s) => {
          const target = s.targetLetter;
          if (perLetterMap[target]) {
            perLetterMap[target].total++;
            if (s.isCorrect) perLetterMap[target].correct++;
          }
        });

        const chartFormatted = letters.map((l) => {
          const dataForLetter = perLetterMap[l];
          const acc = dataForLetter.total > 0 ? (dataForLetter.correct / dataForLetter.total) * 100 : 0;
          return {
            name: l,
            akurasi: Math.round(acc),
            frekuensi: dataForLetter.total,
          };
        });

        setChartData(chartFormatted);
      } catch (err) {
        console.error("Failed to load user records:", err);
      } finally {
        setLoadingData(false);
      }
    }

    loadData();
  }, [user]);

  const formatTimestamp = (timestamp: any) => {
    if (!timestamp) return "-";
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp.seconds * 1000);
    return date.toLocaleString("id-ID", {
      day: "2-digit",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (authLoading) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center bg-slate-950 text-slate-300">
        <span className="w-8 h-8 border-4 border-indigo-650/20 border-t-indigo-500 rounded-full animate-spin mr-3" />
        <span>Memuat...</span>
      </div>
    );
  }

  // Slice list data for pagination
  const currentPracticeData = sessionsList.slice(
    (practicePage - 1) * itemsPerPage,
    practicePage * itemsPerPage
  );
  
  const currentDetectData = historyList.slice(
    (detectPage - 1) * itemsPerPage,
    detectPage * itemsPerPage
  );

  const totalPracticePages = Math.ceil(sessionsList.length / itemsPerPage) || 1;
  const totalDetectPages = Math.ceil(historyList.length / itemsPerPage) || 1;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans flex flex-col relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute top-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-pink-900/10 blur-[100px] pointer-events-none" />

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
          <h1 className="text-lg font-bold tracking-tight">Riwayat & Statistik</h1>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-5xl w-full mx-auto p-6 md:p-8 z-10 flex flex-col gap-8">
        
        {/* Summary Dashboard Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-5 rounded-2xl bg-slate-900 border border-slate-850">
            <p className="text-xs font-semibold text-slate-450 uppercase tracking-wider">Total Latihan</p>
            <p className="text-3xl font-black mt-2 text-indigo-400">{totalAttempts}</p>
            <p className="text-xs text-slate-500 mt-1">Percobaan isyarat</p>
          </div>

          <div className="p-5 rounded-2xl bg-slate-900 border border-slate-850">
            <p className="text-xs font-semibold text-slate-450 uppercase tracking-wider">Akurasi Rata-rata</p>
            <p className="text-3xl font-black mt-2 text-purple-400">{(overallAcc * 100).toFixed(0)}%</p>
            <p className="text-xs text-slate-500 mt-1">Sesi latihan</p>
          </div>

          <div className="p-5 rounded-2xl bg-slate-900 border border-slate-850">
            <p className="text-xs font-semibold text-slate-450 uppercase tracking-wider">Karakter Terdeteksi</p>
            <p className="text-3xl font-black mt-2 text-pink-400">{totalDetections}</p>
            <p className="text-xs text-slate-500 mt-1">Sesi real-time</p>
          </div>

          <div className="p-5 rounded-2xl bg-slate-900 border border-slate-850">
            <p className="text-xs font-semibold text-slate-450 uppercase tracking-wider">Hari Aktif</p>
            <p className="text-3xl font-black mt-2 text-blue-400">{activeDays}</p>
            <p className="text-xs text-slate-500 mt-1">Hari berlatih</p>
          </div>
        </div>

        {/* Tab Controls */}
        <div className="flex border-b border-slate-900">
          <button
            onClick={() => setActiveTab("stats")}
            className={`px-6 py-3 font-semibold text-sm transition-all border-b-2 cursor-pointer ${
              activeTab === "stats"
                ? "border-indigo-500 text-indigo-300"
                : "border-transparent text-slate-450 hover:text-slate-200"
            }`}
          >
            📊 Statistik Belajar
          </button>
          <button
            onClick={() => setActiveTab("practice")}
            className={`px-6 py-3 font-semibold text-sm transition-all border-b-2 cursor-pointer ${
              activeTab === "practice"
                ? "border-indigo-500 text-indigo-300"
                : "border-transparent text-slate-450 hover:text-slate-200"
            }`}
          >
            ✍️ Riwayat Latihan
          </button>
          <button
            onClick={() => setActiveTab("detect")}
            className={`px-6 py-3 font-semibold text-sm transition-all border-b-2 cursor-pointer ${
              activeTab === "detect"
                ? "border-indigo-500 text-indigo-300"
                : "border-transparent text-slate-450 hover:text-slate-200"
            }`}
          >
            📹 Riwayat Deteksi
          </button>
        </div>

        {/* Loading placeholder */}
        {loadingData ? (
          <div className="h-64 flex items-center justify-center text-slate-450 text-sm">
            <span className="w-6 h-6 border-2 border-slate-800 border-t-slate-550 rounded-full animate-spin mr-2" />
            <span>Memuat rekaman aktivitas...</span>
          </div>
        ) : (
          /* Tab Contents */
          <div className="flex-1">
            {/* STATS TAB */}
            {activeTab === "stats" && (
              <div className="space-y-8">
                {totalAttempts === 0 ? (
                  <div className="p-12 text-center bg-slate-900/40 rounded-3xl border border-slate-850">
                    <p className="text-slate-500 mb-4">Anda belum memulai latihan interaktif.</p>
                    <Link
                      href="/practice"
                      className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-xl text-xs transition-all shadow-lg"
                    >
                      Mulai Latihan Sekarang
                    </Link>
                  </div>
                ) : (
                  <>
                    {/* Chart 1: Accuracy bar chart */}
                    <div className="p-6 rounded-3xl bg-slate-900 border border-slate-850 shadow-md">
                      <h3 className="text-sm font-bold text-slate-350 mb-6 uppercase tracking-wider">Persentase Akurasi per Huruf (%)</h3>
                      <div className="w-full h-[260px]">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={chartData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                            <XAxis dataKey="name" stroke="#64748b" fontSize={11} tickLine={false} />
                            <YAxis domain={[0, 100]} stroke="#64748b" fontSize={11} tickLine={false} />
                            <Tooltip
                              contentStyle={{ backgroundColor: "#0f172a", border: "1px solid #334155", borderRadius: "12px" }}
                              labelStyle={{ fontWeight: "bold", color: "#6366f1" }}
                              itemStyle={{ color: "#cbd5e1", fontSize: "12px" }}
                              formatter={(value) => [`${value}%`, "Akurasi"]}
                            />
                            <Bar dataKey="akurasi" fill="#6366f1" radius={[4, 4, 0, 0]} />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    </div>

                    {/* Chart 2: Practice frequency per letter */}
                    <div className="p-6 rounded-3xl bg-slate-900 border border-slate-850 shadow-md">
                      <h3 className="text-sm font-bold text-slate-350 mb-6 uppercase tracking-wider">Frekuensi Latihan per Huruf (Kali)</h3>
                      <div className="w-full h-[260px]">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={chartData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                            <XAxis dataKey="name" stroke="#64748b" fontSize={11} tickLine={false} />
                            <YAxis stroke="#64748b" fontSize={11} tickLine={false} />
                            <Tooltip
                              contentStyle={{ backgroundColor: "#0f172a", border: "1px solid #334155", borderRadius: "12px" }}
                              labelStyle={{ fontWeight: "bold", color: "#ec4899" }}
                              itemStyle={{ color: "#cbd5e1", fontSize: "12px" }}
                              formatter={(value) => [`${value} kali`, "Frekuensi"]}
                            />
                            <Bar dataKey="frekuensi" fill="#ec4899" radius={[4, 4, 0, 0]} />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    </div>
                  </>
                )}
              </div>
            )}

            {/* PRACTICE SESSION HISTORY */}
            {activeTab === "practice" && (
              <div className="space-y-6">
                {sessionsList.length === 0 ? (
                  <div className="p-12 text-center bg-slate-900/40 rounded-3xl border border-slate-850 text-slate-500">
                    Belum ada riwayat sesi latihan.
                  </div>
                ) : (
                  <>
                    <div className="overflow-x-auto rounded-2xl border border-slate-900 bg-slate-900/40">
                      <table className="w-full text-left text-sm text-slate-300">
                        <thead className="bg-slate-900 text-xs font-semibold uppercase tracking-wider text-slate-450 border-b border-slate-850">
                          <tr>
                            <th className="px-6 py-4">Waktu</th>
                            <th className="px-6 py-4">Target Huruf</th>
                            <th className="px-6 py-4">Isyarat Terdeteksi</th>
                            <th className="px-6 py-4">Kecocokan</th>
                            <th className="px-6 py-4 text-center">Status</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-850/50">
                          {currentPracticeData.map((s) => (
                            <tr key={s.id} className="hover:bg-slate-900/60 transition-colors">
                              <td className="px-6 py-3.5 whitespace-nowrap text-xs text-slate-450">{formatTimestamp(s.timestamp)}</td>
                              <td className="px-6 py-3.5 font-bold text-slate-200">{s.targetLetter}</td>
                              <td className="px-6 py-3.5 text-slate-300">{s.predictedLetter}</td>
                              <td className="px-6 py-3.5 text-xs">{(s.confidence * 100).toFixed(0)}%</td>
                              <td className="px-6 py-3.5 text-center">
                                <span className={`inline-flex px-2.5 py-1 text-xs font-semibold rounded-full border ${
                                  s.isCorrect 
                                    ? "bg-emerald-950/40 border-emerald-500/20 text-emerald-400" 
                                    : "bg-red-950/40 border-red-500/20 text-red-400"
                                }`}>
                                  {s.isCorrect ? "Benar" : "Salah"}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    {/* Pagination Controls */}
                    <div className="flex justify-between items-center text-xs text-slate-450">
                      <button
                        onClick={() => setPracticePage((p) => Math.max(p - 1, 1))}
                        disabled={practicePage === 1}
                        className="px-4 py-2 border border-slate-850 rounded-xl hover:bg-slate-900 transition-all cursor-pointer disabled:opacity-50"
                      >
                        Sebelumnya
                      </button>
                      <span>Halaman {practicePage} dari {totalPracticePages}</span>
                      <button
                        onClick={() => setPracticePage((p) => Math.min(p + 1, totalPracticePages))}
                        disabled={practicePage === totalPracticePages}
                        className="px-4 py-2 border border-slate-850 rounded-xl hover:bg-slate-900 transition-all cursor-pointer disabled:opacity-50"
                      >
                        Selanjutnya
                      </button>
                    </div>
                  </>
                )}
              </div>
            )}

            {/* REAL-TIME DETECTION HISTORY */}
            {activeTab === "detect" && (
              <div className="space-y-6">
                {historyList.length === 0 ? (
                  <div className="p-12 text-center bg-slate-900/40 rounded-3xl border border-slate-850 text-slate-500">
                    Belum ada riwayat karakter terdeteksi.
                  </div>
                ) : (
                  <>
                    <div className="overflow-x-auto rounded-2xl border border-slate-900 bg-slate-900/40">
                      <table className="w-full text-left text-sm text-slate-300">
                        <thead className="bg-slate-900 text-xs font-semibold uppercase tracking-wider text-slate-450 border-b border-slate-850">
                          <tr>
                            <th className="px-6 py-4">Waktu</th>
                            <th className="px-6 py-4">ID Sesi</th>
                            <th className="px-6 py-4">Karakter Terdeteksi</th>
                            <th className="px-6 py-4">Tingkat Kecocokan</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-850/50">
                          {currentDetectData.map((h) => (
                            <tr key={h.id} className="hover:bg-slate-900/60 transition-colors">
                              <td className="px-6 py-3.5 whitespace-nowrap text-xs text-slate-450">{formatTimestamp(h.timestamp)}</td>
                              <td className="px-6 py-3.5 text-xs font-mono text-slate-400">{h.sessionId.substring(0, 16)}...</td>
                              <td className="px-6 py-3.5 font-bold text-indigo-400">{h.letter}</td>
                              <td className="px-6 py-3.5 text-xs">{(h.confidence * 100).toFixed(0)}% Match</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    {/* Pagination Controls */}
                    <div className="flex justify-between items-center text-xs text-slate-450">
                      <button
                        onClick={() => setDetectPage((p) => Math.max(p - 1, 1))}
                        disabled={detectPage === 1}
                        className="px-4 py-2 border border-slate-850 rounded-xl hover:bg-slate-900 transition-all cursor-pointer disabled:opacity-50"
                      >
                        Sebelumnya
                      </button>
                      <span>Halaman {detectPage} dari {totalDetectPages}</span>
                      <button
                        onClick={() => setDetectPage((p) => Math.min(p + 1, totalDetectPages))}
                        disabled={detectPage === totalDetectPages}
                        className="px-4 py-2 border border-slate-850 rounded-xl hover:bg-slate-900 transition-all cursor-pointer disabled:opacity-50"
                      >
                        Selanjutnya
                      </button>
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
