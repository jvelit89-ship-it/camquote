import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { quotations, quotationItems, clients, companySettings, contracts, receipts } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { getAuthUser } from "@/lib/auth";
import crypto from "crypto";

function formatCurrency(n: number): string {
  return `S/${n.toLocaleString("es-PE", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getAuthUser();
    if (!user || !user.tenantId) {
      return NextResponse.json({ error: { message: "No autenticado" } }, { status: 401 });
    }

    const { id } = await params;

    let quotation = db.select().from(quotations).where(and(eq(quotations.id, id), eq(quotations.tenantId, user.tenantId))).get();
    
    // Fallback if id is actually a quotationNumber
    if (!quotation) {
      quotation = db.select().from(quotations).where(and(eq(quotations.quotationNumber, id), eq(quotations.tenantId, user.tenantId))).get();
    }

    if (!quotation || quotation.isDeleted === 1) {
      console.log("Cotización no encontrada o eliminada:", id);
      return NextResponse.json({ error: { message: "Cotización no encontrada" } }, { status: 404 });
    }

    const quotationId = quotation.id;

    const body = await req.json().catch(() => ({}));
    const { 
      advanceAmount: customAdvance,
      installationAddress: customAddress,
      installationTime: customTime,
      warrantyEquipment: customWarrantyEq,
      warrantyInstallation: customWarrantyInst,
      maintenanceCost: customMaintenance,
      cameraLocations: customLocations,
      credentials: customCreds
    } = body;

    const client = db.select().from(clients).where(eq(clients.id, quotation.clientId)).get();
    
    // Default splits (70% advance if not provided)
    const advanceAmount = customAdvance !== undefined ? Number(customAdvance) : (quotation.total || 0) * 0.7;
    const balanceAmount = (quotation.total || 0) - advanceAmount;

    // Always update quotation status to 'approved'
    db.update(quotations)
      .set({ status: "approved", updatedAt: new Date().toISOString() })
      .where(eq(quotations.id, quotationId))
      .run();

    // Check if contract already exists to update instead of insert
    const existing = db.select().from(contracts).where(and(eq(contracts.quotationId, quotationId), eq(contracts.isDeleted, 0))).get();
    
    if (existing) {
      db.update(contracts)
        .set({
          installationAddress: customAddress || existing.installationAddress,
          advanceAmount,
          balanceAmount,
          installationTime: customTime || existing.installationTime,
          warrantyEquipment: customWarrantyEq || existing.warrantyEquipment,
          warrantyInstallation: customWarrantyInst || existing.warrantyInstallation,
          maintenanceCost: customMaintenance || existing.maintenanceCost,
          cameraLocations: customLocations ? JSON.stringify(customLocations) : existing.cameraLocations,
          credentials: customCreds ? JSON.stringify(customCreds) : existing.credentials,
          updatedAt: new Date().toISOString()
        })
        .where(eq(contracts.id, existing.id))
        .run();

      return NextResponse.json({ data: { ...existing, advanceAmount, balanceAmount } });
    }

    const contractId = crypto.randomUUID();
    const contractNumber = `CONT-${quotation.quotationNumber.split('-')[1] || Date.now().toString().slice(-4)}`;

    const newContract = {
      id: contractId,
      tenantId: user.tenantId,
      quotationId,
      contractNumber,
      installationAddress: customAddress || client?.address || "",
      advanceAmount,
      balanceAmount,
      installationTime: customTime || "8 horas",
      warrantyEquipment: customWarrantyEq || 12,
      warrantyInstallation: customWarrantyInst || 6,
      maintenanceCost: customMaintenance || 80,
      cameraLocations: customLocations ? JSON.stringify(customLocations) : JSON.stringify(["Cámara 1: Entrada Principal"]),
      credentials: customCreds ? JSON.stringify(customCreds) : JSON.stringify({
        app: "DMSS / Hik-Connect",
        user: "admin",
        password: "Por definir en instalación"
      }),
      status: "draft",
      isDeleted: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    db.insert(contracts).values(newContract).run();

    // Create the first receipt if advanceAmount > 0
    if (advanceAmount > 0) {
      const receiptId = crypto.randomUUID();
      const receiptNumber = `REC-${quotation.quotationNumber.split('-')[1] || Date.now().toString().slice(-4)}`;
      
      db.insert(receipts).values({
        id: receiptId,
        tenantId: user.tenantId,
        contractId,
        receiptNumber,
        amount: advanceAmount,
        concept: "Adelanto",
        date: new Date().toISOString(),
        createdAt: new Date().toISOString()
      }).run();
    }

    return NextResponse.json({ data: newContract });
  } catch (err: any) {
    console.error("Contract Generation API error:", err);
    return NextResponse.json({ error: { message: "Error al generar contrato" } }, { status: 500 });
  }
}

// GET returns the printing HTML view of the contract
export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getAuthUser();
  if (!user || !user.tenantId) {
    return NextResponse.json({ error: { message: "No autenticado" } }, { status: 401 });
  }

  const { id } = await params;

  let quotation = db.select().from(quotations).where(and(eq(quotations.id, id), eq(quotations.tenantId, user.tenantId))).get();
  
  if (!quotation) {
    quotation = db.select().from(quotations).where(and(eq(quotations.quotationNumber, id), eq(quotations.tenantId, user.tenantId))).get();
  }

  if (!quotation || quotation.isDeleted === 1) {
    return NextResponse.json({ error: { message: "Cotización no encontrada" } }, { status: 404 });
  }

  const quotationId = quotation.id;

  const contract = db.select().from(contracts).where(and(eq(contracts.quotationId, quotationId), eq(contracts.isDeleted, 0))).get();
  if (!contract) {
    return NextResponse.json({ error: { message: "Contrato no generado" } }, { status: 404 });
  }

  const items = db.select().from(quotationItems).where(eq(quotationItems.quotationId, quotationId)).orderBy(quotationItems.sortOrder).all();
  const client = db.select().from(clients).where(and(eq(clients.id, quotation.clientId), eq(clients.tenantId, user.tenantId))).get();
  const company = db.select().from(companySettings).where(eq(companySettings.tenantId, user.tenantId)).get();

  const primaryColor = company?.primaryColor || "#1a1a2e";
  
  // Try counting cameras from items
  const cameraCount = items.filter(i => i.productName.toLowerCase().includes('camara') || i.productName.toLowerCase().includes('cámara')).reduce((sum: number, i: any) => sum + (i.quantity || 0), 0) || "______";
  const dvrInfo = items.find(i => i.productName.toLowerCase().includes('dvr') || i.productName.toLowerCase().includes('nvr'))?.productName || "______ canales";
  const hddInfo = items.find(i => i.productName.toLowerCase().includes('disco'))?.productName || "______ TB";

  let cameraLocations = [];
  try { cameraLocations = JSON.parse(contract.cameraLocations || "[]"); } catch (e) {}
  
  let credentials: any = {};
  try { credentials = JSON.parse(contract.credentials || "{}"); } catch (e) {}

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Contrato ${contract.contractNumber}</title>
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: 'Segoe UI', Arial, sans-serif; color: #1a1a2e; padding: 40px; font-size: 14px; line-height: 1.6; }
        .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 30px; border-bottom: 2px solid ${primaryColor}; padding-bottom: 20px; }
        .logo-container { height: 60px; margin-bottom: 10px; }
        .logo-img { height: 100%; object-contain: contain; }
        h1 { text-align: center; font-size: 18px; margin-bottom: 24px; color: ${primaryColor}; font-weight: bold; }
        h2 { font-size: 14px; font-weight: bold; margin-top: 24px; margin-bottom: 12px; text-transform: uppercase; color: #374151; border-bottom: 1px solid #e5e7eb; padding-bottom: 4px; }
        p { margin-bottom: 12px; text-align: justify; }
        .indent { margin-left: 20px; margin-bottom: 8px; }
        .grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 20px; }
        .signature-box { margin-top: 60px; display: flex; justify-content: space-around; }
        .sig-line { width: 250px; border-top: 1px solid #1a1a2e; text-align: center; padding-top: 8px; font-weight: bold; }
        .page-break { page-break-before: always; }
        .anexo-box { border: 1px solid #e5e7eb; padding: 20px; margin-bottom: 20px; }
        @media print {
          body { padding: 20px; }
        }
      </style>
    </head>
    <body>
      <div class="header">
        <div>
          ${company?.logo ? `<div class="logo-container"><img src="${company.logo}" class="logo-img" /></div>` : ""}
        </div>
        <div style="text-align: right">
          <strong>Contrato N°:</strong> ${contract.contractNumber}<br>
          <strong>Fecha:</strong> ${new Date(contract.createdAt).toLocaleDateString("es-PE")}
        </div>
      </div>

      <h1>CONTRATO DE SUMINISTRO, INSTALACIÓN Y CONFIGURACIÓN<br>DE SISTEMA DE VIDEOVIGILANCIA (CCTV)</h1>

      <p>Entre los suscritos a saber:</p>
      
      <p><strong>LA EMPRESA PROVEEDORA</strong><br>
      Razón Social: ${company?.name || "______________________________"}<br>
      RUC: ${company?.ruc || "______________________________"}<br>
      Dirección: ${company?.address || "______________________________"}<br>
      Representante: ${company?.legalRepresentative || "______________________________"} (DNI: ${company?.legalRepresentativeDni || "______________________________"})<br>
      En adelante denominada EL PROVEEDOR.</p>

      <p>Y de la otra parte:</p>

      <p><strong>EL CLIENTE</strong><br>
      Nombre / Razón Social: ${client?.name || "______________________________"}<br>
      DNI / RUC: ${client?.documentNumber || "______________________________"}<br>
      Dirección: ${client?.address || "______________________________"}<br>
      Teléfono: ${client?.phone || "______________________________"}<br>
      En adelante denominado EL CLIENTE.</p>

      <p>Ambas partes acuerdan celebrar el presente contrato bajo las siguientes cláusulas:</p>

      <h2>PRIMERA: OBJETO DEL CONTRATO</h2>
      <p>EL PROVEEDOR se compromete a suministrar, instalar, configurar y poner en funcionamiento un sistema de videovigilancia (CCTV) en el inmueble del cliente, permitiendo la grabación y monitoreo de imágenes en tiempo real.</p>

      <h2>SEGUNDA: UBICACIÓN DEL PROYECTO</h2>
      <p>Dirección del lugar de instalación: <br><strong>${contract.installationAddress || client?.address || "___________________________________________________________"}</strong></p>

      <h2>TERCERA: EQUIPOS Y COMPONENTES</h2>
      <p>El sistema de videovigilancia incluirá:</p>
      <div class="indent">
        • ${cameraCount} cámaras de seguridad<br>
        • DVR / NVR de ${dvrInfo}<br>
        • Disco duro de ${hddInfo}<br>
        • Fuente de alimentación, Cableado estructurado, Conectores y accesorios<br>
        • Configuración de acceso remoto
      </div>

      <h2>CUARTA: MONTO DEL CONTRATO Y FORMA DE PAGO</h2>
      <p>Monto total del servicio: <strong>${formatCurrency(quotation.total)}</strong></p>
      <div class="indent">
        • Adelanto: <strong>${formatCurrency(contract.advanceAmount || 0)}</strong><br>
        • Saldo contra entrega: <strong>${formatCurrency(contract.balanceAmount || 0)}</strong>
      </div>

      <h2>QUINTA: PLAZO DE INSTALACIÓN</h2>
      <p>El tiempo estimado de instalación será de: <strong>${contract.installationTime}</strong>.</p>

      <h2>SEXTA: GARANTÍA</h2>
      <p>EL PROVEEDOR otorga:</p>
      <div class="indent">
        • Garantía de equipos: <strong>${contract.warrantyEquipment} meses</strong><br>
        • Garantía de instalación: <strong>${contract.warrantyInstallation} meses</strong>
      </div>
      <p>La garantía no cubre: Daños por manipulación indebida, daños eléctricos, vandalismo o sabotaje, desastres naturales, o cambios en la red de internet del cliente.</p>

      <h2>SÉPTIMA: ACCESO REMOTO</h2>
      <p>EL PROVEEDOR configurará el acceso remoto mediante aplicación móvil o computadora. El funcionamiento continuo dependerá del servicio del proveedor de internet del cliente.</p>

      <h2>OCTAVA: RESPONSABILIDAD DEL CLIENTE</h2>
      <div class="indent">
        • Facilitar el acceso al lugar de instalación.<br>
        • Proveer suministro eléctrico y conexión a internet estable.<br>
        • No manipular los equipos sin autorización técnica.
      </div>

      <h2>NOVENA: LIMITACIÓN DE RESPONSABILIDAD</h2>
      <p>EL PROVEEDOR no será responsable por robos ocurridos en el inmueble, pérdidas económicas derivadas de fallas del sistema, ni interrupciones eléctricas/internet. El CCTV es una herramienta de disuasión y monitoreo, no una garantía absoluta contra actos ilícitos.</p>

      <h2>DÉCIMA: PROPIEDAD DE LOS EQUIPOS</h2>
      <p>Los equipos instalados serán propiedad exclusiva de EL CLIENTE una vez cancelado el 100% del monto total (CUARTA Cláusula).</p>

      <h2>DÉCIMA PRIMERA: MODIFICACIONES</h2>
      <p>Cualquier modificación posterior (cámaras adicionales, cambio de ubicación) será considerada un servicio adicional con costo extra.</p>

      <h2>DÉCIMA SEGUNDA: MANTENIMIENTO</h2>
      <p>El contrato no incluye mantenimiento preventivo periódico. Costo de visita técnica fuera de garantía: <strong>${formatCurrency(contract.maintenanceCost || 0)}</strong>.</p>

      <h2>DÉCIMA TERCERA: CANCELACIÓN DEL SERVICIO</h2>
      <p>En caso de cancelación por parte del cliente luego de iniciado el servicio y/o compra de equipos, el adelanto no será reembolsable.</p>

      <h2>DÉCIMA CUARTA: JURISDICCIÓN Y FIRMAS</h2>
      <p>Las partes acuerdan que cualquier controversia será resuelta conforme a las leyes de la República del Perú.</p>
      
      <p>Lugar y fecha: __________________________ , ${new Date().toLocaleDateString("es-PE")}</p>

      <div class="signature-box">
        <div class="sig-line">
          EL CLIENTE<br>
          <span style="font-weight: normal; font-size: 12px;">${client?.name || ""}</span>
        </div>
        <div class="sig-line">
          EL PROVEEDOR<br>
          <span style="font-weight: normal; font-size: 12px;">${company?.name || ""}</span><br>
          <span style="font-weight: normal; font-size: 10px;">Att: ${company?.legalRepresentative || ""}</span>
        </div>
      </div>

      <div class="page-break"></div>

      <h1>ANEXOS TÉCNICOS</h1>

      <div class="anexo-box">
        <h2>ANEXO 1: ACTA DE ENTREGA DEL SISTEMA CCTV</h2>
        <div class="grid-2">
          <div><strong>Fecha de instalación:</strong> __________________</div>
          <div><strong>Cliente:</strong> ${client?.name || ""}</div>
        </div>
        <p>Se deja constancia de que el sistema CCTV fue:</p>
        <p>☐ Instalado &nbsp;&nbsp;&nbsp;&nbsp; ☐ Configurado &nbsp;&nbsp;&nbsp;&nbsp; ☐ Probado correctamente</p>
        <p><strong>Equipos entregados:</strong></p>
        <div class="indent">
          Número de cámaras: ________<br>
          DVR / NVR: ________<br>
          Disco Duro: ________
        </div>
        <p><strong>Observaciones:</strong> __________________________________________________________________<br>_________________________________________________________________________________</p>
        <div class="signature-box" style="margin-top: 40px">
          <div class="sig-line" style="width:200px">Firma del cliente</div>
          <div class="sig-line" style="width:200px">Firma del técnico</div>
        </div>
      </div>

      <div class="anexo-box">
        <h2>ANEXO 2: PLANO DE UBICACIÓN Y DISTRIBUCIÓN</h2>
        <div style="height: 150px; border: 1px dashed #ccc; margin-bottom: 20px; display: flex; align-items: center; justify-content: center; color: #9ca3af;">
          (El técnico deberá dibujar o adjuntar el croquis de ubicación)
        </div>
        ${cameraLocations.map((loc: string, i: number) => `<p>Cámara ${i+1}: ${loc}</p>`).join("")}
        ${cameraLocations.length === 0 ? `
          <p>Cámara 1: __________________</p>
          <p>Cámara 2: __________________</p>
          <p>Cámara 3: __________________</p>
          <p>Cámara 4: __________________</p>
        ` : ""}
      </div>

      <div class="anexo-box">
        <h2>ANEXO 3: CREDENCIALES DE ACCESO</h2>
        <p><em>(Completar por el técnico instalador y entregar al cliente)</em></p>
        <div class="grid-2" style="margin-top: 20px">
          <div><strong>Aplicación / Sistema:</strong> ${credentials.app || "__________________"}</div>
          <div><strong>Usuario:</strong> ${credentials.user || "__________________"}</div>
          <div><strong>Contraseña P2P:</strong> ${credentials.password || "__________________"}</div>
          <div><strong>Dirección IP Local:</strong> ${credentials.ip || "__________________"}</div>
          <div><strong>Puerto:</strong> ${credentials.port || "__________________"}</div>
          <div><strong>Correo asociado:</strong> ${credentials.email || "__________________"}</div>
        </div>
      </div>

    </body>
    </html>
  `;

  return new NextResponse(html, {
    headers: { "Content-Type": "text/html; charset=utf-8" },
  });
}
