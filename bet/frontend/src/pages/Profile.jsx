import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getMyTransactions } from '../lib/api';

function Profile({ user }) {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchTransactions = async () => {
      try {
        const data = await getMyTransactions();
        setTransactions(data);
      } catch (error) {
        console.error('Failed to fetch transactions:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchTransactions();
  }, []);

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
        <div className="card">
          <h2>Profile</h2>
          <div style={{ marginTop: '1rem' }}>
            <p><strong>Name:</strong> {user?.name}</p>
            <p><strong>Email:</strong> {user?.email}</p>
            <p><strong>Balance:</strong> ${Number(user?.balance).toFixed(2)}</p>
            <p><strong>Admin:</strong> {user?.is_admin ? 'Yes' : 'No'}</p>
          </div>
        </div>

        <div className="card">
          <h2>Transaction History</h2>
          {loading ? (
            <div className="empty-state">
              <p>Loading...</p>
            </div>
          ) : transactions.length === 0 ? (
            <div className="empty-state">
              <p>No transactions yet</p>
            </div>
          ) : (
            <div style={{ marginTop: '1rem' }}>
              {transactions.map((tx) => (
                <div
                  key={tx.id}
                  style={{
                    padding: '1rem',
                    borderBottom: '1px solid #ddd',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                  }}
                >
                  <div>
                    <div style={{ fontWeight: 'bold' }}>{tx.bet_title}</div>
                    <div style={{ fontSize: '0.9rem', color: '#7f8c8d', marginTop: '0.25rem' }}>
                      {tx.type === 'bet_entry' ? 'Bet Entry' : 'Payout'}
                    </div>
                    <div style={{ fontSize: '0.8rem', color: '#95a5a6', marginTop: '0.25rem' }}>
                      {new Date(tx.created_at).toLocaleString()}
                    </div>
                  </div>
                  <div
                    style={{
                      fontSize: '1.2rem',
                      fontWeight: 'bold',
                      color: Number(tx.amount) > 0 ? '#27ae60' : '#e74c3c',
                    }}
                  >
                    {Number(tx.amount) > 0 ? '+' : ''}${Number(tx.amount).toFixed(2)}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
}

export default Profile;
