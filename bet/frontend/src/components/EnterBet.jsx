import { useState } from 'react';
import { createEntry } from '../lib/api';

function EnterBet({ bet, onClose, onSuccess }) {
  const [prediction, setPrediction] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await createEntry({
        bet_id: bet.id,
        prediction,
      });
      onSuccess();
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to enter bet');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal">
      <div className="modal-content">
        <div className="modal-header">
          <h2>Enter Bet</h2>
          <button className="close" onClick={onClose}>
            &times;
          </button>
        </div>
        <div style={{ marginBottom: '1rem' }}>
          <h3>{bet.title}</h3>
          <p>{bet.description}</p>
          <p style={{ fontWeight: 'bold' }}>Entry Fee: ${Number(bet.entry_fee).toFixed(2)}</p>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Your Prediction</label>
            <textarea
              value={prediction}
              onChange={(e) => setPrediction(e.target.value)}
              placeholder="Enter your prediction or stance..."
              required
            />
          </div>
          {error && <div style={{ color: '#e74c3c', marginBottom: '1rem' }}>{error}</div>}
          <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
            <button type="button" className="btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn-primary" disabled={loading}>
              {loading ? 'Submitting...' : 'Submit Entry'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default EnterBet;
