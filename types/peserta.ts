export enum KategoriPeserta {
  NAKES = "Nakes",
  PELAJAR = "Pelajar",
  UMUM = "Umum",
}

export enum SumberDaftar {
  BPRS = "BPRS",
  BREU = "BREU",
  DRIVER_RSI = "Driver RSI",
  IDI = "IDI",
  IRPUS_2 = "IRPUS 2",
  IRSUP = "IRSUP",
  MANUAL_1 = "MANUAL 1",
  MANUAL_2 = "MANUAL 2",
  PKM_AMBUNTEN = "PKM Ambunten",
  PKM_BATANG2 = "PKM BATANG2",
  PKM_BATU_PUTIH = "PKM Batu Putih",
  PKM_BATUAN = "PKM Batuan",
  PKM_BLUTO = "PKM Bluto",
  PKM_DASUK = "PKM Dasuk",
  PKM_GULUK = "PKM GULUK",
  PKM_GANDING = "PKM Ganding",
  PKM_GAPURA = "PKM Gapura",
  PKM_KALIANGET = "PKM Kalianget",
  PKM_LENTENG = "PKM LENTENG",
  PKM_MANDING = "PKM Manding",
  PKM_MASALEMBU = "PKM Masalembu",
  PKM_PAMOLOKAN = "PKM Pamolokan",
  PKM_PANDIAN = "PKM Pandian",
  PKM_PASONGSONGAN = "PKM Pasongsongan",
  PKM_PRAGAAN = "PKM Pragaan",
  PKM_SAPEKEN = "PKM Sapeken",
  PKM_SARONGGI = "PKM Saronggi",
  PKM_TALANGO = "PKM Talango",
  TRIBUN = "TRIBUN",
  VK_RSUD = "VK RSUD",
}

export interface Peserta {
  id: string; // Guaranteed unique document ID (Firestore or generated)
  nama: string; // Original full name
  nama_search: string; // Lowercase, trimmed, single whitespace for 0ms local search
  bib: string; // BIB number (may be empty string if not assigned)
  kategori: KategoriPeserta | string; // Category enum or string
  nik?: string; // Identity number
  no_hp?: string; // Phone number
  jenis_kelamin?: string; // "L" | "P" | "-"
  tanggal_lahir?: string;
  alamat?: string;
  ukuran_jersey: string; // "S", "M", "L", "XL", "XXL", etc.
  pendaftaran_melalui: SumberDaftar | string; // Registration source enum or string
  
  // Status fields
  status_pengambilan: boolean;
  waktu_pengambilan: string | null; // ISO string or formatted timestamp
  petugas_id: string | null;
  petugas_nama?: string | null;
  catatan?: string | null;

  // Metadata Pengambilan Kolektif / Diwakilkan
  is_kolektif?: boolean;
  diambil_oleh?: string;
  nik_pengambil?: string;
  no_hp_pengambil?: string;
  alamat_pengambil?: string;
}

/**
 * Normalizes a name string for fast local searching:
 * - lowercase
 * - trim outer whitespace
 * - collapse consecutive spaces to a single space
 */
export function normalizeSearchString(val: string | null | undefined): string {
  if (!val) return "";
  return val
    .toLowerCase()
    .trim()
    .replace(/\s+/g, " ");
}
