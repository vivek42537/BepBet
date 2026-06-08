import { db } from './client';
import {
  users,
  bets,
  betTakers,
  monthlyLedgerMeta,
  monthlyTransactions,
  lifetimeTransactions,
  NewLifetimeTransaction,
  NewMonthlyTransaction,
} from './schema';
import { eq, and, desc, sql } from 'drizzle-orm';
import { getCurrentMonthYear } from '../utils/format';

// Get or create active monthly ledger
export async function getOrCreateActiveMonth(): Promise<string> {
  const currentMonth = getCurrentMonthYear();

  const existing = await db.query.monthlyLedgerMeta.findFirst({
    where: eq(monthlyLedgerMeta.month_year, currentMonth),
  });

  if (!existing) {
    // Create new month
    await db.insert(monthlyLedgerMeta).values({
      month_year: currentMonth,
      is_active: true,
    });
  }

  return currentMonth;
}

// Check if user is participant in a bet (creator or taker)
export async function isUserBetParticipant(
  userId: number,
  betId: number
): Promise<boolean> {
  const bet = await db.query.bets.findFirst({
    where: eq(bets.id, betId),
  });

  if (!bet) return false;
  if (bet.creator_id === userId) return true;

  const taker = await db.query.betTakers.findFirst({
    where: and(eq(betTakers.bet_id, betId), eq(betTakers.user_id, userId)),
  });

  return !!taker;
}

// Create transaction records (both lifetime and monthly)
export async function createTransactionRecords(
  fromUserId: number,
  toUserId: number,
  amount: string,
  betId: number
): Promise<void> {
  const currentMonth = await getOrCreateActiveMonth();

  // Create lifetime transaction
  await db.insert(lifetimeTransactions).values({
    from_user_id: fromUserId,
    to_user_id: toUserId,
    amount,
    bet_id: betId,
  });

  // Create monthly transaction
  await db.insert(monthlyTransactions).values({
    from_user_id: fromUserId,
    to_user_id: toUserId,
    amount,
    bet_id: betId,
    month_year: currentMonth,
  });
}

// Get bet with full details (creator, takers)
export async function getBetWithDetails(betId: number) {
  const bet = await db.query.bets.findFirst({
    where: eq(bets.id, betId),
    with: {
      creator: true,
      takers: {
        with: {
          user: true,
        },
      },
    },
  });

  return bet;
}
