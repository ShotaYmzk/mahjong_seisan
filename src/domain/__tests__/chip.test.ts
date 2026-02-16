import { describe, it, expect } from "vitest";
import { calcChipBalance } from "../chip";
import type { ChipEvent } from "../types";

describe("calcChipBalance", () => {
  it("calculates simple chip transfer", () => {
    const events: ChipEvent[] = [
      { id: "1", fromPlayerId: "A", toPlayerId: "B", quantity: 3 },
    ];

    const balance = calcChipBalance(events, 500);

    expect(balance.get("A")).toBe(-1500);
    expect(balance.get("B")).toBe(1500);
  });

  it("aggregates multiple events", () => {
    const events: ChipEvent[] = [
      { id: "1", fromPlayerId: "A", toPlayerId: "B", quantity: 3 },
      { id: "2", fromPlayerId: "B", toPlayerId: "C", quantity: 2 },
      { id: "3", fromPlayerId: "C", toPlayerId: "A", quantity: 1 },
    ];

    const balance = calcChipBalance(events, 500);

    // A: -1500 + 500 = -1000
    // B: +1500 - 1000 = +500
    // C: +1000 - 500 = +500
    expect(balance.get("A")).toBe(-1000);
    expect(balance.get("B")).toBe(500);
    expect(balance.get("C")).toBe(500);

    // Sum should be 0
    const total = (balance.get("A") ?? 0) + (balance.get("B") ?? 0) + (balance.get("C") ?? 0);
    expect(total).toBe(0);
  });

  it("returns empty map for no events", () => {
    const balance = calcChipBalance([], 500);
    expect(balance.size).toBe(0);
  });
});
