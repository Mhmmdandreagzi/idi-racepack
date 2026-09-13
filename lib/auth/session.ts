import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { AppUser, UserRole } from "@/types/user";

export const SESSION_COOKIE_NAME = "idi_session";
const DEFAULT_SECRET = "run-idi-run-5k-2026-secure-session-secret-key";

function getSecretKey(): Uint8Array {
  const secret = process.env.SESSION_SECRET || DEFAULT_SECRET;
  return new TextEncoder().encode(secret);
}

export interface SessionPayload {
  uid: string;
  email: string;
  displayName: string;
  nama: string;
  role: UserRole;
  isActive: boolean;
  [key: string]: any;
}

/**
 * Signs a JWT session token and sets the HTTP-only secure cookie.
 */
export async function createSession(user: AppUser): Promise<string> {
  const secret = getSecretKey();
  const token = await new SignJWT({
    uid: user.uid,
    email: user.email,
    displayName: user.displayName || user.nama || "",
    nama: user.nama || user.displayName || "",
    role: user.role,
    isActive: user.isActive,
  })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(secret);

  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 7 * 24 * 60 * 60, // 7 days
  });

  return token;
}

/**
 * Reads and verifies the current session token from HTTP-only cookie.
 */
export async function verifySession(): Promise<AppUser | null> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
    if (!token) return null;

    const secret = getSecretKey();
    const { payload } = await jwtVerify(token, secret);

    if (!payload || !payload.uid || !payload.email) {
      return null;
    }

    return {
      uid: payload.uid as string,
      email: payload.email as string,
      displayName: (payload.displayName as string) || (payload.nama as string) || "",
      nama: (payload.nama as string) || (payload.displayName as string) || "",
      role: (payload.role as UserRole) || "petugas",
      isActive: payload.isActive !== false,
      aktif: payload.isActive !== false,
    };
  } catch (e) {
    return null;
  }
}

/**
 * Server-side guard to verify user and optional roles.
 * Throws an Error with safe messages if unauthorized.
 */
export async function requireAuth(allowedRoles?: UserRole[]): Promise<AppUser> {
  const user = await verifySession();
  if (!user) {
    throw new Error("Anda harus login untuk mengakses data ini.");
  }

  if (!user.isActive) {
    throw new Error("Akun Anda telah dinonaktifkan.");
  }

  if (allowedRoles && allowedRoles.length > 0) {
    // If superadmin is logged in, superadmin has full admin privileges
    const isAllowed =
      allowedRoles.includes(user.role) ||
      (user.role === "superadmin" && allowedRoles.includes("admin"));

    if (!isAllowed) {
      throw new Error("Anda tidak memiliki akses untuk melakukan tindakan ini.");
    }
  }

  return user;
}

/**
 * Clears the session cookie on logout.
 */
export async function destroySession(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE_NAME);
}
