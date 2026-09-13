import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import mysql from "mysql2/promise";
import crypto from "crypto";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, "..");

function loadEnv() {
  const envPath = path.join(rootDir, ".env.local");
  if (fs.existsSync(envPath)) {
    const lines = fs.readFileSync(envPath, "utf-8").split("\n");
    for (const line of lines) {
      const trimmed = line.trim();
      if (trimmed && !trimmed.startsWith("#") && trimmed.includes("=")) {
        const [key, ...valParts] = trimmed.split("=");
        const val = valParts.join("=").trim().replace(/^["']|["']$/g, "");
        if (!process.env[key.trim()]) {
          process.env[key.trim()] = val;
        }
      }
    }
  }
}

loadEnv();

const dbHost = process.env.DB_HOST || "localhost";
const dbPort = Number(process.env.DB_PORT) || 3306;
const dbUser = process.env.DB_USER || "root";
const dbPassword = process.env.DB_PASSWORD || "";
const dbName = process.env.DB_NAME || "idi_racepack";

async function main() {
  const conn = await mysql.createConnection({
    host: dbHost,
    port: dbPort,
    user: dbUser,
    password: dbPassword,
    database: dbName,
  });

  console.log("Connected to MySQL database:", dbName);

  // 1. Create peserta_dokumen table
  await conn.query(`
    CREATE TABLE IF NOT EXISTS \`peserta_dokumen\` (
      \`id\` VARCHAR(64) NOT NULL,
      \`peserta_id\` VARCHAR(64) NOT NULL,
      \`category\` VARCHAR(32) NOT NULL,
      \`file_path\` VARCHAR(255) NOT NULL,
      \`original_name\` VARCHAR(255) NOT NULL,
      \`file_size\` INT NOT NULL DEFAULT 0,
      \`mime_type\` VARCHAR(64) NOT NULL DEFAULT 'application/octet-stream',
      \`created_at\` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (\`id\`),
      KEY \`idx_dokumen_peserta\` (\`peserta_id\`),
      KEY \`idx_dokumen_category\` (\`category\`),
      CONSTRAINT \`fk_dokumen_peserta\` FOREIGN KEY (\`peserta_id\`) REFERENCES \`peserta\` (\`id\`) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `);

  console.log("Table peserta_dokumen created or already exists.");

  // 2. Migrate existing documents from peserta table into peserta_dokumen if not present
  const [existingBukti] = await conn.query(`
    SELECT id, bukti_bayar_path, bukti_bayar_original_name, bukti_bayar_size, bukti_bayar_mime, bukti_bayar_uploaded_at
    FROM peserta
    WHERE bukti_bayar_path IS NOT NULL AND bukti_bayar_path != ''
  `);

  for (const row of existingBukti) {
    const [check] = await conn.query(
      `SELECT id FROM peserta_dokumen WHERE peserta_id = ? AND file_path = ?`,
      [row.id, row.bukti_bayar_path]
    );
    if (check.length === 0) {
      await conn.query(
        `INSERT INTO peserta_dokumen (id, peserta_id, category, file_path, original_name, file_size, mime_type, created_at)
         VALUES (?, ?, 'bukti_bayar', ?, ?, ?, ?, ?)`,
        [
          crypto.randomUUID(),
          row.id,
          row.bukti_bayar_path,
          row.bukti_bayar_original_name || "bukti_bayar",
          row.bukti_bayar_size || 0,
          row.bukti_bayar_mime || "image/jpeg",
          row.bukti_bayar_uploaded_at || new Date(),
        ]
      );
    }
  }

  const [existingKuasa] = await conn.query(`
    SELECT id, surat_kuasa_path, surat_kuasa_original_name, surat_kuasa_size, surat_kuasa_mime, surat_kuasa_uploaded_at
    FROM peserta
    WHERE surat_kuasa_path IS NOT NULL AND surat_kuasa_path != ''
  `);

  for (const row of existingKuasa) {
    const [check] = await conn.query(
      `SELECT id FROM peserta_dokumen WHERE peserta_id = ? AND file_path = ?`,
      [row.id, row.surat_kuasa_path]
    );
    if (check.length === 0) {
      await conn.query(
        `INSERT INTO peserta_dokumen (id, peserta_id, category, file_path, original_name, file_size, mime_type, created_at)
         VALUES (?, ?, 'surat_kuasa', ?, ?, ?, ?, ?)`,
        [
          crypto.randomUUID(),
          row.id,
          row.surat_kuasa_path,
          row.surat_kuasa_original_name || "surat_kuasa",
          row.surat_kuasa_size || 0,
          row.surat_kuasa_mime || "image/jpeg",
          row.surat_kuasa_uploaded_at || new Date(),
        ]
      );
    }
  }

  console.log("Existing document metadata synced to peserta_dokumen successfully.");
  await conn.end();
}

main().catch((err) => {
  console.error("Migration failed:", err);
  process.exit(1);
});
