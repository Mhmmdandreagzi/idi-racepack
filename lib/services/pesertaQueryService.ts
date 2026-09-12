import { db, isFirebaseConfigured } from "@/lib/firebase/config";
import {
  collection,
  getDocs,
  query,
  where,
  QueryConstraint,
} from "firebase/firestore";
import { Peserta, normalizeSearchString } from "@/types/peserta";
import { SearchFilters } from "@/hooks/usePesertaSearch";

export interface SearchPesertaParams {
  searchQuery: string;
  filters: SearchFilters;
}

/**
 * Searches participant data on-demand from Cloud Firestore.
 * Does NOT load all documents unless explicitly requested or needed.
 * Applies targeted Firestore queries (BIB, NIK, No HP, Nama) to minimize reads.
 */
export async function queryPesertaFromFirestore(
  params: SearchPesertaParams
): Promise<Peserta[]> {
  if (!isFirebaseConfigured || !db) {
    throw new Error(
      "Firebase belum dikonfigurasi. Pastikan konfigurasi Firebase di .env.local telah diisi."
    );
  }

  const { searchQuery, filters } = params;
  const rawQ = searchQuery.trim();
  if (!rawQ) {
    return [];
  }
  const normQ = normalizeSearchString(rawQ);
  const hasQuery = normQ.length > 0;

  // Strategy 1: Targeted query for numeric inputs (BIB, NIK, Phone)
  // This takes only 1-2 document reads directly from Firestore!
  if (hasQuery) {
    const isDigits = /^\d+$/.test(rawQ);
    if (isDigits) {
      // 1. Try exact BIB match
      try {
        const bibSnap = await getDocs(
          query(collection(db, "peserta"), where("bib", "==", rawQ))
        );
        if (!bibSnap.empty) {
          const results: Peserta[] = [];
          bibSnap.forEach((docSnap) => {
            results.push({ id: docSnap.id, ...(docSnap.data() as Omit<Peserta, "id">) });
          });
          return applyLocalFilters(results, normQ, filters);
        }
      } catch (e) {
        console.warn("BIB query error:", e);
      }

      // 2. Try exact NIK match if 16 digits
      if (rawQ.length === 16) {
        try {
          const nikSnap = await getDocs(
            query(collection(db, "peserta"), where("nik", "==", rawQ))
          );
          if (!nikSnap.empty) {
            const results: Peserta[] = [];
            nikSnap.forEach((docSnap) => {
              results.push({ id: docSnap.id, ...(docSnap.data() as Omit<Peserta, "id">) });
            });
            return applyLocalFilters(results, normQ, filters);
          }
        } catch (e) {
          console.warn("NIK query error:", e);
        }
      }

      // 3. Try exact Phone match
      try {
        const hpSnap = await getDocs(
          query(collection(db, "peserta"), where("no_hp", "==", rawQ))
        );
        if (!hpSnap.empty) {
          const results: Peserta[] = [];
          hpSnap.forEach((docSnap) => {
            results.push({ id: docSnap.id, ...(docSnap.data() as Omit<Peserta, "id">) });
          });
          return applyLocalFilters(results, normQ, filters);
        }
      } catch (e) {
        console.warn("Phone query error:", e);
      }
    }

    // 4. Try Firestore prefix query on nama_search
    try {
      const nameSnap = await getDocs(
        query(
          collection(db, "peserta"),
          where("nama_search", ">=", normQ),
          where("nama_search", "<=", normQ + "\uf8ff")
        )
      );
      if (!nameSnap.empty) {
        const results: Peserta[] = [];
        nameSnap.forEach((docSnap) => {
          results.push({ id: docSnap.id, ...(docSnap.data() as Omit<Peserta, "id">) });
        });
        const filtered = applyLocalFilters(results, normQ, filters);
        if (filtered.length > 0) {
          return filtered;
        }
      }
    } catch (e) {
      console.warn("Firestore prefix query on nama_search error:", e);
    }
  }

  // Strategy 2: Filter-based Firestore query
  const constraints: QueryConstraint[] = [];
  if (filters.sumber !== "all") {
    constraints.push(where("pendaftaran_melalui", "==", filters.sumber));
  }
  if (filters.kategori !== "all") {
    constraints.push(where("kategori", "==", filters.kategori));
  }
  // Status Filter: Selalu filter hanya peserta yang belum diambil
  constraints.push(where("status_pengambilan", "==", false));

  const q =
    constraints.length > 0
      ? query(collection(db, "peserta"), ...constraints)
      : query(collection(db, "peserta"));

  const snap = await getDocs(q);
  const items: Peserta[] = [];
  snap.forEach((docSnap) => {
    items.push({ id: docSnap.id, ...(docSnap.data() as Omit<Peserta, "id">) });
  });

  return applyLocalFilters(items, normQ, filters);
}

function applyLocalFilters(
  list: Peserta[],
  normQuery: string,
  filters: SearchFilters
): Peserta[] {
  const hasQuery = normQuery.length > 0;
  return list.filter((p) => {
    // 1. Status Filter: Selalu hanya yang belum diambil (status_pengambilan === false)
    if (p.status_pengambilan) return false;

    // 2. Kategori Filter
    if (filters.kategori !== "all" && p.kategori !== filters.kategori) return false;

    // 3. Sumber Filter
    if (filters.sumber !== "all" && p.pendaftaran_melalui !== filters.sumber) return false;

    // 4. Search Query (Name, BIB, NIK, Phone)
    if (hasQuery) {
      const pName = p.nama_search || normalizeSearchString(p.nama);
      const matchName = pName.includes(normQuery);
      const matchBib = p.bib && p.bib.toLowerCase().includes(normQuery);
      const matchNik = p.nik && p.nik.includes(normQuery);
      const matchPhone = p.no_hp && p.no_hp.includes(normQuery);
      return Boolean(matchName || matchBib || matchNik || matchPhone);
    }

    return true;
  });
}
