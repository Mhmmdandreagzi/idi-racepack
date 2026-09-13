/**
 * Document upload service for proof of payment and proxy letters.
 * Strictly adheres to AGENTS.md file rules and security boundaries.
 */

import { PesertaDokumen } from "@/types/peserta";

export interface UploadDocumentResponse {
  success: boolean;
  message: string;
  count?: number;
  metadata?: {
    filePath: string;
    originalName: string;
    fileSize: number;
    mimeType: string;
    uploadedAt: string;
  };
  documents?: Array<{
    filePath: string;
    originalName: string;
    fileSize: number;
    mimeType: string;
    uploadedAt: string;
  }>;
}

/**
 * Uploads one or multiple documents (bukti_bayar or surat_kuasa) for one or multiple participants.
 */
export async function uploadPesertaDocuments(
  pesertaIdOrIds: string | string[],
  category: "bukti_bayar" | "surat_kuasa",
  files: File | File[]
): Promise<UploadDocumentResponse> {
  const formData = new FormData();

  if (Array.isArray(pesertaIdOrIds)) {
    formData.append("pesertaIds", JSON.stringify(pesertaIdOrIds));
  } else {
    formData.append("pesertaId", pesertaIdOrIds);
  }

  formData.append("category", category);

  const fileList = Array.isArray(files) ? files : [files];
  for (const f of fileList) {
    formData.append("files", f);
  }

  const res = await fetch("/api/documents/upload", {
    method: "POST",
    body: formData,
  });

  const data = await res.json();

  if (!res.ok || !data.success) {
    throw new Error(data.message || "Gagal mengunggah dokumen.");
  }

  return data;
}

/**
 * Backward-compatible single document upload.
 */
export async function uploadPesertaDocument(
  pesertaIdOrIds: string | string[],
  category: "bukti_bayar" | "surat_kuasa",
  file: File
): Promise<UploadDocumentResponse> {
  return uploadPesertaDocuments(pesertaIdOrIds, category, [file]);
}

/**
 * Fetches the list of document attachments for a participant and category.
 */
export async function getPesertaDocuments(
  pesertaId: string,
  category: "bukti_bayar" | "surat_kuasa"
): Promise<PesertaDokumen[]> {
  try {
    const res = await fetch(`/api/documents/${pesertaId}/${category}?format=json`);
    if (!res.ok) return [];
    const data = await res.json();
    return data.documents || [];
  } catch (err) {
    console.error("Error fetching participant documents:", err);
    return [];
  }
}
