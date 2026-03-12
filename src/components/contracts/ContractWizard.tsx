
"use client";

import { useState } from "react";
import { X, Calculator } from "lucide-react";
import { formatCurrency } from "@/lib/utils";

interface ContractWizardProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (data: any) => void;
  quotationTotal: number;
  quotationNumber: string;
}

export default function ContractWizard({ isOpen, onClose, onConfirm, quotationTotal, quotationNumber }: ContractWizardProps) {
  const [form, setForm] = useState({
    advanceAmount: (quotationTotal * 0.7),
    installationAddress: "",
    installationTime: "8 horas",
    warrantyEquipment: 12,
    warrantyInstallation: 6,
    maintenanceCost: 80,
    cameraLocations: ["Entrada Principal", "Patio Trasero"],
  });

  if (!isOpen) return null;

  const advancePercent = Math.round((form.advanceAmount / quotationTotal) * 100);

  const handleLevelChange = (index: number, value: string) => {
    const newLocs = [...form.cameraLocations];
    newLocs[index] = value;
    setForm({ ...form, cameraLocations: newLocs });
  };

  const addLocation = () => setForm({ ...form, cameraLocations: [...form.cameraLocations, ""] });
  const removeLocation = (index: number) => setForm({ ...form, cameraLocations: form.cameraLocations.filter((_, i) => i !== index) });

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col anim-slide-up">
        <div className="p-6 border-b flex justify-between items-center bg-slate-50">
          <div>
            <h2 className="text-xl font-bold text-slate-900">Generar Contrato: {quotationNumber}</h2>
            <p className="text-sm text-slate-500">Configure los detalles técnicos y comerciales</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-200 rounded-full transition-colors"><X size={20} /></button>
        </div>

        <div className="p-6 overflow-y-auto flex-1 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-blue-50/50 p-4 rounded-xl border border-blue-100">
              <label className="block text-sm font-semibold text-blue-900 mb-2 flex items-center gap-2">
                <Calculator size={16} /> Adelanto (Soles o %)
              </label>
              <div className="flex items-center gap-3">
                <div className="relative flex-1">
                   <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">S/</span>
                   <input 
                    type="number" 
                    value={form.advanceAmount} 
                    onChange={(e) => setForm({ ...form, advanceAmount: Number(e.target.value) })}
                    className="w-full pl-8 pr-3 py-2 rounded-lg border focus:ring-2 focus:ring-blue-500 outline-none"
                   />
                </div>
                <div className="text-sm font-bold text-blue-700 bg-white px-3 py-2 rounded-lg border border-blue-100 shadow-sm">
                  {advancePercent}%
                </div>
              </div>
              <p className="text-xs text-blue-600 mt-2">Saldo pendiente: {formatCurrency(quotationTotal - form.advanceAmount)}</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Tiempo de Instalación</label>
              <input 
                type="text" 
                value={form.installationTime} 
                onChange={(e) => setForm({ ...form, installationTime: e.target.value })}
                className="input-field"
                placeholder="Ej: 8 horas, 2 días..."
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Dirección de Instalación</label>
            <textarea 
              value={form.installationAddress} 
              onChange={(e) => setForm({ ...form, installationAddress: e.target.value })}
              className="input-field h-20"
              placeholder="Dirección exacta donde se realizará el trabajo"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
             <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Garantía Equipos (Meses)</label>
              <input type="number" value={form.warrantyEquipment} onChange={(e) => setForm({ ...form, warrantyEquipment: Number(e.target.value) })} className="input-field" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Garantía Inst. (Meses)</label>
              <input type="number" value={form.warrantyInstallation} onChange={(e) => setForm({ ...form, warrantyInstallation: Number(e.target.value) })} className="input-field" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Costo Visita Técnica (S/)</label>
              <input type="number" value={form.maintenanceCost} onChange={(e) => setForm({ ...form, maintenanceCost: Number(e.target.value) })} className="input-field" />
            </div>
          </div>

          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="block text-sm font-medium text-slate-700">Ubicación de Cámaras</label>
              <button onClick={addLocation} className="text-xs font-bold text-blue-600 hover:underline">+ Añadir</button>
            </div>
            <div className="space-y-2">
              {form.cameraLocations.map((loc, i) => (
                <div key={i} className="flex gap-2">
                  <span className="bg-slate-100 text-slate-500 w-8 flex items-center justify-center rounded-lg text-xs font-bold">{i+1}</span>
                  <input 
                    value={loc} 
                    onChange={(e) => handleLevelChange(i, e.target.value)}
                    className="input-field flex-1 py-1.5"
                    placeholder="Ej: Sala, Cochera, etc."
                  />
                  <button onClick={() => removeLocation(i)} className="text-slate-400 hover:text-red-500 p-1">×</button>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="p-6 border-t bg-slate-50 flex gap-3">
          <button onClick={onClose} className="btn btn-secondary flex-1">Cancelar</button>
          <button onClick={() => onConfirm(form)} className="btn btn-primary flex-1 shadow-lg shadow-blue-200">
            Confirmar y Generar
          </button>
        </div>
      </div>
    </div>
  );
}
