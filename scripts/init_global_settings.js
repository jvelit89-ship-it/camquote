const Database = require("better-sqlite3");
const path = require("path");
const { v4: uuidv4 } = require("uuid");

const DB_PATH = path.join(process.cwd(), "quotation.db");
const db = new Database(DB_PATH);

function initGlobalSettings() {
  const adsenseId = "ca-pub-1749527650458388";
  const now = new Date().toISOString();

  try {
    // Create table if not exists (in case it wasn't created by Drizzle yet)
    db.prepare(`
      CREATE TABLE IF NOT EXISTS global_settings (
        id TEXT PRIMARY KEY,
        google_adsense_id TEXT DEFAULT 'ca-pub-1749527650458388',
        updated_at TEXT NOT NULL
      )
    `).run();

    const existing = db.prepare("SELECT * FROM global_settings WHERE id = 'current'").get();
    
    if (!existing) {
      db.prepare(`
        INSERT INTO global_settings (id, google_adsense_id, updated_at)
        VALUES (?, ?, ?)
      `).run("current", adsenseId, now);
      console.log("Global settings initialized successfully!");
    } else {
      console.log("Global settings already initialized.");
    }
  } catch (error) {
    console.error("Error initializing global settings:", error.message);
  } finally {
    db.close();
  }
}

initGlobalSettings();
