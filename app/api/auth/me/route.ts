import { NextResponse } from "next/server";
import { verifySession } from "@/lib/auth/session";
import { query } from "@/lib/db/mysql";

export async function GET() {
  try {
    const sessionUser = await verifySession();
    if (!sessionUser) {
      return NextResponse.json({ success: false, user: null }, { status: 401 });
    }

    // Verify user is still valid and active in MySQL
    const users = await query<any[]>(
      "SELECT id, email, nama, role, is_active FROM users WHERE id = ? LIMIT 1",
      [sessionUser.uid]
    );

    if (!users || users.length === 0 || !users[0].is_active) {
      return NextResponse.json({ success: false, user: null }, { status: 401 });
    }

    const u = users[0];
    return NextResponse.json({
      success: true,
      user: {
        uid: u.id,
        email: u.email,
        displayName: u.nama,
        nama: u.nama,
        role: u.role,
        isActive: Boolean(u.is_active),
        aktif: Boolean(u.is_active),
      },
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, user: null }, { status: 500 });
  }
}
