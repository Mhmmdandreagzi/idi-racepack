import fs from "fs";
import path from "path";
import crypto from "crypto";

const DEFAULT_STORAGE_DIR = path.join(process.cwd(), "storage");
const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB

export const ALLOWED_DOC_TYPES = {
  bukti_bayar: {
    extensions: [".jpg", ".jpeg", ".png", ".webp", ".pdf"],
    mimes: [
      "image/jpeg",
      "image/png",
      "image/webp",
      "application/pdf",
    ],
  },
  surat_kuasa: {
    extensions: [".pdf", ".jpg", ".jpeg", ".png"],
    mimes: [
      "application/pdf",
      "image/jpeg",
      "image/png",
    ],
  },
} as const;

export type DocumentCategory = keyof typeof ALLOWED_DOC_TYPES;

export interface StoredDocumentResult {
  filePath: string;
  originalName: string;
  fileSize: number;
  mimeType: string;
  uploadedAt: string;
}

/**
 * Returns the base storage directory from environment or default path.
 * Kept outside public/ to prevent direct HTTP exposure.
 */
export function getStorageDirectory(): string {
  const custom = process.env.STORAGE_DIR;
  if (custom) {
    return path.isAbsolute(custom) ? custom : path.join(/*turbopackIgnore: true*/ process.cwd(), custom);
  }
  return DEFAULT_STORAGE_DIR;
}

/**
 * Validates and securely saves an uploaded document file to Hostinger filesystem.
 */
export async function saveDocumentFile(
  pesertaId: string,
  category: DocumentCategory,
  file: File
): Promise<StoredDocumentResult> {
  if (!file) {
    throw new Error("File tidak ditemukan dalam request.");
  }

  // 1. Server-side size validation
  if (file.size > MAX_FILE_SIZE_BYTES) {
    throw new Error("File terlalu besar. Maksimum 5 MB.");
  }

  // 2. Validate MIME & Extension
  const config = ALLOWED_DOC_TYPES[category];
  if (!config) {
    throw new Error("Kategori dokumen tidak valid.");
  }

  const rawExt = path.extname(file.name).toLowerCase();
  if (!config.extensions.includes(rawExt as any)) {
    throw new Error(
      `Format ekstensi file "${rawExt}" tidak didukung. Format yang diizinkan: ${config.extensions.join(", ")}`
    );
  }

  const mime = file.type || "application/octet-stream";
  if (!config.mimes.includes(mime as any)) {
    throw new Error(`Format tipe MIME "${mime}" tidak didukung.`);
  }

  // 3. Prepare private storage directory for this participant
  const baseStorage = getStorageDirectory();
  const participantDir = path.join(baseStorage, "peserta", sanitizeId(pesertaId));
  if (!fs.existsSync(participantDir)) {
    fs.mkdirSync(participantDir, { recursive: true });
  }

  // 4. Generate random internal filename to prevent overwriting or directory traversal
  const randomSuffix = crypto.randomBytes(8).toString("hex");
  const safeFilename = `${category}_${Date.now()}_${randomSuffix}${rawExt}`;
  const targetFilePath = path.join(participantDir, safeFilename);

  // 5. Write file from buffer
  const buffer = Buffer.from(await file.arrayBuffer());
  fs.writeFileSync(targetFilePath, buffer);

  // Return metadata (relative path stored in MySQL)
  const relativePath = path.relative(baseStorage, targetFilePath).replace(/\\/g, "/");

  return {
    filePath: relativePath,
    originalName: file.name,
    fileSize: file.size,
    mimeType: mime,
    uploadedAt: new Date().toISOString(),
  };
}

/**
 * Safely resolves the absolute path of a stored document, verifying it does not escape storage.
 */
export function resolveDocumentPath(relativePath: string): string {
  const baseStorage = getStorageDirectory();
  const safeRelative = path.normalize(relativePath).replace(/^(\.\.(\/|\\|$))+/, "");
  const absolutePath = path.join(/*turbopackIgnore: true*/ baseStorage, safeRelative);

  // Prevent directory traversal
  if (!absolutePath.startsWith(baseStorage)) {
    throw new Error("Path file dokumen tidak valid.");
  }

  if (!fs.existsSync(/*turbopackIgnore: true*/ absolutePath)) {
    throw new Error("File dokumen tidak ditemukan di server.");
  }

  return absolutePath;
}

/**
 * Deletes a file from storage (e.g. if rollback or orphan cleanup is needed).
 */
export function deleteStoredFile(relativePath: string): void {
  try {
    const fullPath = resolveDocumentPath(relativePath);
    if (fs.existsSync(/*turbopackIgnore: true*/ fullPath)) {
      fs.unlinkSync(fullPath);
    }
  } catch (err) {
    console.warn("Failed to delete stored file:", err);
  }
}

function sanitizeId(id: string): string {
  return id.replace(/[^a-zA-Z0-9_-]/g, "");
}
