import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { Loader, CheckCircle, AlertCircle } from 'lucide-react';
import Button from '../components/common/Button';

const PaymentSuccess = () => {
  const [status, setStatus] = useState('verifying');
  const [courseId, setCourseId] = useState(null);
  const navigate = useNavigate();
  const location = useLocation();
  const { user, token } = useAuth();

  useEffect(() => {
    // Parse session_id from URL
    const queryParams = new URLSearchParams(location.search);
    const sessionId = queryParams.get('session_id');

    if (!sessionId) {
      setStatus('error');
      return;
    }

    // Call backend to verify the Stripe checkout & finish enrollment
    axios.get(`${import.meta.env.VITE_API_URL}/api/checkouts/verify?session_id=${sessionId}`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {}
    })
      .then(res => {
        if (res.data.success) {
          setStatus('success');
          setCourseId(res.data.courseId);
          
          // Auto-redirect to the course learning view after a moment
          setTimeout(() => {
            navigate(`/course/${res.data.courseId}/learn`);
          }, 3000);
        } else {
          setStatus('error');
        }
      })
      .catch((err) => {
        console.error('Session verification failed:', err);
        setStatus('error');
      });

  }, [location.search, token, navigate]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '80vh', padding: '2rem', textAlign: 'center' }}>
      {status === 'verifying' && (
        <>
          <Loader size={64} className="spin-animation" style={{ color: '#3b82f6', marginBottom: '2rem' }} />
          <h2 style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--text-primary)' }}>Verifying Payment...</h2>
          <p style={{ color: 'var(--text-secondary)', marginTop: '1rem', fontSize: '1.1rem' }}>Please do not close this window. We are securely unlocking your course.</p>
        </>
      )}

      {status === 'success' && (
        <div style={{ animation: 'fade-in 0.5s ease-out' }}>
          <CheckCircle size={80} style={{ color: '#10b981', marginBottom: '1.5rem', margin: '0 auto' }} />
          <h2 style={{ fontSize: '2.5rem', fontWeight: 900, color: 'var(--text-primary)', marginBottom: '1rem' }}>Payment Successful!</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '1.2rem' }}>Your course has been unlocked. Redirecting you to the learning environment...</p>
          <div style={{ marginTop: '2rem' }}>
             <Button onClick={() => navigate(`/course/${courseId}/learn`)}>Enter Course Now</Button>
          </div>
        </div>
      )}

      {status === 'error' && (
        <div style={{ animation: 'fade-in 0.5s ease-out' }}>
          <AlertCircle size={80} style={{ color: '#ef4444', marginBottom: '1.5rem', margin: '0 auto' }} />
          <h2 style={{ fontSize: '2.5rem', fontWeight: 900, color: 'var(--text-primary)', marginBottom: '1rem' }}>Payment Verification Failed</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '1.2rem', maxWidth: '600px', margin: '0 auto' }}>We couldn't verify your session. If you paid and see this, please contact support and your progress will be restored.</p>
          <div style={{ marginTop: '2.5rem' }}>
             <Button variant="outline" onClick={() => navigate('/dashboard')}>Return to Dashboard</Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default PaymentSuccess;
