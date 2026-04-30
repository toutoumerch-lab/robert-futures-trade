import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { Star, Send, Loader, MessageSquare, User } from 'lucide-react';

const API_BASE = 'http://localhost:5001';

/* ── Star Rating selector ─────────────────────────────────── */
const StarSelector = ({ value, onChange, disabled }) => (
  <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
    {[1, 2, 3, 4, 5].map(n => (
      <button
        key={n}
        type="button"
        disabled={disabled}
        onClick={() => onChange(n)}
        style={{
          background: 'none', border: 'none', cursor: disabled ? 'default' : 'pointer',
          padding: '2px', lineHeight: 1, transition: 'transform 0.15s',
        }}
        onMouseEnter={e => { if (!disabled) e.currentTarget.style.transform = 'scale(1.2)'; }}
        onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1)'; }}
        aria-label={`${n} star${n > 1 ? 's' : ''}`}
      >
        <Star
          size={24}
          fill={n <= value ? '#f59e0b' : 'none'}
          color={n <= value ? '#f59e0b' : 'rgba(255,255,255,0.25)'}
          strokeWidth={1.5}
        />
      </button>
    ))}
  </div>
);

/* ── Single review card ───────────────────────────────────── */
const ReviewCard = ({ review }) => (
  <div style={{
    display: 'flex', gap: '0.85rem', padding: '1rem',
    background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)',
    borderRadius: '12px',
  }}>
    <div style={{
      width: '36px', height: '36px', borderRadius: '50%', flexShrink: 0,
      background: 'linear-gradient(135deg, #2563eb, #1d4ed8)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: '0.85rem', fontWeight: 900, color: '#fff',
    }}>
      {(review.user_name || 'U')[0].toUpperCase()}
    </div>
    <div style={{ flex: 1, minWidth: 0 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '0.35rem' }}>
        <span style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--text-primary)' }}>
          {review.user_name || 'Student'}
        </span>
        <div style={{ display: 'flex', gap: '2px' }}>
          {[1,2,3,4,5].map(n => (
            <Star key={n} size={12}
              fill={n <= review.rating ? '#f59e0b' : 'none'}
              color={n <= review.rating ? '#f59e0b' : 'rgba(255,255,255,0.2)'}
              strokeWidth={1.5}
            />
          ))}
        </div>
        <span style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>
          {new Date(review.created_at).toLocaleDateString()}
        </span>
      </div>
      {review.comment && (
        <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', lineHeight: 1.6, margin: 0 }}>
          {review.comment}
        </p>
      )}
    </div>
  </div>
);

/* ══════════════════════════════════════════════════════════════
   Main component
══════════════════════════════════════════════════════════════ */
export default function LessonReview({ lessonId, courseId, token }) {
  const [reviews, setReviews]       = useState([]);
  const [myReview, setMyReview]     = useState(null);   // existing review
  const [rating, setRating]         = useState(0);
  const [comment, setComment]       = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading]       = useState(true);
  const [msg, setMsg]               = useState(null);

  const fetchData = useCallback(async () => {
    if (!lessonId) return;
    setLoading(true);
    try {
      const [allRes, myRes] = await Promise.all([
        axios.get(`${API_BASE}/api/reviews/lesson/${lessonId}`),
        token
          ? axios.get(`${API_BASE}/api/reviews/my/${lessonId}`, { headers: { Authorization: `Bearer ${token}` } })
          : Promise.resolve({ data: null }),
      ]);
      setReviews(allRes.data || []);
      if (myRes.data) {
        setMyReview(myRes.data);
        setRating(myRes.data.rating);
        setComment(myRes.data.comment || '');
      } else {
        setMyReview(null);
        setRating(0);
        setComment('');
      }
    } catch {
      /* silent */
    } finally {
      setLoading(false);
    }
  }, [lessonId, token]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!rating) { setMsg({ type: 'error', text: 'Please select a star rating.' }); return; }
    if (!token)  { setMsg({ type: 'error', text: 'You must be logged in to review.' }); return; }

    setSubmitting(true);
    setMsg(null);
    try {
      await axios.post(`${API_BASE}/api/reviews`, {
        lesson_id: lessonId,
        course_id: courseId,
        rating,
        comment: comment.trim() || null,
      }, { headers: { Authorization: `Bearer ${token}` } });

      setMsg({ type: 'success', text: myReview ? 'Review updated!' : 'Review submitted! Thank you.' });
      fetchData();
    } catch (err) {
      setMsg({ type: 'error', text: err?.response?.data?.error || 'Failed to submit review.' });
    } finally {
      setSubmitting(false);
    }
  };

  const otherReviews = reviews.filter(r => !myReview || r.user_id !== myReview.user_id);

  return (
    <div style={{ marginTop: '2.5rem', borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '2rem' }}>

      {/* ── Header ── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', marginBottom: '1.5rem' }}>
        <MessageSquare size={18} style={{ color: '#60a5fa' }} />
        <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 800, color: 'var(--text-primary)' }}>
          Reviews & Comments
        </h3>
        {reviews.length > 0 && (
          <span style={{
            fontSize: '0.72rem', fontWeight: 700, padding: '0.2rem 0.6rem',
            borderRadius: '99px', background: 'rgba(37,99,235,0.12)',
            border: '1px solid rgba(37,99,235,0.2)', color: '#60a5fa',
          }}>
            {reviews.length} review{reviews.length !== 1 ? 's' : ''}
          </span>
        )}
      </div>

      {/* ── Submit Form (only for logged-in users) ── */}
      {token ? (
        <form onSubmit={handleSubmit} style={{
          background: 'rgba(37,99,235,0.05)', border: '1px solid rgba(37,99,235,0.15)',
          borderRadius: '16px', padding: '1.5rem', marginBottom: '1.5rem',
        }}>
          <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#60a5fa', marginBottom: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
            {myReview ? 'Update Your Review' : 'Rate This Lesson'}
          </div>

          <div style={{ marginBottom: '1rem' }}>
            <StarSelector value={rating} onChange={setRating} disabled={submitting} />
          </div>

          <textarea
            value={comment}
            onChange={e => setComment(e.target.value)}
            placeholder="Share your thoughts about this lesson (optional)..."
            rows={3}
            style={{
              width: '100%', boxSizing: 'border-box', resize: 'vertical',
              background: 'var(--bg-primary)', border: '1px solid var(--border)',
              borderRadius: '10px', padding: '0.75rem 1rem',
              color: 'var(--text-primary)', fontSize: '0.9rem', lineHeight: 1.6,
              fontFamily: 'inherit', outline: 'none',
            }}
            onFocus={e => { e.target.style.borderColor = '#2563eb'; }}
            onBlur={e => { e.target.style.borderColor = 'var(--border)'; }}
          />

          {msg && (
            <div style={{
              marginTop: '0.75rem', padding: '0.6rem 1rem', borderRadius: '8px', fontSize: '0.85rem', fontWeight: 600,
              background: msg.type === 'success' ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)',
              border: `1px solid ${msg.type === 'success' ? 'rgba(16,185,129,0.3)' : 'rgba(239,68,68,0.3)'}`,
              color: msg.type === 'success' ? '#10b981' : '#f87171',
            }}>
              {msg.text}
            </div>
          )}

          <button
            type="submit"
            disabled={submitting || !rating}
            style={{
              marginTop: '1rem', display: 'inline-flex', alignItems: 'center', gap: '0.5rem',
              padding: '0.7rem 1.5rem', borderRadius: '10px', fontWeight: 700,
              background: rating ? '#2563eb' : 'rgba(255,255,255,0.06)',
              color: rating ? '#fff' : 'var(--text-secondary)',
              border: 'none', cursor: rating ? 'pointer' : 'not-allowed',
              fontSize: '0.9rem', transition: 'all 0.2s',
              opacity: submitting ? 0.7 : 1,
            }}
          >
            {submitting ? <Loader size={15} className="spin-animation" /> : <Send size={15} />}
            {submitting ? 'Submitting…' : myReview ? 'Update Review' : 'Submit Review'}
          </button>
        </form>
      ) : (
        <div style={{
          padding: '1rem', borderRadius: '12px', marginBottom: '1.5rem',
          background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)',
          color: 'var(--text-secondary)', fontSize: '0.875rem', textAlign: 'center',
        }}>
          Log in to leave a review for this lesson.
        </div>
      )}

      {/* ── Reviews List ── */}
      {loading ? (
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
          <Loader size={14} className="spin-animation" /> Loading reviews…
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {otherReviews.length === 0 && !myReview && (
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', margin: 0 }}>
              No reviews yet. Be the first!
            </p>
          )}
          {otherReviews.map(r => <ReviewCard key={r.id} review={r} />)}
        </div>
      )}
    </div>
  );
}
