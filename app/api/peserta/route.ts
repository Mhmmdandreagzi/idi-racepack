import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

export async function GET() {
  try {
    const filePath = path.join(process.cwd(), "data", "peserta.json");
    if (!fs.existsSync(filePath)) {
      return NextResponse.json({ success: false, message: "Data belum diinisialisasi", data: [] }, { status: 404 });
    }
    const raw = fs.readFileSync(filePath, "utf-8");
    const peserta = JSON.parse(raw);
    return NextResponse.json({
      success: true,
      total: peserta.length,
      data: peserta,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error.message || "Gagal memuat data peserta" },
      { status: 500 }
    );
  }
}
