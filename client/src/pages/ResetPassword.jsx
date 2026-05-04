import { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Eye, EyeOff, CheckCircle } from 'lucide-react';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import { useToast } from '../context/ToastContext';

const ResetPassword = () => {
  const { token } = useParams();
  const navigate = useNavigate();
  const { addToast } = useToast();

  const [password, setPassword]               = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword]       = useState(false);
  const [showConfirm, setShowConfirm]         = useState(false);
  const [isLoading, setIsLoading]             = useState(false);
  const [isSuccess, setIsSuccess]             = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (password !== confirmPassword) {
      addToast('error', 'Error', 'Passwords do not match');
      return;
    }
    if (password.length < 6) {
      addToast('error', 'Error', 'Password must be at least 6 characters');
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch(`http://localhost:5001/api/auth/reset-password/${token}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to reset password');
      }

      setIsSuccess(true);
      addToast('success', 'Success', 'Your password has been reset successfully');
      setTimeout(() => navigate('/login'), 3000);
    } catch (err) {
      addToast('error', 'Error', err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const eyeBtn = (show, toggle) => (
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
            <p style={{ color: 'var(--text-secondary)' }}>
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
            {/* New password */}
            <div style={{ position: 'relative' }}>
              <label className="mb-2" style={{ display: 'block', color: 'var(--text-secondary)' }}>
                New Password
              </label>
              <input
                type={showPassword ? 'text' : 'password'}
                className="input"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                placeholder="Enter new password"
                style={{ paddingRight: '2.5rem' }}
              />
              {eyeBtn(showPassword, () => setShowPassword(v => !v))}
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
                onChange={e => setConfirmPassword(e.target.value)}
                required
                placeholder="Confirm new password"
                style={{ paddingRight: '2.5rem' }}
              />
              {eyeBtn(showConfirm, () => setShowConfirm(v => !v))}
              {/* Live mismatch hint */}
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
              <Link to="/login" style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
                Back to Login
              </Link>
            </div>
          </form>
        )}
      </Card>
    </div>
  );
};

export default ResetPassword;
