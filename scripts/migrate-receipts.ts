
import Database from "better-sqlite3";
import path from "path";

const DB_PATH = path.join(process.cwd(), "quotation.db");
const sqlite = new Database(DB_PATH);

try {
  console.log("Creating receipts table...");
  sqlite.exec(`
    CREATE TABLE IF NOT EXISTS receipts (
      id TEXT PRIMARY KEY,
      tenant_id TEXT NOT NULL,
      contract_id TEXT NOT NULL,
      receipt_number TEXT NOT NULL,
      amount REAL NOT NULL,
      concept TEXT NOT NULL DEFAULT 'Adelanto',
      date TEXT NOT NULL,
      created_at TEXT NOT NULL
    )
  `);
  console.log("✅ Receipts table created");
} catch (e) {
  console.error("❌ Error creating receipts table:", e.message);
}

sqlite.close();
