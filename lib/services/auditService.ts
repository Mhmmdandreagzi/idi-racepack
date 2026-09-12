import { PengambilanLog } from "@/types/pengambilan";
import { isFirebaseConfigured, db } from "@/lib/firebase/config";
import { collection, query, orderBy, limit, getDocs } from "firebase/firestore";

const MOCK_PICKUP_LOGS_KEY = "idi_racepack_pickup_logs";

export async function getRecentPickupLogs(maxCount = 50): Promise<PengambilanLog[]> {
  // 1. Firebase Mode
  if (isFirebaseConfigured && db) {
    try {
      const q = query(
        collection(db, "pengambilan"),
        orderBy("waktu_pengambilan", "desc"),
        limit(maxCount)
      );
      const snap = await getDocs(q);
      const logs: PengambilanLog[] = [];
      snap.forEach((d) => {
        const data = d.data();
        logs.push({
          id: d.id,
          peserta_id: data.peserta_id || "",
          peserta_nama: data.peserta_nama || "",
          peserta_bib: data.peserta_bib || "-",
          peserta_kategori: data.peserta_kategori || "",
          pendaftaran_melalui: data.pendaftaran_melalui || "",
          petugas_id: data.petugas_id || "",
          petugas_nama: data.petugas_nama || "",
          petugas_email: data.petugas_email || "",
          waktu_pengambilan: data.waktu_pengambilan?.toDate
            ? data.waktu_pengambilan.toDate().toISOString()
            : (data.waktu_pengambilan || new Date().toISOString()),
          status: data.status || "BERHASIL",
          keterangan: data.keterangan,
        });
      });
      return logs;
    } catch (err) {
      console.warn("Error fetching Firestore audit logs:", err);
    }
  }

  // 2. Mock Mode
  if (typeof window !== "undefined") {
    try {
      const raw = localStorage.getItem(MOCK_PICKUP_LOGS_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as PengambilanLog[];
        return parsed.slice(0, maxCount);
      }
    } catch (e) {
      console.warn("Error reading mock logs:", e);
    }
  }

  return [];
}
