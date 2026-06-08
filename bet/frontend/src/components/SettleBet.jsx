import { useState } from 'react';
import { settleBet } from '../lib/api';

function SettleBet({ bet, entries, onClose, onSuccess }) {
  const [selectedWinners, setSelectedWinners] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const toggleWinner = (entryId) => {
    setSelectedWinners((prev) =>
      prev.includes(entryId)
        ? prev.filter((id) => id !== entryId)
        : [...prev, entryId]
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (selectedWinners.length === 0) {
      setError('Please select at least one winner');
      return;
    }

    setError('');
    setLoading(true);

    try {
      await settleBet(bet.id, selectedWinners);
      onSuccess();
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to settle bet');
    } finally {
      setLoading(false);
    }
  };

  const totalPool = entries.reduce((sum, entry) => sum + Number(entry.amount), 0);
  const payoutPerWinner = selectedWinners.length > 0 ? totalPool / selectedWinners.length : 0;

  return (
    <div className="modal">
      <div className="modal-content">
        <div className="modal-header">
          <h2>Settle Bet</h2>
          <button className="close" onClick={onClose}>
            &times;
          </button>
        </div>
        <div style={{ marginBottom: '1rem' }}>
          <h3>{bet.title}</h3>
          <p>Total Pool: ${totalPool.toFixed(2)}</p>
          {selectedWinners.length > 0 && (
            <p style={{ color: '#27ae60', fontWeight: 'bold' }}>
              Payout per winner: ${payoutPerWinner.toFixed(2)}
            </p>
          )}
        </div>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Select Winner(s)</label>
            <div style={{ marginTop: '0.5rem' }}>
              {entries.map((entry) => (
                <div
                  key={entry.id}
                  style={{
                    padding: '1rem',
                    border: '2px solid',
                    borderColor: selectedWinners.includes(entry.id) ? '#27ae60' : '#ddd',
                    borderRadius: '5px',
                    marginBottom: '0.5rem',
                    cursor: 'pointer',
                    backgroundColor: selectedWinners.includes(entry.id) ? '#d4edda' : 'white',
                  }}
                  onClick={() => toggleWinner(entry.id)}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <strong>{entry.user_name}</strong>
                      <p style={{ margin: '0.25rem 0 0 0', color: '#7f8c8d' }}>
                        {entry.prediction}
                      </p>
                    </div>
                    <input
                      type="checkbox"
                      checked={selectedWinners.includes(entry.id)}
                      onChange={() => toggleWinner(entry.id)}
                      style={{ width: '20px', height: '20px' }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
          {error && <div style={{ color: '#e74c3c', marginBottom: '1rem' }}>{error}</div>}
          <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
            <button type="button" className="btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn-danger" disabled={loading}>
              {loading ? 'Settling...' : 'Settle Bet'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default SettleBet;
