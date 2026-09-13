import { RacepackStats } from "@/types/stats";

export interface CategoryStatItem {
  kategori: string;
  total: number;
  sudah: number;
  pct: number;
}

export interface StatsResponse {
  stats: RacepackStats;
  categories: CategoryStatItem[];
}

export async function getRacepackStats(totalFallback = 1161): Promise<RacepackStats> {
  try {
    const res = await fetch("/api/stats", {
      method: "GET",
      headers: { "Content-Type": "application/json" },
    });

    if (res.ok) {
      const data = await res.json();
      if (data.success && data.stats) {
        return data.stats;
      }
    }
  } catch (err) {
    console.warn("Error fetching MySQL stats:", err);
  }

  return {
    total: totalFallback,
    sudah_diambil: 0,
    belum_diambil: totalFallback,
    updated_at: null,
  };
}

export async function getDetailedStats(): Promise<StatsResponse> {
  try {
    const res = await fetch("/api/stats", {
      method: "GET",
      headers: { "Content-Type": "application/json" },
    });

    if (res.ok) {
      const data = await res.json();
      if (data.success) {
        return {
          stats: data.stats,
          categories: data.categories || [],
        };
      }
    }
  } catch (err) {
    console.warn("Error fetching detailed stats:", err);
  }

  return {
    stats: {
      total: 1161,
      sudah_diambil: 0,
      belum_diambil: 1161,
      updated_at: null,
    },
    categories: [],
  };
}
