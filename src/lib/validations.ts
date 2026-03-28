import { z } from "zod";

export const quoteSchema = z.object({
  clientName: z.string().min(1, "El nombre del cliente es obligatorio"),
  contactName: z.string().min(1, "El nombre del contacto es obligatorio"),
  region: z.string().min(1, "La región es obligatoria"),
  destination: z.enum(["PUERTO", "AEROPUERTO"]),
  service: z.enum(["Estándar", "Express", "Coordinado"]),
  peso: z.coerce.number().min(0),
  volumen: z.coerce.number().min(0),
  declaredValue: z.coerce.number().min(0).optional().default(0),
});

export type QuoteSchemaInput = z.infer<typeof quoteSchema>;