import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db/client';
import { bets } from '@/lib/db/schema';
import { getSession } from '@/lib/auth/session';
import { settleBetSchema } from '@/lib/utils/validation';
import {
  isUserBetParticipant,
  getBetWithDetails,
  createTransactionRecords,
} from '@/lib/db/queries';
import { eq } from 'drizzle-orm';

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
    const body = await request.json();

    // Validate input
    const result = settleBetSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: result.error.issues },
        { status: 400 }
      );
    }

    const { outcome } = result.data;

    // Check if user is participant (creator or taker)
    const isParticipant = await isUserBetParticipant(session.user.id, betId);
    if (!isParticipant) {
      return NextResponse.json(
        { error: 'Only bet participants can settle' },
        { status: 403 }
      );
    }

    // Get bet with full details
    const bet = await getBetWithDetails(betId);
    if (!bet) {
      return NextResponse.json({ error: 'Bet not found' }, { status: 404 });
    }

    // Check bet status
    if (bet.status !== 'ACTIVE') {
      if (bet.status === 'OPEN' && bet.takers.length === 0) {
        // Mark as VOID if no takers
        await db.update(bets).set({ status: 'VOID' }).where(eq(bets.id, betId));
        return NextResponse.json({
          success: true,
          message: 'Bet voided (no takers)',
        });
      }

      return NextResponse.json(
        { error: 'Bet is not active' },
        { status: 400 }
      );
    }

    if (bet.takers.length === 0) {
      // Should not happen, but handle it
      await db.update(bets).set({ status: 'VOID' }).where(eq(bets.id, betId));
      return NextResponse.json({
        success: true,
        message: 'Bet voided (no takers)',
      });
    }

    // Create transaction records based on outcome
    const wagerAmount = bet.wager_amount;

    if (outcome === 'CREATOR_WON') {
      // Each taker owes creator
      for (const taker of bet.takers) {
        await createTransactionRecords(
          taker.user_id,
          bet.creator_id,
          wagerAmount,
          betId
        );
      }
    } else {
      // TAKERS_WON: Creator owes each taker
      for (const taker of bet.takers) {
        await createTransactionRecords(
          bet.creator_id,
          taker.user_id,
          wagerAmount,
          betId
        );
      }
    }

    // Update bet status
    await db.update(bets).set({ status: outcome }).where(eq(bets.id, betId));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error settling bet:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
