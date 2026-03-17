export default function Sidebar({ activePage, setActivePage }) {
  const links = [
    { id: 'ledger', label: 'Ledger' },
    { id: 'voice', label: 'Voice Entry' },
    { id: 'ocr', label: 'Khata OCR' },
  ];

  return (
    <aside style={{
      width: '220px',
      minHeight: '100vh',
      background: 'var(--bg-card)',
      borderRight: '1px solid var(--border)',
      padding: '32px 16px',
      display: 'flex',
      flexDirection: 'column',
      gap: '8px',
      position: 'fixed',
      top: 0, left: 0,
    }}>
      <div style={{ marginBottom: '32px', padding: '0 8px' }}>
        <div style={{ fontSize: '24px', fontWeight: 800, color: 'var(--accent)', fontFamily: 'Poppins, sans-serif', letterSpacing: '-0.5px' }}>
          VoiceBook
        </div>
        <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px', fontFamily: 'Poppins, sans-serif', fontWeight: 600 }}>
          Smart Ledger for SMEs
        </div>
      </div>

      {links.map(link => (
        <button key={link.id} onClick={() => setActivePage(link.id)} style={{
          background: activePage === link.id ? 'var(--accent-dim)' : 'transparent',
          color: activePage === link.id ? 'var(--accent)' : 'var(--text-muted)',
          border: activePage === link.id ? '1px solid var(--accent)' : 'none',
          borderRadius: '8px',
          padding: '12px 14px',
          textAlign: 'left',
          cursor: 'pointer',
          fontFamily: 'Poppins, sans-serif',
          fontWeight: 700,
          fontSize: '14px',
          transition: 'all 0.15s ease',
        }}>
          {link.label}
        </button>
      ))}
    </aside>
  );
}