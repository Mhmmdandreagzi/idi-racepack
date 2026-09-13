import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { query } from "@/lib/db/mysql";
import { createSession } from "@/lib/auth/session";
import { AppUser } from "@/types/user";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const email = (body.email || "").trim().toLowerCase();
    const password = (body.password || "").trim();

    if (!email || !password) {
      return NextResponse.json(
        { success: false, error: "Email dan password wajib diisi." },
        { status: 400 }
      );
    }

    // Query user from MySQL
    const users = await query<any[]>(
      "SELECT id, email, password_hash, nama, role, is_active FROM users WHERE LOWER(email) = ? LIMIT 1",
      [email]
    );

    if (!users || users.length === 0) {
      return NextResponse.json(
        { success: false, error: "Email tidak terdaftar dalam sistem." },
        { status: 401 }
      );
    }

    const dbUser = users[0];

    // Check active status
    if (!dbUser.is_active) {
      return NextResponse.json(
        { success: false, error: "Akun ini telah dinonaktifkan oleh administrator." },
        { status: 403 }
      );
    }

    // Verify bcrypt hash
    const isMatch = await bcrypt.compare(password, dbUser.password_hash);
    if (!isMatch) {
      return NextResponse.json(
        { success: false, error: "Password yang Anda masukkan salah." },
        { status: 401 }
      );
    }

    const appUser: AppUser = {
      uid: dbUser.id,
      email: dbUser.email,
      displayName: dbUser.nama,
      nama: dbUser.nama,
      role: dbUser.role,
      isActive: Boolean(dbUser.is_active),
      aktif: Boolean(dbUser.is_active),
    };

    // Set secure HTTP-only cookie
    await createSession(appUser);

    return NextResponse.json({
      success: true,
      user: appUser,
    });
  } catch (error: any) {
    console.error("Login route error:", error.message || error);
    return NextResponse.json(
      { success: false, error: "Gagal memproses autentikasi. Pastikan koneksi database tersedia." },
      { status: 500 }
    );
  }
}
