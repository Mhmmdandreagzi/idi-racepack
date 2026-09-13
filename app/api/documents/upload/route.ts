import { NextResponse } from "next/server";
import crypto from "crypto";
import { requireAuth } from "@/lib/auth/session";
import { query } from "@/lib/db/mysql";
import {
  saveDocumentFile,
  deleteStoredFile,
  DocumentCategory,
  StoredDocumentResult,
} from "@/lib/storage/documentStorage";

export async function POST(req: Request) {
  const savedRelativePaths: string[] = [];
  try {
    // 1. Check authentication & role
    await requireAuth(["admin", "petugas"]);

    // 2. Parse multipart form data
    const formData = await req.formData();
    const pesertaId = (formData.get("pesertaId") as string)?.trim();
    const rawPesertaIds = (formData.get("pesertaIds") as string)?.trim();
    const category = (formData.get("category") as DocumentCategory)?.trim();

    // Collect all uploaded files (single or multiple)
    const rawFilesList = formData.getAll("files") as File[];
    const singleFile = formData.get("file") as File | null;

    const filesToProcess: File[] = [];
    if (rawFilesList && rawFilesList.length > 0) {
      for (const f of rawFilesList) {
        if (f && typeof f === "object" && f.size > 0) {
          filesToProcess.push(f);
        }
      }
    }
    if (singleFile && typeof singleFile === "object" && singleFile.size > 0) {
      if (!filesToProcess.some((f) => f.name === singleFile.name && f.size === singleFile.size)) {
        filesToProcess.push(singleFile);
      }
    }

    let targetIds: string[] = [];
    if (pesertaId) {
      targetIds = [pesertaId];
    } else if (rawPesertaIds) {
      try {
        const parsed = JSON.parse(rawPesertaIds);
        if (Array.isArray(parsed)) {
          targetIds = parsed.map((id: any) => String(id).trim()).filter(Boolean);
        }
      } catch {
        targetIds = rawPesertaIds.split(",").map((s) => s.trim()).filter(Boolean);
      }
    }

    if (targetIds.length === 0 || !category || filesToProcess.length === 0) {
      return NextResponse.json(
        {
          success: false,
          message: "Parameter pesertaId / pesertaIds, category, dan minimal satu file wajib diisi.",
        },
        { status: 400 }
      );
    }

    if (category !== "bukti_bayar" && category !== "surat_kuasa") {
      return NextResponse.json(
        { success: false, message: "Kategori dokumen tidak valid." },
        { status: 400 }
      );
    }

    // 3. Verify participants exist
    const placeholders = targetIds.map(() => "?").join(",");
    const existing: any = await query(
      `SELECT id FROM peserta WHERE id IN (${placeholders})`,
      targetIds
    );
    if (!existing || existing.length === 0) {
      return NextResponse.json(
        { success: false, message: "Peserta tidak ditemukan." },
        { status: 404 }
      );
    }

    // 4. Save each file to private server storage (associated with first participant id)
    const primaryId = targetIds[0];
    const storedList: StoredDocumentResult[] = [];

    for (const file of filesToProcess) {
      const stored = await saveDocumentFile(primaryId, category, file);
      savedRelativePaths.push(stored.filePath);
      storedList.push(stored);

      // Insert into peserta_dokumen table for each participant
      for (const tId of targetIds) {
        await query(
          `INSERT INTO peserta_dokumen (id, peserta_id, category, file_path, original_name, file_size, mime_type, created_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            crypto.randomUUID(),
            tId,
            category,
            stored.filePath,
            stored.originalName,
            stored.fileSize,
            stored.mimeType,
            stored.uploadedAt,
          ]
        );
      }
    }

    // 5. Update primary metadata in peserta table (using the first file for backward compatibility)
    const firstStored = storedList[0];
    if (category === "bukti_bayar") {
      await query(
        `UPDATE peserta 
         SET bukti_bayar_path = ?,
             bukti_bayar_original_name = ?,
             bukti_bayar_size = ?,
             bukti_bayar_mime = ?,
             bukti_bayar_uploaded_at = ?
         WHERE id IN (${placeholders})`,
        [
          firstStored.filePath,
          firstStored.originalName,
          firstStored.fileSize,
          firstStored.mimeType,
          firstStored.uploadedAt,
          ...targetIds,
        ]
      );
    } else {
      await query(
        `UPDATE peserta 
         SET surat_kuasa_path = ?,
             surat_kuasa_original_name = ?,
             surat_kuasa_size = ?,
             surat_kuasa_mime = ?,
             surat_kuasa_uploaded_at = ?
         WHERE id IN (${placeholders})`,
        [
          firstStored.filePath,
          firstStored.originalName,
          firstStored.fileSize,
          firstStored.mimeType,
          firstStored.uploadedAt,
          ...targetIds,
        ]
      );
    }

    return NextResponse.json({
      success: true,
      message: `${storedList.length} berkas ${
        category === "bukti_bayar" ? "bukti pembayaran" : "surat kuasa"
      } berhasil diunggah (${targetIds.length} peserta).`,
      count: storedList.length,
      metadata: firstStored,
      documents: storedList,
      targetIds,
    });
  } catch (err: any) {
    // Clean up orphan files if database update fails
    for (const p of savedRelativePaths) {
      deleteStoredFile(p);
    }
    console.error("Document upload error:", err.message || err);
    return NextResponse.json(
      { success: false, message: err.message || "Gagal mengunggah dokumen." },
      { status: 400 }
    );
  }
}
