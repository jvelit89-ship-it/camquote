"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Search, Plus, Trash2, ArrowLeft, Bot, PenTool } from "lucide-react";
import { formatCurrency, roundTwo } from "@/lib/utils";
import { PRODUCT_CATEGORIES } from "@/db/schema";
import Link from "next/link";
import QuotationWizard from "@/components/QuotationWizard";
import type { CalculatedItem } from "@/lib/quotation-calculator";

interface Client { id: string; name: string; company: string; }
interface Product { id: string; name: string; price: number; unit: string; category: string; }
interface LineItem {
  productId: string;
  productName: string;
  productUnit: string;
  quantity: number;
  unitPrice: number;
}

export default function NewQuotationPage() {
  const router = useRouter();
  const [mode, setMode] = useState<"wizard" | "manual">("wizard");
  const [clients, setClients] = useState<Client[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [clientId, setClientId] = useState("");
  const [clientSearch, setClientSearch] = useState("");
  const [productSearch, setProductSearch] = useState("");
  const [items, setItems] = useState<LineItem[]>([]);
  const [notes, setNotes] = useState("");
  const [terms, setTerms] = useState("- Garantía de 1 año en equipos.\n- Tiempo de instalación: según evaluación.\n- Validez de cotización: 15 días.");
  const [saving, setSaving] = useState(false);
  const [showProductPicker, setShowProductPicker] = useState(false);
  const [igvRate] = useState(0.18);

  function handleWizardComplete(calculatedItems: CalculatedItem[]) {
    const lineItems: LineItem[] = calculatedItems.map((ci) => ({
      productId: "",
      productName: ci.productName,
      productUnit: ci.productUnit,
      quantity: ci.quantity,
      unitPrice: ci.unitPrice,
    }));
    setItems(lineItems);
    setMode("manual");
    toast.success(`${lineItems.length} items generados por el asistente`);
  }

  useEffect(() => {
    fetch("/api/clients?all=true").then((r) => r.json()).then((d) => setClients(d.data || []));
    fetch("/api/products?all=true").then((r) => r.json()).then((d) => setProducts(d.data || []));
  }, []);

  const subtotal = roundTwo(items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0));
  const igvAmount = roundTwo(subtotal * igvRate);
  const total = roundTwo(subtotal + igvAmount);

  function addProduct(product: Product) {
    setItems((prev) => [
      ...prev,
      { productId: product.id, productName: product.name, productUnit: product.unit, quantity: 1, unitPrice: product.price },
    ]);
    setShowProductPicker(false);
    setProductSearch("");
  }

  function updateItem(index: number, field: string, value: number) {
    setItems((prev) => prev.map((item, i) => i === index ? { ...item, [field]: value } : item));
  }

  function removeItem(index: number) {
    setItems((prev) => prev.filter((_, i) => i !== index));
  }

  async function handleSave() {
    if (!clientId) { toast.error("Selecciona un cliente"); return; }
    if (items.length === 0) { toast.error("Agrega al menos un producto"); return; }

    setSaving(true);
    const res = await fetch("/api/quotations", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ clientId, notes, terms, items }),
    });

    if (res.ok) {
      const data = await res.json();
      toast.success(`Cotización ${data.data.quotationNumber} creada`);
      router.push(`/quotations/${data.data.id}`);
    } else {
      const data = await res.json();
      toast.error(data.error?.message || "Error al crear");
    }
    setSaving(false);
  }

  const filteredClients = clients.filter((c) =>
    c.name.toLowerCase().includes(clientSearch.toLowerCase()) ||
    c.company?.toLowerCase().includes(clientSearch.toLowerCase())
  );

  const filteredProducts = products.filter((p) =>
    p.name.toLowerCase().includes(productSearch.toLowerCase())
  );

  const selectedClient = clients.find((c) => c.id === clientId);

  return (
    <div>
      <div className="page-header">
        <div className="flex items-center gap-3">
          <Link href="/quotations" className="btn-icon"><ArrowLeft size={20} /></Link>
          <div>
            <h1 className="page-title">Nueva Cotización</h1>
            <p className="text-sm text-[var(--text-secondary)]">Genera una cotización profesional</p>
          </div>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setMode("wizard")}
            className={`btn btn-sm flex items-center gap-2 ${mode === "wizard" ? "btn-primary" : "btn-secondary"}`}
          >
            <Bot size={14} /> Asistente IA
          </button>
          <button
            onClick={() => setMode("manual")}
            className={`btn btn-sm flex items-center gap-2 ${mode === "manual" ? "btn-primary" : "btn-secondary"}`}
          >
            <PenTool size={14} /> Manual
          </button>
        </div>
      </div>

      {mode === "wizard" && (
        <div className="mb-6">
          <QuotationWizard onComplete={handleWizardComplete} />
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Main form */}
        <div className="lg:col-span-2 flex flex-col gap-5">
          {/* Client selector */}
          <div className="glass-card p-5">
            <h3 className="text-sm font-semibold mb-3">Cliente</h3>
            {selectedClient ? (
              <div className="flex items-center justify-between p-3 rounded-xl bg-[rgba(0,0,0,0.03)]">
                <div>
                  <p className="font-medium">{selectedClient.name}</p>
                  {selectedClient.company && <p className="text-xs text-[var(--text-secondary)]">{selectedClient.company}</p>}
                </div>
                <button onClick={() => setClientId("")} className="btn btn-sm btn-secondary">Cambiar</button>
              </div>
            ) : (
              <div>
                <input
                  type="text"
                  value={clientSearch}
                  onChange={(e) => setClientSearch(e.target.value)}
                  placeholder="Buscar cliente..."
                  className="input-field mb-2"
                />
                <div className="max-h-40 overflow-y-auto rounded-lg border border-[var(--border-color)]">
                  {filteredClients.map((c) => (
                    <button key={c.id} onClick={() => { setClientId(c.id); setClientSearch(""); }} className="w-full text-left p-3 hover:bg-[rgba(0,0,0,0.03)] transition-colors border-b border-[var(--border-color)] last:border-b-0">
                      <p className="font-medium text-sm">{c.name}</p>
                      {c.company && <p className="text-xs text-[var(--text-secondary)]">{c.company}</p>}
                    </button>
                  ))}
                  {filteredClients.length === 0 && <p className="p-3 text-sm text-[var(--text-secondary)]">No se encontraron clientes</p>}
                </div>
              </div>
            )}
          </div>

          {/* Items */}
          <div className="glass-card p-5">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold">Productos</h3>
              <button onClick={() => setShowProductPicker(true)} className="btn btn-sm btn-primary">
                <Plus size={14} /> Agregar
              </button>
            </div>

            {items.length === 0 ? (
              <p className="text-sm text-[var(--text-secondary)] py-6 text-center">
                Agrega productos desde el catálogo
              </p>
            ) : (
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Producto</th>
                    <th style={{ width: 80 }}>Cant.</th>
                    <th style={{ width: 120 }}>P. Unit.</th>
                    <th style={{ width: 100 }}>Subtotal</th>
                    <th style={{ width: 40 }}></th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((item, i) => (
                    <tr key={i}>
                      <td>
                        <span className="font-medium text-sm">{item.productName}</span>
                        <span className="text-xs text-[var(--text-secondary)] ml-1">({item.productUnit})</span>
                      </td>
                      <td>
                        <input
                          type="number"
                          min={1}
                          value={item.quantity}
                          onChange={(e) => updateItem(i, "quantity", parseInt(e.target.value) || 1)}
                          className="input-field text-center"
                          style={{ padding: "6px 8px" }}
                        />
                      </td>
                      <td>
                        <input
                          type="number"
                          step="0.01"
                          min={0.01}
                          value={item.unitPrice}
                          onChange={(e) => updateItem(i, "unitPrice", parseFloat(e.target.value) || 0)}
                          className="input-field text-right"
                          style={{ padding: "6px 8px" }}
                        />
                      </td>
                      <td className="text-right font-semibold">{formatCurrency(roundTwo(item.quantity * item.unitPrice))}</td>
                      <td>
                        <button onClick={() => removeItem(i)} className="btn-icon text-[var(--accent-red)]"><Trash2 size={14} /></button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {/* Notes & Terms */}
          <div className="glass-card p-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold mb-2">Notas</label>
                <textarea value={notes} onChange={(e) => setNotes(e.target.value)} className="input-field" rows={4} placeholder="Notas adicionales para el cliente..." />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-2">Condiciones del Servicio</label>
                <textarea value={terms} onChange={(e) => setTerms(e.target.value)} className="input-field" rows={4} />
              </div>
            </div>
          </div>
        </div>

        {/* Summary sidebar */}
        <div>
          <div className="glass-card p-5 sticky top-6">
            <h3 className="text-sm font-semibold mb-4">Resumen</h3>

            <div className="flex flex-col gap-3">
              <div className="flex justify-between text-sm">
                <span className="text-[var(--text-secondary)]">Subtotal</span>
                <span className="font-medium">{formatCurrency(subtotal)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-[var(--text-secondary)]">IGV (18%)</span>
                <span className="font-medium">{formatCurrency(igvAmount)}</span>
              </div>
              <hr className="border-[var(--border-color)]" />
              <div className="flex justify-between">
                <span className="font-semibold">Total</span>
                <span className="text-xl font-bold">{formatCurrency(total)}</span>
              </div>
            </div>

            <div className="flex flex-col gap-2 mt-6">
              <button onClick={handleSave} className="btn btn-primary w-full" disabled={saving}>
                {saving ? "Guardando..." : "Guardar Cotización"}
              </button>
            </div>

            <div className="mt-4 p-3 rounded-xl bg-[rgba(0,0,0,0.03)]">
              <p className="text-xs text-[var(--text-secondary)]">
                {items.length} producto{items.length !== 1 ? "s" : ""} en la cotización
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Product picker modal */}
      {showProductPicker && (
        <div className="modal-overlay" onClick={() => setShowProductPicker(false)}>
          <div className="modal-content" style={{ maxWidth: 600 }} onClick={(e) => e.stopPropagation()}>
            <h2 className="text-lg font-semibold mb-3">Seleccionar Producto</h2>
            <input
              type="text"
              value={productSearch}
              onChange={(e) => setProductSearch(e.target.value)}
              placeholder="Buscar producto..."
              className="input-field mb-3"
              autoFocus
            />
            <div className="max-h-80 overflow-y-auto">
              {filteredProducts.map((p) => (
                <button key={p.id} onClick={() => addProduct(p)} className="w-full text-left p-3 hover:bg-[rgba(0,0,0,0.03)] transition-colors border-b border-[var(--border-color)] last:border-b-0 flex items-center justify-between">
                  <div>
                    <p className="font-medium text-sm">{p.name}</p>
                    <p className="text-xs text-[var(--text-secondary)]">{p.unit}</p>
                  </div>
                  <span className="font-semibold text-sm">{formatCurrency(p.price)}</span>
                </button>
              ))}
              {filteredProducts.length === 0 && <p className="p-3 text-center text-sm text-[var(--text-secondary)]">No se encontraron productos</p>}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
