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
} from "lucide-react";

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
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!peserta) return null;

  const isAlreadyPicked = peserta.status_pengambilan;

  const handlePickup = async () => {
    if (isProcessing) return; // Prevent double trigger
    if (!user) {
      setErrorMsg("Anda harus login untuk melakukan konfirmasi pengambilan.");
      return;
    }

    setIsProcessing(true);
    setErrorMsg(null);

    try {
      const res = await confirmRacepackPickup(peserta, user);
      if (res.peserta) {
        onPickupSuccess(res.peserta);
      }
    } catch (err: any) {
      console.error("Pickup error:", err);
      setErrorMsg(err.message || "Terjadi kesalahan saat menyimpan pengambilan.");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReset = async () => {
    if (!user || role !== "admin") return;
    if (!confirm(`Batalkan status pengambilan racepack untuk "${peserta.nama}"?`)) return;

    setIsProcessing(true);
    setErrorMsg(null);
    try {
      await resetRacepackPickup(peserta.id, user);
      onPickupSuccess({
        ...peserta,
        status_pengambilan: false,
        waktu_pengambilan: null,
        petugas_id: null,
        petugas_nama: null,
      });
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || "Gagal membatalkan pengambilan.");
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
              {peserta.nama}
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

          {/* Error Message */}
          {errorMsg && (
            <div className="p-3.5 rounded-xl bg-[#FAF5EA] border-2 border-[#D71920] text-[#D71920] text-xs font-bold flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-[#D71920] shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Grid Info Participant (style.md Section 29) */}
          <div className="grid grid-cols-2 gap-3">
            {/* BIB */}
            <div className="p-3.5 rounded-xl bg-[#F3E8D2] border border-[#D8CDB8]">
              <span className="text-[10px] uppercase font-bold tracking-wider text-[#111111]/60 block">
                NOMOR BIB
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
                <span>Nomor HP</span>
              </div>
              <span className="font-mono font-bold text-[#111111]">
                {peserta.no_hp || "-"}
              </span>
            </div>

            {/* Sumber Pendaftaran */}
            <div className="flex items-center justify-between p-2.5 rounded-lg bg-[#F3E8D2] border border-[#D8CDB8]">
              <div className="flex items-center gap-2 text-[#111111]/70 font-semibold">
                <Tag className="w-4 h-4 text-[#111111]" />
                <span>Pendaftaran Melalui</span>
              </div>
              <span className="font-bold text-[#26734D] uppercase">
                {peserta.pendaftaran_melalui}
              </span>
            </div>

            {/* Alamat */}
            {peserta.alamat && (
              <div className="p-2.5 rounded-lg bg-[#F3E8D2] border border-[#D8CDB8] flex items-start gap-2 text-[#111111]/70">
                <MapPin className="w-4 h-4 text-[#D71920] shrink-0 mt-0.5" />
                <span>{peserta.alamat}</span>
              </div>
            )}
          </div>
        </div>

        {/* Modal Footer / Action Button (style.md Section 10) */}
        <div className="p-5 border-t-2 border-[#111111] bg-[#E6D8BE]/70 flex items-center gap-3">
          {/* Admin Reset Button */}
          {isAlreadyPicked && role === "admin" && (
            <button
              onClick={handleReset}
              disabled={isProcessing}
              className="px-4 py-3 rounded-lg border-2 border-[#D71920] text-[#D71920] hover:bg-[#FAF5EA] text-xs font-bold uppercase flex items-center gap-1.5 transition disabled:opacity-50"
              title="Batalkan pengambilan (Hanya Admin)"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Reset</span>
            </button>
          )}

          {/* Primary Action Button (style.md: background: #D71920, color: #FFFFFF) */}
          {!isAlreadyPicked ? (
            <button
              onClick={handlePickup}
              disabled={isProcessing}
              className="flex-1 py-3.5 px-4 rounded-lg bg-[#D71920] hover:bg-[#b5141a] active:bg-[#961015] text-white font-bold text-sm tracking-wider uppercase transition duration-150 flex items-center justify-center gap-2 shadow-sm disabled:opacity-50 disabled:pointer-events-none"
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
              className="flex-1 py-3 px-4 rounded-lg bg-[#111111] hover:bg-[#333333] text-[#F3E8D2] font-bold text-xs uppercase tracking-wider transition"
            >
              Tutup
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
