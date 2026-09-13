import mysql, { Pool, PoolConnection } from "mysql2/promise";

let pool: Pool | null = null;

export function getPool(): Pool {
  if (!pool) {
    pool = mysql.createPool({
      host: process.env.DB_HOST || "localhost",
      port: Number(process.env.DB_PORT) || 3306,
      user: process.env.DB_USER || "root",
      password: process.env.DB_PASSWORD || "",
      database: process.env.DB_NAME || "idi_racepack",
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0,
      dateStrings: true,
      timezone: "+07:00", // Waktu Indonesia Barat
    });
  }
  return pool;
}

/**
 * Parameterized query helper to protect against SQL Injection.
 */
export async function query<T = any>(sql: string, params?: any[]): Promise<T> {
  const p = getPool();
  const [rows] = await p.query(sql, params);
  return rows as T;
}

/**
 * Execute a callback inside an atomic MySQL transaction.
 * Automatically handles BEGIN, COMMIT, and ROLLBACK.
 */
export async function withTransaction<T>(
  callback: (connection: PoolConnection) => Promise<T>
): Promise<T> {
  const p = getPool();
  const connection = await p.getConnection();
  await connection.beginTransaction();
  try {
    const result = await callback(connection);
    await connection.commit();
    return result;
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

/**
 * Ping MySQL connection to verify connectivity.
 */
export async function testConnection(): Promise<{ connected: boolean; error?: string }> {
  try {
    const p = getPool();
    await p.query("SELECT 1");
    return { connected: true };
  } catch (err: any) {
    return {
      connected: false,
      error: err.code || err.message || "Gagal menghubungi database MySQL.",
    };
  }
}
