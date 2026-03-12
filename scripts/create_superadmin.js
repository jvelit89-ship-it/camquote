const Database = require("better-sqlite3");
const path = require("path");
const bcrypt = require("bcryptjs");
const { v4: uuidv4 } = require("uuid");

const DB_PATH = path.join(process.cwd(), "quotation.db");
const db = new Database(DB_PATH);

async function createSuperadmin() {
  const email = "superadmin@camquote.cc";
  const password = "superadmin123";
  const name = "Super Admin";
  
  // Check if user already exists
  const existingUser = db.prepare("SELECT * FROM users WHERE email = ?").get(email);
  if (existingUser) {
    console.log("User already exists. Updating role to superadmin.");
    db.prepare("UPDATE users SET role = 'superadmin' WHERE email = ?").run(email);
    console.log("User updated successfully.");
    return;
  }

  const salt = await bcrypt.genSalt(10);
  const passwordHash = await bcrypt.hash(password, salt);
  const userId = uuidv4();
  const now = new Date().toISOString();

  try {
    db.prepare(`
      INSERT INTO users (id, name, email, password_hash, role, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(userId, name, email, passwordHash, "superadmin", now, now);

    console.log("Superadmin created successfully!");
    console.log("Email: " + email);
    console.log("Password: " + password);
  } catch (error) {
    console.error("Error creating superadmin:", error.message);
  } finally {
    db.close();
  }
}

createSuperadmin();
