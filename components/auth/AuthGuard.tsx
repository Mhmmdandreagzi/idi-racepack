"use client";

import React, { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "@/lib/auth/AuthContext";
import { Lock, ShieldAlert, ArrowRight, Loader2 } from "lucide-react";
import Link from "next/link";

interface AuthGuardProps {
  children: React.ReactNode;
  requiredRole?: "superadmin" | "admin" | "petugas";
}

export default function AuthGuard({ children, requiredRole }: AuthGuardProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, role, isLoading } = useAuth();

  useEffect(() => {
    if (!isLoading && !user) {
      const redirectUrl = `/login?redirect=${encodeURIComponent(pathname)}`;
      router.replace(redirectUrl);
    }
  }, [user, isLoading, pathname, router]);

  // 1. Loading State
  if (isLoading) {
    return (
      <main className="flex-1 flex items-center justify-center min-h-[60vh] p-4">
        <div className="flex flex-col items-center gap-3 p-8 rounded-2xl bg-[#FAF5EA] border-2 border-[#111111] shadow-sm max-w-sm w-full text-center">
          <Loader2 className="w-8 h-8 text-[#D71920] animate-spin" />
          <p className="font-display text-lg text-[#111111] tracking-wide uppercase">
            Memverifikasi Akses
          </p>
          <p className="text-xs text-[#111111]/70">
            Menghubungkan ke sistem otentikasi...
          </p>
        </div>
      </main>
    );
  }

  // 2. Unauthenticated State (Redirecting)
  if (!user) {
    const loginTarget = `/login?redirect=${encodeURIComponent(pathname)}`;
    return (
      <main className="flex-1 flex items-center justify-center min-h-[65vh] p-4">
        <div className="max-w-md w-full p-6 sm:p-8 rounded-2xl bg-[#FAF5EA] border-2 border-[#111111] shadow-sm text-center space-y-5">
          <div className="w-14 h-14 rounded-2xl bg-[#D71920]/10 border-2 border-[#D71920] text-[#D71920] flex items-center justify-center mx-auto">
            <Lock className="w-7 h-7" />
          </div>

          <div className="space-y-1.5">
            <h2 className="font-display text-2xl text-[#111111] tracking-tight uppercase">
              Akses Dibatasi
            </h2>
            <p className="text-xs text-[#111111]/75 leading-relaxed">
              Halaman ini memerlukan otorisasi petugas meja registrasi. Silakan login terlebih dahulu untuk melanjutkan.
            </p>
          </div>

          <div className="pt-2">
            <Link
              href={loginTarget}
              className="inline-flex items-center justify-center gap-2 w-full py-3 px-4 rounded-xl bg-[#D71920] hover:bg-[#b5141a] text-white font-bold text-xs uppercase tracking-wider transition shadow-sm"
            >
              <span>Login Petugas Sekarang</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </main>
    );
  }

  // 3. Unauthorized Role State (e.g. Non-admin accessing admin panel)
  const isAuthorized =
    !requiredRole ||
    role === requiredRole ||
    (requiredRole === "admin" && role === "superadmin");

  if (!isAuthorized) {
    return (
      <main className="flex-1 flex items-center justify-center min-h-[65vh] p-4">
        <div className="max-w-md w-full p-6 sm:p-8 rounded-2xl bg-[#FAF5EA] border-2 border-[#111111] shadow-sm text-center space-y-5">
          <div className="w-14 h-14 rounded-2xl bg-[#111111] text-[#D4B84C] flex items-center justify-center mx-auto">
            <ShieldAlert className="w-7 h-7 text-[#D71920]" />
          </div>

          <div className="space-y-1.5">
            <h2 className="font-display text-2xl text-[#111111] tracking-tight uppercase">
              Hak Akses Tidak Memadai
            </h2>
            <p className="text-xs text-[#111111]/75 leading-relaxed">
              Akun Anda tercatat sebagai <strong className="text-[#111111] uppercase">{role || "Petugas"}</strong> ({user.displayName || user.email}). Halaman ini memerlukan hak akses <strong>{requiredRole === "superadmin" ? "Super Administrator" : "Administrator"}</strong>.
            </p>
          </div>

          <div className="pt-2 flex flex-col gap-2">
            <Link
              href="/peserta"
              className="inline-flex items-center justify-center gap-2 w-full py-3 px-4 rounded-xl bg-[#111111] hover:bg-black text-[#F3E8D2] font-bold text-xs uppercase tracking-wider transition"
            >
              <span>Kembali ke Meja Pengambilan</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              href="/"
              className="text-xs font-bold text-[#111111]/70 hover:text-[#111111] py-1"
            >
              Menuju Halaman Utama
            </Link>
          </div>
        </div>
      </main>
    );
  }

  // 4. Authenticated & Authorized
  return <>{children}</>;
}
