import { NextRequest, NextResponse } from "next/server";
import { calculateQuote } from "../../../lib/quote-engine";
import { quoteSchema } from "../../../lib/validations";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = quoteSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          error: "Datos inválidos",
          details: parsed.error.flatten(),
        },
        { status: 400 }
      );
    }

    const result = calculateQuote(parsed.data);

    return NextResponse.json(result, { status: 200 });
  } catch {
    return NextResponse.json(
      {
        error: "No se pudo calcular la cotización",
      },
      { status: 500 }
    );
  }
}