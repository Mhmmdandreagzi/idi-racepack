import { NextResponse } from "next/server";
import crypto from "crypto";
import { requireAuth } from "@/lib/auth/session";
import { withTransaction } from "@/lib/db/mysql";

export async function POST(req: Request) {
  try {
    // Admin or Super Admin can reset
    const adminUser = await requireAuth(["admin"]);

    const body = await req.json();
    const { pesertaId, confirmationText } = body;

    if (!pesertaId) {
      return NextResponse.json(
        { success: false, message: "ID Peserta wajib diisi." },
        { status: 400 }
      );
    }

    if (confirmationText && confirmationText !== "BATALKAN") {
      return NextResponse.json(
        { success: false, message: 'Teks konfirmasi harus persis bertuliskan "BATALKAN".' },
        { status: 400 }
      );
    }

    await withTransaction(async (conn) => {
      const [rows]: any = await conn.query(
        "SELECT * FROM peserta WHERE id = ? FOR UPDATE",
        [pesertaId]
      );

      if (!rows || rows.length === 0) {
        const err: any = new Error("Peserta tidak ditemukan.");
        err.statusCode = 404;
        throw err;
      }

      const p = rows[0];

      await conn.query(
        `UPDATE peserta 
         SET status_pengambilan = 0,
             waktu_pengambilan = NULL,
             petugas_id = NULL,
             petugas_nama = NULL,
             is_kolektif = 0,
             diambil_oleh = NULL,
             nik_pengambil = NULL,
             no_hp_pengambil = NULL,
             alamat_pengambil = NULL,
             catatan = NULL
         WHERE id = ?`,
        [pesertaId]
      );

      // Add cancellation audit record
      const logId = `log_${Date.now()}_${crypto.randomBytes(4).toString("hex")}`;
      await conn.query(
        `INSERT INTO pengambilan (
          id, peserta_id, petugas_id, petugas_nama, petugas_email, 
          waktu_pengambilan, status, is_kolektif, keterangan, created_at
        ) VALUES (?, ?, ?, ?, ?, NOW(), 'DIBATALKAN', 0, ?, NOW())`,
        [
          logId,
          pesertaId,
          adminUser.uid,
          adminUser.displayName || adminUser.nama || "Admin",
          adminUser.email,
          `Pengambilan dibatalkan oleh Admin (${adminUser.displayName || adminUser.email})`,
        ]
      );
    });

    return NextResponse.json({
      success: true,
      message: "Status pengambilan berhasil di-reset oleh Admin.",
    });
  } catch (error: any) {
    const status = error.statusCode || 500;
    return NextResponse.json(
      { success: false, message: error.message || "Gagal membatalkan pengambilan." },
      { status }
    );
  }
}
