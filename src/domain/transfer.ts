import type { Transfer, SessionPlayer } from "./types";

/**
 * Minimize the number of transfers to settle all balances.
 * Greedy approach: match the largest debtor with the largest creditor.
 *
 * @param balances Array of { playerId, amount } where positive = receives, negative = pays
 * @param players Player lookup for display names
 */
export function calcTransfers(
  balances: { playerId: string; amount: number }[],
  players: SessionPlayer[]
): Transfer[] {
  const playerMap = new Map(players.map((p) => [p.id, p]));
  const transfers: Transfer[] = [];

  // Split into payers (negative) and receivers (positive)
  const payers = balances
    .filter((b) => b.amount < 0)
    .map((b) => ({ ...b, amount: Math.abs(b.amount) }))
    .sort((a, b) => b.amount - a.amount);

  const receivers = balances
    .filter((b) => b.amount > 0)
    .map((b) => ({ ...b }))
    .sort((a, b) => b.amount - a.amount);

  let pi = 0;
  let ri = 0;

  while (pi < payers.length && ri < receivers.length) {
    const payer = payers[pi];
    const receiver = receivers[ri];
    const transferAmount = Math.min(payer.amount, receiver.amount);

    if (transferAmount > 0) {
      transfers.push({
        fromPlayerId: payer.playerId,
        fromName: playerMap.get(payer.playerId)?.displayName ?? "?",
        toPlayerId: receiver.playerId,
        toName: playerMap.get(receiver.playerId)?.displayName ?? "?",
        amount: transferAmount,
      });
    }

    payer.amount -= transferAmount;
    receiver.amount -= transferAmount;

    if (payer.amount === 0) pi++;
    if (receiver.amount === 0) ri++;
  }

  return transfers;
}
