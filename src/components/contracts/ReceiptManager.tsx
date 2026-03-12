
"use client";

import { useState, useEffect } from "react";
import { X, Plus, ReceiptText, Trash2, ExternalLink } from "lucide-react";
import { formatCurrency, formatDate } from "@/lib/utils";
import { toast } from "sonner";

interface ReceiptManagerProps {
  isOpen: boolean;
  onClose: () => void;
  contractId: string;
  contractNumber: string;
}

export default function ReceiptManager({ isOpen, onClose, contractId, contractNumber }: ReceiptManagerProps) {
  const [receipts, setReceipts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const [newReceipt, setNewReceipt] = useState({ amount: 0, concept: "Adelanto", date: new Date().toISOString().split('T')[0] });

  useEffect(() => {
    if (isOpen && contractId) {
      fetchReceipts();
    }
  }, [isOpen, contractId]);

  async function fetchReceipts() {
    setLoading(true);
    try {
      const res = await fetch(`/api/contracts/${contractId}/receipts`);
      const json = await res.json();
      setReceipts(json.data || []);
    } catch (e) {
      toast.error("Error al cargar recibos");
    } finally {
      setLoading(false);
    }
  }

  async function handleAddReceipt() {
    if (newReceipt.amount <= 0) return toast.error("Ingrese un monto válido");
    
    try {
      const res = await fetch(`/api/contracts/${contractId}/receipts`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newReceipt)
      });
      if (res.ok) {
        toast.success("Recibo generado");
        setIsAdding(false);
        setNewReceipt({ ...newReceipt, amount: 0 });
        fetchReceipts();
      }
    } catch (e) {
      toast.error("Error al generar recibo");
    }
  }

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[80vh] overflow-hidden flex flex-col anim-slide-up">
        <div className="p-6 border-b flex justify-between items-center bg-emerald-50 text-emerald-900">
          <div>
            <h2 className="text-xl font-bold">Recibos de Pago</h2>
            <p className="text-sm opacity-80">Contrato: {contractNumber}</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-emerald-100 rounded-full transition-colors"><X size={20} /></button>
        </div>

        <div className="p-6 flex-1 overflow-y-auto">
          {isAdding ? (
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 mb-6 space-y-4 anim-fade-in">
              <h3 className="font-bold text-slate-800 text-sm uppercase letter-spacing-wide">Nuevo Recibo</h3>
              <div className="grid grid-cols-1 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1">Monto (S/)</label>
                  <input 
                    type="number" 
                    value={newReceipt.amount} 
                    onChange={(e) => setNewReceipt({ ...newReceipt, amount: Number(e.target.value) })}
                    className="input-field"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1">Concepto</label>
                  <input 
                    value={newReceipt.concept} 
                    onChange={(e) => setNewReceipt({ ...newReceipt, concept: e.target.value })}
                    className="input-field"
                    placeholder="Ej: Adelanto, 2do pago, Saldo..."
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1">Fecha</label>
                  <input 
                    type="date"
                    value={newReceipt.date} 
                    onChange={(e) => setNewReceipt({ ...newReceipt, date: e.target.value })}
                    className="input-field"
                  />
                </div>
              </div>
              <div className="flex gap-2 pt-2">
                <button onClick={() => setIsAdding(false)} className="btn btn-secondary flex-1 py-2 text-sm">Cancelar</button>
                <button onClick={handleAddReceipt} className="btn btn-primary bg-emerald-600 hover:bg-emerald-700 flex-1 py-2 text-sm">Generar Recibo</button>
              </div>
            </div>
          ) : (
            <button 
              onClick={() => setIsAdding(true)}
              className="w-full py-3 mb-6 border-2 border-dashed border-emerald-200 rounded-xl text-emerald-600 flex items-center justify-center gap-2 hover:bg-emerald-50 transition-colors font-semibold"
            >
              <Plus size={20} /> Crear Nuevo Recibo
            </button>
          )}

          <div className="space-y-3">
            {loading ? (
              <p className="text-center text-slate-400 py-10">Cargando recibos...</p>
            ) : receipts.length === 0 ? (
              <p className="text-center text-slate-400 py-10">No hay recibos registrados</p>
            ) : (
              receipts.map((r) => (
                <div key={r.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-100 hover:border-emerald-200 transition-colors group">
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-emerald-100 text-emerald-600 rounded-lg">
                      <ReceiptText size={20} />
                    </div>
                    <div>
                      <div className="font-bold text-slate-800">{formatCurrency(r.amount)}</div>
                      <div className="text-xs text-slate-500">{r.concept} • {formatDate(r.date)}</div>
                      <div className="text-[10px] font-mono text-slate-400 mt-1 uppercase">{r.receiptNumber}</div>
                    </div>
                  </div>
                  <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <a 
                      href={`/api/contracts/${contractId}/receipt?receiptId=${r.id}`} 
                      target="_blank"
                      className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                      title="Ver e Imprimir"
                    >
                      <ExternalLink size={18} />
                    </a>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="p-6 border-t bg-slate-50 text-center">
            <p className="text-xs text-slate-400">Puede generar múltiples recibos por cada pago realizado por el cliente</p>
        </div>
      </div>
    </div>
  );
}
