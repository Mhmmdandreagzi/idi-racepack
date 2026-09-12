import { KategoriPeserta, SumberDaftar } from "@/types/peserta";

export { KategoriPeserta, SumberDaftar };

/**
 * Hardcoded category list derived directly from KategoriPeserta enum.
 * ZERO Firestore read cost.
 */
export const KATEGORI_OPTIONS: KategoriPeserta[] = Object.values(KategoriPeserta);

/**
 * Hardcoded registration source list derived directly from SumberDaftar enum.
 * ZERO Firestore read cost.
 */
export const SUMBER_PENDAFTARAN_OPTIONS: SumberDaftar[] = Object.values(SumberDaftar);
