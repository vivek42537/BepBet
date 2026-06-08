-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create enum types
DO $$ BEGIN
    CREATE TYPE bet_status AS ENUM ('active', 'settled');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE transaction_type AS ENUM ('bet_entry', 'bet_payout', 'settlement');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Users table
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    avatar_url TEXT,
    balance NUMERIC(10, 2) DEFAULT 0.00 NOT NULL,
    is_admin BOOLEAN DEFAULT FALSE NOT NULL,
    ready_to_settle BOOLEAN DEFAULT FALSE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Bets table
CREATE TABLE IF NOT EXISTS bets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    creator_id UUID NOT NULL REFERENCES users(id),
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    entry_fee NUMERIC(10, 2) NOT NULL,
    status bet_status DEFAULT 'active' NOT NULL,
    meme_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    settled_at TIMESTAMPTZ,
    settled_by UUID REFERENCES users(id)
);

-- Entries table
CREATE TABLE IF NOT EXISTS entries (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    bet_id UUID NOT NULL REFERENCES bets(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id),
    prediction TEXT NOT NULL,
    amount NUMERIC(10, 2) NOT NULL,
    is_winner BOOLEAN,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Settlements table
CREATE TABLE IF NOT EXISTS settlements (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    settled_at TIMESTAMPTZ DEFAULT NOW()
);

-- Transactions table
CREATE TABLE IF NOT EXISTS transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id),
    amount NUMERIC(10, 2) NOT NULL,
    type transaction_type NOT NULL,
    bet_id UUID REFERENCES bets(id),
    settlement_id UUID REFERENCES settlements(id),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_bets_creator_id ON bets(creator_id);
CREATE INDEX IF NOT EXISTS idx_bets_status ON bets(status);
CREATE INDEX IF NOT EXISTS idx_entries_bet_id ON entries(bet_id);
CREATE INDEX IF NOT EXISTS idx_entries_user_id ON entries(user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_user_id ON transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_bet_id ON transactions(bet_id);

-- Enable Row Level Security
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE bets ENABLE ROW LEVEL SECURITY;
ALTER TABLE entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE settlements ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for users table
CREATE POLICY "Users can view all users" ON users
    FOR SELECT USING (true);

CREATE POLICY "Users can update own profile" ON users
    FOR UPDATE USING (auth.uid()::text = id::text);

CREATE POLICY "Users can insert themselves" ON users
    FOR INSERT WITH CHECK (auth.uid()::text = id::text);

-- RLS Policies for bets table
CREATE POLICY "Anyone can view bets" ON bets
    FOR SELECT USING (true);

CREATE POLICY "Authenticated users can create bets" ON bets
    FOR INSERT WITH CHECK (auth.uid()::text = creator_id::text);

CREATE POLICY "Admins can update bets" ON bets
    FOR UPDATE USING (
        EXISTS (SELECT 1 FROM users WHERE id::text = auth.uid()::text AND is_admin = true)
    );

-- RLS Policies for entries table
CREATE POLICY "Anyone can view entries" ON entries
    FOR SELECT USING (true);

CREATE POLICY "Authenticated users can create entries" ON entries
    FOR INSERT WITH CHECK (auth.uid()::text = user_id::text);

-- RLS Policies for transactions table
CREATE POLICY "Users can view own transactions" ON transactions
    FOR SELECT USING (auth.uid()::text = user_id::text);

CREATE POLICY "System can insert transactions" ON transactions
    FOR INSERT WITH CHECK (true);

-- RLS Policies for settlements table
CREATE POLICY "Anyone can view settlements" ON settlements
    FOR SELECT USING (true);

CREATE POLICY "Admins can create settlements" ON settlements
    FOR INSERT WITH CHECK (
        EXISTS (SELECT 1 FROM users WHERE id::text = auth.uid()::text AND is_admin = true)
    );
