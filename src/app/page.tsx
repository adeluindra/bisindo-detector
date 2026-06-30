import React from "react";
import Link from "next/link";

export default function Home() {
  return (
    <div className="relative bg-slate-950 text-slate-100 font-sans overflow-x-hidden" style={{ scrollBehavior: 'smooth' }}>
      {/* Background gradients */}
      <div className="fixed top-[-20%] left-[-20%] w-[60%] h-[60%] rounded-full bg-indigo-900/20 blur-[120px] pointer-events-none" />
      <div className="fixed bottom-[-20%] right-[-20%] w-[60%] h-[60%] rounded-full bg-violet-900/20 blur-[120px] pointer-events-none" />

      {/* Navbar */}
      <header className="sticky top-0 bg-slate-950/80 backdrop-blur-xl border-b border-slate-900/50 z-50">
        <div className="max-w-6xl w-full mx-auto px-6 py-4 flex items-center justify-between">
          <span className="text-xl font-black tracking-wider text-indigo-400">🫵 BISINDO</span>
          <Link
            href="/login"
            className="px-4 py-2 text-xs font-semibold rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white transition-all shadow-md cursor-pointer"
          >
            Masuk Aplikasi
          </Link>
        </div>
      </header>

      {/* Hero Section — fills viewport minus navbar height */}
      <section className="relative z-10 min-h-[calc(100vh-64px)] flex flex-col items-center justify-center px-6 py-16 md:py-28 text-center">
        <div className="max-w-4xl w-full flex flex-col items-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 text-indigo-300 text-xs font-semibold mb-6 border border-indigo-500/15">
            <span>🎓</span> Usulan Penelitian Tugas Akhir S1
          </div>

          <h1 className="text-3xl md:text-5xl font-black tracking-tight leading-tight mb-6 bg-gradient-to-r from-indigo-300 via-purple-300 to-pink-300 bg-clip-text text-transparent">
            Klasifikasi Huruf Bahasa Isyarat Indonesia (BISINDO) Secara Real-Time
          </h1>

          <p className="text-slate-400 text-sm md:text-lg max-w-2xl leading-relaxed mb-10">
            Implementasi Algoritma K-Nearest Neighbor (KNN) dengan ekstraksi landmark MediaPipe Hands untuk mendeteksi alfabet isyarat langsung di browser Anda secara instan dan efisien.
          </p>

          <div className="flex flex-col sm:flex-row gap-4">
            <Link
              href="/login"
              className="px-8 py-3.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 text-white font-bold text-sm transition-all shadow-lg shadow-indigo-600/25 cursor-pointer"
            >
              Mulai Belajar & Deteksi
            </Link>
            <a
              href="#architecture"
              className="px-8 py-3.5 rounded-xl border border-slate-800 hover:bg-slate-900 text-slate-300 text-sm font-semibold transition-all cursor-pointer"
            >
              Lihat Arsitektur
            </a>
          </div>
        </div>
      </section>

      {/* Architecture Section */}
      <section
        id="architecture"
        className="relative z-10 max-w-6xl w-full mx-auto px-6 py-20"
        style={{ scrollMarginTop: '80px' }}
      >
        {/* Section Header */}
        <div className="text-center mb-12">
          <span className="inline-block px-3 py-1 rounded-full bg-violet-500/10 text-violet-300 text-xs font-semibold mb-4 border border-violet-500/15">
            🏗️ System Architecture
          </span>
          <h2 className="text-2xl md:text-3xl font-black tracking-tight bg-gradient-to-r from-violet-300 to-indigo-300 bg-clip-text text-transparent">
            Arsitektur Sistem
          </h2>
          <p className="text-slate-500 text-sm mt-3 max-w-xl mx-auto">
            Alur kerja klasifikasi isyarat dari input kamera hingga hasil deteksi real-time
          </p>
        </div>

        {/* Architecture Flow Diagram */}
        <div className="relative rounded-2xl border border-slate-800 bg-slate-900/30 backdrop-blur-sm p-6 md:p-10 mb-14 overflow-hidden">
          {/* Decorative glow */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[40%] h-[2px] bg-gradient-to-r from-transparent via-indigo-500 to-transparent" />

          {/* Row 1 — 3 steps with arrows */}
          <div className="flex flex-col md:flex-row items-center justify-center gap-3 md:gap-5">
            {/* Step 1 */}
            <div className="flex flex-col items-center text-center p-4 rounded-xl bg-slate-800/50 border border-slate-700/50 w-full md:w-40 shrink-0">
              <div className="w-12 h-12 rounded-xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-2xl mb-3">📷</div>
              <span className="text-xs font-bold text-slate-200 mb-1">Input Kamera</span>
              <span className="text-[10px] text-slate-500">Webcam / Camera</span>
            </div>

            {/* Arrow → */}
            <span className="hidden md:block text-slate-600 text-xl">→</span>
            <span className="block md:hidden text-slate-600 text-xl">↓</span>

            {/* Step 2 */}
            <div className="flex flex-col items-center text-center p-4 rounded-xl bg-slate-800/50 border border-slate-700/50 w-full md:w-40 shrink-0">
              <div className="w-12 h-12 rounded-xl bg-purple-600/20 border border-purple-500/30 flex items-center justify-center text-2xl mb-3">✋</div>
              <span className="text-xs font-bold text-slate-200 mb-1">MediaPipe Hands</span>
              <span className="text-[10px] text-slate-500">21 Landmark Points</span>
            </div>

            {/* Arrow → */}
            <span className="hidden md:block text-slate-600 text-xl">→</span>
            <span className="block md:hidden text-slate-600 text-xl">↓</span>

            {/* Step 3 */}
            <div className="flex flex-col items-center text-center p-4 rounded-xl bg-slate-800/50 border border-slate-700/50 w-full md:w-40 shrink-0">
              <div className="w-12 h-12 rounded-xl bg-pink-600/20 border border-pink-500/30 flex items-center justify-center text-2xl mb-3">🔢</div>
              <span className="text-xs font-bold text-slate-200 mb-1">Feature Extraction</span>
              <span className="text-[10px] text-slate-500">156 Dimensions</span>
            </div>
          </div>

          {/* Vertical arrow between rows */}
          <div className="flex justify-center my-5 text-slate-600 text-xl">↓</div>

          {/* Row 2 — 3 steps with arrows */}
          <div className="flex flex-col md:flex-row items-center justify-center gap-3 md:gap-5">
            {/* Step 4 */}
            <div className="flex flex-col items-center text-center p-4 rounded-xl bg-gradient-to-b from-indigo-900/40 to-slate-800/50 border border-indigo-500/30 ring-1 ring-indigo-500/10 w-full md:w-40 shrink-0">
              <div className="w-12 h-12 rounded-xl bg-indigo-600/30 border border-indigo-500/40 flex items-center justify-center text-2xl mb-3">🧠</div>
              <span className="text-xs font-bold text-indigo-300 mb-1">KNN Classifier</span>
              <span className="text-[10px] text-slate-500">K-Nearest Neighbor</span>
            </div>

            {/* Arrow → */}
            <span className="hidden md:block text-slate-600 text-xl">→</span>
            <span className="block md:hidden text-slate-600 text-xl">↓</span>

            {/* Step 5 */}
            <div className="flex flex-col items-center text-center p-4 rounded-xl bg-slate-800/50 border border-slate-700/50 w-full md:w-40 shrink-0">
              <div className="w-12 h-12 rounded-xl bg-emerald-600/20 border border-emerald-500/30 flex items-center justify-center text-2xl mb-3">🅰️</div>
              <span className="text-xs font-bold text-slate-200 mb-1">Prediksi Huruf</span>
              <span className="text-[10px] text-slate-500">A-Z BISINDO</span>
            </div>

            {/* Arrow → */}
            <span className="hidden md:block text-slate-600 text-xl">→</span>
            <span className="block md:hidden text-slate-600 text-xl">↓</span>

            {/* Step 6 */}
            <div className="flex flex-col items-center text-center p-4 rounded-xl bg-slate-800/50 border border-slate-700/50 w-full md:w-40 shrink-0">
              <div className="w-12 h-12 rounded-xl bg-cyan-600/20 border border-cyan-500/30 flex items-center justify-center text-2xl mb-3">☁️</div>
              <span className="text-xs font-bold text-slate-200 mb-1">Firebase Firestore</span>
              <span className="text-[10px] text-slate-500">Cloud Storage</span>
            </div>
          </div>
        </div>

        {/* Feature Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full text-left">
          <div className="group p-6 rounded-2xl bg-slate-900/40 border border-slate-800 hover:border-indigo-500/30 transition-all duration-300">
            <div className="w-10 h-10 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-lg mb-4">⚡</div>
            <h3 className="text-sm font-bold text-slate-100 mb-2">Real-time Inference</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Inferensi isyarat tangan berjalan client-side pada browser Anda dengan kecepatan ≥24 FPS dan latensi di bawah 100ms.
            </p>
          </div>
          <div className="group p-6 rounded-2xl bg-slate-900/40 border border-slate-800 hover:border-purple-500/30 transition-all duration-300">
            <div className="w-10 h-10 rounded-lg bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-lg mb-4">📐</div>
            <h3 className="text-sm font-bold text-slate-100 mb-2">156-Dimension Features</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Mengekstrak 21 landmark tangan MediaPipe, ditransformasikan menjadi koordinat ternormalisasi dan 15 sudut sendi jari untuk akurasi tinggi.
            </p>
          </div>
          <div className="group p-6 rounded-2xl bg-slate-900/40 border border-slate-800 hover:border-cyan-500/30 transition-all duration-300">
            <div className="w-10 h-10 rounded-lg bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-lg mb-4">📊</div>
            <h3 className="text-sm font-bold text-slate-100 mb-2">Cloud Integration</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Simpan progres latihan isyarat Anda ke Firebase Firestore dan lacak perkembangan akurasi belajar isyarat lewat chart analitik.
            </p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 border-t border-slate-900/80 bg-slate-950/90 py-6 text-center text-xs text-slate-500">
        <p>© 2026. Deteksi Alfabet BISINDO - K-Nearest Neighbor & MediaPipe Hands.</p>
      </footer>
    </div>
  );
}
