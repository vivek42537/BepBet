import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getStandings, getSettlementStatus, markReadyToSettle, settleAllBalances } from '../lib/api';
import { supabase } from '../lib/supabase';

function Standings({ user }) {
  const [standings, setStandings] = useState([]);
  const [settlementStatus, setSettlementStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [settlingUp, setSettlingUp] = useState(false);
  const navigate = useNavigate();

  const fetchData = async () => {
    try {
      const [standingsRes, statusRes] = await Promise.all([
        getStandings(),
        getSettlementStatus()
      ]);
      console.log('[Standings] Got data:', { standingsRes, statusRes });
      setStandings(standingsRes.data || []);
      setSettlementStatus(statusRes.data || null);
    } catch (error) {
      console.error('[Standings] Failed to fetch data:', error);
      setStandings([]);
      setSettlementStatus(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();

    // Set up real-time subscription for user balance changes
    const channel = supabase
      .channel('standings-changes')
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'users' },
        (payload) => {
          console.log('[Standings] User change detected:', payload);
          fetchData();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const handleReadyToSettle = async () => {
    setSettlingUp(true);
    try {
      await markReadyToSettle();
      await fetchData();
      alert('You\'re marked as ready to settle! Waiting for others...');
    } catch (error) {
      alert('Failed to mark ready: ' + error.message);
    } finally {
      setSettlingUp(false);
    }
  };

  const handleSettleAll = async () => {
    if (!window.confirm('This will reset everyone\'s balance to $0. Make sure you\'ve settled on Venmo first! Continue?')) {
      return;
    }

    setSettlingUp(true);
    try {
      await settleAllBalances();
      await fetchData();
      alert('✅ Settlement complete! All balances reset to $0');
    } catch (error) {
      alert('Failed to settle: ' + error.message);
    } finally {
      setSettlingUp(false);
    }
  };

  return (
    <>
      <nav className="nav">
        <h1>BepBet</h1>
        <div className="nav-user">
          <span>{user?.name}</span>
          <span className="balance">${Number(user?.balance).toFixed(2)}</span>
          <button className="btn-secondary" onClick={() => navigate('/users')}>
            Users
          </button>
          <button className="btn-secondary" onClick={() => navigate('/')}>
            Back to Bets
          </button>
        </div>
      </nav>

      <div className="container">
        {settlementStatus && (
          <div
            className="card"
            style={{
              cursor: 'default',
              background: settlementStatus.can_settle
                ? 'linear-gradient(135deg, rgba(16, 185, 129, 0.2) 0%, rgba(52, 211, 153, 0.1) 100%)'
                : 'rgba(99, 102, 241, 0.1)',
              border: settlementStatus.can_settle
                ? '2px solid var(--bepbet-success)'
                : '2px solid var(--bepbet-primary)'
            }}
          >
            <h3 style={{ marginBottom: '1rem' }}>
              {settlementStatus.can_settle ? '✅ Ready to Settle!' : '🤝 Monthly Settlement'}
            </h3>

            {settlementStatus.can_settle ? (
              <div>
                <p style={{ marginBottom: '1.5rem', color: 'var(--bepbet-text-muted)' }}>
                  Everyone is ready! Click below to reset all balances to $0.
                </p>
                <button
                  className="btn-success"
                  onClick={handleSettleAll}
                  disabled={settlingUp}
                  style={{ width: '100%', fontSize: '1.1rem' }}
                >
                  {settlingUp ? 'Settling...' : '💸 Settle & Reset All Balances'}
                </button>
              </div>
            ) : (
              <div>
                <p style={{ marginBottom: '1rem', color: 'var(--bepbet-text-muted)' }}>
                  {settlementStatus.ready_count} of {settlementStatus.total_users} people ready
                </p>
                <div style={{
                  background: 'rgba(255, 255, 255, 0.05)',
                  padding: '1rem',
                  borderRadius: '8px',
                  marginBottom: '1rem'
                }}>
                  {settlementStatus.ready_users?.length > 0 && (
                    <div style={{ marginBottom: '0.5rem' }}>
                      <strong style={{ color: 'var(--bepbet-success)' }}>✓ Ready:</strong> {settlementStatus.ready_users.join(', ')}
                    </div>
                  )}
                  {settlementStatus.not_ready_users?.length > 0 && (
                    <div>
                      <strong style={{ color: 'var(--bepbet-text-muted)' }}>⏳ Waiting:</strong> {settlementStatus.not_ready_users.join(', ')}
                    </div>
                  )}
                </div>
                {user && !user.ready_to_settle && (
                  <button
                    className="btn-primary"
                    onClick={handleReadyToSettle}
                    disabled={settlingUp}
                    style={{ width: '100%' }}
                  >
                    {settlingUp ? 'Marking Ready...' : '✋ I\'ve Settled on Venmo - Ready to Reset'}
                  </button>
                )}
                {user && user.ready_to_settle && (
                  <div style={{
                    textAlign: 'center',
                    padding: '1rem',
                    background: 'rgba(16, 185, 129, 0.1)',
                    borderRadius: '8px',
                    color: 'var(--bepbet-success)',
                    fontWeight: 'bold'
                  }}>
                    ✓ You're ready! Waiting for others...
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        <div className="card" style={{ cursor: 'default' }}>
          <h2>💰 Standings</h2>
          <p style={{ marginBottom: '2rem' }}>
            Live tracking of who owes what. Positive balances collect money, negative balances owe money.
          </p>

          {loading ? (
            <div className="empty-state">
              <p>Loading...</p>
            </div>
          ) : standings.length === 0 ? (
            <div className="empty-state">
              <p>No users yet</p>
            </div>
          ) : (
            <div style={{ marginTop: '1rem' }}>
              {standings.map((standing, index) => {
                const balance = Number(standing.balance);
                const isPositive = balance > 0;
                const isNegative = balance < 0;
                const isYou = standing.id === user?.id;

                return (
                  <div
                    key={standing.id}
                    style={{
                      padding: '1.5rem',
                      borderBottom: index !== standings.length - 1 ? '1px solid var(--bepbet-border)' : 'none',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      background: isYou ? 'rgba(99, 102, 241, 0.1)' : 'transparent',
                      borderRadius: isYou ? '8px' : '0',
                      marginBottom: isYou ? '0.5rem' : '0',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                      <div
                        style={{
                          fontSize: '1.5rem',
                          fontWeight: 'bold',
                          color: 'var(--bepbet-text-muted)',
                          minWidth: '2rem',
                        }}
                      >
                        #{index + 1}
                      </div>
                      <div>
                        <div style={{ fontWeight: 'bold', fontSize: '1.1rem' }}>
                          {standing.name}
                          {isYou && (
                            <span
                              style={{
                                marginLeft: '0.5rem',
                                fontSize: '0.8rem',
                                color: 'var(--bepbet-primary-light)',
                              }}
                            >
                              (You)
                            </span>
                          )}
                        </div>
                        <div style={{ fontSize: '0.9rem', color: 'var(--bepbet-text-muted)' }}>
                          {standing.email}
                        </div>
                      </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div
                        style={{
                          fontSize: '1.75rem',
                          fontWeight: 'bold',
                          color: isPositive
                            ? 'var(--bepbet-success)'
                            : isNegative
                            ? 'var(--bepbet-danger)'
                            : 'var(--bepbet-text-muted)',
                        }}
                      >
                        {balance > 0 ? '+' : ''}${balance.toFixed(2)}
                      </div>
                      <div style={{ fontSize: '0.85rem', color: 'var(--bepbet-text-muted)', marginTop: '0.25rem' }}>
                        {isPositive && '✅ Collects'}
                        {isNegative && '💸 Owes'}
                        {!isPositive && !isNegative && '⚖️ Even'}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          <div style={{ marginTop: '2rem', padding: '1.5rem', background: 'rgba(99, 102, 241, 0.1)', borderRadius: '12px' }}>
            <h3 style={{ marginBottom: '1rem', fontSize: '1.1rem' }}>💡 How Settlement Works</h3>
            <ul style={{ lineHeight: '1.8', color: 'var(--bepbet-text-muted)', paddingLeft: '1.5rem' }}>
              <li>Everyone starts at $0</li>
              <li>When you enter a bet, your balance goes negative (you owe money)</li>
              <li>When you win, your balance goes positive (you collect money)</li>
              <li>At month end, settle up: positive balances collect, negative balances pay</li>
              <li>Use Venmo, Zelle, or cash to settle the difference</li>
            </ul>
          </div>
        </div>
      </div>
    </>
  );
}

export default Standings;
