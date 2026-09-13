import { PengambilanLog } from "@/types/pengambilan";

export async function getRecentPickupLogs(maxCount = 100): Promise<PengambilanLog[]> {
  try {
    const res = await fetch(`/api/pengambilan/logs?limit=${maxCount}`, {
      method: "GET",
      headers: { "Content-Type": "application/json" },
    });

    if (res.ok) {
      const data = await res.json();
      if (data.success && Array.isArray(data.data)) {
        return data.data;
      }
    }
  } catch (err) {
    console.warn("Error fetching MySQL audit logs:", err);
  }

  return [];
}
