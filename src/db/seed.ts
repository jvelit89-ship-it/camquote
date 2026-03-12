import { drizzle } from "drizzle-orm/mysql2";
import mysql from "mysql2/promise";
import { hashSync } from "bcryptjs";
import { v4 as uuid } from "uuid";
import * as schema from "./schema";
import { eq } from "drizzle-orm";
import dotenv from "dotenv";

dotenv.config();

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("DATABASE_URL is not set");
}

async function seed() {
  console.log("🌱 Seeding MySQL database...");

  const connection = await mysql.createConnection(connectionString!);
  const db = drizzle(connection, { schema, mode: "default" });

  // --- Manual Table Creation (Ensuring tables exist) ---
  console.log("🔨 Ensuring tables exist...");
  await connection.execute(`
    CREATE TABLE IF NOT EXISTS plans (
      id varchar(255) PRIMARY KEY,
      name varchar(255) NOT NULL,
      price double NOT NULL DEFAULT 0,
      max_users int NOT NULL DEFAULT 1,
      max_products int NOT NULL DEFAULT 20,
      max_quotations int NOT NULL DEFAULT 10,
      features text,
      updated_at timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    )
  `);

  await connection.execute(`
    CREATE TABLE IF NOT EXISTS tenants (
      id varchar(255) PRIMARY KEY,
      company_name varchar(255) NOT NULL UNIQUE,
      owner_user_id varchar(255) NOT NULL,
      plan_id varchar(255) NOT NULL DEFAULT 'free',
      status varchar(50) NOT NULL DEFAULT 'active',
      created_at timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    )
  `);

  await connection.execute(`
    CREATE TABLE IF NOT EXISTS users (
      id varchar(255) PRIMARY KEY,
      tenant_id varchar(255),
      name varchar(255) NOT NULL,
      email varchar(255) NOT NULL UNIQUE,
      password_hash varchar(255) NOT NULL,
      role varchar(50) NOT NULL DEFAULT 'admin',
      created_at timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    )
  `);

  await connection.execute(`
    CREATE TABLE IF NOT EXISTS company_settings (
      id varchar(255) PRIMARY KEY,
      tenant_id varchar(255) NOT NULL,
      name varchar(255) NOT NULL DEFAULT 'Mi Empresa',
      ruc varchar(20) DEFAULT '',
      address varchar(255) DEFAULT '',
      phone varchar(50) DEFAULT '',
      email varchar(255) DEFAULT '',
      website varchar(255) DEFAULT '',
      logo text,
      primary_color varchar(20),
      secondary_color varchar(20),
      legal_representative varchar(255) DEFAULT '',
      legal_representative_dni varchar(20) DEFAULT '',
      igv_rate double DEFAULT 0.18,
      created_at timestamp DEFAULT CURRENT_TIMESTAMP,
      updated_at timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    )
  `);

  await connection.execute(`
    CREATE TABLE IF NOT EXISTS clients (
      id varchar(255) PRIMARY KEY,
      tenant_id varchar(255) NOT NULL,
      name varchar(255) NOT NULL,
      company varchar(255) DEFAULT '',
      document_type varchar(20) NOT NULL DEFAULT 'DNI',
      document_number varchar(20) DEFAULT '',
      phone varchar(50) NOT NULL,
      email varchar(255) DEFAULT '',
      address varchar(255) DEFAULT '',
      city varchar(255) DEFAULT '',
      notes text,
      is_deleted int NOT NULL DEFAULT 0,
      created_at timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    )
  `);

  await connection.execute(`
    CREATE TABLE IF NOT EXISTS products (
      id varchar(255) PRIMARY KEY,
      tenant_id varchar(255) NOT NULL,
      name varchar(255) NOT NULL,
      category varchar(255) NOT NULL,
      price double NOT NULL,
      description text,
      unit varchar(50) NOT NULL DEFAULT 'unidad',
      is_deleted int NOT NULL DEFAULT 0,
      created_at timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    )
  `);

  await connection.execute(`
    CREATE TABLE IF NOT EXISTS global_settings (
      id varchar(255) PRIMARY KEY,
      google_adsense_id varchar(255) DEFAULT 'ca-pub-1749527650458388',
      updated_at timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    )
  `);

  await connection.execute(`
    CREATE TABLE IF NOT EXISTS quotations (
      id varchar(255) PRIMARY KEY,
      tenant_id varchar(255) NOT NULL,
      quotation_number varchar(255) NOT NULL,
      client_id varchar(255) NOT NULL,
      user_id varchar(255) NOT NULL,
      status varchar(50) NOT NULL DEFAULT 'draft',
      subtotal double NOT NULL DEFAULT 0,
      igv_amount double NOT NULL DEFAULT 0,
      total double NOT NULL DEFAULT 0,
      notes text,
      terms text,
      is_deleted int NOT NULL DEFAULT 0,
      created_at timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    )
  `);

  await connection.execute(`
    CREATE TABLE IF NOT EXISTS quotation_items (
      id varchar(255) PRIMARY KEY,
      quotation_id varchar(255) NOT NULL,
      product_id varchar(255),
      product_name varchar(255) NOT NULL,
      product_unit varchar(50) NOT NULL,
      quantity int NOT NULL DEFAULT 1,
      unit_price double NOT NULL,
      subtotal double NOT NULL,
      sort_order int NOT NULL DEFAULT 0
    )
  `);

  await connection.execute(`
    CREATE TABLE IF NOT EXISTS tenant_purchases (
      id varchar(255) PRIMARY KEY,
      tenant_id varchar(255) NOT NULL,
      type varchar(50) NOT NULL,
      quantity int NOT NULL DEFAULT 10,
      price_usd double NOT NULL,
      is_perpetual int NOT NULL DEFAULT 0,
      purchase_month varchar(7) NOT NULL,
      created_at timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP
    )
  `);

  await connection.execute(`
    CREATE TABLE IF NOT EXISTS contracts (
      id varchar(255) PRIMARY KEY,
      tenant_id varchar(255) NOT NULL,
      quotation_id varchar(255) NOT NULL,
      contract_number varchar(255) NOT NULL,
      installation_address varchar(255) DEFAULT '',
      advance_amount double DEFAULT 0,
      balance_amount double DEFAULT 0,
      installation_time varchar(50) DEFAULT '8 horas',
      warranty_equipment int DEFAULT 12,
      warranty_installation int DEFAULT 6,
      maintenance_cost double DEFAULT 80,
      camera_locations text,
      credentials text,
      status varchar(50) NOT NULL DEFAULT 'draft',
      is_deleted int NOT NULL DEFAULT 0,
      created_at timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    )
  `);

  await connection.execute(`
    CREATE TABLE IF NOT EXISTS receipts (
      id varchar(255) PRIMARY KEY,
      tenant_id varchar(255) NOT NULL,
      contract_id varchar(255) NOT NULL,
      receipt_number varchar(255) NOT NULL,
      amount double NOT NULL,
      concept varchar(255) NOT NULL DEFAULT 'Adelanto',
      date timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
      created_at timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // --- Seed Plans ---
  const existingPlans = await db.select().from(schema.plans);
  if (existingPlans.length === 0) {
    await db.insert(schema.plans).values([
      { id: "free", name: "Plan Free", price: 0, maxUsers: 1, maxProducts: 20, maxQuotations: 10 },
      { id: "pro", name: "Plan Pro", price: 29.90, maxUsers: 5, maxProducts: 100, maxQuotations: 50 },
      { id: "enterprise", name: "Plan Enterprise", price: 99.90, maxUsers: 20, maxProducts: 1000, maxQuotations: 500 },
    ]);
    console.log("🌟 Plans created");
  }

  // --- Seed Superadmin ---
  const superadminId = "superadmin-uuid-1234-5678";
  const [superadminUser] = await db.select().from(schema.users).where(eq(schema.users.email, "superadmin@camquote.cc"));
  
  if (!superadminUser) {
    await db.insert(schema.users).values({
      id: superadminId,
      tenantId: null,
      name: "Super Administrador",
      email: "superadmin@camquote.cc",
      passwordHash: hashSync("superadmin123", 10),
      role: "superadmin",
    });
    console.log("🌟 Superadmin created: superadmin@camquote.cc / superadmin123");
  }

  // --- Seed First Tenant & Admin ---
  const adminId = "38923d6b-ef3a-4284-840b-49260cb6d169";
  const firstTenantId = "tenant-demo-uuid-1234";

  const tenants = await db.select().from(schema.tenants);
  if (tenants.length === 0) {
    await db.insert(schema.tenants).values({
      id: firstTenantId,
      companyName: "SecureCam Solutions S.A.C.",
      ownerUserId: adminId,
      planId: "free",
      status: "active",
    });
    console.log("🏢 First Tenant created");
  }

  const [existingAdmin] = await db.select().from(schema.users).where(eq(schema.users.id, adminId));
  if (!existingAdmin) {
    await db.insert(schema.users).values({
      id: adminId,
      tenantId: firstTenantId,
      name: "Administrador Demo",
      email: "admin@cotizaciones.com",
      passwordHash: hashSync("admin123", 10),
      role: "admin",
    });
    console.log("✅ Admin user created: admin@cotizaciones.com / admin123");
  }

  // --- Company settings ---
  const settings = await db.select().from(schema.companySettings);
  if (settings.length === 0) {
    await db.insert(schema.companySettings).values({
      id: uuid(),
      tenantId: firstTenantId,
      name: "SecureCam Solutions S.A.C.",
      ruc: "20612345678",
      address: "Av. La Seguridad 456, Lima",
      phone: "+51 999 888 777",
      email: "ventas@camquote.cc",
      website: "www.camquote.cc",
      logo: "",
      primaryColor: "#1a1a2e",
      secondaryColor: "#6b7280",
      igvRate: 0.18,
    });
    console.log("✅ Company settings created for first tenant");
  }

  // --- Global settings ---
  const global = await db.select().from(schema.globalSettings);
  if (global.length === 0) {
    await db.insert(schema.globalSettings).values({
      id: "current",
      googleAdsenseId: "ca-pub-1749527650458388",
    });
  }

  console.log("🎉 Seed complete!");
  await connection.end();
}

seed().catch(console.error);
