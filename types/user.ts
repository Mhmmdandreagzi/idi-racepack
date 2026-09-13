export type UserRole = "superadmin" | "admin" | "petugas";

export interface AppUser {
  uid: string;
  email: string;
  displayName: string;
  nama?: string;
  role: UserRole;
  isActive: boolean;
  aktif?: boolean;
  createdAt?: string;
  lastLogin?: string;
}

export interface UserAccount extends AppUser {
  password: string;
}
