import { NextResponse } from "next/server";
import crypto from "crypto";
import { requireAuth } from "@/lib/auth/session";
import { withTransaction } from "@/lib/db/mysql";
import { Peserta } from "@/types/peserta";

export async function POST(req: Request) {
  try {
    const currentUser = await requireAuth(["admin", "petugas"]);

    const body = await req.json();
    const { pesertaIds, proxyData } = body;

    if (!Array.isArray(pesertaIds) || pesertaIds.length === 0) {
      return NextResponse.json(
        { success: false, message: "Daftar peserta yang diambilkan tidak boleh kosong." },
        { status: 400 }
      );
    }

    const cleanNama = (proxyData?.nama || "").trim();
    const cleanHp = (proxyData?.noHp || "").trim();
    const cleanAlamat = (proxyData?.alamat || "").trim();
    const cleanNik = (proxyData?.nik || "-").trim();

    if (!cleanNama) {
      return NextResponse.json(
        { success: false, message: "Identitas nama yang mengambilkan wajib diisi." },
        { status: 400 }
      );
    }
    if (!cleanHp) {
      return NextResponse.json(
        { success: false, message: "Nomor telepon yang mengambilkan wajib diisi." },
        { status: 400 }
      );
    }
    if (!cleanAlamat) {
      return NextResponse.json(
        { success: false, message: "Alamat yang mengambilkan wajib diisi." },
        { status: 400 }
      );
    }

    const petugasNama = currentUser.displayName || currentUser.nama || currentUser.email || "Petugas";
    const catatan = `Diwakilkan oleh ${cleanNama} (${cleanHp}) - ${cleanAlamat}`;

    // Execute atomic batch transaction
    const updatedPesertaList = await withTransaction(async (conn) => {
      // Step A: Lock all participants
      const placeholders = pesertaIds.map(() => "?").join(",");
      const [rows]: any = await conn.query(
        `SELECT id, nama, bib, kategori, pendaftaran_melalui, status_pengambilan 
         FROM peserta 
         WHERE id IN (${placeholders}) 
         FOR UPDATE`,
        pesertaIds
      );

      if (!rows || rows.length !== pesertaIds.length) {
        const err: any = new Error("Sebagian peserta tidak ditemukan di database.");
        err.statusCode = 404;
        throw err;
      }

      // Check if any participant is already claimed
      for (const p of rows) {
        if (p.status_pengambilan) {
          const err: any = new Error(
            `Peserta "${p.nama}" (BIB: ${p.bib || "-"}) sudah diambil sebelumnya.`
          );
          err.statusCode = 409;
          throw err;
        }
      }

      // Step B: Update all participants
      await conn.query(
        `UPDATE peserta 
         SET status_pengambilan = 1,
             waktu_pengambilan = NOW(),
             petugas_id = ?,
             petugas_nama = ?,
             is_kolektif = 1,
             diambil_oleh = ?,
             nik_pengambil = ?,
             no_hp_pengambil = ?,
             alamat_pengambil = ?,
             catatan = ?
         WHERE id IN (${placeholders})`,
        [
          currentUser.uid,
          petugasNama,
          cleanNama,
          cleanNik,
          cleanHp,
          cleanAlamat,
          catatan,
          ...pesertaIds,
        ]
      );

      // Step C: Insert audit log for each participant
      for (const p of rows) {
        const logId = `log_${Date.now()}_${crypto.randomBytes(4).toString("hex")}`;
        await conn.query(
          `INSERT INTO pengambilan (
            id, peserta_id, petugas_id, petugas_nama, petugas_email, 
            waktu_pengambilan, status, is_kolektif, diambil_oleh, 
            nik_pengambil, no_hp_pengambil, alamat_pengambil, keterangan, created_at
          ) VALUES (?, ?, ?, ?, ?, NOW(), 'BERHASIL', 1, ?, ?, ?, ?, ?, NOW())`,
          [
            logId,
            p.id,
            currentUser.uid,
            petugasNama,
            currentUser.email,
            cleanNama,
            cleanNik,
            cleanHp,
            cleanAlamat,
            `Pengambilan Kolektif Diwakilkan (${pesertaIds.length} peserta)`,
          ]
        );
      }

      // Fetch fresh updated rows
      const [freshRows]: any = await conn.query(
        `SELECT * FROM peserta WHERE id IN (${placeholders})`,
        pesertaIds
      );

      return freshRows;
    });

    const mapped: Peserta[] = updatedPesertaList.map((r: any) => ({
      id: r.id,
      nama: r.nama,
      nama_search: r.nama_search,
      bib: r.bib || "",
      kategori: r.kategori,
      nik: r.nik || undefined,
      no_hp: r.no_hp || undefined,
      jenis_kelamin: r.jenis_kelamin || "-",
      tanggal_lahir: r.tanggal_lahir || undefined,
      alamat: r.alamat || undefined,
      ukuran_jersey: r.ukuran_jersey || "L",
      pendaftaran_melalui: r.pendaftaran_melalui,
      status_pengambilan: Boolean(r.status_pengambilan),
      waktu_pengambilan: r.waktu_pengambilan,
      petugas_id: r.petugas_id,
      petugas_nama: r.petugas_nama,
      is_kolektif: Boolean(r.is_kolektif),
      diambil_oleh: r.diambil_oleh,
      nik_pengambil: r.nik_pengambil,
      no_hp_pengambil: r.no_hp_pengambil,
      alamat_pengambil: r.alamat_pengambil,
      catatan: r.catatan,
    }));

    const sampleWaktu = mapped[0]?.waktu_pengambilan || new Date().toISOString();

    return NextResponse.json({
      success: true,
      message: `Berhasil memproses pengambilan kolektif untuk ${mapped.length} peserta!`,
      updatedPeserta: mapped,
      proxyData: {
        nama: cleanNama,
        nik: cleanNik,
        noHp: cleanHp,
        alamat: cleanAlamat,
      },
      waktu: sampleWaktu,
      petugasNama,
    });
  } catch (error: any) {
    console.error("Collective pickup error:", error.message || error);
    const status = error.statusCode || 500;
    return NextResponse.json(
      {
        success: false,
        message: error.message || "Gagal memproses transaksi pengambilan kolektif.",
      },
      { status }
    );
  }
}
