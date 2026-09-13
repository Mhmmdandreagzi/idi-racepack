import { NextResponse } from "next/server";
import crypto from "crypto";
import { requireAuth } from "@/lib/auth/session";
import { query, withTransaction } from "@/lib/db/mysql";

export async function POST(req: Request) {
  try {
    // Only Super Admin can reset all pickup data
    const superAdmin = await requireAuth(["superadmin"]);

    const body = await req.json();
    const { confirmationText } = body;

    // Strict validation of typed confirmation text
    if (confirmationText !== "RESET PENGAMBILAN") {
      return NextResponse.json(
        {
          success: false,
          message:
            'Teks konfirmasi salah. Anda harus mengetik persis "RESET PENGAMBILAN" untuk mengeksekusi reset.',
        },
        { status: 400 }
      );
    }

    // Ensure pengambilan.peserta_id is nullable if table was initialized with legacy NOT NULL constraint
    try {
      await query("ALTER TABLE pengambilan MODIFY COLUMN `peserta_id` VARCHAR(64) NULL");
    } catch {
      // Ignore if already nullable or restricted by DB permissions
    }

    let affectedRows = 0;

    await withTransaction(async (conn) => {
      const superAdminName =
        superAdmin.displayName || superAdmin.nama || "Super Admin";
      const superAdminEmail = superAdmin.email;
      const cancellationNote = ` [Dibatalkan via Reset Massal oleh Super Admin (${superAdminName} - ${superAdminEmail})]`;

      // 1. Mark existing active pengambilan records as DIBATALKAN to maintain historical audit consistency
      await conn.query(
        `UPDATE pengambilan 
         SET status = 'DIBATALKAN',
             keterangan = CONCAT(IFNULL(keterangan, ''), ?)
         WHERE status = 'BERHASIL'`,
        [cancellationNote]
      );

      // 2. Reset all participants pickup status
      const [resUpdate]: any = await conn.query(
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
             catatan = NULL`
      );

      affectedRows = resUpdate.affectedRows || 0;

      // 3. Insert system audit cancellation log (peserta_id = NULL passes foreign key constraint)
      const logId = `reset_all_${Date.now()}_${crypto.randomBytes(4).toString("hex")}`;
      await conn.query(
        `INSERT INTO pengambilan (
          id, peserta_id, petugas_id, petugas_nama, petugas_email, 
          waktu_pengambilan, status, is_kolektif, keterangan, created_at
        ) VALUES (?, NULL, ?, ?, ?, NOW(), 'RESET_MASSAL', 0, ?, NOW())`,
        [
          logId,
          superAdmin.uid,
          superAdminName,
          superAdminEmail,
          `Seluruh data pengambilan di-reset menjadi BELUM DIAMBIL oleh Super Admin (${superAdminName} - ${superAdminEmail})`,
        ]
      );
    });

    return NextResponse.json({
      success: true,
      message: `Berhasil mereset seluruh data pengambilan peserta (${affectedRows} data diperbarui).`,
      affectedRows,
    });
  } catch (error: any) {
    const status = error.statusCode || 500;
    return NextResponse.json(
      { success: false, message: error.message || "Gagal mereset data pengambilan." },
      { status }
    );
  }
}
