import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import {
  User, Lock, BookOpen, Building2, Camera, Eye, EyeOff,
  CheckCircle, Award, Play, Loader, ExternalLink, X, Download,
  ChevronRight, TrendingUp,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

const API = `${import.meta.env.VITE_API_URL}`;
const imgUrl = (url) => {
  if (!url) return null;
  if (url.startsWith('http')) return url;
  const normalized = url.startsWith('/uploads/') ? `/api${url}` : url;
  return `${API}${normalized}`;
};

/* ── tiny helpers ─────────────────────────────────────────────── */
const pct = (enr) => {
  let cl = enr.completed_lessons || [];
  if (typeof cl === 'string') try { cl = JSON.parse(cl); } catch { cl = []; }
  const total = parseInt(enr.total_lessons) || 1;
  return { cl, total, pct: Math.round((cl.length / Math.max(total, 1)) * 100) };
};

/* ── Certificate Modal ────────────────────────────────────────── */
const CertificateModal = ({ course, user, onClose }) => {
  const date = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });

  const handlePrint = () => {
    const win = window.open('', '_blank');
    win.document.write(`<!DOCTYPE html><html><head>
      <title>Certificate – ${course.title}</title>
      <style>
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;700&family=Inter:wght@400;600&display=swap');
        * { margin:0; padding:0; box-sizing:border-box; }
        body { background:#fff; display:flex; align-items:center; justify-content:center; min-height:100vh; font-family:'Inter',sans-serif; }
        .cert {
          width:800px; padding:60px 72px;
          border:10px solid #1d4ed8;
          outline:3px solid #1d4ed8;
          outline-offset:8px;
          text-align:center;
          position:relative;
        }
        .cert::before {
          content:'';
          position:absolute; inset:20px;
          border:1px solid rgba(29,78,216,0.2);
          pointer-events:none;
        }
        .logo { font-size:13px; letter-spacing:3px; text-transform:uppercase; color:#6b7280; margin-bottom:32px; }
        .title { font-family:'Playfair Display',serif; font-size:42px; color:#1d4ed8; margin-bottom:8px; }
        .subtitle { font-size:13px; letter-spacing:2px; text-transform:uppercase; color:#9ca3af; margin-bottom:40px; }
        .presented { font-size:14px; color:#6b7280; margin-bottom:12px; }
        .name { font-family:'Playfair Display',serif; font-size:36px; color:#111827; border-bottom:2px solid #1d4ed8; display:inline-block; padding:0 40px 8px; margin-bottom:32px; }
        .completed { font-size:14px; color:#6b7280; margin-bottom:12px; }
        .course { font-family:'Playfair Display',serif; font-size:24px; color:#7c3aed; margin-bottom:40px; }
        .meta { display:flex; justify-content:space-between; align-items:flex-end; margin-top:40px; padding-top:24px; border-top:1px solid #e5e7eb; }
        .meta-item { text-align:center; }
        .meta-label { font-size:11px; letter-spacing:2px; text-transform:uppercase; color:#9ca3af; margin-bottom:4px; }
        .meta-value { font-size:14px; font-weight:600; color:#374151; }
        @media print { body { margin:0; } .cert { border-width:8px; } }
      </style>
    </head><body>
      <div class="cert">
        <div class="logo">Robert Trades Futures</div>
        <div class="title">Certificate</div>
        <div class="subtitle">of completion</div>
        <div class="presented">This certifies that</div>
        <div class="name">${user.name}</div>
        <div class="completed">has successfully completed</div>
        <div class="course">${course.title}</div>
        <div class="meta">
          <div class="meta-item"><div class="meta-label">Date Issued</div><div class="meta-value">${date}</div></div>
          <div class="meta-item"><div class="meta-label">Platform</div><div class="meta-value">roberttrades.com</div></div>
          <div class="meta-item"><div class="meta-label">Status</div><div class="meta-value">✓ Verified</div></div>
        </div>
      </div>
    </body></html>`);
    win.document.close();
    win.focus();
    setTimeout(() => { win.print(); }, 400);
  };

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 9999,
      background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(6px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem',
    }} onClick={onClose}>
      <div style={{
        background: 'linear-gradient(135deg,#0f172a,#1e1b4b)',
        border: '1px solid rgba(255,255,255,0.1)',
        borderRadius: '24px', padding: '2.5rem', maxWidth: '680px', width: '100%',
        position: 'relative',
      }} onClick={e => e.stopPropagation()}>

        {/* close */}
        <button onClick={onClose} style={{ position: 'absolute', top: '1.25rem', right: '1.25rem', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: 'var(--text-secondary)', cursor: 'pointer', padding: '6px', display: 'flex' }}>
          <X size={16} />
        </button>

        {/* preview */}
        <div style={{
          border: '6px solid #1d4ed8', borderRadius: '8px', padding: '3rem 2.5rem',
          textAlign: 'center', marginBottom: '1.75rem', position: 'relative',
          background: 'linear-gradient(135deg,rgba(29,78,216,0.04),rgba(124,58,237,0.04))',
        }}>
          <div style={{ position: 'absolute', inset: '12px', border: '1px solid rgba(29,78,216,0.2)', borderRadius: '4px', pointerEvents: 'none' }} />
          <p style={{ fontSize: '0.72rem', letterSpacing: '3px', textTransform: 'uppercase', color: 'var(--text-secondary)', marginBottom: '1rem' }}>Robert Trades Futures</p>
          <h2 style={{ fontFamily: 'Georgia,serif', fontSize: '2.2rem', color: '#60a5fa', marginBottom: '4px', fontWeight: 700 }}>Certificate</h2>
          <p style={{ fontSize: '0.72rem', letterSpacing: '2px', textTransform: 'uppercase', color: 'var(--text-secondary)', marginBottom: '2rem' }}>of completion</p>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '0.5rem' }}>This certifies that</p>
          <div style={{ fontFamily: 'Georgia,serif', fontSize: '1.8rem', color: 'var(--text-primary)', fontWeight: 700, borderBottom: '2px solid #3b82f6', display: 'inline-block', padding: '0 2rem 8px', marginBottom: '1.5rem' }}>
            {user.name}
          </div>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '0.5rem' }}>has successfully completed</p>
          <p style={{ fontFamily: 'Georgia,serif', fontSize: '1.3rem', color: '#a78bfa', fontWeight: 700, marginBottom: '2rem' }}>{course.title}</p>
          <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid rgba(255,255,255,0.07)', paddingTop: '1.25rem' }}>
            {[['Date Issued', date], ['Platform', 'roberttrades.com'], ['Status', '✓ Verified']].map(([label, val]) => (
              <div key={label} style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '0.65rem', letterSpacing: '2px', textTransform: 'uppercase', color: 'var(--text-secondary)', marginBottom: '4px' }}>{label}</div>
                <div style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-primary)' }}>{val}</div>
              </div>
            ))}
          </div>
        </div>

        <button onClick={handlePrint} style={{
          width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
          padding: '0.85rem', borderRadius: '12px', border: 'none', cursor: 'pointer',
          background: 'linear-gradient(135deg,#1d4ed8,#7c3aed)', color: '#fff',
          fontWeight: 800, fontSize: '0.95rem', fontFamily: 'var(--font-sans)',
        }}>
          <Download size={17} /> Download / Print Certificate
        </button>
      </div>
    </div>
  );
};

/* ── Tab button ───────────────────────────────────────────────── */
const Tab = ({ active, onClick, icon: Icon, label }) => (
  <button onClick={onClick} style={{
    display: 'flex', alignItems: 'center', gap: '8px',
    padding: '0.7rem 1.1rem', border: 'none', background: active ? 'rgba(37,99,235,0.12)' : 'transparent',
    borderRadius: '10px', cursor: 'pointer', fontFamily: 'var(--font-sans)', fontWeight: 700,
    fontSize: '0.875rem', color: active ? '#60a5fa' : 'var(--text-secondary)',
    transition: 'all 0.18s', whiteSpace: 'nowrap',
  }}>
    <Icon size={15} /> {label}
  </button>
);

/* ── Section card wrapper ─────────────────────────────────────── */
const Section = ({ title, children }) => (
  <div style={{
    background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.07)',
    borderRadius: '20px', padding: '2rem', marginBottom: '1.25rem',
  }}>
    {title && <h3 style={{ margin: '0 0 1.5rem', fontSize: '1rem', fontWeight: 800, color: 'var(--text-primary)' }}>{title}</h3>}
    {children}
  </div>
);

/* ── Input field ──────────────────────────────────────────────── */
const Field = ({ label, ...props }) => (
  <div style={{ marginBottom: '1.25rem' }}>
    <label style={{ display: 'block', marginBottom: '6px', fontSize: '0.83rem', fontWeight: 600, color: 'var(--text-secondary)' }}>{label}</label>
    <input className="input" style={{ width: '100%' }} {...props} />
  </div>
);

/* ══════════════════════════════════════════════════════════════
   Settings Page
══════════════════════════════════════════════════════════════ */
export default function Settings() {
  const { user, token, updateUser } = useAuth();
  const navigate = useNavigate();
  const { addToast } = useToast();

  const [tab, setTab] = useState('profile');
  const [enrollments, setEnrollments] = useState([]);
  const [propFirmViews, setPropFirmViews] = useState([]);
  const [loading, setLoading] = useState(true);

  // Profile form
  const [name, setName]   = useState('');
  const [email, setEmail] = useState('');
  const [savingProfile, setSavingProfile] = useState(false);

  // Avatar
  const fileRef = useRef(null);
  const [avatarPreview, setAvatarPreview] = useState(null);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  // Password form
  const [currentPw, setCurrentPw]   = useState('');
  const [newPw, setNewPw]           = useState('');
  const [confirmPw, setConfirmPw]   = useState('');
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew]         = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [savingPw, setSavingPw]       = useState(false);
  const [pwFeedback, setPwFeedback]   = useState(null); // { type:'error'|'success', msg:string }

  // Certificate modal
  const [certCourse, setCertCourse] = useState(null);

  const headers = { Authorization: `Bearer ${token}` };

  useEffect(() => {
    if (!user || !token) { navigate('/login'); return; }
    setName(user.name || '');
    setEmail(user.email || '');

    Promise.all([
      axios.get(`${API}/api/enrollments/my`, { headers }),
      axios.get(`${API}/api/users/me/prop-firm-views`, { headers }),
    ]).then(([enrRes, pfRes]) => {
      setEnrollments(enrRes.data || []);
      setPropFirmViews(pfRes.data || []);
    }).catch(console.error)
      .finally(() => setLoading(false));
  }, [user, token]);

  if (!user) return null;

  /* ── Avatar handlers ─────────────────────────────── */
  const onAvatarChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setAvatarPreview(URL.createObjectURL(file));
    setUploadingAvatar(true);
    try {
      const form = new FormData();
      form.append('avatar', file);
      const res = await axios.post(`${API}/api/users/me/avatar`, form, {
        headers: { ...headers, 'Content-Type': 'multipart/form-data' },
      });
      updateUser(res.data);
      addToast('success', 'Success', 'Profile picture updated.');
    } catch (err) {
      addToast('error', 'Error', err.response?.data?.error || 'Upload failed.');
      setAvatarPreview(null);
    } finally {
      setUploadingAvatar(false);
    }
  };

  const onRemoveAvatar = async () => {
    setUploadingAvatar(true);
    try {
      const res = await axios.delete(`${API}/api/users/me/avatar`, { headers });
      updateUser(res.data);
      setAvatarPreview(null);
      addToast('success', 'Success', 'Profile picture removed.');
    } catch {
      addToast('error', 'Error', 'Could not remove picture.');
    } finally {
      setUploadingAvatar(false);
    }
  };

  /* ── Profile save ────────────────────────────────── */
  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setSavingProfile(true);
    try {
      const res = await axios.patch(`${API}/api/users/me/profile`, { name, email }, { headers });
      updateUser(res.data);
      addToast('success', 'Saved', 'Profile updated successfully.');
    } catch (err) {
      addToast('error', 'Error', err.response?.data?.error || 'Could not save.');
    } finally {
      setSavingProfile(false);
    }
  };

  /* ── Password save ───────────────────────────────── */
  const handleChangePassword = async (e) => {
    e.preventDefault();
    setPwFeedback(null);
    if (newPw !== confirmPw) { setPwFeedback({ type: 'error', msg: 'New passwords do not match.' }); return; }
    if (newPw.length < 6)    { setPwFeedback({ type: 'error', msg: 'New password must be at least 6 characters.' }); return; }
    setSavingPw(true);
    try {
      await axios.patch(`${API}/api/users/me/password`, { currentPassword: currentPw, newPassword: newPw }, { headers });
      setPwFeedback({ type: 'success', msg: 'Password changed successfully!' });
      setCurrentPw(''); setNewPw(''); setConfirmPw('');
    } catch (err) {
      const msg = err.response?.data?.error || 'Could not change password. Please try again.';
      setPwFeedback({ type: 'error', msg });
    } finally {
      setSavingPw(false);
    }
  };

  /* ── Avatar display ──────────────────────────────── */
  const avatarSrc = avatarPreview || (user.avatar_url ? `${API}${user.avatar_url}` : null);

  const EyeBtn = ({ show, toggle }) => (
    <button type="button" onClick={toggle} style={{
      position: 'absolute', right: '0.75rem', bottom: '0.65rem',
      background: 'none', border: 'none', cursor: 'pointer',
      color: 'var(--text-secondary)', padding: 0, display: 'flex', alignItems: 'center',
    }}>
      {show ? <EyeOff size={18} /> : <Eye size={18} />}
    </button>
  );

  return (
    <div style={{ minHeight: '100vh', paddingBottom: '6rem' }}>
      {/* ── Header ─────────────────────────────────── */}
      <div style={{
        background: 'linear-gradient(135deg,rgba(37,99,235,0.08),rgba(139,92,246,0.05))',
        borderBottom: '1px solid rgba(255,255,255,0.05)',
        padding: '3rem 0 2.5rem',
      }}>
        <div className="container">
          <h1 style={{ margin: 0, fontSize: 'clamp(1.6rem,3vw,2rem)', fontWeight: 900, letterSpacing: '-1px', color: 'var(--text-primary)' }}>
            Account Settings
          </h1>
          <p style={{ margin: '0.4rem 0 0', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
            Manage your profile, security, and progress
          </p>
        </div>
      </div>

      <div className="container" style={{ paddingTop: '2rem' }}>
        <div style={{ display: 'flex', gap: '2rem', alignItems: 'flex-start', flexWrap: 'wrap' }}>

          {/* ── Sidebar nav ─────────────────────────── */}
          <div style={{
            width: '220px', flexShrink: 0,
            background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.07)',
            borderRadius: '20px', padding: '1rem', display: 'flex', flexDirection: 'column', gap: '4px',
          }}>
            <Tab active={tab==='profile'}   onClick={()=>setTab('profile')}   icon={User}      label="Profile" />
            <Tab active={tab==='security'}  onClick={()=>setTab('security')}  icon={Lock}      label="Security" />
            <Tab active={tab==='progress'}  onClick={()=>setTab('progress')}  icon={BookOpen}  label="My Courses" />
            <Tab active={tab==='propfirms'} onClick={()=>setTab('propfirms')} icon={Building2} label="Prop Firms" />
          </div>

          {/* ── Content ─────────────────────────────── */}
          <div style={{ flex: 1, minWidth: 0 }}>

            {loading ? (
              <div style={{ display:'flex', alignItems:'center', gap:'12px', padding:'4rem', color:'var(--text-secondary)' }}>
                <Loader size={20} style={{ animation:'spin 1s linear infinite' }} /> Loading…
              </div>
            ) : (

              <>
                {/* ══ PROFILE TAB ══ */}
                {tab === 'profile' && (
                  <>
                    {/* Avatar */}
                    <Section title="Profile Picture">
                      <div style={{ display:'flex', alignItems:'center', gap:'1.75rem', flexWrap:'wrap' }}>
                        <div style={{ position:'relative', flexShrink:0 }}>
                          {avatarSrc ? (
                            <img src={avatarSrc} alt="avatar" style={{
                              width:'96px', height:'96px', borderRadius:'24px',
                              objectFit:'cover', border:'2px solid rgba(255,255,255,0.1)',
                            }} />
                          ) : (
                            <div style={{
                              width:'96px', height:'96px', borderRadius:'24px',
                              background:'linear-gradient(135deg,#1d4ed8,#7c3aed)',
                              display:'flex', alignItems:'center', justifyContent:'center',
                              fontSize:'2.2rem', fontWeight:900, color:'#fff',
                              border:'2px solid rgba(255,255,255,0.1)',
                            }}>
                              {user.name?.[0]?.toUpperCase() || '?'}
                            </div>
                          )}
                          {uploadingAvatar && (
                            <div style={{ position:'absolute', inset:0, borderRadius:'24px', background:'rgba(0,0,0,0.6)', display:'flex', alignItems:'center', justifyContent:'center' }}>
                              <Loader size={20} color="#fff" style={{ animation:'spin 1s linear infinite' }} />
                            </div>
                          )}
                        </div>

                        <div style={{ display:'flex', flexDirection:'column', gap:'0.6rem' }}>
                          <input ref={fileRef} type="file" accept="image/*" style={{ display:'none' }} onChange={onAvatarChange} />
                          <button
                            onClick={() => fileRef.current?.click()}
                            disabled={uploadingAvatar}
                            style={{ display:'flex', alignItems:'center', gap:'7px', padding:'0.6rem 1.25rem', borderRadius:'10px', border:'1px solid rgba(255,255,255,0.15)', background:'rgba(255,255,255,0.04)', color:'var(--text-primary)', cursor:'pointer', fontFamily:'var(--font-sans)', fontWeight:700, fontSize:'0.85rem', transition:'all 0.2s' }}
                          >
                            <Camera size={15} /> Change Picture
                          </button>
                          {(avatarSrc && user.avatar_url) && (
                            <button
                              onClick={onRemoveAvatar}
                              disabled={uploadingAvatar}
                              style={{ display:'flex', alignItems:'center', gap:'7px', padding:'0.6rem 1.25rem', borderRadius:'10px', border:'1px solid rgba(239,68,68,0.25)', background:'transparent', color:'#f87171', cursor:'pointer', fontFamily:'var(--font-sans)', fontWeight:700, fontSize:'0.85rem' }}
                            >
                              <X size={13} /> Remove
                            </button>
                          )}
                          <p style={{ fontSize:'0.75rem', color:'var(--text-secondary)', margin:0 }}>JPG, PNG, WebP — max 5MB</p>
                        </div>
                      </div>
                    </Section>

                    {/* Name & Email */}
                    <Section title="Personal Info">
                      <form onSubmit={handleSaveProfile}>
                        <Field label="Full Name" type="text" value={name} onChange={e=>setName(e.target.value)} placeholder="Your name" required />
                        <Field label="Email Address" type="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="your@email.com" required />
                        <button
                          type="submit"
                          disabled={savingProfile}
                          style={{ padding:'0.7rem 1.75rem', borderRadius:'10px', border:'none', background:'linear-gradient(135deg,#1d4ed8,#7c3aed)', color:'#fff', cursor:'pointer', fontFamily:'var(--font-sans)', fontWeight:800, fontSize:'0.875rem' }}
                        >
                          {savingProfile ? 'Saving…' : 'Save Changes'}
                        </button>
                      </form>
                    </Section>
                  </>
                )}

                {/* ══ SECURITY TAB ══ */}
                {tab === 'security' && (
                  <Section title="Change Password">
                    <form onSubmit={handleChangePassword}>

                      {/* Single feedback banner — only one can show at a time */}
                      {pwFeedback && (
                        <div style={{
                          display:'flex', alignItems:'center', gap:'10px',
                          background: pwFeedback.type === 'success' ? 'rgba(16,185,129,0.08)' : 'rgba(239,68,68,0.08)',
                          border: `1px solid ${pwFeedback.type === 'success' ? 'rgba(16,185,129,0.25)' : 'rgba(239,68,68,0.3)'}`,
                          borderRadius:'12px', padding:'0.9rem 1.1rem', marginBottom:'1.5rem',
                        }}>
                          {pwFeedback.type === 'success'
                            ? <CheckCircle size={16} style={{ color:'#10b981', flexShrink:0 }} />
                            : <X size={16} style={{ color:'#f87171', flexShrink:0 }} />
                          }
                          <span style={{ color: pwFeedback.type === 'success' ? '#10b981' : '#f87171', fontSize:'0.875rem', fontWeight:600 }}>
                            {pwFeedback.msg}
                          </span>
                        </div>
                      )}

                      <div style={{ position:'relative', marginBottom:'1.25rem' }}>
                        <label style={{ display:'block', marginBottom:'6px', fontSize:'0.83rem', fontWeight:600, color:'var(--text-secondary)' }}>Current Password</label>
                        <input className="input" type={showCurrent?'text':'password'} value={currentPw} onChange={e=>{setCurrentPw(e.target.value);setPwFeedback(null);}} placeholder="Enter current password" required style={{ width:'100%', paddingRight:'2.5rem' }} />
                        <EyeBtn show={showCurrent} toggle={()=>setShowCurrent(v=>!v)} />
                      </div>

                      <div style={{ position:'relative', marginBottom:'1.25rem' }}>
                        <label style={{ display:'block', marginBottom:'6px', fontSize:'0.83rem', fontWeight:600, color:'var(--text-secondary)' }}>New Password</label>
                        <input className="input" type={showNew?'text':'password'} value={newPw} onChange={e=>{setNewPw(e.target.value);setPwFeedback(null);}} placeholder="Enter new password" required style={{ width:'100%', paddingRight:'2.5rem' }} />
                        <EyeBtn show={showNew} toggle={()=>setShowNew(v=>!v)} />
                      </div>

                      <div style={{ position:'relative', marginBottom:'1.75rem' }}>
                        <label style={{ display:'block', marginBottom:'6px', fontSize:'0.83rem', fontWeight:600, color:'var(--text-secondary)' }}>Confirm New Password</label>
                        <input className="input" type={showConfirm?'text':'password'} value={confirmPw} onChange={e=>{setConfirmPw(e.target.value);setPwFeedback(null);}} placeholder="Confirm new password" required style={{ width:'100%', paddingRight:'2.5rem' }} />
                        <EyeBtn show={showConfirm} toggle={()=>setShowConfirm(v=>!v)} />
                        {confirmPw && newPw !== confirmPw && (
                          <p style={{ color:'#ef4444', fontSize:'0.78rem', marginTop:'4px' }}>Passwords do not match</p>
                        )}
                      </div>

                      <button
                        type="submit"
                        disabled={savingPw}
                        style={{ padding:'0.7rem 1.75rem', borderRadius:'10px', border:'none', background:'linear-gradient(135deg,#1d4ed8,#7c3aed)', color:'#fff', cursor:'pointer', fontFamily:'var(--font-sans)', fontWeight:800, fontSize:'0.875rem', opacity: savingPw ? 0.7 : 1 }}
                      >
                        {savingPw ? 'Updating…' : 'Update Password'}
                      </button>
                    </form>
                  </Section>
                )}

                {/* ══ MY COURSES TAB ══ */}
                {tab === 'progress' && (
                  enrollments.length === 0 ? (
                    <div style={{ textAlign:'center', padding:'5rem 2rem', background:'rgba(255,255,255,0.02)', borderRadius:'24px', border:'1px dashed rgba(255,255,255,0.08)' }}>
                      <BookOpen size={48} style={{ color:'var(--accent-primary)', opacity:0.3, marginBottom:'1rem' }} />
                      <h3 style={{ color:'var(--text-primary)', marginBottom:'0.5rem' }}>No courses yet</h3>
                      <p style={{ color:'var(--text-secondary)', marginBottom:'1.5rem' }}>Browse our library to start learning.</p>
                      <button onClick={()=>navigate('/courses')} style={{ padding:'0.75rem 2rem', background:'var(--accent-primary)', color:'#fff', border:'none', borderRadius:'12px', fontWeight:800, cursor:'pointer' }}>
                        Browse Courses
                      </button>
                    </div>
                  ) : (
                    <div style={{ display:'flex', flexDirection:'column', gap:'1rem' }}>
                      {enrollments.map(enr => {
                        const { cl, total, pct: progress } = pct(enr);
                        const done = progress >= 100;
                        return (
                          <div key={enr.id} style={{
                            background:'rgba(255,255,255,0.025)', border:'1px solid rgba(255,255,255,0.07)',
                            borderRadius:'18px', overflow:'hidden', display:'flex',
                            transition:'border-color 0.2s',
                          }}
                            onMouseEnter={e=>e.currentTarget.style.borderColor='rgba(37,99,235,0.3)'}
                            onMouseLeave={e=>e.currentTarget.style.borderColor='rgba(255,255,255,0.07)'}
                          >
                            {/* Thumbnail */}
                            <div style={{ width:'160px', minWidth:'160px', flexShrink:0, background: enr.image_url?`url(${API}${enr.image_url}) center/cover`:'linear-gradient(135deg,rgba(37,99,235,0.2),rgba(139,92,246,0.15))', display:'flex', alignItems:'center', justifyContent:'center' }}>
                              {!enr.image_url && <BookOpen size={28} style={{ color:'rgba(255,255,255,0.2)' }} />}
                            </div>

                            {/* Info */}
                            <div style={{ flex:1, padding:'1.25rem 1.5rem', display:'flex', flexDirection:'column', justifyContent:'center', gap:'0.5rem' }}>
                              <div style={{ display:'flex', alignItems:'center', gap:'8px', flexWrap:'wrap' }}>
                                <h3 style={{ margin:0, fontSize:'1rem', fontWeight:800, color:'var(--text-primary)' }}>{enr.title}</h3>
                                {done && (
                                  <span style={{ padding:'2px 9px', borderRadius:'99px', fontSize:'0.65rem', fontWeight:800, background:'rgba(16,185,129,0.12)', color:'#10b981', border:'1px solid rgba(16,185,129,0.25)' }}>✓ Complete</span>
                                )}
                              </div>
                              <div style={{ display:'flex', alignItems:'center', gap:'8px' }}>
                                <div style={{ flex:1, height:'6px', background:'rgba(255,255,255,0.07)', borderRadius:'3px', overflow:'hidden', maxWidth:'260px' }}>
                                  <div style={{ height:'100%', width:`${progress}%`, background:done?'#10b981':'linear-gradient(90deg,#1d4ed8,#7c3aed)', borderRadius:'3px', transition:'width 0.5s ease' }} />
                                </div>
                                <span style={{ fontSize:'0.78rem', fontWeight:800, color:done?'#10b981':'var(--text-secondary)' }}>{progress}%</span>
                                <span style={{ fontSize:'0.75rem', color:'var(--text-secondary)' }}>{cl.length}/{total} lessons</span>
                              </div>
                              {!done && (
                                <div style={{ display:'flex', alignItems:'center', gap:'6px', color:'var(--text-secondary)', fontSize:'0.75rem' }}>
                                  <TrendingUp size={12} /> {total - cl.length} lesson{total-cl.length!==1?'s':''} remaining
                                </div>
                              )}
                            </div>

                            {/* Actions */}
                            <div style={{ display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:'0.6rem', padding:'0 1.25rem', flexShrink:0 }}>
                              <button
                                onClick={()=>navigate(`/course/${enr.course_id}/learn`)}
                                style={{ display:'flex', alignItems:'center', gap:'6px', padding:'0.55rem 1rem', borderRadius:'10px', border:'none', background:'linear-gradient(135deg,#1d4ed8,#7c3aed)', color:'#fff', cursor:'pointer', fontFamily:'var(--font-sans)', fontWeight:800, fontSize:'0.78rem', whiteSpace:'nowrap' }}
                              >
                                <Play size={11} fill="white" /> {done?'Review':'Continue'}
                              </button>
                              {done && (
                                <button
                                  onClick={()=>setCertCourse(enr)}
                                  style={{ display:'flex', alignItems:'center', gap:'6px', padding:'0.55rem 1rem', borderRadius:'10px', border:'1px solid rgba(245,158,11,0.3)', background:'rgba(245,158,11,0.06)', color:'#f59e0b', cursor:'pointer', fontFamily:'var(--font-sans)', fontWeight:800, fontSize:'0.78rem', whiteSpace:'nowrap' }}
                                >
                                  <Award size={12} /> Certificate
                                </button>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )
                )}

                {/* ══ PROP FIRMS TAB ══ */}
                {tab === 'propfirms' && (
                  propFirmViews.length === 0 ? (
                    <div style={{ textAlign:'center', padding:'5rem 2rem', background:'rgba(255,255,255,0.02)', borderRadius:'24px', border:'1px dashed rgba(255,255,255,0.08)' }}>
                      <Building2 size={48} style={{ color:'var(--accent-primary)', opacity:0.3, marginBottom:'1rem' }} />
                      <h3 style={{ color:'var(--text-primary)', marginBottom:'0.5rem' }}>No prop firms visited yet</h3>
                      <p style={{ color:'var(--text-secondary)', marginBottom:'1.5rem' }}>Prop firms you visit will appear here.</p>
                      <button onClick={()=>navigate('/prop-firms')} style={{ padding:'0.75rem 2rem', background:'var(--accent-primary)', color:'#fff', border:'none', borderRadius:'12px', fontWeight:800, cursor:'pointer' }}>
                        Explore Prop Firms
                      </button>
                    </div>
                  ) : (
                    <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(280px,1fr))', gap:'1rem' }}>
                      {propFirmViews.map(firm => (
                        <div key={firm.id} style={{
                          background:'rgba(255,255,255,0.025)', border:'1px solid rgba(255,255,255,0.07)',
                          borderRadius:'16px', padding:'1.25rem', display:'flex', flexDirection:'column', gap:'0.75rem',
                          transition:'border-color 0.2s',
                        }}
                          onMouseEnter={e=>e.currentTarget.style.borderColor='rgba(37,99,235,0.3)'}
                          onMouseLeave={e=>e.currentTarget.style.borderColor='rgba(255,255,255,0.07)'}
                        >
                          <div style={{ display:'flex', alignItems:'center', gap:'12px' }}>
                            {firm.logo_url ? (
                              <img src={imgUrl(firm.logo_url)} alt={firm.name} style={{ width:'44px', height:'44px', borderRadius:'10px', objectFit:'contain', background:'rgba(255,255,255,0.05)', padding:'4px' }} />
                            ) : (
                              <div style={{ width:'44px', height:'44px', borderRadius:'10px', background:'rgba(37,99,235,0.12)', display:'flex', alignItems:'center', justifyContent:'center' }}>
                                <Building2 size={20} style={{ color:'#3b82f6' }} />
                              </div>
                            )}
                            <div style={{ flex:1, minWidth:0 }}>
                              <div style={{ fontWeight:800, color:'var(--text-primary)', fontSize:'0.9rem', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{firm.name}</div>
                              {firm.group_name && <div style={{ fontSize:'0.72rem', color:'var(--text-secondary)', marginTop:'2px' }}>{firm.group_name}</div>}
                            </div>
                          </div>

                          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                            <span style={{ fontSize:'0.72rem', color:'var(--text-secondary)' }}>
                              Last visited {new Date(firm.viewed_at).toLocaleDateString('en-US',{month:'short',day:'numeric'})}
                            </span>
                            {firm.rating && (
                              <span style={{ fontSize:'0.75rem', fontWeight:700, color:'#f59e0b' }}>★ {firm.rating}</span>
                            )}
                          </div>

                          <div style={{ display:'flex', gap:'0.5rem', marginTop:'auto' }}>
                            <button onClick={()=>navigate('/prop-firms')} style={{ flex:1, padding:'0.5rem', borderRadius:'8px', border:'1px solid rgba(255,255,255,0.1)', background:'rgba(255,255,255,0.03)', color:'var(--text-secondary)', cursor:'pointer', fontFamily:'var(--font-sans)', fontWeight:700, fontSize:'0.78rem', display:'flex', alignItems:'center', justifyContent:'center', gap:'5px' }}>
                              <ChevronRight size={12} /> View
                            </button>
                            {(firm.affiliate_link || firm.website) && (
                              <a href={firm.affiliate_link || firm.website} target="_blank" rel="noopener noreferrer" style={{ flex:1, padding:'0.5rem', borderRadius:'8px', border:'1px solid rgba(37,99,235,0.25)', background:'rgba(37,99,235,0.06)', color:'#60a5fa', cursor:'pointer', fontFamily:'var(--font-sans)', fontWeight:700, fontSize:'0.78rem', display:'flex', alignItems:'center', justifyContent:'center', gap:'5px', textDecoration:'none' }}>
                                <ExternalLink size={11} /> Website
                              </a>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {/* Certificate modal */}
      {certCourse && (
        <CertificateModal
          course={certCourse}
          user={user}
          onClose={() => setCertCourse(null)}
        />
      )}
    </div>
  );
}
