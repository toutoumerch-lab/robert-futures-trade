import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';
import { CheckCircle, XCircle } from 'lucide-react';
import Card from '../components/common/Card';
import Button from '../components/common/Button';

const VerifyEmail = () => {
  const { token } = useParams();
  const [status, setStatus] = useState('loading'); // loading, success, error
  const [message, setMessage] = useState('Verifying your email address...');

  useEffect(() => {
    const verify = async () => {
      try {
        const res = await axios.get(`http://localhost:5001/api/auth/verify-email/${token}`);
        setStatus('success');
        setMessage(res.data.message || 'Email successfully verified!');
        
        // Update local user state if logged in
        const storedUserStr = localStorage.getItem('user');
        if (storedUserStr) {
          try {
             const storedUser = JSON.parse(storedUserStr);
             storedUser.is_verified = true;
             localStorage.setItem('user', JSON.stringify(storedUser));
          } catch(e) {}
        }
      } catch (err) {
        setStatus('error');
        setMessage(err.response?.data?.error || 'Verification failed. The link may be invalid or expired.');
      }
    };

    if (token) {
      verify();
    }
  }, [token]);

  return (
    <div className="container py-16 flex justify-center items-center min-h-[60vh]">
      <Card style={{ maxWidth: '400px', width: '100%', textAlign: 'center', padding: '3rem 2rem' }}>
        {status === 'loading' && (
          <div className="flex-col items-center gap-4">
            <div className="spinner" style={{ width: '40px', height: '40px', border: '3px solid var(--border)', borderTopColor: 'var(--accent-primary)', borderRadius: '50%', animation: 'spin 1s linear infinite', margin: '0 auto' }}></div>
            <h2 className="text-xl font-bold mt-4" style={{ color: 'var(--text-primary)' }}>Verifying...</h2>
            <p style={{ color: 'var(--text-secondary)' }}>Please wait a moment.</p>
          </div>
        )}

        {status === 'success' && (
          <div className="flex-col items-center gap-4 animation-fadeIn">
            <CheckCircle size={56} style={{ color: '#10b981', margin: '0 auto' }} />
            <h2 className="text-2xl font-bold mt-4 mb-2 text-gradient">Email Verified!</h2>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem' }}>{message}</p>
            <Link to="/dashboard" style={{ textDecoration: 'none' }}>
              <Button style={{ width: '100%' }}>Go to Dashboard</Button>
            </Link>
          </div>
        )}

        {status === 'error' && (
          <div className="flex-col items-center gap-4 animation-fadeIn">
            <XCircle size={56} style={{ color: '#ef4444', margin: '0 auto' }} />
            <h2 className="text-2xl font-bold mt-4 mb-2 text-gradient">Verification Failed</h2>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem' }}>{message}</p>
            <Link to="/login" style={{ textDecoration: 'none' }}>
              <Button variant="outline" style={{ width: '100%' }}>Return to Login</Button>
            </Link>
          </div>
        )}
      </Card>
    </div>
  );
};

export default VerifyEmail;
