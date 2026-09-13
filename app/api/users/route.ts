import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { requireAuth } from "@/lib/auth/session";
import { query } from "@/lib/db/mysql";
import { AppUser } from "@/types/user";

export async function GET() {
  try {
    // Admin only
    await requireAuth(["admin"]);

    const rows = await query<any[]>(
      `SELECT id, email, nama, role, is_active, created_at 
       FROM users 
       ORDER BY created_at ASC`
    );

    const users: AppUser[] = rows.map((u) => ({
      uid: u.id,
      email: u.email,
      displayName: u.nama,
      nama: u.nama,
      role: u.role,
      isActive: Boolean(u.is_active),
      aktif: Boolean(u.is_active),
      createdAt: u.created_at,
    }));

    return NextResponse.json({ success: true, data: users });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, message: err.message || "Gagal memuat data user." },
      { status: 403 }
    );
  }
}

export async function POST(req: Request) {
  try {
    await requireAuth(["admin"]);

    const body = await req.json();
    const email = (body.email || "").trim().toLowerCase();
    const displayName = (body.displayName || body.nama || "").trim();
    const role = body.role === "admin" ? "admin" : "petugas";
    const rawPassword = body.password ? body.password.trim() : "petugas123";

    if (!email || !displayName) {
      return NextResponse.json(
        { success: false, message: "Email dan nama lengkap wajib diisi." },
        { status: 400 }
      );
    }

    // Check email uniqueness
    const existing = await query<any[]>(
      "SELECT id FROM users WHERE LOWER(email) = ? LIMIT 1",
      [email]
    );

    if (existing && existing.length > 0) {
      return NextResponse.json(
        { success: false, message: "Email tersebut sudah terdaftar." },
        { status: 400 }
      );
    }

    const userId = `user_${Date.now()}`;
    const passwordHash = await bcrypt.hash(rawPassword, 10);

    await query(
      `INSERT INTO users (id, email, password_hash, nama, role, is_active, created_at)
       VALUES (?, ?, ?, ?, ?, 1, NOW())`,
      [userId, email, passwordHash, displayName, role]
    );

    const newUser: AppUser = {
      uid: userId,
      email,
      displayName,
      nama: displayName,
      role,
      isActive: true,
      aktif: true,
      createdAt: new Date().toISOString(),
    };

    return NextResponse.json({ success: true, data: newUser });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, message: err.message || "Gagal membuat user baru." },
      { status: 500 }
    );
  }
}
