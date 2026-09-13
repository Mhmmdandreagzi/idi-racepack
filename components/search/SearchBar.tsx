"use client";

import React, { useRef } from "react";
import { Search, X, Loader2 } from "lucide-react";

interface SearchBarProps {
  value: string;
  onChange: (val: string) => void;
  onSearch: () => void;
  filteredCount: number;
  isLoading?: boolean;
  hasSearched?: boolean;
}

export default function SearchBar({
  value,
  onChange,
  onSearch,
  filteredCount,
  isLoading = false,
  hasSearched = false,
}: SearchBarProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  const handleClear = () => {
    onChange("");
    inputRef.current?.focus();
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch();
  };

  return (
    <form onSubmit={handleSubmit} className="w-full space-y-2">
      <div className="flex flex-col sm:flex-row items-stretch gap-2.5">
        {/* Input Text Box */}
        <div className="relative flex-1 flex items-center">
          <div className="absolute left-4 pointer-events-none text-[#111111]/70">
            <Search className="w-5 h-5" />
          </div>
          <input
            ref={inputRef}
            type="text"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder="Cari Nama, Nomor BIB, NIK, atau No HP..."
            autoComplete="off"
            autoCorrect="off"
            spellCheck={false}
            className="w-full pl-12 pr-11 py-3 sm:py-3.5 bg-[#FAF5EA] border-2 border-[#111111] focus:border-[#D71920] text-[#111111] rounded-xl text-base placeholder-[#111111]/40 focus:outline-none focus:ring-2 focus:ring-[#D71920]/20 transition-all font-medium"
          />
          {value.length > 0 && (
            <button
              type="button"
              onClick={handleClear}
              className="absolute right-3.5 p-1.5 text-[#111111]/60 hover:text-[#D71920] rounded-lg hover:bg-[#E6D8BE] transition"
              title="Hapus kata kunci"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Dedicated Cari Peserta Button */}
        <button
          type="submit"
          disabled={isLoading}
          className="shrink-0 flex items-center justify-center gap-2 px-6 py-3 sm:py-3.5 bg-[#D71920] hover:bg-[#b5141a] active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold rounded-xl text-sm sm:text-base transition shadow-sm cursor-pointer"
          title="Cari data peserta"
        >
          {isLoading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin text-white" />
              <span>Mencari...</span>
            </>
          ) : (
            <>
              <Search className="w-4 h-4" />
              <span>Cari Peserta</span>
            </>
          )}
        </button>
      </div>

      {/* Status Bar / Hints */}
      <div className="flex items-center justify-between px-1 text-xs text-[#111111]/70 font-medium">
        <div>
          {isLoading ? (
            <span className="inline-flex items-center text-[#26734D] font-bold">
              <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5 text-[#26734D]" />
              Memuat data peserta...
            </span>
          ) : (
            <span>
              Menampilkan <strong className="text-[#111111] font-bold">{filteredCount}</strong> peserta
            </span>
          )}
        </div>
        <span className="text-[11px] text-[#26734D] uppercase font-bold tracking-wider hidden sm:inline">
          Khusus Belum Diambil
        </span>
      </div>
    </form>
  );
}
