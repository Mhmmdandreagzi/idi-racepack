import { NextResponse } from "next/server";
import fs from "fs";
import { requireAuth } from "@/lib/auth/session";
import { query } from "@/lib/db/mysql";
import { resolveDocumentPath } from "@/lib/storage/documentStorage";

export async function GET(
  req: Request,
  context: { params: Promise<{ pesertaId: string; type: string }> }
) {
  try {
    // 1. Check session & role server-side
    await requireAuth(["admin", "petugas"]);

    const { pesertaId, type } = await context.params;

    if (type !== "bukti_bayar" && type !== "surat_kuasa") {
      return NextResponse.json(
        { success: false, message: "Tipe dokumen tidak valid." },
        { status: 400 }
      );
    }

    const url = new URL(req.url);
    const format = url.searchParams.get("format");
    const docId = url.searchParams.get("docId");

    // 2. If client requests JSON list of documents for this participant and category
    if (format === "json") {
      const docRows = await query<any[]>(
        `SELECT id, peserta_id, category, file_path, original_name, file_size, mime_type, created_at
         FROM peserta_dokumen
         WHERE peserta_id = ? AND category = ?
         ORDER BY created_at ASC`,
        [pesertaId, type]
      );

      // If peserta_dokumen has records, format them with view_url
      if (docRows && docRows.length > 0) {
        const documents = docRows.map((d, index) => ({
          id: d.id,
          peserta_id: d.peserta_id,
          category: d.category,
          original_name: d.original_name || `Dokumen #${index + 1}`,
          file_size: d.file_size,
          mime_type: d.mime_type,
          created_at: d.created_at,
          view_url: `/api/documents/${pesertaId}/${type}?docId=${d.id}`,
        }));

        return NextResponse.json({
          success: true,
          count: documents.length,
          documents,
        });
      }

      // Fallback to single document metadata from peserta table
      const pRows = await query<any[]>(
        `SELECT 
          bukti_bayar_path, bukti_bayar_mime, bukti_bayar_original_name, bukti_bayar_size, bukti_bayar_uploaded_at,
          surat_kuasa_path, surat_kuasa_mime, surat_kuasa_original_name, surat_kuasa_size, surat_kuasa_uploaded_at
         FROM peserta 
         WHERE id = ? 
         LIMIT 1`,
        [pesertaId]
      );

      if (pRows && pRows.length > 0) {
        const p = pRows[0];
        const path = type === "bukti_bayar" ? p.bukti_bayar_path : p.surat_kuasa_path;
        if (path) {
          return NextResponse.json({
            success: true,
            count: 1,
            documents: [
              {
                id: "legacy",
                peserta_id: pesertaId,
                category: type,
                original_name: (type === "bukti_bayar" ? p.bukti_bayar_original_name : p.surat_kuasa_original_name) || "Dokumen",
                file_size: (type === "bukti_bayar" ? p.bukti_bayar_size : p.surat_kuasa_size) || 0,
                mime_type: (type === "bukti_bayar" ? p.bukti_bayar_mime : p.surat_kuasa_mime) || "application/octet-stream",
                created_at: (type === "bukti_bayar" ? p.bukti_bayar_uploaded_at : p.surat_kuasa_uploaded_at) || new Date().toISOString(),
                view_url: `/api/documents/${pesertaId}/${type}`,
              },
            ],
          });
        }
      }

      return NextResponse.json({
        success: true,
        count: 0,
        documents: [],
      });
    }

    // 3. If a specific docId was requested
    if (docId) {
      const specific = await query<any[]>(
        `SELECT file_path, original_name, mime_type
         FROM peserta_dokumen
         WHERE id = ? AND peserta_id = ?
         LIMIT 1`,
        [docId, pesertaId]
      );

      if (specific && specific.length > 0) {
        const doc = specific[0];
        const absolutePath = resolveDocumentPath(doc.file_path);
        const fileBuffer = fs.readFileSync(absolutePath);

        return new Response(fileBuffer, {
          status: 200,
          headers: {
            "Content-Type": doc.mime_type || "application/octet-stream",
            "Content-Disposition": `inline; filename="${encodeURIComponent(doc.original_name || "document")}"`,
            "Cache-Control": "private, no-cache, no-store, must-revalidate",
          },
        });
      }
    }

    // 4. Default: Fetch primary document (or first record)
    const rows = await query<any[]>(
      `SELECT 
        bukti_bayar_path, bukti_bayar_mime, bukti_bayar_original_name,
        surat_kuasa_path, surat_kuasa_mime, surat_kuasa_original_name
       FROM peserta 
       WHERE id = ? 
       LIMIT 1`,
      [pesertaId]
    );

    if (!rows || rows.length === 0) {
      return NextResponse.json(
        { success: false, message: "Peserta tidak ditemukan." },
        { status: 404 }
      );
    }

    const p = rows[0];
    let filePath = type === "bukti_bayar" ? p.bukti_bayar_path : p.surat_kuasa_path;
    let mimeType = (type === "bukti_bayar" ? p.bukti_bayar_mime : p.surat_kuasa_mime) || "application/octet-stream";
    let originalName = (type === "bukti_bayar" ? p.bukti_bayar_original_name : p.surat_kuasa_original_name) || "document";

    // If no path in peserta table, try getting first from peserta_dokumen
    if (!filePath) {
      const docFirst = await query<any[]>(
        `SELECT file_path, original_name, mime_type
         FROM peserta_dokumen
         WHERE peserta_id = ? AND category = ?
         ORDER BY created_at ASC
         LIMIT 1`,
        [pesertaId, type]
      );
      if (docFirst && docFirst.length > 0) {
        filePath = docFirst[0].file_path;
        mimeType = docFirst[0].mime_type || mimeType;
        originalName = docFirst[0].original_name || originalName;
      }
    }

    if (!filePath) {
      return NextResponse.json(
        { success: false, message: "Dokumen ini belum diunggah untuk peserta ini." },
        { status: 404 }
      );
    }

    // Resolve absolute file path securely
    const absolutePath = resolveDocumentPath(filePath);
    const fileBuffer = fs.readFileSync(absolutePath);

    return new Response(fileBuffer, {
      status: 200,
      headers: {
        "Content-Type": mimeType,
        "Content-Disposition": `inline; filename="${encodeURIComponent(originalName)}"`,
        "Cache-Control": "private, no-cache, no-store, must-revalidate",
      },
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, message: err.message || "Gagal membuka dokumen." },
      { status: 403 }
    );
  }
}
