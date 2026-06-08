import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getLifetimeStats } from '../lib/api';
import { supabase } from '../lib/supabase';

function Users({ user }) {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const fetchUsers = async () => {
    try {
      const data = await getLifetimeStats();
      console.log('[Users] Fetched stats:', data);
      setUsers(data || []);
    } catch (error) {
      console.error('[Users] Failed to fetch users:', error);
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();

    // Set up real-time subscriptions for data changes
    const usersChannel = supabase
      .channel('users-changes')
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'users' },
        (payload) => {
          console.log('[Users] User change detected:', payload);
          fetchUsers();
        }
      )
      .subscribe();

    const transactionsChannel = supabase
      .channel('transactions-changes')
      .on('postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'transactions' },
        (payload) => {
          console.log('[Users] Transaction change detected:', payload);
          fetchUsers();
        }
      )
      .subscribe();

    const entriesChannel = supabase
      .channel('entries-changes')
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'entries' },
        (payload) => {
          console.log('[Users] Entry change detected:', payload);
          fetchUsers();
        }
      )
      .subscribe();

    // Auto-refresh every 30 seconds as backup
    const interval = setInterval(fetchUsers, 30000);

    return () => {
      supabase.removeChannel(usersChannel);
      supabase.removeChannel(transactionsChannel);
      supabase.removeChannel(entriesChannel);
      clearInterval(interval);
    };
  }, []);

  return (
    <>
      <nav className="nav">
        <h1>BepBet</h1>
        <div className="nav-user">
          <span>{user?.name}</span>
          <span className="balance">${Number(user?.balance).toFixed(2)}</span>
          <button className="btn-secondary" onClick={() => navigate('/standings')}>
            Standings
          </button>
          <button className="btn-secondary" onClick={() => navigate('/')}>
            Back to Bets
          </button>
        </div>
      </nav>

      <div className="container">
        <div className="card" style={{ cursor: 'default' }}>
          <h2>👥 Users</h2>
          <p style={{ marginBottom: '2rem', color: 'var(--bepbet-text-muted)' }}>
            All-time statistics (updates live every 10 seconds)
          </p>

          {loading ? (
            <div className="empty-state">
              <p>Loading...</p>
            </div>
          ) : users.length === 0 ? (
            <div className="empty-state">
              <p>No users yet</p>
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid var(--bepbet-border)' }}>
                    <th style={{ textAlign: 'left', padding: '1rem', color: 'var(--bepbet-text-muted)', fontWeight: '600' }}>
                      Rank
                    </th>
                    <th style={{ textAlign: 'left', padding: '1rem', color: 'var(--bepbet-text-muted)', fontWeight: '600' }}>
                      Name
                    </th>
                    <th style={{ textAlign: 'left', padding: '1rem', color: 'var(--bepbet-text-muted)', fontWeight: '600' }}>
                      Email
                    </th>
                    <th style={{ textAlign: 'right', padding: '1rem', color: 'var(--bepbet-text-muted)', fontWeight: '600' }}>
                      Current
                    </th>
                    <th style={{ textAlign: 'right', padding: '1rem', color: 'var(--bepbet-text-muted)', fontWeight: '600' }}>
                      Wagered
                    </th>
                    <th style={{ textAlign: 'right', padding: '1rem', color: 'var(--bepbet-text-muted)', fontWeight: '600' }}>
                      Won
                    </th>
                    <th style={{ textAlign: 'right', padding: '1rem', color: 'var(--bepbet-text-muted)', fontWeight: '600' }}>
                      Lifetime P/L
                    </th>
                    <th style={{ textAlign: 'center', padding: '1rem', color: 'var(--bepbet-text-muted)', fontWeight: '600' }}>
                      Record
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((userData, index) => {
                    const isYou = userData.id === user?.id;
                    const profit = Number(userData.lifetime_profit);
                    const winRate = userData.total_bets > 0
                      ? ((userData.win_count / userData.total_bets) * 100).toFixed(0)
                      : 0;

                    return (
                      <tr
                        key={userData.id}
                        style={{
                          borderBottom: '1px solid var(--bepbet-border)',
                          background: isYou ? 'rgba(99, 102, 241, 0.1)' : 'transparent',
                        }}
                      >
                        <td style={{ padding: '1.25rem 1rem', fontSize: '1.1rem', fontWeight: 'bold', color: 'var(--bepbet-text-muted)' }}>
                          #{index + 1}
                        </td>
                        <td style={{ padding: '1.25rem 1rem' }}>
                          <div style={{ fontWeight: 'bold', fontSize: '1rem' }}>
                            {userData.name}
                            {isYou && (
                              <span style={{ marginLeft: '0.5rem', fontSize: '0.8rem', color: 'var(--bepbet-primary-light)' }}>
                                (You)
                              </span>
                            )}
                          </div>
                        </td>
                        <td style={{ padding: '1.25rem 1rem', color: 'var(--bepbet-text-muted)', fontSize: '0.9rem' }}>
                          {userData.email}
                        </td>
                        <td style={{ padding: '1.25rem 1rem', textAlign: 'right', fontWeight: '600' }}>
                          <span style={{
                            color: Number(userData.current_balance) > 0
                              ? 'var(--bepbet-success)'
                              : Number(userData.current_balance) < 0
                              ? 'var(--bepbet-danger)'
                              : 'var(--bepbet-text-muted)'
                          }}>
                            ${Number(userData.current_balance).toFixed(2)}
                          </span>
                        </td>
                        <td style={{ padding: '1.25rem 1rem', textAlign: 'right', color: 'var(--bepbet-text-muted)' }}>
                          ${Number(userData.lifetime_wagered).toFixed(2)}
                        </td>
                        <td style={{ padding: '1.25rem 1rem', textAlign: 'right', color: 'var(--bepbet-text-muted)' }}>
                          ${Number(userData.lifetime_won).toFixed(2)}
                        </td>
                        <td style={{ padding: '1.25rem 1rem', textAlign: 'right', fontWeight: 'bold', fontSize: '1.1rem' }}>
                          <span style={{
                            color: profit > 0
                              ? 'var(--bepbet-success)'
                              : profit < 0
                              ? 'var(--bepbet-danger)'
                              : 'var(--bepbet-text-muted)'
                          }}>
                            {profit > 0 ? '+' : ''}${profit.toFixed(2)}
                          </span>
                        </td>
                        <td style={{ padding: '1.25rem 1rem', textAlign: 'center' }}>
                          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.25rem' }}>
                            <span style={{ fontSize: '0.9rem' }}>
                              <span style={{ color: 'var(--bepbet-success)' }}>{userData.win_count}W</span>
                              {' - '}
                              <span style={{ color: 'var(--bepbet-danger)' }}>{userData.loss_count}L</span>
                            </span>
                            {userData.total_bets > 0 && (
                              <span style={{ fontSize: '0.75rem', color: 'var(--bepbet-text-muted)' }}>
                                {winRate}% win rate
                              </span>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          <div style={{ marginTop: '2rem', padding: '1rem', background: 'rgba(99, 102, 241, 0.1)', borderRadius: '8px', fontSize: '0.9rem', color: 'var(--bepbet-text-muted)' }}>
            <strong>Legend:</strong>
            <ul style={{ marginTop: '0.5rem', paddingLeft: '1.5rem' }}>
              <li><strong>Current:</strong> Balance this month (resets on settlement)</li>
              <li><strong>Wagered:</strong> Total amount bet across all time</li>
              <li><strong>Won:</strong> Total winnings across all time</li>
              <li><strong>Lifetime P/L:</strong> All-time profit/loss (Won - Wagered)</li>
              <li><strong>Record:</strong> Win-loss record and win percentage</li>
            </ul>
          </div>
        </div>
      </div>
    </>
  );
}

export default Users;
