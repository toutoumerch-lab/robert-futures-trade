import React, { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import { useToast } from '../context/ToastContext';

const ResetPassword = () => {
  const { token } = useParams();
  const navigate = useNavigate();
  const { addToast } = useToast();
  
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

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
      
      // Redirect to login after 3 seconds
      setTimeout(() => {
        navigate('/login');
      }, 3000);
      
    } catch (err) {
      addToast('error', 'Error', err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container py-16 flex justify-center">
      <Card style={{ maxWidth: '400px', width: '100%' }}>
        <h2 className="mb-8 text-center text-gradient">Reset Password</h2>
        
        {isSuccess ? (
          <div className="text-center flex-col gap-4">
            <p style={{ color: 'var(--text-secondary)' }}>
              Your password has been reset successfully. You will be redirected to the login page shortly.
            </p>
            <div className="mt-6">
              <Link to="/login">
                <Button variant="primary" style={{ width: '100%' }}>Go to Login</Button>
              </Link>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex-col gap-4">
            <div>
              <label className="mb-2" style={{ display: 'block', color: 'var(--text-secondary)' }}>New Password</label>
              <input 
                type="password" 
                className="input" 
                value={password} 
                onChange={e => setPassword(e.target.value)} 
                required 
                placeholder="Enter new password"
              />
            </div>
            <div>
              <label className="mb-2" style={{ display: 'block', color: 'var(--text-secondary)' }}>Confirm Password</label>
              <input 
                type="password" 
                className="input" 
                value={confirmPassword} 
                onChange={e => setConfirmPassword(e.target.value)} 
                required 
                placeholder="Confirm new password"
              />
            </div>
            <Button 
              type="submit" 
              variant="primary" 
              style={{ width: '100%', marginTop: '1rem' }}
              disabled={isLoading}
            >
              {isLoading ? 'Resetting...' : 'Reset Password'}
            </Button>
          </form>
        )}
      </Card>
    </div>
  );
};

export default ResetPassword;
