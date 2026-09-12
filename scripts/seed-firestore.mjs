import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { initializeApp } from "firebase/app";
import {
  getFirestore,
  writeBatch,
  doc,
  setDoc,
  serverTimestamp,
} from "firebase/firestore";
import { getAuth, signInWithEmailAndPassword } from "firebase/auth";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, "..");

// 1. Read .env.local manually
function loadEnv() {
  const envPath = path.join(rootDir, ".env.local");
  if (!fs.existsSync(envPath)) {
    console.error("❌ File .env.local tidak ditemukan!");
    console.error("👉 Silakan buat file .env.local dan isi konfigurasi Firebase Anda terlebih dahulu.");
    process.exit(1);
  }

  const content = fs.readFileSync(envPath, "utf-8");
  const env = {};
  content.split("\n").forEach((line) => {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) return;
    const eqIdx = trimmed.indexOf("=");
    if (eqIdx !== -1) {
      const key = trimmed.slice(0, eqIdx).trim();
      const val = trimmed.slice(eqIdx + 1).trim().replace(/^["']|["']$/g, "");
      env[key] = val;
    }
  });
  return env;
}

const env = loadEnv();

const firebaseConfig = {
  apiKey: env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

if (!firebaseConfig.apiKey || !firebaseConfig.projectId) {
  console.error("❌ Konfigurasi Firebase di .env.local belum lengkap!");
  console.error("Pastikan NEXT_PUBLIC_FIREBASE_API_KEY dan NEXT_PUBLIC_FIREBASE_PROJECT_ID telah diisi.");
  process.exit(1);
}

// 2. Initialize Firebase
console.log(`🚀 Menghubungkan ke Firebase Project: ${firebaseConfig.projectId}...`);
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

async function main() {
  // Check optional login args: node scripts/seed-firestore.mjs [admin_email] [admin_password]
  const args = process.argv.slice(2);
  const emailArg = args[0] || process.env.ADMIN_EMAIL;
  const passArg = args[1] || process.env.ADMIN_PASSWORD;

  if (emailArg && passArg) {
    console.log(`🔑 Mencoba login sebagai admin: ${emailArg}...`);
    try {
      const userCred = await signInWithEmailAndPassword(auth, emailArg, passArg);
      console.log(`✅ Berhasil login sebagai: ${userCred.user.email} (UID: ${userCred.user.uid})`);
    } catch (err) {
      console.warn(`⚠️ Gagal login Firebase Auth: ${err.message}. Melanjutkan operasi (jika rules mengizinkan)...`);
    }
  } else {
    console.log("ℹ️ Tidak ada argumen login admin (node scripts/seed-firestore.mjs <email> <password>).");
    console.log("   Pastikan Firestore Security Rules mengizinkan penulisan awal.");
  }

  // 3. Load peserta.json
  const dataPath = path.join(rootDir, "data", "peserta.json");
  if (!fs.existsSync(dataPath)) {
    console.error("❌ File data/peserta.json tidak ditemukan!");
    process.exit(1);
  }

  const raw = fs.readFileSync(dataPath, "utf-8");
  const participants = JSON.parse(raw);
  console.log(`📦 Memuat ${participants.length} data peserta yang telah dinormalisasi...`);

  // 4. Batch upload to 'peserta' collection (Chunk size 400, max Firestore limit is 500)
  const chunkSize = 400;
  const totalChunks = Math.ceil(participants.length / chunkSize);

  console.log(`⏳ Mengunggah ke koleksi 'peserta' dalam ${totalChunks} batch...`);

  for (let i = 0; i < participants.length; i += chunkSize) {
    const chunk = participants.slice(i, i + chunkSize);
    const batchNumber = Math.floor(i / chunkSize) + 1;
    const batch = writeBatch(db);

    chunk.forEach((peserta) => {
      const docRef = doc(db, "peserta", peserta.id);
      batch.set(docRef, {
        ...peserta,
        status_pengambilan: false,
        waktu_pengambilan: null,
        petugas_id: null,
        petugas_nama: null,
        catatan: null,
      });
    });

    await batch.commit();
    console.log(`   ✓ Batch ${batchNumber}/${totalChunks} tersimpan (${Math.min(i + chunkSize, participants.length)} / ${participants.length} data)`);
  }

  // 5. Initialize stats/racepack document
  console.log("📊 Menginisialisasi dokumen stats/racepack...");
  const statsRef = doc(db, "stats", "racepack");
  await setDoc(statsRef, {
    total: participants.length,
    sudah_diambil: 0,
    belum_diambil: participants.length,
    updated_at: serverTimestamp(),
  });
  console.log(`   ✓ stats/racepack berhasil diatur: total=${participants.length}, belum_diambil=${participants.length}`);

  // 6. Check users collection
  console.log("👥 Memeriksa koleksi 'users'...");
  try {
    const { getDocs, collection } = await import("firebase/firestore");
    const userSnaps = await getDocs(collection(db, "users"));
    if (!userSnaps.empty) {
      console.log(`   ✓ Koleksi 'users' sudah berisi ${userSnaps.size} user (termasuk admin). Melewati pembuatan user dummy.`);
    } else {
      console.log("   ℹ️ Koleksi 'users' kosong. Membuat akun placeholder...");
      const initialUsers = [
        {
          uid: "admin_utama",
          email: "admin@racepack.com",
          displayName: "Admin Utama",
          nama: "Admin Utama",
          role: "admin",
          isActive: true,
          aktif: true,
          createdAt: new Date().toISOString(),
        },
      ];
      for (const u of initialUsers) {
        const userRef = doc(db, "users", u.uid);
        await setDoc(userRef, u, { merge: true });
      }
      console.log("   ✓ User awal tersimpan di koleksi 'users'.");
    }
  } catch (uErr) {
    console.warn("   ⚠️ Gagal memeriksa koleksi users:", uErr.message);
  }

  console.log("\n🎉 SELESAI! Seluruh data berhasil disinkronkan ke Cloud Firestore.");
  process.exit(0);
}

main().catch((err) => {
  console.error("❌ Terjadi kesalahan saat seed Firestore:", err);
  process.exit(1);
});
