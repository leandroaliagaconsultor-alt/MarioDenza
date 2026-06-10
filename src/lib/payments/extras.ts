// Extras: conceptos adicionales con nombre + monto (expensas, ABL, cochera, etc.).
// Se definen en el contrato (plantilla recurrente) y se copian a cada pago como snapshot
// editable. Regla del cliente: NO son comisionables — el monto pasa entero al dueño.

export interface PaymentExtra {
  concept: string;
  amount: number;
}

/** Suma los montos de una lista de extras (ignora montos vacíos / no numéricos). */
export function extrasTotal(
  extras: { amount?: number | string | null }[] | null | undefined
): number {
  if (!Array.isArray(extras)) return 0;
  return extras.reduce((sum, e) => sum + (Number(e?.amount) || 0), 0);
}

/** Normaliza extras crudos (de un form o del Excel): descarta los sin concepto y redondea montos. */
export function normalizeExtras(
  extras: { concept?: string | null; amount?: number | string | null }[] | null | undefined
): PaymentExtra[] {
  if (!Array.isArray(extras)) return [];
  return extras
    .map((e) => ({
      concept: String(e?.concept ?? "").trim(),
      amount: Math.max(0, Math.round(Number(e?.amount) || 0)),
    }))
    .filter((e) => e.concept.length > 0);
}
