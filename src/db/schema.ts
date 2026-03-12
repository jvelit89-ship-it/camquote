import { sql } from "drizzle-orm";
import { mysqlTable, varchar, text, int, double, timestamp } from "drizzle-orm/mysql-core";

// --- Plans ---
export const plans = mysqlTable("plans", {
  id: varchar("id", { length: 255 }).primaryKey(), // "free", "pro", "enterprise"
  name: varchar("name", { length: 255 }).notNull(),
  price: double("price").notNull().default(0),
  maxUsers: int("max_users").notNull().default(1),
  maxProducts: int("max_products").notNull().default(20),
  maxQuotations: int("max_quotations").notNull().default(10),
  features: text("features"), // JSON string for extra flags
  updatedAt: timestamp("updated_at").notNull().defaultNow().onUpdateNow(),
});

// --- Tenants ---
export const tenants = mysqlTable("tenants", {
  id: varchar("id", { length: 255 }).primaryKey(),
  companyName: varchar("company_name", { length: 255 }).notNull().unique(),
  ownerUserId: varchar("owner_user_id", { length: 255 }).notNull(), // References user id later
  planId: varchar("plan_id", { length: 255 }).notNull().references(() => plans.id).default("free"),
  status: varchar("status", { length: 50 }).notNull().default("active"),
  createdAt: timestamp("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedAt: timestamp("updated_at").notNull().defaultNow().onUpdateNow(),
});

// --- Global Settings ---
export const globalSettings = mysqlTable("global_settings", {
  id: varchar("id", { length: 255 }).primaryKey(), // Usually "current"
  googleAdsenseId: varchar("google_adsense_id", { length: 255 }).default("ca-pub-1749527650458388"),
  updatedAt: timestamp("updated_at").notNull().defaultNow().onUpdateNow(),
});

// --- Users ---
export const users = mysqlTable("users", {
  id: varchar("id", { length: 255 }).primaryKey(),
  tenantId: varchar("tenant_id", { length: 255 }).references(() => tenants.id), // Can be null for SUPERADMIN not bound to one tenant, though usually filled
  name: varchar("name", { length: 255 }).notNull(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  passwordHash: varchar("password_hash", { length: 255 }).notNull(),
  role: varchar("role", { length: 50 }).notNull().default("admin"), // "admin", "user", "superadmin"
  createdAt: timestamp("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedAt: timestamp("updated_at").notNull().defaultNow().onUpdateNow(),
});

// --- Company Settings (one row per tenant) ---
export const companySettings = mysqlTable("company_settings", {
  id: varchar("id", { length: 255 }).primaryKey(),
  tenantId: varchar("tenant_id", { length: 255 }).notNull().references(() => tenants.id),
  name: varchar("name", { length: 255 }).notNull().default("Mi Empresa"),
  ruc: varchar("ruc", { length: 20 }).default(""),
  address: varchar("address", { length: 255 }).default(""),
  phone: varchar("phone", { length: 50 }).default(""),
  email: varchar("email", { length: 255 }).default(""),
  website: varchar("website", { length: 255 }).default(""),
  logo: text("logo"), // Base64 or URL
  primaryColor: varchar("primary_color", { length: 20 }), // HEX code
  secondaryColor: varchar("secondary_color", { length: 20 }), // HEX code
  legalRepresentative: varchar("legal_representative", { length: 255 }).default(""),
  legalRepresentativeDni: varchar("legal_representative_dni", { length: 20 }).default(""),
  igvRate: double("igv_rate").default(0.18),
  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`),
  updatedAt: timestamp("updated_at").notNull().defaultNow().onUpdateNow(),
});

// --- Clients ---
export const clients = mysqlTable("clients", {
  id: varchar("id", { length: 255 }).primaryKey(),
  tenantId: varchar("tenant_id", { length: 255 }).notNull().references(() => tenants.id),
  name: varchar("name", { length: 255 }).notNull(),
  company: varchar("company", { length: 255 }).default(""),
  documentType: varchar("document_type", { length: 20 }).notNull().default("DNI"),
  documentNumber: varchar("document_number", { length: 20 }).default(""),
  phone: varchar("phone", { length: 50 }).notNull(),
  email: varchar("email", { length: 255 }).default(""),
  address: varchar("address", { length: 255 }).default(""),
  city: varchar("city", { length: 255 }).default(""),
  notes: text("notes"),
  isDeleted: int("is_deleted").notNull().default(0),
  createdAt: timestamp("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedAt: timestamp("updated_at").notNull().defaultNow().onUpdateNow(),
});

// --- Products ---
export const products = mysqlTable("products", {
  id: varchar("id", { length: 255 }).primaryKey(),
  tenantId: varchar("tenant_id", { length: 255 }).notNull().references(() => tenants.id),
  name: varchar("name", { length: 255 }).notNull(),
  category: varchar("category", { length: 255 }).notNull(),
  price: double("price").notNull(),
  description: text("description"),
  unit: varchar("unit", { length: 50 }).notNull().default("unidad"),
  isDeleted: int("is_deleted").notNull().default(0),
  createdAt: timestamp("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedAt: timestamp("updated_at").notNull().defaultNow().onUpdateNow(),
});

// --- Quotations ---
export const quotations = mysqlTable("quotations", {
  id: varchar("id", { length: 255 }).primaryKey(),
  tenantId: varchar("tenant_id", { length: 255 }).notNull().references(() => tenants.id),
  quotationNumber: varchar("quotation_number", { length: 255 }).notNull(), 
  clientId: varchar("client_id", { length: 255 }).notNull().references(() => clients.id),
  userId: varchar("user_id", { length: 255 }).notNull().references(() => users.id),
  status: varchar("status", { length: 50 }).notNull().default("draft"),
  subtotal: double("subtotal").notNull().default(0),
  igvAmount: double("igv_amount").notNull().default(0),
  total: double("total").notNull().default(0),
  notes: text("notes"),
  terms: text("terms"),
  isDeleted: int("is_deleted").notNull().default(0),
  createdAt: timestamp("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedAt: timestamp("updated_at").notNull().defaultNow().onUpdateNow(),
});

// --- Quotation Items ---
export const quotationItems = mysqlTable("quotation_items", {
  id: varchar("id", { length: 255 }).primaryKey(),
  quotationId: varchar("quotation_id", { length: 255 }).notNull().references(() => quotations.id),
  productId: varchar("product_id", { length: 255 }).references(() => products.id),
  productName: varchar("product_name", { length: 255 }).notNull(),
  productUnit: varchar("product_unit", { length: 50 }).notNull(),
  quantity: int("quantity").notNull().default(1),
  unitPrice: double("unit_price").notNull(),
  subtotal: double("subtotal").notNull(),
  sortOrder: int("sort_order").notNull().default(0),
});

// --- Tenant Purchases ---
export const tenantPurchases = mysqlTable("tenant_purchases", {
  id: varchar("id", { length: 255 }).primaryKey(),
  tenantId: varchar("tenant_id", { length: 255 }).notNull().references(() => tenants.id),
  type: varchar("type", { length: 50 }).notNull(), // "quotations" | "products"
  quantity: int("quantity").notNull().default(10),
  priceUsd: double("price_usd").notNull(),
  isPerpetual: int("is_perpetual").notNull().default(0), 
  purchaseMonth: varchar("purchase_month", { length: 7 }).notNull(), // "2026-03"
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// --- Contracts ---
export const contracts = mysqlTable("contracts", {
  id: varchar("id", { length: 255 }).primaryKey(),
  tenantId: varchar("tenant_id", { length: 255 }).notNull().references(() => tenants.id),
  quotationId: varchar("quotation_id", { length: 255 }).notNull().references(() => quotations.id),
  contractNumber: varchar("contract_number", { length: 255 }).notNull(),
  installationAddress: varchar("installation_address", { length: 255 }).default(""),
  advanceAmount: double("advance_amount").default(0),
  balanceAmount: double("balance_amount").default(0),
  installationTime: varchar("installation_time", { length: 50 }).default("8 horas"),
  warrantyEquipment: int("warranty_equipment").default(12), 
  warrantyInstallation: int("warranty_installation").default(6), 
  maintenanceCost: double("maintenance_cost").default(80),
  cameraLocations: text("camera_locations"), // JSON string
  credentials: text("credentials"), // JSON string
  status: varchar("status", { length: 50 }).notNull().default("draft"), 
  isDeleted: int("is_deleted").notNull().default(0),
  createdAt: timestamp("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedAt: timestamp("updated_at").notNull().defaultNow().onUpdateNow(),
});

// --- Receipts ---
export const receipts = mysqlTable("receipts", {
  id: varchar("id", { length: 255 }).primaryKey(),
  tenantId: varchar("tenant_id", { length: 255 }).notNull().references(() => tenants.id),
  contractId: varchar("contract_id", { length: 255 }).notNull().references(() => contracts.id),
  receiptNumber: varchar("receipt_number", { length: 255 }).notNull(),
  amount: double("amount").notNull(),
  concept: varchar("concept", { length: 255 }).notNull().default("Adelanto"),
  date: timestamp("date").notNull().default(sql`CURRENT_TIMESTAMP`),
  createdAt: timestamp("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
});

export const CONTRACT_STATUSES = [
  { value: "draft", label: "Borrador", color: "gray" },
  { value: "signed", label: "Firmado", color: "green" },
  { value: "delivered", label: "Entregado", color: "blue" },
] as const;

// --- Product categories enum ---
export const PRODUCT_CATEGORIES = [
  { value: "cameras", label: "Cámaras" },
  { value: "dvr_nvr", label: "DVR / NVR" },
  { value: "accessories", label: "Accesorios" },
  { value: "materials", label: "Materiales" },
  { value: "cabling", label: "Cableado" },
  { value: "installation", label: "Instalación" },
  { value: "labor", label: "Mano de obra" },
] as const;

export const QUOTATION_STATUSES = [
  { value: "draft", label: "Borrador", color: "gray" },
  { value: "sent", label: "Enviado", color: "blue" },
  { value: "approved", label: "Aprobado", color: "green" },
  { value: "rejected", label: "Rechazado", color: "red" },
] as const;
