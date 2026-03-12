import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().email("Email inválido"),
  password: z.string().min(6, "Mínimo 6 caracteres"),
});

export const clientSchema = z.object({
  name: z.string().min(2, "Mínimo 2 caracteres").max(100),
  company: z.string().optional().default(""),
  documentType: z.enum(["DNI", "RUC"]).default("DNI"),
  documentNumber: z.string().optional().default(""),
  phone: z.string().min(7, "Mínimo 7 dígitos").max(15),
  email: z.string().email("Email inválido").or(z.literal("")).optional().default(""),
  address: z.string().optional().default(""),
  city: z.string().optional().default(""),
  notes: z.string().optional().default(""),
});

export const productSchema = z.object({
  name: z.string().min(2, "Mínimo 2 caracteres").max(150),
  category: z.string().min(1, "Categoría requerida"),
  price: z.number().positive("Precio debe ser mayor a 0"),
  description: z.string().optional().default(""),
  unit: z.string().min(1, "Unidad requerida"),
});

export const quotationItemSchema = z.object({
  productId: z.string().optional(),
  productName: z.string().min(1),
  productUnit: z.string().min(1),
  quantity: z.number().int().min(1, "Cantidad mínima: 1"),
  unitPrice: z.number().positive("Precio debe ser mayor a 0"),
});

export const quotationSchema = z.object({
  clientId: z.string().min(1, "Cliente requerido"),
  notes: z.string().optional().default(""),
  terms: z.string().optional().default(""),
  items: z.array(quotationItemSchema).min(1, "Debe tener al menos un item"),
});

export const companySettingsSchema = z.object({
  name: z.string().min(1, "Nombre requerido"),
  ruc: z.string().optional().default(""),
  address: z.string().optional().default(""),
  phone: z.string().min(1, "Teléfono requerido"),
  email: z.string().email("Email inválido").or(z.literal("")).optional().default(""),
  website: z.string().optional(),
  logo: z.string().optional(),
  primaryColor: z.string().optional(),
  secondaryColor: z.string().optional(),
  legalRepresentative: z.string().optional().default(""),
  legalRepresentativeDni: z.string().optional().default(""),
  igvRate: z.number().min(0).max(1).default(0.18),
});
