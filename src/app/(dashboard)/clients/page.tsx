"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Search, Plus, Pencil, Trash2, ChevronLeft, ChevronRight } from "lucide-react";
import { AdBanner } from "@/components/ads/AdBanner";

interface Client {
  id: string;
  name: string;
  company: string;
  documentType: string;
  documentNumber: string;
  phone: string;
  email: string;
  address: string;
  city: string;
  notes: string;
}

interface Pagination {
  page: number;
  totalPages: number;
  total: number;
}

export default function ClientsPage() {
  const router = useRouter();
  const [clients, setClients] = useState<Client[]>([]);
  const [pagination, setPagination] = useState<Pagination>({ page: 1, totalPages: 1, total: 0 });
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [showForm, setShowForm] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchClients = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({ page: page.toString(), limit: "20" });
    if (search) params.set("search", search);
    const res = await fetch(`/api/clients?${params}`);
    const json = await res.json();
    setClients(json.data || []);
    setPagination(json.pagination || { page: 1, totalPages: 1, total: 0 });
    setLoading(false);
  }, [page, search]);

  useEffect(() => { fetchClients(); }, [fetchClients]);

  async function handleDelete(id: string) {
    if (!confirm("¿Eliminar este cliente?")) return;
    await fetch(`/api/clients/${id}`, { method: "DELETE" });
    toast.success("Cliente eliminado");
    fetchClients();
  }

  function handleEdit(client: Client) {
    setEditingClient(client);
    setShowForm(true);
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Clientes</h1>
          <p className="text-sm text-[var(--text-secondary)]">{pagination.total} clientes registrados</p>
        </div>
        <button onClick={() => { setEditingClient(null); setShowForm(true); }} className="btn btn-primary">
          <Plus size={18} /> Nuevo Cliente
        </button>
      </div>

      {/* Search */}
      <div className="glass-card p-4 mb-5">
        <div className="search-bar">
          <Search size={16} />
          <input
            type="text"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            placeholder="Buscar por nombre, empresa, documento o email..."
            className="input-field"
            style={{ paddingLeft: 38 }}
          />
        </div>
      </div>

      {/* Table */}
      <div className="mb-5">
        <AdBanner slotId="clients_top" format="auto" />
      </div>

      <div className="glass-card overflow-hidden">
        <table className="data-table">
          <thead>
            <tr>
              <th>Nombre</th>
              <th>Empresa</th>
              <th>Documento</th>
              <th>Teléfono</th>
              <th>Email</th>
              <th>Ciudad</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={7} className="text-center py-8 text-[var(--text-secondary)]">Cargando...</td></tr>
            ) : clients.length === 0 ? (
              <tr><td colSpan={7} className="text-center py-8 text-[var(--text-secondary)]">No se encontraron clientes</td></tr>
            ) : (
              clients.map((c) => (
                <tr key={c.id}>
                  <td className="font-medium">{c.name}</td>
                  <td>{c.company || "—"}</td>
                  <td><span className="text-xs font-semibold text-[var(--text-secondary)]">{c.documentType}</span> {c.documentNumber || "—"}</td>
                  <td>{c.phone}</td>
                  <td>{c.email || "—"}</td>
                  <td>{c.city || "—"}</td>
                  <td>
                    <div className="flex gap-1">
                      <button onClick={() => handleEdit(c)} className="btn-icon"><Pencil size={16} /></button>
                      <button onClick={() => handleDelete(c.id)} className="btn-icon text-[var(--accent-red)]"><Trash2 size={16} /></button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>

        {/* Pagination */}
        {pagination.totalPages > 1 && (
          <div className="pagination p-4">
            <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}><ChevronLeft size={16} /></button>
            <span className="text-sm mx-3">Página {page} de {pagination.totalPages}</span>
            <button onClick={() => setPage(p => Math.min(pagination.totalPages, p + 1))} disabled={page === pagination.totalPages}><ChevronRight size={16} /></button>
          </div>
        )}
      </div>

      {/* Modal Form */}
      {showForm && (
        <ClientForm
          client={editingClient}
          onClose={() => { setShowForm(false); setEditingClient(null); }}
          onSaved={() => { setShowForm(false); setEditingClient(null); fetchClients(); }}
        />
      )}
    </div>
  );
}

function ClientForm({ client, onClose, onSaved }: { client: Client | null; onClose: () => void; onSaved: () => void }) {
  const [form, setForm] = useState({
    name: client?.name || "",
    company: client?.company || "",
    documentType: client?.documentType || "DNI",
    documentNumber: client?.documentNumber || "",
    phone: client?.phone || "",
    email: client?.email || "",
    address: client?.address || "",
    city: client?.city || "",
    notes: client?.notes || "",
  });
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);

    const url = client ? `/api/clients/${client.id}` : "/api/clients";
    const method = client ? "PUT" : "POST";

    const res = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });

    if (res.ok) {
      toast.success(client ? "Cliente actualizado" : "Cliente creado");
      onSaved();
    } else {
      const data = await res.json();
      toast.error(data.error?.message || "Error al guardar");
    }
    setSaving(false);
  }

  function updateField(field: string, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <h2 className="text-lg font-semibold mb-4">{client ? "Editar Cliente" : "Nuevo Cliente"}</h2>
        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <div>
            <label className="block text-sm font-medium mb-1">Nombre *</label>
            <input value={form.name} onChange={(e) => updateField("name", e.target.value)} className="input-field" required minLength={2} />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Empresa</label>
            <input value={form.company} onChange={(e) => updateField("company", e.target.value)} className="input-field" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium mb-1">Tipo Doc.</label>
              <select value={form.documentType} onChange={(e) => updateField("documentType", e.target.value)} className="input-field">
                <option value="DNI">DNI</option>
                <option value="RUC">RUC</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">N° Documento</label>
              <input value={form.documentNumber} onChange={(e) => updateField("documentNumber", e.target.value)} className="input-field" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium mb-1">Teléfono *</label>
              <input value={form.phone} onChange={(e) => updateField("phone", e.target.value)} className="input-field" required minLength={7} />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Email</label>
              <input type="email" value={form.email} onChange={(e) => updateField("email", e.target.value)} className="input-field" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Dirección</label>
            <input value={form.address} onChange={(e) => updateField("address", e.target.value)} className="input-field" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Ciudad</label>
            <input value={form.city} onChange={(e) => updateField("city", e.target.value)} className="input-field" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Notas</label>
            <textarea value={form.notes} onChange={(e) => updateField("notes", e.target.value)} className="input-field" rows={2} />
          </div>
          <div className="flex gap-3 mt-2">
            <button type="button" onClick={onClose} className="btn btn-secondary flex-1">Cancelar</button>
            <button type="submit" className="btn btn-primary flex-1" disabled={saving}>
              {saving ? "Guardando..." : (client ? "Actualizar" : "Crear")}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
