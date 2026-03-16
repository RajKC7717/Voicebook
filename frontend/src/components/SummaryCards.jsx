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
          <div style={{ fontSize: '24px', marginBottom: '8px' }}>{card.icon}</div>
          <div style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '4px' }}>
            {card.label}
          </div>
          <div style={{ fontSize: '26px', fontWeight: 800, color: card.color }}>
            {card.value}
          </div>
        </div>
      ))}
    </div>
  );
}