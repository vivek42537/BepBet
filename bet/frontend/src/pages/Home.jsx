import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getBets, getCurrentUser } from '../lib/api';
import { supabase } from '../lib/supabase';
import CreateBet from '../components/CreateBet';
import BetCard from '../components/BetCard';

function Home({ user, setUser }) {
  const [bets, setBets] = useState([]);
  const [activeTab, setActiveTab] = useState('active');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [localUser, setLocalUser] = useState(user);
  const navigate = useNavigate();

  const fetchBets = async () => {
    try {
      const data = await getBets(activeTab);
      setBets(data);
    } catch (error) {
      console.error('Failed to fetch bets:', error);
    } finally {
      setLoading(false);
    }
  };

  const refreshUser = async () => {
    try {
      const data = await getCurrentUser();
      setUser(data);
      setLocalUser(data);
    } catch (error) {
      console.error('Failed to refresh user:', error);
    }
  };

  useEffect(() => {
    fetchBets();
    // Load user if not already loaded
    if (!localUser) {
      refreshUser();
    }

    // Set up real-time subscriptions for bets and entries
    const betsChannel = supabase
      .channel('bets-changes')
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'bets' },
        (payload) => {
          console.log('[Home] Bet change detected:', payload);
          fetchBets();
        }
      )
      .subscribe();

    const entriesChannel = supabase
      .channel('entries-changes-home')
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'entries' },
        (payload) => {
          console.log('[Home] Entry change detected:', payload);
          fetchBets();
        }
      )
      .subscribe();

    const usersChannel = supabase
      .channel('users-changes-home')
      .on('postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'users' },
        (payload) => {
          // Refresh user balance if current user is updated
          if (payload.new.id === localUser?.id) {
            console.log('[Home] Current user balance updated:', payload);
            refreshUser();
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(betsChannel);
      supabase.removeChannel(entriesChannel);
      supabase.removeChannel(usersChannel);
    };
  }, [activeTab, localUser?.id]);

  useEffect(() => {
    setLocalUser(user);
  }, [user]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/login');
  };

  const handleBetCreated = () => {
    setShowCreateModal(false);
    fetchBets();
  };

  return (
    <>
      <nav className="nav">
        <h1>BepBet</h1>
        {localUser && (
          <div className="nav-user">
            <span>{localUser.name}</span>
            <span className="balance">${Number(localUser.balance).toFixed(2)}</span>
            <button className="btn-secondary" onClick={() => navigate('/users')}>
              Users
            </button>
            <button className="btn-secondary" onClick={() => navigate('/standings')}>
              Standings
            </button>
            <button className="btn-secondary" onClick={() => navigate('/profile')}>
              Profile
            </button>
            <button className="btn-secondary" onClick={handleLogout}>
              Logout
            </button>
          </div>
        )}
      </nav>

      <div className="container">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <div className="tabs">
            <button
              className={`tab ${activeTab === 'active' ? 'active' : ''}`}
              onClick={() => setActiveTab('active')}
            >
              Active Bets
            </button>
            <button
              className={`tab ${activeTab === 'settled' ? 'active' : ''}`}
              onClick={() => setActiveTab('settled')}
            >
              Settled Bets
            </button>
          </div>
          <button className="btn-success" onClick={() => setShowCreateModal(true)}>
            + Create Bet
          </button>
        </div>

        {loading ? (
          <div className="empty-state">
            <p>Loading...</p>
          </div>
        ) : bets.length === 0 ? (
          <div className="empty-state">
            <p>No {activeTab} bets yet</p>
            {activeTab === 'active' && (
              <button className="btn-success" onClick={() => setShowCreateModal(true)}>
                Create the first bet
              </button>
            )}
          </div>
        ) : (
          bets.map((bet) => (
            <BetCard
              key={bet.id}
              bet={bet}
              onClick={() => navigate(`/bet/${bet.id}`)}
            />
          ))
        )}
      </div>

      {showCreateModal && (
        <CreateBet
          onClose={() => setShowCreateModal(false)}
          onSuccess={handleBetCreated}
        />
      )}
    </>
  );
}

export default Home;
