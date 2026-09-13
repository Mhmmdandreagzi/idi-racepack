import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth/session";
import { query } from "@/lib/db/mysql";

export async function PATCH(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const adminUser = await requireAuth(["admin"]);
    const { id } = await context.params;

    if (id === adminUser.uid) {
      return NextResponse.json(
        { success: false, message: "Tidak dapat menonaktifkan akun sendiri." },
        { status: 400 }
      );
    }

    // Toggle is_active status
    await query(
      "UPDATE users SET is_active = NOT is_active WHERE id = ?",
      [id]
    );

    return NextResponse.json({ success: true, message: "Status user berhasil diperbarui." });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, message: err.message || "Gagal memperbarui status user." },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const adminUser = await requireAuth(["admin"]);
    const { id } = await context.params;

    if (id === adminUser.uid) {
      return NextResponse.json(
        { success: false, message: "Tidak dapat menghapus akun admin yang sedang login." },
        { status: 400 }
      );
    }

    await query("DELETE FROM users WHERE id = ?", [id]);

    return NextResponse.json({ success: true, message: "Akun user berhasil dihapus." });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, message: err.message || "Gagal menghapus user." },
      { status: 500 }
    );
  }
}
