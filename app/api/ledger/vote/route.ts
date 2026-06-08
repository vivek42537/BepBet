import { NextResponse } from 'next/server';
import { db } from '@/lib/db/client';
import { ledgerVotes } from '@/lib/db/schema';
import { getSession } from '@/lib/auth/session';
import { getCurrentMonthYear } from '@/lib/utils/format';
import { and, eq } from 'drizzle-orm';

export async function POST() {
  try {
    const session = await getSession();
    if (!session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const currentMonth = getCurrentMonthYear();

    // Check if user already voted
    const existingVote = await db
      .select()
      .from(ledgerVotes)
      .where(
        and(
          eq(ledgerVotes.month_year, currentMonth),
          eq(ledgerVotes.user_id, session.user.id)
        )
      )
      .limit(1);

    if (existingVote.length > 0) {
      return NextResponse.json(
        { error: 'You have already voted for this month' },
        { status: 400 }
      );
    }

    // Create vote
    await db.insert(ledgerVotes).values({
      month_year: currentMonth,
      user_id: session.user.id,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error voting:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const session = await getSession();
    if (!session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const currentMonth = getCurrentMonthYear();

    const votes = await db.query.ledgerVotes.findMany({
      where: eq(ledgerVotes.month_year, currentMonth),
      with: {
        user: {
          columns: {
            id: true,
            username: true,
          },
        },
      },
    });

    return NextResponse.json({ votes });
  } catch (error) {
    console.error('Error fetching votes:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
