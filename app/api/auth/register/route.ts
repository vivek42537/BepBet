import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db/client';
import { users } from '@/lib/db/schema';
import { hashPassword } from '@/lib/auth/password';
import { getSession } from '@/lib/auth/session';
import { registerSchema } from '@/lib/utils/validation';
import { eq } from 'drizzle-orm';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate input
    const result = registerSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: result.error.issues },
        { status: 400 }
      );
    }

    const { username, password, groupPasscode } = result.data;

    // Verify group passcode
    if (groupPasscode !== process.env.GROUP_PASSCODE) {
      return NextResponse.json(
        { error: 'Invalid group passcode' },
        { status: 403 }
      );
    }

    // Check if username already exists
    const existingUser = await db
      .select()
      .from(users)
      .where(eq(users.username, username))
      .limit(1);

    if (existingUser.length > 0) {
      return NextResponse.json(
        { error: 'Username already taken' },
        { status: 400 }
      );
    }

    // Hash password and create user
    const passwordHash = await hashPassword(password);

    const [newUser] = await db
      .insert(users)
      .values({
        username,
        password_hash: passwordHash,
      })
      .returning({ id: users.id, username: users.username });

    // Create session
    const session = await getSession();
    session.user = {
      id: newUser.id,
      username: newUser.username,
    };
    await session.save();

    return NextResponse.json({
      success: true,
      user: { id: newUser.id, username: newUser.username },
    });
  } catch (error) {
    console.error('Registration error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
