export interface PengambilanLog {
  id: string;
  peserta_id: string;
  peserta_nama: string;
  peserta_bib: string;
  peserta_kategori: string;
  pendaftaran_melalui: string;
  petugas_id: string;
  petugas_nama: string;
  petugas_email: string;
  waktu_pengambilan: string; // ISO string or Firestore Timestamp representation
  status: "BERHASIL" | "DIBATALKAN";
  keterangan?: string;
  is_kolektif?: boolean;
  diambil_oleh?: string;
  nik_pengambil?: string;
  no_hp_pengambil?: string;
  alamat_pengambil?: string;
}
