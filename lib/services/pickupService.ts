import { Peserta } from "@/types/peserta";
import { AppUser } from "@/types/user";
import { PengambilanLog } from "@/types/pengambilan";
import { isFirebaseConfigured, db } from "@/lib/firebase/config";
import { updateParticipantInCache } from "@/lib/cache/pesertaCache";
import {
  doc,
  runTransaction,
  collection,
  serverTimestamp,
  increment,
} from "firebase/firestore";

const MOCK_PICKUP_LOGS_KEY = "idi_racepack_pickup_logs";
const MOCK_STATS_KEY = "idi_racepack_stats";

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

export async function confirmRacepackPickup(
  peserta: Peserta,
  currentUser: AppUser
): Promise<PickupResult> {
  if (!currentUser) {
    throw new Error("Anda harus login untuk melakukan konfirmasi pengambilan racepack.");
  }

  const nowIso = new Date().toISOString();
  const petugasNama = currentUser.displayName || currentUser.email || "Petugas";

  // 1. Firebase Mode with Firestore atomic transaction
  if (isFirebaseConfigured && db) {
    try {
      const pesertaRef = doc(db, "peserta", peserta.id);
      const statsRef = doc(db, "stats", "racepack");
      const logRef = doc(collection(db, "pengambilan"));

      await runTransaction(db, async (transaction) => {
        const pSnap = await transaction.get(pesertaRef);
        if (!pSnap.exists()) {
          throw new Error("Peserta tidak ditemukan di database.");
        }

        const data = pSnap.data() as Peserta;
        if (data.status_pengambilan) {
          throw new Error("Racepack sudah diambil oleh petugas lain.");
        }

        // 1. Update Peserta
        transaction.update(pesertaRef, {
          status_pengambilan: true,
          waktu_pengambilan: serverTimestamp(),
          petugas_id: currentUser.uid,
          petugas_nama: petugasNama,
        });

        // 2. Increment stats atomically
        transaction.set(
          statsRef,
          {
            sudah_diambil: increment(1),
            belum_diambil: increment(-1),
            updated_at: serverTimestamp(),
          },
          { merge: true }
        );

        // 3. Create Audit Log
        transaction.set(logRef, {
          peserta_id: peserta.id,
          peserta_nama: peserta.nama,
          peserta_bib: peserta.bib || "-",
          peserta_kategori: peserta.kategori,
          pendaftaran_melalui: peserta.pendaftaran_melalui,
          petugas_id: currentUser.uid,
          petugas_nama: petugasNama,
          petugas_email: currentUser.email,
          waktu_pengambilan: serverTimestamp(),
          status: "BERHASIL",
        });
      });

      // Update local cache immediately
      updateParticipantInCache(peserta.id, {
        status_pengambilan: true,
        waktu_pengambilan: nowIso,
        petugas_id: currentUser.uid,
        petugas_nama: petugasNama,
      });

      return {
        success: true,
        message: "Racepack berhasil diambil!",
        peserta: {
          ...peserta,
          status_pengambilan: true,
          waktu_pengambilan: nowIso,
          petugas_id: currentUser.uid,
          petugas_nama: petugasNama,
        },
        waktu: nowIso,
        petugasNama,
      };
    } catch (error: any) {
      console.error("Firestore pickup transaction failed:", error);
      // Clean readable error message without leaking internal stack traces
      const msg = error.message || "Gagal memproses transaksi racepack.";
      throw new Error(msg);
    }
  }

  // 2. Mock / Local Adapter Mode (Atomic check against local storage state)
  try {
    // Read fresh cache from localStorage to verify nobody else claimed it
    const cacheRaw = localStorage.getItem("idi_racepack_peserta_cache_v1");
    if (cacheRaw) {
      const allPeserta = JSON.parse(cacheRaw) as Peserta[];
      const freshTarget = allPeserta.find((p) => p.id === peserta.id);
      if (freshTarget && freshTarget.status_pengambilan) {
        throw new Error("Racepack sudah diambil oleh petugas lain.");
      }
    }

    // Update in-memory & local cache
    updateParticipantInCache(peserta.id, {
      status_pengambilan: true,
      waktu_pengambilan: nowIso,
      petugas_id: currentUser.uid,
      petugas_nama: petugasNama,
    });

    // Update mock stats
    const statsRaw = localStorage.getItem(MOCK_STATS_KEY);
    let stats = { total: 1161, sudah_diambil: 0, belum_diambil: 1161 };
    if (statsRaw) {
      stats = JSON.parse(statsRaw);
    }
    stats.sudah_diambil = (stats.sudah_diambil || 0) + 1;
    stats.belum_diambil = Math.max(0, (stats.total || 1161) - stats.sudah_diambil);
    localStorage.setItem(MOCK_STATS_KEY, JSON.stringify(stats));

    // Append to audit logs
    const logsRaw = localStorage.getItem(MOCK_PICKUP_LOGS_KEY);
    const logs: PengambilanLog[] = logsRaw ? JSON.parse(logsRaw) : [];
    const newLog: PengambilanLog = {
      id: `log_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      peserta_id: peserta.id,
      peserta_nama: peserta.nama,
      peserta_bib: peserta.bib || "-",
      peserta_kategori: peserta.kategori,
      pendaftaran_melalui: peserta.pendaftaran_melalui,
      petugas_id: currentUser.uid,
      petugas_nama: petugasNama,
      petugas_email: currentUser.email,
      waktu_pengambilan: nowIso,
      status: "BERHASIL",
    };
    logs.unshift(newLog);
    localStorage.setItem(MOCK_PICKUP_LOGS_KEY, JSON.stringify(logs.slice(0, 500)));

    return {
      success: true,
      message: "Racepack berhasil diambil!",
      peserta: {
        ...peserta,
        status_pengambilan: true,
        waktu_pengambilan: nowIso,
        petugas_id: currentUser.uid,
        petugas_nama: petugasNama,
      },
      waktu: nowIso,
      petugasNama,
    };
  } catch (error: any) {
    throw new Error(error.message || "Gagal memproses pengambilan racepack.");
  }
}

/**
 * Admin action to undo or reset a pickup if mistakes happen
 */
export async function resetRacepackPickup(
  pesertaId: string,
  adminUser: AppUser
): Promise<boolean> {
  if (adminUser.role !== "admin") {
    throw new Error("Hanya admin yang memiliki izin untuk membatalkan pengambilan racepack.");
  }

  // 1. Firebase Mode
  if (isFirebaseConfigured && db) {
    const pesertaRef = doc(db, "peserta", pesertaId);
    const statsRef = doc(db, "stats", "racepack");

    await runTransaction(db, async (transaction) => {
      const pSnap = await transaction.get(pesertaRef);
      if (!pSnap.exists()) throw new Error("Peserta tidak ditemukan.");
      const data = pSnap.data() as Peserta;
      if (!data.status_pengambilan) return;

      transaction.update(pesertaRef, {
        status_pengambilan: false,
        waktu_pengambilan: null,
        petugas_id: null,
        petugas_nama: null,
      });

      transaction.update(statsRef, {
        sudah_diambil: increment(-1),
        belum_diambil: increment(1),
        updated_at: serverTimestamp(),
      });
    });
  }

  // Update cache
  updateParticipantInCache(pesertaId, {
    status_pengambilan: false,
    waktu_pengambilan: null,
    petugas_id: null,
    petugas_nama: null,
  });

  // Mock stats update
  if (typeof window !== "undefined") {
    const statsRaw = localStorage.getItem(MOCK_STATS_KEY);
    if (statsRaw) {
      const stats = JSON.parse(statsRaw);
      stats.sudah_diambil = Math.max(0, (stats.sudah_diambil || 1) - 1);
      stats.belum_diambil = (stats.total || 1161) - stats.sudah_diambil;
      localStorage.setItem(MOCK_STATS_KEY, JSON.stringify(stats));
    }
  }

  return true;
}

/**
 * Transaksi pengambilan racepack kolektif (diwakilkan oleh perwakilan)
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

  const cleanNama = proxyData.nama?.trim();
  const cleanHp = proxyData.noHp?.trim();
  const cleanAlamat = proxyData.alamat?.trim();
  const cleanNik = proxyData.nik?.trim() || "-";

  if (!cleanNama) {
    throw new Error("Identitas nama yang mengambilkan wajib diisi.");
  }
  if (!cleanHp) {
    throw new Error("Nomor telepon yang mengambilkan wajib diisi.");
  }
  if (!cleanAlamat) {
    throw new Error("Alamat yang mengambilkan wajib diisi.");
  }

  const nowIso = new Date().toISOString();
  const petugasNama = currentUser.displayName || currentUser.email || "Petugas";
  const catatan = `Diwakilkan oleh ${cleanNama} (${cleanHp}) - ${cleanAlamat}`;

  // 1. Firebase Mode with Firestore atomic transaction
  if (isFirebaseConfigured && db) {
    const firestoreDb = db;
    try {
      const statsRef = doc(firestoreDb, "stats", "racepack");

      await runTransaction(firestoreDb, async (transaction) => {
        // Step A: Read & verify all participant documents FIRST
        const docsData: { ref: any; peserta: Peserta }[] = [];

        for (const p of pesertaList) {
          const pRef = doc(firestoreDb, "peserta", p.id);
          const pSnap = await transaction.get(pRef);

          if (!pSnap.exists()) {
            throw new Error(`Peserta "${p.nama}" tidak ditemukan di database.`);
          }

          const currentData = pSnap.data() as Peserta;
          if (currentData.status_pengambilan) {
            throw new Error(
              `Peserta "${currentData.nama}" (BIB: ${currentData.bib || "-"}) sudah diambil sebelumnya oleh petugas lain.`
            );
          }

          docsData.push({ ref: pRef, peserta: currentData });
        }

        // Step B: Update all participants
        for (const item of docsData) {
          transaction.update(item.ref, {
            status_pengambilan: true,
            waktu_pengambilan: serverTimestamp(),
            petugas_id: currentUser.uid,
            petugas_nama: petugasNama,
            is_kolektif: true,
            diambil_oleh: cleanNama,
            nik_pengambil: cleanNik,
            no_hp_pengambil: cleanHp,
            alamat_pengambil: cleanAlamat,
            catatan,
          });

          // Create audit log for each participant
          const logRef = doc(collection(firestoreDb, "pengambilan"));
          transaction.set(logRef, {
            peserta_id: item.peserta.id,
            peserta_nama: item.peserta.nama,
            peserta_bib: item.peserta.bib || "-",
            peserta_kategori: item.peserta.kategori,
            pendaftaran_melalui: item.peserta.pendaftaran_melalui,
            petugas_id: currentUser.uid,
            petugas_nama: petugasNama,
            petugas_email: currentUser.email,
            waktu_pengambilan: serverTimestamp(),
            status: "BERHASIL",
            is_kolektif: true,
            diambil_oleh: cleanNama,
            nik_pengambil: cleanNik,
            no_hp_pengambil: cleanHp,
            alamat_pengambil: cleanAlamat,
            keterangan: `Pengambilan Kolektif Diwakilkan (${pesertaList.length} peserta)`,
          });
        }

        // Step C: Update stats atomically
        transaction.set(
          statsRef,
          {
            sudah_diambil: increment(pesertaList.length),
            belum_diambil: increment(-pesertaList.length),
            updated_at: serverTimestamp(),
          },
          { merge: true }
        );
      });

      // Update local cache for each participant
      const updatedPesertaList: Peserta[] = pesertaList.map((p) => {
        const updated: Peserta = {
          ...p,
          status_pengambilan: true,
          waktu_pengambilan: nowIso,
          petugas_id: currentUser.uid,
          petugas_nama: petugasNama,
          is_kolektif: true,
          diambil_oleh: cleanNama,
          nik_pengambil: cleanNik,
          no_hp_pengambil: cleanHp,
          alamat_pengambil: cleanAlamat,
          catatan,
        };
        updateParticipantInCache(p.id, updated);
        return updated;
      });

      return {
        success: true,
        message: `Berhasil memproses pengambilan kolektif untuk ${pesertaList.length} peserta!`,
        updatedPeserta: updatedPesertaList,
        proxyData: {
          nama: cleanNama,
          nik: cleanNik,
          noHp: cleanHp,
          alamat: cleanAlamat,
        },
        waktu: nowIso,
        petugasNama,
      };
    } catch (error: any) {
      console.error("Firestore collective pickup transaction failed:", error);
      const msg = error.message || "Gagal memproses transaksi pengambilan kolektif.";
      throw new Error(msg);
    }
  }

  // 2. Mock / Local Adapter Mode
  try {
    const cacheRaw = localStorage.getItem("idi_racepack_peserta_cache_v1");
    if (cacheRaw) {
      const allPeserta = JSON.parse(cacheRaw) as Peserta[];
      for (const p of pesertaList) {
        const fresh = allPeserta.find((item) => item.id === p.id);
        if (fresh && fresh.status_pengambilan) {
          throw new Error(`Peserta "${fresh.nama}" sudah diambil sebelumnya.`);
        }
      }
    }

    const updatedPesertaList: Peserta[] = pesertaList.map((p) => {
      const updated: Peserta = {
        ...p,
        status_pengambilan: true,
        waktu_pengambilan: nowIso,
        petugas_id: currentUser.uid,
        petugas_nama: petugasNama,
        is_kolektif: true,
        diambil_oleh: cleanNama,
        nik_pengambil: cleanNik,
        no_hp_pengambil: cleanHp,
        alamat_pengambil: cleanAlamat,
        catatan,
      };
      updateParticipantInCache(p.id, updated);
      return updated;
    });

    // Update mock stats
    const statsRaw = localStorage.getItem(MOCK_STATS_KEY);
    let stats = { total: 1161, sudah_diambil: 0, belum_diambil: 1161 };
    if (statsRaw) {
      stats = JSON.parse(statsRaw);
    }
    stats.sudah_diambil = (stats.sudah_diambil || 0) + pesertaList.length;
    stats.belum_diambil = Math.max(0, (stats.total || 1161) - stats.sudah_diambil);
    localStorage.setItem(MOCK_STATS_KEY, JSON.stringify(stats));

    // Append mock logs
    const logsRaw = localStorage.getItem(MOCK_PICKUP_LOGS_KEY);
    const logs: PengambilanLog[] = logsRaw ? JSON.parse(logsRaw) : [];
    for (const p of pesertaList) {
      logs.unshift({
        id: `log_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        peserta_id: p.id,
        peserta_nama: p.nama,
        peserta_bib: p.bib || "-",
        peserta_kategori: p.kategori,
        pendaftaran_melalui: p.pendaftaran_melalui,
        petugas_id: currentUser.uid,
        petugas_nama: petugasNama,
        petugas_email: currentUser.email,
        waktu_pengambilan: nowIso,
        status: "BERHASIL",
        is_kolektif: true,
        diambil_oleh: cleanNama,
        nik_pengambil: cleanNik,
        no_hp_pengambil: cleanHp,
        alamat_pengambil: cleanAlamat,
        keterangan: `Pengambilan Kolektif Diwakilkan (${pesertaList.length} peserta)`,
      });
    }
    localStorage.setItem(MOCK_PICKUP_LOGS_KEY, JSON.stringify(logs.slice(0, 500)));

    return {
      success: true,
      message: `Berhasil memproses pengambilan kolektif untuk ${pesertaList.length} peserta!`,
      updatedPeserta: updatedPesertaList,
      proxyData: {
        nama: cleanNama,
        nik: cleanNik,
        noHp: cleanHp,
        alamat: cleanAlamat,
      },
      waktu: nowIso,
      petugasNama,
    };
  } catch (error: any) {
    throw new Error(error.message || "Gagal memproses pengambilan kolektif.");
  }
}

