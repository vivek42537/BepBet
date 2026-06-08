-- ============================================
-- BepBet Database Update Script
-- Run this in your Supabase SQL Editor
-- ============================================

-- Drop and recreate the get_lifetime_stats function with proper aliasing
DROP FUNCTION IF EXISTS get_lifetime_stats();

CREATE OR REPLACE FUNCTION get_lifetime_stats()
RETURNS TABLE (
  id UUID,
  name TEXT,
  email TEXT,
  current_balance NUMERIC,
  lifetime_wagered NUMERIC,
  lifetime_won NUMERIC,
  lifetime_profit NUMERIC,
  total_bets BIGINT,
  win_count BIGINT,
  loss_count BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    u.id AS id,
    u.name AS name,
    u.email AS email,
    u.balance AS current_balance,
    COALESCE(SUM(CASE WHEN t.type = 'bet_entry' THEN ABS(t.amount) ELSE 0 END), 0) AS lifetime_wagered,
    COALESCE(SUM(CASE WHEN t.type = 'bet_payout' THEN t.amount ELSE 0 END), 0) AS lifetime_won,
    (COALESCE(SUM(CASE WHEN t.type = 'bet_payout' THEN t.amount ELSE 0 END), 0) -
     COALESCE(SUM(CASE WHEN t.type = 'bet_entry' THEN ABS(t.amount) ELSE 0 END), 0)) AS lifetime_profit,
    COUNT(DISTINCT e.bet_id) AS total_bets,
    COUNT(DISTINCT CASE WHEN e.is_winner = true THEN e.bet_id END) AS win_count,
    COUNT(DISTINCT CASE WHEN e.is_winner = false THEN e.bet_id END) AS loss_count
  FROM users u
  LEFT JOIN transactions t ON t.user_id = u.id
  LEFT JOIN entries e ON e.user_id = u.id
  GROUP BY u.id, u.name, u.email, u.balance
  ORDER BY (
    COALESCE(SUM(CASE WHEN t.type = 'bet_payout' THEN t.amount ELSE 0 END), 0) -
    COALESCE(SUM(CASE WHEN t.type = 'bet_entry' THEN ABS(t.amount) ELSE 0 END), 0)
  ) DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Ensure the update_balance function exists
CREATE OR REPLACE FUNCTION update_balance(user_id UUID, amount NUMERIC)
RETURNS void AS $$
BEGIN
  UPDATE users
  SET balance = balance + amount
  WHERE id = user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permissions on functions
GRANT EXECUTE ON FUNCTION get_lifetime_stats() TO authenticated;
GRANT EXECUTE ON FUNCTION update_balance(UUID, NUMERIC) TO authenticated;

-- Enable realtime for all tables
ALTER PUBLICATION supabase_realtime ADD TABLE users;
ALTER PUBLICATION supabase_realtime ADD TABLE bets;
ALTER PUBLICATION supabase_realtime ADD TABLE entries;
ALTER PUBLICATION supabase_realtime ADD TABLE transactions;
ALTER PUBLICATION supabase_realtime ADD TABLE settlements;

-- Verify RLS policies are enabled
SELECT tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
AND tablename IN ('users', 'bets', 'entries', 'transactions', 'settlements');

-- Test the get_lifetime_stats function
SELECT * FROM get_lifetime_stats() LIMIT 5;

-- Show current user count
SELECT COUNT(*) as user_count FROM users;

-- Show current bet count
SELECT COUNT(*) as bet_count FROM bets;

COMMIT;
