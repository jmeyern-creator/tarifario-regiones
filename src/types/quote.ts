export type DestinationType = "PUERTO" | "AEROPUERTO";
export type ServiceType = "Estándar" | "Express" | "Coordinado";

export interface QuoteInput {
  clientName: string;
  contactName: string;
  region: string;
  destination: DestinationType;
  service: ServiceType;
  peso: number;
  volumen: number;
  declaredValue?: number;
}

export interface QuoteMetrics {
  pesoReal: number;
  volumen: number;
  pesoVolumetrico: number;
  pesoCargable: number;
}

export interface QuoteResult {
  quoteNumber: string;
  total: number;
  currency: "CLP";
  validity: string;
  metrics: QuoteMetrics;
  commercialSummary: string[];
  considerations: string[];
}