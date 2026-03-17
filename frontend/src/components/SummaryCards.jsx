export default function SummaryCards({ summary }) {
  if (!summary) return null;

  const cards = [
    {
      label: 'Total In',
      value: `₹${summary.total_in.toLocaleString('en-IN')}`,
      color: 'var(--green)',
      bg: 'var(--green-dim)',
      icon: '↑',
    },
    {
      label: 'Total Out',
      value: `₹${summary.total_out.toLocaleString('en-IN')}`,
      color: 'var(--red)',
      bg: 'var(--red-dim)',
      icon: '↓',
    },
    {
      label: 'Net Balance',
      value: `₹${summary.net_balance.toLocaleString('en-IN')}`,
      color: summary.net_balance >= 0 ? 'var(--green)' : 'var(--red)',
      bg: summary.net_balance >= 0 ? 'var(--green-dim)' : 'var(--red-dim)',
      icon: '⚖',
    },
  ];

  return (
    <div style={{ display: 'flex', gap: '16px', marginBottom: '28px' }}>
      {cards.map(card => (
        <div key={card.label} style={{
          flex: 1,
          background: card.bg,
          border: `1px solid ${card.color}44`,
          borderRadius: '12px',
          padding: '20px',
        }}>
          <div style={{ fontSize: '24px', marginBottom: '12px' }}>{card.icon}</div>
          <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '6px', fontFamily: 'Poppins, sans-serif', fontWeight: 600, letterSpacing: '0.3px', textTransform: 'uppercase' }}>
            {card.label}
          </div>
          <div style={{ fontSize: '28px', fontWeight: 800, color: card.color, fontFamily: 'Poppins, sans-serif', letterSpacing: '-0.5px' }}>
            {card.value}
          </div>
        </div>
      ))}
    </div>
  );
}