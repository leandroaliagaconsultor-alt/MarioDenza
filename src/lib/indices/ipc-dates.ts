/**
 * Determines the last IPC month published by INDEC as of a given date.
 *
 * Convention: the IPC for month X is published around the 12th-15th of month X+1.
 * We use the 15th as conservative cutoff.
 *
 * - If today is April 20 → IPC March is published (April 15 already passed) → returns "2026-03"
 * - If today is April 10 → IPC March NOT yet published → returns "2026-02"
 * - If today is March 15 → IPC February is published (exactly on the 15th) → returns "2026-02"
 */
export function getLastPublishedIpcMonth(today: Date): string {
  const year = today.getFullYear();
  const month = today.getMonth() + 1; // 1-12
  const day = today.getDate();

  let resultYear: number;
  let resultMonth: number;

  if (day >= 15) {
    // IPC for (month - 1) is available
    resultYear = year;
    resultMonth = month - 1;
  } else {
    // IPC for (month - 2) is the latest available
    resultYear = year;
    resultMonth = month - 2;
  }

  // Handle year wraparound
  if (resultMonth <= 0) {
    resultMonth += 12;
    resultYear -= 1;
  }

  return `${resultYear}-${String(resultMonth).padStart(2, "0")}`;
}

/**
 * Calculate the number of months between two "YYYY-MM" periods.
 */
export function monthsBetween(fromPeriod: string, toPeriod: string): number {
  const [fy, fm] = fromPeriod.split("-").map(Number);
  const [ty, tm] = toPeriod.split("-").map(Number);
  return (ty - fy) * 12 + (tm - fm);
}
