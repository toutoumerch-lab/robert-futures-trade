import { useState, useRef, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { Mail } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import Card from '../components/common/Card';
import Button from '../components/common/Button';

const VerifyCode = () => {
  const [digits, setDigits]           = useState(['', '', '', '', '', '']);
  const [error, setError]             = useState('');
  const [loading, setLoading]         = useState(false);
  const [countdown, setCountdown]     = useState(60);
  const [canResend, setCanResend]     = useState(false);
  const [resendSuccess, setResendSuccess] = useState(false);
  const inputRefs = useRef([]);

  const { verifyOtp, resendOtp } = useAuth();
  const navigate  = useNavigate();
  const location  = useLocation();
  const email     = location.state?.email;

  useEffect(() => {
    if (!email) navigate('/register', { replace: true });
  }, [email, navigate]);

  // Countdown for resend button
  useEffect(() => {
    if (countdown === 0) { setCanResend(true); return; }
    const t = setTimeout(() => setCountdown(c => c - 1), 1000);
    return () => clearTimeout(t);
  }, [countdown]);

  const handleChange = (index, value) => {
    if (!/^\d?$/.test(value)) return;
    const next = [...digits];
    next[index] = value.slice(-1);
    setDigits(next);
    setError('');
    if (value && index < 5) inputRefs.current[index + 1]?.focus();
  };

  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !digits[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    const next = ['', '', '', '', '', ''];
    for (let i = 0; i < pasted.length; i++) next[i] = pasted[i];
    setDigits(next);
    inputRefs.current[Math.min(pasted.length, 5)]?.focus();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const code = digits.join('');
    if (code.length < 6) { setError('Please enter all 6 digits'); return; }
    setLoading(true);
    try {
      const user = await verifyOtp(email, code);
      navigate(user.role === 'admin' ? '/admin' : '/dashboard', { replace: true });
    } catch (err) {
      setError(err.response?.data?.error || 'Invalid or expired code. Please try again.');
      setDigits(['', '', '', '', '', '']);
      inputRefs.current[0]?.focus();
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (!canResend) return;
    try {
      await resendOtp(email);
      setCanResend(false);
      setCountdown(60);
      setResendSuccess(true);
      setTimeout(() => setResendSuccess(false), 4000);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to resend code. Please try again.');
    }
  };

  if (!email) return null;

  return (
    <div className="container py-16 flex justify-center">
      <Card style={{ maxWidth: '420px', width: '100%' }}>

        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{
            width: '64px', height: '64px', borderRadius: '50%',
            background: 'rgba(99,102,241,0.12)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 1rem',
          }}>
            <Mail size={28} style={{ color: 'var(--accent-primary)' }} />
          </div>
          <h2 className="text-gradient" style={{ marginBottom: '0.5rem' }}>Check your email</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: 1.5 }}>
            We sent a 6-digit verification code to<br />
            <strong style={{ color: 'var(--text-primary)' }}>{email}</strong>
          </p>
        </div>

        {/* Alerts */}
        {error && (
          <div style={{
            marginBottom: '1rem', padding: '0.75rem 1rem',
            background: 'rgba(239,68,68,0.1)', color: '#ef4444',
            borderRadius: '8px', textAlign: 'center', fontSize: '0.875rem',
          }}>
            {error}
          </div>
        )}
        {resendSuccess && (
          <div style={{
            marginBottom: '1rem', padding: '0.75rem 1rem',
            background: 'rgba(16,185,129,0.1)', color: '#10b981',
            borderRadius: '8px', textAlign: 'center', fontSize: '0.875rem',
          }}>
            Code resent! Check your inbox.
          </div>
        )}

        {/* OTP inputs */}
        <form onSubmit={handleSubmit}>
          <div style={{ display: 'flex', gap: '8px', justifyContent: 'center', marginBottom: '1.5rem' }}>
            {digits.map((digit, i) => (
              <input
                key={i}
                ref={el => inputRefs.current[i] = el}
                type="text"
                inputMode="numeric"
                maxLength={1}
                value={digit}
                onChange={e => handleChange(i, e.target.value)}
                onKeyDown={e => handleKeyDown(i, e)}
                onPaste={i === 0 ? handlePaste : undefined}
                autoFocus={i === 0}
                style={{
                  width: '48px', height: '56px',
                  textAlign: 'center',
                  fontSize: '1.5rem', fontWeight: '700',
                  borderRadius: '10px',
                  border: `2px solid ${digit ? 'var(--accent-primary)' : 'var(--border)'}`,
                  background: 'var(--card-bg)',
                  color: 'var(--text-primary)',
                  outline: 'none',
                  transition: 'border-color 0.15s',
                }}
              />
            ))}
          </div>

          <Button
            type="submit"
            variant="primary"
            style={{ width: '100%' }}
            disabled={loading}
          >
            {loading ? 'Verifying…' : 'Verify Email'}
          </Button>
        </form>

        {/* Footer links */}
        <div style={{ marginTop: '1.5rem', textAlign: 'center' }}>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '0.5rem' }}>
            Didn't receive it?{' '}
            <button
              onClick={handleResend}
              disabled={!canResend}
              style={{
                background: 'none', border: 'none', padding: 0,
                color: canResend ? 'var(--accent-primary)' : 'var(--text-secondary)',
                cursor: canResend ? 'pointer' : 'default',
                textDecoration: canResend ? 'underline' : 'none',
                fontSize: '0.85rem',
              }}
            >
              {canResend ? 'Resend code' : `Resend in ${countdown}s`}
            </button>
          </p>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
            Wrong email?{' '}
            <Link to="/register" style={{ color: 'var(--accent-primary)' }}>Go back</Link>
          </p>
        </div>

      </Card>
    </div>
  );
};

export default VerifyCode;
