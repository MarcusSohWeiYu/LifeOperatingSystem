import { describe, it, expect } from "vitest";
import { toMonthlyCents } from "./frequency";

describe("toMonthlyCents", () => {
  describe("monthly", () => {
    it("returns amount unchanged", () => {
      expect(toMonthlyCents(10000, "monthly")).toBe(10000);
      expect(toMonthlyCents(0, "monthly")).toBe(0);
    });
  });

  describe("weekly", () => {
    it("multiplies by 52/12 and rounds", () => {
      // 100 cents * 52 / 12 = 433.33... → 433
      expect(toMonthlyCents(100, "weekly")).toBe(433);
      // 1000 cents * 52 / 12 = 4333.33... → 4333
      expect(toMonthlyCents(1000, "weekly")).toBe(4333);
      // 1200 cents * 52 / 12 = 5200 (exact)
      expect(toMonthlyCents(1200, "weekly")).toBe(5200);
    });
  });

  describe("fortnightly", () => {
    it("multiplies by 26/12 and rounds", () => {
      // 100 cents * 26 / 12 = 216.67 → 217
      expect(toMonthlyCents(100, "fortnightly")).toBe(217);
      // 1000 cents * 26 / 12 = 2166.67 → 2167
      expect(toMonthlyCents(1000, "fortnightly")).toBe(2167);
      // 2400 cents * 26 / 12 = 5200 (exact)
      expect(toMonthlyCents(2400, "fortnightly")).toBe(5200);
    });
  });

  describe("quarterly", () => {
    it("divides by 3 and rounds", () => {
      // 300 cents / 3 = 100 (exact)
      expect(toMonthlyCents(300, "quarterly")).toBe(100);
      // 100 cents / 3 = 33.33... → 33
      expect(toMonthlyCents(100, "quarterly")).toBe(33);
      // 1000 cents / 3 = 333.33... → 333
      expect(toMonthlyCents(1000, "quarterly")).toBe(333);
    });
  });

  describe("yearly", () => {
    it("divides by 12 and rounds", () => {
      // 1200 cents / 12 = 100 (exact)
      expect(toMonthlyCents(1200, "yearly")).toBe(100);
      // 100 cents / 12 = 8.33... → 8
      expect(toMonthlyCents(100, "yearly")).toBe(8);
      // 1000 cents / 12 = 83.33... → 83
      expect(toMonthlyCents(1000, "yearly")).toBe(83);
    });
  });

  describe("real-world subscription amounts", () => {
    it("Netflix $18.98/month stays the same", () => {
      expect(toMonthlyCents(1898, "monthly")).toBe(1898);
    });

    it("Spotify $9.98/month weekly equivalent", () => {
      // $9.98 monthly = 998 cents
      expect(toMonthlyCents(998, "monthly")).toBe(998);
    });

    it("annual subscription $120/year = $10/month", () => {
      expect(toMonthlyCents(12000, "yearly")).toBe(1000);
    });
  });
});
