"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/lib/auth/AuthContext";
import { Lock, Mail, AlertCircle, ArrowRight, ShieldCheck, Loader2 } from "lucide-react";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTarget = searchParams.get("redirect") || "/peserta";

  const { user, login } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // If already logged in, redirect straight to target
  useEffect(() => {
    if (user) {
      router.replace(redirectTarget);
    }
  }, [user, redirectTarget, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) {
      setErrorMsg("Harap masukkan email dan password.");
      return;
    }

    setIsSubmitting(true);
    setErrorMsg(null);

    const res = await login(email, password);
    setIsSubmitting(false);

    if (res.success) {
      router.push(redirectTarget);
    } else {
      setErrorMsg(res.error || "Login gagal. Pastikan email dan password sesuai.");
    }
  };

  const handleQuickLogin = (quickEmail: string, quickPass: string) => {
    setEmail(quickEmail);
    setPassword(quickPass);
  };

  return (
    <div className="w-full max-w-md bg-[#FAF5EA] border-2 border-[#111111] rounded-2xl p-6 sm:p-8 shadow-sm space-y-6">
      {/* Brand Header (style.md Section 27) */}
      <div className="text-center space-y-1">
        <div className="font-display text-5xl sm:text-6xl tracking-tight leading-none">
          <span className="text-[#111111] block">RUN</span>
          <span className="text-[#D71920] block -mt-2">IDI</span>
          <span className="text-[#111111] block -mt-2">RUN</span>
        </div>
        <span className="text-[11px] font-bold tracking-widest uppercase text-[#26734D] block pt-2">
          RACEPACK MANAGEMENT
        </span>
        <p className="text-xs text-[#111111]/70 font-medium">
          Ikatan Dokter Indonesia Kabupaten Sumenep
        </p>
      </div>

      {/* Redirect notice if redirected from protected route */}
      {searchParams.get("redirect") && (
        <div className="p-3 rounded-xl bg-[#E6D8BE] border border-[#D8CDB8] text-[#111111] text-xs font-semibold flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-[#26734D] shrink-0" />
          <span>Silakan masuk untuk mengakses halaman {searchParams.get("redirect")}.</span>
        </div>
      )}

      {/* Error notification */}
      {errorMsg && (
        <div className="p-3.5 rounded-lg bg-[#FAF5EA] border-2 border-[#D71920] text-[#D71920] text-xs font-bold flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-[#D71920] shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Login Form */}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-[#111111]/80 block uppercase tracking-wider text-[10px]">
            Email Petugas / Admin
          </label>
          <div className="relative">
            <Mail className="w-4 h-4 absolute left-3.5 top-3.5 text-[#111111]/50" />
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@super.com"
              className="w-full pl-10 pr-4 py-3 bg-[#F3E8D2] border border-[#D8CDB8] focus:border-[#111111] text-[#111111] rounded-lg text-sm placeholder-[#111111]/40 focus:outline-none font-medium"
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-bold text-[#111111]/80 block uppercase tracking-wider text-[10px]">
            Password
          </label>
          <div className="relative">
            <Lock className="w-4 h-4 absolute left-3.5 top-3.5 text-[#111111]/50" />
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full pl-10 pr-4 py-3 bg-[#F3E8D2] border border-[#D8CDB8] focus:border-[#111111] text-[#111111] rounded-lg text-sm placeholder-[#111111]/40 focus:outline-none font-medium"
            />
          </div>
        </div>

        {/* Primary Submit Button: background #D71920 (style.md Section 10 & 27) */}
        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full py-3.5 px-4 rounded-lg bg-[#D71920] hover:bg-[#b5141a] active:bg-[#961015] text-white font-bold text-sm uppercase tracking-wider transition duration-150 flex items-center justify-center gap-2 shadow-sm disabled:opacity-50"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="w-4 h-4 text-white animate-spin" />
              <span>MEMVERIFIKASI...</span>
            </>
          ) : (
            <>
              <span>MASUK KE SISTEM</span>
              <ArrowRight className="w-4 h-4 text-white" />
            </>
          )}
        </button>
      </form>

      {/* Quick Credentials Helper */}
      <div className="pt-4 border-t border-[#D8CDB8] space-y-2.5">
        <p className="text-[10px] font-bold uppercase tracking-wider text-[#111111]/60 text-center">
          Pilihan Akun Resmi:
        </p>
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => handleQuickLogin("petugas@racepack.com", "petugas123")}
            className="p-2.5 rounded-lg bg-[#F3E8D2] hover:bg-[#E6D8BE] border border-[#D8CDB8] text-left transition"
          >
            <p className="text-xs font-bold text-[#111111]">Petugas Meja</p>
            <p className="text-[10px] text-[#26734D] font-bold">petugas@racepack.com</p>
          </button>
          <button
            type="button"
            onClick={() => handleQuickLogin("admin@racepack.com", "admin123")}
            className="p-2.5 rounded-lg bg-[#F3E8D2] hover:bg-[#E6D8BE] border border-[#D8CDB8] text-left transition"
          >
            <p className="text-xs font-bold text-[#111111]">Admin Utama</p>
            <p className="text-[10px] text-[#D71920] font-bold">admin@racepack.com</p>
          </button>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <main className="flex-1 flex items-center justify-center p-4">
      <Suspense
        fallback={
          <div className="p-8 rounded-2xl bg-[#FAF5EA] border-2 border-[#111111] text-center">
            <Loader2 className="w-6 h-6 text-[#D71920] animate-spin mx-auto mb-2" />
            <span className="text-xs font-bold text-[#111111]">Memuat Formulir Login...</span>
          </div>
        }
      >
        <LoginForm />
      </Suspense>
    </main>
  );
}
