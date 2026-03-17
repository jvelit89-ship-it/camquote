import { drizzle } from "drizzle-orm/mysql2";
import mysql from "mysql2/promise";
import Database from "better-sqlite3";
import * as schema from "../src/db/schema.ts";
import { eq, inArray } from "drizzle-orm";
import { v4 as uuid } from "uuid";
import dotenv from "dotenv";

dotenv.config();

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("DATABASE_URL is not set");
}

const adminTenantId = "tenant-demo-uuid-1234";

async function run() {
  console.log("🔗 Connecting to MySQL...");
  const connection = await mysql.createConnection(connectionString!);
  const db = drizzle(connection, { schema, mode: "default" });

  console.log("📂 Opening SQLite quotation.db...");
  const sqliteDb = new Database("quotation.db", { readonly: true });

  const products = sqliteDb.prepare("SELECT * FROM products WHERE tenant_id = ?").all(adminTenantId) as any[];
  console.log(`📦 Found ${products.length} products in SQLite.`);

  // Clear existing products for this tenant in MySQL
  await db.delete(schema.products).where(eq(schema.products.tenantId, adminTenantId));

  // Insert products
  if (products.length > 0) {
    const values = products.map(p => ({
      id: p.id,
      tenantId: adminTenantId,
      name: p.name,
      category: p.category,
      price: Number(p.price),
      description: p.description,
      unit: p.unit,
      isDeleted: p.is_deleted,
    }));
    await db.insert(schema.products).values(values);
    console.log(`✅ Inserted ${values.length} products into MySQL.`);
  }

  // Clear existing clients for this tenant in MySQL to avoid duplicates
  await db.delete(schema.clients).where(eq(schema.clients.tenantId, adminTenantId));

  // Generate 3 clients
  const mockClients = [
    {
      id: uuid(),
      tenantId: adminTenantId,
      name: "Juan Pérez",
      company: "Edificio Los Álamos",
      documentType: "DNI",
      documentNumber: "45871236",
      phone: "987654321",
      email: "jperez@alamos.com",
      address: "Av. Las Flores 123",
      city: "Lima",
      notes: "Cliente recurrente para mantenimientos"
    },
    {
      id: uuid(),
      tenantId: adminTenantId,
      name: "María Gómez",
      company: "Colegio San Francisco",
      documentType: "RUC",
      documentNumber: "20123456781",
      phone: "999888777",
      email: "administracion@sanfrancisco.edu.pe",
      address: "Calle Los Pinos 456",
      city: "Arequipa",
      notes: "Prioridad alta en instalaciones"
    },
    {
      id: uuid(),
      tenantId: adminTenantId,
      name: "Carlos Torres",
      company: "Minimarket El Rápido",
      documentType: "DNI",
      documentNumber: "78451296",
      phone: "912345678",
      email: "ctorres@elrapido.com",
      address: "Av. Principal 789",
      city: "Trujillo",
      notes: "Interesado en cámaras IP"
    }
  ];

  await db.insert(schema.clients).values(mockClients);
  console.log(`✅ Inserted 3 clients into MySQL.`);

  await connection.end();
}

run().catch(console.error);
