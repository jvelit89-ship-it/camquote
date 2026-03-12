const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.join(__dirname, '..', 'quotation.db');
const db = new Database(dbPath);

console.log('--- Actualizando Base de Datos para Sistema de Planes ---');

try {
  // 1. Crear tabla plans si no existe
  db.prepare(`
    CREATE TABLE IF NOT EXISTS plans (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      price REAL NOT NULL DEFAULT 0,
      max_users INTEGER NOT NULL DEFAULT 1,
      max_products INTEGER NOT NULL DEFAULT 20,
      max_quotations INTEGER NOT NULL DEFAULT 10,
      features TEXT,
      updated_at TEXT NOT NULL
    )
  `).run();

  // 2. Insertar planes base si están vacíos
  const plansCount = db.prepare('SELECT COUNT(*) as count FROM plans').get().count;
  if (plansCount === 0) {
    const now = new Date().toISOString();
    const insertPlan = db.prepare(`
      INSERT INTO plans (id, name, price, max_users, max_products, max_quotations, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);

    insertPlan.run('free', 'Plan Gratuito', 0, 1, 20, 10, now);
    insertPlan.run('pro', 'Plan Pro', 19.90, 5, 500, 1000, now);
    insertPlan.run('enterprise', 'Plan Enterprise', 49.90, 50, 5000, 10000, now);
    console.log('Planes base creados.');
  }

  // 3. Migrar tabla tenants (cambiar 'plan' por 'plan_id')
  // SQLite no permite RENAME COLUMN fácilmente en versiones antiguas sin recrear, 
  // pero intentaremos agregar la columna primero si no existe y migrar datos.
  
  const columns = db.prepare("PRAGMA table_info(tenants)").all();
  const hasPlanId = columns.some(c => c.name === 'plan_id');
  const hasOldPlan = columns.some(c => c.name === 'plan');

  if (!hasPlanId) {
    console.log('Añadiendo columna plan_id a tenants...');
    db.prepare("ALTER TABLE tenants ADD COLUMN plan_id TEXT DEFAULT 'free'").run();
    
    if (hasOldPlan) {
      console.log('Migrando datos de plan antiguo a plan_id...');
      db.prepare("UPDATE tenants SET plan_id = plan").run();
    }
  }

  console.log('Migración completada con éxito.');
} catch (err) {
  console.error('Error en migración:', err);
} finally {
  db.close();
}
