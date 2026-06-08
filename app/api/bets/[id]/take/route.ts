import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db/client';
import { bets, betTakers } from '@/lib/db/schema';
import { getSession } from '@/lib/auth/session';
import { eq, and, sql } from 'drizzle-orm';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const betId = parseInt(id);

    // Check bet exists and is OPEN or ACTIVE
    const [bet] = await db.select().from(bets).where(eq(bets.id, betId)).limit(1);

    if (!bet) {
      return NextResponse.json({ error: 'Bet not found' }, { status: 404 });
    }

    if (bet.creator_id === session.user.id) {
      return NextResponse.json(
        { error: 'Cannot take your own bet' },
        { status: 400 }
      );
    }

    if (bet.status !== 'OPEN' && bet.status !== 'ACTIVE') {
      return NextResponse.json(
        { error: 'Bet is not open for taking' },
        { status: 400 }
      );
    }

    // Check if user already took this bet
    const existing = await db
      .select()
      .from(betTakers)
      .where(
        and(eq(betTakers.bet_id, betId), eq(betTakers.user_id, session.user.id))
      )
      .limit(1);

    if (existing.length > 0) {
      return NextResponse.json(
        { error: 'You already took this bet' },
        { status: 400 }
      );
    }

    // Create bet taker record
    await db.insert(betTakers).values({
      bet_id: betId,
      user_id: session.user.id,
    });

    // Update bet status to ACTIVE if this is the first taker
    const takerCount = await db
      .select({ count: sql<number>`count(*)` })
      .from(betTakers)
      .where(eq(betTakers.bet_id, betId));

    if (takerCount[0].count >= 1 && bet.status === 'OPEN') {
      await db.update(bets).set({ status: 'ACTIVE' }).where(eq(bets.id, betId));
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error taking bet:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
