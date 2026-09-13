import { Peserta } from "@/types/peserta";
import { AppUser } from "@/types/user";
import { updateParticipantInCache } from "@/lib/cache/pesertaCache";

export interface PickupResult {
  success: boolean;
  message: string;
  peserta?: Peserta;
  waktu?: string;
  petugasNama?: string;
}

export interface ProxyPickupData {
  nama: string;
  nik?: string;
  noHp: string;
  alamat: string;
}

export interface CollectivePickupResult {
  success: boolean;
  message: string;
  updatedPeserta: Peserta[];
  proxyData: ProxyPickupData;
  waktu: string;
  petugasNama: string;
}

/**
 * Konfirmasi pengambilan racepack untuk satu peserta.
 * Terkoneksi ke backend MySQL dengan row locking transaction.
 */
export async function confirmRacepackPickup(
  peserta: Peserta,
  currentUser: AppUser
): Promise<PickupResult> {
  if (!currentUser) {
    throw new Error("Anda harus login untuk melakukan konfirmasi pengambilan racepack.");
  }

  try {
    const res = await fetch("/api/pengambilan", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ pesertaId: peserta.id }),
    });

    const data = await res.json();

    if (!res.ok || !data.success) {
      throw new Error(data.message || "Gagal memproses pengambilan racepack.");
    }

    // Update local cache immediately
    if (data.peserta) {
      updateParticipantInCache(peserta.id, data.peserta);
    }

    return {
      success: true,
      message: data.message || "Racepack berhasil diambil!",
      peserta: data.peserta,
      waktu: data.waktu,
      petugasNama: data.petugasNama,
    };
  } catch (error: any) {
    throw new Error(error.message || "Gagal memproses transaksi racepack.");
  }
}

/**
 * Transaksi pengambilan racepack kolektif (diwakilkan oleh perwakilan).
 * Menggunakan transaksi atomik MySQL multi-rows row locking.
 */
export async function confirmCollectivePickup(
  pesertaList: Peserta[],
  proxyData: ProxyPickupData,
  currentUser: AppUser
): Promise<CollectivePickupResult> {
  if (!currentUser) {
    throw new Error("Anda harus login untuk melakukan konfirmasi pengambilan racepack.");
  }

  if (!pesertaList || pesertaList.length === 0) {
    throw new Error("Daftar peserta yang mau diambilkan tidak boleh kosong.");
  }

  try {
    const res = await fetch("/api/pengambilan/collective", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        pesertaIds: pesertaList.map((p) => p.id),
        proxyData,
      }),
    });

    const data = await res.json();

    if (!res.ok || !data.success) {
      throw new Error(data.message || "Gagal memproses pengambilan kolektif.");
    }

    // Update local cache for all updated participants
    if (Array.isArray(data.updatedPeserta)) {
      for (const p of data.updatedPeserta) {
        updateParticipantInCache(p.id, p);
      }
    }

    return {
      success: true,
      message: data.message || `Berhasil memproses pengambilan kolektif untuk ${pesertaList.length} peserta!`,
      updatedPeserta: data.updatedPeserta || [],
      proxyData: data.proxyData || proxyData,
      waktu: data.waktu || new Date().toISOString(),
      petugasNama: data.petugasNama || currentUser.displayName || "Petugas",
    };
  } catch (error: any) {
    throw new Error(error.message || "Gagal memproses pengambilan kolektif.");
  }
}

/**
 * Admin action to undo or reset a pickup
 */
export async function resetRacepackPickup(
  pesertaId: string,
  adminUser: AppUser,
  confirmationText: string = "BATALKAN"
): Promise<boolean> {
  if (adminUser.role !== "admin" && adminUser.role !== "superadmin") {
    throw new Error("Hanya admin atau super admin yang memiliki izin untuk membatalkan pengambilan racepack.");
  }

  try {
    const res = await fetch("/api/pengambilan/reset", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ pesertaId, confirmationText }),
    });

    const data = await res.json();
    if (!res.ok || !data.success) {
      throw new Error(data.message || "Gagal mereset status pengambilan.");
    }

    // Update local cache
    updateParticipantInCache(pesertaId, {
      status_pengambilan: false,
      waktu_pengambilan: null,
      petugas_id: null,
      petugas_nama: null,
      is_kolektif: false,
      diambil_oleh: undefined,
      nik_pengambil: undefined,
      no_hp_pengambil: undefined,
      alamat_pengambil: undefined,
      catatan: null,
    });

    return true;
  } catch (err: any) {
    throw new Error(err.message || "Gagal membatalkan pengambilan racepack.");
  }
}

/**
 * Super Admin action to reset ALL participants' pickup data
 */
export async function resetAllPickups(
  superAdminUser: AppUser,
  confirmationText: string
): Promise<{ success: boolean; message: string; affectedRows: number }> {
  if (superAdminUser.role !== "superadmin") {
    throw new Error("Hanya Super Admin yang berhak mereset seluruh data pengambilan.");
  }

  const res = await fetch("/api/pengambilan/reset-all", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ confirmationText }),
  });

  const data = await res.json();
  if (!res.ok || !data.success) {
    throw new Error(data.message || "Gagal mereset seluruh data pengambilan.");
  }

  return data;
}
