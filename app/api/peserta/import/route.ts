import { NextResponse } from "next/server";
import * as xlsx from "xlsx";
import { requireAuth } from "@/lib/auth/session";
import { withTransaction } from "@/lib/db/mysql";
import { normalizeSearchString } from "@/types/peserta";

export async function POST(req: Request) {
  try {
    // Only Super Admin can import participant dataset
    await requireAuth(["superadmin"]);

    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json(
        { success: false, message: "File Excel/CSV wajib diunggah." },
        { status: 400 }
      );
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const workbook = xlsx.read(buffer, { type: "buffer" });
    const sheetName = workbook.SheetNames[0];
    if (!sheetName) {
      return NextResponse.json(
        { success: false, message: "File tidak memiliki sheet data." },
        { status: 400 }
      );
    }

    const rawRows = xlsx.utils.sheet_to_json<any>(workbook.Sheets[sheetName]);
    if (!rawRows || rawRows.length === 0) {
      return NextResponse.json(
        { success: false, message: "Data sheet kosong atau tidak dapat dibaca." },
        { status: 400 }
      );
    }

    let importedCount = 0;

    await withTransaction(async (conn) => {
      // Process in chunks of 200
      const chunkSize = 200;
      for (let i = 0; i < rawRows.length; i += chunkSize) {
        const chunk = rawRows.slice(i, i + chunkSize);
        const values = chunk.map((r, idx) => {
          const noUrut = Number(r["No."] || r.no_urut) || i + idx + 1;
          const generatedId = r.id || r.ID || `peserta_${String(noUrut).padStart(5, "0")}`;
          const nama = (r["NAMA"] || r.nama || r.Nama || "Peserta").toString().trim();
          const bib = r["No BIB"] !== undefined && r["No BIB"] !== null ? r["No BIB"].toString().trim() : (r.bib || "").toString().trim();
          const kategori = (r["Kategori"] || r.kategori || "Umum").toString().trim();
          const nik = r["NIK"] ? r["NIK"].toString().trim() : (r.nik ? r.nik.toString().trim() : null);
          const alamat = r["Alamat"] ? r["Alamat"].toString().trim() : (r.alamat ? r.alamat.toString().trim() : null);
          const noTelp1 = r["No Telp 1"] ? r["No Telp 1"].toString().trim() : (r.no_telp_1 ? r.no_telp_1.toString().trim() : null);
          const noTelp2 = r["No Telp 2"] ? r["No Telp 2"].toString().trim() : (r.no_telp_2 ? r.no_telp_2.toString().trim() : null);
          const noHp = noTelp1 || noTelp2 || (r.no_hp ? r.no_hp.toString().trim() : null);
          const gender = (r["Jenis Kelamin"] || r.jenis_kelamin || r.gender || "-").toString().trim().toUpperCase().slice(0, 1) || "-";
          const ukuranJersey = (r["Size Jersey"] || r.ukuran_jersey || "L").toString().trim().toUpperCase() || "L";
          const namaBib = r["Nama BIB"] ? r["Nama BIB"].toString().trim() : (r.nama_bib ? r.nama_bib.toString().trim() : null);
          const sumber = (r["Daftar Melalui"] || r.pendaftaran_melalui || "UMUM").toString().trim();
          const email = r["Email"] ? r["Email"].toString().trim().toLowerCase() : (r.email ? r.email.toString().trim().toLowerCase() : null);
          const kode1 = r["KODE 1"] ? r["KODE 1"].toString().trim() : (r.kode_1 ? r.kode_1.toString().trim() : null);
          const kode2 = r["KODE 2"] ? r["KODE 2"].toString().trim() : (r.kode_2 ? r.kode_2.toString().trim() : null);

          return [
            generatedId,
            noUrut,
            nama,
            normalizeSearchString(nama),
            gender,
            kategori,
            nik,
            alamat,
            noTelp1,
            noTelp2,
            noHp,
            ukuranJersey,
            bib,
            bib,
            namaBib,
            sumber,
            sumber,
            email,
            kode1,
            kode2,
          ];
        });

        await conn.query(
          `INSERT INTO peserta (
            id, no_urut, nama, nama_search, jenis_kelamin, kategori, nik, alamat,
            no_telp_1, no_telp_2, no_hp, ukuran_jersey, bib, no_bib, nama_bib,
            pendaftaran_melalui, daftar_melalui, email, kode_1, kode_2
          ) VALUES ? 
          ON DUPLICATE KEY UPDATE
            no_urut = VALUES(no_urut),
            nama = VALUES(nama),
            nama_search = VALUES(nama_search),
            jenis_kelamin = VALUES(jenis_kelamin),
            kategori = VALUES(kategori),
            nik = VALUES(nik),
            alamat = VALUES(alamat),
            no_telp_1 = VALUES(no_telp_1),
            no_telp_2 = VALUES(no_telp_2),
            no_hp = VALUES(no_hp),
            ukuran_jersey = VALUES(ukuran_jersey),
            bib = VALUES(bib),
            no_bib = VALUES(no_bib),
            nama_bib = VALUES(nama_bib),
            pendaftaran_melalui = VALUES(pendaftaran_melalui),
            daftar_melalui = VALUES(daftar_melalui),
            email = VALUES(email),
            kode_1 = VALUES(kode_1),
            kode_2 = VALUES(kode_2)`,
          [values]
        );

        importedCount += chunk.length;
      }
    });

    return NextResponse.json({
      success: true,
      message: `Berhasil mengimpor / memperbarui ${importedCount} data peserta ke MySQL.`,
      count: importedCount,
    });
  } catch (error: any) {
    console.error("Import error:", error);
    return NextResponse.json(
      { success: false, message: error.message || "Gagal mengimpor data peserta." },
      { status: 500 }
    );
  }
}
