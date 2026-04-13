/**
 * Client for BCRA API - fetches ICL (Indice para Contratos de Locacion)
 *
 * NOTE: As of April 2026, the BCRA DatosVariable v3.0 endpoint returns 404.
 * The ICL series is no longer publicly available via API.
 * This module attempts the known endpoint and falls back gracefully.
 * When the API is unavailable, the user can enter the ICL value manually
 * (sourced from https://www.bcra.gob.ar/PublicacionesEstadisticas/Principales_variables_datos.asp)
 */

interface BCRAResponse {
  results: { d: string; v: number }[];
}

export async function fetchICLValues(
  dateFrom: string,
  dateTo: string
): Promise<{ date: string; value: number }[]> {
  // Try v3.0 endpoint (may be unavailable)
  const url = `https://api.bcra.gob.ar/estadisticas/v3.0/DatosVariable/43/${dateFrom}/${dateTo}`;

  try {
    const res = await fetch(url, {
      headers: { Accept: "application/json" },
      signal: AbortSignal.timeout(10000),
    });

    if (!res.ok) {
      console.warn(`BCRA API returned ${res.status} — ICL not available via API`);
      return [];
    }

    const data: BCRAResponse = await res.json();
    return (data.results || []).map((r) => ({
      date: r.d,
      value: r.v,
    }));
  } catch (error) {
    console.warn("BCRA API unavailable:", error instanceof Error ? error.message : error);
    return [];
  }
}

export async function getICLForMonth(year: number, month: number): Promise<number | null> {
  const from = `${year}-${String(month).padStart(2, "0")}-01`;
  const lastDay = new Date(year, month, 0).getDate();
  const to = `${year}-${String(month).padStart(2, "0")}-${lastDay}`;

  const values = await fetchICLValues(from, to);
  if (values.length === 0) return null;

  return values[values.length - 1].value;
}
