import { AppUser, UserRole } from "@/types/user";

/**
 * Returns all system users from MySQL backend
 */
export async function getAllUsers(): Promise<AppUser[]> {
  try {
    const res = await fetch("/api/users", {
      method: "GET",
      headers: { "Content-Type": "application/json" },
    });

    if (res.ok) {
      const json = await res.json();
      if (json.success && Array.isArray(json.data)) {
        return json.data;
      }
    }
  } catch (err) {
    console.error("Failed fetching users from MySQL:", err);
  }
  return [];
}

export async function createUser(data: {
  email: string;
  displayName: string;
  role: UserRole;
  password?: string;
}): Promise<AppUser> {
  const res = await fetch("/api/users", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });

  const json = await res.json();
  if (!res.ok || !json.success) {
    throw new Error(json.message || "Gagal membuat user baru.");
  }

  return json.data;
}

export async function toggleUserStatus(uid: string): Promise<boolean> {
  const res = await fetch(`/api/users/${uid}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
  });

  const json = await res.json();
  if (!res.ok || !json.success) {
    throw new Error(json.message || "Gagal mengubah status user.");
  }

  return true;
}

export async function deleteUser(uid: string): Promise<boolean> {
  const res = await fetch(`/api/users/${uid}`, {
    method: "DELETE",
    headers: { "Content-Type": "application/json" },
  });

  const json = await res.json();
  if (!res.ok || !json.success) {
    throw new Error(json.message || "Gagal menghapus user.");
  }

  return true;
}
