"use client";

import React, { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth/AuthContext";
import { AppUser, UserRole } from "@/types/user";
import {
  getAllUsers,
  createUser,
  toggleUserStatus,
  deleteUser,
} from "@/lib/services/userService";
import { isFirebaseConfigured, db } from "@/lib/firebase/config";
import { writeBatch, doc, setDoc, serverTimestamp } from "firebase/firestore";
import {
  Shield,
  UserPlus,
  Trash2,
  Power,
  Database,
  RefreshCw,
  CheckCircle2,
  UploadCloud,
} from "lucide-react";
import AuthGuard from "@/components/auth/AuthGuard";

function AdminContent() {
  const { role } = useAuth();
  const [users, setUsers] = useState<AppUser[]>([]);
  const [isLoadingUsers, setIsLoadingUsers] = useState(true);

  // Form for new user
  const [newEmail, setNewEmail] = useState("");
  const [newDisplayName, setNewDisplayName] = useState("");
  const [newRole, setNewRole] = useState<UserRole>("petugas");
  const [isCreating, setIsCreating] = useState(false);
  const [formMsg, setFormMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Firestore seed state
  const [isSeeding, setIsSeeding] = useState(false);
  const [seedProgress, setSeedProgress] = useState<string | null>(null);

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
      setFormMsg({ type: "success", text: "Petugas berhasil didaftarkan!" });
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
    if (!confirm(`Hapus akun petugas "${name}"?`)) return;
    await deleteUser(uid);
    await loadUsers();
  };

  // One-click Sync to Cloud Firestore when user decides to connect Firebase
  const handleSeedFirestore = async () => {
    if (!isFirebaseConfigured || !db) {
      alert(
        "Firebase belum terhubung. Silakan isi konfigurasi NEXT_PUBLIC_FIREBASE_* di .env.local terlebih dahulu."
      );
      return;
    }

    const firestoreDb = db;

    if (
      !confirm(
        "Sinkronkan 1.161 data peserta dari Normalisasi Data IDI ke Cloud Firestore sekarang?"
      )
    ) {
      return;
    }

    setIsSeeding(true);
    setSeedProgress("Mengambil data peserta...");
    try {
      const res = await fetch("/api/peserta");
      const json = await res.json();
      const list = json.data || [];

      setSeedProgress(`Memulai batch upload ${list.length} dokumen...`);

      // Batch write in chunks of 400 (Firestore limit is 500 per batch)
      const chunkSize = 400;
      for (let i = 0; i < list.length; i += chunkSize) {
        const chunk = list.slice(i, i + chunkSize);
        const batch = writeBatch(firestoreDb);

        chunk.forEach((item: any) => {
          const ref = doc(firestoreDb, "peserta", item.id);
          batch.set(ref, item);
        });

        await batch.commit();
        setSeedProgress(`Tersimpan ${Math.min(i + chunkSize, list.length)} / ${list.length}...`);
      }

      // Initialize stats/racepack doc
      const statsRef = doc(firestoreDb, "stats", "racepack");
      await setDoc(statsRef, {
        total: list.length,
        sudah_diambil: 0,
        belum_diambil: list.length,
        updated_at: serverTimestamp(),
      });

      setSeedProgress(`Selesai! Berhasil mengunggah ${list.length} peserta ke Firestore.`);
    } catch (err: any) {
      console.error(err);
      setSeedProgress(`Gagal sinkronisasi: ${err.message}`);
    } finally {
      setIsSeeding(false);
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
              RUN IDI RUN 5K 2026 • Manajemen Akses Staf & Sinkronisasi Database
            </p>
          </div>
        </div>
        <span className="self-start sm:self-auto text-xs font-bold uppercase tracking-wider px-3 py-1 rounded bg-[#111111] text-[#F3E8D2]">
          Role: {role?.toUpperCase() || "ADMIN"}
        </span>
      </div>

      {/* Cloud Firestore Seeder Box */}
      <section className="p-6 rounded-xl bg-[#FAF5EA] border-2 border-[#111111] text-[#111111] shadow-sm space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
          <div className="space-y-1 max-w-xl">
            <h2 className="font-display text-xl text-[#111111] flex items-center gap-2 tracking-wide">
              <Database className="w-5 h-5 text-[#26734D]" />
              <span>SINKRONISASI DATA PESERTA KE CLOUD FIRESTORE</span>
            </h2>
            <p className="text-xs text-[#111111]/75 leading-relaxed font-medium">
              Unggah 1.161 data peserta dari file Excel ter-normalisasi langsung ke database Cloud Firestore.
              Fitur ini menginisialisasi koleksi <code className="font-bold text-[#D71920]">peserta</code> dan dokumen agregat <code className="font-bold text-[#D71920]">stats/racepack</code>.
            </p>
          </div>

          <button
            onClick={handleSeedFirestore}
            disabled={isSeeding}
            className="shrink-0 flex items-center gap-2 px-5 py-3 rounded-lg bg-[#D71920] hover:bg-[#b5141a] text-white text-xs font-bold uppercase tracking-wider transition shadow-sm disabled:opacity-50"
          >
            <UploadCloud className={`w-4 h-4 ${isSeeding ? "animate-bounce" : ""}`} />
            <span>{isSeeding ? "Menyinkronkan..." : "Sync ke Firestore"}</span>
          </button>
        </div>

        {seedProgress && (
          <div className="p-3.5 rounded-lg bg-[#F3E8D2] text-xs text-[#26734D] font-bold flex items-center gap-2 border border-[#D8CDB8]">
            <CheckCircle2 className="w-4 h-4 text-[#26734D] shrink-0" />
            <span>{seedProgress}</span>
          </div>
        )}
      </section>

      {/* User Management Section */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Form Tambah Petugas */}
        <div className="md:col-span-1 p-6 rounded-xl bg-[#FAF5EA] border border-[#D8CDB8] shadow-sm space-y-4">
          <h2 className="font-display text-lg text-[#111111] flex items-center gap-2">
            <UserPlus className="w-4 h-4 text-[#26734D]" />
            <span>TAMBAH AKUN PETUGAS</span>
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
                Nama Lengkap Petugas
              </label>
              <input
                type="text"
                required
                value={newDisplayName}
                onChange={(e) => setNewDisplayName(e.target.value)}
                placeholder="Contoh: Petugas Meja 3"
                className="w-full px-3.5 py-2.5 bg-[#F3E8D2] border border-[#D8CDB8] focus:border-[#111111] rounded-lg text-[#111111] placeholder-[#111111]/40 focus:outline-none font-medium"
              />
            </div>

            <div>
              <label className="text-[#111111]/70 font-bold block mb-1">
                Email Petugas
              </label>
              <input
                type="email"
                required
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                placeholder="petugas3@racepack.com"
                className="w-full px-3.5 py-2.5 bg-[#F3E8D2] border border-[#D8CDB8] focus:border-[#111111] rounded-lg text-[#111111] placeholder-[#111111]/40 focus:outline-none font-medium"
              />
            </div>

            <div>
              <label className="text-[#111111]/70 font-bold block mb-1">Role / Peran</label>
              <select
                value={newRole}
                onChange={(e) => setNewRole(e.target.value as UserRole)}
                className="w-full px-3.5 py-2.5 bg-[#F3E8D2] border border-[#D8CDB8] focus:border-[#111111] rounded-lg text-[#111111] focus:outline-none font-bold"
              >
                <option value="petugas">Petugas (Pickup & Search)</option>
                <option value="admin">Admin (Full Control)</option>
              </select>
            </div>

            <button
              type="submit"
              disabled={isCreating}
              className="w-full py-3 px-4 rounded-lg bg-[#111111] hover:bg-[#333333] text-[#F3E8D2] font-bold text-xs uppercase tracking-wider transition shadow-sm disabled:opacity-50 mt-2"
            >
              {isCreating ? "Menyimpan..." : "Daftarkan Petugas"}
            </button>
          </form>
        </div>

        {/* Daftar Petugas Terdaftar */}
        <div className="md:col-span-2 p-6 rounded-xl bg-[#FAF5EA] border border-[#D8CDB8] shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-[#D8CDB8] pb-3">
            <h2 className="font-display text-lg text-[#111111]">
              DAFTAR STAF & PETUGAS TERDAFTAR ({users.length})
            </h2>
            <button
              onClick={loadUsers}
              className="p-1.5 text-[#111111]/60 hover:text-[#111111] rounded-lg hover:bg-[#E6D8BE] transition"
              title="Refresh users"
            >
              <RefreshCw className={`w-4 h-4 ${isLoadingUsers ? "animate-spin text-[#D71920]" : ""}`} />
            </button>
          </div>

          <div className="divide-y divide-[#D8CDB8]">
            {users.map((u) => (
              <div
                key={u.uid}
                className="py-3 flex items-center justify-between gap-3 text-xs"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <p className="font-display text-lg text-[#111111] leading-none">{u.displayName || u.nama}</p>
                    <span
                      className={`text-[9px] uppercase font-bold px-2 py-0.5 rounded ${
                        u.role === "admin"
                          ? "bg-[#D71920] text-white"
                          : "bg-[#111111] text-[#F3E8D2]"
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
                    title={u.isActive ? "Nonaktifkan akun" : "Aktifkan akun"}
                    className={`p-2 rounded-lg border transition ${
                      u.isActive
                        ? "text-[#26734D] hover:bg-[#26734D]/10 border-[#26734D]/40"
                        : "text-[#111111]/40 hover:bg-[#E6D8BE] border-[#D8CDB8]"
                    }`}
                  >
                    <Power className="w-4 h-4" />
                  </button>

                  <button
                    onClick={() => handleDelete(u.uid, u.displayName || u.nama || "")}
                    title="Hapus user"
                    className="p-2 rounded-lg text-[#111111]/60 hover:text-[#D71920] hover:bg-[#FAF5EA] border border-[#D8CDB8] transition"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
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
