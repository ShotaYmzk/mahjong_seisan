import { describe, it, expect } from "vitest";
import { calcSettlement, generateLineText } from "../settlement";
import type { SessionPlayer, ChipEvent, Expense, RuleSet } from "../types";
import { DEFAULT_RULE_SET } from "../types";

const players: SessionPlayer[] = [
  { id: "A", displayName: "田中", seatOrder: 1, userId: null },
  { id: "B", displayName: "佐藤", seatOrder: 2, userId: null },
  { id: "C", displayName: "鈴木", seatOrder: 3, userId: null },
  { id: "D", displayName: "高橋", seatOrder: 4, userId: null },
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

    const result = calcSettlement(hanchanInputs, [], [], players, rules);

    expect(result.hasUnconfirmed).toBe(false);

    // Verify total balances sum to 0
    const total = result.playerBalances.reduce((s, p) => s + p.totalYen, 0);
    expect(total).toBe(0);

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

    const result = calcSettlement(hanchanInputs, [], [], players, rules);
    expect(result.hasUnconfirmed).toBe(true);

    // Unconfirmed hanchan should NOT be included in mahjong yen
    result.playerBalances.forEach((pb) => {
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

    const chipEvents: ChipEvent[] = [
      { id: "c1", fromPlayerId: "A", toPlayerId: "B", quantity: 3 },
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
      chipEvents,
      expenses,
      players,
      rules
    );

    expect(result.hasUnconfirmed).toBe(false);

    const pA = result.playerBalances.find((p) => p.playerId === "A")!;
    const pB = result.playerBalances.find((p) => p.playerId === "B")!;
    const pC = result.playerBalances.find((p) => p.playerId === "C")!;

    // A: mahjong +4500, chip -1500, expense -1000 = +2000
    expect(pA.chipYen).toBe(-1500);
    expect(pA.expenseYen).toBe(-1000);

    // B: mahjong +300, chip +1500, expense -1000 = +800
    expect(pB.chipYen).toBe(1500);
    expect(pB.expenseYen).toBe(-1000);

    // C: mahjong -2000, chip 0, expense +3000 = +1000
    expect(pC.chipYen).toBe(0);
    expect(pC.expenseYen).toBe(3000);

    // Total should be 0
    const total = result.playerBalances.reduce((s, p) => s + p.totalYen, 0);
    expect(total).toBe(0);
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

    const result = calcSettlement(hanchanInputs, [], [], players, rules);
    const text = generateLineText(result, "テスト対局");

    expect(text).toContain("【麻雀精算】テスト対局");
    expect(text).toContain("🀄 収支");
    expect(text).toContain("田中");
    expect(text).toContain("💰 送金");
    expect(text).toContain("→");
  });
});
