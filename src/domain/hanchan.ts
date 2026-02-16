import type {
  RuleSet,
  PlayerScore,
  HanchanResult,
  HanchanPlayerResult,
  TobiEvent,
} from "./types";

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
 * @param tobiBusters - Map of bustedPlayerId -> busterPlayerId (for manual receiver mode)
 */
export function calcHanchanResult(
  hanchanId: string,
  seq: number,
  scores: PlayerScore[],
  rules: RuleSet,
  tobiBusters?: Map<string, string>
): HanchanResult {
  const pc = rules.playerCount;
  const expectedSum = rules.startingPoints * pc;
  const scoreSum = scores.reduce((sum, s) => sum + s.rawScore, 0);
  const isConfirmed = scoreSum === expectedSum;

  const ranked = rankPlayers(scores);
  const umaValues =
    pc === 3
      ? [rules.uma1, rules.uma2, rules.uma3]
      : [rules.uma1, rules.uma2, rules.uma3, rules.uma4];

  const okaPool =
    rules.okaType === "winner_take_all"
      ? (rules.returnPoints - rules.startingPoints) * pc
      : 0;

  // Base calculation (before tobi)
  const playerResults: HanchanPlayerResult[] = ranked.map((player, index) => {
    const rank = index + 1;
    const pointDiff = player.rawScore - rules.returnPoints;
    const okaAmount = rank === 1 ? okaPool : 0;
    const umaAmount = umaValues[index] * 1000;
    const totalPoints = pointDiff + okaAmount + umaAmount;
    const isTobi = player.rawScore <= 0;

    return {
      playerId: player.playerId,
      rank,
      rawScore: player.rawScore,
      pointDiff,
      okaAmount,
      umaAmount,
      totalPoints,
      points: totalPoints / 1000,
      isTobi,
      tobiBonusPoints: 0,
    };
  });

  // Apply tobi bonus
  const tobiEvents: TobiEvent[] = [];

  if (rules.tobiBonusEnabled) {
    const topPlayerId = playerResults[0]?.playerId;

    for (const pr of playerResults) {
      if (!pr.isTobi) continue;

      let receiverId: string | undefined;

      if (rules.tobiReceiverType === "top") {
        receiverId = topPlayerId;
      } else if (rules.tobiReceiverType === "manual" && tobiBusters) {
        receiverId = tobiBusters.get(pr.playerId);
      }

      if (!receiverId || receiverId === pr.playerId) continue;

      // Apply point bonus
      if (rules.tobiBonusPoints > 0) {
        pr.tobiBonusPoints = -rules.tobiBonusPoints;
        pr.points -= rules.tobiBonusPoints;

        const receiver = playerResults.find((r) => r.playerId === receiverId);
        if (receiver) {
          receiver.tobiBonusPoints += rules.tobiBonusPoints;
          receiver.points += rules.tobiBonusPoints;
        }
      }

      // Record chip bonus (handled in settlement)
      if (rules.tobiBonusChips > 0) {
        tobiEvents.push({
          bustedPlayerId: pr.playerId,
          receiverPlayerId: receiverId,
          bonusChips: rules.tobiBonusChips,
        });
      }
    }
  }

  return {
    hanchanId,
    seq,
    isConfirmed,
    scoreSum,
    expectedSum,
    playerResults,
    tobiEvents,
  };
}
