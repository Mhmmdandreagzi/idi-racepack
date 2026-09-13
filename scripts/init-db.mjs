import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import mysql from "mysql2/promise";
import bcrypt from "bcryptjs";
import xlsx from "xlsx";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, "..");

function normalizeSearchString(val) {
  if (!val) return "";
  return val.toString().toLowerCase().trim().replace(/\s+/g, " ");
}

// Load .env.local manually if running in Node script
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
  console.log("====================================================");
  console.log("🚀 RUN IDI RUN - Inisialisasi Database MySQL (Semua Kolom Excel)");
  console.log("====================================================");
  console.log(`📡 Menghubungkan ke MySQL ${dbUser}@${dbHost}:${dbPort}...`);

  let connection;
  try {
    connection = await mysql.createConnection({
      host: dbHost,
      port: dbPort,
      user: dbUser,
      password: dbPassword,
      multipleStatements: true,
    });
  } catch (err) {
    console.error("❌ Gagal terhubung ke MySQL server:", err.message);
    process.exit(1);
  }

  try {
    // 1. Create database
    console.log(`📁 Menyiapkan database \`${dbName}\`...`);
    await connection.query(
      `CREATE DATABASE IF NOT EXISTS \`${dbName}\` DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;`
    );
    await connection.changeUser({ database: dbName });

    // 2. Ensure schema & all columns exist
    console.log("📄 Menjalankan pembuatan / update tabel DDL (users, peserta, pengambilan)...");
    const schemaSql = fs.readFileSync(path.join(rootDir, "lib", "db", "schema.sql"), "utf-8");
    await connection.query(schemaSql);

    // Check & add columns dynamically if table was created previously without new columns
    const [cols] = await connection.query("SHOW COLUMNS FROM peserta");
    const existingColNames = new Set(cols.map((c) => c.Field));

    const newColumns = [
      { name: "no_urut", type: "INT DEFAULT NULL" },
      { name: "no_telp_1", type: "VARCHAR(32) DEFAULT NULL" },
      { name: "no_telp_2", type: "VARCHAR(32) DEFAULT NULL" },
      { name: "nama_bib", type: "VARCHAR(191) DEFAULT NULL" },
      { name: "no_bib", type: "VARCHAR(64) NOT NULL DEFAULT ''" },
      { name: "daftar_melalui", type: "VARCHAR(64) NOT NULL DEFAULT 'UMUM'" },
      { name: "email", type: "VARCHAR(191) DEFAULT NULL" },
      { name: "kode_1", type: "VARCHAR(128) DEFAULT NULL" },
      { name: "kode_2", type: "VARCHAR(128) DEFAULT NULL" },
    ];

    for (const col of newColumns) {
      if (!existingColNames.has(col.name)) {
        console.log(`   ➕ Menambahkan kolom '${col.name}' ke tabel peserta...`);
        await connection.query(`ALTER TABLE peserta ADD COLUMN \`${col.name}\` ${col.type}`);
      }
    }

    console.log("   ✓ Struktur tabel peserta lengkap dengan seluruh kolom Excel.");

    // Ensure pengambilan.peserta_id allows NULL for system/mass audit logs
    try {
      const [pengambilanCols] = await connection.query("SHOW COLUMNS FROM pengambilan");
      const pesertaIdCol = pengambilanCols.find((c) => c.Field === "peserta_id");
      if (pesertaIdCol && pesertaIdCol.Null === "NO") {
        console.log("   ➕ Mengubah kolom 'peserta_id' pada tabel pengambilan agar mendukung NULL...");
        await connection.query("ALTER TABLE pengambilan MODIFY COLUMN `peserta_id` VARCHAR(64) NULL");
      }
    } catch (colErr) {
      console.warn("   ⚠️ Peringatan saat memeriksa tabel pengambilan:", colErr.message);
    }

    // 3. Seed Users with Bcrypt Hashing
    console.log("👤 Mengisi / update akun default (Admin & Petugas)...");
    const usersJsonPath = path.join(rootDir, "data", "users.json");
    if (fs.existsSync(usersJsonPath)) {
      const rawUsers = JSON.parse(fs.readFileSync(usersJsonPath, "utf-8"));
      for (const u of rawUsers) {
        const hash = await bcrypt.hash(u.password, 10);
        await connection.query(
          `INSERT INTO users (id, email, password_hash, nama, role, is_active, created_at)
           VALUES (?, ?, ?, ?, ?, ?, NOW())
           ON DUPLICATE KEY UPDATE 
             nama = VALUES(nama),
             role = VALUES(role),
             is_active = VALUES(is_active);`,
          [u.uid, u.email.toLowerCase(), hash, u.displayName || u.nama, u.role, u.isActive ? 1 : 0]
        );
        console.log(`   ✓ User siap: ${u.email} (${u.role})`);
      }
    }

    // 4. Read Excel 'Normalisasi Data IDI.xlsx' and Seed All Columns
    const excelPath = path.join(rootDir, "Normalisasi Data IDI.xlsx");
    let rowsFromExcel = [];

    if (fs.existsSync(excelPath)) {
      console.log(`📊 Membaca seluruh kolom dari file Excel: "${path.basename(excelPath)}"...`);
      const workbook = xlsx.readFile(excelPath);
      const sheet = workbook.Sheets[workbook.SheetNames[0]];
      rowsFromExcel = xlsx.utils.sheet_to_json(sheet);
      console.log(`   ✓ Ditemukan ${rowsFromExcel.length} baris data di Excel.`);
    }

    if (rowsFromExcel.length > 0) {
      console.log("   ⚡ Melakukan sinkronisasi / import seluruh 15 kolom Excel ke MySQL...");

      const chunkSize = 200;
      for (let i = 0; i < rowsFromExcel.length; i += chunkSize) {
        const chunk = rowsFromExcel.slice(i, i + chunkSize);
        const values = chunk.map((r, idx) => {
          const noUrut = Number(r["No."]) || i + idx + 1;
          const id = `peserta_${String(noUrut).padStart(5, "0")}`;
          const nama = (r["NAMA"] || "Peserta").toString().trim();
          const namaSearch = normalizeSearchString(nama);
          const jenisKelamin = (r["Jenis Kelamin"] || "-").toString().trim().toUpperCase().slice(0, 1) || "-";
          const kategori = (r["Kategori"] || "Umum").toString().trim();
          const nik = r["NIK"] ? r["NIK"].toString().trim() : null;
          const alamat = r["Alamat"] ? r["Alamat"].toString().trim() : null;
          const noTelp1 = r["No Telp 1"] ? r["No Telp 1"].toString().trim() : null;
          const noTelp2 = r["No Telp 2"] ? r["No Telp 2"].toString().trim() : null;
          const noHp = noTelp1 || noTelp2 || null;
          const ukuranJersey = (r["Size Jersey"] || "L").toString().trim().toUpperCase() || "L";
          const noBib = r["No BIB"] !== undefined && r["No BIB"] !== null ? r["No BIB"].toString().trim() : "";
          const namaBib = r["Nama BIB"] ? r["Nama BIB"].toString().trim() : null;
          const daftarMelalui = (r["Daftar Melalui"] || "UMUM").toString().trim();
          const email = r["Email"] ? r["Email"].toString().trim().toLowerCase() : null;
          const kode1 = r["KODE 1"] ? r["KODE 1"].toString().trim() : null;
          const kode2 = r["KODE 2"] ? r["KODE 2"].toString().trim() : null;

          return [
            id,
            noUrut,
            nama,
            namaSearch,
            jenisKelamin,
            kategori,
            nik,
            alamat,
            noTelp1,
            noTelp2,
            noHp,
            ukuranJersey,
            noBib,
            noBib,
            namaBib,
            daftarMelalui,
            daftarMelalui,
            email,
            kode1,
            kode2,
          ];
        });

        await connection.query(
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
            kode_2 = VALUES(kode_2);`,
          [values]
        );

        console.log(`   ✓ Tersimpan ${Math.min(i + chunkSize, rowsFromExcel.length)} / ${rowsFromExcel.length} peserta`);
      }
    }

    console.log("====================================================");
    console.log("🎉 SELESAI! Seluruh 15 kolom Excel berhasil disimpan di MySQL.");
    console.log("====================================================");
  } catch (err) {
    console.error("❌ Terjadi kesalahan saat inisialisasi:", err);
    process.exit(1);
  } finally {
    if (connection) await connection.end();
  }
}

main();
