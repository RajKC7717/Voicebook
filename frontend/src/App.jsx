import { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import SummaryCards from './components/SummaryCards';
import LedgerTable from './components/LedgerTable';
import { getTransactions, getSummary, sendWhatsAppSummary } from './api';
import VoiceEntry from './components/VoiceEntry';
import KhataOCR from './components/KhataOCR';

export default function App() {
  const [activePage, setActivePage] = useState('ledger');
  const [transactions, setTransactions] = useState([]);
  const [summary, setSummary] = useState(null);
const [sending, setSending] = useState(false);
const [sent, setSent] = useState(false);

  const fetchData = async () => {
    try {
      const [txRes, sumRes] = await Promise.all([getTransactions(), getSummary()]);
      setTransactions(txRes.data);
      setSummary(sumRes.data.summary);
    } catch (err) {
      console.error('Backend not reachable:', err.message);
    }
  };

  const handleSendSummary = async () => {
  setSending(true);
  setSent(false);
  try {
    await sendWhatsAppSummary();
    setSent(true);
    setTimeout(() => setSent(false), 4000); // reset after 4s
  } catch (err) {
    alert('Failed to send WhatsApp summary. Check your Twilio config.');
  } finally {
    setSending(false);
  }
};
  // Poll every 2 seconds
  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 2000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div style={{ display: 'flex' }}>
      <Sidebar activePage={activePage} setActivePage={setActivePage} />

      {/* Main content — offset by sidebar width */}
      <main style={{ marginLeft: '220px', flex: 1, padding: '36px', minHeight: '100vh' }}>

       {activePage === 'ledger' && (
  <>
    <div style={{
      marginBottom: '28px',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'flex-start'
    }}>
      <div>
        <h1 style={{ fontSize: '28px', fontWeight: 800 }}>Live Ledger</h1>
        <p style={{ color: 'var(--text-muted)', marginTop: '4px', fontSize: '14px' }}>
          Auto-updates every 2 seconds
        </p>
      </div>

      {/* WhatsApp Summary Button */}
      <button
        onClick={handleSendSummary}
        disabled={sending}
        style={{
          padding: '12px 20px',
          borderRadius: '8px',
          border: sent ? '1px solid var(--green)' : '1px solid #25D366',
          background: sent ? 'var(--green-dim)' : '#25D36618',
          color: sent ? 'var(--green)' : '#25D366',
          fontWeight: 700,
          fontSize: '14px',
          cursor: sending ? 'not-allowed' : 'pointer',
          fontFamily: 'Poppins, sans-serif',
          transition: 'all 0.2s ease',
          opacity: sending ? 0.6 : 1,
          whiteSpace: 'nowrap',
        }}
      >
        {sending ? '⏳ Sending...' : sent ? '✅ Sent!' : '📱 Send WhatsApp Summary'}
      </button>
    </div>

            <SummaryCards summary={summary} />
            <LedgerTable transactions={transactions} />
          </>
        )}

        {activePage === 'voice' && (
  <VoiceEntry />    
)}

       {activePage === 'ocr' && <KhataOCR />}
      </main>
    </div>
  );
}