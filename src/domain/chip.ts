import type { SessionPlayer } from "./types";

/**
 * Calculate net chip yen for each player.
 *
 * Formula: (chipCount - startingChips) × chipRate
 *
 * Players with chipCount === null (not yet entered) are treated as 0 net.
 * Returns: Map<playerId, net yen from chips>
 */
export function calcChipBalance(
  players: SessionPlayer[],
  startingChips: number,
  chipRate: number
): Map<string, number> {
  const balance = new Map<string, number>();

  for (const player of players) {
    if (player.chipCount !== null) {
      const netChips = player.chipCount - startingChips;
      balance.set(player.id, netChips * chipRate);
    } else {
      balance.set(player.id, 0);
    }
  }

  return balance;
}
