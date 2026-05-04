import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, ArrowRight } from 'lucide-react';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import { useToast } from '../context/ToastContext';

const ForgotPassword = () => {
  const [email, setEmail]       = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSent, setIsSent]     = useState(false);
  const [devUrl, setDevUrl]     = useState(null);
  const { addToast } = useToast();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setDevUrl(null);

    try {
      const response = await fetch('http://localhost:5001/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Something went wrong');
      }

      setIsSent(true);
      if (data.devResetUrl) {
        setDevUrl(data.devResetUrl);
      }
    } catch (err) {
      addToast('error', 'Error', err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container py-16 flex justify-center">
      <Card style={{ maxWidth: '420px', width: '100%' }}>

        {isSent ? (
          <div style={{ textAlign: 'center' }}>
            {/* Icon */}
            <div style={{
              width: '64px', height: '64px', borderRadius: '50%',
              background: 'rgba(99,102,241,0.12)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              margin: '0 auto 1.25rem',
            }}>
              <Mail size={28} style={{ color: 'var(--accent-primary)' }} />
            </div>

            <h2 className="text-gradient mb-2">Check your inbox</h2>

            <p style={{ color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: '1.5rem' }}>
              If <strong style={{ color: 'var(--text-primary)' }}>{email}</strong> is
              registered, a password reset link has been sent. Check your inbox{' '}
              <strong>and your spam folder</strong>.
            </p>

            {/* Dev / fallback reset link */}
            {devUrl && (
              <div style={{
                background: 'rgba(99,102,241,0.08)',
                border: '1px solid rgba(99,102,241,0.25)',
                borderRadius: '12px',
                padding: '1.25rem',
                marginBottom: '1.5rem',
                textAlign: 'left',
              }}>
                <p style={{ color: 'var(--accent-primary)', fontWeight: 700, fontSize: '0.82rem', marginBottom: '0.75rem' }}>
                  Reset link (use this if you don't receive the email)
                </p>
                <button
                  onClick={() => navigate(devUrl.replace(window.location.origin, '').replace('http://localhost:5173', ''))}
                  style={{
                    display: 'inline-flex', alignItems: 'center', gap: '6px',
                    background: 'linear-gradient(135deg,var(--accent-secondary),var(--accent-primary))',
                    color: '#fff', border: 'none', borderRadius: '8px',
                    padding: '0.6rem 1.25rem', fontWeight: 700, fontSize: '0.875rem',
                    cursor: 'pointer', width: '100%', justifyContent: 'center',
                  }}
                >
                  Open Reset Page <ArrowRight size={15} />
                </button>
              </div>
            )}

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <Button
                variant="outline"
                style={{ width: '100%' }}
                onClick={() => { setIsSent(false); setDevUrl(null); }}
              >
                Try a different email
              </Button>
              <Link to="/login" style={{ textDecoration: 'none' }}>
                <Button variant="secondary" style={{ width: '100%' }}>Back to Login</Button>
              </Link>
            </div>
          </div>
        ) : (
          <>
            <h2 className="mb-2 text-center text-gradient">Forgot Password</h2>
            <p className="mb-6 text-center" style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
              Enter your email and we'll send you a reset link.
            </p>

            <form onSubmit={handleSubmit} className="flex-col gap-4">
              <div>
                <label className="mb-2" style={{ display: 'block', color: 'var(--text-secondary)' }}>Email</label>
                <input
                  type="email"
                  className="input"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                  placeholder="Enter your email"
                  autoFocus
                />
              </div>

              <Button
                type="submit"
                variant="primary"
                style={{ width: '100%', marginTop: '0.5rem' }}
                disabled={isLoading}
              >
                {isLoading ? 'Sending…' : 'Send Reset Link'}
              </Button>

              <div className="text-center">
                <span style={{ color: 'var(--text-secondary)' }}>Remember your password? </span>
                <Link to="/login" style={{ color: 'var(--accent-primary)' }}>Login</Link>
              </div>
            </form>
          </>
        )}
      </Card>
    </div>
  );
};

export default ForgotPassword;
