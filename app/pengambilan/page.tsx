"use client";

import React, { useEffect, useState, useMemo } from "react";
import { getRecentPickupLogs } from "@/lib/services/auditService";
import { PengambilanLog } from "@/types/pengambilan";
import {
  History,
  Search,
  Download,
  RefreshCw,
  CheckCircle2,
} from "lucide-react";
import * as xlsx from "xlsx";
import AuthGuard from "@/components/auth/AuthGuard";

function PengambilanContent() {
  const [logs, setLogs] = useState<PengambilanLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");

  const loadLogs = async () => {
    setIsLoading(true);
    try {
      const data = await getRecentPickupLogs(100);
      setLogs(data);
    } catch (e) {
      console.error("Error loading logs:", e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadLogs();
  }, []);

  const filteredLogs = useMemo(() => {
    if (!search.trim()) return logs;
    const q = search.toLowerCase().trim();
    return logs.filter(
      (l) =>
        l.peserta_nama.toLowerCase().includes(q) ||
        l.peserta_bib.toLowerCase().includes(q) ||
        l.petugas_nama.toLowerCase().includes(q) ||
        l.pendaftaran_melalui.toLowerCase().includes(q)
    );
  }, [logs, search]);

  const handleExportExcel = () => {
    if (logs.length === 0) {
      alert("Belum ada data riwayat pengambilan untuk diekspor.");
      return;
    }

    const rows = logs.map((l, index) => ({
      No: index + 1,
      "Nama Peserta": l.peserta_nama,
      "No BIB": l.peserta_bib,
      Kategori: l.peserta_kategori,
      "Daftar Melalui": l.pendaftaran_melalui,
      "Nama Petugas": l.petugas_nama,
      "Email Petugas": l.petugas_email,
      "Waktu Pengambilan": new Date(l.waktu_pengambilan).toLocaleString("id-ID"),
      Status: l.status,
    }));

    const worksheet = xlsx.utils.json_to_sheet(rows);
    const workbook = xlsx.utils.book_new();
    xlsx.utils.book_append_sheet(workbook, worksheet, "Riwayat Pengambilan");
    xlsx.writeFile(
      workbook,
      `Riwayat_Pengambilan_Racepack_${new Date().toISOString().slice(0, 10)}.xlsx`
    );
  };

  return (
    <main className="flex-1 max-w-5xl w-full mx-auto px-4 py-6 sm:py-8 space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#FAF5EA] p-5 rounded-xl border border-[#D8CDB8] shadow-sm">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#111111] text-[#D4B84C] flex items-center justify-center">
              <History className="w-5 h-5" />
            </div>
            <div>
              <h1 className="font-display text-2xl sm:text-3xl text-[#111111] leading-none">
                RIWAYAT & AUDIT SERAH TERIMA
              </h1>
              <p className="text-[11px] font-bold text-[#26734D] italic mt-0.5">
                RUN IDI RUN 5K 2026 • Log Resmi Pengambilan Racepack
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={loadLogs}
            disabled={isLoading}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-[#F3E8D2] hover:bg-[#E6D8BE] text-xs font-bold text-[#111111] border border-[#D8CDB8] transition"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? "animate-spin text-[#D71920]" : ""}`} />
            <span>Refresh</span>
          </button>

          <button
            onClick={handleExportExcel}
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#26734D] hover:bg-[#1f5c3e] text-white text-xs font-bold uppercase tracking-wider transition shadow-sm"
          >
            <Download className="w-4 h-4 text-white" />
            <span>Export Excel</span>
          </button>
        </div>
      </div>

      {/* Filter / Search Bar */}
      <div className="relative">
        <Search className="w-4 h-4 absolute left-4 top-3.5 text-[#111111]/60" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Saring riwayat berdasarkan nama peserta, nomor BIB, atau petugas..."
          className="w-full pl-11 pr-4 py-3 bg-[#FAF5EA] border border-[#D8CDB8] focus:border-[#111111] rounded-xl text-xs sm:text-sm text-[#111111] placeholder-[#111111]/40 focus:outline-none focus:ring-1 focus:ring-[#111111] shadow-sm font-medium"
        />
      </div>

      {/* Logs Table / Cards */}
      <div className="bg-[#FAF5EA] border-2 border-[#111111] rounded-xl shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="py-16 text-center text-[#111111]/60 space-y-2">
            <div className="w-8 h-8 rounded-full border-3 border-[#D71920] border-t-transparent animate-spin mx-auto" />
            <p className="font-display text-lg text-[#111111]">MEMUAT RIWAYAT TRANSAKSI...</p>
          </div>
        ) : filteredLogs.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-[#111111]">
              <thead className="bg-[#111111] uppercase text-[10px] font-bold tracking-wider text-[#F3E8D2]">
                <tr>
                  <th className="px-4 py-3.5">No</th>
                  <th className="px-4 py-3.5">Peserta & BIB</th>
                  <th className="px-4 py-3.5">Kategori</th>
                  <th className="px-4 py-3.5">Sumber</th>
                  <th className="px-4 py-3.5">Petugas Meja</th>
                  <th className="px-4 py-3.5">Waktu Transaksi</th>
                  <th className="px-4 py-3.5 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#D8CDB8]">
                {filteredLogs.map((log, index) => (
                  <tr key={log.id} className="hover:bg-[#F3E8D2] transition">
                    <td className="px-4 py-3 text-[#111111]/60 font-bold">{index + 1}</td>
                    <td className="px-4 py-3">
                      <p className="font-display text-lg text-[#111111] leading-tight">
                        {log.peserta_nama}
                      </p>
                      <span className="font-bold text-xs text-[#D71920]">
                        BIB: {log.peserta_bib}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-bold text-[#111111]">{log.peserta_kategori}</td>
                    <td className="px-4 py-3 text-[#111111]/70">
                      {log.pendaftaran_melalui}
                    </td>
                    <td className="px-4 py-3">
                      <p className="font-bold text-[#111111]">{log.petugas_nama}</p>
                      <p className="text-[10px] text-[#111111]/60">{log.petugas_email}</p>
                    </td>
                    <td className="px-4 py-3 text-[#111111]/80 font-medium">
                      {new Date(log.waktu_pengambilan).toLocaleString("id-ID")} WIB
                    </td>
                    <td className="px-4 py-3 text-right">
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-[10px] font-bold uppercase bg-[#26734D] text-white">
                        <CheckCircle2 className="w-3 h-3" />
                        {log.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="py-16 text-center text-[#111111]/60 space-y-1">
            <p className="font-display text-xl text-[#111111]">
              BELUM ADA RIWAYAT PENGAMBILAN
            </p>
            <p className="text-xs text-[#111111]/70">
              Setiap kali tombol &quot;Ambil Racepack&quot; dikonfirmasi, audit log akan tersimpan dan muncul di sini.
            </p>
          </div>
        )}
      </div>
    </main>
  );
}

export default function PengambilanPage() {
  return (
    <AuthGuard>
      <PengambilanContent />
    </AuthGuard>
  );
}
