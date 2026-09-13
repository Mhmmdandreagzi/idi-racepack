import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import mysql from "mysql2/promise";
import bcrypt from "bcryptjs";
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

  // 1. Modify users.role column to VARCHAR(32) to allow 'superadmin'
  await conn.query(`ALTER TABLE \`users\` MODIFY COLUMN \`role\` VARCHAR(32) NOT NULL DEFAULT 'petugas'`);
  console.log("Column users.role updated to VARCHAR(32).");

  // 2. Hash password for super admin
  const superPassword = "superadmin123";
  const superPasswordHash = await bcrypt.hash(superPassword, 10);
  const superEmail = "superadmin@racepack.com";
  const superName = "Super Admin IDI";
  const superId = "superadmin-001";

  // Check if superadmin already exists
  const [existing] = await conn.query(`SELECT id FROM users WHERE email = ?`, [superEmail]);

  if (existing.length > 0) {
    await conn.query(
      `UPDATE users SET password_hash = ?, nama = ?, role = 'superadmin', is_active = 1 WHERE email = ?`,
      [superPasswordHash, superName, superEmail]
    );
    console.log(`Account ${superEmail} updated to superadmin successfully.`);
  } else {
    await conn.query(
      `INSERT INTO users (id, email, password_hash, nama, role, is_active, created_at, updated_at)
       VALUES (?, ?, ?, ?, 'superadmin', 1, NOW(), NOW())`,
      [superId, superEmail, superPasswordHash, superName]
    );
    console.log(`Account ${superEmail} created with role superadmin successfully.`);
  }

  await conn.end();
}

main().catch((err) => {
  console.error("Failed to seed super admin:", err);
  process.exit(1);
});
