import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getBet, getBetEntries } from '../lib/api';
import EnterBet from '../components/EnterBet';
import SettleBet from '../components/SettleBet';

function BetDetails({ user }) {
  const { betId } = useParams();
  const navigate = useNavigate();
  const [bet, setBet] = useState(null);
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showEnterModal, setShowEnterModal] = useState(false);
  const [showSettleModal, setShowSettleModal] = useState(false);

  const fetchBetData = async () => {
    try {
      const [betResponse, entriesResponse] = await Promise.all([
        getBet(betId),
        getBetEntries(betId),
      ]);
      setBet(betResponse.data);
      setEntries(entriesResponse.data);
    } catch (error) {
      console.error('Failed to fetch bet data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBetData();
  }, [betId]);

  const handleEntrySuccess = () => {
    setShowEnterModal(false);
    fetchBetData();
    window.location.reload(); // Refresh to update balance
  };

  const handleSettleSuccess = () => {
    setShowSettleModal(false);
    fetchBetData();
  };

  const userHasEntered = entries.some((entry) => entry.user_id === user?.id);

  // Calculate odds based on pool distribution
  const calculateOdds = () => {
    if (entries.length === 0) return [];

    // Group entries by prediction
    const predictionGroups = {};
    entries.forEach((entry) => {
      const pred = entry.prediction.toLowerCase().trim();
      if (!predictionGroups[pred]) {
        predictionGroups[pred] = {
          prediction: entry.prediction,
          totalAmount: 0,
          count: 0,
          entries: []
        };
      }
      predictionGroups[pred].totalAmount += Number(entry.amount);
      predictionGroups[pred].count += 1;
      predictionGroups[pred].entries.push(entry);
    });

    // Calculate odds for each group
    const totalPool = Number(bet.total_pool);
    return Object.values(predictionGroups).map((group) => {
      const potentialPayout = totalPool / group.count; // Per winner
      const profit = potentialPayout - Number(bet.entry_fee);
      const returnPercent = (profit / Number(bet.entry_fee)) * 100;

      // Convert to American odds
      let americanOdds;
      if (returnPercent >= 0) {
        americanOdds = `+${Math.round(returnPercent)}`;
      } else {
        americanOdds = `-${Math.round(100 / (returnPercent / 100))}`;
      }

      return {
        ...group,
        potentialPayout,
        americanOdds,
        percentage: (group.totalAmount / totalPool) * 100
      };
    }).sort((a, b) => b.totalAmount - a.totalAmount);
  };

  const oddsData = bet && entries.length > 0 ? calculateOdds() : [];

  if (loading) {
    return <div className="container">Loading...</div>;
  }

  if (!bet) {
    return <div className="container">Bet not found</div>;
  }

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
          <div style={{ display: 'flex', gap: '1.5rem', justifyContent: 'space-between', alignItems: 'start' }}>
            {bet.meme_url && (
              <div style={{ flexShrink: 0 }}>
                <img
                  src={bet.meme_url}
                  alt="Bet meme"
                  style={{
                    width: '200px',
                    height: '200px',
                    objectFit: 'cover',
                    borderRadius: '16px',
                    border: '3px solid var(--bepbet-border)',
                  }}
                  onError={(e) => {
                    e.target.style.display = 'none';
                  }}
                />
              </div>
            )}
            <div style={{ flex: 1 }}>
              <h2>{bet.title}</h2>
              <p>{bet.description}</p>
              <div className="bet-meta">
                <span>Entry Fee: ${Number(bet.entry_fee).toFixed(2)}</span>
                <span>Total Pool: ${Number(bet.total_pool).toFixed(2)}</span>
                <span>Entries: {bet.entry_count}</span>
                <span className={`badge ${bet.status === 'active' ? 'badge-success' : 'badge-warning'}`}>
                  {bet.status.toUpperCase()}
                </span>
              </div>
            </div>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              {bet.status === 'active' && !userHasEntered && (
                <button className="btn-primary" onClick={() => setShowEnterModal(true)}>
                  Enter Bet
                </button>
              )}
              {bet.status === 'active' && user?.is_admin && entries.length > 0 && (
                <button className="btn-danger" onClick={() => setShowSettleModal(true)}>
                  Settle Bet
                </button>
              )}
            </div>
          </div>
        </div>

        {oddsData.length > 1 && (
          <div className="card" style={{ cursor: 'default' }}>
            <h3>📊 Live Odds</h3>
            <p style={{ marginBottom: '1.5rem', color: 'var(--bepbet-text-muted)' }}>
              Based on current betting distribution
            </p>
            <div style={{ display: 'grid', gap: '1rem' }}>
              {oddsData.map((odds, index) => (
                <div
                  key={index}
                  style={{
                    padding: '1rem',
                    background: 'rgba(99, 102, 241, 0.1)',
                    borderRadius: '12px',
                    border: '2px solid var(--bepbet-border)',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                  }}
                >
                  <div>
                    <div style={{ fontWeight: 'bold', fontSize: '1.1rem', marginBottom: '0.25rem' }}>
                      {odds.prediction}
                    </div>
                    <div style={{ fontSize: '0.85rem', color: 'var(--bepbet-text-muted)' }}>
                      {odds.count} {odds.count === 1 ? 'entry' : 'entries'} • ${odds.totalAmount.toFixed(2)} ({odds.percentage.toFixed(0)}% of pool)
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div
                      style={{
                        fontSize: '1.5rem',
                        fontWeight: 'bold',
                        color: 'var(--bepbet-primary-light)',
                      }}
                    >
                      {odds.americanOdds}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--bepbet-text-muted)' }}>
                      ${odds.potentialPayout.toFixed(2)} payout
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="card">
          <h3>Entries ({entries.length})</h3>
          {entries.length === 0 ? (
            <div className="empty-state">
              <p>No entries yet. Be the first to enter!</p>
            </div>
          ) : (
            <div className="entry-list">
              {entries.map((entry) => (
                <div
                  key={entry.id}
                  className={`entry-item ${
                    entry.is_winner === true
                      ? 'winner'
                      : entry.is_winner === false
                      ? 'loser'
                      : ''
                  }`}
                >
                  <div>
                    <strong>{entry.user_name}</strong>
                    <p style={{ margin: '0.25rem 0 0 0', color: '#7f8c8d' }}>
                      {entry.prediction}
                    </p>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div>${Number(entry.amount).toFixed(2)}</div>
                    {entry.is_winner === true && (
                      <span className="badge badge-success">WINNER</span>
                    )}
                    {entry.is_winner === false && (
                      <span style={{ fontSize: '0.8rem', color: '#95a5a6' }}>Lost</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {showEnterModal && (
        <EnterBet
          bet={bet}
          onClose={() => setShowEnterModal(false)}
          onSuccess={handleEntrySuccess}
        />
      )}

      {showSettleModal && (
        <SettleBet
          bet={bet}
          entries={entries}
          onClose={() => setShowSettleModal(false)}
          onSuccess={handleSettleSuccess}
        />
      )}
    </>
  );
}

export default BetDetails;
