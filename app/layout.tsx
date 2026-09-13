import type { Metadata } from "next";
import { Anton, Inter } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/lib/auth/AuthContext";
import { ToastProvider } from "@/context/ToastContext";
import Navbar from "@/components/ui/Navbar";

import Image from "next/image";

const anton = Anton({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-anton",
  display: "swap",
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: "RUN IDI RUN — Racepack Management System",
  description:
    "Sistem Resmi Pengambilan Racepack RUN IDI RUN 2026 — Langkah Sehat Untuk Negeri • Ikatan Dokter Indonesia (IDI) Kabupaten Sumenep",
  icons: {
    icon: [
      { url: "/image/logo/logo-idi.png", sizes: "any" },
      { url: "/image/logo/logo-idi.png", type: "image/png" },
    ],
    shortcut: "/image/logo/logo-idi.png",
    apple: "/image/logo/logo-idi.png",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="id"
      className={`${anton.variable} ${inter.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-[#F3E8D2] text-[#111111] selection:bg-[#D71920] selection:text-white font-sans">
        <AuthProvider>
          <ToastProvider>
            <Navbar />
            <div className="flex-1 flex flex-col">{children}</div>
            <footer className="border-t border-[#D8CDB8] bg-[#E6D8BE]/50 py-6 px-4 text-center text-xs text-[#111111]/70">
              <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <Image
                    src="/image/logo/logo-idi.png"
                    alt="Logo IDI"
                    width={20}
                    height={20}
                    className="w-5 h-5 object-contain"
                  />
                  <span className="font-display font-bold text-[#111111] tracking-wider text-sm">
                    RUN <span className="text-[#D71920]">IDI</span> RUN
                  </span>
                  <span>•</span>
                  <span className="italic font-medium">Langkah Sehat Untuk Negeri</span>
                </div>
                <p className="font-semibold text-[#111111]">
                  Ikatan Dokter Indonesia (IDI) Kabupaten Sumenep
                </p>
              </div>
            </footer>
          </ToastProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
