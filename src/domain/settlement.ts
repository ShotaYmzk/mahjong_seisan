import type {
  RuleSet,
  PlayerScore,
  SessionPlayer,
  Expense,
  Settlement,
  PlayerBalance,
  HanchanResult,
} from "./types";
import { calcHanchanResult, roundToUnit } from "./hanchan";
import { calcChipBalance } from "./chip";
import { calcExpenseBalance } from "./expense";
import { calcTransfers } from "./transfer";

export interface HanchanInput {
  hanchanId: string;
  seq: number;
  scores: PlayerScore[];
  tobiBusters?: Map<string, string>;
}

/**
 * Calculate the full settlement for a session.
 * Aggregates: mahjong results + chips + expenses => final balances + transfers
 *
 * Chips are calculated from each player's ending chip count:
 *   chipYen = (chipCount - startingChips) × chipRate
 * Tobi bonus chips are assumed to be already included in the player's
 * physical chip count at the end of the session.
 */
export function calcSettlement(
  hanchanInputs: HanchanInput[],
  expenses: Expense[],
  players: SessionPlayer[],
  rules: RuleSet
): Settlement {
  const playerIds = players.map((p) => p.id);
  const playerMap = new Map(players.map((p) => [p.id, p]));

  // Calculate each hanchan
  const hanchanResults: HanchanResult[] = hanchanInputs.map((h) =>
    calcHanchanResult(h.hanchanId, h.seq, h.scores, rules, h.tobiBusters)
  );

  const hasUnconfirmed = hanchanResults.some((h) => !h.isConfirmed);

  // Aggregate mahjong points per player (only confirmed hanchan)
  const mahjongPoints = new Map<string, number>();
  for (const result of hanchanResults) {
    if (!result.isConfirmed) continue;
    for (const pr of result.playerResults) {
      mahjongPoints.set(
        pr.playerId,
        (mahjongPoints.get(pr.playerId) ?? 0) + pr.points
      );
    }
  }

  // Chip balance from ending chip counts
  const chipBalance = calcChipBalance(
    players,
    rules.startingChips,
    rules.chipRate
  );

  // Expense balance
  const expenseBalance = calcExpenseBalance(expenses, playerIds);

  // Build player balances (yen conversion happens once here)
  const playerBalances: PlayerBalance[] = playerIds.map((pid) => {
    const pts = mahjongPoints.get(pid) ?? 0;
    const mjYen = roundToUnit(pts * rules.rate, rules.roundingUnit);
    const chip = chipBalance.get(pid) ?? 0;
    const exp = expenseBalance.get(pid) ?? 0;
    return {
      playerId: pid,
      displayName: playerMap.get(pid)?.displayName ?? "?",
      mahjongPoints: pts,
      mahjongYen: mjYen,
      chipYen: chip,
      expenseYen: exp,
      totalYen: mjYen + chip + exp,
    };
  });

  // Calculate optimal transfers
  const transfers = calcTransfers(
    playerBalances.map((pb) => ({ playerId: pb.playerId, amount: pb.totalYen })),
    players
  );

  return {
    hasUnconfirmed,
    playerBalances,
    transfers,
  };
}

/**
 * Generate LINE-friendly copy text for the settlement.
 */
export function generateLineText(
  settlement: Settlement,
  sessionName: string
): string {
  const date = new Date().toLocaleDateString("ja-JP", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });

  const lines: string[] = [];
  lines.push(`【麻雀精算】${sessionName}`);
  lines.push(`${date}`);

  if (settlement.hasUnconfirmed) {
    lines.push("⚠ 未確定の半荘があります");
  }

  lines.push("---");
  lines.push("🀄 収支");

  const sorted = [...settlement.playerBalances].sort(
    (a, b) => b.totalYen - a.totalYen
  );

  for (const pb of sorted) {
    const sign = pb.totalYen >= 0 ? "+" : "";
    const ptSign = pb.mahjongPoints >= 0 ? "+" : "";
    lines.push(
      `  ${pb.displayName}: ${ptSign}${pb.mahjongPoints}p → ${sign}${pb.totalYen.toLocaleString()}円`
    );
  }

  if (settlement.transfers.length > 0) {
    lines.push("---");
    lines.push("💰 送金");
    for (const t of settlement.transfers) {
      lines.push(
        `  ${t.fromName} → ${t.toName}: ${t.amount.toLocaleString()}円`
      );
    }
  }

  return lines.join("\n");
}
