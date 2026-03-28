import { QuoteInput, QuoteResult } from "../types/quote";

const RATE_TABLE: Record<string, number> = {
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

const DESTINATION_ADDONS = {
  PUERTO: 85000,
  AEROPUERTO: 25000,
} as const;

function generateQuoteNumber(): string {
  const random = Math.floor(1000 + Math.random() * 9000);
  const date = new Date();
  const stamp = `${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, "0")}${String(date.getDate()).padStart(2, "0")}`;
  return `TGO-${stamp}-${random}`;
}

export function calculateQuote(input: QuoteInput): QuoteResult {
  const pesoReal = Number(input.peso) || 0;
  const volumen = Number(input.volumen) || 0;
  const declaredValue = Number(input.declaredValue) || 0;

  const pesoVolumetrico = volumen * 333;
  const pesoCargable = Math.ceil(Math.max(pesoReal, pesoVolumetrico));

  const regionRate = RATE_TABLE[input.region] || 0;
  const destinationAddon = DESTINATION_ADDONS[input.destination] || 0;

  let serviceMultiplier = 1;
  if (input.service === "Express") serviceMultiplier = 1.12;
  if (input.service === "Coordinado") serviceMultiplier = 1.06;

  const baseSubtotal = regionRate * pesoCargable * serviceMultiplier;
  const minimumFreight = 45000;
  const freight = Math.max(baseSubtotal, minimumFreight);
  const insurance = declaredValue > 0 ? declaredValue * 0.0035 : 0;
  const total = Math.round(freight + destinationAddon + insurance);

  return {
    quoteNumber: generateQuoteNumber(),
    total,
    currency: "CLP",
    validity: "31/05/2025",
    metrics: {
      pesoReal,
      volumen,
      pesoVolumetrico,
      pesoCargable,
    },
    commercialSummary: [
      `Servicio ${input.service.toLowerCase()} calculado correctamente.`,
      `Destino ${input.destination.toLowerCase()} incluido.`,
    ],
    considerations: [
      "Volumen máximo 5 CBM.",
      "Carga sujeta a evaluación.",
    ],
  };
}