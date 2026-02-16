import { describe, it, expect } from "vitest";
import { calcChipBalance } from "../chip";
import type { SessionPlayer } from "../types";

const makePlayer = (
  id: string,
  chipCount: number | null
): SessionPlayer => ({
  id,
  displayName: id,
  seatOrder: 0,
  userId: null,
  chipCount,
});

describe("calcChipBalance", () => {
  it("calculates net yen from chip counts (20-chip start)", () => {
    const players = [
      makePlayer("A", 23), // +3 chips
      makePlayer("B", 18), // -2 chips
      makePlayer("C", 22), // +2 chips
      makePlayer("D", 17), // -3 chips
    ];

    const balance = calcChipBalance(players, 20, 500);

    expect(balance.get("A")).toBe(1500); // +3 × 500
    expect(balance.get("B")).toBe(-1000); // -2 × 500
    expect(balance.get("C")).toBe(1000); // +2 × 500
    expect(balance.get("D")).toBe(-1500); // -3 × 500

    // Sum should be 0
    const total = [...balance.values()].reduce((a, b) => a + b, 0);
    expect(total).toBe(0);
  });

  it("handles 0-chip start (net change mode)", () => {
    const players = [
      makePlayer("A", 5),
      makePlayer("B", -3),
      makePlayer("C", -2),
    ];

    const balance = calcChipBalance(players, 0, 1000);

    expect(balance.get("A")).toBe(5000);
    expect(balance.get("B")).toBe(-3000);
    expect(balance.get("C")).toBe(-2000);
  });

  it("treats null chipCount as 0 net", () => {
    const players = [
      makePlayer("A", 25),
      makePlayer("B", null), // not entered yet
    ];

    const balance = calcChipBalance(players, 20, 500);

    expect(balance.get("A")).toBe(2500);
    expect(balance.get("B")).toBe(0);
  });

  it("returns 0 for all when all chipCounts are null", () => {
    const players = [
      makePlayer("A", null),
      makePlayer("B", null),
    ];

    const balance = calcChipBalance(players, 20, 500);

    expect(balance.get("A")).toBe(0);
    expect(balance.get("B")).toBe(0);
  });

  it("returns empty map for no players", () => {
    const balance = calcChipBalance([], 20, 500);
    expect(balance.size).toBe(0);
  });
});
