import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import { useToast } from '../context/ToastContext';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSent, setIsSent] = useState(false);
  const [devUrl, setDevUrl] = useState(null);
  const { addToast } = useToast();

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
        addToast('info', 'Dev Mode', 'Reset link generated below.');
      } else {
        addToast('success', 'Reset link sent!', 'Check your email for the password reset link.');
      }
    } catch (err) {
      addToast('error', 'Error', err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container py-16 flex justify-center">
      <Card style={{ maxWidth: '400px', width: '100%' }}>
        <h2 className="mb-8 text-center text-gradient">Forgot Password</h2>
        
        {isSent ? (
          <div className="text-center flex-col gap-4">
            <p style={{ color: 'var(--text-secondary)' }}>
              If an account exists for <strong>{email}</strong>, you will receive a password reset link shortly.
            </p>
            {devUrl && (
              <div className="mt-4 p-4 rounded" style={{ backgroundColor: 'rgba(255, 255, 255, 0.05)', border: '1px solid var(--border-color)' }}>
                <p className="mb-2" style={{ color: 'var(--accent-primary)', fontSize: '0.9rem', fontWeight: 'bold' }}>Dev Mode Fallback Link:</p>
                <a href={devUrl} style={{ wordBreak: 'break-all', color: 'var(--text-primary)', textDecoration: 'underline' }}>
                  {devUrl}
                </a>
              </div>
            )}
            <div className="mt-6">
              <Link to="/login">
                <Button variant="secondary" style={{ width: '100%' }}>Return to Login</Button>
              </Link>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex-col gap-4">
            <p className="mb-4 text-center" style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
              Enter your email address and we'll send you a link to reset your password.
            </p>
            <div>
              <label className="mb-2" style={{ display: 'block', color: 'var(--text-secondary)' }}>Email</label>
              <input 
                type="email" 
                className="input" 
                value={email} 
                onChange={e => setEmail(e.target.value)} 
                required 
                placeholder="Enter your email"
              />
            </div>
            <Button 
              type="submit" 
              variant="primary" 
              style={{ width: '100%', marginTop: '1rem' }}
              disabled={isLoading}
            >
              {isLoading ? 'Sending...' : 'Send Reset Link'}
            </Button>
            
            <div className="mt-4 text-center">
              <span style={{ color: 'var(--text-secondary)' }}>Remember your password? </span>
              <Link to="/login" style={{ color: 'var(--accent-primary)' }}>Login</Link>
            </div>
          </form>
        )}
      </Card>
    </div>
  );
};

export default ForgotPassword;
