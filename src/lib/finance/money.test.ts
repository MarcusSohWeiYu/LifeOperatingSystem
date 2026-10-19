import { describe, it, expect } from "vitest";
import { toCents, fromCents, addCents, formatSGD } from "./money";

describe("toCents", () => {
  it("converts whole dollars", () => {
    expect(toCents(10)).toBe(1000);
    expect(toCents(0)).toBe(0);
    expect(toCents(1)).toBe(100);
  });

  it("converts decimal dollars", () => {
    expect(toCents(10.5)).toBe(1050);
    expect(toCents(10.99)).toBe(1099);
    expect(toCents(12.98)).toBe(1298);
  });

  it("rounds to nearest cent", () => {
    expect(toCents(0.005)).toBe(1);
    expect(toCents(0.004)).toBe(0);
    // 1.995 * 100 = 199.5 → rounds to 200
    expect(toCents(1.995)).toBe(200);
    // 1.994 * 100 = 199.4 → rounds to 199
    expect(toCents(1.994)).toBe(199);
  });
});

describe("fromCents", () => {
  it("converts cents to dollars", () => {
    expect(fromCents(1000)).toBe(10);
    expect(fromCents(0)).toBe(0);
    expect(fromCents(1099)).toBe(10.99);
    expect(fromCents(1)).toBe(0.01);
  });
});

describe("addCents", () => {
  it("sums multiple amounts", () => {
    expect(addCents(100, 200, 300)).toBe(600);
  });

  it("handles zero", () => {
    expect(addCents(0, 0, 0)).toBe(0);
  });

  it("handles single argument", () => {
    expect(addCents(500)).toBe(500);
  });

  it("handles no arguments", () => {
    expect(addCents()).toBe(0);
  });
});

describe("formatSGD", () => {
  it("formats zero", () => {
    expect(formatSGD(0)).toMatch(/\$0\.00/);
  });

  it("formats whole dollar amount", () => {
    expect(formatSGD(1000)).toMatch(/\$10\.00/);
  });

  it("formats cents", () => {
    expect(formatSGD(1099)).toMatch(/\$10\.99/);
  });

  it("includes SGD currency", () => {
    const result = formatSGD(500);
    expect(result).toMatch(/SGD|\$|S\$/);
  });
});
