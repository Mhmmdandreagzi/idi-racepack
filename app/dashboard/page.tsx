"use client";

import React, { useEffect, useState, useTransition } from "react";
import { getDetailedStats, CategoryStatItem } from "@/lib/services/statsService";
import { RacepackStats } from "@/types/stats";
import {
  BarChart3,
  CheckCircle2,
  AlertTriangle,
  Users,
  RefreshCw,
  TrendingUp,
  PackageCheck,
  Trophy,
} from "lucide-react";
import Link from "next/link";
import AuthGuard from "@/components/auth/AuthGuard";

function DashboardContent() {
  const [stats, setStats] = useState<RacepackStats | null>(null);
  const [categories, setCategories] = useState<CategoryStatItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [, startTransition] = useTransition();

  const fetchStats = async () => {
    setLoading(true);
    try {
      const res = await getDetailedStats();
      startTransition(() => {
        setStats(res.stats);
        if (res.categories && res.categories.length > 0) {
          setCategories(res.categories);
        }
      });
    } catch (e) {
      console.error("Dashboard stats error:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  const total = stats?.total || 1161;
  const sudah = stats?.sudah_diambil || 0;
  const belum = stats?.belum_diambil || Math.max(0, total - sudah);
  const percentage = total > 0 ? Math.round((sudah / total) * 100) : 0;

  return (
    <main className="flex-1 max-w-5xl w-full mx-auto px-4 py-6 sm:py-8 space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-[#FAF5EA] p-5 rounded-xl border border-[#D8CDB8] shadow-sm">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#111111] text-[#D4B84C] flex items-center justify-center">
              <BarChart3 className="w-5 h-5" />
            </div>
            <div>
              <h1 className="font-display text-2xl sm:text-3xl text-[#111111] leading-none">
                DASHBOARD STATISTIK RACEPACK
              </h1>
              <p className="text-[11px] font-bold text-[#26734D] italic mt-0.5">
                RUN IDI RUN 5K 2026 • Monitoring Real-time Kuota Pengambilan MySQL
              </p>
            </div>
          </div>
        </div>

        <button
          onClick={fetchStats}
          disabled={loading}
          className="self-start sm:self-auto flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#F3E8D2] hover:bg-[#E6D8BE] text-xs font-bold text-[#111111] border border-[#D8CDB8] transition"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin text-[#D71920]" : ""}`} />
          <span>Refresh Data</span>
        </button>
      </div>

      {/* Primary KPI Cards (style.md Section 13) */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Total Peserta */}
        <div className="p-6 rounded-xl bg-[#FAF5EA] text-[#111111] border-2 border-[#111111] shadow-sm space-y-2">
          <div className="flex items-center justify-between text-[#111111]/70 text-xs font-bold uppercase tracking-wider">
            <span>TOTAL PESERTA</span>
            <Users className="w-5 h-5 text-[#111111]" />
          </div>
          <p className="font-display text-5xl sm:text-6xl text-[#111111] leading-none">
            {total.toLocaleString("id-ID")}
          </p>
          <p className="text-[11px] text-[#111111]/70 font-medium">100% Peserta Terdaftar Resmi</p>
        </div>

        {/* Sudah Diambil */}
        <div className="p-6 rounded-xl bg-[#FAF5EA] text-[#111111] border-2 border-[#26734D] shadow-sm space-y-2">
          <div className="flex items-center justify-between text-[#26734D] text-xs font-bold uppercase tracking-wider">
            <span>SUDAH DIAMBIL</span>
            <CheckCircle2 className="w-5 h-5 text-[#26734D]" />
          </div>
          <p className="font-display text-5xl sm:text-6xl text-[#26734D] leading-none">
            {sudah.toLocaleString("id-ID")}
          </p>
          <p className="text-[11px] text-[#26734D] font-bold">
            Tercapai {percentage}% dari total kuota
          </p>
        </div>

        {/* Belum Diambil */}
        <div className="p-6 rounded-xl bg-[#FAF5EA] text-[#111111] border-2 border-[#D71920] shadow-sm space-y-2">
          <div className="flex items-center justify-between text-[#D71920] text-xs font-bold uppercase tracking-wider">
            <span>BELUM DIAMBIL</span>
            <AlertTriangle className="w-5 h-5 text-[#D71920]" />
          </div>
          <p className="font-display text-5xl sm:text-6xl text-[#D71920] leading-none">
            {belum.toLocaleString("id-ID")}
          </p>
          <p className="text-[11px] text-[#D71920] font-bold">
            Sisa {100 - percentage}% paket racepack
          </p>
        </div>
      </div>

      {/* Progress Bar Container */}
      <section className="p-6 rounded-xl bg-[#FAF5EA] border border-[#D8CDB8] shadow-sm space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-[#26734D]" />
            <span className="font-display text-base uppercase text-[#111111]">
              PROGRES SERAH TERIMA KESELURUHAN
            </span>
          </div>
          <span className="font-display text-2xl text-[#26734D]">{percentage}%</span>
        </div>

        {/* Bar */}
        <div className="w-full h-4 rounded-full bg-[#E6D8BE] overflow-hidden p-0.5 border border-[#D8CDB8]">
          <div
            className="h-full rounded-full bg-[#26734D] transition-all duration-500 shadow-sm"
            style={{ width: `${Math.min(100, Math.max(0, percentage))}%` }}
          />
        </div>

        <div className="flex items-center justify-between text-xs text-[#111111]/70 font-bold pt-1">
          <span>0 Peserta</span>
          <span>{total.toLocaleString("id-ID")} Peserta</span>
        </div>
      </section>

      {/* Category Breakdown */}
      {categories.length > 0 && (
        <section className="p-6 rounded-xl bg-[#FAF5EA] border border-[#D8CDB8] shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-lg uppercase text-[#111111] flex items-center gap-2">
              <Trophy className="w-4 h-4 text-[#D4B84C]" />
              <span>Rincian Pengambilan Berdasarkan Kategori</span>
            </h2>
            <span className="text-[10px] font-bold text-[#26734D] bg-[#26734D]/10 px-2.5 py-0.5 rounded border border-[#26734D]/30">
              MySQL Real-time
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {categories.map((cat) => (
              <div
                key={cat.kategori}
                className="p-4 rounded-lg bg-[#F3E8D2] border border-[#D8CDB8] space-y-2.5"
              >
                <div className="flex items-center justify-between">
                  <span className="font-display text-base text-[#111111] uppercase">
                    {cat.kategori}
                  </span>
                  <span className="font-display text-sm px-2 py-0.5 rounded bg-[#111111] text-[#F3E8D2]">
                    {cat.pct}%
                  </span>
                </div>
                <div className="w-full h-2 rounded-full bg-[#E6D8BE] overflow-hidden border border-[#D8CDB8]">
                  <div
                    className="h-full bg-[#26734D] rounded-full transition-all duration-300"
                    style={{ width: `${cat.pct}%` }}
                  />
                </div>
                <div className="flex justify-between text-xs text-[#111111]/75 font-semibold pt-1">
                  <span>Sudah: <strong className="text-[#26734D]">{cat.sudah}</strong></span>
                  <span>Total: <strong className="text-[#111111]">{cat.total}</strong></span>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Quick Action (style.md Primary CTA: background: #D71920, color: #FFFFFF) */}
      <div className="text-center pt-2">
        <Link
          href="/peserta"
          className="inline-flex items-center gap-2.5 px-8 py-3.5 rounded-lg bg-[#D71920] hover:bg-[#b5141a] active:bg-[#961015] text-white font-bold text-sm tracking-wider uppercase transition shadow-sm"
        >
          <PackageCheck className="w-5 h-5 text-white" />
          <span>Buka Meja Pengambilan Racepack</span>
        </Link>
      </div>
    </main>
  );
}

export default function DashboardPage() {
  return (
    <AuthGuard requiredRole="admin">
      <DashboardContent />
    </AuthGuard>
  );
}
