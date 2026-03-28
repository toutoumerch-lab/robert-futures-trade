import React from 'react';
import { useAuth } from '../context/AuthContext';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import { useNavigate } from 'react-router-dom';

const Dashboard = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

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
            <p style={{color:'var(--text-secondary)'}}>Enroll in courses to track your progress here.</p>
            <Button className="mt-4" onClick={() => navigate('/courses')}>Browse Courses</Button>
          </Card>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
