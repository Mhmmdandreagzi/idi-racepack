"use client";

import React, { useEffect, useState, useRef } from "react";
import { useAuth } from "@/lib/auth/AuthContext";
import { AppUser, UserRole } from "@/types/user";
import {
  getAllUsers,
  createUser,
  toggleUserStatus,
  deleteUser,
} from "@/lib/services/userService";
import { resetAllPickups } from "@/lib/services/pickupService";
import {
  Shield,
  UserPlus,
  Trash2,
  Power,
  Database,
  RefreshCw,
  CheckCircle2,
  UploadCloud,
  FileSpreadsheet,
  AlertTriangle,
  RotateCcw,
  Lock,
} from "lucide-react";
import AuthGuard from "@/components/auth/AuthGuard";
import TypedConfirmModal from "@/components/ui/TypedConfirmModal";
import { useToast } from "@/context/ToastContext";

function AdminContent() {
  const { user, role } = useAuth();
  const { toast } = useToast();
  const [users, setUsers] = useState<AppUser[]>([]);
  const [isLoadingUsers, setIsLoadingUsers] = useState(true);

  // Form for new user
  const [newEmail, setNewEmail] = useState("");
  const [newDisplayName, setNewDisplayName] = useState("");
  const [newRole, setNewRole] = useState<UserRole>("petugas");
  const [isCreating, setIsCreating] = useState(false);
  const [formMsg, setFormMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Database import/sync state (Super Admin only)
  const [isImporting, setIsImporting] = useState(false);
  const [importProgress, setImportProgress] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Danger zone: Reset All Pickups state (Super Admin only)
  const [isResetAllModalOpen, setIsResetAllModalOpen] = useState(false);
  const [isResettingAll, setIsResettingAll] = useState(false);

  const isSuperAdmin = role === "superadmin";

  const loadUsers = async () => {
    setIsLoadingUsers(true);
    try {
      const list = await getAllUsers();
      setUsers(list);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoadingUsers(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEmail.trim() || !newDisplayName.trim()) {
      setFormMsg({ type: "error", text: "Email dan nama lengkap wajib diisi." });
      return;
    }

    setIsCreating(true);
    setFormMsg(null);
    try {
      await createUser({
        email: newEmail,
        displayName: newDisplayName,
        role: newRole,
      });
      setFormMsg({ type: "success", text: `Pengguna (${newRole.toUpperCase()}) berhasil didaftarkan!` });
      setNewEmail("");
      setNewDisplayName("");
      await loadUsers();
    } catch (err: any) {
      setFormMsg({ type: "error", text: err.message || "Gagal membuat user." });
    } finally {
      setIsCreating(false);
    }
  };

  const handleToggleStatus = async (uid: string) => {
    await toggleUserStatus(uid);
    await loadUsers();
  };

  const handleDelete = async (uid: string, name: string) => {
    if (!confirm(`Hapus akun pengguna "${name}"?`)) return;
    await deleteUser(uid);
    await loadUsers();
  };

  // Import Excel file to MySQL (Super Admin only)
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!isSuperAdmin) {
      toast.error("Hanya Super Admin yang diizinkan untuk mengimpor master data peserta.");
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }

    if (!confirm(`Impor data peserta dari file "${file.name}" ke database MySQL?`)) {
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }

    setIsImporting(true);
    setImportProgress("Memproses berkas Excel dan validasi seluruh kolom data...");

    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/peserta/import", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.message || "Gagal mengimpor data peserta.");
      }

      setImportProgress(`Selesai! ${data.message}`);
      toast.success("Master data peserta berhasil diimpor ke MySQL.");
    } catch (err: any) {
      setImportProgress(`Gagal impor: ${err.message}`);
      toast.error(err.message || "Gagal melakukan impor berkas.");
    } finally {
      setIsImporting(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  // Execute Reset All Pickups (Super Admin only)
  const handleExecuteResetAll = async () => {
    if (!user || !isSuperAdmin) {
      toast.error("Hanya Super Admin yang berhak mereset seluruh data pengambilan.");
      return;
    }

    setIsResettingAll(true);
    try {
      const res = await resetAllPickups(user, "RESET PENGAMBILAN");
      toast.success(`Berhasil! ${res.message}`);
      setIsResetAllModalOpen(false);
    } catch (err: any) {
      console.error("Reset all error:", err);
      toast.error(err.message || "Gagal mereset data pengambilan.");
    } finally {
      setIsResettingAll(false);
    }
  };

  return (
    <main className="flex-1 max-w-5xl w-full mx-auto px-4 py-6 sm:py-8 space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#FAF5EA] p-5 rounded-xl border border-[#D8CDB8] shadow-sm">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-[#111111] text-[#D4B84C] flex items-center justify-center">
            <Shield className="w-5 h-5" />
          </div>
          <div>
            <h1 className="font-display text-2xl sm:text-3xl text-[#111111] leading-none">
              ADMIN MANAGEMENT
            </h1>
            <p className="text-[11px] font-bold text-[#26734D] italic mt-0.5">
              RUN IDI RUN 5K 2026 • Manajemen Hak Akses Staf & Operasional Sistem
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 self-start sm:self-auto">
          <span
            className={`text-xs font-bold uppercase tracking-wider px-3 py-1 rounded ${
              isSuperAdmin
                ? "bg-[#D71920] text-white border border-white/20"
                : "bg-[#111111] text-[#F3E8D2]"
            }`}
          >
            Role: {role?.toUpperCase() || "ADMIN"}
          </span>
        </div>
      </div>

      {/* Database MySQL Seeder & Import Box */}
      <section className="p-6 rounded-xl bg-[#FAF5EA] border-2 border-[#111111] text-[#111111] shadow-sm space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
          <div className="space-y-1 max-w-xl">
            <div className="flex items-center gap-2">
              <h2 className="font-display text-xl text-[#111111] flex items-center gap-2 tracking-wide">
                <Database className="w-5 h-5 text-[#26734D]" />
                <span>SINKRONISASI & IMPORT DATA PESERTA KE MYSQL</span>
              </h2>
              {isSuperAdmin ? (
                <span className="text-[10px] font-bold bg-[#D4B84C]/20 text-[#111111] px-2 py-0.5 rounded border border-[#D4B84C]">
                  Akses Super Admin
                </span>
              ) : (
                <span className="text-[10px] font-bold bg-[#D71920]/10 text-[#D71920] px-2 py-0.5 rounded border border-[#D71920]/30 inline-flex items-center gap-1">
                  <Lock className="w-3 h-3" />
                  Khusus Super Admin
                </span>
              )}
            </div>
            <p className="text-xs text-[#111111]/75 leading-relaxed font-medium">
              Unggah dan perbarui master data peserta dari file Excel (.xlsx / .xls / .csv) ke database MySQL Hostinger.
              {isSuperAdmin
                ? " Data akan divalidasi dan disimpan dengan aman dalam transaksi MySQL tanpa risiko duplikasi."
                : " Hanya Super Admin yang memiliki hak akses untuk mengunggah dan mengimpor master data peserta."}
            </p>
          </div>

          <div>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept=".xlsx,.xls,.csv"
              className="hidden"
              disabled={!isSuperAdmin || isImporting}
            />
            {isSuperAdmin ? (
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={isImporting}
                className="shrink-0 flex items-center gap-2 px-5 py-3 rounded-lg bg-[#D71920] hover:bg-[#b5141a] text-white text-xs font-bold uppercase tracking-wider transition shadow-sm disabled:opacity-50 cursor-pointer"
              >
                <UploadCloud className={`w-4 h-4 ${isImporting ? "animate-bounce" : ""}`} />
                <span>{isImporting ? "Mengimpor..." : "Import File Excel"}</span>
              </button>
            ) : (
              <button
                type="button"
                disabled
                className="shrink-0 flex items-center gap-2 px-5 py-3 rounded-lg bg-[#111111]/20 text-[#111111]/50 text-xs font-bold uppercase tracking-wider cursor-not-allowed"
                title="Hanya Super Admin yang berhak mengimpor master data peserta."
              >
                <Lock className="w-4 h-4" />
                <span>Import Terkunci (Super Admin)</span>
              </button>
            )}
          </div>
        </div>

        {importProgress && (
          <div className="p-3.5 rounded-lg bg-[#F3E8D2] text-xs text-[#26734D] font-bold flex items-center gap-2 border border-[#D8CDB8]">
            <CheckCircle2 className="w-4 h-4 text-[#26734D] shrink-0" />
            <span>{importProgress}</span>
          </div>
        )}
      </section>

      {/* DANGER ZONE: Reset Seluruh Data Pengambilan (Khusus Super Admin) */}
      {isSuperAdmin && (
        <section className="p-6 rounded-xl bg-[#FAF5EA] border-2 border-[#D71920] text-[#111111] shadow-sm space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
            <div className="space-y-1 max-w-xl">
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded bg-[#D71920] text-white text-[10px] font-bold uppercase tracking-wider">
                  DANGER ZONE
                </span>
                <h2 className="font-display text-xl text-[#D71920] flex items-center gap-1.5 tracking-wide">
                  <AlertTriangle className="w-5 h-5 text-[#D71920]" />
                  <span>RESET SELURUH DATA PENGAMBILAN</span>
                </h2>
              </div>
              <p className="text-xs text-[#111111]/75 leading-relaxed font-medium">
                Mengembalikan status seluruh peserta kembali menjadi <strong>BELUM DIAMBIL</strong>, mengosongkan data petugas dan jam serah terima, serta mencatat log audit pembatalan massal. Memerlukan konfirmasi pengetikan teks untuk eksekusi.
              </p>
            </div>

            <button
              type="button"
              onClick={() => setIsResetAllModalOpen(true)}
              className="shrink-0 flex items-center gap-2 px-5 py-3 rounded-lg bg-[#D71920] hover:bg-[#b5141a] active:bg-[#961015] text-white text-xs font-bold uppercase tracking-wider transition shadow-sm cursor-pointer"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Reset Semua Pengambilan</span>
            </button>
          </div>
        </section>
      )}

      {/* User Management Section */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Form Tambah Petugas / Admin */}
        <div className="md:col-span-1 p-6 rounded-xl bg-[#FAF5EA] border border-[#D8CDB8] shadow-sm space-y-4">
          <h2 className="font-display text-lg text-[#111111] flex items-center gap-2">
            <UserPlus className="w-4 h-4 text-[#26734D]" />
            <span>TAMBAH AKUN PENGGUNA</span>
          </h2>

          {formMsg && (
            <div
              className={`p-3 rounded-lg text-xs font-bold flex items-center gap-2 ${
                formMsg.type === "success"
                  ? "bg-[#26734D]/15 border border-[#26734D]/30 text-[#26734D]"
                  : "bg-[#D71920]/15 border border-[#D71920]/30 text-[#D71920]"
              }`}
            >
              <span>{formMsg.text}</span>
            </div>
          )}

          <form onSubmit={handleCreateUser} className="space-y-3 text-xs">
            <div>
              <label className="text-[#111111]/70 font-bold block mb-1">
                Nama Lengkap
              </label>
              <input
                type="text"
                required
                value={newDisplayName}
                onChange={(e) => setNewDisplayName(e.target.value)}
                placeholder="Contoh: Budi Santoso"
                className="w-full px-3.5 py-2.5 bg-[#F3E8D2] border border-[#D8CDB8] focus:border-[#111111] rounded-lg text-[#111111] placeholder-[#111111]/40 focus:outline-none font-medium"
              />
            </div>

            <div>
              <label className="text-[#111111]/70 font-bold block mb-1">Email Akun</label>
              <input
                type="email"
                required
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                placeholder="staf@racepack.com"
                className="w-full px-3.5 py-2.5 bg-[#F3E8D2] border border-[#D8CDB8] focus:border-[#111111] rounded-lg text-[#111111] placeholder-[#111111]/40 focus:outline-none font-medium"
              />
            </div>

            <div>
              <label className="text-[#111111]/70 font-bold block mb-1">Role / Peran</label>
              <select
                value={newRole}
                onChange={(e) => setNewRole(e.target.value as UserRole)}
                className="w-full px-3.5 py-2.5 bg-[#F3E8D2] border border-[#D8CDB8] focus:border-[#111111] rounded-lg text-[#111111] focus:outline-none font-bold cursor-pointer"
              >
                <option value="petugas">Petugas (Meja Registrasi & Pengambilan)</option>
                <option value="admin">Admin (Dashboard & Kelola Staf)</option>
                {isSuperAdmin && (
                  <option value="superadmin">Super Admin (Full Control, Master Data & Reset)</option>
                )}
              </select>
            </div>

            <button
              type="submit"
              disabled={isCreating}
              className="w-full py-3 px-4 rounded-lg bg-[#111111] hover:bg-[#333333] text-[#F3E8D2] font-bold text-xs uppercase tracking-wider transition shadow-sm disabled:opacity-50 mt-2 cursor-pointer"
            >
              {isCreating ? "Menyimpan..." : "Daftarkan Pengguna"}
            </button>
          </form>
        </div>

        {/* Daftar Petugas & Admin Terdaftar */}
        <div className="md:col-span-2 p-6 rounded-xl bg-[#FAF5EA] border border-[#D8CDB8] shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-[#D8CDB8] pb-3">
            <h2 className="font-display text-lg text-[#111111]">
              DAFTAR PENGGUNA TERDAFTAR ({users.length})
            </h2>
            <button
              onClick={loadUsers}
              className="p-1.5 text-[#111111]/60 hover:text-[#111111] rounded-lg hover:bg-[#E6D8BE] transition cursor-pointer"
              title="Refresh users"
            >
              <RefreshCw className={`w-4 h-4 ${isLoadingUsers ? "animate-spin text-[#D71920]" : ""}`} />
            </button>
          </div>

          <div className="divide-y divide-[#D8CDB8]">
            {users.map((u) => {
              const isUserSuperAdmin = u.role === "superadmin";
              const isUserAdmin = u.role === "admin";

              return (
                <div
                  key={u.uid}
                  className="py-3 flex items-center justify-between gap-3 text-xs"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-display text-lg text-[#111111] leading-none">
                        {u.displayName || u.nama}
                      </p>
                      <span
                        className={`text-[9px] uppercase font-bold px-2 py-0.5 rounded ${
                          isUserSuperAdmin
                            ? "bg-[#D71920] text-white"
                            : isUserAdmin
                            ? "bg-[#111111] text-[#F3E8D2]"
                            : "bg-[#26734D]/20 text-[#26734D]"
                        }`}
                      >
                        {u.role}
                      </span>
                      {!u.isActive && (
                        <span className="text-[9px] px-1.5 py-0.5 rounded bg-[#E6D8BE] text-[#111111]/70 font-bold">
                          NONAKTIF
                        </span>
                      )}
                    </div>
                    <p className="text-[#111111]/60 mt-0.5 font-mono">{u.email}</p>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => handleToggleStatus(u.uid)}
                      disabled={isUserSuperAdmin && !isSuperAdmin}
                      title={u.isActive ? "Nonaktifkan akun" : "Aktifkan akun"}
                      className={`p-2 rounded-lg border transition cursor-pointer ${
                        u.isActive
                          ? "text-[#26734D] hover:bg-[#26734D]/10 border-[#26734D]/40"
                          : "text-[#111111]/40 hover:bg-[#E6D8BE] border-[#D8CDB8]"
                      }`}
                    >
                      <Power className="w-4 h-4" />
                    </button>

                    <button
                      onClick={() => handleDelete(u.uid, u.displayName || u.nama || "")}
                      disabled={isUserSuperAdmin}
                      title={isUserSuperAdmin ? "Akun Super Admin tidak dapat dihapus" : "Hapus user"}
                      className="p-2 rounded-lg text-[#111111]/60 hover:text-[#D71920] hover:bg-[#FAF5EA] border border-[#D8CDB8] transition disabled:opacity-30 disabled:hover:text-[#111111]/60 cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Typed Confirmation Modal for Reset All (Super Admin) */}
      <TypedConfirmModal
        isOpen={isResetAllModalOpen}
        onClose={() => setIsResetAllModalOpen(false)}
        onConfirm={handleExecuteResetAll}
        title="RESET SELURUH DATA PENGAMBILAN"
        description="PERINGATAN: Aksi ini akan mengembalikan status seluruh peserta (1.161 peserta) menjadi BELUM DIAMBIL, mengosongkan riwayat petugas, dan mencatat log pembatalan massal. Tindakan ini permanen!"
        expectedKeyword="RESET PENGAMBILAN"
        confirmButtonLabel="Ya, Reset Seluruh Pengambilan"
        isLoading={isResettingAll}
      />
    </main>
  );
}

export default function AdminPage() {
  return (
    <AuthGuard requiredRole="admin">
      <AdminContent />
    </AuthGuard>
  );
}
