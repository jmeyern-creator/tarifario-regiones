"use client";

import React, { useState } from "react";

const BRAND = {
  name: "Tarifario Regiones",
  subtitle: "Cotizador logístico corporativo",
  logo: "/logo.png",
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

const REGIONS = Object.keys(SERVER_RATE_TABLE);
const DESTINATIONS = Object.keys(SERVER_DESTINATION_ADDONS);

const COMMERCIAL_CONSIDERATIONS = [
  "Volumen máximo 5 CBM. Para volúmenes mayores, consultar evaluación especial.",
  "Dimensiones máximas referenciales: 1,80 m x 1,80 m x 1,80 m.",
  "La carga se recibe y entrega sobre camión.",
  "Carga peligrosa sujeta a revisión y aprobación previa.",
  "Servicio considerado en camión cerrado, salvo acuerdo comercial distinto.",
];

type QuoteResult = {
  quoteNumber: string;
  total: number;
  currency: "CLP";
  metrics: {
    pesoReal: number;
    pesoCargable: number;
  };
  validity: string;
};

function getTodayString(): string {
  return new Date().toLocaleDateString("es-CL");
}

function generateQuoteNumber(): string {
  const random = Math.floor(1000 + Math.random() * 9000);
  const date = new Date();
  const stamp = `${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, "0")}${String(date.getDate()).padStart(2, "0")}`;
  return `TGO-${stamp}-${random}`;
}

function calculateQuoteOnServer(payload: {
  region: string;
  destination: string;
  peso: string | number;
  volumen: string | number;
}): QuoteResult {
  const numericPeso = Number(payload.peso) || 0;
  const numericVolumen = Number(payload.volumen) || 0;

  const pesoVolumetrico = numericVolumen * 333;
  const pesoCargable = Math.ceil(Math.max(numericPeso, pesoVolumetrico));

  const regionRate = SERVER_RATE_TABLE[payload.region] || 0;
  const destinationAddon = SERVER_DESTINATION_ADDONS[payload.destination] || 0;

  const baseSubtotal = regionRate * pesoCargable;
  const minimumFreight = 45000;
  const freight = Math.max(baseSubtotal, minimumFreight);
  const total = Math.round(freight + destinationAddon);

  return {
    quoteNumber: generateQuoteNumber(),
    total,
    currency: "CLP",
    metrics: {
      pesoReal: numericPeso,
      pesoCargable,
    },
    validity: getTodayString(),
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
  region: string;
  destination: string;
  result: QuoteResult;
}) {
  const { clientName, contactName, region, destination, result } = params;
  const popup = window.open("", "_blank");
  if (!popup) return;

  popup.document.write(`
    <html>
      <head>
        <title>${result.quoteNumber}</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 40px; color: #3f3f46; }
          .header { display:flex; justify-content:space-between; align-items:center; border-bottom:2px solid #f97316; padding-bottom:16px; margin-bottom:24px; }
          .brand { display:flex; align-items:center; gap:16px; }
          .logo img { height:72px; max-width:220px; object-fit:contain; }
          .title { font-size:28px; font-weight:700; margin:0; }
          .subtitle { font-size:14px; color:#71717a; margin-top:4px; }
          .card { border:1px solid #e4e4e7; border-radius:16px; padding:20px; margin-top:18px; }
          .muted { color:#71717a; }
          .total { color:#f97316; font-size:34px; font-weight:700; margin-top:8px; }
          .row { display:flex; justify-content:space-between; gap:12px; margin:12px 0; }
          ul { padding-left: 18px; }
          li { margin: 8px 0; }
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
          <div class="muted">Fecha: ${result.validity}</div>
        </div>

        <div class="card">
          <div class="muted">Cotización</div>
          <div style="font-size:24px; font-weight:700; margin-top:6px;">${result.quoteNumber}</div>
          <div style="margin-top:14px;"><strong>Cliente:</strong> ${clientName || "-"}</div>
          <div style="margin-top:6px;"><strong>Contacto:</strong> ${contactName || "-"}</div>
          <div style="margin-top:6px;"><strong>Región:</strong> ${region}</div>
          <div style="margin-top:6px;"><strong>Destino:</strong> ${destination}</div>
        </div>

        <div class="card">
          <div class="muted">Total estimado</div>
          <div class="total">${formatMoney(result.total)}</div>
          <div class="row"><span class="muted">Peso real</span><strong>${formatNumber(result.metrics.pesoReal)} kg</strong></div>
          <div class="row"><span class="muted">Peso considerado</span><strong>${formatNumber(result.metrics.pesoCargable)} kg</strong></div>
        </div>

        <div class="card">
          <div style="font-weight:700; margin-bottom:10px;">Condiciones comerciales</div>
          <ul>
            ${COMMERCIAL_CONSIDERATIONS.map((item) => `<li>${item}</li>`).join("")}
          </ul>
        </div>
      </body>
    </html>
  `);

  popup.document.close();
  popup.focus();
  popup.print();
}

export default function CotizadorPage() {
  const [clientName, setClientName] = useState("");
  const [contactName, setContactName] = useState("");
  const [region, setRegion] = useState("DE ANTOFAGASTA");
  const [destination, setDestination] = useState("PUERTO");
  const [peso, setPeso] = useState("0");
  const [volumen, setVolumen] = useState("0");

  const [quoteResult, setQuoteResult] = useState<QuoteResult | null>(null);

  function handleCalculate() {
    const result = calculateQuoteOnServer({
      region,
      destination,
      peso,
      volumen,
    });

    setQuoteResult(result);
  }

  function handleReset() {
    setClientName("");
    setContactName("");
    setRegion("DE ANTOFAGASTA");
    setDestination("PUERTO");
    setPeso("0");
    setVolumen("0");
    setQuoteResult(null);
  }

  return (
    <main
      style={{
        minHeight: "100vh",
        background: "#f5f5f5",
        padding: "28px 20px 40px",
        fontFamily: "Arial, sans-serif",
      }}
    >
      <div style={{ maxWidth: 1240, margin: "0 auto" }}>
        <section
          style={{
            background: "#ffffff",
            border: "1px solid #e4e4e7",
            borderRadius: 24,
            padding: 28,
            boxShadow: "0 10px 30px rgba(113,113,122,0.10)",
            marginBottom: 24,
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "flex-start",
              alignItems: "center",
              gap: 18,
              flexWrap: "wrap",
            }}
          >
            <img
              src={BRAND.logo}
              alt="Logo TGO Logística"
              style={{ height: 88, objectFit: "contain" }}
            />
            <div>
              <h1
                style={{
                  margin: 0,
                  fontSize: 40,
                  color: "#27272a",
                  lineHeight: 1.1,
                }}
              >
                {BRAND.name}
              </h1>
              <p
                style={{
                  margin: "8px 0 0",
                  color: "#71717a",
                  fontSize: 16,
                }}
              >
                {BRAND.subtitle}
              </p>
            </div>
          </div>
        </section>

       <div
  style={{
    display: "grid",
    gridTemplateColumns: "1fr 460px",
    gap: 24,
    alignItems: "start",
  }}
>
          <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
            <section
              style={{
                background: "#ffffff",
                border: "1px solid #e4e4e7",
                borderRadius: 24,
                padding: 28,
                boxShadow: "0 10px 30px rgba(113,113,122,0.10)",
              }}
            >
              <h2
                style={{
                  marginTop: 0,
                  marginBottom: 22,
                  fontSize: 28,
                  color: "#27272a",
                }}
              >
                Datos de cotización
              </h2>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: 18,
                }}
              >
                <Field label="Cliente">
                  <input
                    value={clientName}
                    onChange={(e) => setClientName(e.target.value)}
                    style={inputStyle}
                  />
                </Field>

                <Field label="Contacto">
                  <input
                    value={contactName}
                    onChange={(e) => setContactName(e.target.value)}
                    style={inputStyle}
                  />
                </Field>

                <Field label="Región">
                  <select
                    value={region}
                    onChange={(e) => setRegion(e.target.value)}
                    style={inputStyle}
                  >
                    {REGIONS.map((item) => (
                      <option key={item} value={item}>
                        {item}
                      </option>
                    ))}
                  </select>
                </Field>

                <Field label="Destino / Origen">
                  <select
                    value={destination}
                    onChange={(e) => setDestination(e.target.value)}
                    style={inputStyle}
                  >
                    {DESTINATIONS.map((item) => (
                      <option key={item} value={item}>
                        {item}
                      </option>
                    ))}
                  </select>
                </Field>

                <Field label="Peso real (kg)">
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={peso}
                    onChange={(e) => setPeso(e.target.value)}
                    style={inputStyle}
                  />
                </Field>

                <Field label="Volumen (CBM)">
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={volumen}
                    onChange={(e) => setVolumen(e.target.value)}
                    style={inputStyle}
                  />
                </Field>

                <div style={{ gridColumn: "1 / -1", display: "flex", gap: 12, marginTop: 8 }}>
                  <button type="button" onClick={handleCalculate} style={primaryButtonStyle}>
                    Calcular cotización
                  </button>

                  <button type="button" onClick={handleReset} style={secondaryButtonStyle}>
                    Restablecer
                  </button>
                </div>
              </div>
            </section>

            <section
              style={{
                background: "#ffffff",
                border: "1px solid #e4e4e7",
                borderRadius: 24,
                padding: 28,
                boxShadow: "0 10px 30px rgba(113,113,122,0.10)",
              }}
            >
              <h2
                style={{
                  marginTop: 0,
                  marginBottom: 22,
                  fontSize: 28,
                  color: "#27272a",
                }}
              >
                Condiciones comerciales
              </h2>

              <ul style={{ margin: 0, padding: 0, listStyle: "none" }}>
                {COMMERCIAL_CONSIDERATIONS.map((item) => (
                  <li
                    key={item}
                    style={{
                      display: "flex",
                      alignItems: "flex-start",
                      gap: 12,
                      marginBottom: 14,
                      color: "#3f3f46",
                      lineHeight: 1.6,
                    }}
                  >
                    <span
                      style={{
                        width: 8,
                        height: 8,
                        borderRadius: "50%",
                        background: "#f97316",
                        marginTop: 9,
                        flexShrink: 0,
                      }}
                    />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </section>
          </div>

          <section
            style={{
              background: "linear-gradient(180deg, #3f3f46 0%, #18181b 100%)",
              border: "1px solid rgba(249,115,22,0.25)",
              borderRadius: 24,
              padding: 28,
              boxShadow: "0 12px 30px rgba(63,63,70,0.22)",
              color: "#ffffff",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: 12,
                marginBottom: 18,
              }}
            >
              <h2 style={{ margin: 0, fontSize: 28 }}>Resultado</h2>
              <span
                style={{
                  padding: "8px 12px",
                  borderRadius: 999,
                  background: "rgba(249,115,22,0.16)",
                  border: "1px solid rgba(249,115,22,0.30)",
                  fontSize: 12,
                  color: "#ffedd5",
                }}
              >
                {quoteResult?.validity ?? getTodayString()}
              </span>
            </div>

            <div style={{ marginBottom: 24 }}>
              <div style={{ color: "#fdba74", fontSize: 14, marginBottom: 8 }}>
                Total estimado
              </div>
              <div style={{ fontSize: 52, fontWeight: 800, lineHeight: 1.05 }}>
                {formatMoney(quoteResult?.total ?? 0)}
              </div>
            </div>

            <div
              style={{
                background: "rgba(255,255,255,0.05)",
                border: "1px solid rgba(249,115,22,0.18)",
                borderRadius: 18,
                padding: 20,
                marginBottom: 18,
              }}
            >
              <div
                style={{
                  color: "#fdba74",
                  fontSize: 12,
                  textTransform: "uppercase",
                  letterSpacing: 1.2,
                  marginBottom: 10,
                }}
              >
                Cotización
              </div>
              <div style={{ fontSize: 28, fontWeight: 800, marginBottom: 14 }}>
                {quoteResult ? quoteResult.quoteNumber : "Sin cotización"}
              </div>
              <div style={{ color: "#f4f4f5", lineHeight: 1.6 }}>
                <div>{clientName || "-"}</div>
                <div>{contactName || "-"}</div>
              </div>
            </div>

            <div
              style={{
                background: "rgba(255,255,255,0.05)",
                border: "1px solid rgba(249,115,22,0.18)",
                borderRadius: 18,
                padding: 20,
                marginBottom: 18,
              }}
            >
              <ResultRow
                label="Peso real"
                value={`${formatNumber(quoteResult?.metrics.pesoReal ?? 0)} kg`}
              />
              <ResultRow
                label="Peso cargable"
                value={`${formatNumber(quoteResult?.metrics.pesoCargable ?? 0)} kg`}
                highlight
              />
            </div>

            <button
              type="button"
              onClick={() => {
                if (quoteResult) {
                  downloadQuotePdf({
                    clientName,
                    contactName,
                    region,
                    destination,
                    result: quoteResult,
                  });
                }
              }}
              style={pdfButtonStyle}
              disabled={!quoteResult}
            >
              Descargar PDF
            </button>
          </section>
        </div>
      </div>
    </main>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label
        style={{
          display: "block",
          marginBottom: 8,
          fontSize: 14,
          fontWeight: 700,
          color: "#3f3f46",
        }}
      >
        {label}
      </label>
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
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        gap: 12,
        alignItems: "center",
        padding: "10px 0",
      }}
    >
      <span style={{ color: "#d4d4d8", fontSize: 15 }}>{label}</span>
      <span
        style={{
          color: highlight ? "#fdba74" : "#ffffff",
          fontWeight: highlight ? 800 : 600,
          fontSize: 16,
        }}
      >
        {value}
      </span>
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: 14,
  borderRadius: 14,
  border: "1px solid #d4d4d8",
  fontSize: 16,
  background: "#ffffff",
  color: "#3f3f46",
  outline: "none",
  boxSizing: "border-box",
};

const primaryButtonStyle: React.CSSProperties = {
  padding: "14px 24px",
  background: "#f97316",
  color: "#ffffff",
  border: "none",
  borderRadius: 12,
  cursor: "pointer",
  fontSize: 15,
  fontWeight: 700,
};

const secondaryButtonStyle: React.CSSProperties = {
  padding: "14px 24px",
  background: "#e4e4e7",
  color: "#3f3f46",
  border: "none",
  borderRadius: 12,
  cursor: "pointer",
  fontSize: 15,
  fontWeight: 700,
};

const pdfButtonStyle: React.CSSProperties = {
  width: "100%",
  padding: "14px 20px",
  background: "#f97316",
  color: "#ffffff",
  border: "none",
  borderRadius: 14,
  cursor: "pointer",
  fontSize: 15,
  fontWeight: 700,
  opacity: 1,
};
