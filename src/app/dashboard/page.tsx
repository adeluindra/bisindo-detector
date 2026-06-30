"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useRequireAuth } from "@/hooks/useRequireAuth";
import { logout } from "@/lib/firebase/auth";
import { loadModelIntoIndexedDB } from "@/lib/knn/loadModel";

export default function DashboardPage() {
  const { user, loading: authLoading } = useRequireAuth();
  const router = useRouter();
  const [modelStatus, setModelStatus] = useState<"loading" | "ready" | "error">("loading");
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  useEffect(() => {
    if (!user) return;

    async function initModel() {
      try {
        await loadModelIntoIndexedDB();
        setModelStatus("ready");
      } catch (err) {
        console.error("Failed to load KNN model into IndexedDB:", err);
        setModelStatus("error");
      }
    }

    initModel();
  }, [user]);

  async function handleLogout() {
    try {
      await logout();
      router.push("/");
    } catch (err) {
      console.error("Logout failed:", err);
    }
  }

  function handleLogoutClick() {
    setShowLogoutModal(true);
  }

  if (authLoading) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center bg-slate-950 text-slate-300">
        <div className="flex flex-col items-center gap-3">
          <span className="w-8 h-8 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin" />
          <p className="text-sm font-medium tracking-wide">Memuat autentikasi...</p>
        </div>
      </div>
    );
  }

  const features = [
    {
      title: "Deteksi Real-Time",
      description: "Gunakan kamera untuk mendeteksi gestur tangan alfabet BISINDO Anda secara langsung di layar dengan visualisasi kerangka tangan.",
      icon: "📹",
      action: "Mulai Deteksi",
      href: "/detect",
      color: "indigo",
    },
    {
      title: "Latihan Interaktif",
      description: "Latih isyarat Anda per huruf dengan contoh panduan visual, lalu dapatkan feedback kecocokan isyarat secara otomatis.",
      icon: "✍️",
      action: "Mulai Latihan",
      href: "/practice",
      color: "purple",
    },
    {
      title: "Riwayat & Statistik",
      description: "Pantau grafik peningkatan akurasi Anda per huruf, riwayat sesi latihan, serta log deteksi yang telah tersimpan.",
      icon: "📊",
      action: "Buka Statistik",
      href: "/history",
      color: "pink",
    },
  ] as const;

  const colorMap = {
    indigo: {
      iconBg: "bg-indigo-500/10 group-hover:bg-indigo-500/20 border-indigo-500/10",
      titleHover: "group-hover:text-indigo-300",
      linkColor: "text-indigo-400",
      borderHover: "hover:border-indigo-500/30 hover:shadow-indigo-500/5",
    },
    purple: {
      iconBg: "bg-purple-500/10 group-hover:bg-purple-500/20 border-purple-500/10",
      titleHover: "group-hover:text-purple-300",
      linkColor: "text-purple-400",
      borderHover: "hover:border-purple-500/30 hover:shadow-purple-500/5",
    },
    pink: {
      iconBg: "bg-pink-500/10 group-hover:bg-pink-500/20 border-pink-500/10",
      titleHover: "group-hover:text-pink-300",
      linkColor: "text-pink-400",
      borderHover: "hover:border-pink-500/30 hover:shadow-pink-500/5",
    },
  };

  return (
    <div className="relative min-h-screen bg-slate-950 text-slate-100 font-sans overflow-x-hidden">
      {/* Background gradients */}
      <div className="fixed top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-indigo-900/10 blur-[100px] pointer-events-none" />
      <div className="fixed bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-violet-900/10 blur-[100px] pointer-events-none" />

      {/* Navbar */}
      <header className="sticky top-0 z-50 border-b border-slate-900/80 bg-slate-950/80 backdrop-blur-xl">
        <div className="max-w-5xl w-full mx-auto px-6 py-4 flex items-center justify-between">
          <span className="text-xl font-bold tracking-wider text-indigo-400">🫵 BISINDO</span>
          <div className="flex items-center gap-4">
            <div className="text-right hidden sm:block">
              <p className="text-sm font-semibold text-slate-100">{user?.displayName || user?.email?.split("@")[0]}</p>
              <p className="text-xs text-slate-500">{user?.email}</p>
            </div>
            <button
              onClick={handleLogoutClick}
              className="px-4 py-2 text-xs font-semibold rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 text-slate-300 hover:text-white transition-all cursor-pointer"
            >
              Keluar
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="relative z-10 max-w-5xl w-full mx-auto px-6 py-8 md:py-10">
        {/* Welcome Section */}
        <div className="mb-8 p-6 md:p-8 rounded-2xl bg-gradient-to-br from-indigo-900/30 via-slate-900/60 to-slate-900/40 border border-indigo-500/10 shadow-xl">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div>
              <h2 className="text-2xl md:text-3xl font-extrabold tracking-tight">
                Halo, <span className="bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">{user?.displayName || "Pengguna"}</span>! 👋
              </h2>
              <p className="text-slate-400 text-sm md:text-base mt-2 max-w-xl leading-relaxed">
                Siap belajar isyarat alfabet BISINDO? Silakan pilih fitur di bawah untuk memulai deteksi real-time atau latihan terpandu.
              </p>
            </div>

            <div className="flex items-center gap-3 bg-slate-950/60 border border-slate-800 px-5 py-3.5 rounded-xl shrink-0">
              <span className="flex h-3 w-3 relative">
                {modelStatus === "ready" ? (
                  <>
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
                  </>
                ) : modelStatus === "loading" ? (
                  <>
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-amber-500"></span>
                  </>
                ) : (
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
                )}
              </span>
              <div className="text-xs">
                <p className="font-semibold text-slate-300">Status Dataset KNN</p>
                <p className="text-slate-500 mt-0.5">
                  {modelStatus === "ready"
                    ? "Siap (Cached offline)"
                    : modelStatus === "loading"
                    ? "Sedang memuat data..."
                    : "Gagal memuat"}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Feature Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {features.map((feature) => {
            const colors = colorMap[feature.color];
            return (
              <div
                key={feature.title}
                onClick={() => router.push(feature.href)}
                className={`group relative cursor-pointer overflow-hidden p-6 rounded-2xl bg-slate-900/40 hover:bg-slate-900/70 border border-slate-800 ${colors.borderHover} transition-all hover:-translate-y-1 hover:shadow-lg duration-300 flex flex-col`}
              >
                <div className={`inline-flex items-center justify-center p-3.5 ${colors.iconBg} rounded-xl mb-5 border transition-all w-fit`}>
                  <span className="text-2xl">{feature.icon}</span>
                </div>
                <h3 className={`text-lg font-bold mb-2 ${colors.titleHover} transition-colors`}>
                  {feature.title}
                </h3>
                <p className="text-slate-400 text-sm leading-relaxed flex-1">
                  {feature.description}
                </p>
                <div className={`mt-5 pt-4 border-t border-slate-800/50 flex items-center text-xs font-semibold ${colors.linkColor} gap-1.5 group-hover:gap-3 transition-all`}>
                  <span>{feature.action}</span>
                  <span>→</span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Info panel */}
        <div className="p-5 rounded-xl bg-slate-900/20 border border-slate-800 text-slate-500 text-xs text-center leading-relaxed">
          <p>
            Aplikasi ini mendeteksi isyarat langsung di browser Anda menggunakan model MediaPipe & KNN lokal. Seluruh proses inferensi isyarat bersifat privat dan berjalan lokal di perangkat Anda.
          </p>
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 border-t border-slate-900/80 bg-slate-950/90 py-6 text-center text-xs text-slate-500 mt-8">
        <p>© 2026. Deteksi Alfabet BISINDO - K-Nearest Neighbor & MediaPipe Hands.</p>
      </footer>

      {/* Logout Confirmation Modal */}
      {showLogoutModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setShowLogoutModal(false)}
          />
          {/* Modal */}
          <div className="relative bg-slate-900 border border-slate-800 rounded-2xl p-8 max-w-sm w-full mx-4 shadow-2xl shadow-black/40">
            {/* Icon */}
            <div className="w-14 h-14 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center mx-auto mb-5">
              <span className="text-2xl">🚪</span>
            </div>
            <h3 className="text-lg font-bold text-center text-slate-100 mb-2">
              Yakin ingin keluar?
            </h3>
            <p className="text-sm text-slate-400 text-center mb-8 leading-relaxed">
              Anda akan keluar dari akun dan kembali ke halaman login.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowLogoutModal(false)}
                className="flex-1 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 hover:border-slate-600 text-slate-300 text-sm font-semibold transition-all cursor-pointer"
              >
                Batal
              </button>
              <button
                onClick={handleLogout}
                className="flex-1 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white text-sm font-semibold transition-all cursor-pointer shadow-lg shadow-red-600/20"
              >
                Ya, Keluar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

