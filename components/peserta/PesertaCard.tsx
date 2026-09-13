"use client";

import React from "react";
import { Peserta } from "@/types/peserta";
import { CheckCircle2, AlertTriangle, Shirt, Tag } from "lucide-react";

interface PesertaCardProps {
  peserta: Peserta;
  onSelect: (peserta: Peserta) => void;
}

export default function PesertaCard({ peserta, onSelect }: PesertaCardProps) {
  const isPicked = peserta.status_pengambilan;

  return (
    <div
      onClick={() => onSelect(peserta)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") onSelect(peserta);
      }}
      className={`group relative text-left p-4 sm:p-5 rounded-xl border-2 transition-all duration-150 cursor-pointer select-none active:scale-[0.99] shadow-sm ${
        isPicked
          ? "bg-[#FAF5EA] border-[#26734D]/60 hover:border-[#26734D]"
          : "bg-[#FAF5EA] border-[#D8CDB8] hover:border-[#111111] hover:bg-[#F3E8D2]"
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        {/* Name and Details */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <h3 className="font-display text-xl sm:text-2xl font-normal text-[#111111] transition-colors truncate">
              <span>{peserta.nama}</span>
              {peserta.nama_bib && peserta.nama_bib.trim() ? (
                <span className="text-[#D71920] font-bold ml-2 px-2 py-0.5 rounded-lg bg-[#D71920]/10 border border-[#D71920]/25 text-base sm:text-lg tracking-wide inline-block">
                  ({peserta.nama_bib.trim()})
                </span>
              ) : null}
            </h3>
            {peserta.jenis_kelamin && (
              <span className="text-[10px] font-bold uppercase px-1.5 py-0.5 rounded bg-[#E6D8BE] text-[#111111]">
                {peserta.jenis_kelamin === "L" ? "L" : "P"}
              </span>
            )}
          </div>

          {/* Sub-info: Kategori, Jersey, Pendaftaran */}
          <div className="flex flex-wrap items-center gap-y-1 gap-x-2 text-xs text-[#111111]/75 font-medium">
            <span className="font-bold text-[#111111] uppercase">
              {peserta.kategori || "5K UMUM"}
            </span>
            <span className="text-[#D8CDB8]">•</span>
            <span className="inline-flex items-center gap-1 font-bold text-[#111111]">
              <Shirt className="w-3.5 h-3.5 text-[#26734D]" />
              JERSEY {peserta.ukuran_jersey || "-"}
            </span>
            <span className="text-[#D8CDB8]">•</span>
            <span className="inline-flex items-center gap-1 text-[#111111]/60 truncate max-w-[140px]">
              <Tag className="w-3 h-3 text-[#111111]/40" />
              {peserta.pendaftaran_melalui}
            </span>
          </div>

          {/* If already picked, display staff & timestamp */}
          {isPicked && (
            <div className="mt-2.5 pt-2 border-t border-[#D8CDB8] flex items-center gap-1.5 text-xs text-[#26734D] font-bold">
              <CheckCircle2 className="w-4 h-4 text-[#26734D] shrink-0" />
              <span className="truncate">
                Diserahkan oleh: <strong>{peserta.petugas_nama || "Petugas"}</strong>
              </span>
            </div>
          )}
        </div>

        {/* BIB Number Highlight Badge */}
        <div className="flex flex-col items-end shrink-0">
          <div
            className={`px-3 py-1.5 rounded-lg border-2 text-center min-w-[76px] ${
              isPicked
                ? "bg-[#26734D] border-[#26734D] text-white"
                : "bg-[#111111] border-[#111111] text-[#F3E8D2]"
            }`}
          >
            <span className="text-[9px] uppercase font-bold tracking-widest text-[#D4B84C] block">
              BIB
            </span>
            <span className="font-display text-2xl font-normal leading-none block mt-0.5">
              {peserta.bib || "NO BIB"}
            </span>
          </div>

          {/* Status Label Pill (style.md Section 12) */}
          <span
            className={`mt-2 inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded border ${
              isPicked
                ? "bg-[#26734D] text-white border-[#26734D]"
                : "bg-[#E6D8BE] text-[#111111] border-[#D8CDB8]"
            }`}
          >
            {isPicked ? (
              <>
                <CheckCircle2 className="w-3 h-3 text-white" />
                ✓ SUDAH DIAMBIL
              </>
            ) : (
              <>
                <AlertTriangle className="w-3 h-3 text-[#D71920]" />
                ⚠ BELUM DIAMBIL
              </>
            )}
          </span>
        </div>
      </div>
    </div>
  );
}
