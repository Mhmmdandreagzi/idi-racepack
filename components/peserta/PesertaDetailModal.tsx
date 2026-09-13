"use client";

import React, { useState } from "react";
import { Peserta } from "@/types/peserta";
import { useAuth } from "@/lib/auth/AuthContext";
import { confirmRacepackPickup, resetRacepackPickup } from "@/lib/services/pickupService";
import {
  X,
  CheckCircle2,
  AlertTriangle,
  Loader2,
  Phone,
  CreditCard,
  Shirt,
  Tag,
  MapPin,
  RotateCcw,
  FileText,
  ExternalLink,
  Mail,
} from "lucide-react";
import DocumentCapture from "@/components/documents/DocumentCapture";
import { uploadPesertaDocument, uploadPesertaDocuments } from "@/lib/services/documentService";
import { useToast } from "@/context/ToastContext";
import TypedConfirmModal from "@/components/ui/TypedConfirmModal";

interface PesertaDetailModalProps {
  peserta: Peserta | null;
  onClose: () => void;
  onPickupSuccess: (updated: Peserta) => void;
}

export default function PesertaDetailModal({
  peserta,
  onClose,
  onPickupSuccess,
}: PesertaDetailModalProps) {
  const { user, role } = useAuth();
  const { toast } = useToast();
  const [isProcessing, setIsProcessing] = useState(false);
  const [isResetConfirmOpen, setIsResetConfirmOpen] = useState(false);

  // Document upload / camera photo states
  const [buktiBayarFile, setBuktiBayarFile] = useState<File | null>(null);
  const [isDiwakilkan, setIsDiwakilkan] = useState(Boolean(peserta?.is_kolektif || peserta?.surat_kuasa_path));
  const [suratKuasaFiles, setSuratKuasaFiles] = useState<File[]>([]);
  const [namaPengambil, setNamaPengambil] = useState(peserta?.diambil_oleh || "");
  const [noHpPengambil, setNoHpPengambil] = useState(peserta?.no_hp_pengambil || "");

  if (!peserta) return null;

  const isAlreadyPicked = peserta.status_pengambilan;

  const handlePickup = async () => {
    if (isProcessing) return; // Prevent double trigger
    if (!user) {
      toast.error("Anda harus login untuk melakukan konfirmasi pengambilan.");
      return;
    }

    // Validation: Bukti Bayar is required
    const hasBuktiBayar = Boolean(peserta.bukti_bayar_path) || Boolean(buktiBayarFile);
    if (!hasBuktiBayar) {
      toast.error("Harap ambil foto atau unggah file bukti pembayaran sebelum mengambil racepack.");
      return;
    }

    // Validation: Surat Kuasa if diwakilkan
    if (isDiwakilkan) {
      const hasSuratKuasa = Boolean(peserta.surat_kuasa_path) || suratKuasaFiles.length > 0;
      if (!hasSuratKuasa) {
        toast.error("Harap ambil foto atau unggah file surat kuasa perwakilan (bisa banyak foto).");
        return;
      }
      if (!namaPengambil.trim()) {
        toast.error("Nama perwakilan yang mengambilkan wajib diisi.");
        return;
      }
    }

    setIsProcessing(true);

    try {
      let updatedBuktiPath = peserta.bukti_bayar_path;
      let updatedKuasaPath = peserta.surat_kuasa_path;

      // 1. Upload Bukti Bayar if new file selected or photographed
      if (buktiBayarFile) {
        const uploadRes = await uploadPesertaDocument(peserta.id, "bukti_bayar", buktiBayarFile);
        updatedBuktiPath = uploadRes.metadata?.filePath || updatedBuktiPath;
      }

      // 2. Upload Surat Kuasa if diwakilkan & new files selected or photographed
      if (isDiwakilkan && suratKuasaFiles.length > 0) {
        const uploadRes = await uploadPesertaDocuments(peserta.id, "surat_kuasa", suratKuasaFiles);
        updatedKuasaPath = uploadRes.metadata?.filePath || updatedKuasaPath;
      }

      // 3. Confirm atomic pickup transaction in MySQL
      const res = await confirmRacepackPickup(peserta, user);
      if (res.peserta) {
        toast.success(`Racepack untuk ${peserta.nama} berhasil diserahkan!`);
        onPickupSuccess({
          ...res.peserta,
          bukti_bayar_path: updatedBuktiPath,
          surat_kuasa_path: updatedKuasaPath,
          is_kolektif: isDiwakilkan,
          diambil_oleh: isDiwakilkan ? (namaPengambil.trim() || undefined) : undefined,
          no_hp_pengambil: isDiwakilkan ? (noHpPengambil.trim() || undefined) : undefined,
        });
      }
    } catch (err: any) {
      console.error("Pickup error:", err);
      toast.error(err.message || "Terjadi kesalahan saat menyimpan pengambilan.");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleExecuteReset = async () => {
    if (!user || (role !== "admin" && role !== "superadmin")) return;

    setIsProcessing(true);
    try {
      await resetRacepackPickup(peserta.id, user, "BATALKAN");
      toast.success("Status pengambilan berhasil dibatalkan.");
      onPickupSuccess({
        ...peserta,
        status_pengambilan: false,
        waktu_pengambilan: null,
        petugas_id: null,
        petugas_nama: null,
      });
      setIsResetConfirmOpen(false);
      onClose();
    } catch (err: any) {
      console.error("Reset error:", err);
      toast.error(err.message || "Gagal membatalkan status.");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#111111]/80 backdrop-blur-sm animate-in fade-in duration-150">
      <div
        className="relative w-full max-w-lg bg-[#FAF5EA] border-2 border-[#111111] rounded-2xl shadow-2xl overflow-hidden text-[#111111] max-h-[92vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b-2 border-[#111111] bg-[#111111] text-[#F3E8D2]">
          <div>
            <span className="text-[10px] uppercase tracking-wider text-[#D4B84C] font-bold">
              VERIFIKASI MEJA REGISTRASI
            </span>
            <h2 className="font-display text-2xl font-normal leading-tight text-white mt-0.5">
              <span>{peserta.nama}</span>
              {peserta.nama_bib && peserta.nama_bib.trim() ? (
                <span className="text-[#D4B84C] font-bold ml-2 px-2 py-0.5 rounded-lg bg-[#D4B84C]/15 border border-[#D4B84C]/30 text-lg sm:text-xl tracking-wide inline-block">
                  ({peserta.nama_bib.trim()})
                </span>
              ) : null}
            </h2>
          </div>
          <button
            onClick={onClose}
            disabled={isProcessing}
            className="p-1.5 text-[#F3E8D2]/70 hover:text-white rounded-lg hover:bg-white/10 transition disabled:opacity-50"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-4 bg-[#FAF5EA]">
          {/* Status Alert Banner */}
          {isAlreadyPicked ? (
            <div className="p-4 rounded-xl bg-[#26734D]/15 border-2 border-[#26734D] flex items-start gap-3 text-[#111111]">
              <CheckCircle2 className="w-5 h-5 text-[#26734D] shrink-0 mt-0.5" />
              <div className="text-xs">
                <p className="font-bold text-sm text-[#26734D] uppercase">
                  ✓ RACEPACK SUDAH DIAMBIL
                </p>
                <p className="mt-1 font-medium">
                  Petugas penyerah: <strong className="text-[#111111] font-bold">{peserta.petugas_nama || "Petugas"}</strong>
                </p>
                {peserta.waktu_pengambilan && (
                  <p className="text-[#111111]/70 mt-0.5">
                    Waktu: {new Date(peserta.waktu_pengambilan).toLocaleString("id-ID")} WIB
                  </p>
                )}
              </div>
            </div>
          ) : (
            <div className="p-3.5 rounded-xl bg-[#E6D8BE] border-2 border-[#111111] flex items-center gap-2.5 text-[#111111] text-xs font-medium">
              <AlertTriangle className="w-4 h-4 text-[#D71920] shrink-0" />
              <span>
                Status: <strong className="font-bold text-[#D71920]">⚠ BELUM DIAMBIL</strong>. Pastikan identitas & ukuran jersey peserta sesuai sebelum serah terima.
              </span>
            </div>
          )}


          {/* Grid Info Participant (style.md Section 29) */}
          <div className="grid grid-cols-2 gap-3">
            {/* BIB */}
            <div className="p-3.5 rounded-xl bg-[#F3E8D2] border border-[#D8CDB8]">
              <span className="text-[10px] uppercase font-bold tracking-wider text-[#111111]/60 block">
                NOMOR BIB {peserta.nama_bib ? `• ${peserta.nama_bib}` : ""}
              </span>
              <span className="font-display text-3xl font-normal text-[#111111] leading-none block mt-1">
                {peserta.bib || "NO BIB"}
              </span>
            </div>

            {/* Kategori */}
            <div className="p-3.5 rounded-xl bg-[#F3E8D2] border border-[#D8CDB8]">
              <span className="text-[10px] uppercase font-bold tracking-wider text-[#111111]/60 block">
                KATEGORI LARI
              </span>
              <span className="font-display text-2xl font-normal text-[#26734D] leading-none block mt-1">
                {peserta.kategori || "5K UMUM"}
              </span>
            </div>

            {/* Ukuran Jersey */}
            <div className="p-3.5 rounded-xl bg-[#F3E8D2] border border-[#D8CDB8] flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-[#111111] text-[#D4B84C] flex items-center justify-center shrink-0">
                <Shirt className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold tracking-wider text-[#111111]/60 block">
                  JERSEY
                </span>
                <span className="font-display text-xl font-normal text-[#111111] leading-none">
                  SIZE {peserta.ukuran_jersey || "-"}
                </span>
              </div>
            </div>

            {/* Jenis Kelamin */}
            <div className="p-3.5 rounded-xl bg-[#F3E8D2] border border-[#D8CDB8] flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-[#111111] text-white flex items-center justify-center shrink-0">
                <Tag className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold tracking-wider text-[#111111]/60 block">
                  GENDER
                </span>
                <span className="font-display text-lg font-normal text-[#111111] leading-none">
                  {peserta.jenis_kelamin === "L"
                    ? "LAKI-LAKI"
                    : peserta.jenis_kelamin === "P"
                    ? "PEREMPUAN"
                    : "-"}
                </span>
              </div>
            </div>
          </div>

          {/* Verification Fields */}
          <div className="space-y-2 text-xs">
            {/* NIK */}
            <div className="flex items-center justify-between p-2.5 rounded-lg bg-[#F3E8D2] border border-[#D8CDB8]">
              <div className="flex items-center gap-2 text-[#111111]/70 font-semibold">
                <CreditCard className="w-4 h-4 text-[#111111]" />
                <span>NIK</span>
              </div>
              <span className="font-mono font-bold text-[#111111]">
                {peserta.nik || "-"}
              </span>
            </div>

            {/* No HP */}
            <div className="flex items-center justify-between p-2.5 rounded-lg bg-[#F3E8D2] border border-[#D8CDB8]">
              <div className="flex items-center gap-2 text-[#111111]/70 font-semibold">
                <Phone className="w-4 h-4 text-[#111111]" />
                <span>Nomor HP (Telp 1)</span>
              </div>
              <span className="font-mono font-bold text-[#111111]">
                {peserta.no_telp_1 || peserta.no_hp || "-"}
              </span>
            </div>

            {/* No Telp 2 (Jika ada) */}
            {peserta.no_telp_2 && (
              <div className="flex items-center justify-between p-2.5 rounded-lg bg-[#F3E8D2] border border-[#D8CDB8]">
                <div className="flex items-center gap-2 text-[#111111]/70 font-semibold">
                  <Phone className="w-4 h-4 text-[#111111]" />
                  <span>No Telp 2</span>
                </div>
                <span className="font-mono font-bold text-[#111111]">
                  {peserta.no_telp_2}
                </span>
              </div>
            )}

            {/* Email (Jika ada) */}
            {peserta.email && (
              <div className="flex items-center justify-between p-2.5 rounded-lg bg-[#F3E8D2] border border-[#D8CDB8]">
                <div className="flex items-center gap-2 text-[#111111]/70 font-semibold">
                  <Mail className="w-4 h-4 text-[#111111]" />
                  <span>Email</span>
                </div>
                <span className="font-mono font-bold text-[#111111] text-[11px]">
                  {peserta.email}
                </span>
              </div>
            )}

            {/* Sumber Pendaftaran */}
            <div className="flex items-center justify-between p-2.5 rounded-lg bg-[#F3E8D2] border border-[#D8CDB8]">
              <div className="flex items-center gap-2 text-[#111111]/70 font-semibold">
                <Tag className="w-4 h-4 text-[#111111]" />
                <span>Pendaftaran Melalui</span>
              </div>
              <span className="font-bold text-[#26734D] uppercase">
                {peserta.pendaftaran_melalui || peserta.daftar_melalui}
              </span>
            </div>

            {/* Kode Registrasi (Jika ada) */}
            {(peserta.kode_1 || peserta.kode_2) && (
              <div className="flex items-center justify-between p-2.5 rounded-lg bg-[#F3E8D2] border border-[#D8CDB8]">
                <div className="flex items-center gap-2 text-[#111111]/70 font-semibold">
                  <Tag className="w-4 h-4 text-[#111111]" />
                  <span>Kode Booking</span>
                </div>
                <span className="font-mono text-[10px] font-bold text-[#111111]">
                  {peserta.kode_1 || peserta.kode_2}
                </span>
              </div>
            )}

            {/* Alamat */}
            {peserta.alamat && (
              <div className="p-2.5 rounded-lg bg-[#F3E8D2] border border-[#D8CDB8] flex items-start gap-2 text-[#111111]/70">
                <MapPin className="w-4 h-4 text-[#D71920] shrink-0 mt-0.5" />
                <span>{peserta.alamat}</span>
              </div>
            )}

            {/* Dokumen Verifikasi: Bukti Bayar & Surat Kuasa */}
            {isAlreadyPicked ? (
              <div className="space-y-2">
                {/* Bukti Pembayaran Read-only */}
                <div className="flex items-center justify-between p-2.5 rounded-lg bg-[#F3E8D2] border border-[#D8CDB8]">
                  <div className="flex items-center gap-2 text-[#111111]/70 font-semibold">
                    <FileText className="w-4 h-4 text-[#111111]" />
                    <span>Bukti Pembayaran</span>
                  </div>
                  {peserta.bukti_bayar_path ? (
                    <a
                      href={`/api/documents/${peserta.id}/bukti_bayar`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-xs font-bold text-[#26734D] hover:underline"
                    >
                      <span>Lihat Dokumen</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  ) : (
                    <span className="text-[11px] text-[#111111]/50 font-medium">Tersedia via Sistem</span>
                  )}
                </div>

                {/* Surat Kuasa Read-only */}
                {(peserta.is_kolektif || peserta.surat_kuasa_path) && (
                  <div className="flex items-center justify-between p-2.5 rounded-lg bg-[#F3E8D2] border border-[#D8CDB8]">
                    <div className="flex items-center gap-2 text-[#111111]/70 font-semibold">
                      <FileText className="w-4 h-4 text-[#D71920]" />
                      <span>Surat Kuasa</span>
                    </div>
                    {peserta.surat_kuasa_path ? (
                      <a
                        href={`/api/documents/${peserta.id}/surat_kuasa`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-xs font-bold text-[#26734D] hover:underline"
                      >
                        <span>Lihat Dokumen</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    ) : (
                      <span className="text-[11px] text-[#D71920] font-semibold">Verifikasi Meja Kolektif</span>
                    )}
                  </div>
                )}
              </div>
            ) : (
              /* Before pickup: Interactive Document Capture (Camera / File) */
              <div className="pt-2 border-t border-[#D8CDB8] space-y-3">
                <span className="text-xs font-bold uppercase tracking-wider text-[#111111] flex items-center gap-1.5">
                  <FileText className="w-4 h-4 text-[#D71920]" />
                  Dokumen Wajib Sebelum Serah Terima
                </span>

                {/* 1. Bukti Pembayaran */}
                <DocumentCapture
                  label="Bukti Pembayaran"
                  category="bukti_bayar"
                  pesertaId={peserta.id}
                  existingPath={peserta.bukti_bayar_path}
                  existingName={peserta.bukti_bayar_original_name}
                  selectedFile={buktiBayarFile}
                  onFileChange={setBuktiBayarFile}
                  required={true}
                  disabled={isProcessing}
                  helperText="Ambil foto struk / transfer bukti pembayaran atau unggah file dokumen."
                />

                {/* 2. Checkbox Pengambilan Diwakilkan */}
                <div className="p-3.5 rounded-xl bg-[#F3E8D2] border border-[#D8CDB8] space-y-3">
                  <label className="flex items-center gap-2 text-xs font-bold text-[#111111] cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={isDiwakilkan}
                      onChange={(e) => setIsDiwakilkan(e.target.checked)}
                      className="w-4 h-4 rounded text-[#D71920] focus:ring-[#D71920] border-[#111111]"
                      disabled={isProcessing}
                    />
                    <span>Pengambilan Diwakilkan Orang Lain? (Lampirkan Surat Kuasa)</span>
                  </label>

                  {isDiwakilkan && (
                    <div className="space-y-3 pt-2.5 border-t border-[#D8CDB8]">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-[#111111]/70 block uppercase">
                            Nama Yang Mengambilkan <span className="text-[#D71920]">*</span>
                          </label>
                          <input
                            type="text"
                            value={namaPengambil}
                            onChange={(e) => setNamaPengambil(e.target.value)}
                            placeholder="Nama perwakilan"
                            className="w-full px-3 py-2 rounded-lg bg-[#FAF5EA] border border-[#111111] text-xs text-[#111111] font-medium focus:outline-none focus:ring-1 focus:ring-[#D71920]"
                            disabled={isProcessing}
                            required
                          />
                        </div>

                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-[#111111]/70 block uppercase">
                            No HP / WhatsApp Perwakilan
                          </label>
                          <input
                            type="tel"
                            value={noHpPengambil}
                            onChange={(e) => setNoHpPengambil(e.target.value)}
                            placeholder="Contoh: 08123456789"
                            className="w-full px-3 py-2 rounded-lg bg-[#FAF5EA] border border-[#111111] text-xs text-[#111111] font-medium focus:outline-none focus:ring-1 focus:ring-[#D71920]"
                            disabled={isProcessing}
                          />
                        </div>
                      </div>

                      <DocumentCapture
                        label="Surat Kuasa Perwakilan"
                        category="surat_kuasa"
                        pesertaId={peserta.id}
                        existingPath={peserta.surat_kuasa_path}
                        existingName={peserta.surat_kuasa_original_name}
                        allowMultiple={true}
                        selectedFiles={suratKuasaFiles}
                        onFilesChange={setSuratKuasaFiles}
                        required={true}
                        disabled={isProcessing}
                        helperText="Bisa ambil banyak foto (halaman surat kuasa, KTP penerima/pemberi kuasa) atau pilih berkas."
                      />
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Modal Footer / Action Button (style.md Section 10) */}
        <div className="p-5 border-t-2 border-[#111111] bg-[#E6D8BE]/70 flex items-center gap-3">
          {/* Admin / Super Admin Reset Button */}
          {isAlreadyPicked && (role === "admin" || role === "superadmin") && (
            <button
              onClick={() => setIsResetConfirmOpen(true)}
              disabled={isProcessing}
              className="px-4 py-3 rounded-lg border-2 border-[#D71920] text-[#D71920] hover:bg-[#FAF5EA] text-xs font-bold uppercase flex items-center gap-1.5 transition disabled:opacity-50 cursor-pointer"
              title="Batalkan pengambilan"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Reset Status</span>
            </button>
          )}

          {/* Primary Action Button (style.md: background: #D71920, color: #FFFFFF) */}
          {!isAlreadyPicked ? (
            <button
              onClick={handlePickup}
              disabled={isProcessing}
              className="flex-1 py-3.5 px-4 rounded-lg bg-[#D71920] hover:bg-[#b5141a] active:bg-[#961015] text-white font-bold text-sm tracking-wider uppercase transition duration-150 flex items-center justify-center gap-2 shadow-sm disabled:opacity-50 disabled:pointer-events-none cursor-pointer"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>MEMPROSES TRANSAKSI...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-5 h-5" />
                  <span>AMBIL RACEPACK</span>
                </>
              )}
            </button>
          ) : (
            <button
              onClick={onClose}
              className="flex-1 py-3 px-4 rounded-lg bg-[#111111] hover:bg-[#333333] text-[#F3E8D2] font-bold text-xs uppercase tracking-wider transition cursor-pointer"
            >
              Tutup
            </button>
          )}
        </div>
      </div>

      {/* Typed Confirmation Modal for Reset */}
      <TypedConfirmModal
        isOpen={isResetConfirmOpen}
        onClose={() => setIsResetConfirmOpen(false)}
        onConfirm={handleExecuteReset}
        title="Batalkan Pengambilan Racepack"
        description={`Status pengambilan untuk peserta "${peserta.nama}" (BIB: ${peserta.bib || "-"}) akan diubah kembali menjadi BELUM DIAMBIL.`}
        expectedKeyword="BATALKAN"
        confirmButtonLabel="Ya, Batalkan Pengambilan"
        isLoading={isProcessing}
      />
    </div>
  );
}
