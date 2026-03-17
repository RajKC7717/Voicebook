import { useState, useRef } from 'react';
import { ocrPreview, ocrConfirm } from '../api';

const STATES = {
  IDLE: 'idle',
  PREVIEWING: 'previewing',
  PREVIEW: 'preview',
  SAVING: 'saving',
  SUCCESS: 'success',
  ERROR: 'error',
};

const TYPE_COLOR = {
  receivable: 'var(--green)',
  income:     'var(--green)',
  payable:    'var(--red)',
  expense:    'var(--amber)',
};

export default function KhataOCR() {
  const [state, setState] = useState(STATES.IDLE);
  const [preview, setPreview] = useState(null);    // { entries, ocr_text }
  const [imageUrl, setImageUrl] = useState(null);
  const [savedCount, setSavedCount] = useState(0);
  const [errorMsg, setErrorMsg] = useState('');
  const fileRef = useRef(null);

  // ── Upload + Preview ───────────────────────────────────────────────────
  const handleUpload = async (file) => {
    if (!file) return;

    // Show image preview locally
    setImageUrl(URL.createObjectURL(file));
    setState(STATES.PREVIEWING);

    const formData = new FormData();
    formData.append('image', file);

    try {
      const res = await ocrPreview(formData);
      setPreview(res.data);
      setState(STATES.PREVIEW);
    } catch (err) {
      setErrorMsg(err.response?.data?.detail || 'Could not read image. Try a clearer photo.');
      setState(STATES.ERROR);
    }
  };

  // ── Confirm + Save ─────────────────────────────────────────────────────
  const handleConfirm = async () => {
    setState(STATES.SAVING);
    try {
      const res = await ocrConfirm(preview.entries, preview.ocr_text);
      setSavedCount(res.data.saved_count);
      setState(STATES.SUCCESS);
    } catch (err) {
      setErrorMsg(err.response?.data?.detail || 'Failed to save entries.');
      setState(STATES.ERROR);
    }
  };

  const reset = () => {
    setState(STATES.IDLE);
    setPreview(null);
    setImageUrl(null);
    setErrorMsg('');
    if (fileRef.current) fileRef.current.value = '';
  };

  return (
    <div style={{ maxWidth: '680px', margin: '0 auto', paddingTop: '40px' }}>
      <h1 style={{ fontSize: '32px', fontWeight: 800, marginBottom: '12px', fontFamily: 'Poppins, sans-serif', letterSpacing: '-0.5px' }}>Khata OCR</h1>
      <p style={{ color: 'var(--text-muted)', marginBottom: '32px', fontSize: '14px', fontFamily: 'Poppins, sans-serif', fontWeight: 600 }}>
        Upload a photo of your handwritten khata — entries will be extracted automatically
      </p>

      {/* ── IDLE: Upload Zone ── */}
      {state === STATES.IDLE && (
        <div
          onClick={() => fileRef.current?.click()}
          style={{
            border: '2px dashed var(--border)',
            borderRadius: '16px',
            padding: '60px',
            textAlign: 'center',
            cursor: 'pointer',
            transition: 'border-color 0.2s',
          }}
          onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--accent)'}
          onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border)'}
        >
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>📷</div>
          <p style={{ fontWeight: 800, fontSize: '17px', marginBottom: '8px', fontFamily: 'Poppins, sans-serif', letterSpacing: '-0.3px' }}>
            Click to upload khata photo
          </p>
          <p style={{ color: 'var(--text-muted)', fontSize: '13px', fontFamily: 'Poppins, sans-serif', fontWeight: 600 }}>
            JPG, PNG supported — handwritten Hindi/English entries
          </p>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            style={{ display: 'none' }}
            onChange={e => handleUpload(e.target.files[0])}
          />
        </div>
      )}

      {/* ── PREVIEWING: Loading ── */}
      {state === STATES.PREVIEWING && (
        <div style={{ textAlign: 'center', paddingTop: '40px' }}>
          {imageUrl && (
            <img src={imageUrl} alt="Uploaded" style={{
              maxWidth: '100%', maxHeight: '240px',
              borderRadius: '12px', marginBottom: '24px',
              border: '1px solid var(--border)',
            }} />
          )}
          <div style={{ fontSize: '40px', marginBottom: '16px' }}>🔍</div>
          <p style={{ color: 'var(--text-muted)', fontFamily: 'Poppins, sans-serif', fontWeight: 600 }}>Reading image → extracting entries...</p>
        </div>
      )}

      {/* ── PREVIEW: Show Extracted Entries ── */}
      {state === STATES.PREVIEW && preview && (
        <div>
          {imageUrl && (
            <img src={imageUrl} alt="Uploaded" style={{
              maxWidth: '100%', maxHeight: '180px',
              borderRadius: '12px', marginBottom: '20px',
              border: '1px solid var(--border)',
              objectFit: 'cover',
            }} />
          )}

          {/* OCR Raw Text (collapsible feel) */}
          <div style={{
            background: 'var(--bg-card)', border: '1px solid var(--border)',
            borderRadius: '10px', padding: '14px', marginBottom: '20px',
          }}>
            <p style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.08em', fontFamily: 'Poppins, sans-serif', fontWeight: 700 }}>
              Raw OCR Output
            </p>
            <p style={{ fontSize: '13px', color: 'var(--text-muted)', fontFamily: 'DM Mono, monospace', lineHeight: 1.6 }}>
              {preview.ocr_text.slice(0, 200)}{preview.ocr_text.length > 200 ? '...' : ''}
            </p>
          </div>

          {/* Extracted Entries */}
          <p style={{ fontWeight: 800, marginBottom: '12px', fontSize: '16px', fontFamily: 'Poppins, sans-serif', letterSpacing: '-0.3px' }}>
            {preview.entry_count} {preview.entry_count === 1 ? 'entry' : 'entries'} found:
          </p>

          {preview.entries.length === 0 ? (
            <div style={{
              background: 'var(--amber-dim)', border: '1px solid var(--amber)',
              borderRadius: '10px', padding: '20px', textAlign: 'center',
              color: 'var(--amber)', marginBottom: '20px', fontFamily: 'Poppins, sans-serif', fontWeight: 700,
            }}>
              No readable entries found. Try a clearer photo with better lighting.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '24px' }}>
              {preview.entries.map((entry, i) => (
                <div key={i} style={{
                  background: 'var(--bg-card)', border: '1px solid var(--border)',
                  borderRadius: '10px', padding: '16px',
                  display: 'grid', gridTemplateColumns: '1fr 1fr 1fr',
                  gap: '12px',
                }}>
                  <div>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '3px', fontFamily: 'Poppins, sans-serif', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.2px' }}>Party</div>
                    <div style={{ fontWeight: 800, fontFamily: 'Poppins, sans-serif' }}>{entry.party_name}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '3px', fontFamily: 'Poppins, sans-serif', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.2px' }}>Amount</div>
                    <div style={{ fontWeight: 800, color: TYPE_COLOR[entry.transaction_type], fontFamily: 'DM Mono, monospace' }}>
                      ₹{Number(entry.amount).toLocaleString('en-IN')}
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '3px', fontFamily: 'Poppins, sans-serif', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.2px' }}>Type</div>
                    <span style={{
                      background: `${TYPE_COLOR[entry.transaction_type]}22`,
                      color: TYPE_COLOR[entry.transaction_type],
                      border: `1px solid ${TYPE_COLOR[entry.transaction_type]}44`,
                      borderRadius: '6px', padding: '3px 10px',
                      fontSize: '12px', fontWeight: 700,
                      fontFamily: 'Poppins, sans-serif',
                    }}>
                      {entry.transaction_type}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div style={{ display: 'flex', gap: '12px' }}>
            {preview.entries.length > 0 && (
              <button onClick={handleConfirm} style={{ flex: 1, padding: '14px', borderRadius: '8px',
                background: 'var(--green)', border: 'none',
                color: '#000', fontWeight: 800, fontSize: '15px',
                cursor: 'pointer', fontFamily: 'Poppins, sans-serif',
              }}>
                ✅ Save All {preview.entry_count} Entries
              </button>
            )}
            <button onClick={reset} style={{
              flex: 1, padding: '14px', borderRadius: '8px',
              background: 'var(--bg-card)', border: '1px solid var(--border)',
              color: 'var(--text-muted)', fontWeight: 700, fontSize: '15px',
              cursor: 'pointer', fontFamily: 'Poppins, sans-serif',
            }}>
              🗑️ Discard
            </button>
          </div>
        </div>
      )}

      {/* ── SAVING ── */}
      {state === STATES.SAVING && (
        <div style={{ textAlign: 'center', paddingTop: '40px' }}>
          <div style={{ fontSize: '40px', marginBottom: '16px', fontFamily: 'Poppins, sans-serif', fontWeight: 600 }}>💾</div>
          <p style={{ color: 'var(--text-muted)' }}>Saving entries to ledger...</p>
        </div>
      )}

      {/* ── SUCCESS ── */}
      {state === STATES.SUCCESS && (
        <div style={{ textAlign: 'center', paddingTop: '40px' }}>
          <div style={{ fontSize: '64px', marginBottom: '16px' }}>✅</div>
          <p style={{ color: 'var(--green)', fontWeight: 800, fontSize: '18px', fontFamily: 'Poppins, sans-serif' }}>
            {savedCount} {savedCount === 1 ? 'entry' : 'entries'} saved!
          </p>
          <p style={{ color: 'var(--text-muted)', marginTop: '8px', marginBottom: '28px', fontFamily: 'Poppins, sans-serif', fontWeight: 600 }}>
            Check the Ledger tab — they'll appear within 2 seconds
          </p>
          <button onClick={reset} style={{
            padding: '12px 32px', borderRadius: '8px',
            background: 'var(--accent)', border: 'none',
            color: '#fff', fontWeight: 700, cursor: 'pointer',
            fontFamily: 'Poppins, sans-serif',
          }}>
            Upload Another
          </button>
        </div>
      )}

      {/* ── ERROR ── */}
      {state === STATES.ERROR && (
        <div style={{
          background: 'var(--red-dim)', border: '1px solid var(--red)',
          borderRadius: '16px', padding: '24px', textAlign: 'center',
        }}>
          <p style={{ color: 'var(--red)', fontWeight: 700, marginBottom: '16px', fontFamily: 'Poppins, sans-serif' }}>
            ❌ {errorMsg}
          </p>
          <button onClick={reset} style={{
            padding: '10px 28px', borderRadius: '8px',
            background: 'var(--red)', border: 'none',
            color: '#fff', fontWeight: 700, cursor: 'pointer',
            fontFamily: 'Poppins, sans-serif',
          }}>
            Try Again
          </button>
        </div>
      )}
    </div>
  );
}