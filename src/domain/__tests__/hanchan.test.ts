import { describe, it, expect } from "vitest";
import { calcHanchanResult, roundToUnit } from "../hanchan";
import type { RuleSet, PlayerScore } from "../types";
import { DEFAULT_RULE_SET } from "../types";

describe("roundToUnit", () => {
  it("rounds to nearest 100", () => {
    expect(roundToUnit(1250, 100)).toBe(1300);
    expect(roundToUnit(1249, 100)).toBe(1200);
    expect(roundToUnit(1200, 100)).toBe(1200);
    expect(roundToUnit(-1250, 100)).toBe(-1200);
    // JS Math.round rounds -13.5 to -13 (towards +infinity)
    expect(roundToUnit(-1350, 100)).toBe(-1300);
  });

  it("rounds to nearest 1000", () => {
    expect(roundToUnit(1500, 1000)).toBe(2000);
    expect(roundToUnit(1499, 1000)).toBe(1000);
  });

  it("rounds to nearest 1 (no rounding)", () => {
    expect(roundToUnit(1234, 1)).toBe(1234);
  });
});

describe("calcHanchanResult", () => {
  const rules: RuleSet = DEFAULT_RULE_SET;

  it("calculates a standard hanchan with confirmed scores", () => {
    // Scenario: standard game, sum = 100000
    const scores: PlayerScore[] = [
      { playerId: "A", seatOrder: 1, rawScore: 45000 },
      { playerId: "B", seatOrder: 2, rawScore: 28000 },
      { playerId: "C", seatOrder: 3, rawScore: 15000 },
      { playerId: "D", seatOrder: 4, rawScore: 12000 },
    ];

    const result = calcHanchanResult("h1", 1, scores, rules);

    expect(result.isConfirmed).toBe(true);
    expect(result.scoreSum).toBe(100000);
    expect(result.expectedSum).toBe(100000);

    // Ranking: A=1st(45000), B=2nd(28000), C=3rd(15000), D=4th(12000)
    const pA = result.playerResults.find((p) => p.playerId === "A")!;
    const pB = result.playerResults.find((p) => p.playerId === "B")!;
    const pC = result.playerResults.find((p) => p.playerId === "C")!;
    const pD = result.playerResults.find((p) => p.playerId === "D")!;

    expect(pA.rank).toBe(1);
    expect(pB.rank).toBe(2);
    expect(pC.rank).toBe(3);
    expect(pD.rank).toBe(4);

    // A: diff = 45000 - 30000 = 15000, oka = 20000, uma = 10000
    // total = 15000 + 20000 + 10000 = 45000
    // yen = 45000 * 100 / 1000 = 4500
    expect(pA.pointDiff).toBe(15000);
    expect(pA.okaAmount).toBe(20000);
    expect(pA.umaAmount).toBe(10000);
    expect(pA.totalPoints).toBe(45000);
    expect(pA.yenRounded).toBe(4500);

    // B: diff = -2000, oka = 0, uma = 5000
    // total = -2000 + 0 + 5000 = 3000
    // yen = 3000 * 100 / 1000 = 300
    expect(pB.pointDiff).toBe(-2000);
    expect(pB.okaAmount).toBe(0);
    expect(pB.umaAmount).toBe(5000);
    expect(pB.totalPoints).toBe(3000);
    expect(pB.yenRounded).toBe(300);

    // C: diff = -15000, oka = 0, uma = -5000
    // total = -15000 + 0 + (-5000) = -20000
    // yen = -20000 * 100 / 1000 = -2000
    expect(pC.totalPoints).toBe(-20000);
    expect(pC.yenRounded).toBe(-2000);

    // D: diff = -18000, oka = 0, uma = -10000
    // total = -18000 + 0 + (-10000) = -28000
    // yen = -28000 * 100 / 1000 = -2800
    expect(pD.totalPoints).toBe(-28000);
    expect(pD.yenRounded).toBe(-2800);

    // Sum of yen should be 0
    const totalYen = result.playerResults.reduce((s, p) => s + p.yenRounded, 0);
    expect(totalYen).toBe(0);
  });

  it("detects unconfirmed hanchan when score sum is wrong", () => {
    const scores: PlayerScore[] = [
      { playerId: "A", seatOrder: 1, rawScore: 45000 },
      { playerId: "B", seatOrder: 2, rawScore: 28000 },
      { playerId: "C", seatOrder: 3, rawScore: 15000 },
      { playerId: "D", seatOrder: 4, rawScore: 13000 }, // sum = 101000
    ];

    const result = calcHanchanResult("h1", 1, scores, rules);
    expect(result.isConfirmed).toBe(false);
    expect(result.scoreSum).toBe(101000);
  });

  it("breaks ties by seat order", () => {
    const scores: PlayerScore[] = [
      { playerId: "A", seatOrder: 1, rawScore: 25000 },
      { playerId: "B", seatOrder: 2, rawScore: 25000 },
      { playerId: "C", seatOrder: 3, rawScore: 25000 },
      { playerId: "D", seatOrder: 4, rawScore: 25000 },
    ];

    const result = calcHanchanResult("h1", 1, scores, rules);
    expect(result.isConfirmed).toBe(true);

    // Seat order determines rank when scores are equal
    expect(result.playerResults[0].playerId).toBe("A");
    expect(result.playerResults[0].rank).toBe(1);
    expect(result.playerResults[1].playerId).toBe("B");
    expect(result.playerResults[1].rank).toBe(2);
  });

  it("handles oka_type none", () => {
    const rulesNoOka: RuleSet = { ...rules, okaType: "none" };
    const scores: PlayerScore[] = [
      { playerId: "A", seatOrder: 1, rawScore: 45000 },
      { playerId: "B", seatOrder: 2, rawScore: 28000 },
      { playerId: "C", seatOrder: 3, rawScore: 15000 },
      { playerId: "D", seatOrder: 4, rawScore: 12000 },
    ];

    const result = calcHanchanResult("h1", 1, scores, rulesNoOka);
    const pA = result.playerResults.find((p) => p.playerId === "A")!;

    // No oka: A gets diff + uma only
    expect(pA.okaAmount).toBe(0);
    expect(pA.totalPoints).toBe(15000 + 0 + 10000);
  });

  it("works with テンゴ rate", () => {
    const tengo: RuleSet = { ...rules, rate: 50 }; // 50 yen per 1000 points
    const scores: PlayerScore[] = [
      { playerId: "A", seatOrder: 1, rawScore: 45000 },
      { playerId: "B", seatOrder: 2, rawScore: 28000 },
      { playerId: "C", seatOrder: 3, rawScore: 15000 },
      { playerId: "D", seatOrder: 4, rawScore: 12000 },
    ];

    const result = calcHanchanResult("h1", 1, scores, tengo);
    const pA = result.playerResults.find((p) => p.playerId === "A")!;

    // total = 45000 points, yen = 45000 * 50 / 1000 = 2250
    expect(pA.yenRounded).toBe(2300); // rounded to 100
  });
});
