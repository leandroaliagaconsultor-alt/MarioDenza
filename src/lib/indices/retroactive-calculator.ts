/**
 * Calculates all retroactive adjustments for a contract that started in the past.
 *
 * Given a start_date, base_rent, adjustment frequency and index type,
 * computes each adjustment that should have occurred from start to today,
 * returning the current rent and the full history.
 */

export interface RetroactiveAdjustment {
  adjustmentNumber: number;
  date: string;           // "YYYY-MM-DD" — when the adjustment would have been applied
  fromPeriod: string;     // "YYYY-MM" — IPC/ICL departure month
  toPeriod: string;       // "YYYY-MM" — IPC/ICL arrival month
  fromValue: number;
  toValue: number;
  coefficient: number;
  percentage: number;
  rentBefore: number;
  rentAfter: number;
}

export interface RetroactiveResult {
  adjustments: RetroactiveAdjustment[];
  currentRent: number;       // final rent after all adjustments
  totalPercentage: number;   // total increase from base to current
}

export type IndexValueProvider = (type: "ICL" | "IPC", period: string) => Promise<number | null>;

/**
 * Calculate all retroactive adjustments.
 *
 * @param baseRent - Original rent at contract start
 * @param startDate - Contract start date "YYYY-MM-DD"
 * @param frequencyMonths - Months between adjustments (e.g., 3, 6, 12)
 * @param indexType - "ICL" or "IPC"
 * @param today - Current date
 * @param getIndexValue - Async provider for index values
 */
export async function calculateRetroactiveAdjustments(
  baseRent: number,
  startDate: string,
  frequencyMonths: number,
  indexType: "ICL" | "IPC",
  today: Date,
  getIndexValue: IndexValueProvider
): Promise<RetroactiveResult> {
  const adjustments: RetroactiveAdjustment[] = [];
  let currentRent = baseRent;

  // First adjustment date
  const start = new Date(startDate);
  let adjustmentDate = new Date(start);
  adjustmentDate.setMonth(adjustmentDate.getMonth() + frequencyMonths);

  // The "departure" index period for the first adjustment is the month of contract start
  let fromPeriod = `${start.getFullYear()}-${String(start.getMonth() + 1).padStart(2, "0")}`;
  let fromValue: number | null = null;

  // Get the initial index value
  fromValue = await getIndexValue(indexType, fromPeriod);
  if (fromValue === null) {
    // Can't calculate without the starting index
    return { adjustments: [], currentRent: baseRent, totalPercentage: 0 };
  }

  let adjustmentNumber = 0;

  while (adjustmentDate <= today) {
    adjustmentNumber++;

    // The "arrival" period: the month before the adjustment date
    // (the latest index available at the time of adjustment)
    const arrivalMonth = adjustmentDate.getMonth(); // 0-indexed, so this is already "month before"
    const arrivalYear = arrivalMonth === 0 ? adjustmentDate.getFullYear() - 1 : adjustmentDate.getFullYear();
    const arrivalMonthNum = arrivalMonth === 0 ? 12 : arrivalMonth;
    const toPeriod = `${arrivalYear}-${String(arrivalMonthNum).padStart(2, "0")}`;

    // Skip if arrival is not after departure
    if (toPeriod <= fromPeriod) {
      adjustmentDate.setMonth(adjustmentDate.getMonth() + frequencyMonths);
      continue;
    }

    const toValue = await getIndexValue(indexType, toPeriod);
    if (toValue === null) {
      // No index data available for this period, stop here
      break;
    }

    const coefficient = toValue / fromValue;
    const percentage = (coefficient - 1) * 100;
    const rentBefore = currentRent;
    const rentAfter = Math.round(currentRent * coefficient);

    adjustments.push({
      adjustmentNumber,
      date: adjustmentDate.toISOString().split("T")[0],
      fromPeriod,
      toPeriod,
      fromValue,
      toValue,
      coefficient,
      percentage,
      rentBefore,
      rentAfter,
    });

    currentRent = rentAfter;
    fromPeriod = toPeriod;
    fromValue = toValue;

    // Next adjustment date
    adjustmentDate.setMonth(adjustmentDate.getMonth() + frequencyMonths);
  }

  const totalPercentage = baseRent > 0 ? ((currentRent - baseRent) / baseRent) * 100 : 0;

  return { adjustments, currentRent, totalPercentage };
}
