import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, ArrowRight, AlertCircle, Loader } from 'lucide-react';
import Card from '../components/common/Card';

const ForgotPassword = () => {
  const [email, setEmail]       = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSent, setIsSent]     = useState(false);
  const [devUrl, setDevUrl]     = useState(null);
  const [error, setError]       = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const response = await fetch('http://localhost:5001/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      let data;
      try { data = await response.json(); }
      catch { data = {}; }

      if (!response.ok) {
        setError(data.error || `Server error (${response.status}). Please try again.`);
        return;
      }

      setIsSent(true);
      if (data.devResetUrl) setDevUrl(data.devResetUrl);

    } catch (err) {
      setError('Could not reach the server. Please check your connection and try again.');
    } finally {
      setIsLoading(false);
    }
  };

  /* ── Success screen ─────────────────────────────────────── */
  if (isSent) {
    return (
      <div className="container py-16 flex justify-center">
        <Card style={{ maxWidth: '460px', width: '100%' }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{
              width: '64px', height: '64px', borderRadius: '50%',
              background: 'rgba(99,102,241,0.12)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              margin: '0 auto 1.25rem',
            }}>
              <Mail size={28} style={{ color: 'var(--accent-primary)' }} />
            </div>

            <h2 className="text-gradient mb-2">Check your email</h2>
            <p style={{ color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: '1.75rem' }}>
              If <strong style={{ color: 'var(--text-primary)' }}>{email}</strong> is registered,
              a reset link has been sent. Check your <strong>inbox and spam folder</strong>.
            </p>

            {/* Reset link — always prominent */}
            {devUrl && (
              <div style={{
                background: 'linear-gradient(135deg,rgba(99,102,241,0.1),rgba(139,92,246,0.08))',
                border: '1px solid rgba(99,102,241,0.3)',
                borderRadius: '16px', padding: '1.5rem', marginBottom: '1.5rem',
              }}>
                <p style={{ color: 'var(--accent-primary)', fontWeight: 700, fontSize: '0.85rem', marginBottom: '1rem', margin: '0 0 1rem' }}>
                  Didn't receive it? Use this link directly:
                </p>
                <button
                  onClick={() => {
                    try { navigate(new URL(devUrl).pathname); }
                    catch { window.location.href = devUrl; }
                  }}
                  style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                    width: '100%', padding: '0.75rem 1.5rem', borderRadius: '10px', border: 'none',
                    background: 'linear-gradient(135deg,#6366f1,#7c3aed)',
                    color: '#fff', fontWeight: 800, fontSize: '0.9rem',
                    cursor: 'pointer', fontFamily: 'var(--font-sans)',
                  }}
                >
                  <ArrowRight size={16} /> Open Reset Page
                </button>
              </div>
            )}

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <button
                onClick={() => { setIsSent(false); setDevUrl(null); setError(''); }}
                style={{
                  width: '100%', padding: '0.65rem', borderRadius: '10px',
                  border: '1px solid rgba(255,255,255,0.12)', background: 'transparent',
                  color: 'var(--text-secondary)', cursor: 'pointer',
                  fontFamily: 'var(--font-sans)', fontWeight: 700, fontSize: '0.875rem',
                }}
              >
                Try a different email
              </button>
              <Link to="/login" style={{ textDecoration: 'none' }}>
                <button style={{
                  width: '100%', padding: '0.65rem', borderRadius: '10px',
                  border: '1px solid rgba(255,255,255,0.06)', background: 'rgba(255,255,255,0.03)',
                  color: 'var(--text-secondary)', cursor: 'pointer',
                  fontFamily: 'var(--font-sans)', fontWeight: 700, fontSize: '0.875rem',
                }}>
                  Back to Login
                </button>
              </Link>
            </div>
          </div>
        </Card>
      </div>
    );
  }

  /* ── Request form ───────────────────────────────────────── */
  return (
    <div className="container py-16 flex justify-center">
      <Card style={{ maxWidth: '420px', width: '100%' }}>
        <h2 className="mb-2 text-center text-gradient">Forgot Password</h2>
        <p className="mb-6 text-center" style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
          Enter your email and we'll send you a reset link.
        </p>

        {/* Inline error banner */}
        {error && (
          <div style={{
            display: 'flex', alignItems: 'flex-start', gap: '10px',
            background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.3)',
            borderRadius: '12px', padding: '0.9rem 1.1rem', marginBottom: '1.25rem',
          }}>
            <AlertCircle size={16} style={{ color: '#f87171', flexShrink: 0, marginTop: '2px' }} />
            <span style={{ color: '#f87171', fontSize: '0.875rem', fontWeight: 600, lineHeight: 1.4 }}>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '1rem' }}>
            <label style={{ display: 'block', marginBottom: '6px', color: 'var(--text-secondary)', fontSize: '0.875rem', fontWeight: 600 }}>
              Email address
            </label>
            <input
              type="email"
              className="input"
              value={email}
              onChange={e => { setEmail(e.target.value); setError(''); }}
              required
              placeholder="Enter your email"
              autoFocus
              style={{ width: '100%' }}
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            style={{
              width: '100%', padding: '0.75rem', borderRadius: '10px', border: 'none',
              background: isLoading ? 'rgba(99,102,241,0.5)' : 'linear-gradient(135deg,#6366f1,#7c3aed)',
              color: '#fff', fontWeight: 800, fontSize: '0.9rem',
              cursor: isLoading ? 'not-allowed' : 'pointer',
              fontFamily: 'var(--font-sans)', marginBottom: '1rem',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
            }}
          >
            {isLoading
              ? <><Loader size={16} style={{ animation: 'spin 1s linear infinite' }} /> Sending…</>
              : 'Send Reset Link'
            }
          </button>

          <div style={{ textAlign: 'center' }}>
            <span style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>Remember your password? </span>
            <Link to="/login" style={{ color: 'var(--accent-primary)', fontWeight: 700, fontSize: '0.875rem' }}>Login</Link>
          </div>
        </form>
      </Card>
    </div>
  );
};

export default ForgotPassword;
