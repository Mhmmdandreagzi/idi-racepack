import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth/session";
import { query } from "@/lib/db/mysql";
import { PengambilanLog } from "@/types/pengambilan";

export async function GET(req: Request) {
  try {
    // Both Admin and Petugas can view logs
    await requireAuth(["admin", "petugas"]);

    const { searchParams } = new URL(req.url);
    const limit = Math.min(Number(searchParams.get("limit")) || 100, 500);

    const sql = `
      SELECT 
        l.id, 
        l.peserta_id, 
        p.nama as peserta_nama, 
        p.bib as peserta_bib, 
        p.kategori as peserta_kategori, 
        p.pendaftaran_melalui,
        l.petugas_id, 
        l.petugas_nama, 
        l.petugas_email, 
        l.waktu_pengambilan, 
        l.status, 
        l.is_kolektif, 
        l.diambil_oleh, 
        l.nik_pengambil, 
        l.no_hp_pengambil, 
        l.alamat_pengambil, 
        l.keterangan
      FROM pengambilan l
      LEFT JOIN peserta p ON l.peserta_id = p.id
      ORDER BY l.waktu_pengambilan DESC
      LIMIT ?
    `;

    const rows = await query<any[]>(sql, [limit]);

    const logs: PengambilanLog[] = rows.map((r) => ({
      id: r.id,
      peserta_id: r.peserta_id || undefined,
      peserta_nama:
        r.peserta_nama ||
        (r.status === "RESET_MASSAL" ? "Seluruh Peserta (Reset Massal)" : "Peserta"),
      peserta_bib: r.peserta_bib || (r.status === "RESET_MASSAL" ? "SEMUA" : "-"),
      peserta_kategori: r.peserta_kategori || (r.status === "RESET_MASSAL" ? "Semua Kategori" : "-"),
      pendaftaran_melalui: r.pendaftaran_melalui || "-",
      petugas_id: r.petugas_id,
      petugas_nama: r.petugas_nama,
      petugas_email: r.petugas_email,
      waktu_pengambilan: r.waktu_pengambilan,
      status: r.status,
      keterangan: r.keterangan || undefined,
      is_kolektif: Boolean(r.is_kolektif),
      diambil_oleh: r.diambil_oleh || undefined,
      nik_pengambil: r.nik_pengambil || undefined,
      no_hp_pengambil: r.no_hp_pengambil || undefined,
      alamat_pengambil: r.alamat_pengambil || undefined,
    }));

    return NextResponse.json({
      success: true,
      data: logs,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error.message || "Gagal memuat log pengambilan." },
      { status: 500 }
    );
  }
}
