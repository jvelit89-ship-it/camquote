"use client";

import { useState, useRef, useEffect } from "react";
import { Bot, User, Sparkles, ChevronRight, RotateCcw } from "lucide-react";
import {
  calculateMaterials,
  SERVICE_TYPE_LABELS,
  CAMERA_TYPE_LABELS,
  LOCATION_LABELS,
  CHANNEL_LABELS,
  DVR_LABELS,
  HDD_LABELS,
  type ServiceType,
  type CameraType,
  type CameraLocation,
  type ChannelType,
  type DvrType,
  type HddType,
  type CameraPoint,
  type CalculatedItem,
} from "@/lib/quotation-calculator";
import { formatCurrency, roundTwo } from "@/lib/utils";

// --- Tipos del Wizard ---

type WizardStep =
  | "service_type"
  | "camera_count"
  | "camera_config"       // tipo+ubicación+distancia por punto
  | "channel_type"
  | "dvr_type"
  | "hdd_type"
  | "summary"
  | "done";

interface ChatMessage {
  role: "assistant" | "user";
  text: string;
}

interface WizardState {
  serviceType: ServiceType | null;
  cameraCount: number;
  currentCameraIndex: number;   // qué cámara estamos configurando
  cameraPoints: CameraPoint[];
  channelType: ChannelType | null;
  dvrType: DvrType | null;
  hddType: HddType | null;
  configSubStep: "type" | "location" | "distance";
}

interface Props {
  onComplete: (items: CalculatedItem[]) => void;
}

// --- Componente principal ---

export default function QuotationWizard({ onComplete }: Props) {
  const [step, setStep] = useState<WizardStep>("service_type");
  const [messages, setMessages] = useState<ChatMessage[]>([
    { role: "assistant", text: "👋 ¡Hola! Soy tu asistente de cotización. Voy a ayudarte a generar una cotización profesional paso a paso.\n\n¿Qué tipo de servicio necesitas?" },
  ]);
  const [state, setState] = useState<WizardState>({
    serviceType: null,
    cameraCount: 0,
    currentCameraIndex: 0,
    cameraPoints: [],
    channelType: null,
    dvrType: null,
    hddType: null,
    configSubStep: "type",
  });
  const [calculatedItems, setCalculatedItems] = useState<CalculatedItem[]>([]);
  const [inputValue, setInputValue] = useState("");
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  function addMessages(...msgs: ChatMessage[]) {
    setMessages((prev) => [...prev, ...msgs]);
  }

  function handleOptionClick(label: string, value: string) {
    addMessages({ role: "user", text: label });
    processAnswer(value);
  }

  function handleInputSubmit(e: React.FormEvent) {
    e.preventDefault();
    const val = inputValue.trim();
    if (!val) return;
    addMessages({ role: "user", text: val });
    setInputValue("");
    processAnswer(val);
  }

  function processAnswer(value: string) {
    switch (step) {
      case "service_type":
        handleServiceType(value as ServiceType);
        break;
      case "camera_count":
        handleCameraCount(value);
        break;
      case "camera_config":
        handleCameraConfig(value);
        break;
      case "channel_type":
        handleChannelType(value as ChannelType);
        break;
      case "dvr_type":
        handleDvrType(value as DvrType);
        break;
      case "hdd_type":
        handleHddType(value as HddType);
        break;
    }
  }

  // --- Handlers por paso ---

  function handleServiceType(type: ServiceType) {
    setState((s) => ({ ...s, serviceType: type }));

    if (type === "preventive_maintenance" || type === "corrective_maintenance") {
      // Para mantenimiento, solo necesitamos la cantidad
      setTimeout(() => {
        addMessages({
          role: "assistant",
          text: `Perfecto, **${SERVICE_TYPE_LABELS[type]}**.\n\n¿Cuántas cámaras necesitan servicio?`,
        });
        setStep("camera_count");
      }, 400);
      return;
    }

    setTimeout(() => {
      addMessages({
        role: "assistant",
        text: `Perfecto, trabajaremos en una **${SERVICE_TYPE_LABELS[type]}**.\n\n¿Cuántas cámaras vas a instalar?`,
      });
      setStep("camera_count");
    }, 400);
  }

  function handleCameraCount(value: string) {
    const count = parseInt(value);
    if (isNaN(count) || count < 1 || count > 32) {
      addMessages({ role: "assistant", text: "⚠️ Ingresa un número válido entre 1 y 32." });
      return;
    }

    setState((s) => ({ ...s, cameraCount: count, currentCameraIndex: 0, cameraPoints: [] }));

    // Si es mantenimiento, generar directamente
    if (state.serviceType === "preventive_maintenance" || state.serviceType === "corrective_maintenance") {
      const dummyPoints: CameraPoint[] = Array.from({ length: count }, () => ({
        cameraType: "bullet_2mp",
        location: "interior",
        distanceMeters: 0,
      }));

      const items = calculateMaterials({
        serviceType: state.serviceType!,
        cameraPoints: dummyPoints,
        channelType: "none",
        dvrType: "none",
        hddType: "none",
      });

      setCalculatedItems(items);

      setTimeout(() => {
        const total = items.reduce((s, i) => s + i.quantity * i.unitPrice, 0);
        addMessages({
          role: "assistant",
          text: `✅ **Cotización de ${SERVICE_TYPE_LABELS[state.serviceType!]} lista:**\n\n${items.map((i) => `• ${i.productName} × ${i.quantity} → ${formatCurrency(roundTwo(i.quantity * i.unitPrice))}`).join("\n")}\n\n**Total: ${formatCurrency(roundTwo(total))}** (+ IGV)\n\n¿Deseas generar la cotización con estos datos?`,
        });
        setStep("summary");
      }, 500);
      return;
    }

    // Para instalación: configurar cámara por cámara
    setTimeout(() => {
      addMessages({
        role: "assistant",
        text: `Excelente, **${count} cámara${count > 1 ? "s" : ""}**. Vamos a configurar cada punto.\n\n📷 **Cámara 1 de ${count}** — ¿Qué tipo de cámara?`,
      });
      setStep("camera_config");
      setState((s) => ({ ...s, configSubStep: "type" }));
    }, 400);
  }

  function handleCameraConfig(value: string) {
    const idx = state.currentCameraIndex;
    const count = state.cameraCount;

    if (state.configSubStep === "type") {
      const cameraType = value as CameraType;
      setState((s) => {
        const points = [...s.cameraPoints];
        points[idx] = { cameraType, location: "interior", distanceMeters: 10 };
        return { ...s, cameraPoints: points, configSubStep: "location" };
      });

      setTimeout(() => {
        addMessages({
          role: "assistant",
          text: `📷 **Cámara ${idx + 1}** — ¿Será instalada en interior o exterior?`,
        });
      }, 300);
      return;
    }

    if (state.configSubStep === "location") {
      const location = value as CameraLocation;
      setState((s) => {
        const points = [...s.cameraPoints];
        points[idx] = { ...points[idx], location };
        return { ...s, cameraPoints: points, configSubStep: "distance" };
      });

      setTimeout(() => {
        addMessages({
          role: "assistant",
          text: `📷 **Cámara ${idx + 1}** — ¿Cuántos metros hay desde el DVR/NVR hasta este punto de cámara?\n\n_Escribe la distancia en metros (ej: 15)_`,
        });
      }, 300);
      return;
    }

    if (state.configSubStep === "distance") {
      const dist = parseFloat(value);
      if (isNaN(dist) || dist < 1 || dist > 300) {
        addMessages({ role: "assistant", text: "⚠️ Ingresa una distancia válida entre 1 y 300 metros." });
        return;
      }

      const nextIdx = idx + 1;

      setState((s) => {
        const points = [...s.cameraPoints];
        points[idx] = { ...points[idx], distanceMeters: dist };
        return { ...s, cameraPoints: points, currentCameraIndex: nextIdx, configSubStep: "type" };
      });

      if (nextIdx < count) {
        setTimeout(() => {
          addMessages({
            role: "assistant",
            text: `✅ Cámara ${idx + 1} configurada.\n\n📷 **Cámara ${nextIdx + 1} de ${count}** — ¿Qué tipo de cámara?`,
          });
        }, 400);
        return;
      }

      // Todas las cámaras configuradas → canal
      setTimeout(() => {
        addMessages({
          role: "assistant",
          text: `✅ ¡Todas las cámaras configuradas!\n\n🔧 ¿Qué tipo de canalización necesitas para el cableado?`,
        });
        setStep("channel_type");
      }, 400);
    }
  }

  function handleChannelType(type: ChannelType) {
    setState((s) => ({ ...s, channelType: type }));

    setTimeout(() => {
      addMessages({
        role: "assistant",
        text: "📼 ¿Necesitas un grabador (DVR/NVR)?",
      });
      setStep("dvr_type");
    }, 400);
  }

  function handleDvrType(type: DvrType) {
    setState((s) => ({ ...s, dvrType: type }));

    setTimeout(() => {
      addMessages({
        role: "assistant",
        text: "💾 ¿Necesitas un disco duro para almacenamiento?",
      });
      setStep("hdd_type");
    }, 400);
  }

  function handleHddType(type: HddType) {
    setState((s) => ({ ...s, hddType: type }));

    // Calcular todo
    const finalState = { ...state, hddType: type };
    const items = calculateMaterials({
      serviceType: finalState.serviceType!,
      cameraPoints: finalState.cameraPoints,
      channelType: finalState.channelType!,
      dvrType: finalState.dvrType!,
      hddType: type,
    });

    setCalculatedItems(items);

    const total = items.reduce((s, i) => s + i.quantity * i.unitPrice, 0);

    setTimeout(() => {
      addMessages({
        role: "assistant",
        text: `🎉 **¡Cotización calculada automáticamente!**\n\n**${items.length} items generados:**\n\n${items.map((i) => `• ${i.productName} × ${i.quantity} → ${formatCurrency(roundTwo(i.quantity * i.unitPrice))}`).join("\n")}\n\n---\n**Subtotal: ${formatCurrency(roundTwo(total))}** (+ IGV 18%)\n**Total con IGV: ${formatCurrency(roundTwo(total * 1.18))}**\n\n¿Deseas generar la cotización con estos datos?`,
      });
      setStep("summary");
    }, 600);
  }

  function handleReset() {
    setStep("service_type");
    setMessages([
      { role: "assistant", text: "🔄 Reiniciando asistente...\n\n¿Qué tipo de servicio necesitas?" },
    ]);
    setState({
      serviceType: null,
      cameraCount: 0,
      currentCameraIndex: 0,
      cameraPoints: [],
      channelType: null,
      dvrType: null,
      hddType: null,
      configSubStep: "type",
    });
    setCalculatedItems([]);
  }

  // --- Renderizado de opciones por paso ---

  function renderOptions() {
    if (step === "service_type") {
      return renderButtons(SERVICE_TYPE_LABELS);
    }
    if (step === "camera_count") {
      return renderNumberInput("Cantidad de cámaras");
    }
    if (step === "camera_config") {
      if (state.configSubStep === "type") {
        return renderButtons(CAMERA_TYPE_LABELS);
      }
      if (state.configSubStep === "location") {
        return renderButtons(LOCATION_LABELS);
      }
      if (state.configSubStep === "distance") {
        return renderNumberInput("Distancia en metros");
      }
    }
    if (step === "channel_type") {
      return renderButtons(CHANNEL_LABELS);
    }
    if (step === "dvr_type") {
      return renderButtons(DVR_LABELS);
    }
    if (step === "hdd_type") {
      return renderButtons(HDD_LABELS);
    }
    if (step === "summary") {
      return (
        <div className="flex gap-2">
          <button
            onClick={() => { setStep("done"); onComplete(calculatedItems); }}
            className="btn btn-primary flex-1 flex items-center justify-center gap-2"
          >
            <Sparkles size={16} /> Generar Cotización
          </button>
          <button onClick={handleReset} className="btn btn-secondary flex items-center gap-2">
            <RotateCcw size={14} /> Reiniciar
          </button>
        </div>
      );
    }
    if (step === "done") {
      return (
        <div className="text-center py-3">
          <p className="text-sm text-[var(--text-secondary)]">✅ Cotización cargada en el formulario</p>
          <button onClick={handleReset} className="btn btn-sm btn-secondary mt-2">
            <RotateCcw size={14} /> Nueva consulta
          </button>
        </div>
      );
    }
    return null;
  }

  function renderButtons(labels: Record<string, string>) {
    return (
      <div className="flex flex-wrap gap-2">
        {Object.entries(labels).map(([key, label]) => (
          <button
            key={key}
            onClick={() => handleOptionClick(label, key)}
            className="wizard-option-btn"
          >
            {label} <ChevronRight size={14} />
          </button>
        ))}
      </div>
    );
  }

  function renderNumberInput(placeholder: string) {
    return (
      <form onSubmit={handleInputSubmit} className="flex gap-2">
        <input
          type="number"
          min={1}
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          placeholder={placeholder}
          className="input-field flex-1"
          autoFocus
        />
        <button type="submit" className="btn btn-primary">
          Enviar
        </button>
      </form>
    );
  }

  // --- Render ---

  return (
    <div className="glass-card overflow-hidden flex flex-col" style={{ height: "70vh", minHeight: 500 }}>
      {/* Header */}
      <div className="flex items-center gap-3 p-4 border-b border-[var(--border-color)]" style={{ background: "var(--accent-primary, #1a1a2e)", color: "#fff" }}>
        <div className="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center">
          <Bot size={20} />
        </div>
        <div>
          <p className="font-semibold text-sm">Asistente IA de Cotización</p>
          <p className="text-xs opacity-75">Genera cotizaciones inteligentes paso a paso</p>
        </div>
      </div>

      {/* Chat messages */}
      <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3">
        {messages.map((msg, i) => (
          <div key={i} className={`flex gap-2 ${msg.role === "user" ? "flex-row-reverse" : ""}`}>
            <div className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 ${
              msg.role === "assistant" ? "bg-[var(--accent-primary,#1a1a2e)] text-white" : "bg-[rgba(0,0,0,0.08)]"
            }`}>
              {msg.role === "assistant" ? <Bot size={14} /> : <User size={14} />}
            </div>
            <div className={`rounded-2xl px-4 py-2.5 max-w-[85%] text-sm leading-relaxed ${
              msg.role === "assistant"
                ? "bg-[rgba(0,0,0,0.04)] text-[var(--text-primary)]"
                : "bg-[var(--accent-primary,#1a1a2e)] text-white ml-auto"
            }`}>
              {msg.text.split("\n").map((line, j) => (
                <span key={j}>
                  {line.replace(/\*\*(.*?)\*\*/g, "").includes("**")
                    ? line
                    : line.split(/(\*\*.*?\*\*)/).map((part, k) =>
                        part.startsWith("**") && part.endsWith("**")
                          ? <strong key={k}>{part.slice(2, -2)}</strong>
                          : part.startsWith("_") && part.endsWith("_")
                            ? <em key={k}>{part.slice(1, -1)}</em>
                            : <span key={k}>{part}</span>
                      )}
                  {j < msg.text.split("\n").length - 1 && <br />}
                </span>
              ))}
            </div>
          </div>
        ))}
        <div ref={chatEndRef} />
      </div>

      {/* Options/Input area */}
      <div className="p-4 border-t border-[var(--border-color)] bg-[rgba(255,255,255,0.5)]">
        {renderOptions()}
      </div>
    </div>
  );
}
