"use client";

import React from "react";
import { CollectivePickupResult } from "@/lib/services/pickupService";
import { CheckCircle2, X, Users, Phone, MapPin, CreditCard, Shirt, Printer } from "lucide-react";

interface CollectiveSuccessModalProps {
  data: CollectivePickupResult | null;
  onClose: () => void;
}

export default function CollectiveSuccessModal({
  data,
  onClose,
}: CollectiveSuccessModalProps) {
  if (!data) return null;

  const { updatedPeserta, proxyData, waktu, petugasNama } = data;

  const formattedTime = waktu
    ? new Date(waktu).toLocaleTimeString("id-ID", {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      })
    : new Date().toLocaleTimeString("id-ID", {
        hour: "2-digit",
        minute: "2-digit",
      });

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-[#111111]/80 backdrop-blur-sm animate-in fade-in zoom-in-95 duration-150">
      <div
        className="relative w-full max-w-lg bg-[#FAF5EA] border-2 border-[#111111] rounded-2xl shadow-2xl overflow-hidden text-[#111111] max-h-[92vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b-2 border-[#111111] bg-[#111111] text-[#F3E8D2]">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-[#26734D] text-white flex items-center justify-center">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] uppercase tracking-wider text-[#D4B84C] font-bold">
                BUKTI SERAH TERIMA KOLEKTIF
              </span>
              <h2 className="font-display text-xl font-normal leading-tight text-white mt-0.5">
                PENGAMBILAN BERHASIL!
              </h2>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-[#F3E8D2]/70 hover:text-white rounded-lg hover:bg-white/10 transition"
            title="Tutup"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="p-5 overflow-y-auto space-y-4 bg-[#FAF5EA]">
          {/* Representative Information Card */}
          <div className="p-3.5 rounded-xl bg-[#F3E8D2] border border-[#D8CDB8] space-y-2 text-xs">
            <span className="text-[10px] uppercase font-bold text-[#111111]/60 tracking-wider block border-b border-[#D8CDB8] pb-1.5">
              DATA PERWAKILAN / PENGAMBIL
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
              <div>
                <span className="text-[10px] text-[#111111]/60 block">Nama Lengkap:</span>
                <span className="font-display text-lg text-[#111111] leading-none block mt-0.5">
                  {proxyData.nama}
                </span>
              </div>
              <div>
                <span className="text-[10px] text-[#111111]/60 block">No. Telepon / WA:</span>
                <span className="font-mono font-bold text-[#26734D] text-xs flex items-center gap-1 mt-0.5">
                  <Phone className="w-3.5 h-3.5" />
                  {proxyData.noHp}
                </span>
              </div>
              {proxyData.nik && proxyData.nik !== "-" && (
                <div>
                  <span className="text-[10px] text-[#111111]/60 block">NIK / Identitas:</span>
                  <span className="font-mono text-xs font-semibold text-[#111111]">
                    {proxyData.nik}
                  </span>
                </div>
              )}
              <div className="sm:col-span-2">
                <span className="text-[10px] text-[#111111]/60 block">Alamat Domisili:</span>
                <span className="font-medium text-xs text-[#111111] flex items-start gap-1 mt-0.5">
                  <MapPin className="w-3.5 h-3.5 text-[#D71920] shrink-0 mt-0.5" />
                  {proxyData.alamat}
                </span>
              </div>
            </div>
          </div>

          {/* List of Collected Participants */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#111111] flex items-center gap-1.5">
                <Users className="w-4 h-4 text-[#D71920]" />
                Daftar Racepack Diserahkan ({updatedPeserta.length} Peserta)
              </span>
              <span className="px-2 py-0.5 rounded-full bg-[#26734D]/15 border border-[#26734D] text-[#26734D] text-[10px] font-bold">
                ✓ SUDAH DIAMBIL
              </span>
            </div>

            <div className="max-h-52 overflow-y-auto space-y-1.5 pr-1">
              {updatedPeserta.map((p, idx) => (
                <div
                  key={p.id}
                  className="flex items-center justify-between p-2.5 rounded-lg bg-[#F3E8D2] border border-[#D8CDB8] text-xs"
                >
                  <div className="flex items-center gap-2 min-w-0 flex-1 pr-2">
                    <span className="w-5 h-5 rounded-full bg-[#111111] text-[#FAF5EA] text-[10px] font-bold flex items-center justify-center shrink-0">
                      {idx + 1}
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-[#111111] truncate">
                          <span>{p.nama}</span>
                          {p.nama_bib && p.nama_bib.trim() ? (
                            <span className="text-[#D71920] font-bold ml-1.5 px-1.5 py-0.5 rounded bg-[#D71920]/10 text-xs">
                              ({p.nama_bib.trim()})
                            </span>
                          ) : null}
                        </span>
                        <span className="px-1.5 py-0.2 rounded bg-[#FAF5EA] border border-[#111111] text-[10px] font-mono font-bold shrink-0">
                          BIB: {p.bib || "NO BIB"}
                        </span>
                      </div>
                      <div className="text-[10px] text-[#111111]/70 flex items-center gap-2 mt-0.5">
                        <span className="text-[#26734D] font-bold">{p.kategori}</span>
                        <span>•</span>
                        <span className="flex items-center gap-0.5 font-bold text-[#111111]">
                          <Shirt className="w-3 h-3 text-[#D4B84C]" /> Size {p.ukuran_jersey || "-"}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Transaction Metadata Footer */}
          <div className="grid grid-cols-2 gap-2 p-2.5 rounded-lg bg-[#E6D8BE] border border-[#D8CDB8] text-xs">
            <div>
              <span className="text-[10px] text-[#111111]/60 block">Petugas Penyerah:</span>
              <span className="font-bold text-[#111111]">{petugasNama}</span>
            </div>
            <div>
              <span className="text-[10px] text-[#111111]/60 block">Waktu Transaksi:</span>
              <span className="font-mono font-bold text-[#26734D]">
                {formattedTime} WIB
              </span>
            </div>
          </div>
        </div>

        {/* Modal Action Buttons */}
        <div className="p-4 border-t-2 border-[#111111] bg-[#FAF5EA] flex items-center justify-between gap-3">
          <button
            onClick={handlePrint}
            className="px-4 py-3 rounded-lg border-2 border-[#111111] text-[#111111] hover:bg-[#E6D8BE] text-xs font-bold uppercase flex items-center gap-1.5 transition"
          >
            <Printer className="w-4 h-4" />
            <span>Cetak Struk</span>
          </button>

          <button
            onClick={onClose}
            autoFocus
            className="flex-1 py-3 px-4 rounded-lg bg-[#26734D] hover:bg-[#1f5c3e] active:bg-[#184831] text-white font-bold text-xs uppercase tracking-wider transition duration-150 shadow-sm text-center"
          >
            Selesai
          </button>
        </div>
      </div>
    </div>
  );
}
