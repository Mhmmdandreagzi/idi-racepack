import { Peserta, normalizeSearchString } from "@/types/peserta";
import { isFirebaseConfigured, db } from "@/lib/firebase/config";
import { collection, getDocs } from "firebase/firestore";

const CACHE_KEY = "idi_racepack_peserta_cache_v1";
const CACHE_TIMESTAMP_KEY = "idi_racepack_peserta_cache_time";
const CACHE_TTL_MS = 1000 * 60 * 60 * 4; // 4 hours

let inMemoryPeserta: Peserta[] | null = null;

export async function loadPesertaDataset(forceRefresh = false): Promise<Peserta[]> {
  // 1. Check in-memory state
  if (!forceRefresh && inMemoryPeserta && inMemoryPeserta.length > 0) {
    return inMemoryPeserta;
  }

  // 2. Check localStorage cache in browser
  if (typeof window !== "undefined" && !forceRefresh) {
    try {
      const cachedTime = localStorage.getItem(CACHE_TIMESTAMP_KEY);
      const cachedData = localStorage.getItem(CACHE_KEY);
      if (cachedTime && cachedData) {
        const age = Date.now() - parseInt(cachedTime, 10);
        if (age < CACHE_TTL_MS) {
          const parsed = JSON.parse(cachedData) as Peserta[];
          if (Array.isArray(parsed) && parsed.length > 0) {
            inMemoryPeserta = parsed;
            return parsed;
          }
        }
      }
    } catch (e) {
      console.warn("Error reading local cache:", e);
    }
  }

  // 3. Fetch from source: Strictly Cloud Firestore when Firebase is configured
  let participants: Peserta[] = [];

  if (isFirebaseConfigured && db) {
    try {
      const snapshot = await getDocs(collection(db, "peserta"));
      snapshot.forEach((docSnap) => {
        participants.push({
          id: docSnap.id,
          ...(docSnap.data() as Omit<Peserta, "id">),
        });
      });
      console.log(`[pesertaCache] Loaded ${participants.length} peserta directly from Cloud Firestore.`);
    } catch (err: any) {
      console.error("[pesertaCache] Firestore fetch error:", err);
      throw new Error("Gagal mengambil data peserta dari Cloud Firestore: " + (err.message || "Periksa koneksi atau izin database."));
    }
  } else {
    throw new Error("Cloud Firestore belum dikonfigurasi. Harap periksa file .env.local.");
  }

  // Ensure nama_search is populated on every record
  participants = participants.map((p) => ({
    ...p,
    nama_search: p.nama_search || normalizeSearchString(p.nama),
  }));

  // Save to in-memory & localStorage
  inMemoryPeserta = participants;
  if (typeof window !== "undefined") {
    try {
      localStorage.setItem(CACHE_KEY, JSON.stringify(participants));
      localStorage.setItem(CACHE_TIMESTAMP_KEY, Date.now().toString());
    } catch (e) {
      console.warn("Error saving local cache (storage might be full):", e);
    }
  }

  return participants;
}

export function updateParticipantInCache(id: string, updates: Partial<Peserta>): void {
  if (inMemoryPeserta) {
    inMemoryPeserta = inMemoryPeserta.map((p) => (p.id === id ? { ...p, ...updates } : p));
  }

  if (typeof window !== "undefined") {
    try {
      const cachedData = localStorage.getItem(CACHE_KEY);
      if (cachedData) {
        const parsed = JSON.parse(cachedData) as Peserta[];
        const updated = parsed.map((p) => (p.id === id ? { ...p, ...updates } : p));
        localStorage.setItem(CACHE_KEY, JSON.stringify(updated));
      }
    } catch (e) {
      console.warn("Failed to update participant in local cache:", e);
    }
  }
}

export function clearPesertaCache(): void {
  inMemoryPeserta = null;
  if (typeof window !== "undefined") {
    localStorage.removeItem(CACHE_KEY);
    localStorage.removeItem(CACHE_TIMESTAMP_KEY);
  }
}
