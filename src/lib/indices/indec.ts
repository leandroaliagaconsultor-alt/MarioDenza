/**
 * Client for datos.gob.ar API - fetches IPC (Indice de Precios al Consumidor)
 * Serie: 195.1_NIVEL_GENERAL_0_0_13 (IPC Nivel General Nacional)
 * API: https://apis.datos.gob.ar/series/api/
 */

interface SeriesResponse {
  data: [string, number | null][];
}

const IPC_SERIE_ID = "195.1_NIVEL_GENERAL_0_0_13";

export async function fetchIPCValues(
  dateFrom: string,
  dateTo: string
): Promise<{ date: string; value: number }[]> {
  const url = `https://apis.datos.gob.ar/series/api/series/?ids=${IPC_SERIE_ID}&start_date=${dateFrom}&end_date=${dateTo}&format=json`;

  try {
    const res = await fetch(url, {
      signal: AbortSignal.timeout(10000),
    });

    if (!res.ok) {
      console.warn(`INDEC API returned ${res.status}`);
      return [];
    }

    const data: SeriesResponse = await res.json();
    return (data.data || [])
      .filter(([, v]) => v !== null)
      .map(([date, value]) => ({
        date,
        value: value as number,
      }));
  } catch (error) {
    console.warn("INDEC API unavailable:", error instanceof Error ? error.message : error);
    return [];
  }
}

export async function getIPCForMonth(year: number, month: number): Promise<number | null> {
  const period = `${year}-${String(month).padStart(2, "0")}-01`;

  const values = await fetchIPCValues(period, period);
  if (values.length === 0) return null;

  return values[values.length - 1].value;
}
