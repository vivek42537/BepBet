import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db/client';
import { bets } from '@/lib/db/schema';
import { getSession } from '@/lib/auth/session';
import { parseBetInput } from '@/lib/claude/parser';
import { createBetSchema } from '@/lib/utils/validation';
import { desc } from 'drizzle-orm';

// GET /api/bets - List all bets
export async function GET() {
  try {
    const session = await getSession();
    if (!session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const allBets = await db.query.bets.findMany({
      orderBy: [desc(bets.created_at)],
      limit: 100,
      with: {
        creator: {
          columns: {
            id: true,
            username: true,
          },
        },
        takers: {
          with: {
            user: {
              columns: {
                id: true,
                username: true,
              },
            },
          },
        },
      },
    });

    return NextResponse.json({ bets: allBets });
  } catch (error) {
    console.error('Error fetching bets:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/bets - Create new bet
export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();

    // Validate input
    const result = createBetSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: result.error.issues },
        { status: 400 }
      );
    }

    const { rawInput } = result.data;

    // Parse bet using Claude
    let parsed;
    try {
      parsed = await parseBetInput(rawInput);
    } catch (error: any) {
      return NextResponse.json(
        { error: error.message || 'Failed to parse bet' },
        { status: 400 }
      );
    }

    // Create bet
    const [newBet] = await db
      .insert(bets)
      .values({
        creator_id: session.user.id,
        text_raw: rawInput,
        condition: parsed.condition,
        wager_amount: parsed.amount.toFixed(2),
        status: 'OPEN',
      })
      .returning();

    return NextResponse.json({ success: true, bet: newBet });
  } catch (error) {
    console.error('Error creating bet:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
