import { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import SummaryCards from './components/SummaryCards';
import LedgerTable from './components/LedgerTable';
import { getTransactions, getSummary } from './api';
import VoiceEntry from './components/VoiceEntry';
import KhataOCR from './components/KhataOCR';

export default function App() {
  const [activePage, setActivePage] = useState('ledger');
  const [transactions, setTransactions] = useState([]);
  const [summary, setSummary] = useState(null);

  const fetchData = async () => {
    try {
      const [txRes, sumRes] = await Promise.all([getTransactions(), getSummary()]);
      setTransactions(txRes.data);
      setSummary(sumRes.data.summary);
    } catch (err) {
      console.error('Backend not reachable:', err.message);
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
            <div style={{ marginBottom: '28px' }}>
              <h1 style={{ fontSize: '28px', fontWeight: 800 }}>Live Ledger</h1>
              <p style={{ color: 'var(--text-muted)', marginTop: '4px', fontSize: '14px' }}>
                Auto-updates every 2 seconds
              </p>
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