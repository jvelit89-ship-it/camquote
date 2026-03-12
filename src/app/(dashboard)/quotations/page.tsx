"use client";

import { useState, useEffect, useCallback } from "react";
import { db } from "@/db";
import { quotations, clients } from "@/db/schema";
import { eq, and, sql } from "drizzle-orm";
import { formatCurrency } from "@/lib/utils";
import Link from "next/link";
import { toast } from "sonner";
import { Plus, Search, FileText, Download, MoreVertical, Copy, Trash2, Edit, ChevronLeft, ChevronRight } from "lucide-react";
import { AdBanner } from "@/components/ads/AdBanner";
import { getAuthUser } from "@/lib/auth";

interface Quotation {
  id: string;
  quotationNumber: string;
  clientName: string;
  total: number;
  status: string;
  createdAt: string;
}

const STATUS_BADGES: Record<string, string> = {
  draft: "badge-draft",
  sent: "badge-sent",
  approved: "badge-approved",
  rejected: "badge-rejected",
};

const STATUS_LABELS: Record<string, string> = {
  draft: "Borrador",
  sent: "Enviado",
  approved: "Aprobado",
  rejected: "Rechazado",
};

export default function QuotationsPage() {
  const [quotationsList, setQuotationsList] = useState<Quotation[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const fetchQuotations = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({ page: page.toString(), limit: "20" });
    if (search) params.set("search", search);
    const res = await fetch(`/api/quotations?${params}`);
    const json = await res.json();
    setQuotationsList(json.data || []);
    setTotalPages(json.pagination?.totalPages || 1);
    setLoading(false);
  }, [page, search]);

  useEffect(() => {
    fetchQuotations();
  }, [fetchQuotations]);

  async function handleDelete(id: string) {
    if (!confirm("¿Eliminar esta cotización?")) return;
    const res = await fetch(`/api/quotations/${id}`, { method: "DELETE" });
    if (res.ok) {
      toast.success("Cotización eliminada");
      fetchQuotations();
    } else {
      toast.error("Error al eliminar");
    }
  }

  async function handleDuplicate(id: string) {
    const res = await fetch(`/api/quotations/${id}/duplicate`, { method: "POST" });
    if (res.ok) {
      toast.success("Cotización duplicada");
      fetchQuotations();
    } else {
      toast.error("Error al duplicar");
    }
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="page-header mb-8">
        <div>
          <h1 className="page-title text-3xl font-black">Cotizaciones</h1>
          <p className="text-sm text-slate-500">Gestiona y realiza seguimiento a tus ventas</p>
        </div>
        <Link href="/quotations/new" className="btn btn-primary">
          <Plus size={18} /> Nueva Cotización
        </Link>
      </div>

      <div className="glass-card p-4 mb-5">
        <div className="search-bar">
          <Search size={16} />
          <input
            type="text"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            placeholder="Buscar por número o cliente..."
            className="input-field"
            style={{ paddingLeft: 38 }}
          />
        </div>
      </div>

      {/* Table */}
      <div className="mb-5">
        <AdBanner slotId="quotations_top" format="auto" />
      </div>

      <div className="glass-card overflow-hidden">
        <table className="data-table">
          <thead>
            <tr>
              <th>N° Documento</th>
              <th>Cliente</th>
              <th>Fecha</th>
              <th>Total</th>
              <th>Estado</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={6} className="text-center py-8">Cargando...</td></tr>
            ) : quotationsList.length === 0 ? (
              <tr><td colSpan={6} className="text-center py-8">No se encontraron cotizaciones</td></tr>
            ) : (
              quotationsList.map((q) => (
                <tr key={q.id}>
                  <td className="font-bold">
                    <Link href={`/quotations/${q.id}`} className="text-blue-600 hover:text-blue-700">
                      {q.quotationNumber}
                    </Link>
                  </td>
                  <td className="font-medium">{q.clientName || "—"}</td>
                  <td className="text-slate-500 text-sm">
                    {new Date(q.createdAt).toLocaleDateString("es-PE")}
                  </td>
                  <td className="font-black text-slate-900">{formatCurrency(q.total)}</td>
                  <td>
                    <span className={`badge ${STATUS_BADGES[q.status] || "badge-draft"}`}>
                      {STATUS_LABELS[q.status] || q.status}
                    </span>
                  </td>
                  <td>
                    <div className="flex gap-1">
                      <Link href={`/quotations/${q.id}`} className="btn-icon">
                        <FileText size={16} />
                      </Link>
                      <Link href={`/quotations/new?edit=${q.id}`} className="btn-icon">
                        <Edit size={16} />
                      </Link>
                      <button onClick={() => handleDuplicate(q.id)} className="btn-icon" title="Duplicar">
                        <Copy size={16} />
                      </button>
                      <button onClick={() => handleDelete(q.id)} className="btn-icon text-red-500">
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>

        {totalPages > 1 && (
          <div className="pagination p-4 border-t border-slate-100 flex justify-center gap-4">
            <button 
              onClick={() => setPage(p => Math.max(1, p - 1))} 
              disabled={page === 1}
              className="btn btn-secondary btn-sm"
            >
              <ChevronLeft size={16} /> Anterior
            </button>
            <span className="flex items-center text-sm font-medium">
              Página {page} de {totalPages}
            </span>
            <button 
              onClick={() => setPage(p => Math.min(totalPages, p + 1))} 
              disabled={page === totalPages}
              className="btn btn-secondary btn-sm"
            >
              Siguiente <ChevronRight size={16} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
