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

// Country codes for phone selector
const COUNTRY_CODES = [
  { code: '+1',   flag: '🇺🇸', name: 'US/CA' },
  { code: '+44',  flag: '🇬🇧', name: 'UK' },
  { code: '+33',  flag: '🇫🇷', name: 'France' },
  { code: '+49',  flag: '🇩🇪', name: 'Germany' },
  { code: '+34',  flag: '🇪🇸', name: 'Spain' },
  { code: '+39',  flag: '🇮🇹', name: 'Italy' },
  { code: '+31',  flag: '🇳🇱', name: 'Netherlands' },
  { code: '+61',  flag: '🇦🇺', name: 'Australia' },
  { code: '+91',  flag: '🇮🇳', name: 'India' },
  { code: '+971', flag: '🇦🇪', name: 'UAE' },
  { code: '+966', flag: '🇸🇦', name: 'Saudi Arabia' },
  { code: '+212', flag: '🇲🇦', name: 'Morocco' },
  { code: '+213', flag: '🇩🇿', name: 'Algeria' },
  { code: '+216', flag: '🇹🇳', name: 'Tunisia' },
  { code: '+20',  flag: '🇪🇬', name: 'Egypt' },
  { code: '+90',  flag: '🇹🇷', name: 'Turkey' },
  { code: '+55',  flag: '🇧🇷', name: 'Brazil' },
  { code: '+52',  flag: '🇲🇽', name: 'Mexico' },
];

export const Register = () => {
  // Step 1 — account details
  const [name, setName]           = useState('');
  const [email, setEmail]         = useState('');
  const [password, setPassword]   = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [countryCode, setCountryCode]   = useState('+216');
  const [phoneNumber, setPhoneNumber]   = useState('');

  // Step 2 — phone OTP
  const [step, setStep]       = useState(1); // 1 = form, 2 = phone OTP
  const [digits, setDigits]   = useState(['', '', '', '', '', '']);
  const [phone, setPhone]     = useState('');   // full E.164 stored after step 1
  const [otpEmail, setOtpEmail] = useState(''); // email returned after phone verify

  const [error, setError]       = useState('');
  const [loading, setLoading]   = useState(false);
  const [resendCooldown, setResendCooldown] = useState(60);
  const [canResend, setCanResend]           = useState(false);
  const [resendMsg, setResendMsg]           = useState('');

  const inputRefs = useState(() => Array(6).fill(null))[0];
  const refs      = useState(() => Array.from({ length: 6 }, () => ({ current: null })))[0];

  const { register, verifyPhoneOtp, sendPhoneOtp } = useAuth();
  const navigate = useNavigate();

  // Countdown for resend
  useState(() => {});
  React.useEffect(() => {
    if (step !== 2) return;
    if (resendCooldown === 0) { setCanResend(true); return; }
    const t = setTimeout(() => setResendCooldown(c => c - 1), 1000);
    return () => clearTimeout(t);
  }, [resendCooldown, step]);

  // ── Step 1: submit registration details ──
  const handleRegister = async (e) => {
    e.preventDefault();
    setError('');
    const raw = phoneNumber.replace(/\D/g, '');
    if (!raw) { setError('Phone number is required'); return; }
    const fullPhone = `${countryCode}${raw}`;
    if (!/^\+[1-9]\d{6,14}$/.test(fullPhone)) {
      setError('Enter a valid phone number (digits only, no spaces)');
      return;
    }
    setLoading(true);
    try {
      const data = await register(name, email, password, fullPhone);
      setPhone(fullPhone);
      setOtpEmail(data.email);
      setStep(2);
      setResendCooldown(60);
      setCanResend(false);
    } catch (err) {
      setError(err.response?.data?.error || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  // ── Step 2: handle OTP digit input ──
  const handleDigit = (i, value) => {
    if (!/^\d?$/.test(value)) return;
    const next = [...digits];
    next[i] = value.slice(-1);
    setDigits(next);
    setError('');
    if (value && i < 5) refs[i + 1].current?.focus();
  };

  const handleKeyDown = (i, e) => {
    if (e.key === 'Backspace' && !digits[i] && i > 0) refs[i - 1].current?.focus();
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    const next = ['', '', '', '', '', ''];
    for (let i = 0; i < pasted.length; i++) next[i] = pasted[i];
    setDigits(next);
    refs[Math.min(pasted.length, 5)].current?.focus();
  };

  // ── Step 2: verify phone OTP ──
  const handleVerifyPhone = async (e) => {
    e.preventDefault();
    const code = digits.join('');
    if (code.length < 6) { setError('Enter all 6 digits'); return; }
    setLoading(true);
    setError('');
    try {
      const data = await verifyPhoneOtp(phone, code);
      navigate('/verify-code', { state: { email: data.email } });
    } catch (err) {
      setError(err.response?.data?.error || 'Invalid or expired code');
      setDigits(['', '', '', '', '', '']);
      refs[0].current?.focus();
    } finally {
      setLoading(false);
    }
  };

  // ── Step 2: resend SMS ──
  const handleResend = async () => {
    if (!canResend) return;
    setError('');
    setResendMsg('');
    try {
      await sendPhoneOtp(phone);
      setCanResend(false);
      setResendCooldown(60);
      setResendMsg('New code sent!');
      setTimeout(() => setResendMsg(''), 4000);
    } catch {
      setError('Failed to resend. Please try again.');
    }
  };

  // ────────────────────────────────────────────
  // STEP 1 — Registration form
  // ────────────────────────────────────────────
  if (step === 1) return (
    <div className="container py-16 flex justify-center">
      <Card style={{ maxWidth: '420px', width: '100%' }}>
        <h2 className="mb-2 text-center text-gradient">Create Account</h2>
        <p style={{ color: 'var(--text-secondary)', textAlign: 'center', fontSize: '0.875rem', marginBottom: '1.75rem' }}>
          You'll verify your phone after this step
        </p>

        {error && (
          <div style={{ marginBottom: '1rem', padding: '0.75rem 1rem', background: 'rgba(239,68,68,0.1)', color: '#ef4444', borderRadius: '8px', fontSize: '0.875rem' }}>
            {error}
          </div>
        )}

        <form onSubmit={handleRegister} className="flex-col gap-4">
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
            <button type="button" onClick={() => setShowPassword(!showPassword)}
              style={{ position: 'absolute', right: '0.75rem', bottom: '0.65rem', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)', padding: 0, display: 'flex', alignItems: 'center' }}>
              {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
            </button>
          </div>

          {/* Phone field */}
          <div>
            <label className="mb-2" style={{ display: 'block', color: 'var(--text-secondary)' }}>Phone Number</label>
            <div style={{ display: 'flex', gap: '8px' }}>
              <select
                value={countryCode}
                onChange={e => setCountryCode(e.target.value)}
                style={{
                  background: 'var(--bg-secondary)', border: '1px solid var(--border-color)',
                  borderRadius: '8px', color: 'var(--text-primary)', padding: '0.65rem 0.5rem',
                  fontSize: '0.9rem', cursor: 'pointer', flexShrink: 0,
                }}
              >
                {COUNTRY_CODES.map(c => (
                  <option key={c.code + c.name} value={c.code}>
                    {c.flag} {c.code}
                  </option>
                ))}
              </select>
              <input
                type="tel"
                className="input"
                placeholder="e.g. 2125551234"
                value={phoneNumber}
                onChange={e => setPhoneNumber(e.target.value.replace(/[^\d\s\-]/g, ''))}
                style={{ flex: 1 }}
                required
              />
            </div>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.75rem', marginTop: '0.35rem' }}>
              We'll send a verification code via SMS
            </p>
          </div>

          <Button type="submit" variant="primary" style={{ width: '100%', marginTop: '0.5rem' }} disabled={loading}>
            {loading ? 'Sending code…' : 'Continue →'}
          </Button>
        </form>

        <div className="mt-4 text-center">
          <span style={{ color: 'var(--text-secondary)' }}>Already have an account? </span>
          <Link to="/login" style={{ color: 'var(--accent-primary)' }}>Login</Link>
        </div>
      </Card>
    </div>
  );

  // ────────────────────────────────────────────
  // STEP 2 — Phone OTP verification
  // ────────────────────────────────────────────
  return (
    <div className="container py-16 flex justify-center">
      <Card style={{ maxWidth: '420px', width: '100%' }}>

        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{
            width: '64px', height: '64px', borderRadius: '50%',
            background: 'rgba(99,102,241,0.12)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 1rem', fontSize: '28px',
          }}>📱</div>
          <h2 className="text-gradient" style={{ marginBottom: '0.5rem' }}>Verify your phone</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: 1.6 }}>
            We sent a 6-digit code to<br />
            <strong style={{ color: 'var(--text-primary)' }}>{phone}</strong>
          </p>
          <button
            onClick={() => { setStep(1); setDigits(['','','','','','']); setError(''); }}
            style={{ background: 'none', border: 'none', color: 'var(--accent-primary)', cursor: 'pointer', fontSize: '0.8rem', marginTop: '0.35rem' }}
          >
            ← Wrong number?
          </button>
        </div>

        {/* Alerts */}
        {error && (
          <div style={{ marginBottom: '1rem', padding: '0.75rem 1rem', background: 'rgba(239,68,68,0.1)', color: '#ef4444', borderRadius: '8px', textAlign: 'center', fontSize: '0.875rem' }}>
            {error}
          </div>
        )}
        {resendMsg && (
          <div style={{ marginBottom: '1rem', padding: '0.75rem 1rem', background: 'rgba(16,185,129,0.1)', color: '#10b981', borderRadius: '8px', textAlign: 'center', fontSize: '0.875rem' }}>
            {resendMsg}
          </div>
        )}

        {/* OTP inputs */}
        <form onSubmit={handleVerifyPhone}>
          <div style={{ display: 'flex', gap: '8px', justifyContent: 'center', marginBottom: '1.5rem' }}>
            {digits.map((digit, i) => (
              <input
                key={i}
                ref={el => refs[i].current = el}
                type="text"
                inputMode="numeric"
                maxLength={1}
                value={digit}
                onChange={e => handleDigit(i, e.target.value)}
                onKeyDown={e => handleKeyDown(i, e)}
                onPaste={i === 0 ? handlePaste : undefined}
                autoFocus={i === 0}
                style={{
                  width: '48px', height: '56px', textAlign: 'center',
                  fontSize: '1.5rem', fontWeight: '700', borderRadius: '10px',
                  border: `2px solid ${digit ? 'var(--accent-primary)' : 'var(--border-color)'}`,
                  background: 'var(--bg-secondary)', color: 'var(--text-primary)',
                  outline: 'none', transition: 'border-color 0.15s',
                }}
              />
            ))}
          </div>

          <Button type="submit" variant="primary" style={{ width: '100%' }} disabled={loading}>
            {loading ? 'Verifying…' : 'Verify Phone →'}
          </Button>
        </form>

        {/* Resend */}
        <div style={{ marginTop: '1.5rem', textAlign: 'center' }}>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
            Didn't receive it?{' '}
            <button
              onClick={handleResend}
              disabled={!canResend}
              style={{
                background: 'none', border: 'none', padding: 0,
                color: canResend ? 'var(--accent-primary)' : 'var(--text-secondary)',
                cursor: canResend ? 'pointer' : 'default',
                textDecoration: canResend ? 'underline' : 'none',
                fontSize: '0.85rem',
              }}
            >
              {canResend ? 'Resend code' : `Resend in ${resendCooldown}s`}
            </button>
          </p>
        </div>

      </Card>
    </div>
  );
};
