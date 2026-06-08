import {
  pgTable,
  serial,
  text,
  timestamp,
  integer,
  decimal,
  pgEnum,
  boolean,
  index,
  unique,
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// Enums
export const betStatusEnum = pgEnum('bet_status', [
  'OPEN',
  'ACTIVE',
  'CREATOR_WON',
  'TAKERS_WON',
  'VOID',
]);

// Users table
export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  username: text('username').notNull().unique(),
  password_hash: text('password_hash').notNull(),
  lifetime_wins: decimal('lifetime_wins', { precision: 10, scale: 2 })
    .notNull()
    .default('0'),
  lifetime_losses: decimal('lifetime_losses', { precision: 10, scale: 2 })
    .notNull()
    .default('0'),
  created_at: timestamp('created_at').defaultNow().notNull(),
});

// Bets table
export const bets = pgTable(
  'bets',
  {
    id: serial('id').primaryKey(),
    creator_id: integer('creator_id')
      .notNull()
      .references(() => users.id),
    text_raw: text('text_raw').notNull(),
    condition: text('condition').notNull(),
    wager_amount: decimal('wager_amount', { precision: 10, scale: 2 }).notNull(),
    status: betStatusEnum('status').notNull().default('OPEN'),
    created_at: timestamp('created_at').defaultNow().notNull(),
  },
  (table) => ({
    creatorIdx: index('bet_creator_idx').on(table.creator_id),
    statusIdx: index('bet_status_idx').on(table.status),
  })
);

// Bet takers table (many-to-many with bets and users)
export const betTakers = pgTable(
  'bet_takers',
  {
    id: serial('id').primaryKey(),
    bet_id: integer('bet_id')
      .notNull()
      .references(() => bets.id, { onDelete: 'cascade' }),
    user_id: integer('user_id')
      .notNull()
      .references(() => users.id),
    created_at: timestamp('created_at').defaultNow().notNull(),
  },
  (table) => ({
    betIdx: index('bet_taker_bet_idx').on(table.bet_id),
    userIdx: index('bet_taker_user_idx').on(table.user_id),
  })
);

// Lifetime transactions (permanent audit trail)
export const lifetimeTransactions = pgTable(
  'lifetime_transactions',
  {
    id: serial('id').primaryKey(),
    from_user_id: integer('from_user_id')
      .notNull()
      .references(() => users.id),
    to_user_id: integer('to_user_id')
      .notNull()
      .references(() => users.id),
    amount: decimal('amount', { precision: 10, scale: 2 }).notNull(),
    bet_id: integer('bet_id')
      .notNull()
      .references(() => bets.id),
    created_at: timestamp('created_at').defaultNow().notNull(),
  },
  (table) => ({
    fromUserIdx: index('lifetime_from_user_idx').on(table.from_user_id),
    toUserIdx: index('lifetime_to_user_idx').on(table.to_user_id),
    betIdx: index('lifetime_bet_idx').on(table.bet_id),
  })
);

// Monthly transactions (cleared on monthly reset)
export const monthlyTransactions = pgTable(
  'monthly_transactions',
  {
    id: serial('id').primaryKey(),
    from_user_id: integer('from_user_id')
      .notNull()
      .references(() => users.id),
    to_user_id: integer('to_user_id')
      .notNull()
      .references(() => users.id),
    amount: decimal('amount', { precision: 10, scale: 2 }).notNull(),
    bet_id: integer('bet_id')
      .notNull()
      .references(() => bets.id),
    month_year: text('month_year').notNull(), // Format: "06-2026"
    created_at: timestamp('created_at').defaultNow().notNull(),
  },
  (table) => ({
    fromUserIdx: index('monthly_from_user_idx').on(table.from_user_id),
    toUserIdx: index('monthly_to_user_idx').on(table.to_user_id),
    monthIdx: index('monthly_month_year_idx').on(table.month_year),
  })
);

// Monthly ledger metadata (tracks active period)
export const monthlyLedgerMeta = pgTable('monthly_ledger_meta', {
  id: serial('id').primaryKey(),
  month_year: text('month_year').notNull().unique(), // Format: "06-2026"
  is_active: boolean('is_active').notNull().default(true),
  created_at: timestamp('created_at').defaultNow().notNull(),
});

// Ledger votes (consensus for monthly reset)
export const ledgerVotes = pgTable(
  'ledger_votes',
  {
    id: serial('id').primaryKey(),
    month_year: text('month_year').notNull(),
    user_id: integer('user_id')
      .notNull()
      .references(() => users.id),
    voted_at: timestamp('voted_at').defaultNow().notNull(),
  },
  (table) => ({
    monthUserUnique: unique('ledger_votes_month_user_unique').on(
      table.month_year,
      table.user_id
    ),
    monthIdx: index('ledger_votes_month_idx').on(table.month_year),
    userIdx: index('ledger_votes_user_idx').on(table.user_id),
  })
);

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  createdBets: many(bets),
  betsTaken: many(betTakers),
}));

export const betsRelations = relations(bets, ({ one, many }) => ({
  creator: one(users, {
    fields: [bets.creator_id],
    references: [users.id],
  }),
  takers: many(betTakers),
}));

export const betTakersRelations = relations(betTakers, ({ one }) => ({
  bet: one(bets, {
    fields: [betTakers.bet_id],
    references: [bets.id],
  }),
  user: one(users, {
    fields: [betTakers.user_id],
    references: [users.id],
  }),
}));

export const ledgerVotesRelations = relations(ledgerVotes, ({ one }) => ({
  user: one(users, {
    fields: [ledgerVotes.user_id],
    references: [users.id],
  }),
}));

// Type exports for use in API routes
export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type Bet = typeof bets.$inferSelect;
export type NewBet = typeof bets.$inferInsert;
export type BetTaker = typeof betTakers.$inferSelect;
export type NewBetTaker = typeof betTakers.$inferInsert;
export type LifetimeTransaction = typeof lifetimeTransactions.$inferSelect;
export type NewLifetimeTransaction = typeof lifetimeTransactions.$inferInsert;
export type MonthlyTransaction = typeof monthlyTransactions.$inferSelect;
export type NewMonthlyTransaction = typeof monthlyTransactions.$inferInsert;
export type MonthlyLedgerMeta = typeof monthlyLedgerMeta.$inferSelect;
export type LedgerVote = typeof ledgerVotes.$inferSelect;
