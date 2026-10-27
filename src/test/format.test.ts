import { describe, it, expect } from "vitest";
import { formatNumber, getRelativeTime } from "@/lib/format";

describe("formatNumber", () => {
  it("formats millions correctly", () => {
    expect(formatNumber(1500000)).toBe("1.5M");
    expect(formatNumber(10000000)).toBe("10.0M");
  });

  it("formats thousands correctly", () => {
    expect(formatNumber(1250)).toBe("1.3K");
    expect(formatNumber(45000)).toBe("45.0K");
  });

  it("formats small numbers as integers", () => {
    expect(formatNumber(42)).toBe("42");
    expect(formatNumber(0)).toBe("0");
  });

  it("handles non-finite numbers safely", () => {
    expect(formatNumber(NaN)).toBe("0");
    expect(formatNumber(Infinity)).toBe("0");
  });
});

describe("getRelativeTime", () => {
  it("handles null, undefined and invalid strings safely", () => {
    expect(getRelativeTime(null)).toBe("reciente");
    expect(getRelativeTime(undefined)).toBe("reciente");
    expect(getRelativeTime("fecha-invalida")).toBe("reciente");
  });

  it("formats days, months, and years relative to now", () => {
    const now = Date.now();
    const twoDaysAgo = new Date(now - 2 * 24 * 60 * 60 * 1000).toISOString();
    expect(getRelativeTime(twoDaysAgo)).toBe("2d");

    const twoMonthsAgo = new Date(now - 65 * 24 * 60 * 60 * 1000).toISOString();
    expect(getRelativeTime(twoMonthsAgo)).toBe("2m");

    const twoYearsAgo = new Date(now - 750 * 24 * 60 * 60 * 1000).toISOString();
    expect(getRelativeTime(twoYearsAgo)).toBe("2a");
  });
});
