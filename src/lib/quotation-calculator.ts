/**
 * Motor de cálculo de materiales para instalaciones CCTV.
 * Genera automáticamente la lista de items basándose en la configuración del proyecto.
 *
 * Precios basados en investigación del mercado peruano (Hikvision/Dahua).
 */

// --- Tipos ---

export type ServiceType = "new_install" | "reinstall" | "preventive_maintenance" | "corrective_maintenance";
export type CameraType = "bullet_2mp" | "dome_2mp" | "colorvu_2mp" | "ip_ptz_4mp";
export type CameraLocation = "interior" | "exterior";
export type ChannelType = "conduit" | "corrugated" | "rigid" | "none";
export type DvrType = "dvr_4ch" | "dvr_8ch" | "nvr_4ch_poe" | "none";
export type HddType = "1tb" | "2tb" | "none";

export interface CameraPoint {
  cameraType: CameraType;
  location: CameraLocation;
  distanceMeters: number;
}

export interface ProjectConfig {
  serviceType: ServiceType;
  cameraPoints: CameraPoint[];
  channelType: ChannelType;
  dvrType: DvrType;
  hddType: HddType;
}

export interface CalculatedItem {
  productName: string;
  productUnit: string;
  quantity: number;
  unitPrice: number;
}

// --- Catálogo de precios (mercado peruano real) ---

const CAMERA_PRICES: Record<CameraType, { name: string; price: number }> = {
  bullet_2mp: { name: "Cámara Hikvision Bullet 2MP 1080P IR20m", price: 145 },
  dome_2mp: { name: "Cámara Dahua Domo 2MP 1080P Audio incorporado", price: 168 },
  colorvu_2mp: { name: "Cámara Hikvision ColorVu 2MP (Color 24/7)", price: 215 },
  ip_ptz_4mp: { name: "Cámara IP Dahua 4MP PoE PTZ", price: 485 },
};

const DVR_PRICES: Record<Exclude<DvrType, "none">, { name: string; price: number }> = {
  dvr_4ch: { name: "DVR Hikvision 4 Canales 1080P Lite", price: 229 },
  dvr_8ch: { name: "DVR Dahua 8 Canales 1080P H.265+", price: 345 },
  nvr_4ch_poe: { name: "NVR Dahua 4 Canales PoE 4K", price: 580 },
};

const HDD_PRICES: Record<Exclude<HddType, "none">, { name: string; price: number }> = {
  "1tb": { name: "Disco Duro 1TB WD Purple (Especial CCTV)", price: 320 },
  "2tb": { name: "Disco Duro 2TB WD Purple (Especial CCTV)", price: 425 },
};

const MATERIAL_PRICES = {
  connectorDC: { name: "Conector DC macho/hembra (par)", unit: "par", price: 4.0 },
  balunHD: { name: "Balun HD pasivo (par)", unit: "par", price: 15.0 },
  junctionBox: { name: "Caja de paso 10×10cm estanca", unit: "unidad", price: 12.0 },
  powerSupply: { name: "Fuente de poder 12V 1A", unit: "unidad", price: 18.0 },
  cableUTP: { name: "Cable UTP Cat5e (por metro)", unit: "metro", price: 0.85 },
  conduit: { name: "Canaleta 20×12mm con adhesivo (2m)", unit: "tramo", price: 4.5 },
  corrugated: { name: "Tubo corrugado flexible ½\" (por metro)", unit: "metro", price: 1.4 },
  rigid: { name: "Tubo rígido PVC ¾\" (3m)", unit: "tramo", price: 6.5 },
  labor: { name: "Instalación y Configuración por cámara", unit: "servicio", price: 150.0 },
  preventiveMaint: { name: "Mantenimiento Preventivo por cámara", unit: "servicio", price: 80.0 },
  correctiveMaint: { name: "Mantenimiento Correctivo (evaluación + reparación)", unit: "servicio", price: 120.0 },
  remoteConfig: { name: "Servicio de Configuración Remota (App)", unit: "servicio", price: 60.0 },
};

// --- Funciones auxiliares ---

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

/** Agrega un item al acumulador, sumando cantidades si ya existe */
function addItem(items: Map<string, CalculatedItem>, name: string, unit: string, qty: number, price: number) {
  const existing = items.get(name);
  if (existing) {
    existing.quantity += qty;
  } else {
    items.set(name, { productName: name, productUnit: unit, quantity: qty, unitPrice: price });
  }
}

// --- Motor principal ---

export function calculateMaterials(config: ProjectConfig): CalculatedItem[] {
  const items = new Map<string, CalculatedItem>();
  const { serviceType, cameraPoints, channelType, dvrType, hddType } = config;

  // Mantenimiento preventivo: solo servicios
  if (serviceType === "preventive_maintenance") {
    const count = cameraPoints.length || 1;
    addItem(items, MATERIAL_PRICES.preventiveMaint.name, MATERIAL_PRICES.preventiveMaint.unit, count, MATERIAL_PRICES.preventiveMaint.price);
    addItem(items, MATERIAL_PRICES.remoteConfig.name, MATERIAL_PRICES.remoteConfig.unit, 1, MATERIAL_PRICES.remoteConfig.price);
    return Array.from(items.values());
  }

  // Mantenimiento correctivo: evaluación + posible repuesto
  if (serviceType === "corrective_maintenance") {
    const count = cameraPoints.length || 1;
    addItem(items, MATERIAL_PRICES.correctiveMaint.name, MATERIAL_PRICES.correctiveMaint.unit, count, MATERIAL_PRICES.correctiveMaint.price);
    return Array.from(items.values());
  }

  // Instalación nueva o reinstalación
  for (const point of cameraPoints) {
    const camera = CAMERA_PRICES[point.cameraType];

    // Cámara
    addItem(items, camera.name, "unidad", 1, camera.price);

    // Conectores DC (1 par por cámara)
    addItem(items, MATERIAL_PRICES.connectorDC.name, MATERIAL_PRICES.connectorDC.unit, 1, MATERIAL_PRICES.connectorDC.price);

    // Balun HD (1 par por cámara, excepto cámaras IP que usan PoE)
    if (point.cameraType !== "ip_ptz_4mp") {
      addItem(items, MATERIAL_PRICES.balunHD.name, MATERIAL_PRICES.balunHD.unit, 1, MATERIAL_PRICES.balunHD.price);
    }

    // Fuente de poder (1 por cámara, excepto IP PoE)
    if (point.cameraType !== "ip_ptz_4mp") {
      addItem(items, MATERIAL_PRICES.powerSupply.name, MATERIAL_PRICES.powerSupply.unit, 1, MATERIAL_PRICES.powerSupply.price);
    }

    // Caja de paso (solo si exterior)
    if (point.location === "exterior") {
      addItem(items, MATERIAL_PRICES.junctionBox.name, MATERIAL_PRICES.junctionBox.unit, 1, MATERIAL_PRICES.junctionBox.price);
    }

    // Cable UTP: distancia × 1.15 (margen de holgura del 15%)
    const cableMeters = Math.ceil(point.distanceMeters * 1.15);
    addItem(items, MATERIAL_PRICES.cableUTP.name, MATERIAL_PRICES.cableUTP.unit, cableMeters, MATERIAL_PRICES.cableUTP.price);

    // Canalización según tipo
    if (channelType === "conduit") {
      const tramos = Math.ceil(point.distanceMeters / 2);
      addItem(items, MATERIAL_PRICES.conduit.name, MATERIAL_PRICES.conduit.unit, tramos, MATERIAL_PRICES.conduit.price);
    } else if (channelType === "corrugated") {
      const metros = Math.ceil(point.distanceMeters);
      addItem(items, MATERIAL_PRICES.corrugated.name, MATERIAL_PRICES.corrugated.unit, metros, MATERIAL_PRICES.corrugated.price);
    } else if (channelType === "rigid") {
      const tramos = Math.ceil(point.distanceMeters / 3);
      addItem(items, MATERIAL_PRICES.rigid.name, MATERIAL_PRICES.rigid.unit, tramos, MATERIAL_PRICES.rigid.price);
    }

    // Mano de obra
    addItem(items, MATERIAL_PRICES.labor.name, MATERIAL_PRICES.labor.unit, 1, MATERIAL_PRICES.labor.price);
  }

  // DVR/NVR
  if (dvrType !== "none") {
    const dvr = DVR_PRICES[dvrType];
    addItem(items, dvr.name, "unidad", 1, dvr.price);
  }

  // Disco duro
  if (hddType !== "none") {
    const hdd = HDD_PRICES[hddType];
    addItem(items, hdd.name, "unidad", 1, hdd.price);
  }

  // Configuración remota (siempre incluida en instalación nueva)
  if (serviceType === "new_install") {
    addItem(items, MATERIAL_PRICES.remoteConfig.name, MATERIAL_PRICES.remoteConfig.unit, 1, MATERIAL_PRICES.remoteConfig.price);
  }

  return Array.from(items.values());
}

// --- Labels para la UI ---

export const SERVICE_TYPE_LABELS: Record<ServiceType, string> = {
  new_install: "Instalación Nueva",
  reinstall: "Reinstalación",
  preventive_maintenance: "Mantenimiento Preventivo",
  corrective_maintenance: "Mantenimiento Correctivo",
};

export const CAMERA_TYPE_LABELS: Record<CameraType, string> = {
  bullet_2mp: "Hikvision Bullet 2MP (S/145)",
  dome_2mp: "Dahua Domo 2MP Audio (S/168)",
  colorvu_2mp: "Hikvision ColorVu 2MP (S/215)",
  ip_ptz_4mp: "Dahua IP PTZ 4MP (S/485)",
};

export const LOCATION_LABELS: Record<CameraLocation, string> = {
  interior: "Interior",
  exterior: "Exterior",
};

export const CHANNEL_LABELS: Record<ChannelType, string> = {
  conduit: "Canaleta (S/4.50/2m)",
  corrugated: "Tubo corrugado (S/1.40/m)",
  rigid: "Tubo rígido PVC (S/6.50/3m)",
  none: "Sin canalización",
};

export const DVR_LABELS: Record<DvrType, string> = {
  dvr_4ch: "DVR 4 Canales (S/229)",
  dvr_8ch: "DVR 8 Canales (S/345)",
  nvr_4ch_poe: "NVR 4ch PoE 4K (S/580)",
  none: "No necesita",
};

export const HDD_LABELS: Record<HddType, string> = {
  "1tb": "WD Purple 1TB (S/320)",
  "2tb": "WD Purple 2TB (S/425)",
  none: "No necesita",
};
