"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Search, Plus, Trash2, ArrowLeft } from "lucide-react";
import { formatCurrency, roundTwo } from "@/lib/utils";
import Link from "next/link";

interface Client { id: string; name: string; company: string; }
interface Product { id: string; name: string; price: number; unit: string; }
interface LineItem {
  productId: string;
  productName: string;
  productUnit: string;
  quantity: number;
  unitPrice: number;
}

export default function EditQuotationPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [clients, setClients] = useState<Client[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [clientId, setClientId] = useState("");
  const [items, setItems] = useState<LineItem[]>([]);
  const [notes, setNotes] = useState("");
  const [terms, setTerms] = useState("");
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showProductPicker, setShowProductPicker] = useState(false);
  const [productSearch, setProductSearch] = useState("");

  useEffect(() => {
    Promise.all([
      fetch("/api/clients?all=true").then((r) => r.json()),
      fetch("/api/products?all=true").then((r) => r.json()),
      fetch(`/api/quotations/${id}`).then((r) => r.json()),
    ]).then(([clientsData, productsData, quotationData]) => {
      setClients(clientsData.data || []);
      setProducts(productsData.data || []);
      if (quotationData.data) {
        setClientId(quotationData.data.clientId);
        setNotes(quotationData.data.notes || "");
        setTerms(quotationData.data.terms || "");
        setItems(
          (quotationData.data.items || []).map((item: any) => ({
            productId: item.productId || "",
            productName: item.productName,
            productUnit: item.productUnit,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
          }))
        );
      }
      setLoading(false);
    });
  }, [id]);

  const subtotal = roundTwo(items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0));
  const igvAmount = roundTwo(subtotal * 0.18);
  const total = roundTwo(subtotal + igvAmount);

  function addProduct(product: Product) {
    setItems((prev) => [...prev, { productId: product.id, productName: product.name, productUnit: product.unit, quantity: 1, unitPrice: product.price }]);
    setShowProductPicker(false);
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
    const res = await fetch(`/api/quotations/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ clientId, notes, terms, items }),
    });

    if (res.ok) {
      toast.success("Cotización actualizada");
      router.push(`/quotations/${id}`);
    } else {
      const data = await res.json();
      toast.error(data.error?.message || "Error al actualizar");
    }
    setSaving(false);
  }

  const filteredProducts = products.filter((p) => p.name.toLowerCase().includes(productSearch.toLowerCase()));

  if (loading) return <div className="text-center py-12 text-[var(--text-secondary)]">Cargando...</div>;

  return (
    <div>
      <div className="page-header">
        <div className="flex items-center gap-3">
          <Link href={`/quotations/${id}`} className="btn-icon"><ArrowLeft size={20} /></Link>
          <h1 className="page-title">Editar Cotización</h1>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2 flex flex-col gap-5">
          {/* Client */}
          <div className="glass-card p-5">
            <h3 className="text-sm font-semibold mb-3">Cliente</h3>
            <select value={clientId} onChange={(e) => setClientId(e.target.value)} className="input-field">
              <option value="">Seleccionar cliente...</option>
              {clients.map((c) => <option key={c.id} value={c.id}>{c.name}{c.company ? ` — ${c.company}` : ""}</option>)}
            </select>
          </div>

          {/* Items */}
          <div className="glass-card p-5">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold">Productos</h3>
              <button onClick={() => setShowProductPicker(true)} className="btn btn-sm btn-primary"><Plus size={14} /> Agregar</button>
            </div>
            {items.length > 0 && (
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
                      <td className="font-medium text-sm">{item.productName} <span className="text-xs text-[var(--text-secondary)]">({item.productUnit})</span></td>
                      <td><input type="number" min={1} value={item.quantity} onChange={(e) => updateItem(i, "quantity", parseInt(e.target.value) || 1)} className="input-field text-center" style={{ padding: "6px" }} /></td>
                      <td><input type="number" step="0.01" min={0.01} value={item.unitPrice} onChange={(e) => updateItem(i, "unitPrice", parseFloat(e.target.value) || 0)} className="input-field text-right" style={{ padding: "6px" }} /></td>
                      <td className="text-right font-semibold">{formatCurrency(roundTwo(item.quantity * item.unitPrice))}</td>
                      <td><button onClick={() => removeItem(i)} className="btn-icon text-[var(--accent-red)]"><Trash2 size={14} /></button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {/* Notes */}
          <div className="glass-card p-5 grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold mb-2">Notas</label>
              <textarea value={notes} onChange={(e) => setNotes(e.target.value)} className="input-field" rows={3} />
            </div>
            <div>
              <label className="block text-sm font-semibold mb-2">Condiciones</label>
              <textarea value={terms} onChange={(e) => setTerms(e.target.value)} className="input-field" rows={3} />
            </div>
          </div>
        </div>

        {/* Summary */}
        <div>
          <div className="glass-card p-5 sticky top-6">
            <h3 className="text-sm font-semibold mb-4">Resumen</h3>
            <div className="flex flex-col gap-3">
              <div className="flex justify-between text-sm"><span className="text-[var(--text-secondary)]">Subtotal</span><span>{formatCurrency(subtotal)}</span></div>
              <div className="flex justify-between text-sm"><span className="text-[var(--text-secondary)]">IGV (18%)</span><span>{formatCurrency(igvAmount)}</span></div>
              <hr className="border-[var(--border-color)]" />
              <div className="flex justify-between"><span className="font-semibold">Total</span><span className="text-xl font-bold">{formatCurrency(total)}</span></div>
            </div>
            <button onClick={handleSave} className="btn btn-primary w-full mt-6" disabled={saving}>{saving ? "Guardando..." : "Actualizar Cotización"}</button>
          </div>
        </div>
      </div>

      {showProductPicker && (
        <div className="modal-overlay" onClick={() => setShowProductPicker(false)}>
          <div className="modal-content" style={{ maxWidth: 600 }} onClick={(e) => e.stopPropagation()}>
            <h2 className="text-lg font-semibold mb-3">Seleccionar Producto</h2>
            <input type="text" value={productSearch} onChange={(e) => setProductSearch(e.target.value)} placeholder="Buscar..." className="input-field mb-3" autoFocus />
            <div className="max-h-80 overflow-y-auto">
              {filteredProducts.map((p) => (
                <button key={p.id} onClick={() => addProduct(p)} className="w-full text-left p-3 hover:bg-[rgba(0,0,0,0.03)] transition-colors border-b border-[var(--border-color)] last:border-b-0 flex items-center justify-between">
                  <span className="font-medium text-sm">{p.name}</span>
                  <span className="font-semibold text-sm">{formatCurrency(p.price)}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
