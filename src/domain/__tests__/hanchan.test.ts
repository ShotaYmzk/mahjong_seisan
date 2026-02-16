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
    // points = 45000 / 1000 = 45
    expect(pA.pointDiff).toBe(15000);
    expect(pA.okaAmount).toBe(20000);
    expect(pA.umaAmount).toBe(10000);
    expect(pA.totalPoints).toBe(45000);
    expect(pA.points).toBe(45);

    // B: diff = -2000, oka = 0, uma = 5000
    // total = 3000, points = 3
    expect(pB.pointDiff).toBe(-2000);
    expect(pB.okaAmount).toBe(0);
    expect(pB.umaAmount).toBe(5000);
    expect(pB.totalPoints).toBe(3000);
    expect(pB.points).toBe(3);

    // C: diff = -15000, oka = 0, uma = -5000
    // total = -20000, points = -20
    expect(pC.totalPoints).toBe(-20000);
    expect(pC.points).toBe(-20);

    // D: diff = -18000, oka = 0, uma = -10000
    // total = -28000, points = -28
    expect(pD.totalPoints).toBe(-28000);
    expect(pD.points).toBe(-28);

    // Sum of points should be 0
    const totalPts = result.playerResults.reduce((s, p) => s + p.points, 0);
    expect(totalPts).toBe(0);
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
    expect(pA.points).toBe(25);
  });

  it("returns correct points for テンゴ rate (points unaffected by rate)", () => {
    const tengo: RuleSet = { ...rules, rate: 50 }; // 50 yen per point
    const scores: PlayerScore[] = [
      { playerId: "A", seatOrder: 1, rawScore: 45000 },
      { playerId: "B", seatOrder: 2, rawScore: 28000 },
      { playerId: "C", seatOrder: 3, rawScore: 15000 },
      { playerId: "D", seatOrder: 4, rawScore: 12000 },
    ];

    const result = calcHanchanResult("h1", 1, scores, tengo);
    const pA = result.playerResults.find((p) => p.playerId === "A")!;

    // Points are independent of rate
    // total = 45000, points = 45
    expect(pA.points).toBe(45);
  });

  it("detects tobi (busted player with score <= 0)", () => {
    const scores: PlayerScore[] = [
      { playerId: "A", seatOrder: 1, rawScore: 60000 },
      { playerId: "B", seatOrder: 2, rawScore: 30000 },
      { playerId: "C", seatOrder: 3, rawScore: 10000 },
      { playerId: "D", seatOrder: 4, rawScore: 0 },
    ];

    const result = calcHanchanResult("h1", 1, scores, rules);
    const pD = result.playerResults.find((p) => p.playerId === "D")!;
    expect(pD.isTobi).toBe(true);
    expect(pD.tobiBonusPoints).toBe(0); // No tobi bonus in default rules
  });

  it("applies tobi bonus points (top receiver)", () => {
    const tobiRules: RuleSet = {
      ...rules,
      tobiBonusEnabled: true,
      tobiBonusPoints: 10,
      tobiBonusChips: 0,
      tobiReceiverType: "top",
    };
    const scores: PlayerScore[] = [
      { playerId: "A", seatOrder: 1, rawScore: 60000 },
      { playerId: "B", seatOrder: 2, rawScore: 30000 },
      { playerId: "C", seatOrder: 3, rawScore: 10000 },
      { playerId: "D", seatOrder: 4, rawScore: 0 },
    ];

    const result = calcHanchanResult("h1", 1, scores, tobiRules);
    const pA = result.playerResults.find((p) => p.playerId === "A")!;
    const pD = result.playerResults.find((p) => p.playerId === "D")!;

    // D flew: -10p penalty, A (top) receives +10p
    expect(pD.isTobi).toBe(true);
    expect(pD.tobiBonusPoints).toBe(-10);
    expect(pA.tobiBonusPoints).toBe(10);

    // Sum of points should still be 0
    const totalPts = result.playerResults.reduce((s, p) => s + p.points, 0);
    expect(totalPts).toBe(0);
  });

  it("applies tobi bonus chips (creates tobiEvents)", () => {
    const tobiRules: RuleSet = {
      ...rules,
      tobiBonusEnabled: true,
      tobiBonusPoints: 0,
      tobiBonusChips: 2,
      tobiReceiverType: "top",
    };
    const scores: PlayerScore[] = [
      { playerId: "A", seatOrder: 1, rawScore: 60000 },
      { playerId: "B", seatOrder: 2, rawScore: 30000 },
      { playerId: "C", seatOrder: 3, rawScore: 10000 },
      { playerId: "D", seatOrder: 4, rawScore: 0 },
    ];

    const result = calcHanchanResult("h1", 1, scores, tobiRules);
    expect(result.tobiEvents).toHaveLength(1);
    expect(result.tobiEvents[0].bustedPlayerId).toBe("D");
    expect(result.tobiEvents[0].receiverPlayerId).toBe("A");
    expect(result.tobiEvents[0].bonusChips).toBe(2);
  });

  it("applies tobi bonus with manual receiver", () => {
    const tobiRules: RuleSet = {
      ...rules,
      tobiBonusEnabled: true,
      tobiBonusPoints: 10,
      tobiBonusChips: 1,
      tobiReceiverType: "manual",
    };
    const scores: PlayerScore[] = [
      { playerId: "A", seatOrder: 1, rawScore: 60000 },
      { playerId: "B", seatOrder: 2, rawScore: 30000 },
      { playerId: "C", seatOrder: 3, rawScore: 10000 },
      { playerId: "D", seatOrder: 4, rawScore: 0 },
    ];

    // B busted D
    const tobiBusters = new Map([["D", "B"]]);
    const result = calcHanchanResult("h1", 1, scores, tobiRules, tobiBusters);

    const pB = result.playerResults.find((p) => p.playerId === "B")!;
    const pD = result.playerResults.find((p) => p.playerId === "D")!;

    expect(pD.tobiBonusPoints).toBe(-10);
    expect(pB.tobiBonusPoints).toBe(10);
    expect(result.tobiEvents[0].receiverPlayerId).toBe("B");
  });
});
