import { NextResponse } from 'next/server';
import { db } from '@/lib/db/client';
import { monthlyTransactions, users } from '@/lib/db/schema';
import { getSession } from '@/lib/auth/session';
import { getCurrentMonthYear } from '@/lib/utils/format';
import { simplifyDebts } from '@/lib/algorithms/debt-simplification';
import { eq } from 'drizzle-orm';

export async function GET() {
  try {
    const session = await getSession();
    if (!session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const currentMonth = getCurrentMonthYear();

    // Get all monthly transactions
    const transactions = await db
      .select()
      .from(monthlyTransactions)
      .where(eq(monthlyTransactions.month_year, currentMonth));

    // Get all users
    const allUsers = await db.select().from(users);
    const userMap = new Map(allUsers.map((u) => [u.id, u.username]));

    // Simplify debts
    const simplified = simplifyDebts(transactions, userMap);

    return NextResponse.json({
      simplified,
      month: currentMonth,
    });
  } catch (error) {
    console.error('Error calculating simplified debts:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
