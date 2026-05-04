import { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Eye, EyeOff, CheckCircle, X } from 'lucide-react';
import Card from '../components/common/Card';
import Button from '../components/common/Button';

const ResetPassword = () => {
  const { token } = useParams();
  const navigate  = useNavigate();

  const [password, setPassword]               = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword]       = useState(false);
  const [showConfirm, setShowConfirm]         = useState(false);
  const [isLoading, setIsLoading]             = useState(false);
  const [isSuccess, setIsSuccess]             = useState(false);
  const [error, setError]                     = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) { setError('Passwords do not match.'); return; }
    if (password.length < 6)          { setError('Password must be at least 6 characters.'); return; }

    setIsLoading(true);
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/auth/reset-password/${token}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Failed to reset password. The link may have expired.');
        return;
      }

      setIsSuccess(true);
      setTimeout(() => navigate('/login'), 3000);
    } catch {
      setError('Could not connect to the server. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const EyeBtn = ({ show, toggle }) => (
    <button
      type="button"
      onClick={toggle}
      style={{
        position: 'absolute', right: '0.75rem', bottom: '0.65rem',
        background: 'none', border: 'none', cursor: 'pointer',
        color: 'var(--text-secondary)', padding: 0,
        display: 'flex', alignItems: 'center',
      }}
    >
      {show ? <EyeOff size={20} /> : <Eye size={20} />}
    </button>
  );

  return (
    <div className="container py-16 flex justify-center">
      <Card style={{ maxWidth: '400px', width: '100%' }}>
        <h2 className="mb-8 text-center text-gradient">Reset Password</h2>

        {isSuccess ? (
          <div className="text-center flex-col gap-4">
            <CheckCircle size={52} style={{ color: '#10b981', margin: '0 auto 1rem' }} />
            <p style={{ color: 'var(--text-secondary)', lineHeight: 1.6 }}>
              Your password has been reset successfully.<br />Redirecting to login…
            </p>
            <div className="mt-6">
              <Link to="/login">
                <Button variant="primary" style={{ width: '100%' }}>Go to Login</Button>
              </Link>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex-col gap-4">

            {/* Inline error banner */}
            {error && (
              <div style={{
                display: 'flex', alignItems: 'flex-start', gap: '10px',
                background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.3)',
                borderRadius: '12px', padding: '0.9rem 1.1rem',
              }}>
                <X size={16} style={{ color: '#f87171', flexShrink: 0, marginTop: '2px' }} />
                <span style={{ color: '#f87171', fontSize: '0.875rem', fontWeight: 600, lineHeight: 1.4 }}>
                  {error}
                  {error.toLowerCase().includes('expired') && (
                    <span> — <Link to="/forgot-password" style={{ color: '#f87171', fontWeight: 800, textDecoration: 'underline' }}>request a new link</Link></span>
                  )}
                </span>
              </div>
            )}

            {/* New password */}
            <div style={{ position: 'relative' }}>
              <label className="mb-2" style={{ display: 'block', color: 'var(--text-secondary)' }}>
                New Password
              </label>
              <input
                type={showPassword ? 'text' : 'password'}
                className="input"
                value={password}
                onChange={e => { setPassword(e.target.value); setError(''); }}
                required
                placeholder="Enter new password"
                style={{ paddingRight: '2.5rem', width: '100%' }}
              />
              <EyeBtn show={showPassword} toggle={() => setShowPassword(v => !v)} />
            </div>

            {/* Confirm password */}
            <div style={{ position: 'relative' }}>
              <label className="mb-2" style={{ display: 'block', color: 'var(--text-secondary)' }}>
                Confirm Password
              </label>
              <input
                type={showConfirm ? 'text' : 'password'}
                className="input"
                value={confirmPassword}
                onChange={e => { setConfirmPassword(e.target.value); setError(''); }}
                required
                placeholder="Confirm new password"
                style={{ paddingRight: '2.5rem', width: '100%' }}
              />
              <EyeBtn show={showConfirm} toggle={() => setShowConfirm(v => !v)} />
              {confirmPassword && password !== confirmPassword && (
                <p style={{ color: '#ef4444', fontSize: '0.8rem', marginTop: '4px' }}>
                  Passwords do not match
                </p>
              )}
            </div>

            <Button
              type="submit"
              variant="primary"
              style={{ width: '100%', marginTop: '0.5rem' }}
              disabled={isLoading}
            >
              {isLoading ? 'Resetting…' : 'Reset Password'}
            </Button>

            <div className="mt-2 text-center">
              <Link to="/forgot-password" style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
                Request a new link
              </Link>
            </div>
          </form>
        )}
      </Card>
    </div>
  );
};

export default ResetPassword;
