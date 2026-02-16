import { describe, it, expect } from "vitest";
import { calcSettlement, generateLineText } from "../settlement";
import type { SessionPlayer, Expense, RuleSet } from "../types";
import { DEFAULT_RULE_SET } from "../types";

const players: SessionPlayer[] = [
  { id: "A", displayName: "田中", seatOrder: 1, userId: null, chipCount: null },
  { id: "B", displayName: "佐藤", seatOrder: 2, userId: null, chipCount: null },
  { id: "C", displayName: "鈴木", seatOrder: 3, userId: null, chipCount: null },
  { id: "D", displayName: "高橋", seatOrder: 4, userId: null, chipCount: null },
];

const rules: RuleSet = DEFAULT_RULE_SET;

describe("calcSettlement", () => {
  it("Scenario 1: 2 hanchan, no chips, no expenses", () => {
    const hanchanInputs = [
      {
        hanchanId: "h1",
        seq: 1,
        scores: [
          { playerId: "A", seatOrder: 1, rawScore: 45000 },
          { playerId: "B", seatOrder: 2, rawScore: 28000 },
          { playerId: "C", seatOrder: 3, rawScore: 15000 },
          { playerId: "D", seatOrder: 4, rawScore: 12000 },
        ],
      },
      {
        hanchanId: "h2",
        seq: 2,
        scores: [
          { playerId: "A", seatOrder: 1, rawScore: 10000 },
          { playerId: "B", seatOrder: 2, rawScore: 35000 },
          { playerId: "C", seatOrder: 3, rawScore: 30000 },
          { playerId: "D", seatOrder: 4, rawScore: 25000 },
        ],
      },
    ];

    const result = calcSettlement(hanchanInputs, [], players, rules);

    expect(result.hasUnconfirmed).toBe(false);

    // mahjongPoints should sum to 0
    const totalPts = result.playerBalances.reduce(
      (s, p) => s + p.mahjongPoints,
      0
    );
    expect(totalPts).toBe(0);

    // totalYen should sum to 0
    const totalYen = result.playerBalances.reduce(
      (s, p) => s + p.totalYen,
      0
    );
    expect(totalYen).toBe(0);

    // Transfers should exist
    expect(result.transfers.length).toBeGreaterThan(0);
  });

  it("Scenario 2: score mismatch flags unconfirmed", () => {
    const hanchanInputs = [
      {
        hanchanId: "h1",
        seq: 1,
        scores: [
          { playerId: "A", seatOrder: 1, rawScore: 45000 },
          { playerId: "B", seatOrder: 2, rawScore: 28000 },
          { playerId: "C", seatOrder: 3, rawScore: 15000 },
          { playerId: "D", seatOrder: 4, rawScore: 13000 }, // Sum = 101000
        ],
      },
    ];

    const result = calcSettlement(hanchanInputs, [], players, rules);
    expect(result.hasUnconfirmed).toBe(true);

    // Unconfirmed hanchan should NOT be included in points or yen
    result.playerBalances.forEach((pb) => {
      expect(pb.mahjongPoints).toBe(0);
      expect(pb.mahjongYen).toBe(0);
    });
  });

  it("Scenario 3: chips + expenses included in settlement", () => {
    const hanchanInputs = [
      {
        hanchanId: "h1",
        seq: 1,
        scores: [
          { playerId: "A", seatOrder: 1, rawScore: 45000 },
          { playerId: "B", seatOrder: 2, rawScore: 28000 },
          { playerId: "C", seatOrder: 3, rawScore: 15000 },
          { playerId: "D", seatOrder: 4, rawScore: 12000 },
        ],
      },
    ];

    // Players with chip counts: startingChips=0, so chipCount = net change
    // A lost 3 chips, B gained 3 chips
    const playersWithChips: SessionPlayer[] = [
      { id: "A", displayName: "田中", seatOrder: 1, userId: null, chipCount: -3 },
      { id: "B", displayName: "佐藤", seatOrder: 2, userId: null, chipCount: 3 },
      { id: "C", displayName: "鈴木", seatOrder: 3, userId: null, chipCount: 0 },
      { id: "D", displayName: "高橋", seatOrder: 4, userId: null, chipCount: 0 },
    ];

    const expenses: Expense[] = [
      {
        id: "e1",
        payerId: "C",
        amount: 4000,
        description: "ジュース代",
        isAllMembers: true,
        sharePlayerIds: ["A", "B", "C", "D"],
      },
    ];

    const result = calcSettlement(
      hanchanInputs,
      expenses,
      playersWithChips,
      rules
    );

    expect(result.hasUnconfirmed).toBe(false);

    const pA = result.playerBalances.find((p) => p.playerId === "A")!;
    const pB = result.playerBalances.find((p) => p.playerId === "B")!;
    const pC = result.playerBalances.find((p) => p.playerId === "C")!;

    // A: points=45, mahjongYen=4500, chip=(-3)*500=-1500, expense=-1000
    expect(pA.mahjongPoints).toBe(45);
    expect(pA.mahjongYen).toBe(4500);
    expect(pA.chipYen).toBe(-1500);
    expect(pA.expenseYen).toBe(-1000);

    // B: points=3, mahjongYen=300, chip=(+3)*500=+1500, expense=-1000
    expect(pB.mahjongPoints).toBe(3);
    expect(pB.mahjongYen).toBe(300);
    expect(pB.chipYen).toBe(1500);
    expect(pB.expenseYen).toBe(-1000);

    // C: points=-20, mahjongYen=-2000, chip=0, expense=+3000
    expect(pC.mahjongPoints).toBe(-20);
    expect(pC.mahjongYen).toBe(-2000);
    expect(pC.chipYen).toBe(0);
    expect(pC.expenseYen).toBe(3000);

    // Total should be 0
    const total = result.playerBalances.reduce((s, p) => s + p.totalYen, 0);
    expect(total).toBe(0);
  });

  it("chips with 20-chip start mode", () => {
    const rulesWithChips: RuleSet = { ...rules, startingChips: 20, chipRate: 500 };

    // Player A ended with 23 chips (+3), B with 17 (-3)
    const playersWithChips: SessionPlayer[] = [
      { id: "A", displayName: "田中", seatOrder: 1, userId: null, chipCount: 23 },
      { id: "B", displayName: "佐藤", seatOrder: 2, userId: null, chipCount: 17 },
      { id: "C", displayName: "鈴木", seatOrder: 3, userId: null, chipCount: 22 },
      { id: "D", displayName: "高橋", seatOrder: 4, userId: null, chipCount: 18 },
    ];

    const hanchanInputs = [
      {
        hanchanId: "h1",
        seq: 1,
        scores: [
          { playerId: "A", seatOrder: 1, rawScore: 25000 },
          { playerId: "B", seatOrder: 2, rawScore: 25000 },
          { playerId: "C", seatOrder: 3, rawScore: 25000 },
          { playerId: "D", seatOrder: 4, rawScore: 25000 },
        ],
      },
    ];

    const result = calcSettlement(hanchanInputs, [], playersWithChips, rulesWithChips);

    const pA = result.playerBalances.find((p) => p.playerId === "A")!;
    const pB = result.playerBalances.find((p) => p.playerId === "B")!;

    expect(pA.chipYen).toBe(1500);  // (23-20) × 500
    expect(pB.chipYen).toBe(-1500); // (17-20) × 500

    // Chip sum should be 0 (balanced)
    const chipTotal = result.playerBalances.reduce((s, p) => s + p.chipYen, 0);
    expect(chipTotal).toBe(0);
  });

  it("null chipCount treated as 0 net", () => {
    const hanchanInputs = [
      {
        hanchanId: "h1",
        seq: 1,
        scores: [
          { playerId: "A", seatOrder: 1, rawScore: 25000 },
          { playerId: "B", seatOrder: 2, rawScore: 25000 },
          { playerId: "C", seatOrder: 3, rawScore: 25000 },
          { playerId: "D", seatOrder: 4, rawScore: 25000 },
        ],
      },
    ];

    // chipCount null = not entered = 0 net
    const result = calcSettlement(hanchanInputs, [], players, rules);

    result.playerBalances.forEach((pb) => {
      expect(pb.chipYen).toBe(0);
    });
  });

  it("yen rounding happens once on aggregated points", () => {
    const tengo: RuleSet = { ...rules, rate: 50, roundingUnit: 100 };
    const hanchanInputs = [
      {
        hanchanId: "h1",
        seq: 1,
        scores: [
          { playerId: "A", seatOrder: 1, rawScore: 45000 },
          { playerId: "B", seatOrder: 2, rawScore: 28000 },
          { playerId: "C", seatOrder: 3, rawScore: 15000 },
          { playerId: "D", seatOrder: 4, rawScore: 12000 },
        ],
      },
    ];

    const result = calcSettlement(hanchanInputs, [], players, tengo);
    const pA = result.playerBalances.find((p) => p.playerId === "A")!;

    // A: points = 45, mahjongYen = roundToUnit(45 * 50, 100) = roundToUnit(2250, 100) = 2300
    expect(pA.mahjongPoints).toBe(45);
    expect(pA.mahjongYen).toBe(2300);
  });

  it("generates LINE text correctly", () => {
    const hanchanInputs = [
      {
        hanchanId: "h1",
        seq: 1,
        scores: [
          { playerId: "A", seatOrder: 1, rawScore: 45000 },
          { playerId: "B", seatOrder: 2, rawScore: 28000 },
          { playerId: "C", seatOrder: 3, rawScore: 15000 },
          { playerId: "D", seatOrder: 4, rawScore: 12000 },
        ],
      },
    ];

    const result = calcSettlement(hanchanInputs, [], players, rules);
    const text = generateLineText(result, "テスト対局");

    expect(text).toContain("【麻雀精算】テスト対局");
    expect(text).toContain("🀄 収支");
    expect(text).toContain("田中");
    expect(text).toContain("+45p");
    expect(text).toContain("💰 送金");
    expect(text).toContain("→");
  });
});
