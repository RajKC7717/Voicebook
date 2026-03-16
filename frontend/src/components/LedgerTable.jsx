const TYPE_CONFIG = {
  receivable: { label: 'Receivable', color: 'var(--green)', bg: 'var(--green-dim)' },
  income:     { label: 'Income',     color: 'var(--green)', bg: 'var(--green-dim)' },
  payable:    { label: 'Payable',    color: 'var(--red)',   bg: 'var(--red-dim)'   },
  expense:    { label: 'Expense',    color: 'var(--amber)', bg: 'var(--amber-dim)' },
};

export default function LedgerTable({ transactions }) {
  if (!transactions || transactions.length === 0) {
    return (
      <div style={{
        textAlign: 'center', padding: '60px',
        color: 'var(--text-muted)', border: '1px dashed var(--border)',
        borderRadius: '12px', fontSize: '15px',
      }}>
        No transactions yet. Use Voice Entry to add one 🎙️
      </div>
    );
  }

  return (
    <div style={{
      background: 'var(--bg-card)',
      borderRadius: '12px',
      border: '1px solid var(--border)',
      overflow: 'hidden',
    }}>
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr style={{ borderBottom: '1px solid var(--border)' }}>
            {['Party', 'Amount', 'Type', 'Item', 'Due Date', 'Time'].map(h => (
              <th key={h} style={{
                padding: '14px 18px', textAlign: 'left',
                fontSize: '11px', fontWeight: 700, letterSpacing: '0.08em',
                color: 'var(--text-muted)', textTransform: 'uppercase',
              }}>
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {transactions.map((tx, i) => {
            const cfg = TYPE_CONFIG[tx.transaction_type] || TYPE_CONFIG.expense;
            return (
              <tr key={tx.id} style={{
                borderBottom: i < transactions.length - 1 ? '1px solid var(--border)' : 'none',
                transition: 'background 0.15s',
              }}
              onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-hover)'}
              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
              >
                <td style={{ padding: '14px 18px', fontWeight: 700 }}>
                  {tx.party_name}
                </td>
                <td style={{ padding: '14px 18px', fontWeight: 700, color: cfg.color, fontFamily: 'DM Mono, monospace' }}>
                  ₹{Number(tx.amount).toLocaleString('en-IN')}
                </td>
                <td style={{ padding: '14px 18px' }}>
                  <span style={{
                    background: cfg.bg, color: cfg.color,
                    border: `1px solid ${cfg.color}44`,
                    borderRadius: '6px', padding: '3px 10px',
                    fontSize: '12px', fontWeight: 700,
                  }}>
                    {cfg.label}
                  </span>
                </td>
                <td style={{ padding: '14px 18px', color: 'var(--text-muted)', fontSize: '13px' }}>
                  {tx.item || '—'}
                </td>
                <td style={{ padding: '14px 18px', color: 'var(--text-muted)', fontSize: '13px', fontFamily: 'DM Mono, monospace' }}>
                  {tx.due_date || '—'}
                </td>
                <td style={{ padding: '14px 18px', color: 'var(--text-muted)', fontSize: '12px', fontFamily: 'DM Mono, monospace' }}>
                  {new Date(tx.created_at).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}