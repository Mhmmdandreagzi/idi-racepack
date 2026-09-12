import { RacepackStats } from "@/types/stats";
import { isFirebaseConfigured, db } from "@/lib/firebase/config";
import { doc, getDoc, setDoc } from "firebase/firestore";

const MOCK_STATS_KEY = "idi_racepack_stats";

export async function getRacepackStats(totalFallback = 1161): Promise<RacepackStats> {
  // 1. Firebase Mode: Read single document 'stats/racepack'
  if (isFirebaseConfigured && db) {
    try {
      const statsRef = doc(db, "stats", "racepack");
      const snap = await getDoc(statsRef);
      if (snap.exists()) {
        const data = snap.data();
        return {
          total: data.total ?? totalFallback,
          sudah_diambil: data.sudah_diambil ?? 0,
          belum_diambil: data.belum_diambil ?? (data.total ?? totalFallback),
          updated_at: data.updated_at ? new Date(data.updated_at.toMillis?.() || Date.now()).toISOString() : null,
        };
      } else {
        // Initialize stats doc if missing
        const initialStats: RacepackStats = {
          total: totalFallback,
          sudah_diambil: 0,
          belum_diambil: totalFallback,
          updated_at: new Date().toISOString(),
        };
        await setDoc(statsRef, initialStats);
        return initialStats;
      }
    } catch (err) {
      console.warn("Error fetching Firestore stats doc:", err);
    }
  }

  // 2. Mock / Local Adapter Mode
  if (typeof window !== "undefined") {
    try {
      const raw = localStorage.getItem(MOCK_STATS_KEY);
      if (raw) {
        return JSON.parse(raw) as RacepackStats;
      }
      const initial: RacepackStats = {
        total: totalFallback,
        sudah_diambil: 0,
        belum_diambil: totalFallback,
        updated_at: new Date().toISOString(),
      };
      localStorage.setItem(MOCK_STATS_KEY, JSON.stringify(initial));
      return initial;
    } catch (e) {
      console.warn("Local storage error:", e);
    }
  }

  return {
    total: totalFallback,
    sudah_diambil: 0,
    belum_diambil: totalFallback,
    updated_at: null,
  };
}
