import { describe, it, expect } from "vitest";
import { calcTransfers } from "../transfer";
import type { SessionPlayer } from "../types";

const players: SessionPlayer[] = [
  { id: "A", displayName: "田中", seatOrder: 1, userId: null },
  { id: "B", displayName: "佐藤", seatOrder: 2, userId: null },
  { id: "C", displayName: "鈴木", seatOrder: 3, userId: null },
  { id: "D", displayName: "高橋", seatOrder: 4, userId: null },
];

describe("calcTransfers", () => {
  it("generates minimal transfer list", () => {
    const balances = [
      { playerId: "A", amount: 5000 },
      { playerId: "B", amount: 3000 },
      { playerId: "C", amount: -6000 },
      { playerId: "D", amount: -2000 },
    ];

    const transfers = calcTransfers(balances, players);

    // Total transfers should cover all debts
    const totalTransferred = transfers.reduce((s, t) => s + t.amount, 0);
    expect(totalTransferred).toBe(8000);

    // Max 3 transfers for 4 players
    expect(transfers.length).toBeLessThanOrEqual(3);

    // Verify all names are correct
    for (const t of transfers) {
      expect(t.fromName).toBeTruthy();
      expect(t.toName).toBeTruthy();
    }
  });

  it("handles zero-sum with two players", () => {
    const balances = [
      { playerId: "A", amount: 1000 },
      { playerId: "B", amount: -1000 },
      { playerId: "C", amount: 0 },
      { playerId: "D", amount: 0 },
    ];

    const transfers = calcTransfers(balances, players);
    expect(transfers.length).toBe(1);
    expect(transfers[0].fromPlayerId).toBe("B");
    expect(transfers[0].toPlayerId).toBe("A");
    expect(transfers[0].amount).toBe(1000);
  });

  it("returns empty for all-zero balances", () => {
    const balances = [
      { playerId: "A", amount: 0 },
      { playerId: "B", amount: 0 },
      { playerId: "C", amount: 0 },
      { playerId: "D", amount: 0 },
    ];

    const transfers = calcTransfers(balances, players);
    expect(transfers.length).toBe(0);
  });
});
