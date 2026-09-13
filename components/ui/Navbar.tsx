"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/lib/auth/AuthContext";
import {
  PackageCheck,
  BarChart3,
  History,
  LogOut,
  User,
  Shield,
} from "lucide-react";

export default function Navbar() {
  const pathname = usePathname();
  const { user, role, logout } = useAuth();

  const isAdminOrSuper = role === "admin" || role === "superadmin";

  const navItems = user
    ? [
        { label: "Ambil Racepack", href: "/peserta", icon: PackageCheck },
        ...(isAdminOrSuper
          ? [
              { label: "Dashboard", href: "/dashboard", icon: BarChart3 },
              { label: "Admin", href: "/admin", icon: Shield },
            ]
          : []),
        { label: "Riwayat", href: "/pengambilan", icon: History },
      ]
    : [];

  return (
    <header className="sticky top-0 z-40 bg-[#F3E8D2] border-b-2 border-[#111111] text-[#111111] shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-18">
          {/* Brand Logo: RUN IDI RUN */}
          <div className="flex items-center space-x-3">
            <Link href="/" className="flex items-center space-x-3 group">
              <div className="flex items-center tracking-tight leading-none">
                <span className="font-display text-3xl sm:text-4xl font-normal text-[#111111]">
                  RUN
                </span>
                <span className="font-display text-3xl sm:text-4xl font-normal text-[#D71920] mx-1">
                  IDI
                </span>
                <span className="font-display text-3xl sm:text-4xl font-normal text-[#111111]">
                  RUN
                </span>
              </div>
              <div className="hidden lg:block border-l-2 border-[#111111] pl-3">
                <span className="text-[11px] font-bold text-[#26734D] italic block leading-none">
                  &ldquo;Langkah Sehat Untuk Negeri&rdquo;
                </span>
                <span className="text-[9px] uppercase font-bold text-[#111111]/70 block mt-0.5 tracking-wider">
                  IDI Kabupaten Sumenep
                </span>
              </div>
            </Link>
          </div>

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center space-x-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center space-x-1.5 px-3.5 py-2 rounded-lg text-xs font-bold uppercase tracking-wide transition-all ${
                    isActive
                      ? "bg-[#111111] text-[#F3E8D2] shadow-sm"
                      : "text-[#111111] hover:bg-[#E6D8BE] hover:text-[#111111]"
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? "text-[#D71920]" : ""}`} />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>

          {/* User Profile & Actions */}
          <div className="flex items-center space-x-2.5">
            {user ? (
              <div className="flex items-center space-x-2">
                <div className="flex items-center space-x-2 px-3 py-1.5 rounded-lg bg-[#E6D8BE] border border-[#D8CDB8]">
                  <div className="w-5 h-5 rounded-full bg-[#111111] text-[#F3E8D2] flex items-center justify-center font-bold text-[10px]">
                    <User className="w-3 h-3" />
                  </div>
                  <div className="text-left hidden sm:block">
                    <p className="text-xs font-bold text-[#111111] leading-tight">
                      {user.displayName || user.nama || "Petugas"}
                    </p>
                    <p className="text-[9px] text-[#26734D] uppercase font-bold tracking-wider">
                      {user.role}
                    </p>
                  </div>
                </div>

                <button
                  onClick={logout}
                  title="Logout"
                  className="p-2 text-[#111111]/70 hover:text-[#D71920] hover:bg-[#E6D8BE] rounded-lg transition"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <Link
                href="/login"
                className="px-4 py-2 text-xs font-bold uppercase tracking-wider rounded-lg bg-[#D71920] hover:bg-[#b5141a] text-white transition shadow-sm"
              >
                Login Petugas
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* Mobile Sub-Navigation Bar */}
      {user && (
        <div className="md:hidden flex border-t border-[#D8CDB8] bg-[#E6D8BE]/70 overflow-x-auto py-1.5 px-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex-1 min-w-[70px] py-1.5 px-1 flex flex-col items-center justify-center text-[10px] font-bold rounded transition ${
                  isActive
                    ? "text-[#F3E8D2] bg-[#111111]"
                    : "text-[#111111]/80 hover:text-[#111111]"
                }`}
              >
                <Icon className={`w-4 h-4 mb-0.5 ${isActive ? "text-[#D71920]" : ""}`} />
                <span className="truncate">{item.label}</span>
              </Link>
            );
          })}
        </div>
      )}
    </header>
  );
}
