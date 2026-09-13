import { Peserta, normalizeSearchString } from "@/types/peserta";
import { SearchFilters } from "@/hooks/usePesertaSearch";
import { loadPesertaDataset } from "@/lib/cache/pesertaCache";

export interface SearchPesertaParams {
  searchQuery: string;
  filters: SearchFilters;
}

/**
 * Searches participant data quickly using local cached dataset (0ms priority)
 * backed by MySQL source of truth.
 */
export async function queryPeserta(
  params: SearchPesertaParams
): Promise<Peserta[]> {
  const { searchQuery, filters } = params;
  const rawQ = (searchQuery || "").trim();

  // Load participants dataset (from memory/localStorage cache or /api/peserta)
  const allPeserta = await loadPesertaDataset();
  const normQ = normalizeSearchString(rawQ);

  return applyLocalFilters(allPeserta, normQ, rawQ, filters);
}

// Backward-compatible alias for existing imports
export const queryPesertaFromFirestore = queryPeserta;

function applyLocalFilters(
  list: Peserta[],
  normQuery: string,
  rawQuery: string,
  filters: SearchFilters
): Peserta[] {
  const hasQuery = normQuery.length > 0;
  const isNumeric = /^\d+$/.test(rawQuery);

  return list.filter((p) => {
    // 1. Status Filter: Selalu hanya yang belum diambil (status_pengambilan === false)
    if (p.status_pengambilan) return false;

    // 2. Kategori Filter
    if (filters.kategori !== "all" && p.kategori !== filters.kategori) return false;

    // 3. Sumber Filter
    if (filters.sumber !== "all" && p.pendaftaran_melalui !== filters.sumber) return false;

    // 4. Search Query (Name, BIB, NIK, Phone)
    if (hasQuery) {
      // Direct numeric matches (BIB, NIK, Phone)
      if (isNumeric) {
        if (p.bib && p.bib.trim() === rawQuery) return true;
        if (p.nik && p.nik.includes(rawQuery)) return true;
        if (p.no_hp && p.no_hp.includes(rawQuery)) return true;
        if (p.no_telp_1 && p.no_telp_1.includes(rawQuery)) return true;
        if (p.no_telp_2 && p.no_telp_2.includes(rawQuery)) return true;
      }

      // Name search normalized
      const pName = p.nama_search || normalizeSearchString(p.nama);
      if (pName.includes(normQuery)) return true;

      // Nama BIB
      if (p.nama_bib && normalizeSearchString(p.nama_bib).includes(normQuery)) return true;

      // Partial BIB search
      if (p.bib && p.bib.toLowerCase().includes(normQuery)) return true;

      // Email & Kode Booking search
      if (p.email && p.email.toLowerCase().includes(normQuery)) return true;
      if (p.kode_1 && p.kode_1.toLowerCase().includes(normQuery)) return true;

      return false;
    }

    return true;
  });
}
