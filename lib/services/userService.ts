import { AppUser, UserRole, UserAccount } from "@/types/user";
import hardcodedUsers from "@/data/users.json";

/**
 * Returns all system users loaded directly from data/users.json
 */
export async function getAllUsers(): Promise<AppUser[]> {
  return (hardcodedUsers as UserAccount[]).map(({ password: _, ...u }) => u);
}

export async function createUser(data: {
  email: string;
  displayName: string;
  role: UserRole;
}): Promise<AppUser> {
  const newUser: AppUser = {
    uid: `user_${Date.now()}`,
    email: data.email.trim().toLowerCase(),
    displayName: data.displayName.trim(),
    nama: data.displayName.trim(),
    role: data.role,
    isActive: true,
    aktif: true,
    createdAt: new Date().toISOString(),
  };
  return newUser;
}

export async function toggleUserStatus(uid: string): Promise<boolean> {
  return true;
}

export async function deleteUser(uid: string): Promise<boolean> {
  return true;
}
