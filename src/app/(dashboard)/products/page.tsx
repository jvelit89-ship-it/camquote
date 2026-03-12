"use client";

import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";
import { Search, Plus, Pencil, Trash2, ChevronLeft, ChevronRight } from "lucide-react";
import { PRODUCT_CATEGORIES } from "@/db/schema";
import { formatCurrency } from "@/lib/utils";
import { AdBanner } from "@/components/ads/AdBanner";

interface Product {
  id: string;
  name: string;
  category: string;
  price: number;
  description: string;
  unit: string;
}

interface Pagination {
  page: number;
  totalPages: number;
  total: number;
}

const CATEGORY_MAP = Object.fromEntries(PRODUCT_CATEGORIES.map((c) => [c.value, c.label]));

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [pagination, setPagination] = useState<Pagination>({ page: 1, totalPages: 1, total: 0 });
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");
  const [page, setPage] = useState(1);
  const [showForm, setShowForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({ page: page.toString(), limit: "20" });
    if (search) params.set("search", search);
    if (category) params.set("category", category);
    const res = await fetch(`/api/products?${params}`);
    const json = await res.json();
    setProducts(json.data || []);
    setPagination(json.pagination || { page: 1, totalPages: 1, total: 0 });
    setLoading(false);
  }, [page, search, category]);

  useEffect(() => { fetchProducts(); }, [fetchProducts]);

  async function handleDelete(id: string) {
    if (!confirm("¿Eliminar este producto?")) return;
    await fetch(`/api/products/${id}`, { method: "DELETE" });
    toast.success("Producto eliminado");
    fetchProducts();
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Catálogo de Productos</h1>
          <p className="text-sm text-[var(--text-secondary)]">{pagination.total} productos</p>
        </div>
        <button onClick={() => { setEditingProduct(null); setShowForm(true); }} className="btn btn-primary">
          <Plus size={18} /> Nuevo Producto
        </button>
      </div>

      {/* Filters */}
      <div className="glass-card p-4 mb-5">
        <div className="flex gap-4">
          <div className="search-bar flex-1">
            <Search size={16} />
            <input
              type="text"
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              placeholder="Buscar productos..."
              className="input-field"
              style={{ paddingLeft: 38 }}
            />
          </div>
          <select
            value={category}
            onChange={(e) => { setCategory(e.target.value); setPage(1); }}
            className="input-field"
            style={{ width: 200 }}
          >
            <option value="">Todas las categorías</option>
            {PRODUCT_CATEGORIES.map((c) => (
              <option key={c.value} value={c.value}>{c.label}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="mb-5">
        <AdBanner slotId="products_top" format="auto" />
      </div>

      <div className="glass-card overflow-hidden">
        <table className="data-table">
          <thead>
            <tr>
              <th>Nombre</th>
              <th>Categoría</th>
              <th>Precio</th>
              <th>Unidad</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={5} className="text-center py-8 text-[var(--text-secondary)]">Cargando...</td></tr>
            ) : products.length === 0 ? (
              <tr><td colSpan={5} className="text-center py-8 text-[var(--text-secondary)]">No se encontraron productos</td></tr>
            ) : (
              products.map((p) => (
                <tr key={p.id}>
                  <td>
                    <div>
                      <span className="font-medium">{p.name}</span>
                      {p.description && <p className="text-xs text-[var(--text-secondary)] mt-0.5">{p.description}</p>}
                    </div>
                  </td>
                  <td><span className="badge badge-sent">{CATEGORY_MAP[p.category] || p.category}</span></td>
                  <td className="font-semibold">{formatCurrency(p.price)}</td>
                  <td>{p.unit}</td>
                  <td>
                    <div className="flex gap-1">
                      <button onClick={() => { setEditingProduct(p); setShowForm(true); }} className="btn-icon"><Pencil size={16} /></button>
                      <button onClick={() => handleDelete(p.id)} className="btn-icon text-[var(--accent-red)]"><Trash2 size={16} /></button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>

        {pagination.totalPages > 1 && (
          <div className="pagination p-4">
            <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}><ChevronLeft size={16} /></button>
            <span className="text-sm mx-3">Página {page} de {pagination.totalPages}</span>
            <button onClick={() => setPage((p) => Math.min(pagination.totalPages, p + 1))} disabled={page === pagination.totalPages}><ChevronRight size={16} /></button>
          </div>
        )}
      </div>

      {showForm && (
        <ProductForm
          product={editingProduct}
          onClose={() => { setShowForm(false); setEditingProduct(null); }}
          onSaved={() => { setShowForm(false); setEditingProduct(null); fetchProducts(); }}
        />
      )}
    </div>
  );
}

function ProductForm({ product, onClose, onSaved }: { product: Product | null; onClose: () => void; onSaved: () => void }) {
  const [form, setForm] = useState({
    name: product?.name || "",
    category: product?.category || "cameras",
    price: product?.price || 0,
    description: product?.description || "",
    unit: product?.unit || "unidad",
  });
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);

    const url = product ? `/api/products/${product.id}` : "/api/products";
    const method = product ? "PUT" : "POST";

    const res = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...form, price: parseFloat(form.price.toString()) }) });

    if (res.ok) {
      toast.success(product ? "Producto actualizado" : "Producto creado");
      onSaved();
    } else {
      const data = await res.json();
      toast.error(data.error?.message || "Error al guardar");
    }
    setSaving(false);
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <h2 className="text-lg font-semibold mb-4">{product ? "Editar Producto" : "Nuevo Producto"}</h2>
        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <div>
            <label className="block text-sm font-medium mb-1">Nombre *</label>
            <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="input-field" required />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium mb-1">Categoría *</label>
              <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} className="input-field">
                {PRODUCT_CATEGORIES.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Unidad *</label>
              <select value={form.unit} onChange={(e) => setForm({ ...form, unit: e.target.value })} className="input-field">
                <option value="unidad">Unidad</option>
                <option value="metro">Metro</option>
                <option value="rollo">Rollo</option>
                <option value="servicio">Servicio</option>
                <option value="hora">Hora</option>
                <option value="día">Día</option>
              </select>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Precio (S/) *</label>
            <input type="number" step="0.01" min="0.01" value={form.price} onChange={(e) => setForm({ ...form, price: parseFloat(e.target.value) || 0 })} className="input-field" required />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Descripción</label>
            <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="input-field" rows={2} />
          </div>
          <div className="flex gap-3 mt-2">
            <button type="button" onClick={onClose} className="btn btn-secondary flex-1">Cancelar</button>
            <button type="submit" className="btn btn-primary flex-1" disabled={saving}>
              {saving ? "Guardando..." : (product ? "Actualizar" : "Crear")}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
