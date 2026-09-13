"use client";

import { useState, useCallback, useEffect } from "react";
import { Peserta } from "@/types/peserta";
import { queryPeserta } from "@/lib/services/pesertaQueryService";
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
  const [hasSearched, setHasSearched] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Execute search using cached dataset & MySQL
  // Boleh kosong: jika kosong akan menampilkan semua peserta yang cocok dengan filter
  const executeSearch = useCallback(
    async (overrideQuery?: string, overrideFilters?: SearchFilters) => {
      const q = (overrideQuery !== undefined ? overrideQuery : searchQuery).trim();
      const f = overrideFilters !== undefined ? overrideFilters : filters;

      try {
        setIsLoading(true);
        setError(null);

        const data = await queryPeserta({
          searchQuery: q,
          filters: f,
        });

        setResults(data);
        setHasSearched(true);
      } catch (err: any) {
        console.error("Failed querying peserta:", err);
        setError(
          err.message || "Gagal mengambil data peserta. Periksa koneksi database Anda."
        );
        setResults([]);
      } finally {
        setIsLoading(false);
      }
    },
    [searchQuery, filters]
  );

  // Load data immediately on first mount
  useEffect(() => {
    executeSearch("", { status: "belum", kategori: "all", sumber: "all" });
  }, []);

  // Update participant locally (e.g. after pickup confirmation)
  const updateLocalPeserta = useCallback((id: string, updates: Partial<Peserta>) => {
    setResults((prev) =>
      prev.map((p) => (p.id === id ? { ...p, ...updates } : p))
    );
  }, []);

  const handleSetFilters = useCallback(
    (newFilters: SearchFilters | ((prev: SearchFilters) => SearchFilters)) => {
      setFilters((prev) => {
        const next = typeof newFilters === "function" ? newFilters(prev) : newFilters;
        // Auto search with new filters
        executeSearch(searchQuery, next);
        return next;
      });
    },
    [searchQuery, executeSearch]
  );

  const resetSearch = useCallback(() => {
    setSearchQuery("");
    const initialF: SearchFilters = { status: "belum", kategori: "all", sumber: "all" };
    setFilters(initialF);
    setError(null);
    executeSearch("", initialF);
  }, [executeSearch]);

  return {
    allPeserta: results,
    results,
    filteredPeserta: results,
    searchQuery,
    setSearchQuery,
    filters,
    setFilters: handleSetFilters,
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
