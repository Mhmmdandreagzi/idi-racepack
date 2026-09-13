"use client";

import React, { useState } from "react";
import { Peserta } from "@/types/peserta";
import { useAuth } from "@/lib/auth/AuthContext";
import {
  confirmCollectivePickup,
  ProxyPickupData,
  CollectivePickupResult,
} from "@/lib/services/pickupService";
import { queryPeserta } from "@/lib/services/pesertaQueryService";
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
  Camera,
  Upload,
  ExternalLink,
  FileText,
} from "lucide-react";
import DocumentCapture from "@/components/documents/DocumentCapture";
import { uploadPesertaDocument, uploadPesertaDocuments } from "@/lib/services/documentService";
import { useToast } from "@/context/ToastContext";

interface CollectivePickupModalProps {
  onClose: () => void;
  onSuccess: (result: CollectivePickupResult) => void;
}

export default function CollectivePickupModal({
  onClose,
  onSuccess,
}: CollectivePickupModalProps) {
  const { user } = useAuth();
  const { toast } = useToast();

  // Form states
  const [namaPengambil, setNamaPengambil] = useState("");
  const [nikPengambil, setNikPengambil] = useState("");
  const [noHpPengambil, setNoHpPengambil] = useState("");
  const [alamatPengambil, setAlamatPengambil] = useState("");

  // Document states
  const [collectiveSuratKuasaFiles, setCollectiveSuratKuasaFiles] = useState<File[]>([]);
  const [participantBuktiFiles, setParticipantBuktiFiles] = useState<{ [pesertaId: string]: File }>({});

  // Selected participants list
  const [selectedList, setSelectedList] = useState<Peserta[]>([]);

  // Search participants inside modal
  const [searchModalQuery, setSearchModalQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<Peserta[]>([]);
  const [hasSearched, setHasSearched] = useState(false);

  // Submit states
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Handle participant lookup
  const handleSearchPeserta = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const query = searchModalQuery.trim();

    try {
      setIsSearching(true);
      setHasSearched(true);

      const data = await queryPeserta({
        searchQuery: query,
        filters: { status: "belum", kategori: "all", sumber: "all" },
      });

      // Filter out those already selected or already taken
      const available = data.filter((p) => !p.status_pengambilan);
      setSearchResults(available.slice(0, 50));
      if (available.length === 0) {
        toast.info("Tidak ada peserta belum diambil yang sesuai kata kunci.");
      }
    } catch (err: any) {
      console.error("Lookup error:", err);
      toast.error(err.message || "Gagal mencari data peserta.");
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  // Add participant to queue
  const handleAddPeserta = (peserta: Peserta) => {
    if (selectedList.some((p) => p.id === peserta.id)) return;
    setSelectedList((prev) => [...prev, peserta]);
    toast.success(`Peserta "${peserta.nama}" berhasil ditambahkan.`);
  };

  // Remove participant from queue
  const handleRemovePeserta = (id: string) => {
    setSelectedList((prev) => prev.filter((p) => p.id !== id));
    setParticipantBuktiFiles((prev) => {
      const copy = { ...prev };
      delete copy[id];
      return copy;
    });
  };

  const handleSetBukti = (pesertaId: string, file: File) => {
    setParticipantBuktiFiles((prev) => ({
      ...prev,
      [pesertaId]: file,
    }));
    toast.info(`Bukti bayar untuk peserta siap dilampirkan.`);
  };

  const handleRemoveBukti = (pesertaId: string) => {
    setParticipantBuktiFiles((prev) => {
      const copy = { ...prev };
      delete copy[pesertaId];
      return copy;
    });
  };

  // Submit collective pickup
  const handleSubmit = async () => {
    if (isSubmitting) return;

    if (!user) {
      toast.error("Anda harus login untuk memproses serah terima racepack.");
      return;
    }

    if (!namaPengambil.trim()) {
      toast.error("Nama perwakilan / yang mengambilkan wajib diisi.");
      return;
    }

    if (!noHpPengambil.trim()) {
      toast.error("Nomor telepon / WhatsApp perwakilan wajib diisi.");
      return;
    }

    if (!alamatPengambil.trim()) {
      toast.error("Alamat perwakilan wajib diisi.");
      return;
    }

    if (selectedList.length === 0) {
      toast.error("Pilih minimal 1 peserta untuk diambilkan racepacknya.");
      return;
    }

    // Validation: Surat Kuasa is required
    const hasCollectiveKuasa = collectiveSuratKuasaFiles.length > 0;
    if (!hasCollectiveKuasa) {
      const missingKuasa = selectedList.filter((p) => !p.surat_kuasa_path);
      if (missingKuasa.length > 0) {
        toast.error("Harap ambil foto atau unggah Surat Kuasa Kolektif perwakilan terlebih dahulu (bisa banyak foto).");
        return;
      }
    }

    // Validation: Bukti Bayar is required for each participant
    const missingBukti = selectedList.filter(
      (p) => !p.bukti_bayar_path && !participantBuktiFiles[p.id]
    );
    if (missingBukti.length > 0) {
      toast.error(
        `Harap ambil foto atau unggah Bukti Bayar untuk peserta: ${missingBukti.map((p) => p.nama).join(", ")}`
      );
      return;
    }

    setIsSubmitting(true);

    const proxyData: ProxyPickupData = {
      nama: namaPengambil.trim(),
      nik: nikPengambil.trim() || undefined,
      noHp: noHpPengambil.trim(),
      alamat: alamatPengambil.trim(),
    };

    try {
      // 1. Upload collective surat kuasa for all participants if provided
      if (collectiveSuratKuasaFiles.length > 0) {
        await uploadPesertaDocuments(
          selectedList.map((p) => p.id),
          "surat_kuasa",
          collectiveSuratKuasaFiles
        );
      }

      // 2. Upload individual bukti bayar files
      for (const p of selectedList) {
        const file = participantBuktiFiles[p.id];
        if (file) {
          await uploadPesertaDocument(p.id, "bukti_bayar", file);
        }
      }

      // 3. Confirm collective pickup in MySQL atomic transaction
      const result = await confirmCollectivePickup(selectedList, proxyData, user);
      toast.success(`Berhasil! ${selectedList.length} racepack telah diserahkan.`);
      onSuccess(result);
    } catch (err: any) {
      console.error("Collective pickup error:", err);
      toast.error(err.message || "Gagal memproses pengambilan kolektif.");
    } finally {
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

            {/* Surat Kuasa Kolektif Section */}
            <div className="pt-2 border-t border-[#D8CDB8]">
              <DocumentCapture
                label="Surat Kuasa Perwakilan Kolektif"
                category="surat_kuasa"
                allowMultiple={true}
                selectedFiles={collectiveSuratKuasaFiles}
                onFilesChange={setCollectiveSuratKuasaFiles}
                required={true}
                disabled={isSubmitting}
                helperText="Wajib: Bisa ambil banyak foto (halaman surat kuasa, KTP pengambil/pemberi kuasa) atau pilih berkas PDF/gambar."
              />
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
                                <span>{p.nama}</span>
                                {p.nama_bib && p.nama_bib.trim() ? (
                                  <span className="text-[#D71920] font-bold ml-1.5 px-1.5 py-0.5 rounded bg-[#D71920]/10 text-xs">
                                    ({p.nama_bib.trim()})
                                  </span>
                                ) : null}
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
                          <span className="font-bold text-sm text-[#111111]">
                            <span>{p.nama}</span>
                            {p.nama_bib && p.nama_bib.trim() ? (
                              <span className="text-[#D71920] font-bold ml-1.5 px-1.5 py-0.5 rounded bg-[#D71920]/10 text-xs">
                                ({p.nama_bib.trim()})
                              </span>
                            ) : null}
                          </span>
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

                        {/* Dokumen Bukti Bayar & Surat Kuasa Peserta */}
                        <div className="mt-2 pt-2 border-t border-[#D8CDB8] flex flex-wrap items-center gap-2 text-[11px]">
                          {/* Bukti Bayar */}
                          <div className="flex items-center gap-1.5 bg-[#FAF5EA] px-2.5 py-1 rounded-lg border border-[#D8CDB8]">
                            <span className="font-bold text-[#111111]/70">Bukti Bayar:</span>
                            {p.bukti_bayar_path ? (
                              <a
                                href={`/api/documents/${p.id}/bukti_bayar`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-[#26734D] font-bold hover:underline inline-flex items-center gap-0.5"
                              >
                                <span>✓ Di Sistem</span>
                                <ExternalLink className="w-2.5 h-2.5" />
                              </a>
                            ) : participantBuktiFiles[p.id] ? (
                              <div className="inline-flex items-center gap-1 text-[#26734D] font-bold">
                                <span>📸 {participantBuktiFiles[p.id].name.slice(0, 12)}...</span>
                                <button
                                  type="button"
                                  onClick={() => handleRemoveBukti(p.id)}
                                  className="text-[#D71920] hover:bg-[#E6D8BE] p-0.5 rounded"
                                  title="Hapus foto"
                                >
                                  <X className="w-3 h-3" />
                                </button>
                              </div>
                            ) : (
                              <div className="inline-flex items-center gap-1.5">
                                <label className="cursor-pointer text-[#D71920] font-bold hover:underline inline-flex items-center gap-0.5">
                                  <Camera className="w-3 h-3" />
                                  <span>Foto</span>
                                  <input
                                    type="file"
                                    accept="image/*"
                                    capture="environment"
                                    className="hidden"
                                    onChange={(e) => {
                                      const f = e.target.files?.[0];
                                      if (f) handleSetBukti(p.id, f);
                                    }}
                                  />
                                </label>
                                <span className="text-[#111111]/30">|</span>
                                <label className="cursor-pointer text-[#111111] font-bold hover:underline inline-flex items-center gap-0.5">
                                  <Upload className="w-3 h-3 text-[#111111]/60" />
                                  <span>Pilih</span>
                                  <input
                                    type="file"
                                    accept="image/jpeg,image/png,image/webp,application/pdf"
                                    className="hidden"
                                    onChange={(e) => {
                                      const f = e.target.files?.[0];
                                      if (f) handleSetBukti(p.id, f);
                                    }}
                                  />
                                </label>
                              </div>
                            )}
                          </div>

                          {/* Surat Kuasa Status */}
                          <div className="flex items-center gap-1.5 bg-[#FAF5EA] px-2.5 py-1 rounded-lg border border-[#D8CDB8]">
                            <span className="font-bold text-[#111111]/70">Surat Kuasa:</span>
                            {collectiveSuratKuasaFiles.length > 0 ? (
                              <span className="text-[#26734D] font-bold">✓ Kuasa Kolektif ({collectiveSuratKuasaFiles.length})</span>
                            ) : p.surat_kuasa_path ? (
                              <a
                                href={`/api/documents/${p.id}/surat_kuasa`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-[#26734D] font-bold hover:underline inline-flex items-center gap-0.5"
                              >
                                <span>✓ Di Sistem</span>
                                <ExternalLink className="w-2.5 h-2.5" />
                              </a>
                            ) : (
                              <span className="text-[#D71920] font-bold">Lampirkan di atas</span>
                            )}
                          </div>
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
