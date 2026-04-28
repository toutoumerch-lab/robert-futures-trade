import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import {
  User, BookOpen, Star, Play, Globe, MapPin,
  TrendingUp, Award, Clock, CheckCircle, LogOut,
  ChevronRight, Loader,
} from 'lucide-react';

const API = 'http://localhost:5000';

/* ─── helpers ──────────────────────────────────────────────── */
const toFlag = (code) => {
  if (!code || code.length !== 2) return '';
  return String.fromCodePoint(...code.toUpperCase().split('').map(c => 0x1F1E6 - 65 + c.charCodeAt(0)));
};

const StarRow = ({ rating, max = 5 }) => (
  <div style={{ display: 'flex', gap: '2px' }}>
    {Array.from({ length: max }).map((_, i) => (
      <Star
        key={i}
        size={13}
        fill={i < Math.round(rating) ? '#f59e0b' : 'none'}
        stroke={i < Math.round(rating) ? '#f59e0b' : 'rgba(255,255,255,0.2)'}
      />
    ))}
  </div>
);

/* ─── stat card ─────────────────────────────────────────────── */
const StatCard = ({ icon: Icon, label, value, color = '#3b82f6' }) => (
  <div style={{
    background: 'rgba(255,255,255,0.025)',
    border: '1px solid rgba(255,255,255,0.07)',
    borderRadius: '18px', padding: '1.25rem 1.5rem',
    display: 'flex', flexDirection: 'column', gap: '0.5rem',
  }}>
    <div style={{ width: '38px', height: '38px', borderRadius: '12px', background: `${color}18`, border: `1px solid ${color}30`, display: 'flex', alignItems: 'center', justifyContent: 'center', color }}>
      <Icon size={18} />
    </div>
    <div style={{ fontSize: '1.8rem', fontWeight: 900, color: 'var(--text-primary)', letterSpacing: '-1px', lineHeight: 1 }}>{value}</div>
    <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', fontWeight: 600 }}>{label}</div>
  </div>
);

/* ══════════════════════════════════════════════════════════════
   Profile Page
══════════════════════════════════════════════════════════════ */
export default function Profile() {
  const { user, token, logout } = useAuth();
  const navigate = useNavigate();

  const [enrollments, setEnrollments]   = useState([]);
  const [myReviews, setMyReviews]       = useState([]);
  const [profile, setProfile]           = useState(null);
  const [loading, setLoading]           = useState(true);
  const [activeTab, setActiveTab]       = useState('courses'); // courses | reviews

  useEffect(() => {
    if (!user || !token) { navigate('/login'); return; }

    Promise.all([
      axios.get(`${API}/api/enrollments/my`,   { headers: { Authorization: `Bearer ${token}` } }),
      axios.get(`${API}/api/auth/me`,           { headers: { Authorization: `Bearer ${token}` } }),
      axios.get(`${API}/api/reviews/my-all`,    { headers: { Authorization: `Bearer ${token}` } }).catch(() => ({ data: [] })),
    ]).then(([enrRes, meRes, revRes]) => {
      setEnrollments(enrRes.data || []);
      setProfile(meRes.data);
      setMyReviews(revRes.data || []);
    }).catch(console.error)
      .finally(() => setLoading(false));
  }, [user, token]);

  const handleLogout = () => { logout(); navigate('/'); };

  if (!user) return null;

  /* ── aggregate stats ──────────────────────────────────────── */
  const totalLessonsCompleted = enrollments.reduce((sum, enr) => {
    let cl = enr.completed_lessons || [];
    if (typeof cl === 'string') try { cl = JSON.parse(cl); } catch { cl = []; }
    return sum + cl.length;
  }, 0);

  const avgProgress = enrollments.length === 0 ? 0 : Math.round(
    enrollments.reduce((sum, enr) => {
      let cl = enr.completed_lessons || [];
      if (typeof cl === 'string') try { cl = JSON.parse(cl); } catch { cl = []; }
      const total = parseInt(enr.total_lessons) || 1;
      return sum + Math.round((cl.length / total) * 100);
    }, 0) / enrollments.length
  );

  const completedCourses = enrollments.filter(enr => {
    let cl = enr.completed_lessons || [];
    if (typeof cl === 'string') try { cl = JSON.parse(cl); } catch { cl = []; }
    const total = parseInt(enr.total_lessons) || 1;
    return cl.length >= total;
  }).length;

  return (
    <div style={{ minHeight: '100vh', padding: '0 0 6rem' }}>
      {/* ── Hero banner ─────────────────────────────────────── */}
      <div style={{
        background: 'linear-gradient(135deg, rgba(37,99,235,0.08) 0%, rgba(139,92,246,0.05) 100%)',
        borderBottom: '1px solid rgba(255,255,255,0.05)',
        padding: '4rem 0 3rem',
      }}>
        <div className="container">
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '2rem', flexWrap: 'wrap' }}>
            {/* Avatar */}
            <div style={{
              width: '88px', height: '88px', borderRadius: '24px', flexShrink: 0,
              background: 'linear-gradient(135deg, #1d4ed8, #7c3aed)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '2.2rem', fontWeight: 900, color: '#fff',
              boxShadow: '0 8px 32px rgba(37,99,235,0.4)',
              border: '2px solid rgba(255,255,255,0.1)',
            }}>
              {user.name?.[0]?.toUpperCase() || '?'}
            </div>

            {/* Info */}
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap', marginBottom: '0.4rem' }}>
                <h1 style={{ margin: 0, fontSize: 'clamp(1.6rem,3vw,2.2rem)', fontWeight: 900, letterSpacing: '-1px', color: 'var(--text-primary)' }}>
                  {user.name}
                </h1>
                <span style={{ padding: '3px 12px', borderRadius: '99px', fontSize: '0.72rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.06em', background: user.role === 'admin' ? 'rgba(139,92,246,0.15)' : 'rgba(16,185,129,0.12)', color: user.role === 'admin' ? '#a78bfa' : '#10b981', border: `1px solid ${user.role === 'admin' ? 'rgba(139,92,246,0.3)' : 'rgba(16,185,129,0.25)'}` }}>
                  {user.role}
                </span>
              </div>
              <p style={{ margin: '0 0 0.75rem', color: 'var(--text-secondary)', fontSize: '0.95rem' }}>{user.email}</p>

              {/* Country */}
              {(profile?.country || profile?.country_code) && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-secondary)', fontSize: '0.85rem', fontWeight: 600 }}>
                  <MapPin size={13} />
                  <span style={{ fontSize: '1rem' }}>{toFlag(profile.country_code)}</span>
                  <span>{profile.country}</span>
                </div>
              )}
            </div>

            {/* Logout */}
            <button
              onClick={handleLogout}
              style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '9px 18px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.1)', background: 'transparent', color: 'var(--text-secondary)', cursor: 'pointer', fontFamily: 'var(--font-sans)', fontWeight: 700, fontSize: '0.85rem', transition: 'all 0.2s' }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = '#ef4444'; e.currentTarget.style.color = '#ef4444'; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'; e.currentTarget.style.color = 'var(--text-secondary)'; }}
            >
              <LogOut size={14} /> Log out
            </button>
          </div>
        </div>
      </div>

      <div className="container" style={{ paddingTop: '2.5rem' }}>
        {loading ? (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '6rem', color: 'var(--text-secondary)', gap: '12px' }}>
            <Loader size={20} style={{ animation: 'spin 1s linear infinite' }} /> Loading your profile…
          </div>
        ) : (
          <>
            {/* ── Stat cards ───────────────────────────────────── */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '1rem', marginBottom: '2.5rem' }}>
              <StatCard icon={BookOpen}     label="Enrolled Courses"    value={enrollments.length}      color="#3b82f6" />
              <StatCard icon={CheckCircle}  label="Completed Courses"   value={completedCourses}        color="#10b981" />
              <StatCard icon={TrendingUp}   label="Avg Progress"        value={`${avgProgress}%`}       color="#8b5cf6" />
              <StatCard icon={Award}        label="Lessons Done"        value={totalLessonsCompleted}   color="#f59e0b" />
              <StatCard icon={Star}         label="Reviews Written"     value={myReviews.length}        color="#ec4899" />
            </div>

            {/* ── Tab nav ──────────────────────────────────────── */}
            <div style={{ display: 'flex', gap: 0, borderBottom: '1px solid rgba(255,255,255,0.07)', marginBottom: '2rem' }}>
              {[
                { key: 'courses', label: 'My Courses', icon: BookOpen },
                { key: 'reviews', label: 'My Reviews', icon: Star },
              ].map(({ key, label, icon: Icon }) => (
                <button key={key} onClick={() => setActiveTab(key)}
                  style={{ display: 'flex', alignItems: 'center', gap: '7px', padding: '10px 20px', border: 'none', background: 'transparent', cursor: 'pointer', fontFamily: 'var(--font-sans)', fontWeight: 700, fontSize: '0.88rem', color: activeTab === key ? '#60a5fa' : 'var(--text-secondary)', borderBottom: activeTab === key ? '2px solid #3b82f6' : '2px solid transparent', marginBottom: '-1px', transition: 'all 0.2s' }}>
                  <Icon size={14} /> {label}
                </button>
              ))}
            </div>

            {/* ── COURSES tab ───────────────────────────────────── */}
            {activeTab === 'courses' && (
              enrollments.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '5rem 2rem', background: 'rgba(255,255,255,0.02)', borderRadius: '24px', border: '1px dashed rgba(255,255,255,0.08)' }}>
                  <BookOpen size={48} style={{ color: 'var(--accent-primary)', opacity: 0.3, marginBottom: '1rem' }} />
                  <h3 style={{ color: 'var(--text-primary)', marginBottom: '0.5rem' }}>No courses yet</h3>
                  <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>Explore our course library and start learning today.</p>
                  <button onClick={() => navigate('/courses')} style={{ padding: '0.75rem 2rem', background: 'var(--accent-primary)', color: '#fff', border: 'none', borderRadius: '12px', fontWeight: 800, fontSize: '0.9rem', cursor: 'pointer' }}>
                    Browse Courses
                  </button>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  {enrollments.map(enr => {
                    let cl = enr.completed_lessons || [];
                    if (typeof cl === 'string') try { cl = JSON.parse(cl); } catch { cl = []; }
                    const total = parseInt(enr.total_lessons) || 1;
                    const pct = Math.round((cl.length / Math.max(total, 1)) * 100);
                    const done = pct >= 100;

                    return (
                      <div key={enr.id} style={{ background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '18px', overflow: 'hidden', display: 'flex', transition: 'border-color 0.2s' }}
                        onMouseEnter={e => e.currentTarget.style.borderColor = 'rgba(37,99,235,0.3)'}
                        onMouseLeave={e => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.07)'}
                      >
                        {/* Thumbnail */}
                        <div style={{ width: '180px', minWidth: '180px', flexShrink: 0, background: enr.image_url ? `url(${API}${enr.image_url}) center/cover` : 'linear-gradient(135deg,rgba(37,99,235,0.2),rgba(139,92,246,0.15))', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          {!enr.image_url && <BookOpen size={32} style={{ color: 'rgba(255,255,255,0.2)' }} />}
                        </div>

                        {/* Info */}
                        <div style={{ flex: 1, padding: '1.25rem 1.75rem', display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: '0.5rem' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-primary)' }}>{enr.title}</h3>
                            {done && (
                              <span style={{ padding: '2px 9px', borderRadius: '99px', fontSize: '0.68rem', fontWeight: 800, background: 'rgba(16,185,129,0.12)', color: '#10b981', border: '1px solid rgba(16,185,129,0.25)' }}>
                                ✓ Complete
                              </span>
                            )}
                          </div>

                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <div style={{ flex: 1, height: '6px', background: 'rgba(255,255,255,0.07)', borderRadius: '3px', overflow: 'hidden', maxWidth: '280px' }}>
                              <div style={{ height: '100%', width: `${pct}%`, background: done ? '#10b981' : 'linear-gradient(90deg,#1d4ed8,#7c3aed)', borderRadius: '3px', transition: 'width 0.5s ease' }} />
                            </div>
                            <span style={{ fontSize: '0.8rem', fontWeight: 800, color: done ? '#10b981' : 'var(--text-secondary)' }}>{pct}%</span>
                            <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>{cl.length}/{total} lessons</span>
                          </div>
                        </div>

                        {/* Action */}
                        <div style={{ display: 'flex', alignItems: 'center', padding: '0 1.5rem', flexShrink: 0 }}>
                          <button
                            onClick={() => navigate(`/course/${enr.course_id}/learn`)}
                            style={{ display: 'flex', alignItems: 'center', gap: '7px', padding: '0.6rem 1.25rem', borderRadius: '12px', border: 'none', background: 'linear-gradient(135deg,#1d4ed8,#7c3aed)', color: '#fff', cursor: 'pointer', fontFamily: 'var(--font-sans)', fontWeight: 800, fontSize: '0.82rem', boxShadow: '0 4px 14px rgba(37,99,235,0.35)', transition: 'opacity 0.2s' }}
                            onMouseEnter={e => e.currentTarget.style.opacity = '0.85'}
                            onMouseLeave={e => e.currentTarget.style.opacity = '1'}
                          >
                            <Play size={12} fill="white" /> {done ? 'Review' : 'Continue'}
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )
            )}

            {/* ── REVIEWS tab ───────────────────────────────────── */}
            {activeTab === 'reviews' && (
              myReviews.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '5rem 2rem', background: 'rgba(255,255,255,0.02)', borderRadius: '24px', border: '1px dashed rgba(255,255,255,0.08)' }}>
                  <Star size={48} style={{ color: '#f59e0b', opacity: 0.3, marginBottom: '1rem' }} />
                  <h3 style={{ color: 'var(--text-primary)', marginBottom: '0.5rem' }}>No reviews yet</h3>
                  <p style={{ color: 'var(--text-secondary)' }}>Rate lessons as you learn to help other students.</p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                  {myReviews.map(rv => (
                    <div key={rv.id} style={{ background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '16px', padding: '1.1rem 1.5rem', display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
                      <div style={{ flexShrink: 0, width: '36px', height: '36px', borderRadius: '10px', background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#f59e0b' }}>
                        <Star size={16} fill="#f59e0b" />
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '4px' }}>
                          <div>
                            <span style={{ fontWeight: 800, color: 'var(--text-primary)', fontSize: '0.9rem' }}>{rv.lesson_title || 'Lesson'}</span>
                            <span style={{ color: 'var(--text-secondary)', fontSize: '0.78rem', marginLeft: '8px' }}>in {rv.course_title}</span>
                          </div>
                          <StarRow rating={rv.rating} />
                        </div>
                        {rv.comment && <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '0.85rem', lineHeight: 1.6 }}>{rv.comment}</p>}
                        <span style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', opacity: 0.6, marginTop: '4px', display: 'block' }}>
                          {new Date(rv.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                        </span>
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
  );
}
