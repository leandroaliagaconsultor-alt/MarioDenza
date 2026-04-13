import { describe, it, expect } from "vitest";
import { getLastPublishedIpcMonth, monthsBetween } from "../ipc-dates";

describe("getLastPublishedIpcMonth", () => {
  it("returns month-1 when day >= 15 (IPC published)", () => {
    // April 20 → IPC March is published
    expect(getLastPublishedIpcMonth(new Date(2026, 3, 20))).toBe("2026-03");
  });

  it("returns month-2 when day < 15 (IPC not yet published)", () => {
    // April 10 → IPC March NOT yet published → returns February
    expect(getLastPublishedIpcMonth(new Date(2026, 3, 10))).toBe("2026-02");
  });

  it("returns month-1 when day is exactly 15", () => {
    // March 15 → IPC February is published
    expect(getLastPublishedIpcMonth(new Date(2026, 2, 15))).toBe("2026-02");
  });

  it("handles January before the 15th (wraps to previous year)", () => {
    // January 10 → IPC November (month-2 wraps)
    expect(getLastPublishedIpcMonth(new Date(2026, 0, 10))).toBe("2025-11");
  });

  it("handles January after the 15th", () => {
    // January 20 → IPC December
    expect(getLastPublishedIpcMonth(new Date(2026, 0, 20))).toBe("2025-12");
  });

  it("handles February before the 15th", () => {
    // February 5 → IPC December
    expect(getLastPublishedIpcMonth(new Date(2026, 1, 5))).toBe("2025-12");
  });

  it("handles December after the 15th", () => {
    // December 20 → IPC November
    expect(getLastPublishedIpcMonth(new Date(2025, 11, 20))).toBe("2025-11");
  });
});

describe("monthsBetween", () => {
  it("calculates 3 months correctly", () => {
    expect(monthsBetween("2025-06", "2025-09")).toBe(3);
  });

  it("calculates 4 months correctly", () => {
    expect(monthsBetween("2025-06", "2025-10")).toBe(4);
  });

  it("calculates across year boundary", () => {
    expect(monthsBetween("2025-10", "2026-01")).toBe(3);
  });

  it("returns 0 for same month", () => {
    expect(monthsBetween("2025-06", "2025-06")).toBe(0);
  });
});
