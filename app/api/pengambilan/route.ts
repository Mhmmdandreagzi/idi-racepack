import { NextResponse } from "next/server";
import crypto from "crypto";
import { requireAuth } from "@/lib/auth/session";
import { withTransaction } from "@/lib/db/mysql";
import { Peserta } from "@/types/peserta";

export async function POST(req: Request) {
  try {
    // 1. Server-side session & role verification
    const currentUser = await requireAuth(["admin", "petugas"]);

    const body = await req.json();
    const { pesertaId } = body;

    if (!pesertaId) {
      return NextResponse.json(
        { success: false, message: "ID Peserta wajib disertakan." },
        { status: 400 }
      );
    }

    const petugasNama = currentUser.displayName || currentUser.nama || currentUser.email || "Petugas";

    // 2. Execute atomic transaction with row-locking (SELECT ... FOR UPDATE)
    const result = await withTransaction(async (conn) => {
      // Step A: Lock and check current participant status
      const [rows]: any = await conn.query(
        `SELECT 
          id, nama, nama_search, bib, kategori, nik, no_hp, 
          jenis_kelamin, tanggal_lahir, alamat, ukuran_jersey, 
          pendaftaran_melalui, status_pengambilan, waktu_pengambilan, 
          petugas_id, petugas_nama, catatan
        FROM peserta 
        WHERE id = ? 
        FOR UPDATE`,
        [pesertaId]
      );

      if (!rows || rows.length === 0) {
        const err: any = new Error("Peserta tidak ditemukan.");
        err.statusCode = 404;
        throw err;
      }

      const p = rows[0];

      // Step B: Double-pickup check
      if (p.status_pengambilan) {
        const err: any = new Error(
          `Racepack peserta "${p.nama}" (BIB: ${p.bib || "-"}) sudah diambil sebelumnya.`
        );
        err.statusCode = 409;
        throw err;
      }

      // Step C: Update status pengambilan in peserta table using server timestamp (NOW())
      await conn.query(
        `UPDATE peserta 
         SET status_pengambilan = 1,
             waktu_pengambilan = NOW(),
             petugas_id = ?,
             petugas_nama = ?
         WHERE id = ?`,
        [currentUser.uid, petugasNama, pesertaId]
      );

      // Step D: Insert into audit pengambilan log
      const logId = `log_${Date.now()}_${crypto.randomBytes(4).toString("hex")}`;
      await conn.query(
        `INSERT INTO pengambilan (
          id, peserta_id, petugas_id, petugas_nama, petugas_email, 
          waktu_pengambilan, status, is_kolektif, keterangan, created_at
        ) VALUES (?, ?, ?, ?, ?, NOW(), 'BERHASIL', 0, ?, NOW())`,
        [
          logId,
          pesertaId,
          currentUser.uid,
          petugasNama,
          currentUser.email,
          "Pengambilan mandiri di meja registrasi",
        ]
      );

      // Fetch the updated row to get the exact database timestamp
      const [updatedRows]: any = await conn.query(
        `SELECT * FROM peserta WHERE id = ?`,
        [pesertaId]
      );

      return updatedRows[0];
    });

    const updatedPeserta: Peserta = {
      id: result.id,
      nama: result.nama,
      nama_search: result.nama_search,
      bib: result.bib || "",
      kategori: result.kategori,
      nik: result.nik || undefined,
      no_hp: result.no_hp || undefined,
      jenis_kelamin: result.jenis_kelamin || "-",
      tanggal_lahir: result.tanggal_lahir || undefined,
      alamat: result.alamat || undefined,
      ukuran_jersey: result.ukuran_jersey || "L",
      pendaftaran_melalui: result.pendaftaran_melalui,
      status_pengambilan: Boolean(result.status_pengambilan),
      waktu_pengambilan: result.waktu_pengambilan,
      petugas_id: result.petugas_id,
      petugas_nama: result.petugas_nama,
      catatan: result.catatan,
    };

    return NextResponse.json({
      success: true,
      message: "Racepack berhasil diambil!",
      peserta: updatedPeserta,
      waktu: updatedPeserta.waktu_pengambilan,
      petugasNama: updatedPeserta.petugas_nama,
    });
  } catch (error: any) {
    console.error("Pickup transaction error:", error.message || error);
    const status = error.statusCode || 500;
    return NextResponse.json(
      {
        success: false,
        message: error.message || "Gagal memproses pengambilan racepack.",
      },
      { status }
    );
  }
}
