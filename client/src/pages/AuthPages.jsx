import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import Card from '../components/common/Card';
import Button from '../components/common/Button';

export const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const loggedInUser = await login(email.trim(), password);
      if (loggedInUser && loggedInUser.role === 'admin') {
        navigate('/admin');
      } else {
        navigate('/dashboard');
      }
    } catch (err) {
      setError('Invalid credentials');
    }
  };

  return (
    <div className="container py-16 flex justify-center">
      <Card style={{ maxWidth: '400px', width: '100%' }}>
        <h2 className="mb-8 text-center text-gradient">Sign Back In</h2>
        {error && <div className="mb-4" style={{ color: 'var(--error)' }}>{error}</div>}
        <form onSubmit={handleSubmit} className="flex-col gap-4">
          <div>
            <label className="mb-2" style={{ display: 'block', color: 'var(--text-secondary)' }}>Email</label>
            <input type="email" className="input" value={email} onChange={e => setEmail(e.target.value)} required />
          </div>
          <div style={{ position: 'relative' }}>
            <label className="mb-2" style={{ display: 'block', color: 'var(--text-secondary)' }}>Password</label>
            <input 
              type={showPassword ? 'text' : 'password'} 
              className="input" 
              value={password} 
              onChange={e => setPassword(e.target.value)} 
              required 
              style={{ paddingRight: '2.5rem' }}
            />
            <button 
              type="button" 
              onClick={() => setShowPassword(!showPassword)}
              style={{ 
                position: 'absolute', 
                right: '0.75rem', 
                bottom: '0.65rem', 
                background: 'none', 
                border: 'none', 
                cursor: 'pointer', 
                color: 'var(--text-secondary)',
                padding: 0,
                display: 'flex',
                alignItems: 'center'
              }}
            >
              {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
            </button>
          </div>
          <Button type="submit" variant="primary" style={{ width: '100%', marginTop: '1rem' }}>Login</Button>
        </form>
        <div className="mt-4 text-center flex-col gap-2">
          <div>
            <span style={{ color: 'var(--text-secondary)' }}>Don't have an account? </span>
            <Link to="/register" style={{ color: 'var(--accent-primary)' }}>Register</Link>
          </div>
          <div>
            <Link to="/forgot-password" style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', textDecoration: 'underline' }}>
              Forgot Password?
            </Link>
          </div>
        </div>
      </Card>
    </div>
  );
};

export const Register = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await register(name, email, password);
      navigate('/dashboard');
    } catch (err) {
      setError('Registration failed');
    }
  };

  return (
    <div className="container py-16 flex justify-center">
      <Card style={{ maxWidth: '400px', width: '100%' }}>
        <h2 className="mb-8 text-center text-gradient">Create Account</h2>
        {error && <div className="mb-4" style={{ color: 'var(--error)' }}>{error}</div>}
        <form onSubmit={handleSubmit} className="flex-col gap-4">
          <div>
            <label className="mb-2" style={{ display: 'block', color: 'var(--text-secondary)' }}>Full Name</label>
            <input type="text" className="input" value={name} onChange={e => setName(e.target.value)} required />
          </div>
          <div>
            <label className="mb-2" style={{ display: 'block', color: 'var(--text-secondary)' }}>Email</label>
            <input type="email" className="input" value={email} onChange={e => setEmail(e.target.value)} required />
          </div>
          <div style={{ position: 'relative' }}>
            <label className="mb-2" style={{ display: 'block', color: 'var(--text-secondary)' }}>Password</label>
            <input 
              type={showPassword ? 'text' : 'password'} 
              className="input" 
              value={password} 
              onChange={e => setPassword(e.target.value)} 
              required 
              style={{ paddingRight: '2.5rem' }}
            />
            <button 
              type="button" 
              onClick={() => setShowPassword(!showPassword)}
              style={{ 
                position: 'absolute', 
                right: '0.75rem', 
                bottom: '0.65rem', 
                background: 'none', 
                border: 'none', 
                cursor: 'pointer', 
                color: 'var(--text-secondary)',
                padding: 0,
                display: 'flex',
                alignItems: 'center'
              }}
            >
              {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
            </button>
          </div>
          <Button type="submit" variant="primary" style={{ width: '100%', marginTop: '1rem' }}>Register</Button>
        </form>
        <div className="mt-4 text-center">
          <span style={{ color: 'var(--text-secondary)' }}>Already have an account? </span>
          <Link to="/login" style={{ color: 'var(--accent-primary)' }}>Login</Link>
        </div>
      </Card>
    </div>
  );
};
