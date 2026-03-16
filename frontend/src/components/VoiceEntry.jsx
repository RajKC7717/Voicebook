import { useState, useRef } from 'react';
import axios from 'axios';

const STATES = {
  IDLE: 'idle',
  RECORDING: 'recording',
  PROCESSING: 'processing',
  CONFIRM: 'confirm',
  CLARIFY: 'clarify',
  SUCCESS: 'success',
  ERROR: 'error',
};

const TYPE_COLOR = {
  receivable: 'var(--green)',
  income: 'var(--green)',
  payable: 'var(--red)',
  expense: 'var(--amber)',
};

export default function VoiceEntry() {
  const [state, setState] = useState(STATES.IDLE);
  const [transcribed, setTranscribed] = useState('');
  const [transaction, setTransaction] = useState(null);
  const [clarification, setClarification] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  
  const streamRef = useRef(null); 
  const mediaRecorderRef = useRef(null);
  const chunksRef = useRef([]);


const startRecording = async () => {
  // Guard: don't start if already recording
  if (state !== STATES.IDLE) return;

  try {
    // Kill any old stream first
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    }

    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    streamRef.current = stream;

    // Pick best supported format for this browser
    const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
      ? 'audio/webm;codecs=opus'
      : MediaRecorder.isTypeSupported('audio/webm')
      ? 'audio/webm'
      : 'audio/ogg';

    const mediaRecorder = new MediaRecorder(stream, { mimeType });
    mediaRecorderRef.current = mediaRecorder;
    chunksRef.current = [];

    mediaRecorder.ondataavailable = (e) => {
      if (e.data.size > 0) chunksRef.current.push(e.data);
    };

    mediaRecorder.onstop = async () => {
      const blob = new Blob(chunksRef.current, { type: mimeType });
      // Stop mic tracks BEFORE sending
      stream.getTracks().forEach(t => t.stop());
      streamRef.current = null;
      await sendToBackend(blob, mimeType);
    };

    mediaRecorder.start(100);   // collect data every 100ms (more reliable)
    setState(STATES.RECORDING);
  } catch (err) {
    console.error('Mic error:', err);
    setErrorMsg('Microphone access denied. Please allow mic in browser settings.');
    setState(STATES.ERROR);
  }
};

const stopRecording = () => {
  if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
    mediaRecorderRef.current.stop();
    setState(STATES.PROCESSING);
  }
};

  // ── Send to Backend ──────────────────────────────────────────────────────
 const sendToBackend = async (blob, mimeType = 'audio/webm') => {
  const extension = mimeType.includes('ogg') ? 'ogg' : 'webm';
  const formData = new FormData();
  formData.append('audio', blob, `recording.${extension}`);

    try {
      const res = await axios.post('http://localhost:8000/api/voice/process', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      const data = res.data;
      setTranscribed(data.transcribed_text);

      if (data.status === 'clarification_needed') {
        setClarification(data.clarification_question);
        setTransaction(data.partial_data);
        setState(STATES.CLARIFY);
      } else {
        setTransaction(data.transaction);
        setState(STATES.CONFIRM);
      }
    } catch (err) {
      setErrorMsg(err.response?.data?.detail || 'Something went wrong. Try again.');
      setState(STATES.ERROR);
    }
  };

  // ── Reset ────────────────────────────────────────────────────────────────
const reset = () => {
  // Kill mic if somehow still active
  if (streamRef.current) {
    streamRef.current.getTracks().forEach(t => t.stop());
    streamRef.current = null;
  }
  if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
    mediaRecorderRef.current.stop();
  }
  setState(STATES.IDLE);
  setTranscribed('');
  setTransaction(null);
  setClarification('');
  setErrorMsg('');
};

  // ── Confirm (show success flash then reset) ──────────────────────────────
  const confirm = () => {
  setState(STATES.SUCCESS);

  // Build full Hindi confirmation text
  const { party_name, amount, transaction_type } = transaction;
  let text = '';
  if (transaction_type === 'receivable')
    text = `${party_name} ko aapko ${amount} rupaye dene hain. Entry save ho gayi.`;
  else if (transaction_type === 'payable')
    text = `Aapko ${party_name} ko ${amount} rupaye dene hain. Entry save ho gayi.`;
  else if (transaction_type === 'expense')
    text = `${amount} rupaye ka kharcha note kar liya. Entry save ho gayi.`;
  else
    text = `${amount} rupaye ki income entry save ho gayi.`;

  // Browser TTS with Hindi voice
  window.speechSynthesis.cancel(); // stop any previous speech
  const msg = new SpeechSynthesisUtterance(text);
  msg.lang = 'hi-IN';
  msg.rate = 0.9;   // slightly slower = clearer
  msg.pitch = 1.0;
  window.speechSynthesis.speak(msg);

  setTimeout(reset, 4000);
};
  // ─────────────────────────────────────────────────────────────────────────
  // RENDER
  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div style={{ maxWidth: '560px', margin: '0 auto', paddingTop: '40px' }}>
      <h1 style={{ fontSize: '28px', fontWeight: 800, marginBottom: '8px' }}>Voice Entry</h1>
      <p style={{ color: 'var(--text-muted)', marginBottom: '40px', fontSize: '14px' }}>
        Speak in Hindi, Marathi, or Hinglish — e.g. "Ramesh ne 3000 dene hain cement ke"
      </p>

      {/* ── MIC BUTTON AREA ── */}
      {(state === STATES.IDLE || state === STATES.RECORDING) && (
  <div style={{ textAlign: 'center' }}>
    <button
      onClick={state === STATES.IDLE ? startRecording : stopRecording}
      style={{
        width: '140px', height: '140px',
        borderRadius: '50%',
        border: `3px solid ${state === STATES.RECORDING ? 'var(--red)' : 'var(--accent)'}`,
        background: state === STATES.RECORDING ? 'var(--red-dim)' : 'var(--accent-dim)',
        cursor: 'pointer',
        fontSize: '52px',
        transition: 'all 0.2s ease',
        transform: state === STATES.RECORDING ? 'scale(1.08)' : 'scale(1)',
        boxShadow: state === STATES.RECORDING
          ? '0 0 40px var(--red)'
          : '0 0 20px var(--accent-dim)',
      }}
    >
      {state === STATES.RECORDING ? '⏹️' : '🎙️'}
    </button>
    <p style={{ marginTop: '20px', color: 'var(--text-muted)', fontSize: '14px' }}>
      {state === STATES.IDLE
        ? 'Click to start recording'
        : '🔴 Recording... Click again to stop'}
    </p>
  </div>
)}

      {/* ── PROCESSING ── */}
      {state === STATES.PROCESSING && (
        <div style={{ textAlign: 'center', paddingTop: '40px' }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>⏳</div>
          <p style={{ color: 'var(--text-muted)' }}>Transcribing + extracting data...</p>
        </div>
      )}

      {/* ── CONFIRM ── */}
      {state === STATES.CONFIRM && transaction && (
        <div style={{
          background: 'var(--bg-card)', border: '1px solid var(--border)',
          borderRadius: '16px', padding: '28px',
        }}>
          <p style={{ color: 'var(--text-muted)', fontSize: '13px', marginBottom: '16px' }}>
            📝 Heard: <em style={{ color: 'var(--text-primary)' }}>"{transcribed}"</em>
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '24px' }}>
            {[
              { label: 'Party', value: transaction.party_name },
              { label: 'Amount', value: `₹${Number(transaction.amount).toLocaleString('en-IN')}` },
              { label: 'Type', value: transaction.transaction_type },
              { label: 'Item', value: transaction.item || '—' },
              { label: 'Due Date', value: transaction.due_date || '—' },
              { label: 'Confidence', value: `${Math.round((transaction.confidence || 0.9) * 100)}%` },
            ].map(f => (
              <div key={f.label} style={{
                background: 'var(--bg-base)', borderRadius: '8px', padding: '12px',
              }}>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '4px' }}>
                  {f.label}
                </div>
                <div style={{
                  fontWeight: 700, fontSize: '15px',
                  color: f.label === 'Type'
                    ? TYPE_COLOR[transaction.transaction_type]
                    : 'var(--text-primary)',
                }}>
                  {f.value}
                </div>
              </div>
            ))}
          </div>

          <div style={{ display: 'flex', gap: '12px' }}>
            <button onClick={confirm} style={{
              flex: 1, padding: '14px', borderRadius: '10px',
              background: 'var(--green)', border: 'none',
              color: '#000', fontWeight: 800, fontSize: '15px',
              cursor: 'pointer', fontFamily: 'Syne, sans-serif',
            }}>
              ✅ Confirm & Save
            </button>
            <button onClick={reset} style={{
              flex: 1, padding: '14px', borderRadius: '10px',
              background: 'var(--bg-base)', border: '1px solid var(--border)',
              color: 'var(--text-muted)', fontWeight: 700, fontSize: '15px',
              cursor: 'pointer', fontFamily: 'Syne, sans-serif',
            }}>
              🗑️ Discard
            </button>
          </div>
        </div>
      )}

      {/* ── CLARIFICATION ── */}
      {state === STATES.CLARIFY && (
        <div style={{
          background: 'var(--amber-dim)', border: '1px solid var(--amber)',
          borderRadius: '16px', padding: '28px', textAlign: 'center',
        }}>
          <div style={{ fontSize: '32px', marginBottom: '12px' }}>🤔</div>
          <p style={{ color: 'var(--amber)', fontWeight: 700, marginBottom: '8px' }}>
            Need clarification:
          </p>
          <p style={{ color: 'var(--text-primary)', fontSize: '16px', marginBottom: '24px' }}>
            {clarification}
          </p>
          <button onClick={reset} style={{
            padding: '12px 32px', borderRadius: '10px',
            background: 'var(--amber)', border: 'none',
            color: '#000', fontWeight: 800, cursor: 'pointer',
            fontFamily: 'Syne, sans-serif',
          }}>
            🎙️ Record Again
          </button>
        </div>
      )}

      {/* ── SUCCESS ── */}
      {state === STATES.SUCCESS && (
        <div style={{ textAlign: 'center', paddingTop: '40px' }}>
          <div style={{ fontSize: '64px', marginBottom: '16px' }}>✅</div>
          <p style={{ color: 'var(--green)', fontWeight: 800, fontSize: '20px' }}>
            Transaction Saved!
          </p>
          <p style={{ color: 'var(--text-muted)', marginTop: '8px' }}>
            Check the ledger — it'll appear in 2 seconds
          </p>
        </div>
      )}

      {/* ── ERROR ── */}
      {state === STATES.ERROR && (
        <div style={{
          background: 'var(--red-dim)', border: '1px solid var(--red)',
          borderRadius: '16px', padding: '24px', textAlign: 'center',
        }}>
          <p style={{ color: 'var(--red)', fontWeight: 700, marginBottom: '16px' }}>
            ❌ {errorMsg}
          </p>
          <button onClick={reset} style={{
            padding: '10px 28px', borderRadius: '10px',
            background: 'var(--red)', border: 'none',
            color: '#fff', fontWeight: 700, cursor: 'pointer',
            fontFamily: 'Syne, sans-serif',
          }}>
            Try Again
          </button>
        </div>
      )}
    </div>
  );
}