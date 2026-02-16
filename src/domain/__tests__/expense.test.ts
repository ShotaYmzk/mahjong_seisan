import { describe, it, expect } from "vitest";
import { calcExpenseBalance } from "../expense";
import type { Expense } from "../types";

const ALL_PLAYERS = ["A", "B", "C", "D"];

describe("calcExpenseBalance", () => {
  it("splits expense equally among all members", () => {
    const expenses: Expense[] = [
      {
        id: "1",
        payerId: "C",
        amount: 4000,
        description: "ジュース代",
        isAllMembers: true,
        sharePlayerIds: ALL_PLAYERS,
      },
    ];

    const balance = calcExpenseBalance(expenses, ALL_PLAYERS);

    // C paid 4000, each person owes 1000
    // C: +4000 - 1000 = +3000 (net credit)
    // A, B, D: -1000 each
    expect(balance.get("C")).toBe(3000);
    expect(balance.get("A")).toBe(-1000);
    expect(balance.get("B")).toBe(-1000);
    expect(balance.get("D")).toBe(-1000);

    const total = ALL_PLAYERS.reduce((s, p) => s + (balance.get(p) ?? 0), 0);
    expect(total).toBe(0);
  });

  it("splits expense among specified players only", () => {
    const expenses: Expense[] = [
      {
        id: "1",
        payerId: "A",
        amount: 3000,
        description: "タバコ",
        isAllMembers: false,
        sharePlayerIds: ["A", "B", "C"], // Only 3 people share
      },
    ];

    const balance = calcExpenseBalance(expenses, ALL_PLAYERS);

    // A paid 3000, split among A, B, C (1000 each)
    // A: +3000 - 1000 = +2000
    // B: -1000
    // C: -1000
    // D: 0
    expect(balance.get("A")).toBe(2000);
    expect(balance.get("B")).toBe(-1000);
    expect(balance.get("C")).toBe(-1000);
    expect(balance.get("D")).toBeUndefined();
  });

  it("handles remainder correctly", () => {
    const expenses: Expense[] = [
      {
        id: "1",
        payerId: "A",
        amount: 1001, // 1001 / 4 = 250 remainder 1
        description: null,
        isAllMembers: true,
        sharePlayerIds: ALL_PLAYERS,
      },
    ];

    const balance = calcExpenseBalance(expenses, ALL_PLAYERS);

    // Per person base: 250, remainder 1 -> first person gets 251
    // A: +1001 - 251 = +750
    // B: -250
    // C: -250
    // D: -250
    expect(balance.get("A")).toBe(750);
    expect(balance.get("B")).toBe(-250);
    expect(balance.get("C")).toBe(-250);
    expect(balance.get("D")).toBe(-250);

    const total = ALL_PLAYERS.reduce((s, p) => s + (balance.get(p) ?? 0), 0);
    expect(total).toBe(0);
  });

  it("handles multiple expenses", () => {
    const expenses: Expense[] = [
      {
        id: "1",
        payerId: "A",
        amount: 2000,
        description: null,
        isAllMembers: true,
        sharePlayerIds: ALL_PLAYERS,
      },
      {
        id: "2",
        payerId: "B",
        amount: 1200,
        description: null,
        isAllMembers: true,
        sharePlayerIds: ALL_PLAYERS,
      },
    ];

    const balance = calcExpenseBalance(expenses, ALL_PLAYERS);

    // Expense 1: A pays 2000, each -500
    // A: +2000 - 500 = +1500, B: -500, C: -500, D: -500
    // Expense 2: B pays 1200, each -300
    // A: -300, B: +1200 - 300 = +900, C: -300, D: -300
    // Total: A: +1200, B: +400, C: -800, D: -800
    expect(balance.get("A")).toBe(1200);
    expect(balance.get("B")).toBe(400);
    expect(balance.get("C")).toBe(-800);
    expect(balance.get("D")).toBe(-800);

    const total = ALL_PLAYERS.reduce((s, p) => s + (balance.get(p) ?? 0), 0);
    expect(total).toBe(0);
  });
});
