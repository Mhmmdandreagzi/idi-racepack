"use client";

import React, { useState } from "react";
import { Peserta } from "@/types/peserta";
import { useAuth } from "@/lib/auth/AuthContext";
import {
  confirmCollectivePickup,
  ProxyPickupData,
  CollectivePickupResult,
} from "@/lib/services/pickupService";
import { queryPesertaFromFirestore } from "@/lib/services/pesertaQueryService";
import {
  X,
  Users,
  Search,
  Plus,
  Trash2,
  AlertTriangle,
  Loader2,
  CheckCircle2,
  Phone,
  MapPin,
  CreditCard,
  User,
  Shirt,
} from "lucide-react";

interface CollectivePickupModalProps {
  onClose: () => void;
  onSuccess: (result: CollectivePickupResult) => void;
}

export default function CollectivePickupModal({
  onClose,
  onSuccess,
}: CollectivePickupModalProps) {
  const { user } = useAuth();

  // Form states
  const [namaPengambil, setNamaPengambil] = useState("");
  const [nikPengambil, setNikPengambil] = useState("");
  const [noHpPengambil, setNoHpPengambil] = useState("");
  const [alamatPengambil, setAlamatPengambil] = useState("");

  // Selected participants list
  const [selectedList, setSelectedList] = useState<Peserta[]>([]);

  // Search participants inside modal
  const [searchModalQuery, setSearchModalQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<Peserta[]>([]);
  const [hasSearched, setHasSearched] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);

  // Submit states
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Handle participant lookup
  const handleSearchPeserta = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const query = searchModalQuery.trim();
    if (!query) {
      setSearchError("Harap masukkan nama, nomor BIB, NIK, atau no HP peserta.");
      return;
    }

    try {
      setIsSearching(true);
      setSearchError(null);
      setHasSearched(true);

      const data = await queryPesertaFromFirestore({
        searchQuery: query,
        filters: { status: "belum", kategori: "all", sumber: "all" },
      });

      // Filter out those already selected or already taken
      setSearchResults(data.filter((p) => !p.status_pengambilan));
    } catch (err: any) {
      console.error("Lookup error:", err);
      setSearchError(err.message || "Gagal mencari data peserta.");
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  // Add participant to queue
  const handleAddPeserta = (peserta: Peserta) => {
    if (selectedList.some((p) => p.id === peserta.id)) return;
    setSelectedList((prev) => [...prev, peserta]);
    setFormError(null);
  };

  // Remove participant from queue
  const handleRemovePeserta = (id: string) => {
    setSelectedList((prev) => prev.filter((p) => p.id !== id));
  };

  // Submit collective pickup
  const handleSubmit = async () => {
    if (isSubmitting) return;

    if (!user) {
      setFormError("Anda harus login untuk memproses serah terima racepack.");
      return;
    }

    if (!namaPengambil.trim()) {
      setFormError("Nama perwakilan / yang mengambilkan wajib diisi.");
      return;
    }

    if (!noHpPengambil.trim()) {
      setFormError("Nomor telepon / WhatsApp perwakilan wajib diisi.");
      return;
    }

    if (!alamatPengambil.trim()) {
      setFormError("Alamat perwakilan wajib diisi.");
      return;
    }

    if (selectedList.length === 0) {
      setFormError("Pilih minimal 1 peserta untuk diambilkan racepacknya.");
      return;
    }

    setIsSubmitting(true);
    setFormError(null);

    const proxyData: ProxyPickupData = {
      nama: namaPengambil.trim(),
      nik: nikPengambil.trim() || undefined,
      noHp: noHpPengambil.trim(),
      alamat: alamatPengambil.trim(),
    };

    try {
      const result = await confirmCollectivePickup(selectedList, proxyData, user);
      onSuccess(result);
    } catch (err: any) {
      console.error("Collective pickup error:", err);
      setFormError(err.message || "Gagal memproses pengambilan kolektif.");
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-[#111111]/80 backdrop-blur-sm animate-in fade-in duration-150">
      <div
        className="relative w-full max-w-2xl bg-[#FAF5EA] border-2 border-[#111111] rounded-2xl shadow-2xl overflow-hidden text-[#111111] max-h-[92vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b-2 border-[#111111] bg-[#111111] text-[#F3E8D2]">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-[#D71920] text-white flex items-center justify-center shrink-0">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] uppercase tracking-wider text-[#D4B84C] font-bold">
                SURAT KUASA / PERWAKILAN
              </span>
              <h2 className="font-display text-xl sm:text-2xl font-normal leading-tight text-white mt-0.5">
                PENGAMBILAN KOLEKTIF (DIWAKILKAN)
              </h2>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={isSubmitting}
            className="p-1.5 text-[#F3E8D2]/70 hover:text-white rounded-lg hover:bg-white/10 transition disabled:opacity-50"
            title="Tutup Modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-5 bg-[#FAF5EA]">
          {/* Error Banner */}
          {formError && (
            <div className="p-3.5 rounded-xl bg-[#FAF5EA] border-2 border-[#D71920] text-[#D71920] text-xs font-bold flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{formError}</span>
            </div>
          )}

          {/* Section 1: Data Pengambil */}
          <div className="bg-[#F3E8D2] border border-[#D8CDB8] rounded-xl p-4 space-y-3">
            <div className="flex items-center justify-between border-b border-[#D8CDB8] pb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-[#111111] flex items-center gap-1.5">
                <User className="w-4 h-4 text-[#D71920]" />
                1. Identitas Perwakilan / Pengambil
              </span>
              <span className="text-[10px] text-[#D71920] font-bold">* Wajib Diisi</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Nama Pengambil */}
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-[#111111]/80 block">
                  Nama Lengkap Pengambil <span className="text-[#D71920]">*</span>
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-[#111111]/40 absolute left-3 top-3 pointer-events-none" />
                  <input
                    type="text"
                    value={namaPengambil}
                    onChange={(e) => setNamaPengambil(e.target.value)}
                    placeholder="Nama perwakilan / koordinator"
                    className="w-full pl-9 pr-3 py-2 rounded-lg bg-[#FAF5EA] border border-[#111111] text-xs text-[#111111] font-medium focus:outline-none focus:ring-2 focus:ring-[#D71920]"
                    required
                  />
                </div>
              </div>

              {/* NIK Pengambil */}
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-[#111111]/80 block">
                  Nomor Identitas / NIK <span className="text-[#111111]/50 font-normal">(Opsional)</span>
                </label>
                <div className="relative">
                  <CreditCard className="w-4 h-4 text-[#111111]/40 absolute left-3 top-3 pointer-events-none" />
                  <input
                    type="text"
                    value={nikPengambil}
                    onChange={(e) => setNikPengambil(e.target.value)}
                    placeholder="16 digit nomor KTP (jika ada)"
                    className="w-full pl-9 pr-3 py-2 rounded-lg bg-[#FAF5EA] border border-[#111111] text-xs text-[#111111] font-medium focus:outline-none focus:ring-2 focus:ring-[#D71920]"
                  />
                </div>
              </div>

              {/* No Telp Pengambil */}
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-[#111111]/80 block">
                  Nomor Telepon / WhatsApp <span className="text-[#D71920]">*</span>
                </label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-[#111111]/40 absolute left-3 top-3 pointer-events-none" />
                  <input
                    type="tel"
                    value={noHpPengambil}
                    onChange={(e) => setNoHpPengambil(e.target.value)}
                    placeholder="Contoh: 08123456789"
                    className="w-full pl-9 pr-3 py-2 rounded-lg bg-[#FAF5EA] border border-[#111111] text-xs text-[#111111] font-medium focus:outline-none focus:ring-2 focus:ring-[#D71920]"
                    required
                  />
                </div>
              </div>

              {/* Alamat Pengambil */}
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-[#111111]/80 block">
                  Alamat Lengkap Pengambil <span className="text-[#D71920]">*</span>
                </label>
                <div className="relative">
                  <MapPin className="w-4 h-4 text-[#111111]/40 absolute left-3 top-3 pointer-events-none" />
                  <input
                    type="text"
                    value={alamatPengambil}
                    onChange={(e) => setAlamatPengambil(e.target.value)}
                    placeholder="Domisili / alamat perwakilan"
                    className="w-full pl-9 pr-3 py-2 rounded-lg bg-[#FAF5EA] border border-[#111111] text-xs text-[#111111] font-medium focus:outline-none focus:ring-2 focus:ring-[#D71920]"
                    required
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Section 2: Cari & Tambah Peserta */}
          <div className="bg-[#F3E8D2] border border-[#D8CDB8] rounded-xl p-4 space-y-3">
            <span className="text-xs font-bold uppercase tracking-wider text-[#111111] flex items-center gap-1.5 border-b border-[#D8CDB8] pb-2">
              <Search className="w-4 h-4 text-[#26734D]" />
              2. Cari Peserta yang Mau Diambilkan
            </span>

            {/* Inline search form */}
            <form onSubmit={handleSearchPeserta} className="flex gap-2">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-[#111111]/40 absolute left-3 top-2.5 pointer-events-none" />
                <input
                  type="text"
                  value={searchModalQuery}
                  onChange={(e) => setSearchModalQuery(e.target.value)}
                  placeholder="Ketik BIB, Nama, NIK, atau No HP..."
                  className="w-full pl-9 pr-3 py-2 rounded-lg bg-[#FAF5EA] border border-[#111111] text-xs text-[#111111] font-medium focus:outline-none focus:ring-2 focus:ring-[#26734D]"
                />
              </div>
              <button
                type="submit"
                disabled={isSearching}
                className="px-4 py-2 rounded-lg bg-[#111111] hover:bg-[#333333] text-[#F3E8D2] text-xs font-bold uppercase transition flex items-center gap-1.5 disabled:opacity-50"
              >
                {isSearching ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-[#D71920]" />
                ) : (
                  <Search className="w-3.5 h-3.5" />
                )}
                <span>Cari</span>
              </button>
            </form>

            {/* Search error */}
            {searchError && (
              <p className="text-[11px] text-[#D71920] font-bold">{searchError}</p>
            )}

            {/* Search Results Dropdown / Preview */}
            {hasSearched && (
              <div className="space-y-1.5 pt-1">
                <span className="text-[10px] uppercase font-bold text-[#111111]/60">
                  Hasil Pencarian ({searchResults.length} peserta belum diambil):
                </span>

                {searchResults.length === 0 ? (
                  <div className="p-3 text-center bg-[#FAF5EA] rounded-lg border border-dashed border-[#D8CDB8] text-xs text-[#111111]/60">
                    Tidak ditemukan peserta belum diambil dengan kata kunci tersebut.
                  </div>
                ) : (
                  <div className="max-h-44 overflow-y-auto space-y-1.5 pr-1">
                    {searchResults.map((p) => {
                      const isAlreadyAdded = selectedList.some((item) => item.id === p.id);
                      return (
                        <div
                          key={p.id}
                          className="flex items-center justify-between p-2.5 rounded-lg bg-[#FAF5EA] border border-[#D8CDB8] text-xs hover:border-[#111111] transition"
                        >
                          <div className="min-w-0 flex-1 pr-2">
                            <div className="flex items-center gap-2">
                              <span className="font-display text-base text-[#111111] truncate">
                                {p.nama}
                              </span>
                              <span className="px-1.5 py-0.5 rounded bg-[#111111] text-[#D4B84C] text-[10px] font-mono font-bold shrink-0">
                                BIB: {p.bib || "NO BIB"}
                              </span>
                            </div>
                            <div className="text-[11px] text-[#111111]/70 flex items-center gap-2 mt-0.5">
                              <span className="text-[#26734D] font-bold">{p.kategori}</span>
                              <span>•</span>
                              <span>Jersey: <strong>{p.ukuran_jersey || "-"}</strong></span>
                              <span>•</span>
                              <span className="truncate">{p.pendaftaran_melalui}</span>
                            </div>
                          </div>

                          <button
                            type="button"
                            onClick={() => handleAddPeserta(p)}
                            disabled={isAlreadyAdded}
                            className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase flex items-center gap-1 transition shrink-0 ${
                              isAlreadyAdded
                                ? "bg-[#26734D]/15 text-[#26734D] cursor-not-allowed border border-[#26734D]"
                                : "bg-[#26734D] hover:bg-[#1f5c3e] text-white shadow-sm"
                            }`}
                          >
                            {isAlreadyAdded ? (
                              <>
                                <CheckCircle2 className="w-3.5 h-3.5" />
                                <span>Sudah Masuk</span>
                              </>
                            ) : (
                              <>
                                <Plus className="w-3.5 h-3.5" />
                                <span>+ Tambah</span>
                              </>
                            )}
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Section 3: Daftar Peserta Terpilih */}
          <div className="bg-[#FAF5EA] border-2 border-[#111111] rounded-xl p-4 space-y-3">
            <div className="flex items-center justify-between border-b border-[#D8CDB8] pb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-[#111111] flex items-center gap-1.5">
                <Users className="w-4 h-4 text-[#D71920]" />
                3. Daftar Peserta yang Mau Diambilkan
              </span>
              <span className="px-2 py-0.5 rounded-full bg-[#111111] text-[#D4B84C] text-xs font-bold font-mono">
                {selectedList.length} Peserta
              </span>
            </div>

            {selectedList.length === 0 ? (
              <div className="py-6 text-center text-xs text-[#111111]/60 space-y-1">
                <Users className="w-8 h-8 text-[#111111]/30 mx-auto" />
                <p className="font-bold text-[#111111]/80">Belum ada peserta di daftar pengambilan.</p>
                <p>Gunakan kolom pencarian di atas untuk mencari dan menambahkan peserta.</p>
              </div>
            ) : (
              <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                {selectedList.map((p, idx) => (
                  <div
                    key={p.id}
                    className="flex items-center justify-between p-2.5 rounded-lg bg-[#F3E8D2] border border-[#D8CDB8] text-xs"
                  >
                    <div className="flex items-center gap-2.5 min-w-0 flex-1 pr-2">
                      <span className="w-5 h-5 rounded-full bg-[#111111] text-[#FAF5EA] text-[10px] font-bold flex items-center justify-center shrink-0">
                        {idx + 1}
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-bold text-sm text-[#111111]">{p.nama}</span>
                          <span className="px-1.5 py-0.5 rounded bg-[#FAF5EA] border border-[#111111] text-[10px] font-mono font-bold text-[#111111]">
                            BIB: {p.bib || "NO BIB"}
                          </span>
                        </div>
                        <div className="text-[11px] text-[#111111]/70 flex items-center gap-2 mt-0.5">
                          <span className="text-[#26734D] font-bold">{p.kategori}</span>
                          <span>•</span>
                          <span className="flex items-center gap-1 font-semibold text-[#111111]">
                            <Shirt className="w-3 h-3 text-[#D4B84C]" /> Size {p.ukuran_jersey || "-"}
                          </span>
                          <span>•</span>
                          <span className="text-[#111111]/60 truncate">{p.pendaftaran_melalui}</span>
                        </div>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleRemovePeserta(p.id)}
                      className="p-1.5 text-[#D71920] hover:bg-[#FAF5EA] rounded-lg transition shrink-0"
                      title="Hapus dari daftar"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 sm:p-5 border-t-2 border-[#111111] bg-[#E6D8BE] flex items-center justify-between gap-3">
          <div className="text-xs">
            <span className="text-[10px] text-[#111111]/60 block uppercase font-bold">
              Total Racepack:
            </span>
            <span className="font-display text-2xl font-normal text-[#111111] leading-none">
              {selectedList.length} Paket
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-3 rounded-lg border-2 border-[#111111] text-xs font-bold uppercase hover:bg-[#FAF5EA] transition disabled:opacity-50"
            >
              Batal
            </button>

            <button
              type="button"
              onClick={handleSubmit}
              disabled={isSubmitting || selectedList.length === 0}
              className="px-5 py-3 rounded-lg bg-[#D71920] hover:bg-[#b5141a] active:bg-[#961015] text-white font-bold text-xs uppercase tracking-wider transition duration-150 flex items-center gap-2 shadow-sm disabled:opacity-50 disabled:pointer-events-none"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>MEMPROSES...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>KONFIRMASI AMBIL {selectedList.length} RACEPACK</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
