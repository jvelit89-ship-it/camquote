import { drizzle } from "drizzle-orm/mysql2";
import mysql from "mysql2/promise";
import * as schema from "./schema";

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("DATABASE_URL is not set");
}

let connection: mysql.Connection;

// Singleton style for Next.js dev mode
const globalForDb = globalThis as unknown as { db: any };

async function getDb() {
  if (!globalForDb.db) {
    const conn = await mysql.createConnection(connectionString!);
    globalForDb.db = drizzle(conn, { schema, mode: "default" });
  }
  return globalForDb.db;
}

export const db = await getDb();
