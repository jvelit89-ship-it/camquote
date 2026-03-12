
import Database from "better-sqlite3";
import path from "path";

const DB_PATH = path.join(process.cwd(), "quotation.db");
const sqlite = new Database(DB_PATH);

try {
  console.log("Adding legal_representative column...");
  sqlite.exec("ALTER TABLE company_settings ADD COLUMN legal_representative TEXT DEFAULT ''");
} catch (e) {
  console.log("Column legal_representative might already exist or error:", e.message);
}

try {
  console.log("Adding legal_representative_dni column...");
  sqlite.exec("ALTER TABLE company_settings ADD COLUMN legal_representative_dni TEXT DEFAULT ''");
} catch (e) {
  console.log("Column legal_representative_dni might already exist or error:", e.message);
}

sqlite.close();
console.log("Migration complete!");
