import type { RuleSet, PlayerScore, HanchanResult, HanchanPlayerResult } from "./types";

/**
 * Round a number to the nearest unit.
 * e.g., roundToUnit(1250, 100) => 1300 (standard rounding)
 */
export function roundToUnit(value: number, unit: number): number {
  if (unit <= 1) return Math.round(value);
  return Math.round(value / unit) * unit;
}

/**
 * Rank players by raw score descending. Ties broken by seat order (lower = higher rank).
 */
function rankPlayers(scores: PlayerScore[]): PlayerScore[] {
  return [...scores].sort((a, b) => {
    if (b.rawScore !== a.rawScore) return b.rawScore - a.rawScore;
    return a.seatOrder - b.seatOrder;
  });
}

/**
 * Calculate the result of a single hanchan (half-round game).
 *
 * Steps:
 * 1. Validate score sum === startingPoints * 4
 * 2. Rank players
 * 3. Compute point diff from returnPoints
 * 4. Apply oka (winner_take_all: pool goes to 1st)
 * 5. Apply uma
 * 6. Convert to yen via rate
 * 7. Round to roundingUnit
 */
export function calcHanchanResult(
  hanchanId: string,
  seq: number,
  scores: PlayerScore[],
  rules: RuleSet
): HanchanResult {
  const expectedSum = rules.startingPoints * 4;
  const scoreSum = scores.reduce((sum, s) => sum + s.rawScore, 0);
  const isConfirmed = scoreSum === expectedSum;

  const ranked = rankPlayers(scores);
  const umaValues = [rules.uma1, rules.uma2, rules.uma3, rules.uma4];

  const okaPool =
    rules.okaType === "winner_take_all"
      ? (rules.returnPoints - rules.startingPoints) * 4
      : 0;

  const playerResults: HanchanPlayerResult[] = ranked.map((player, index) => {
    const rank = index + 1;
    const pointDiff = player.rawScore - rules.returnPoints;
    const okaAmount = rank === 1 ? okaPool : 0;
    const umaAmount = umaValues[index] * 1000;
    const totalPoints = pointDiff + okaAmount + umaAmount;
    const yenAmount = (totalPoints * rules.rate) / 1000;
    const yenRounded = roundToUnit(yenAmount, rules.roundingUnit);

    return {
      playerId: player.playerId,
      rank,
      rawScore: player.rawScore,
      pointDiff,
      okaAmount,
      umaAmount,
      totalPoints,
      yenAmount,
      yenRounded,
    };
  });

  return {
    hanchanId,
    seq,
    isConfirmed,
    scoreSum,
    expectedSum,
    playerResults,
  };
}
