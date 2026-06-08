import { supabase } from './supabase';

// Auth helpers
export const getCurrentUser = async () => {
  console.log('[API] getCurrentUser: Getting auth user...');
  const { data: { user } } = await supabase.auth.getUser();
  console.log('[API] getCurrentUser: Auth user:', user?.email);

  if (!user) {
    console.log('[API] getCurrentUser: No auth user found');
    return null;
  }

  // Check if user profile exists
  console.log('[API] getCurrentUser: Fetching user profile from DB...');
  let { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('id', user.id)
    .single();

  console.log('[API] getCurrentUser: DB query result:', { data, error });

  // Create profile if doesn't exist (Google sign-in first time)
  if (error && error.code === 'PGRST116') {
    console.log('[API] getCurrentUser: Profile not found, creating...');
    const { data: newUser, error: createError } = await supabase
      .from('users')
      .insert([{
        id: user.id,
        email: user.email,
        name: user.user_metadata?.full_name || user.email.split('@')[0],
        avatar_url: user.user_metadata?.avatar_url,
      }])
      .select()
      .single();

    console.log('[API] getCurrentUser: Create result:', { newUser, createError });
    if (createError) throw createError;
    return newUser;
  }

  if (error) {
    console.error('[API] getCurrentUser: Error:', error);
    throw error;
  }

  console.log('[API] getCurrentUser: Returning user:', data);
  return data;
};

// Get user from session object directly (avoids getUser() hang)
export const getUserFromSession = async (session) => {
  console.log('[API] getUserFromSession: Session user:', session?.user?.email);
  console.log('[API] getUserFromSession: User ID:', session?.user?.id);

  if (!session?.user) {
    console.log('[API] getUserFromSession: No session user');
    return null;
  }

  const user = session.user;

  // Check if user profile exists
  console.log('[API] getUserFromSession: Fetching user profile from DB...');

  // Try with a manual timeout
  let data, error;
  try {
    const queryPromise = supabase
      .from('users')
      .select('*')
      .eq('id', user.id)
      .single();

    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error('timeout')), 3000)
    );

    const result = await Promise.race([queryPromise, timeoutPromise]);
    data = result.data;
    error = result.error;

    console.log('[API] getUserFromSession: DB query result:', { data, error });
  } catch (err) {
    console.error('[API] getUserFromSession: Query timeout, creating basic user object');
    // Return a basic user object so the app can at least load
    return {
      id: user.id,
      email: user.email,
      name: user.user_metadata?.full_name || user.email.split('@')[0],
      avatar_url: user.user_metadata?.avatar_url,
      balance: 0,
      is_admin: true, // Temporarily set as admin
      ready_to_settle: false,
      created_at: new Date().toISOString()
    };
  }

  // Create profile if doesn't exist (Google sign-in first time)
  if (error && error.code === 'PGRST116') {
    console.log('[API] getUserFromSession: Profile not found, creating...');
    const { data: newUser, error: createError } = await supabase
      .from('users')
      .insert([{
        id: user.id,
        email: user.email,
        name: user.user_metadata?.full_name || user.email.split('@')[0],
        avatar_url: user.user_metadata?.avatar_url,
      }])
      .select()
      .single();

    console.log('[API] getUserFromSession: Create result:', { newUser, createError });
    if (createError) throw createError;
    return newUser;
  }

  if (error) {
    console.error('[API] getUserFromSession: Error:', error);
    throw error;
  }

  console.log('[API] getUserFromSession: Returning user:', data);
  return data;
};

export const signInWithEmail = async (email, name) => {
  // Check if user exists
  const { data: existingUser } = await supabase
    .from('users')
    .select('*')
    .eq('email', email)
    .single();

  if (!existingUser) {
    // Create user if doesn't exist
    const { data: { user } } = await supabase.auth.signUp({
      email,
      password: Math.random().toString(36), // Random password (not used with magic link)
    });

    if (user) {
      await supabase.from('users').insert([{
        id: user.id,
        email,
        name,
      }]);
    }
  }

  // Send magic link
  const { error } = await supabase.auth.signInWithOtp({ email });
  if (error) throw error;

  return { message: 'Check your email for the login link!' };
};

// Bets
export const getBets = async (status = null) => {
  let query = supabase
    .from('bets')
    .select(`
      *,
      creator:users!bets_creator_id_fkey(name),
      entries(amount)
    `)
    .order('created_at', { ascending: false });

  if (status) {
    query = query.eq('status', status);
  }

  const { data, error } = await query;
  if (error) throw error;

  return data.map(bet => ({
    ...bet,
    creator_name: bet.creator.name,
    total_pool: bet.entries.reduce((sum, e) => sum + parseFloat(e.amount), 0),
    entry_count: bet.entries.length,
  }));
};

export const getBet = async (betId) => {
  const { data, error } = await supabase
    .from('bets')
    .select(`
      *,
      creator:users!bets_creator_id_fkey(name),
      entries(amount)
    `)
    .eq('id', betId)
    .single();

  if (error) throw error;

  return {
    data: {
      ...data,
      creator_name: data.creator.name,
      total_pool: data.entries.reduce((sum, e) => sum + parseFloat(e.amount), 0),
      entry_count: data.entries.length,
    }
  };
};

export const createBet = async (betData) => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { data, error } = await supabase
    .from('bets')
    .insert([{
      ...betData,
      creator_id: user.id,
    }])
    .select()
    .single();

  if (error) throw error;
  return data;
};

export const getBetEntries = async (betId) => {
  const { data, error } = await supabase
    .from('entries')
    .select(`
      *,
      user:users(name)
    `)
    .eq('bet_id', betId)
    .order('created_at', { ascending: false });

  if (error) throw error;

  return {
    data: data.map(entry => ({
      ...entry,
      user_name: entry.user.name,
    }))
  };
};

// Entries
export const createEntry = async (entryData) => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  // Get bet details
  const { data: bet } = await supabase
    .from('bets')
    .select('entry_fee')
    .eq('id', entryData.bet_id)
    .single();

  // Start transaction: create entry, update balance, create transaction
  const { data: entry, error: entryError } = await supabase
    .from('entries')
    .insert([{
      bet_id: entryData.bet_id,
      user_id: user.id,
      prediction: entryData.prediction,
      amount: bet.entry_fee,
    }])
    .select()
    .single();

  if (entryError) throw entryError;

  // Update user balance
  const { error: balanceError } = await supabase.rpc('update_balance', {
    user_id: user.id,
    amount: -parseFloat(bet.entry_fee),
  });

  if (balanceError) throw balanceError;

  // Create transaction record
  await supabase.from('transactions').insert([{
    user_id: user.id,
    amount: -parseFloat(bet.entry_fee),
    type: 'bet_entry',
    bet_id: entryData.bet_id,
  }]);

  return entry;
};

// Transactions
export const getMyTransactions = async () => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { data, error } = await supabase
    .from('transactions')
    .select(`
      *,
      bet:bets(title)
    `)
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  if (error) throw error;

  return data.map(t => ({
    ...t,
    bet_title: t.bet?.title,
  }));
};

// Standings
export const getStandings = async () => {
  const { data, error } = await supabase
    .from('users')
    .select('id, name, email, balance')
    .order('balance', { ascending: false });

  if (error) throw error;
  return { data };
};

// Settlement
export const markReadyToSettle = async () => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { error } = await supabase
    .from('users')
    .update({ ready_to_settle: true })
    .eq('id', user.id);

  if (error) throw error;
};

export const getSettlementStatus = async () => {
  const { data: users, error } = await supabase
    .from('users')
    .select('name, ready_to_settle');

  if (error) throw error;

  const ready = users.filter(u => u.ready_to_settle);
  const notReady = users.filter(u => !u.ready_to_settle);

  return {
    data: {
      total_users: users.length,
      ready_count: ready.length,
      ready_users: ready.map(u => u.name),
      not_ready_users: notReady.map(u => u.name),
      can_settle: ready.length === users.length && users.length > 0,
    }
  };
};

export const settleAllBalances = async () => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  // Check if user is admin
  const { data: currentUser } = await supabase
    .from('users')
    .select('is_admin')
    .eq('id', user.id)
    .single();

  if (!currentUser?.is_admin) {
    throw new Error('Only admins can settle balances');
  }

  // Create settlement
  const { data: settlement } = await supabase
    .from('settlements')
    .insert([{}])
    .select()
    .single();

  // Reset all balances and create transactions
  const { data: users } = await supabase
    .from('users')
    .select('id, balance');

  for (const u of users) {
    if (parseFloat(u.balance) !== 0) {
      await supabase.from('transactions').insert([{
        user_id: u.id,
        amount: -parseFloat(u.balance),
        type: 'settlement',
        settlement_id: settlement.id,
      }]);
    }
  }

  // Reset balances and ready_to_settle flags
  await supabase
    .from('users')
    .update({ balance: 0, ready_to_settle: false })
    .neq('id', '00000000-0000-0000-0000-000000000000'); // Update all

  return { message: 'Settlement complete' };
};

export const settleBet = async (betId, winningEntryIds) => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  // Get bet and entries
  const { data: bet } = await supabase
    .from('bets')
    .select('*, entries(*)')
    .eq('id', betId)
    .single();

  const totalPool = bet.entries.reduce((sum, e) => sum + parseFloat(e.amount), 0);
  const payoutPerWinner = totalPool / winningEntryIds.length;

  // Mark winners
  await supabase
    .from('entries')
    .update({ is_winner: true })
    .in('id', winningEntryIds);

  // Mark losers
  await supabase
    .from('entries')
    .update({ is_winner: false })
    .eq('bet_id', betId)
    .not('id', 'in', `(${winningEntryIds.join(',')})`);

  // Update bet status
  await supabase
    .from('bets')
    .update({
      status: 'settled',
      settled_at: new Date().toISOString(),
      settled_by: user.id,
    })
    .eq('id', betId);

  // Payout winners
  const { data: winners } = await supabase
    .from('entries')
    .select('user_id')
    .in('id', winningEntryIds);

  for (const winner of winners) {
    await supabase.rpc('update_balance', {
      user_id: winner.user_id,
      amount: payoutPerWinner,
    });

    await supabase.from('transactions').insert([{
      user_id: winner.user_id,
      amount: payoutPerWinner,
      type: 'bet_payout',
      bet_id: betId,
    }]);
  }

  return {
    bet_id: betId,
    total_pool: totalPool,
    winner_count: winningEntryIds.length,
    payout_per_winner: payoutPerWinner,
    winners: winningEntryIds,
  };
};

// Users
export const getLifetimeStats = async () => {
  const { data, error } = await supabase.rpc('get_lifetime_stats');

  if (error) throw error;
  return data || [];
};
