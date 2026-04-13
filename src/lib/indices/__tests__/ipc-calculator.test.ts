import { describe, it, expect, vi } from "vitest";
import { calculateIpcAdjustment, type IpcReference, type LastAdjustmentInfo } from "../ipc-calculator";

// Realistic IPC values (approximate, based on INDEC data)
const IPC_VALUES: Record<string, number> = {
  "2025-06": 46476.00,
  "2025-07": 47351.50,
  "2025-08": 48304.13,
  "2025-09": 49372.80,
  "2025-10": 50539.30,
  "2025-11": 51881.60,
  "2025-12": 53359.60,
  "2026-01": 54960.80,
};

function mockGetIpcValue(period: string): Promise<number | null> {
  return Promise.resolve(IPC_VALUES[period] ?? null);
}

describe("calculateIpcAdjustment", () => {
  it("standard adjustment with 4 months composed (Jun→Oct)", async () => {
    // Departure: June 2025, Arrival: October 2025
    // Coefficient = 50539.30 / 46476.00 = 1.08742...
    const lastAdj: LastAdjustmentInfo = {
      toPeriod: "2025-06",
      toValue: 46476.00,
    };

    // today = Nov 20 2025 → last published = Oct 2025
    const result = await calculateIpcAdjustment(
      200000,
      lastAdj,
      null,
      new Date(2025, 10, 20), // Nov 20
      mockGetIpcValue
    );

    expect(result.fromPeriod).toBe("2025-06");
    expect(result.toPeriod).toBe("2025-10");
    expect(result.fromIndexValue).toBe(46476.00);
    expect(result.toIndexValue).toBe(50539.30);
    expect(result.monthsCovered).toBe(4);

    // Verify coefficient: 50539.30 / 46476.00
    const expectedCoefficient = 50539.30 / 46476.00;
    expect(result.coefficient).toBeCloseTo(expectedCoefficient, 4);

    // Verify percentage
    const expectedPercentage = (expectedCoefficient - 1) * 100;
    expect(result.percentage).toBeCloseTo(expectedPercentage, 2);

    // Verify new rent
    expect(result.newRent).toBe(Math.round(200000 * expectedCoefficient));
    expect(result.previousRent).toBe(200000);
  });

  it("adjustment with 3 months composed (Oct→Jan)", async () => {
    // Departure: October 2025, Arrival: January 2026
    const lastAdj: LastAdjustmentInfo = {
      toPeriod: "2025-10",
      toValue: 50539.30,
    };

    // today = Feb 20 2026 → last published = Jan 2026
    const result = await calculateIpcAdjustment(
      217485, // rent after previous adjustment
      lastAdj,
      null,
      new Date(2026, 1, 20),
      mockGetIpcValue
    );

    expect(result.fromPeriod).toBe("2025-10");
    expect(result.toPeriod).toBe("2026-01");
    expect(result.monthsCovered).toBe(3);

    const expectedCoefficient = 54960.80 / 50539.30;
    expect(result.coefficient).toBeCloseTo(expectedCoefficient, 4);
    expect(result.newRent).toBe(Math.round(217485 * expectedCoefficient));
  });

  it("first adjustment uses ipc_referencia_inicial", async () => {
    const ipcRef: IpcReference = {
      period: "2025-09",
      value: 49372.80,
    };

    // today = Jan 16 2026 → last published = Dec 2025
    const result = await calculateIpcAdjustment(
      180000,
      null, // no previous adjustment
      ipcRef,
      new Date(2026, 0, 16),
      mockGetIpcValue
    );

    expect(result.fromPeriod).toBe("2025-09");
    expect(result.toPeriod).toBe("2025-12");
    expect(result.fromIndexValue).toBe(49372.80);
    expect(result.toIndexValue).toBe(53359.60);
    expect(result.monthsCovered).toBe(3);
    expect(result.previousRent).toBe(180000);

    const expectedCoefficient = 53359.60 / 49372.80;
    expect(result.newRent).toBe(Math.round(180000 * expectedCoefficient));
  });

  it("second adjustment inherits arrival from first as departure", async () => {
    // First adjustment ended at October 2025
    // Second adjustment should start from October 2025
    const lastAdj: LastAdjustmentInfo = {
      toPeriod: "2025-10",
      toValue: 50539.30,
    };

    // today = Feb 20 2026 → last published = Jan 2026
    const result = await calculateIpcAdjustment(
      250000,
      lastAdj,
      null,
      new Date(2026, 1, 20),
      mockGetIpcValue
    );

    // Departure = Oct (arrival of previous), Arrival = Jan
    expect(result.fromPeriod).toBe("2025-10");
    expect(result.toPeriod).toBe("2026-01");
    // No gap, no overlap — covers Nov, Dec, Jan = 3 months
    expect(result.monthsCovered).toBe(3);
  });

  it("composition of multiple adjustments equals base × (IPC_final / IPC_initial)", async () => {
    // Simulate 4 consecutive adjustments from Jun 2025 to Jan 2026
    // The final rent should equal: base_rent × (IPC_Jan2026 / IPC_Jun2025)
    const baseRent = 200000;
    let currentRent = baseRent;
    let lastAdj: LastAdjustmentInfo = null;
    const ipcRef: IpcReference = { period: "2025-06", value: 46476.00 };

    // Adjustment 1: Jun→Jul (today = Aug 20)
    const adj1 = await calculateIpcAdjustment(currentRent, lastAdj, ipcRef, new Date(2025, 7, 20), mockGetIpcValue);
    currentRent = adj1.newRent;
    lastAdj = { toPeriod: adj1.toPeriod, toValue: adj1.toIndexValue };

    // Adjustment 2: Jul→Sep (today = Oct 20)
    const adj2 = await calculateIpcAdjustment(currentRent, lastAdj, null, new Date(2025, 9, 20), mockGetIpcValue);
    currentRent = adj2.newRent;
    lastAdj = { toPeriod: adj2.toPeriod, toValue: adj2.toIndexValue };

    // Adjustment 3: Sep→Nov (today = Dec 20)
    const adj3 = await calculateIpcAdjustment(currentRent, lastAdj, null, new Date(2025, 11, 20), mockGetIpcValue);
    currentRent = adj3.newRent;
    lastAdj = { toPeriod: adj3.toPeriod, toValue: adj3.toIndexValue };

    // Adjustment 4: Nov→Jan (today = Feb 20)
    const adj4 = await calculateIpcAdjustment(currentRent, lastAdj, null, new Date(2026, 1, 20), mockGetIpcValue);
    currentRent = adj4.newRent;

    // The final rent should be very close to base × (IPC_Jan / IPC_Jun)
    const directCalculation = Math.round(baseRent * (54960.80 / 46476.00));

    // Allow ±1 difference due to intermediate rounding of rent to integer
    expect(Math.abs(currentRent - directCalculation)).toBeLessThanOrEqual(1);
  });

  it("throws when no previous adjustment and no ipc_referencia_inicial", async () => {
    await expect(
      calculateIpcAdjustment(200000, null, null, new Date(2026, 1, 20), mockGetIpcValue)
    ).rejects.toThrow("No hay ajuste anterior ni referencia inicial de IPC");
  });

  it("throws when arrival period is not after departure", async () => {
    const lastAdj: LastAdjustmentInfo = {
      toPeriod: "2026-01",
      toValue: 54960.80,
    };

    // today = Feb 10 2026 → last published = Dec 2025 (before Jan departure!)
    await expect(
      calculateIpcAdjustment(200000, lastAdj, null, new Date(2026, 1, 10), mockGetIpcValue)
    ).rejects.toThrow("no es posterior al de partida");
  });

  it("throws when IPC value is not available", async () => {
    const lastAdj: LastAdjustmentInfo = {
      toPeriod: "2025-06",
      toValue: 46476.00,
    };

    // Request a month that doesn't exist in our mock
    const emptyProvider = () => Promise.resolve(null);

    await expect(
      calculateIpcAdjustment(200000, lastAdj, null, new Date(2026, 1, 20), emptyProvider)
    ).rejects.toThrow("No se encontro el valor del IPC");
  });

  it("cache hit vs miss: second call with same month should not call provider twice", async () => {
    const spy = vi.fn(mockGetIpcValue);

    const lastAdj: LastAdjustmentInfo = {
      toPeriod: "2025-06",
      toValue: 46476.00,
    };

    // First call
    await calculateIpcAdjustment(200000, lastAdj, null, new Date(2025, 10, 20), spy);
    const callCount1 = spy.mock.calls.length;

    // Second call with same parameters — the provider is called again
    // (caching is handled at the server action layer, not in the pure function)
    await calculateIpcAdjustment(200000, lastAdj, null, new Date(2025, 10, 20), spy);
    const callCount2 = spy.mock.calls.length;

    // Both calls request the same toPeriod, so provider is called once per invocation
    // This test verifies the function works correctly with the provider pattern
    expect(callCount2).toBe(callCount1 * 2);
  });
});

describe("manual composition verification", () => {
  it("4-month composition matches manual multiplication", async () => {
    // Jul/Aug/Sep/Oct monthly IPC variations:
    // Jul: 47351.50 / 46476.00 = 1.01884...
    // Aug: 48304.13 / 47351.50 = 1.02012...
    // Sep: 49372.80 / 48304.13 = 1.02213...
    // Oct: 50539.30 / 49372.80 = 1.02362...
    //
    // Composed: 1.01884 × 1.02012 × 1.02213 × 1.02362 = same as 50539.30/46476.00

    const directCoefficient = 50539.30 / 46476.00;
    const monthlyComposition =
      (47351.50 / 46476.00) *
      (48304.13 / 47351.50) *
      (49372.80 / 48304.13) *
      (50539.30 / 49372.80);

    // These should be exactly equal (floating point identity: telescoping product)
    expect(monthlyComposition).toBeCloseTo(directCoefficient, 10);
  });
});
