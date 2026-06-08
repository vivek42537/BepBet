function BetCard({ bet, onClick }) {
  const hasMultipleEntries = bet.entry_count > 1;

  return (
    <div className="card" onClick={onClick} style={{ cursor: 'pointer', display: 'flex', gap: '1.5rem', alignItems: 'flex-start' }}>
      {bet.meme_url && (
        <div style={{ flexShrink: 0 }}>
          <img
            src={bet.meme_url}
            alt="Bet meme"
            style={{
              width: '120px',
              height: '120px',
              objectFit: 'cover',
              borderRadius: '12px',
              border: '2px solid var(--bepbet-border)',
            }}
            onError={(e) => {
              e.target.style.display = 'none';
            }}
          />
        </div>
      )}
      <div style={{ flex: 1, minWidth: 0 }}>
        <h2>{bet.title}</h2>
        <p>{bet.description}</p>
        <div className="bet-meta">
          <span>Entry Fee: ${Number(bet.entry_fee).toFixed(2)}</span>
          <span>Pool: ${Number(bet.total_pool).toFixed(2)}</span>
          <span>
            Entries: {bet.entry_count}
            {hasMultipleEntries && <span style={{ marginLeft: '0.25rem' }}>📊</span>}
          </span>
          <span>By: {bet.creator_name}</span>
          <span className={`badge ${bet.status === 'active' ? 'badge-success' : 'badge-warning'}`}>
            {bet.status.toUpperCase()}
          </span>
        </div>
      </div>
    </div>
  );
}

export default BetCard;
