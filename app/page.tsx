"use client";

import React from "react";
import Link from "next/link";
import { useAuth } from "@/lib/auth/AuthContext";
import {
  PackageCheck,
  BarChart3,
  History,
  Shield,
  ArrowRight,
  MapPin,
  Calendar,
  GraduationCap,
  Users,
  Stethoscope,
  Trophy,
  Info,
  Lock,
} from "lucide-react";

export default function WelcomePage() {
  const { user, role } = useAuth();
  return (
    <main className="flex-1 max-w-5xl w-full mx-auto px-4 py-6 sm:py-10 space-y-8">
      {/* Official Poster-inspired Green Hero Section */}
      <section className="relative overflow-hidden rounded-3xl bg-[#0C2E24] border-2 border-[#185E4B] text-white p-6 sm:p-10 shadow-2xl">
        {/* Background decorative athletic elements */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-[#185E4B]/30 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 right-1/4 w-64 h-64 bg-[#D4B84C]/10 rounded-full blur-2xl pointer-events-none" />
        <div className="absolute -left-12 -bottom-12 w-48 h-48 bg-[#D71920]/10 rounded-full blur-2xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="space-y-4 max-w-2xl">
            {/* Tagline Badge */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#185E4B] border border-[#23846A] text-[#FAF3E3] text-xs font-bold uppercase tracking-wider">
              <span>IDI CABANG SUMENEP</span>
              <span className="text-[#D4B84C]">►►►►</span>
              <span className="text-[#D4B84C]">5K RUN</span>
            </div>

            {/* Poster Big Title */}
            <div className="space-y-1">
              <div className="flex items-center tracking-tight leading-none">
                <span className="font-display text-6xl sm:text-8xl text-white">
                  RUN
                </span>
                <span className="font-display text-6xl sm:text-8xl text-[#D71920] px-3 py-1 bg-white/10 rounded-2xl mx-2 border-2 border-[#D71920]/60 shadow-lg">
                  IDI
                </span>
                <span className="font-display text-6xl sm:text-8xl text-white">
                  RUN
                </span>
              </div>
              <p className="text-xl sm:text-2xl font-bold italic text-[#D4B84C] tracking-wide pt-1">
                &ldquo;Langkah Sehat Untuk Negeri&rdquo;
              </p>
            </div>

            <p className="text-xs sm:text-sm text-[#EAF4F0]/90 leading-relaxed max-w-xl font-medium">
              Sistem Manajemen Pengambilan Racepack resmi untuk event lari <strong>RUN IDI RUN 5K 2026</strong>.
              Dirancang untuk verifikasi instan identitas peserta, validasi nomor BIB, ukuran jersey, dan serah terima racepack yang aman.
            </p>

            {/* Event Metadata Pills */}
            <div className="flex flex-wrap items-center gap-2.5 pt-2">
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white text-[#0C2E24] font-bold text-xs shadow">
                <Calendar className="w-3.5 h-3.5 text-[#D4B84C]" />
                <span>27 SEP 2026</span>
              </div>

              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#114537] border border-[#185E4B] text-[#FAF3E3] font-bold text-xs">
                <MapPin className="w-3.5 h-3.5 text-[#D71920]" />
                <span>Stadion A. Yani, Sumenep</span>
              </div>

              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#D4B84C] text-[#0C2E24] font-bold text-xs shadow">
                <Trophy className="w-3.5 h-3.5" />
                <span>TOTAL HADIAH 50 JUTA</span>
              </div>
            </div>
          </div>

          {/* Quick CTA to /peserta or Login */}
          <div className="shrink-0 pt-4 md:pt-0">
            {user ? (
              <Link
                href="/peserta"
                className="inline-flex items-center gap-2 px-6 py-4 rounded-xl bg-[#D71920] hover:bg-[#b5141a] text-white font-bold text-xs uppercase tracking-wider transition shadow-lg shadow-[#0C2E24]/40"
              >
                <span>Buka Meja Pengambilan</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            ) : (
              <Link
                href="/login?redirect=/peserta"
                className="inline-flex items-center gap-2 px-6 py-4 rounded-xl bg-[#D71920] hover:bg-[#b5141a] text-white font-bold text-xs uppercase tracking-wider transition shadow-lg shadow-[#0C2E24]/40"
              >
                <Lock className="w-4 h-4" />
                <span>Login Petugas Meja</span>
              </Link>
            )}
          </div>
        </div>
      </section>

      {/* SOP Meja Pengambilan (style.md Section 11) */}
      <section className="p-6 rounded-xl bg-[#FAF5EA] border border-[#D8CDB8] space-y-4">
        <div className="flex items-center gap-2 text-[#111111]">
          <Info className="w-5 h-5 text-[#26734D]" />
          <h3 className="font-display text-lg tracking-wide uppercase">
            Panduan Alur Serah Terima Racepack (SOP Petugas)
          </h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-1">
          <div className="p-4 rounded-lg bg-[#F3E8D2] border border-[#D8CDB8] space-y-1.5">
            <span className="font-display flex h-7 w-7 items-center justify-center rounded bg-[#111111] text-[#F3E8D2] text-sm">
              1
            </span>
            <p className="font-bold text-xs text-[#111111] uppercase tracking-wider">Minta Identitas</p>
            <p className="text-[11px] text-[#111111]/70 leading-relaxed">
              Minta bukti pendaftaran, KTP/SIM, atau nomor BIB peserta.
            </p>
          </div>

          <div className="p-4 rounded-lg bg-[#F3E8D2] border border-[#D8CDB8] space-y-1.5">
            <span className="font-display flex h-7 w-7 items-center justify-center rounded bg-[#D71920] text-white text-sm">
              2
            </span>
            <p className="font-bold text-xs text-[#111111] uppercase tracking-wider">Cari Peserta</p>
            <p className="text-[11px] text-[#111111]/70 leading-relaxed">
              Ketik nama/BIB di menu Ambil Racepack. Hasil filter instan di memori lokal.
            </p>
          </div>

          <div className="p-4 rounded-lg bg-[#F3E8D2] border border-[#D8CDB8] space-y-1.5">
            <span className="font-display flex h-7 w-7 items-center justify-center rounded bg-[#D4B84C] text-[#111111] text-sm">
              3
            </span>
            <p className="font-bold text-xs text-[#111111] uppercase tracking-wider">Verifikasi Jersey</p>
            <p className="text-[11px] text-[#111111]/70 leading-relaxed">
              Cocokkan ukuran jersey (S/M/L/XL) & kategori lari sebelum serah terima.
            </p>
          </div>

          <div className="p-4 rounded-lg bg-[#F3E8D2] border border-[#D8CDB8] space-y-1.5">
            <span className="font-display flex h-7 w-7 items-center justify-center rounded bg-[#26734D] text-white text-sm">
              4
            </span>
            <p className="font-bold text-xs text-[#111111] uppercase tracking-wider">Klik Konfirmasi</p>
            <p className="text-[11px] text-[#111111]/70 leading-relaxed">
              Klik &quot;Ambil Racepack&quot;. Transaksi atomic mengunci data dan mencegah duplikasi.
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}
