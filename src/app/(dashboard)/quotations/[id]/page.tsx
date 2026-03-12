"use client";

import { useState, useEffect, use } from "react";
import Link from "next/link";
import { ArrowLeft, Download, Pencil, Copy } from "lucide-react";
import { formatCurrency, formatDate } from "@/lib/utils";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import ContractWizard from "@/components/contracts/ContractWizard";

const STATUS_BADGES: Record<string, string> = { draft: "badge-draft", sent: "badge-sent", approved: "badge-approved", rejected: "badge-rejected" };
const STATUS_LABELS: Record<string, string> = { draft: "Borrador", sent: "Enviado", approved: "Aprobado", rejected: "Rechazado" };

export default function QuotationDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [generatingContract, setGeneratingContract] = useState(false);
  const [isWizardOpen, setIsWizardOpen] = useState(false);

  async function fetchQuotationData() {
    setLoading(true);
    const r = await fetch(`/api/quotations/${id}`);
    const json = await r.json();
    setData(json.data);
    setLoading(false);
  }

  useEffect(() => {
    fetchQuotationData();
  }, [id]);

  async function handleDuplicate() {
    const res = await fetch(`/api/quotations/${id}/duplicate`, { method: "POST" });
    if (res.ok) {
      const json = await res.json();
      toast.success("Cotización duplicada");
      router.push(`/quotations/${json.data.id}`);
    }
  }

  async function handleGenerateContract() {
    setIsWizardOpen(true);
  }

  async function onWizardConfirm(formData: any) {
    setIsWizardOpen(false);
    setGeneratingContract(true);
    try {
      const res = await fetch(`/api/quotations/${id}/contract`, { 
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData)
       });
      if (res.ok) {
        toast.success("Contrato listo para impresión");
        fetchQuotationData(); // Refresh to show 'Approved' status
        const win = window.open(`/api/quotations/${id}/contract`, '_blank');
        if (!win) {
          toast.warning("El navegador bloqueó la ventana emergente. Puedes ver el contrato en la sección de Contratos.");
        }
      } else {
        const err = await res.json().catch(() => ({}));
        toast.error(err.error?.message || "Error al generar contrato");
      }
    } catch (err) {
      console.error(err);
      toast.error("Error de conexión");
    } finally {
      setGeneratingContract(false);
    }
  }

  if (loading) return <div className="text-center py-12 text-[var(--text-secondary)]">Cargando...</div>;
  if (!data) return <div className="text-center py-12 text-[var(--accent-red)]">Cotización no encontrada</div>;

  return (
    <div>
      <div className="page-header flex-col md:flex-row items-start md:items-center gap-4">
        <div className="flex items-center gap-3 w-full md:w-auto">
          <Link href="/quotations" className="btn-icon"><ArrowLeft size={20} /></Link>
          <div>
            <h1 className="page-title">{data.quotationNumber}</h1>
            <p className="text-sm text-[var(--text-secondary)]">{formatDate(data.createdAt)}</p>
          </div>
          <span className={`badge ${STATUS_BADGES[data.status]} ml-3`}>{STATUS_LABELS[data.status]}</span>
        </div>
        <div className="flex flex-wrap gap-2 w-full md:w-auto">
          <Link href={`/quotations/${id}/edit`} className="btn btn-secondary"><Pencil size={16} /> Editar</Link>
          <button onClick={handleDuplicate} className="btn btn-secondary"><Copy size={16} /> Duplicar</button>
          <Link href={`/api/quotations/${id}/pdf`} target="_blank" className="btn btn-secondary"><Download size={16} /> PDF Cotización</Link>
          <button 
            onClick={handleGenerateContract} 
            disabled={generatingContract}
            className="btn btn-primary bg-slate-900 border-none shadow-lg disabled:opacity-50"
          >
            {generatingContract ? "Generando..." : "Generar Contrato"}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2 flex flex-col gap-5">
          {/* Client info */}
          <div className="glass-card p-5">
            <h3 className="text-sm font-semibold mb-3 text-[var(--text-secondary)]">CLIENTE</h3>
            {data.client && (
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div><span className="text-[var(--text-secondary)]">Nombre:</span> <strong>{data.client.name}</strong></div>
                {data.client.company && <div><span className="text-[var(--text-secondary)]">Empresa:</span> {data.client.company}</div>}
                <div><span className="text-[var(--text-secondary)]">Teléfono:</span> {data.client.phone}</div>
                {data.client.email && <div><span className="text-[var(--text-secondary)]">Email:</span> {data.client.email}</div>}
                {data.client.address && <div className="col-span-2"><span className="text-[var(--text-secondary)]">Dirección:</span> {data.client.address}</div>}
              </div>
            )}
          </div>

          {/* Items table */}
          <div className="glass-card overflow-hidden">
            <table className="data-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Descripción</th>
                  <th>Unidad</th>
                  <th className="text-right">Cant.</th>
                  <th className="text-right">P. Unitario</th>
                  <th className="text-right">Subtotal</th>
                </tr>
              </thead>
              <tbody>
                {data.items?.map((item: any, i: number) => (
                  <tr key={item.id}>
                    <td>{i + 1}</td>
                    <td className="font-medium">{item.productName}</td>
                    <td>{item.productUnit}</td>
                    <td className="text-right">{item.quantity}</td>
                    <td className="text-right">{formatCurrency(item.unitPrice)}</td>
                    <td className="text-right font-semibold">{formatCurrency(item.subtotal)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Notes & Terms */}
          {(data.notes || data.terms) && (
            <div className="glass-card p-5 grid grid-cols-1 md:grid-cols-2 gap-5">
              {data.notes && (
                <div>
                  <h3 className="text-sm font-semibold mb-2 text-[var(--text-secondary)]">NOTAS</h3>
                  <p className="text-sm whitespace-pre-wrap">{data.notes}</p>
                </div>
              )}
              {data.terms && (
                <div>
                  <h3 className="text-sm font-semibold mb-2 text-[var(--text-secondary)]">CONDICIONES</h3>
                  <p className="text-sm whitespace-pre-wrap">{data.terms}</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Summary */}
        <div>
          <div className="glass-card p-5 sticky top-6">
            <h3 className="text-sm font-semibold mb-4">Resumen</h3>
            <div className="flex flex-col gap-3">
              <div className="flex justify-between text-sm">
                <span className="text-[var(--text-secondary)]">Subtotal</span>
                <span className="font-medium">{formatCurrency(data.subtotal)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-[var(--text-secondary)]">IGV (18%)</span>
                <span className="font-medium">{formatCurrency(data.igvAmount)}</span>
              </div>
              <hr className="border-[var(--border-color)]" />
              <div className="flex justify-between">
                <span className="font-semibold">Total</span>
                <span className="text-xl font-bold">{formatCurrency(data.total)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <ContractWizard 
        isOpen={isWizardOpen}
        onClose={() => setIsWizardOpen(false)}
        onConfirm={onWizardConfirm}
        quotationTotal={data.total}
        quotationNumber={data.quotationNumber}
      />
    </div>
  );
}
