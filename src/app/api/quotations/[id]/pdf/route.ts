import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { quotations, quotationItems, clients, companySettings } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { getAuthUser } from "@/lib/auth";

function formatCurrency(n: number): string {
  return `S/${n.toLocaleString("es-PE", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function formatDatePDF(iso: string): string {
  return new Date(iso).toLocaleDateString("es-PE", { day: "2-digit", month: "2-digit", year: "numeric" });
}

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getAuthUser();
  if (!user || !user.tenantId) {
    return NextResponse.json({ error: { message: "No autenticado" } }, { status: 401 });
  }

  const { id } = await params;

  const quotation = db.select().from(quotations).where(and(eq(quotations.id, id), eq(quotations.tenantId, user.tenantId))).get();
  if (!quotation || quotation.isDeleted === 1) {
    return NextResponse.json({ error: { message: "No encontrada" } }, { status: 404 });
  }

  const items = db.select().from(quotationItems).where(eq(quotationItems.quotationId, id)).orderBy(quotationItems.sortOrder).all();
  const client = db.select().from(clients).where(and(eq(clients.id, quotation.clientId), eq(clients.tenantId, user.tenantId))).get();
  const company = db.select().from(companySettings).where(eq(companySettings.tenantId, user.tenantId)).get();

  const primaryColor = company?.primaryColor || "#1a1a2e";
  const secondaryColor = company?.secondaryColor || "#6b7280";

  const STATUS_LABELS: Record<string, string> = { draft: "Borrador", sent: "Enviado", approved: "Aprobado", rejected: "Rechazado" };

  // Generar HTML para convertir a PDF
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>${quotation.quotationNumber}</title>
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: 'Segoe UI', Arial, sans-serif; color: #1a1a2e; padding: 40px; font-size: 13px; line-height: 1.5; }
        .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 30px; border-bottom: 3px solid ${primaryColor}; padding-bottom: 20px; }
        .logo-container { height: 60px; margin-bottom: 10px; }
        .logo-img { height: 100%; object-contain: contain; }
        .company-name { font-size: 22px; font-weight: 700; color: ${primaryColor}; }
        .company-info { color: #6b7280; font-size: 12px; line-height: 1.6; }
        .quotation-meta { text-align: right; }
        .quotation-number { font-size: 18px; font-weight: 700; color: ${primaryColor}; }
        .meta-label { font-size: 11px; color: #6b7280; text-transform: uppercase; letter-spacing: 0.05em; }
        .section { margin-bottom: 24px; }
        .section-title { font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.08em; color: ${secondaryColor}; margin-bottom: 8px; border-left: 3px solid ${primaryColor}; padding-left: 8px; }
        .client-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 4px; }
        .client-grid span { color: #6b7280; }
        table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
        th { background: ${primaryColor}; color: white; padding: 10px 12px; text-align: left; font-size: 11px; text-transform: uppercase; letter-spacing: 0.05em; }
        th:last-child, th:nth-child(4), th:nth-child(5), th:nth-child(6) { text-align: right; }
        td { padding: 10px 12px; border-bottom: 1px solid #e5e7eb; }
        td:last-child, td:nth-child(4), td:nth-child(5), td:nth-child(6) { text-align: right; }
        .totals { float: right; width: 250px; }
        .totals-row { display: flex; justify-content: space-between; padding: 6px 0; font-size: 13px; }
        .totals-row.total { font-size: 16px; font-weight: 700; border-top: 2px solid ${primaryColor}; padding-top: 10px; margin-top: 4px; color: ${primaryColor}; }
        .notes-section { clear: both; margin-top: 40px; padding-top: 20px; border-top: 1px solid #e5e7eb; }
        .notes-section h4 { font-size: 12px; font-weight: 700; color: ${secondaryColor}; text-transform: uppercase; margin-bottom: 6px; }
        .notes-section p { font-size: 12px; white-space: pre-wrap; color: #374151; }
        .signature { margin-top: 60px; display: flex; justify-content: space-between; }
        .signature-box { text-align: center; width: 200px; }
        .signature-line { border-top: 1px solid #1a1a2e; padding-top: 8px; font-size: 11px; color: #6b7280; }
        .footer { margin-top: 40px; text-align: center; font-size: 11px; color: #9ca3af; border-top: 1px solid #e5e7eb; padding-top: 16px; }
        @media print {
          body { padding: 20px; }
          @page { margin: 15mm; size: A4; }
        }
      </style>
    </head>
    <body>
      <div class="header">
        <div>
          ${company?.logo ? `<div class="logo-container"><img src="${company.logo}" class="logo-img" /></div>` : ""}
          <div class="company-name">${company?.name || "Mi Empresa"}</div>
          <div class="company-info">
            ${company?.ruc ? `RUC: ${company.ruc}<br>` : ""}
            ${company?.address ? `${company.address}<br>` : ""}
            ${company?.phone ? `Tel: ${company.phone}<br>` : ""}
            ${company?.email ? `${company.email}` : ""}
          </div>
        </div>
        <div class="quotation-meta">
          <div class="quotation-number">${quotation.quotationNumber}</div>
          <div style="margin-top: 8px;">
            <div class="meta-label">Fecha</div>
            <div>${formatDatePDF(quotation.createdAt)}</div>
          </div>
          <div style="margin-top: 4px;">
            <div class="meta-label">Estado</div>
            <div>${STATUS_LABELS[quotation.status] || quotation.status}</div>
          </div>
        </div>
      </div>

      <div class="section">
        <div class="section-title">Datos del Cliente</div>
        <div class="client-grid">
          <div><span>Nombre:</span> <strong>${client?.name || "—"}</strong></div>
          ${client?.company ? `<div><span>Empresa:</span> ${client.company}</div>` : ""}
          ${client?.documentNumber ? `<div><span>${client.documentType}:</span> ${client.documentNumber}</div>` : ""}
          ${client?.phone ? `<div><span>Teléfono:</span> ${client.phone}</div>` : ""}
          ${client?.email ? `<div><span>Email:</span> ${client.email}</div>` : ""}
          ${client?.address ? `<div><span>Dirección:</span> ${client.address}</div>` : ""}
        </div>
      </div>

      <div class="section">
        <table>
          <thead>
            <tr>
              <th style="width:30px">#</th>
              <th>Descripción</th>
              <th>Unidad</th>
              <th>Cant.</th>
              <th>P. Unitario</th>
              <th>Subtotal</th>
            </tr>
          </thead>
          <tbody>
            ${items.map((item, i) => `
              <tr>
                <td>${i + 1}</td>
                <td>${item.productName}</td>
                <td>${item.productUnit}</td>
                <td>${item.quantity}</td>
                <td>${formatCurrency(item.unitPrice)}</td>
                <td>${formatCurrency(item.subtotal)}</td>
              </tr>
            `).join("")}
          </tbody>
        </table>

        <div class="totals">
          <div class="totals-row"><span>Subtotal</span><span>${formatCurrency(quotation.subtotal)}</span></div>
          <div class="totals-row"><span>IGV (18%)</span><span>${formatCurrency(quotation.igvAmount)}</span></div>
          <div class="totals-row total"><span>TOTAL</span><span>${formatCurrency(quotation.total)}</span></div>
        </div>
      </div>

      ${quotation.notes || quotation.terms ? `
        <div class="notes-section">
          ${quotation.notes ? `<div style="margin-bottom: 16px;"><h4>Notas</h4><p>${quotation.notes}</p></div>` : ""}
          ${quotation.terms ? `<div><h4>Condiciones del Servicio</h4><p>${quotation.terms}</p></div>` : ""}
        </div>
      ` : ""}

      <div class="signature">
        <div class="signature-box">
          <div class="signature-line">Firma del Cliente</div>
        </div>
        <div class="signature-box">
          <div class="signature-line">Nombre y Fecha</div>
        </div>
      </div>

      <div class="footer">
        ${company?.name || ""}${company?.phone ? ` · ${company.phone}` : ""}${company?.email ? ` · ${company.email}` : ""}${company?.website ? ` · ${company.website}` : ""}
      </div>
    </body>
    </html>
  `;

  // Retornar HTML para impresión/PDF (el usuario puede usar Ctrl+P para generar PDF)
  return new NextResponse(html, {
    headers: {
      "Content-Type": "text/html; charset=utf-8",
    },
  });
}
