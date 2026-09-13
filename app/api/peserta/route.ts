import { NextResponse } from "next/server";
import { query } from "@/lib/db/mysql";
import { Peserta } from "@/types/peserta";
import { verifySession } from "@/lib/auth/session";

export async function GET(req: Request) {
  try {
    // Optional check: verify logged-in user
    const session = await verifySession();
    if (!session) {
      return NextResponse.json(
        { success: false, message: "Anda harus login untuk melihat data peserta." },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(req.url);
    const q = (searchParams.get("q") || "").trim().toLowerCase();
    const status = searchParams.get("status"); // "belum" | "sudah" | "all"
    const kategori = searchParams.get("kategori");
    const sumber = searchParams.get("sumber");

    const conditions: string[] = [];
    const params: any[] = [];

    // Filter Status Pengambilan
    if (status === "belum") {
      conditions.push("status_pengambilan = 0");
    } else if (status === "sudah") {
      conditions.push("status_pengambilan = 1");
    }

    // Filter Kategori
    if (kategori && kategori !== "all") {
      conditions.push("kategori = ?");
      params.push(kategori);
    }

    // Filter Sumber Pendaftaran
    if (sumber && sumber !== "all") {
      conditions.push("pendaftaran_melalui = ?");
      params.push(sumber);
    }

    // Search Query (BIB, NIK, No HP, No Telp 1/2, Email, Nama, Nama BIB)
    if (q) {
      conditions.push(
        "(bib = ? OR nik = ? OR no_hp = ? OR no_telp_1 = ? OR no_telp_2 = ? OR email = ? OR nama_bib LIKE ? OR nama_search LIKE ?)"
      );
      params.push(q, q, q, q, q, q, `%${q}%`, `%${q}%`);
    }

    const whereClause =
      conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

    const sql = `
      SELECT 
        id, no_urut, nama, nama_search, bib, no_bib, nama_bib, 
        kategori, nik, alamat, no_telp_1, no_telp_2, no_hp, 
        ukuran_jersey, pendaftaran_melalui, daftar_melalui, 
        email, kode_1, kode_2, jenis_kelamin, tanggal_lahir, 
        status_pengambilan, waktu_pengambilan, petugas_id, petugas_nama, 
        is_kolektif, diambil_oleh, nik_pengambil, no_hp_pengambil, alamat_pengambil, catatan,
        bukti_bayar_path, bukti_bayar_original_name, bukti_bayar_size, bukti_bayar_mime, bukti_bayar_uploaded_at,
        surat_kuasa_path, surat_kuasa_original_name, surat_kuasa_size, surat_kuasa_mime, surat_kuasa_uploaded_at
      FROM peserta 
      ${whereClause}
      ORDER BY id ASC
    `;

    const rows = await query<any[]>(sql, params);

    const pesertaList: Peserta[] = rows.map((r) => ({
      id: r.id,
      no_urut: r.no_urut,
      nama: r.nama,
      nama_search: r.nama_search,
      bib: r.bib || "",
      no_bib: r.no_bib || r.bib || "",
      nama_bib: r.nama_bib || undefined,
      kategori: r.kategori,
      nik: r.nik || undefined,
      alamat: r.alamat || undefined,
      no_telp_1: r.no_telp_1 || undefined,
      no_telp_2: r.no_telp_2 || undefined,
      no_hp: r.no_hp || r.no_telp_1 || undefined,
      ukuran_jersey: r.ukuran_jersey || "L",
      pendaftaran_melalui: r.pendaftaran_melalui,
      daftar_melalui: r.daftar_melalui || r.pendaftaran_melalui,
      email: r.email || undefined,
      kode_1: r.kode_1 || undefined,
      kode_2: r.kode_2 || undefined,
      jenis_kelamin: r.jenis_kelamin || "-",
      tanggal_lahir: r.tanggal_lahir || undefined,
      status_pengambilan: Boolean(r.status_pengambilan),
      waktu_pengambilan: r.waktu_pengambilan || null,
      petugas_id: r.petugas_id || null,
      petugas_nama: r.petugas_nama || null,
      catatan: r.catatan || null,
      is_kolektif: Boolean(r.is_kolektif),
      diambil_oleh: r.diambil_oleh || undefined,
      nik_pengambil: r.nik_pengambil || undefined,
      no_hp_pengambil: r.no_hp_pengambil || undefined,
      alamat_pengambil: r.alamat_pengambil || undefined,
      bukti_bayar_path: r.bukti_bayar_path || null,
      bukti_bayar_original_name: r.bukti_bayar_original_name || null,
      surat_kuasa_path: r.surat_kuasa_path || null,
      surat_kuasa_original_name: r.surat_kuasa_original_name || null,
    }));

    return NextResponse.json({
      success: true,
      total: pesertaList.length,
      data: pesertaList,
    });
  } catch (error: any) {
    console.error("Peserta API error:", error.message || error);
    return NextResponse.json(
      { success: false, message: "Gagal memuat data peserta dari MySQL." },
      { status: 500 }
    );
  }
}
