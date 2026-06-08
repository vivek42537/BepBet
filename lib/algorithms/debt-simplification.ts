interface DebtTransaction {
  from_user_id: number;
  to_user_id: number;
  amount: string; // decimal from database
}

interface SimplifiedDebt {
  from_username: string;
  to_username: string;
  amount: number;
}

/**
 * Simplifies debts using net balance approach
 *
 * Algorithm:
 * 1. Calculate net balance for each user (total owed - total owing)
 * 2. Separate into creditors (positive balance) and debtors (negative balance)
 * 3. Match largest creditor with largest debtor iteratively
 * 4. Continue until all balances are zero
 *
 * Time Complexity: O(n log n) for sorting + O(n) for matching = O(n log n)
 * Space Complexity: O(n) for balance map
 */
export function simplifyDebts(
  debts: DebtTransaction[],
  userMap: Map<number, string>
): SimplifiedDebt[] {
  // Step 1: Calculate net balance for each user
  const balances = new Map<number, number>();

  for (const debt of debts) {
    const amount = parseFloat(debt.amount);
    balances.set(
      debt.from_user_id,
      (balances.get(debt.from_user_id) || 0) - amount
    );
    balances.set(
      debt.to_user_id,
      (balances.get(debt.to_user_id) || 0) + amount
    );
  }

  // Step 2: Separate creditors and debtors
  const creditors: Array<{ id: number; amount: number }> = [];
  const debtors: Array<{ id: number; amount: number }> = [];

  for (const [userId, balance] of balances.entries()) {
    if (balance > 0.01) {
      // Creditor (owed money)
      creditors.push({ id: userId, amount: balance });
    } else if (balance < -0.01) {
      // Debtor (owes money)
      debtors.push({ id: userId, amount: -balance });
    }
  }

  // Sort descending for greedy matching
  creditors.sort((a, b) => b.amount - a.amount);
  debtors.sort((a, b) => b.amount - a.amount);

  // Step 3: Match creditors with debtors
  const simplified: SimplifiedDebt[] = [];
  let i = 0,
    j = 0;

  while (i < creditors.length && j < debtors.length) {
    const creditor = creditors[i];
    const debtor = debtors[j];

    const transferAmount = Math.min(creditor.amount, debtor.amount);

    simplified.push({
      from_username: userMap.get(debtor.id)!,
      to_username: userMap.get(creditor.id)!,
      amount: parseFloat(transferAmount.toFixed(2)),
    });

    creditor.amount -= transferAmount;
    debtor.amount -= transferAmount;

    if (creditor.amount < 0.01) i++;
    if (debtor.amount < 0.01) j++;
  }

  return simplified;
}
