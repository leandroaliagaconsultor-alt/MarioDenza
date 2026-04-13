import Anthropic from "@anthropic-ai/sdk";

export interface ExtractedContractData {
  tenant_name: string | null;
  tenant_dni: string | null;
  owner_name: string | null;
  owner_dni: string | null;
  property_address: string | null;
  property_unit: string | null;
  start_date: string | null;
  end_date: string | null;
  rent_amount: number | null;
  rent_currency: "ARS" | "USD" | null;
  payment_day: number | null;
  adjustment_frequency_months: number | null;
  adjustment_type: string | null;
  guarantor_name: string | null;
  guarantor_dni: string | null;
  notes: string | null;
  confidence: "high" | "medium" | "low";
  raw_fields_found: string[];
}

const EXTRACTION_PROMPT = `Sos un asistente especializado en contratos de alquiler de Argentina.
Extraé los siguientes datos del contrato en formato JSON. Si un campo no se encuentra, poné null.

Campos a extraer:
- tenant_name: nombre completo del inquilino/locatario
- tenant_dni: DNI o CUIT del inquilino
- owner_name: nombre completo del propietario/locador
- owner_dni: DNI o CUIT del propietario
- property_address: dirección completa de la propiedad
- property_unit: unidad/depto/piso si aplica
- start_date: fecha de inicio del contrato en formato YYYY-MM-DD
- end_date: fecha de fin del contrato en formato YYYY-MM-DD
- rent_amount: monto del alquiler mensual inicial (solo el número)
- rent_currency: "ARS" o "USD"
- payment_day: día del mes para pagar (1-31)
- adjustment_frequency_months: cada cuántos meses se ajusta el alquiler
- adjustment_type: tipo de ajuste (ej: "IPC", "ICL", "porcentaje fijo", etc.)
- guarantor_name: nombre del garante si figura
- guarantor_dni: DNI del garante si figura
- notes: cláusulas especiales o datos relevantes (máximo 200 chars)
- confidence: "high" si pudiste extraer los campos principales (nombres, fechas, monto), "medium" si faltan algunos, "low" si el documento no parece un contrato de alquiler
- raw_fields_found: lista de nombres de campos que pudiste extraer con certeza

Respondé SOLO con el JSON, sin markdown ni explicación.`;

export async function extractContractFromPdf(
  pdfBase64: string
): Promise<ExtractedContractData> {
  const client = new Anthropic();

  const response = await client.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 2000,
    messages: [
      {
        role: "user",
        content: [
          {
            type: "document",
            source: {
              type: "base64",
              media_type: "application/pdf",
              data: pdfBase64,
            },
          },
          {
            type: "text",
            text: EXTRACTION_PROMPT,
          },
        ],
      },
    ],
  });

  const textBlock = response.content.find((b) => b.type === "text");
  if (!textBlock || textBlock.type !== "text") {
    throw new Error("No se recibió respuesta de texto");
  }

  let jsonStr = textBlock.text.trim();
  if (jsonStr.startsWith("```")) {
    jsonStr = jsonStr.replace(/^```json?\n?/, "").replace(/\n?```$/, "");
  }

  return JSON.parse(jsonStr) as ExtractedContractData;
}
