"use client";

import React from "react";
import { SearchFilters } from "@/hooks/usePesertaSearch";
import { RotateCcw } from "lucide-react";
import { KategoriPeserta, SumberDaftar } from "@/types/peserta";
import { KATEGORI_OPTIONS, SUMBER_PENDAFTARAN_OPTIONS } from "@/constants/peserta";

interface FilterChipsProps {
  filters: SearchFilters;
  onChange: (filters: SearchFilters) => void;
  categories?: (KategoriPeserta | string)[];
  sources?: (SumberDaftar | string)[];
}

export default function FilterChips({
  filters,
  onChange,
  categories = KATEGORI_OPTIONS,
  sources = SUMBER_PENDAFTARAN_OPTIONS,
}: FilterChipsProps) {
  const isFiltered = filters.kategori !== "all" || filters.sumber !== "all";

  const handleReset = () => {
    onChange({ status: "belum", kategori: "all", sumber: "all" });
  };

  return (
    <div className="flex flex-wrap items-center justify-between gap-2.5 py-1">
      <div className="flex flex-wrap items-center gap-2">
        {/* Status Badge: Belum Diambil (Tanpa jumlah untuk hemat kuota Firestore) */}
        <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-[#D71920] text-white shadow-sm">
          <span className="w-2 h-2 rounded-full bg-white" />
          <span>Status: Belum Diambil</span>
        </div>

        {/* Kategori Selector (Hardcoded Enum) */}
        <select
          value={filters.kategori}
          onChange={(e) => onChange({ ...filters, kategori: e.target.value })}
          className="bg-[#FAF5EA] border border-[#D8CDB8] text-[#111111] text-xs font-bold rounded-lg px-3 py-1.5 focus:border-[#111111] focus:outline-none shadow-sm cursor-pointer"
        >
          <option value="all">Kategori: Semua</option>
          {categories.map((cat) => (
            <option key={cat} value={cat}>
              {cat}
            </option>
          ))}
        </select>

        {/* Sumber Selector (Hardcoded Enum) */}
        <select
          value={filters.sumber}
          onChange={(e) => onChange({ ...filters, sumber: e.target.value })}
          className="bg-[#FAF5EA] border border-[#D8CDB8] text-[#111111] text-xs font-bold rounded-lg px-3 py-1.5 focus:border-[#111111] focus:outline-none max-w-[220px] truncate shadow-sm cursor-pointer"
        >
          <option value="all">Sumber: Semua ({sources.length})</option>
          {sources.map((src) => (
            <option key={src} value={src}>
              {src}
            </option>
          ))}
        </select>
      </div>

      {/* Reset Filter Button */}
      {isFiltered && (
        <button
          type="button"
          onClick={handleReset}
          className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs text-[#D71920] hover:bg-[#FAF5EA] border border-[#D71920]/40 transition font-bold"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Reset Filter</span>
        </button>
      )}
    </div>
  );
}
