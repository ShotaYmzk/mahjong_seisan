import type { Expense } from "./types";

/**
 * Calculate net expense balance for each player.
 *
 * For each expense:
 * - The payer paid the full amount
 * - Targets split it evenly
 * - Payer's net = amount - (amount / numTargets) if payer is a target, else = amount
 * - Each target's net = -(amount / numTargets)
 *
 * Remainder handling: integer division remainder is distributed
 * 1 yen each to the first N targets (by array order).
 *
 * Returns: Map<playerId, net yen from expenses>
 */
export function calcExpenseBalance(
  expenses: Expense[],
  allPlayerIds: string[]
): Map<string, number> {
  const balance = new Map<string, number>();

  for (const expense of expenses) {
    const targets = expense.isAllMembers
      ? allPlayerIds
      : expense.sharePlayerIds;

    if (targets.length === 0) continue;

    const perPerson = Math.floor(expense.amount / targets.length);
    const remainder = expense.amount - perPerson * targets.length;

    // Payer gets credited the full amount
    balance.set(
      expense.payerId,
      (balance.get(expense.payerId) ?? 0) + expense.amount
    );

    // Each target is debited their share
    for (let i = 0; i < targets.length; i++) {
      const share = perPerson + (i < remainder ? 1 : 0);
      balance.set(targets[i], (balance.get(targets[i]) ?? 0) - share);
    }
  }

  return balance;
}
