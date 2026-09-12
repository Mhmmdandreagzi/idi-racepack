import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { initializeApp } from "firebase/app";
import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  updateProfile,
} from "firebase/auth";
import { getFirestore, doc, setDoc, serverTimestamp } from "firebase/firestore";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, "..");

// 1. Read .env.local
const envPath = path.join(rootDir, ".env.local");
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

const firebaseConfig = {
  apiKey: env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

const ACCOUNTS = [
  {
    email: "admin@racepack.com",
    password: "admin123",
    displayName: "Admin Utama",
    role: "admin",
  },
  {
    email: "petugas@racepack.com",
    password: "petugas123",
    displayName: "Petugas Meja 1",
    role: "petugas",
  },
];

async function setupAccount(acc) {
  console.log(`\n⏳ Memproses akun ${acc.role.toUpperCase()}: ${acc.email}...`);
  let user = null;

  // Try creating user in Firebase Auth
  try {
    const cred = await createUserWithEmailAndPassword(auth, acc.email, acc.password);
    user = cred.user;
    console.log(`   ✓ Berhasil mendaftarkan akun di Firebase Auth (UID: ${user.uid})`);
  } catch (err) {
    if (err.code === "auth/email-already-in-use") {
      console.log("   ℹ️ Akun sudah terdaftar di Firebase Auth, melakukan login...");
      const cred = await signInWithEmailAndPassword(auth, acc.email, acc.password);
      user = cred.user;
      console.log(`   ✓ Berhasil login (UID: ${user.uid})`);
    } else {
      console.error(`   ❌ Gagal registrasi/login Firebase Auth: ${err.message}`);
      return;
    }
  }

  // Update display name in Firebase Auth
  try {
    await updateProfile(user, { displayName: acc.displayName });
  } catch (e) {
    // Ignore if not updated
  }

  // Save/Update in Firestore 'users' collection
  try {
    const userRef = doc(db, "users", user.uid);
    await setDoc(
      userRef,
      {
        uid: user.uid,
        email: acc.email,
        displayName: acc.displayName,
        nama: acc.displayName,
        role: acc.role,
        isActive: true,
        aktif: true,
        updatedAt: serverTimestamp(),
        createdAt: new Date().toISOString(),
      },
      { merge: true }
    );
    console.log(`   ✓ Data role & profil berhasil disimpan di Firestore (users/${user.uid})`);
  } catch (fErr) {
    console.error(`   ❌ Gagal menyimpan di Firestore: ${fErr.message}`);
  }
}

async function main() {
  console.log("==================================================");
  console.log("🚀 MEMBUAT 2 AKUN: 1 ADMIN & 1 PETUGAS");
  console.log("==================================================");

  for (const acc of ACCOUNTS) {
    await setupAccount(acc);
  }

  console.log("\n==================================================");
  console.log("🎉 SELESAI! Detail akun siap digunakan:");
  console.log("1. ADMIN:");
  console.log("   Email   : admin@racepack.com");
  console.log("   Password: admin123");
  console.log("   Role    : admin");
  console.log("\n2. PETUGAS:");
  console.log("   Email   : petugas@racepack.com");
  console.log("   Password: petugas123");
  console.log("   Role    : petugas");
  console.log("==================================================");
  process.exit(0);
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
