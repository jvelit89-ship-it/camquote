
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { quotations, quotationItems, clients, companySettings, contracts, receipts } from "@/db/schema";
import { eq, and, desc } from "drizzle-orm";
import { getAuthUser } from "@/lib/auth";

function formatCurrency(n: number): string {
  return `S/${n.toLocaleString("es-PE", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getAuthUser();
  if (!user || !user.tenantId) {
    return NextResponse.json({ error: { message: "No autenticado" } }, { status: 401 });
  }

  const { id } = await params;
  const url = new URL(req.url);
  const receiptId = url.searchParams.get("receiptId");

  // Search for contract by ID or contractNumber
  let contract = db.select().from(contracts).where(and(eq(contracts.id, id), eq(contracts.tenantId, user.tenantId))).get();
  if (!contract) {
    contract = db.select().from(contracts).where(and(eq(contracts.contractNumber, id), eq(contracts.tenantId, user.tenantId))).get();
  }

  if (!contract || contract.isDeleted === 1) {
    return NextResponse.json({ error: { message: "Contrato no encontrado" } }, { status: 404 });
  }

  // Find the specific receipt or the latest one
  let receipt;
  if (receiptId) {
    receipt = db.select().from(receipts).where(and(eq(receipts.id, receiptId), eq(receipts.tenantId, user.tenantId))).get();
  } else {
    receipt = db.select().from(receipts).where(and(eq(receipts.contractId, contract.id), eq(receipts.tenantId, user.tenantId))).orderBy(desc(receipts.createdAt)).get();
  }

  if (!receipt) {
    return NextResponse.json({ error: { message: "Recibo no encontrado" } }, { status: 404 });
  }

  const quotation = db.select().from(quotations).where(eq(quotations.id, contract.quotationId)).get();
  const client = db.select().from(clients).where(eq(clients.id, quotation?.clientId || "")).get();
  const company = db.select().from(companySettings).where(eq(companySettings.tenantId, user.tenantId)).get();

  const primaryColor = company?.primaryColor || "#1a1a2e";
  const receiptNumber = receipt.receiptNumber;

  const html = `
    <!DOCTYPE html>
    <html lang="es">
    <head>
      <meta charset="utf-8">
      <title>Recibo de Adelanto ${receiptNumber}</title>
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: 'Segoe UI', Arial, sans-serif; color: #1a1a2e; padding: 40px; font-size: 14px; line-height: 1.6; background: #f9fafb; display: flex; justify-content: center; }
        .receipt-card { background: white; width: 600px; padding: 40px; border-radius: 12px; shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1); border: 1px solid #e5e7eb; position: relative; overflow: hidden; }
        .receipt-card::before { content: ""; position: absolute; top: 0; left: 0; right: 0; height: 6px; background: ${primaryColor}; }
        
        .header { display: flex; justify-content: space-between; align-items: start; margin-bottom: 30px; }
        .logo-container { height: 50px; }
        .logo-img { height: 100%; object-fit: contain; }
        
        .title-box { text-align: right; }
        .title { font-size: 20px; font-weight: bold; color: ${primaryColor}; text-transform: uppercase; margin-bottom: 4px; }
        .receipt-id { font-family: monospace; font-size: 16px; color: #6b7280; }
        
        .section { margin-bottom: 24px; }
        .section-title { font-size: 12px; font-weight: bold; color: #9ca3af; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 8px; border-bottom: 1px solid #f3f4f6; padding-bottom: 4px; }
        
        .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
        .label { font-weight: bold; color: #374151; font-size: 13px; }
        .value { color: #4b5563; }
        
        .amount-box { background: #f3f4f6; padding: 20px; border-radius: 8px; margin-top: 10px; text-align: center; }
        .amount-label { font-size: 12px; color: #6b7280; margin-bottom: 4px; }
        .amount-value { font-size: 28px; font-weight: 800; color: ${primaryColor}; }
        
        .footer { margin-top: 40px; border-top: 1px dashed #e5e7eb; padding-top: 20px; text-align: center; color: #9ca3af; font-size: 11px; }
        
        @media print {
          body { background: white; padding: 0; }
          .receipt-card { border: none; box-shadow: none; width: 100%; }
        }
      </style>
    </head>
    <body>
      <div class="receipt-card">
        <div class="header">
          <div class="logo-container">
            ${company?.logo ? `<img src="${company.logo}" class="logo-img" />` : `<div style="font-weight: bold; font-size: 18px; color: ${primaryColor}">${company?.name || "MI EMPRESA"}</div>`}
          </div>
          <div class="title-box">
            <div class="title">Recibo de Adelanto</div>
            <div class="receipt-id">${receiptNumber}</div>
            <div style="font-size: 12px; color: #9ca3af; margin-top: 4px;">Fecha: ${new Date(receipt.date).toLocaleDateString("es-PE")}</div>
          </div>
        </div>

        <div class="section">
          <div class="section-title">Datos del Proveedor</div>
          <div class="grid">
            <div><span class="label">Empresa:</span> <span class="value">${company?.name || "—"}</span></div>
            <div><span class="label">RUC:</span> <span class="value">${company?.ruc || "—"}</span></div>
            <div><span class="label">Teléfono:</span> <span class="value">${company?.phone || "—"}</span></div>
            <div><span class="label">Web:</span> <span class="value">${company?.website || "—"}</span></div>
          </div>
        </div>

        <div class="section">
          <div class="section-title">Recibido de</div>
          <div><span class="label">Cliente:</span> <span class="value">${client?.name || "—"}</span></div>
          <div><span class="label">Documento:</span> <span class="value">${client?.documentNumber || "—"}</span></div>
          ${client?.address ? `<div><span class="label">Dirección:</span> <span class="value">${client.address}</span></div>` : ""}
        </div>

        <div class="section">
          <div class="section-title">Concepto</div>
          <p class="value"><strong>${receipt.concept || "Pago"}</strong> - Por suministro e instalación de sistema de videovigilancia CCTV según Contrato <strong>${contract.contractNumber}</strong> (Cotización ${quotation?.quotationNumber || "—"}).</p>
        </div>

        <div class="amount-box">
          <div class="amount-label">TOTAL RECIBIDO</div>
          <div class="amount-value">${formatCurrency(receipt.amount || 0)}</div>
          <div style="font-size: 11px; margin-top: 8px; color: #6b7280;">Monto total contrato: ${formatCurrency(quotation?.total || 0)}</div>
        </div>

        <div class="footer">
          Este documento es una constancia de pago por concepto de adelanto.<br>
          ${company?.name} - ${company?.address || ""}
        </div>
      </div>
    </body>
    </html>
  `;

  return new NextResponse(html, {
    headers: { "Content-Type": "text/html; charset=utf-8" },
  });
}
