"use client";

import React from "react";
import { Peserta } from "@/types/peserta";
import { CheckCircle2, X } from "lucide-react";

interface PickupSuccessModalProps {
  peserta: Peserta | null;
  onClose: () => void;
}

export default function PickupSuccessModal({
  peserta,
  onClose,
}: PickupSuccessModalProps) {
  if (!peserta) return null;

  const formattedTime = peserta.waktu_pengambilan
    ? new Date(peserta.waktu_pengambilan).toLocaleTimeString("id-ID", {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      })
    : new Date().toLocaleTimeString("id-ID", {
        hour: "2-digit",
        minute: "2-digit",
      });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#111111]/80 backdrop-blur-sm animate-in fade-in zoom-in-95 duration-150">
      <div
        className="relative w-full max-w-md bg-[#FAF5EA] border-2 border-[#111111] rounded-2xl shadow-2xl p-6 sm:p-8 text-center text-[#111111] space-y-5"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-[#111111]/60 hover:text-[#D71920] rounded-lg hover:bg-[#E6D8BE] transition"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Big Success Icon (style.md Medical Green #26734D) */}
        <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-[#26734D]/15 text-[#26734D] border-2 border-[#26734D]">
          <CheckCircle2 className="w-12 h-12" />
        </div>

        {/* Headline */}
        <div>
          <span className="text-[10px] font-bold uppercase tracking-wider text-[#26734D] block">
            RUN IDI RUN 5K
          </span>
          <h2 className="font-display text-3xl font-normal text-[#111111] tracking-tight uppercase leading-none mt-1">
            RACEPACK BERHASIL DIAMBIL!
          </h2>
          <p className="text-xs text-[#111111]/70 mt-1 font-medium">
            Transaksi serah terima resmi tercatat ke sistem database
          </p>
        </div>

        {/* Participant Details Card */}
        <div className="p-4 rounded-xl bg-[#F3E8D2] border border-[#D8CDB8] text-left space-y-2.5">
          <div>
            <span className="text-[10px] uppercase font-bold text-[#111111]/60 tracking-wider">
              NAMA PESERTA
            </span>
            <p className="font-display text-2xl font-normal text-[#111111] leading-tight mt-0.5">
              {peserta.nama}{peserta.nama_bib && peserta.nama_bib.trim() ? ` (${peserta.nama_bib.trim()})` : ""}
            </p>
          </div>

          <div className="grid grid-cols-2 gap-2 pt-2 border-t border-[#D8CDB8]">
            <div>
              <span className="text-[10px] uppercase font-bold text-[#111111]/60 tracking-wider">
                NOMOR BIB
              </span>
              <p className="font-display text-2xl font-normal text-[#111111] leading-none mt-0.5">
                {peserta.bib || "NO BIB"}
              </p>
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold text-[#111111]/60 tracking-wider">
                KATEGORI / JERSEY
              </span>
              <p className="text-xs font-bold text-[#26734D] mt-0.5">
                {peserta.kategori} • Size {peserta.ukuran_jersey || "-"}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 pt-2 border-t border-[#D8CDB8] text-xs font-medium">
            <div>
              <span className="text-[10px] text-[#111111]/60 block">Petugas:</span>
              <span className="font-bold text-[#111111]">
                {peserta.petugas_nama || "Petugas Meja"}
              </span>
            </div>
            <div>
              <span className="text-[10px] text-[#111111]/60 block">Waktu:</span>
              <span className="font-mono font-bold text-[#26734D]">
                {formattedTime} WIB
              </span>
            </div>
          </div>
        </div>

        {/* Next Participant Action (style.md: background: #26734D, color: #FFFFFF) */}
        <button
          onClick={onClose}
          autoFocus
          className="w-full py-3.5 px-4 rounded-lg bg-[#26734D] hover:bg-[#1f5c3e] active:bg-[#184831] text-white font-bold text-xs uppercase tracking-wider transition duration-150 shadow-sm"
        >
          Siap Layani Peserta Berikutnya
        </button>
      </div>
    </div>
  );
}
