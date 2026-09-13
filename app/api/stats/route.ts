import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth/session";
import { query } from "@/lib/db/mysql";

export async function GET() {
  try {
    // Admin only or logged in users can view stats
    await requireAuth(["admin", "petugas"]);

    // Fast single aggregation query
    const [overall]: any = await query(
      `SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN status_pengambilan = 1 THEN 1 ELSE 0 END) as sudah_diambil
       FROM peserta`
    );

    const total = Number(overall?.total || 0);
    const sudah = Number(overall?.sudah_diambil || 0);
    const belum = Math.max(0, total - sudah);

    // Category breakdown directly from MySQL
    const categoryRows: any[] = await query(
      `SELECT 
        kategori,
        COUNT(*) as total,
        SUM(CASE WHEN status_pengambilan = 1 THEN 1 ELSE 0 END) as sudah
       FROM peserta
       GROUP BY kategori
       ORDER BY kategori ASC`
    );

    const categories = categoryRows.map((r) => {
      const cTotal = Number(r.total || 0);
      const cSudah = Number(r.sudah || 0);
      return {
        kategori: r.kategori || "Umum",
        total: cTotal,
        sudah: cSudah,
        pct: cTotal > 0 ? Math.round((cSudah / cTotal) * 100) : 0,
      };
    });

    return NextResponse.json({
      success: true,
      stats: {
        total,
        sudah_diambil: sudah,
        belum_diambil: belum,
        updated_at: new Date().toISOString(),
      },
      categories,
    });
  } catch (error: any) {
    console.error("Stats API error:", error);
    return NextResponse.json(
      { success: false, message: error.message || "Gagal memuat statistik." },
      { status: 500 }
    );
  }
}
