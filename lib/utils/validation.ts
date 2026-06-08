import { z } from 'zod';

// Authentication schemas
export const registerSchema = z.object({
  username: z.string().min(3).max(20),
  password: z.string().min(6),
  groupPasscode: z.string().min(1),
});

export const loginSchema = z.object({
  username: z.string().min(1),
  password: z.string().min(1),
});

// Bet schemas
export const createBetSchema = z.object({
  rawInput: z.string().min(10).max(500),
});

export const settleBetSchema = z.object({
  outcome: z.enum(['CREATOR_WON', 'TAKERS_WON']),
});
