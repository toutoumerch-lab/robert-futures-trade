import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Loader, Play, BookOpen } from 'lucide-react';

const Dashboard = () => {
  const { user, token, logout } = useAuth();
  const navigate = useNavigate();
  const [enrollments, setEnrollments] = useState([]);
  const [loadingEnrollments, setLoadingEnrollments] = useState(true);

  useEffect(() => {
    if (user && user.role !== 'admin' && token) {
      axios.get('http://localhost:5000/api/enrollments/my', {
        headers: { Authorization: `Bearer ${token}` }
      })
      .then(res => setEnrollments(res.data))
      .catch(err => console.error('Error fetching enrollments:', err))
      .finally(() => setLoadingEnrollments(false));
    } else {
      setLoadingEnrollments(false);
    }
  }, [user, token]);

  if (!user) {
    return (
      <div className="container py-16 text-center">
        <h2>Please log in to view the dashboard</h2>
        <Button onClick={() => navigate('/login')} className="mt-4">Go to Login</Button>
      </div>
    );
  }

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <div className="container py-16">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-gradient">Welcome back, {user.name}</h1>
        <Button onClick={handleLogout} variant="outline">Logout</Button>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <Card>
          <h3 className="mb-4">Your Profile</h3>
          <p className="mb-2"><strong style={{color:'var(--text-secondary)'}}>Name:</strong> {user.name}</p>
          <p className="mb-2"><strong style={{color:'var(--text-secondary)'}}>Email:</strong> {user.email}</p>
          <p className="mb-4"><strong style={{color:'var(--text-secondary)'}}>Role:</strong> <span style={{color: user.role === 'admin' ? 'var(--accent-tertiary)' : 'inherit'}}>{user.role}</span></p>
        </Card>
        
        {user.role === 'admin' ? (
          <Card style={{ borderColor: 'var(--accent-secondary)' }}>
            <h3 className="text-gradient mb-4">Admin Controls</h3>
            <div className="flex-col gap-4">
              <Button>Manage Users</Button>
              <Button>Create Blog Post</Button>
              <Button>Manage Courses</Button>
            </div>
          </Card>
        ) : (
          <Card>
            <h3 className="mb-4">Your Progress</h3>
            {loadingEnrollments ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-secondary)' }}>
                <Loader size={16} className="spin-animation" /> Loading enrollments...
              </div>
            ) : enrollments.length === 0 ? (
              <>
                <p style={{color:'var(--text-secondary)'}}>Enroll in courses to track your progress here.</p>
                <Button className="mt-4" onClick={() => navigate('/courses')}>Browse Courses</Button>
              </>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                {enrollments.map(enr => {
                  let cl = enr.completed_lessons || [];
                  if (typeof cl === 'string') cl = JSON.parse(cl);
                  const total = parseInt(enr.total_lessons) || 1; 
                  const compCount = cl.length;
                  const pct = Math.round((compCount / Math.max(total, 1)) * 100);

                  return (
                    <div key={enr.id} style={{ display: 'flex', gap: '1rem', alignItems: 'center', padding: '1rem', borderRadius: '16px', background: 'var(--bg-primary)', border: '1px solid var(--border)' }}>
                       {enr.image_url ? (
                         <img src={`http://localhost:5000${enr.image_url}`} alt={enr.title} style={{ width: '80px', height: '60px', objectFit: 'cover', borderRadius: '8px' }} />
                       ) : (
                         <div style={{ width: '80px', height: '60px', borderRadius: '8px', background: 'var(--bg-secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><BookOpen size={24} color="var(--text-secondary)" /></div>
                       )}
                       <div style={{ flex: 1 }}>
                         <h4 style={{ margin: '0 0 0.25rem 0', fontSize: '1rem', fontWeight: 700, color: 'var(--text-primary)' }}>{enr.title}</h4>
                         <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                           <div style={{ flex: 1, height: '6px', background: 'var(--bg-secondary)', borderRadius: '3px', overflow: 'hidden' }}>
                             <div style={{ height: '100%', width: `${pct}%`, background: '#10b981', transition: 'width 0.3s ease' }}></div>
                           </div>
                           <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#10b981', width: '35px' }}>{pct}%</span>
                         </div>
                       </div>
                       <button onClick={() => navigate(`/course/${enr.course_id}/learn`)} style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'var(--bg-secondary)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'var(--text-primary)' }}>
                         <Play size={16} fill="currentColor" />
                       </button>
                    </div>
                  );
                })}
              </div>
            )}
          </Card>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
