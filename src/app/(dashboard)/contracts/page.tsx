
"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { formatDate } from "@/lib/utils";
import { FileSignature, Download, Eye, ReceiptText } from "lucide-react";
import ReceiptManager from "@/components/contracts/ReceiptManager";
import { toast } from "sonner";

const STATUS_BADGES: Record<string, string> = {
  draft: "badge-pending text-amber-700 bg-amber-50",
  signed: "badge-approved text-emerald-700 bg-emerald-50",
  delivered: "badge-sent text-blue-700 bg-blue-50"
};

const STATUS_LABELS: Record<string, string> = {
  draft: "Borrador",
  signed: "Firmado",
  delivered: "Entregado"
};

export default function ContractsPage() {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedContract, setSelectedContract] = useState<{id: string, number: string} | null>(null);

  useEffect(() => {
    fetchContracts();
  }, []);

  async function fetchContracts() {
    setLoading(true);
    try {
      const res = await fetch("/api/contracts");
      const json = await res.json();
      setData(json.data || []);
    } catch (e) {
      toast.error("Error al cargar contratos");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="page-header flex items-center justify-between">
        <div>
          <h1 className="page-title flex items-center gap-2">
            <FileSignature className="text-slate-400" size={28} />
            Contratos
          </h1>
          <p className="text-sm text-slate-500 mt-1">Gestión de contratos de instalación CCTV</p>
        </div>
      </div>

      <div className="glass-card shadow-sm border border-slate-100 overflow-hidden">
        {loading ? (
          <div className="text-center py-12 text-slate-400">Cargando contratos...</div>
        ) : data.length === 0 ? (
          <div className="text-center py-12">
            <div className="bg-slate-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
              <FileSignature className="text-slate-300" size={32} />
            </div>
            <h3 className="text-lg font-bold text-slate-900">No hay contratos</h3>
            <p className="text-slate-500 max-w-xs mx-auto mt-1">
              Los contratos aparecerán aquí una vez que los generes desde el detalle de una cotización aprobada.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="data-table">
              <thead>
                <tr>
                  <th>N° Contrato</th>
                  <th>Cotización</th>
                  <th>Cliente</th>
                  <th>Fecha</th>
                  <th>Estado</th>
                  <th className="text-right">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {data.map((row) => (
                  <tr key={row.id}>
                    <td className="font-bold text-slate-900">{row.contractNumber}</td>
                    <td>
                      <Link 
                        href={`/quotations/${row.quotationId}`}
                        className="text-blue-600 hover:underline font-medium"
                      >
                        {row.quotationNumber}
                      </Link>
                    </td>
                    <td className="font-medium">{row.clientName}</td>
                    <td className="text-slate-500 text-sm">
                      {formatDate(row.createdAt)}
                    </td>
                    <td>
                      <span className={`badge ${STATUS_BADGES[row.status] || "badge-pending"}`}>
                        {STATUS_LABELS[row.status] || row.status}
                      </span>
                    </td>
                    <td className="text-right flex justify-end gap-2 border-none">
                       <button 
                        onClick={() => setSelectedContract({ id: row.id, number: row.contractNumber })}
                        className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 hover:bg-emerald-100 transition-colors"
                        title="Gestionar Recibos de Pago"
                      >
                        <ReceiptText size={16} />
                      </button>
                       <Link 
                        href={`/api/quotations/${row.quotationId}/contract`} 
                        target="_blank" 
                        className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 transition-colors"
                        title="Ver / Imprimir Contrato"
                      >
                        <Download size={16} />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <ReceiptManager 
        isOpen={!!selectedContract}
        onClose={() => setSelectedContract(null)}
        contractId={selectedContract?.id || ""}
        contractNumber={selectedContract?.number || ""}
      />
    </div>
  );
}
