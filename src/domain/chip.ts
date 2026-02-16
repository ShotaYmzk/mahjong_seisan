import type { ChipEvent } from "./types";

/**
 * Calculate net chip balance for each player.
 * from_player pays quantity * chipRate, to_player receives the same.
 * Returns: Map<playerId, net yen from chips>
 */
export function calcChipBalance(
  events: ChipEvent[],
  chipRate: number
): Map<string, number> {
  const balance = new Map<string, number>();

  for (const event of events) {
    const amount = event.quantity * chipRate;

    balance.set(
      event.fromPlayerId,
      (balance.get(event.fromPlayerId) ?? 0) - amount
    );
    balance.set(
      event.toPlayerId,
      (balance.get(event.toPlayerId) ?? 0) + amount
    );
  }

  return balance;
}
