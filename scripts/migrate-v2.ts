/**
 * Migration v2: Add tenant_purchases and contracts tables
 * Run with: npx tsx scripts/migrate-v2.ts
 */
import Database from "better-sqlite3";
import path from "path";

const DB_PATH = path.join(process.cwd(), "quotation.db");
const sqlite = new Database(DB_PATH);

console.log("🔄 Running migration v2...\n");

// --- tenant_purchases ---
sqlite.exec(`
  CREATE TABLE IF NOT EXISTS tenant_purchases (
    id TEXT PRIMARY KEY,
    tenant_id TEXT NOT NULL REFERENCES tenants(id),
    type TEXT NOT NULL,
    quantity INTEGER NOT NULL DEFAULT 10,
    price_usd REAL NOT NULL,
    is_perpetual INTEGER NOT NULL DEFAULT 0,
    purchase_month TEXT NOT NULL,
    created_at TEXT NOT NULL
  );
`);
console.log("✅ tenant_purchases table created");

// --- contracts ---
sqlite.exec(`
  CREATE TABLE IF NOT EXISTS contracts (
    id TEXT PRIMARY KEY,
    tenant_id TEXT NOT NULL REFERENCES tenants(id),
    quotation_id TEXT NOT NULL REFERENCES quotations(id),
    contract_number TEXT NOT NULL,
    installation_address TEXT DEFAULT '',
    advance_amount REAL DEFAULT 0,
    balance_amount REAL DEFAULT 0,
    installation_time TEXT DEFAULT '8 horas',
    warranty_equipment INTEGER DEFAULT 12,
    warranty_installation INTEGER DEFAULT 6,
    maintenance_cost REAL DEFAULT 80,
    camera_locations TEXT DEFAULT '[]',
    credentials TEXT DEFAULT '{}',
    status TEXT NOT NULL DEFAULT 'draft',
    is_deleted INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
  );
`);
console.log("✅ contracts table created");

console.log("\n🎉 Migration v2 complete!");
sqlite.close();
