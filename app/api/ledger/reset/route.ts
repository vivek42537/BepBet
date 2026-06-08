import { NextResponse } from 'next/server';
import { db } from '@/lib/db/client';
import {
  ledgerVotes,
  users,
  monthlyTransactions,
  monthlyLedgerMeta,
} from '@/lib/db/schema';
import { getSession } from '@/lib/auth/session';
import { getCurrentMonthYear } from '@/lib/utils/format';
import { eq, sql } from 'drizzle-orm';

export async function POST() {
  try {
    const session = await getSession();
    if (!session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const currentMonth = getCurrentMonthYear();

    // Count total users
    const totalUsersResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(users);
    const totalUsers = Number(totalUsersResult[0].count);

    // Count votes for current month
    const votesResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(ledgerVotes)
      .where(eq(ledgerVotes.month_year, currentMonth));
    const voteCount = Number(votesResult[0].count);

    // Check if 100% consensus
    if (voteCount < totalUsers) {
      return NextResponse.json(
        {
          error: 'Not all users have voted yet',
          voted: voteCount,
          total: totalUsers,
        },
        { status: 400 }
      );
    }

    // Calculate net balances for each user
    const transactions = await db
      .select()
      .from(monthlyTransactions)
      .where(eq(monthlyTransactions.month_year, currentMonth));

    const balances = new Map<number, number>();

    for (const tx of transactions) {
      const amount = parseFloat(tx.amount);
      balances.set(
        tx.from_user_id,
        (balances.get(tx.from_user_id) || 0) - amount
      );
      balances.set(tx.to_user_id, (balances.get(tx.to_user_id) || 0) + amount);
    }

    // Update lifetime stats for each user
    for (const [userId, balance] of balances.entries()) {
      if (balance > 0) {
        // User won money
        await db
          .update(users)
          .set({
            lifetime_wins: sql`${users.lifetime_wins} + ${balance}`,
          })
          .where(eq(users.id, userId));
      } else if (balance < 0) {
        // User lost money
        await db
          .update(users)
          .set({
            lifetime_losses: sql`${users.lifetime_losses} + ${Math.abs(balance)}`,
          })
          .where(eq(users.id, userId));
      }
    }

    // Delete monthly transactions for current month
    await db
      .delete(monthlyTransactions)
      .where(eq(monthlyTransactions.month_year, currentMonth));

    // Mark current ledger as inactive
    await db
      .update(monthlyLedgerMeta)
      .set({ is_active: false })
      .where(eq(monthlyLedgerMeta.month_year, currentMonth));

    // Clear votes for current month
    await db
      .delete(ledgerVotes)
      .where(eq(ledgerVotes.month_year, currentMonth));

    // Create new month ledger (will be auto-created on next transaction, but we can pre-create)
    const nextMonthDate = new Date();
    nextMonthDate.setMonth(nextMonthDate.getMonth() + 1);
    const nextMonth = `${String(nextMonthDate.getMonth() + 1).padStart(2, '0')}-${nextMonthDate.getFullYear()}`;

    await db.insert(monthlyLedgerMeta).values({
      month_year: nextMonth,
      is_active: true,
    });

    return NextResponse.json({
      success: true,
      message: 'Monthly ledger reset successfully',
    });
  } catch (error) {
    console.error('Error resetting ledger:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
