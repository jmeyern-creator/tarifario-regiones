"use client";

import React, { useMemo, useState } from "react";
import { Download, FileText, Lock, Package, ShieldCheck, Truck, UserCircle2 } from "lucide-react";

const BRAND = {
  name: "Tarifario Regiones",
  subtitle: "Cotizador Transporte regiones",
  logo: "/logo.png", // guarda tu logo en /public/logo.png
};

const SERVER_RATE_TABLE: Record<string, number> = {
  "DE ARICA Y PARINACOTA": 245,
  "DE TARAPACA": 235,
  "DE ANTOFAGASTA": 210,
  "DE ATACAMA": 185,
  "DE COQUIMBO": 155,
  "DE VALPARAISO": 75,
  "DEL LIBERTADOR GRAL. BERNARDO O'HIGGINS": 125,
  "DEL MAULE": 145,
  "DE ÑUBLE": 185,
  "DEL BIOBIO": 195,
  "DE LA ARAUCANIA": 205,
  "DE LOS RIOS": 215,
  "DE LOS LAGOS": 235,
  "REGION DE AYSEN": 315,
  "REGION DE MAGALLANES": 395,
};

const SERVER_DESTINATION_ADDONS: Record<string, number> = {
  PUERTO: 85000,
  AEROPUERTO: 25000,
};

const COMMERCIAL_CONSIDERATIONS = [
  "Volumen máximo 5 CBM. Para volúmenes mayores, consultar evaluación especial.",
  "Dimensiones máximas referenciales: 1,80 m × 1,80 m × 1,80 m.",
  "La carga se recibe y entrega sobre camión.",
  "Carga peligrosa sujeta a revisión y aprobación previa.",
  "Servicio considerado en camión cerrado, salvo acuerdo comercial distinto.",
];

const REGIONS = Object.keys(SERVER_RATE_TABLE);
const DESTINATIONS = Object.keys(SERVER_DESTINATION_ADDONS);
const CLIENT_TYPES = ["Cliente final", "Vendedor interno", "Cuenta corporativa"] as const;
const SERVICES = ["Estándar", "Express", "Coordinado"] as const;

type HistoryItem = {
  id: string;
  clientName: string;
  contactName: string;
  region: string;
  destination: string;
  service: string;
  total: number;
};

type QuoteResult = {
  quoteNumber: string;
  total: number;
  currency: "CLP";
  commercialSummary: string[];
  metrics: {
    pesoReal: number;
    pesoCargable: number;
  };
  validity: string;
  considerations: string[];
};

function generateQuoteNumber(): string {
  const random = Math.floor(1000 + Math.random() * 9000);
  const date = new Date();
  const stamp = `${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, "0")}${String(date.getDate()).padStart(2, "0")}`;
  return `TR-${stamp}-${random}`;
}

function calculateQuoteOnServer(payload: {
  region: string;
  destination: string;
  peso: string | number;
  volumen: string | number;
  service: string;
  declaredValue: string | number;
}): QuoteResult {
  const { region, destination, peso, volumen, service, declaredValue } = payload;

  const numericPeso = Number(peso) || 0;
  const numericVolumen = Number(volumen) || 0;
  const numericDeclaredValue = Number(declaredValue) || 0;

  const pesoVolumetrico = numericVolumen * 333;
  const pesoCargable = Math.ceil(Math.max(numericPeso, pesoVolumetrico));

  const regionRate = SERVER_RATE_TABLE[region] || 0;
  const destinationAddon = SERVER_DESTINATION_ADDONS[destination] || 0;

  let serviceMultiplier = 1;
  if (service === "Express") serviceMultiplier = 1.12;
  if (service === "Coordinado") serviceMultiplier = 1.06;

  const baseSubtotal = regionRate * pesoCargable * serviceMultiplier;
  const minimumFreight = 45000;
  const freight = Math.max(baseSubtotal, minimumFreight);
  const insurance = numericDeclaredValue > 0 ? numericDeclaredValue * 0.0035 : 0;
  const total = Math.round(freight + destinationAddon + insurance);

  return {
    quoteNumber: generateQuoteNumber(),
    total,
    currency: "CLP",
    commercialSummary: [
      `Servicio ${service.toLowerCase()} calculado correctamente.`,
      `Destino ${destination.toLowerCase()} incorporado a la cotización.`,
      numericDeclaredValue > 0 ? "Se consideró cargo por valor declarado." : "Sin cargo por valor declarado.",
    ],
    metrics: {
      pesoReal: numericPeso,
      pesoCargable,
    },
    validity: new Date().toLocaleDateString("es-CL"),
    considerations: COMMERCIAL_CONSIDERATIONS,
  };
}

function formatMoney(value: number): string {
  return new Intl.NumberFormat("es-CL", {
    style: "currency",
    currency: "CLP",
    maximumFractionDigits: 0,
  }).format(value || 0);
}

function formatNumber(value: number): string {
  return new Intl.NumberFormat("es-CL", {
    maximumFractionDigits: 0,
  }).format(value || 0);
}

function downloadQuotePdf(params: {
  clientName: string;
  contactName: string;
  role: string;
  result: QuoteResult;
}): void {
  const { clientName, contactName, role, result } = params;

  const popup = window.open("", "_blank");
  if (!popup) return;

  popup.document.write(`
    <html>
      <head>
        <title>${result.quoteNumber}</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 36px; color: #3f3f46; }
          .header { display:flex; justify-content:space-between; align-items:center; margin-bottom:28px; }
          .brand { display:flex; align-items:center; gap:14px; }
          .logo img { height: 68px; max-width: 216px; object-fit: contain; }
          .title { font-size:28px; font-weight:700; margin:0; }
          .subtitle { margin-top:4px; color:#71717a; }
          .card { border:1px solid #e4e4e7; border-radius:18px; padding:20px; margin-top:18px; }
          .muted { color:#71717a; }
          .total { color:#f97316; font-size:34px; font-weight:700; margin-top:8px; }
          .row { display:flex; justify-content:space-between; margin:12px 0; }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="brand">
            <div class="logo">
              <img src="${window.location.origin}${BRAND.logo}" alt="Logo" />
            </div>
            <div>
              <div class="title">${BRAND.name}</div>
              <div class="subtitle">${BRAND.subtitle}</div>
            </div>
          </div>
          <div class="muted">${result.validity}</div>
        </div>
        <div class="card">
          <div class="muted">Cotización</div>
          <div style="font-size:24px;font-weight:700;margin-top:6px;">${result.quoteNumber}</div>
          <div style="margin-top:14px;"><strong>Cliente:</strong> ${clientName}</div>
          <div style="margin-top:6px;"><strong>Contacto:</strong> ${contactName}</div>
          <div style="margin-top:6px;"><strong>Tipo de usuario:</strong> ${role}</div>
        </div>
        <div class="card">
          <div class="muted">Total estimado</div>
          <div class="total">${formatMoney(result.total)}</div>
          <div class="row"><span class="muted">Peso real</span><strong>${formatNumber(result.metrics.pesoReal)} kg</strong></div>
          <div class="row"><span class="muted">Peso considerado</span><strong>${formatNumber(result.metrics.pesoCargable)} kg</strong></div>
        </div>
      </body>
    </html>
  `);

  popup.document.close();
  popup.focus();
  popup.print();
}

export default function CotizadorPage() {
  const [role, setRole] = useState<string>("Vendedor interno");
  const [clientName, setClientName] = useState<string>("");
  const [contactName, setContactName] = useState<string>("");
  const [region, setRegion] = useState<string>("DE ANTOFAGASTA");
  const [destination, setDestination] = useState<string>("PUERTO");
  const [service, setService] = useState<string>("Estándar");
  const [peso, setPeso] = useState<string>("0");
  const [volumen, setVolumen] = useState<string>("0");
  const [declaredValue, setDeclaredValue] = useState<string>("0");
  const [history, setHistory] = useState<HistoryItem[]>([]);

 const [quoteResult, setQuoteResult] = useState<QuoteResult | null>(null);

  const dashboardStats = useMemo(() => {
    const totalQuotes = history.length + 1;
    const averageTicket =
      totalQuotes > 0
        ? Math.round(
            [quoteResult.total, ...history.map((item) => item.total)].reduce((acc, item) => acc + item, 0) / totalQuotes
          )
        : 0;

    return {
      totalQuotes,
      averageTicket,
      lastQuote: quoteResult?.quoteNumber || "-",
    };
  }, [history, quoteResult]);

  function handleCalculate(): void {
    const result = calculateQuoteOnServer({
      region,
      destination,
      peso,
      volumen,
      service,
      declaredValue,
    });

    setQuoteResult(result);

    setHistory((prev) =>
      [
        {
          id: result.quoteNumber,
          clientName,
          contactName,
          region,
          destination,
          service,
          total: result.total,
        },
        ...prev,
      ].slice(0, 6)
    );
  }

  function handleReset(): void {
    setRole("Vendedor interno");
    setClientName("");
    setContactName("");
    setRegion("");
    setDestination("");
    setService("Estándar");
    setPeso("0");
    setVolumen("0");
    setDeclaredValue("0");

    setQuoteResult(
      calculateQuoteOnServer({
        region: "DE ANTOFAGASTA",
        destination: "PUERTO",
        peso: 0,
        volumen: 0,
        service: "Estándar",
        declaredValue: 0,
      })
    );
  }

  return (
    <div className="min-h-screen bg-zinc-100 p-4 md:p-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <section className="rounded-3xl border border-zinc-200 bg-white shadow-lg shadow-zinc-300/30">
          <div className="p-6 md:p-8">
            <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="flex items-center">
                    <img src={BRAND.logo} alt="Logo TGO Logística" className="h-12 object-contain" />
                  </div>
                  
                </div>

                <div>
                  <h1 className="text-3xl font-semibold tracking-tight text-zinc-800 md:text-4xl">{BRAND.name}</h1>
                  <p className="mt-2 max-w-3xl text-sm text-zinc-600 md:text-base">
                    
                  </p>
                </div>

                
              </div>

              
            </div>
          </div>
        </section>

        <div className="grid items-stretch gap-6 xl:grid-cols-12">
          <div className="space-y-6 xl:col-span-7">
            <section className="rounded-3xl border border-zinc-200 bg-white shadow-lg shadow-zinc-300/30">
              <div className="p-6">
                <h2 className="mb-5 text-xl font-semibold text-zinc-800">Datos comerciales</h2>

                <div className="grid gap-5 md:grid-cols-2">
                  

                  <Field label="Empresa">
                    <input value={clientName} onChange={(e) => setClientName(e.target.value)} className={inputClass} />
                  </Field>

                  <Field label="Contacto">
                    <input value={contactName} onChange={(e) => setContactName(e.target.value)} className={inputClass} />
                  </Field>

                  
                </div>
              </div>
            </section>

            <section className="rounded-3xl border border-zinc-200 bg-white shadow-lg shadow-zinc-300/30">
              <div className="p-6">
                <h2 className="mb-5 text-xl font-semibold text-zinc-800">Datos operativos</h2>

                <div className="grid gap-5 md:grid-cols-2">
                  <Field label="Región">
                    <select value={region} onChange={(e) => setRegion(e.target.value)} className={inputClass}>
                      {REGIONS.map((item) => (
                        <option key={item} value={item}>
                          {item}
                        </option>
                      ))}
                    </select>
                  </Field>

                  <Field label="Destino">
                    <select value={destination} onChange={(e) => setDestination(e.target.value)} className={inputClass}>
                      {DESTINATIONS.map((item) => (
                        <option key={item} value={item}>
                          {item}
                        </option>
                      ))}
                    </select>
                  </Field>

                  <Field label="Peso real (kg)">
                    <input type="number" min="0" step="0.01" value={peso} onChange={(e) => setPeso(e.target.value)} className={inputClass} />
                  </Field>

                  <Field label="Volumen (CBM)">
                    <input type="number" min="0" step="0.01" value={volumen} onChange={(e) => setVolumen(e.target.value)} className={inputClass} />
                  </Field>

                                   <div className="md:col-span-2 flex flex-wrap gap-3 pt-2">
                    <button
                      onClick={handleCalculate}
                      type="button"
                      className="rounded-2xl bg-orange-500 px-6 py-3 font-medium text-white transition hover:bg-orange-600"
                    >
                      Calcular cotización
                    </button>

                    <button
                      onClick={handleReset}
                      type="button"
                      className="rounded-2xl border border-zinc-200 bg-zinc-100 px-6 py-3 font-medium text-zinc-700 transition hover:bg-zinc-200"
                    >
                      Restablecer
                    </button>
                  </div>
                </div>
              </div>
            </section>

            <section className="rounded-3xl border border-zinc-200 bg-white shadow-lg shadow-zinc-300/30">
              <div className="p-6">
                <h2 className="mb-5 text-xl font-semibold text-zinc-800">Condiciones comerciales</h2>

                <ul className="space-y-3 text-sm text-zinc-700">
  {COMMERCIAL_CONSIDERATIONS.map((item) => (
    <li key={item} className="flex items-start gap-3">
      <ShieldCheck className="mt-0.5 h-4 w-4 text-orange-500" />
      <span>{item}</span>
    </li>
  ))}
</ul>
              </div>
            </section>
          </div>

          <div className="space-y-6 xl:col-span-5">
            <section className="flex flex-col rounded-3xl border border-orange-500/20 bg-gradient-to-b from-zinc-800 to-zinc-900 text-white shadow-lg shadow-zinc-400/20">
              <div className="p-6">
                <div className="mb-6 flex items-center justify-between gap-4">
                  <h2 className="text-xl font-semibold text-white">Resultado de cotización</h2>
                  <span className="rounded-full border border-orange-400/30 bg-orange-500/15 px-3 py-1 text-xs text-orange-100">
                    {quoteResult.validity}
                  </span>
                </div>

                <div className="space-y-6">
                  <div>
                    <p className="text-sm text-orange-200/80">Total estimado</p>
                    <p className="mt-2 text-4xl font-semibold tracking-tight md:text-5xl">{formatMoney(quoteResult.total)}</p>
                  </div>

                  <div className="rounded-2xl border border-orange-400/15 bg-white/5 p-4">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="text-xs uppercase tracking-[0.18em] text-orange-200">Cotización</p>
                        <p className="mt-1 text-lg font-medium">{quoteResult.quoteNumber}</p>
                      </div>

                      <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-orange-500/15 text-orange-200">
                        <UserCircle2 className="h-6 w-6" />
                      </div>
                    </div>

                    <p className="mt-3 text-sm text-zinc-200">
                      {clientName} · {contactName}
                    </p>
                    <p className="text-sm text-zinc-300">{role}</p>
                  </div>

                  <div className="space-y-3 rounded-2xl border border-orange-400/15 bg-white/5 p-4">
                    <ResultRow label="Peso real" value={`${formatNumber(quoteResult.metrics.pesoReal)} kg`} />
                    <ResultRow label="Peso considerado" value={`${formatNumber(quoteResult.metrics.pesoCargable)} kg`} highlight />
                  </div>

                  <div className="flex flex-wrap gap-3">
                    <button
                      type="button"
                      onClick={() => downloadQuotePdf({ clientName, contactName, role, result: quoteResult })}
                      className="inline-flex items-center rounded-2xl bg-orange-500 px-5 py-3 font-medium text-white transition hover:bg-orange-600"
                    >
                      <Download className="mr-2 h-4 w-4" />
                      Descargar PDF
                    </button>
                  </div>

                  <div className="h-px bg-white/10" />

                  
                </div>
              </div>
            </section>

            
           
            
          </div>
        </div>
      </div>
    </div>
  );
}

function Field({
  label,
  className = "",
  children,
}: {
  label: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={`space-y-2 ${className}`}>
      <label className="block text-sm font-medium text-zinc-800">{label}</label>
      {children}
    </div>
  );
}

function ResultRow({
  label,
  value,
  highlight = false,
}: {
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-4 text-sm">
      <span className="text-zinc-300">{label}</span>
      <span className={highlight ? "font-semibold text-orange-300" : "text-white"}>{value}</span>
    </div>
  );
}

const inputClass =
  "w-full rounded-2xl border border-zinc-300 bg-white px-4 py-3 text-zinc-800 outline-none transition focus:border-orange-400";
