import { NextResponse } from 'next/server';
import { db } from '@/lib/db/client';
import { monthlyTransactions, users } from '@/lib/db/schema';
import { getSession } from '@/lib/auth/session';
import { getCurrentMonthYear } from '@/lib/utils/format';
import { eq } from 'drizzle-orm';

export async function GET() {
  try {
    const session = await getSession();
    if (!session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const currentMonth = getCurrentMonthYear();

    const transactions = await db
      .select({
        id: monthlyTransactions.id,
        from_user_id: monthlyTransactions.from_user_id,
        to_user_id: monthlyTransactions.to_user_id,
        amount: monthlyTransactions.amount,
        bet_id: monthlyTransactions.bet_id,
        created_at: monthlyTransactions.created_at,
        from_username: users.username,
      })
      .from(monthlyTransactions)
      .leftJoin(users, eq(monthlyTransactions.from_user_id, users.id))
      .where(eq(monthlyTransactions.month_year, currentMonth));

    // Get "to" usernames separately
    const enrichedTransactions = await Promise.all(
      transactions.map(async (tx) => {
        const [toUser] = await db
          .select({ username: users.username })
          .from(users)
          .where(eq(users.id, tx.to_user_id))
          .limit(1);

        return {
          ...tx,
          to_username: toUser?.username || 'Unknown',
        };
      })
    );

    return NextResponse.json({
      transactions: enrichedTransactions,
      month: currentMonth,
    });
  } catch (error) {
    console.error('Error fetching monthly transactions:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
