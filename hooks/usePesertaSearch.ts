"use client";

import { useState, useCallback } from "react";
import { Peserta } from "@/types/peserta";
import { queryPesertaFromFirestore } from "@/lib/services/pesertaQueryService";
import { KategoriPeserta, SumberDaftar } from "@/types/peserta";
import { KATEGORI_OPTIONS, SUMBER_PENDAFTARAN_OPTIONS } from "@/constants/peserta";

export interface SearchFilters {
  status: "belum";
  kategori: KategoriPeserta | "all" | string;
  sumber: SumberDaftar | "all" | string;
}

export function usePesertaSearch() {
  const [results, setResults] = useState<Peserta[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [filters, setFilters] = useState<SearchFilters>({
    status: "belum",
    kategori: "all",
    sumber: "all",
  });
  const [hasSearched, setHasSearched] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Execute on-demand search directly to Firestore
  const executeSearch = useCallback(
    async (overrideQuery?: string, overrideFilters?: SearchFilters) => {
      const q = (overrideQuery !== undefined ? overrideQuery : searchQuery).trim();
      const f = overrideFilters !== undefined ? overrideFilters : filters;

      // Jika input pencarian kosong, JANGAN lakukan get data ke Firestore
      if (!q) {
        setError("Harap masukkan kata kunci pencarian (Nama, No BIB, NIK, atau No HP).");
        return;
      }

      try {
        setIsLoading(true);
        setError(null);
        setHasSearched(true);

        const data = await queryPesertaFromFirestore({
          searchQuery: q,
          filters: f,
        });

        setResults(data);
      } catch (err: any) {
        console.error("Failed querying peserta from Firestore:", err);
        setError(
          err.message || "Gagal mengambil data dari Firestore. Periksa koneksi dan izin Anda."
        );
        setResults([]);
      } finally {
        setIsLoading(false);
      }
    },
    [searchQuery, filters]
  );

  // Update participant locally (e.g. after pickup confirmation)
  const updateLocalPeserta = useCallback((id: string, updates: Partial<Peserta>) => {
    setResults((prev) =>
      prev.map((p) => (p.id === id ? { ...p, ...updates } : p))
    );
  }, []);

  const resetSearch = useCallback(() => {
    setSearchQuery("");
    setFilters({ status: "belum", kategori: "all", sumber: "all" });
    setResults([]);
    setHasSearched(false);
    setError(null);
  }, []);

  return {
    allPeserta: results,
    results,
    filteredPeserta: results,
    searchQuery,
    setSearchQuery,
    filters,
    setFilters,
    hasSearched,
    isLoading,
    error,
    executeSearch,
    refreshData: executeSearch,
    resetSearch,
    updateLocalPeserta,
    categories: Array.from(KATEGORI_OPTIONS),
    sources: Array.from(SUMBER_PENDAFTARAN_OPTIONS),
  };
}
