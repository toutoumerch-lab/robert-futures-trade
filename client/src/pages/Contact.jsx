import React, { useState, useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import axios from 'axios';
import { useBranding } from '../context/BrandingContext';
import {
  Mail, MessageSquare, Clock, Send, CheckCircle,
  Share2, Video, AtSign, MessageCircle,
  ChevronDown, ChevronUp,
  BookOpen, TrendingUp, AlertCircle,
} from 'lucide-react';
import FacebookIcon from '../components/icons/FacebookIcon';

/* ─── helpers ─────────────────────────────────────────────── */
const easing = [0.16, 1, 0.3, 1];
const fadeUp  = (delay = 0) => ({
  hidden: { opacity: 0, y: 24 },
  show:   { opacity: 1, y: 0, transition: { duration: 0.5, ease: easing, delay } },
});

const Reveal = ({ children, delay = 0, style = {}, className = '' }) => {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-60px' });
  return (
    <motion.div ref={ref} style={style} className={className}
      variants={fadeUp(delay)} initial="hidden" animate={inView ? 'show' : 'hidden'}>
      {children}
    </motion.div>
  );
};

/* ─── data ────────────────────────────────────────────────── */
const CONTACT_CARDS_BASE = [
  {
    icon: Mail,
    title: 'Email Us',
    value: null,        // filled dynamically from branding
    sub: 'We reply within 24 hours',
    hue: '213',
    action: null,       // filled dynamically from branding
  },
  {
    icon: MessageSquare,
    title: 'Discord Community',
    value: 'Join the Server',
    sub: '400+ active traders',
    hue: '265',
    action: null, // filled dynamically from branding
  },
  {
    icon: Clock,
    title: 'Support Hours',
    value: 'Mon – Fri, 9am – 6pm',
    sub: 'EST',
    hue: '38',
    action: null,
  },
];

const FAQS = [
  {
    q: 'How do I access a course after purchasing?',
    a: 'After payment, log in to your account and navigate to your Dashboard. All purchased courses appear under "My Courses" and are available immediately.',
  },
  {
    q: 'Do you offer refunds?',
    a: 'We offer a 7-day satisfaction guarantee for all course purchases. If you feel the course did not meet your expectations, contact us within 7 days for a full refund.',
  },
  {
    q: 'Are the courses suitable for complete beginners?',
    a: 'Yes. Our curriculum is structured from the ground up — Beginner modules cover price action foundations while Advanced modules go deep into liquidity theory and prop firm strategies.',
  },
  {
    q: 'Can I access courses on mobile?',
    a: 'Absolutely. The platform is fully responsive and works on all devices — desktop, tablet, and mobile.',
  },
  {
    q: 'Do you offer mentorship or live sessions?',
    a: 'Yes. Premium members get access to monthly live review sessions, Discord group mentorship, and trade critique threads.',
  },
  {
    q: 'Which prop firms do you recommend?',
    a: 'Check out our Prop Firms comparison page — we review and rank firms by payout reliability, rules, and value for different trader styles.',
  },
];

const SUBJECTS = [
  { value: 'general',   label: 'General Inquiry' },
  { value: 'courses',   label: 'Course Support' },
  { value: 'billing',   label: 'Billing & Payments' },
  { value: 'technical', label: 'Technical Issue' },
  { value: 'partnership', label: 'Partnership / Collab' },
  { value: 'other',     label: 'Other' },
];

/* ─── FAQ accordion item ─────────────────────────────────── */
const FaqItem = ({ q, a, index }) => {
  const [open, setOpen] = useState(false);
  return (
    <Reveal delay={index * 0.055}>
      <div
        style={{
          background: open ? 'rgba(37,99,235,0.04)' : 'rgba(255,255,255,0.025)',
          border: `1px solid ${open ? 'rgba(37,99,235,0.25)' : 'rgba(255,255,255,0.07)'}`,
          borderRadius: '16px',
          overflow: 'hidden',
          transition: 'all 0.3s',
          marginBottom: '0.75rem',
        }}
      >
        <button
          onClick={() => setOpen(o => !o)}
          style={{
            width: '100%', textAlign: 'left', padding: '1.25rem 1.5rem',
            background: 'transparent', border: 'none', cursor: 'pointer',
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            gap: '1rem', color: 'var(--text-primary)',
          }}
        >
          <span style={{ fontWeight: 700, fontSize: '0.95rem', lineHeight: 1.4 }}>{q}</span>
          <span style={{ flexShrink: 0, color: open ? '#60a5fa' : 'var(--text-secondary)', transition: 'color 0.2s' }}>
            {open ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
          </span>
        </button>
        <motion.div
          initial={false}
          animate={{ height: open ? 'auto' : 0, opacity: open ? 1 : 0 }}
          transition={{ duration: 0.28, ease: easing }}
          style={{ overflow: 'hidden' }}
        >
          <p style={{ margin: 0, padding: '0 1.5rem 1.25rem', color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: 1.7 }}>
            {a}
          </p>
        </motion.div>
      </div>
    </Reveal>
  );
};

/* ═══════════════════════════════════════════════════════════════
   Page
   ═══════════════════════════════════════════════════════════════ */
export default function Contact() {
  const { socialTwitter, socialYoutube, socialInstagram, socialDiscord, socialFacebook, contactEmail } = useBranding();

  // Build dynamic social list — hide platforms with no URL set
  const SOCIALS = [
    { icon: Share2,        label: 'Twitter / X', href: socialTwitter,   color: '#1d9bf0' },
    { icon: Video,         label: 'YouTube',      href: socialYoutube,   color: '#ff0000' },
    { icon: AtSign,        label: 'Instagram',    href: socialInstagram, color: '#e1306c' },
    { icon: MessageCircle, label: 'Discord',      href: socialDiscord,   color: '#5865f2' },
    { icon: FacebookIcon,   label: 'Facebook',     href: socialFacebook,  color: '#1877f2' },
  ].filter(s => s.href && s.href.trim() !== '');

  // Inject dynamic values into contact cards
  const CONTACT_CARDS = CONTACT_CARDS_BASE.map(card => {
    if (card.title === 'Discord Community') {
      return { ...card, action: socialDiscord || null };
    }
    if (card.title === 'Email Us') {
      const email = contactEmail || 'admin@roberttrades.com';
      return { ...card, value: email, action: `mailto:${email}` };
    }
    return card;
  });

  const [form, setForm]       = useState({ name: '', email: '', subject: 'general', message: '' });
  const [errors, setErrors]   = useState({});
  const [status, setStatus]   = useState('idle'); // idle | sending | success | error
  const [errorMsg, setErrorMsg] = useState('');

  const validate = () => {
    const e = {};
    if (!form.name.trim())    e.name    = 'Name is required';
    if (!form.email.trim())   e.email   = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(form.email)) e.email = 'Invalid email address';
    if (!form.message.trim()) e.message = 'Message is required';
    return e;
  };

  const handleChange = (field) => (e) => {
    setForm(f => ({ ...f, [field]: e.target.value }));
    if (errors[field]) setErrors(er => ({ ...er, [field]: undefined }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setStatus('sending');
    setErrorMsg('');
    try {
      await axios.post(`${import.meta.env.VITE_API_URL}/api/contact`, {
        name:    form.name,
        email:   form.email,
        subject: form.subject,
        message: form.message,
      });
      setStatus('success');
    } catch (err) {
      const msg = err.response?.data?.error || 'Failed to send message. Please try again.';
      setErrorMsg(msg);
      setStatus('error');
    }
  };

  /* shared input style builder */
  const inp = (hasError) => ({
    width: '100%', boxSizing: 'border-box',
    padding: '0.9rem 1.1rem',
    borderRadius: '12px',
    border: `1.5px solid ${hasError ? 'rgba(239,68,68,0.5)' : 'rgba(255,255,255,0.08)'}`,
    background: 'rgba(255,255,255,0.03)',
    color: 'var(--text-primary)',
    fontSize: '0.95rem',
    fontFamily: 'var(--font-sans)',
    outline: 'none',
    transition: 'all 0.22s',
  });

  return (
    <div style={{ background: 'var(--bg-primary)', minHeight: '100vh', overflowX: 'hidden' }}>

      {/* ══ HERO ══════════════════════════════════════════════════ */}
      <section style={{ position: 'relative', padding: '7rem 0 5rem', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: '-10%', left: '50%', transform: 'translateX(-50%)', width: '900px', height: '500px', background: 'radial-gradient(ellipse at center, rgba(37,99,235,0.1) 0%, transparent 70%)', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', inset: 0, backgroundImage: 'linear-gradient(rgba(255,255,255,0.02) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.02) 1px, transparent 1px)', backgroundSize: '60px 60px', pointerEvents: 'none' }} />

        <div className="container" style={{ position: 'relative', zIndex: 1, textAlign: 'center' }}>
          <motion.div variants={fadeUp(0)} initial="hidden" animate="show"
            style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', background: 'rgba(37,99,235,0.1)', border: '1px solid rgba(37,99,235,0.25)', borderRadius: '99px', padding: '0.35rem 1rem', marginBottom: '1.5rem', fontSize: '0.75rem', fontWeight: 800, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#60a5fa' }}>
            <Mail size={12} /> Get In Touch
          </motion.div>

          <motion.h1 variants={fadeUp(0.06)} initial="hidden" animate="show"
            style={{ fontSize: 'clamp(2.4rem, 5vw, 3.8rem)', fontWeight: 900, letterSpacing: '-2px', lineHeight: 1.08, color: 'var(--text-primary)', marginBottom: '1.25rem' }}>
            We'd love to<br /><span className="text-gradient">hear from you.</span>
          </motion.h1>

          <motion.p variants={fadeUp(0.1)} initial="hidden" animate="show"
            style={{ fontSize: '1.1rem', color: 'var(--text-secondary)', maxWidth: '520px', margin: '0 auto', lineHeight: 1.7 }}>
            Whether you have a question about a course, need billing help, or just want to say hello — our team is here.
          </motion.p>
        </div>
      </section>

      {/* ══ CONTACT CARDS ═════════════════════════════════════════ */}
      <section style={{ padding: '0 0 5rem' }}>
        <div className="container">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1.25rem' }} className="contact-card-grid">
            {CONTACT_CARDS.map(({ icon: Icon, title, value, sub, hue, action }, i) => (
              <Reveal key={title} delay={i * 0.08}>
                <div
                  onClick={() => action && window.open(action, '_blank')}
                  style={{
                    background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.07)',
                    borderRadius: '20px', padding: '2rem', textAlign: 'center',
                    cursor: action ? 'pointer' : 'default',
                    transition: 'all 0.28s',
                  }}
                  onMouseEnter={e => { if (action) { e.currentTarget.style.borderColor = `hsla(${hue},80%,60%,0.35)`; e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.background = `hsla(${hue},80%,60%,0.04)`; } }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.07)'; e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.background = 'rgba(255,255,255,0.025)'; }}
                >
                  <div style={{ width: '52px', height: '52px', borderRadius: '15px', background: `hsla(${hue},80%,60%,0.1)`, border: `1px solid hsla(${hue},80%,60%,0.2)`, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.25rem', color: `hsl(${hue},80%,68%)` }}>
                    <Icon size={24} />
                  </div>
                  <div style={{ fontSize: '0.72rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em', color: `hsl(${hue},80%,68%)`, marginBottom: '0.5rem' }}>{title}</div>
                  <div style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '0.35rem' }}>{value}</div>
                  <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>{sub}</div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ══ FORM + SIDE INFO ══════════════════════════════════════ */}
      <section style={{ padding: '0 0 6rem', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
        <div className="container" style={{ paddingTop: '4rem' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 420px', gap: '3rem', alignItems: 'start' }} className="contact-form-grid">

            {/* ── FORM ─────────────────────────────────────────── */}
            <Reveal>
              <div style={{ background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '24px', padding: '2.5rem' }}>
                {status === 'success' ? (
                  /* Success state */
                  <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.4, ease: easing }}
                    style={{ textAlign: 'center', padding: '3rem 1rem' }}>
                    <div style={{ width: '72px', height: '72px', borderRadius: '50%', background: 'rgba(16,185,129,0.12)', border: '1px solid rgba(16,185,129,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem', color: '#10b981' }}>
                      <CheckCircle size={34} />
                    </div>
                    <h3 style={{ fontSize: '1.5rem', fontWeight: 900, color: 'var(--text-primary)', marginBottom: '0.75rem' }}>Message Sent!</h3>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', lineHeight: 1.65, maxWidth: '340px', margin: '0 auto 2rem' }}>
                      Thanks for reaching out. We'll get back to you within 24 hours.
                    </p>
                    <button
                      onClick={() => { setStatus('idle'); setForm({ name: '', email: '', subject: 'general', message: '' }); }}
                      style={{ padding: '0.7rem 1.75rem', borderRadius: '10px', border: '1.5px solid rgba(255,255,255,0.1)', background: 'transparent', color: 'var(--text-secondary)', fontWeight: 700, fontSize: '0.9rem', cursor: 'pointer', fontFamily: 'var(--font-sans)', transition: 'all 0.2s' }}
                      onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(37,99,235,0.4)'; e.currentTarget.style.color = '#93c5fd'; }}
                      onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'; e.currentTarget.style.color = 'var(--text-secondary)'; }}
                    >
                      Send another message
                    </button>
                  </motion.div>
                ) : status === 'error' ? (
                  /* Error state */
                  <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.4, ease: easing }}
                    style={{ textAlign: 'center', padding: '3rem 1rem' }}>
                    <div style={{ width: '72px', height: '72px', borderRadius: '50%', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem', color: '#f87171' }}>
                      <AlertCircle size={34} />
                    </div>
                    <h3 style={{ fontSize: '1.5rem', fontWeight: 900, color: 'var(--text-primary)', marginBottom: '0.75rem' }}>Couldn't Send</h3>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', lineHeight: 1.65, maxWidth: '340px', margin: '0 auto 2rem' }}>
                      {errorMsg}
                    </p>
                    <button
                      onClick={() => setStatus('idle')}
                      style={{ padding: '0.7rem 1.75rem', borderRadius: '10px', border: '1.5px solid rgba(255,255,255,0.1)', background: 'transparent', color: 'var(--text-secondary)', fontWeight: 700, fontSize: '0.9rem', cursor: 'pointer', fontFamily: 'var(--font-sans)', transition: 'all 0.2s' }}
                      onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(239,68,68,0.4)'; e.currentTarget.style.color = '#f87171'; }}
                      onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'; e.currentTarget.style.color = 'var(--text-secondary)'; }}
                    >
                      Try again
                    </button>
                  </motion.div>
                ) : (
                  /* Form */
                  <>
                    <h2 style={{ fontSize: '1.4rem', fontWeight: 900, color: 'var(--text-primary)', marginBottom: '0.35rem', letterSpacing: '-0.5px' }}>Send a Message</h2>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem', marginBottom: '2rem' }}>Fill in the form below and we'll get back to you shortly.</p>

                    <form onSubmit={handleSubmit} noValidate style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                      {/* Name + Email row */}
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }} className="contact-row">
                        <div>
                          <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '0.45rem', letterSpacing: '0.02em' }}>Full Name</label>
                          <input
                            type="text"
                            placeholder="Robert Smith"
                            value={form.name}
                            onChange={handleChange('name')}
                            style={inp(errors.name)}
                            onFocus={e => { e.target.style.borderColor = 'rgba(37,99,235,0.5)'; e.target.style.background = 'rgba(37,99,235,0.04)'; e.target.style.boxShadow = '0 0 0 3px rgba(37,99,235,0.08)'; }}
                            onBlur={e  => { e.target.style.borderColor = errors.name ? 'rgba(239,68,68,0.5)' : 'rgba(255,255,255,0.08)'; e.target.style.background = 'rgba(255,255,255,0.03)'; e.target.style.boxShadow = 'none'; }}
                          />
                          {errors.name && <p style={{ margin: '0.3rem 0 0', fontSize: '0.75rem', color: '#f87171', display: 'flex', alignItems: 'center', gap: '4px' }}><AlertCircle size={11}/> {errors.name}</p>}
                        </div>
                        <div>
                          <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '0.45rem', letterSpacing: '0.02em' }}>Email Address</label>
                          <input
                            type="email"
                            placeholder="you@email.com"
                            value={form.email}
                            onChange={handleChange('email')}
                            style={inp(errors.email)}
                            onFocus={e => { e.target.style.borderColor = 'rgba(37,99,235,0.5)'; e.target.style.background = 'rgba(37,99,235,0.04)'; e.target.style.boxShadow = '0 0 0 3px rgba(37,99,235,0.08)'; }}
                            onBlur={e  => { e.target.style.borderColor = errors.email ? 'rgba(239,68,68,0.5)' : 'rgba(255,255,255,0.08)'; e.target.style.background = 'rgba(255,255,255,0.03)'; e.target.style.boxShadow = 'none'; }}
                          />
                          {errors.email && <p style={{ margin: '0.3rem 0 0', fontSize: '0.75rem', color: '#f87171', display: 'flex', alignItems: 'center', gap: '4px' }}><AlertCircle size={11}/> {errors.email}</p>}
                        </div>
                      </div>

                      {/* Subject */}
                      <div>
                        <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '0.45rem', letterSpacing: '0.02em' }}>Subject</label>
                        <select
                          value={form.subject}
                          onChange={handleChange('subject')}
                          style={{ ...inp(false), appearance: 'none', backgroundImage: 'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'12\' height=\'12\' viewBox=\'0 0 24 24\' fill=\'none\' stroke=\'%2394a3b8\' stroke-width=\'2\'%3E%3Cpolyline points=\'6 9 12 15 18 9\'/%3E%3C/svg%3E")', backgroundRepeat: 'no-repeat', backgroundPosition: 'right 1rem center', paddingRight: '2.5rem', cursor: 'pointer' }}
                          onFocus={e => { e.target.style.borderColor = 'rgba(37,99,235,0.5)'; e.target.style.background = 'rgba(37,99,235,0.04)'; }}
                          onBlur={e  => { e.target.style.borderColor = 'rgba(255,255,255,0.08)'; e.target.style.background = 'rgba(255,255,255,0.03)'; }}
                        >
                          {SUBJECTS.map(s => <option key={s.value} value={s.value} style={{ background: '#0f1117' }}>{s.label}</option>)}
                        </select>
                      </div>

                      {/* Message */}
                      <div>
                        <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '0.45rem', letterSpacing: '0.02em' }}>Message</label>
                        <textarea
                          rows={6}
                          placeholder="Tell us how we can help you…"
                          value={form.message}
                          onChange={handleChange('message')}
                          style={{ ...inp(errors.message), resize: 'vertical', minHeight: '130px' }}
                          onFocus={e => { e.target.style.borderColor = 'rgba(37,99,235,0.5)'; e.target.style.background = 'rgba(37,99,235,0.04)'; e.target.style.boxShadow = '0 0 0 3px rgba(37,99,235,0.08)'; }}
                          onBlur={e  => { e.target.style.borderColor = errors.message ? 'rgba(239,68,68,0.5)' : 'rgba(255,255,255,0.08)'; e.target.style.background = 'rgba(255,255,255,0.03)'; e.target.style.boxShadow = 'none'; }}
                        />
                        {errors.message && <p style={{ margin: '0.3rem 0 0', fontSize: '0.75rem', color: '#f87171', display: 'flex', alignItems: 'center', gap: '4px' }}><AlertCircle size={11}/> {errors.message}</p>}
                      </div>

                      {/* Submit */}
                      <motion.button
                        type="submit"
                        disabled={status === 'sending'}
                        whileHover={{ scale: status === 'sending' ? 1 : 1.02 }}
                        whileTap={{ scale: status === 'sending' ? 1 : 0.98 }}
                        style={{ padding: '1rem', borderRadius: '12px', border: 'none', cursor: status === 'sending' ? 'default' : 'pointer', background: 'linear-gradient(135deg, #1d4ed8, #2563eb)', color: '#fff', fontWeight: 800, fontSize: '1rem', fontFamily: 'var(--font-sans)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.6rem', boxShadow: '0 8px 24px rgba(37,99,235,0.35)', opacity: status === 'sending' ? 0.75 : 1, transition: 'opacity 0.2s' }}
                      >
                        {status === 'sending' ? (
                          <><span style={{ width: '16px', height: '16px', border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', borderRadius: '50%', display: 'inline-block', animation: 'spin 0.8s linear infinite' }} /> Sending…</>
                        ) : (
                          <><Send size={16} /> Send Message</>
                        )}
                      </motion.button>
                    </form>
                  </>
                )}
              </div>
            </Reveal>

            {/* ── SIDE INFO ────────────────────────────────────── */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

              {/* Quick links */}
              <Reveal delay={0.1}>
                <div style={{ background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '20px', padding: '1.75rem' }}>
                  <div style={{ fontSize: '0.7rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#60a5fa', marginBottom: '1.25rem' }}>Quick Help</div>
                  {[
                    { icon: BookOpen, label: 'Browse all courses', href: '/courses', color: '#60a5fa' },
                    { icon: TrendingUp, label: 'Compare prop firms', href: '/prop-firms', color: '#10b981' },
                    { icon: MessageSquare, label: 'Read the blog', href: '/blog', color: '#a78bfa' },
                  ].map(({ icon: Icon, label, href, color }) => (
                    <a key={label} href={href} style={{ display: 'flex', alignItems: 'center', gap: '0.85rem', padding: '0.75rem 0', borderBottom: '1px solid rgba(255,255,255,0.05)', textDecoration: 'none', color: 'var(--text-secondary)', fontSize: '0.9rem', fontWeight: 600, transition: 'color 0.2s' }}
                      onMouseEnter={e => e.currentTarget.style.color = color}
                      onMouseLeave={e => e.currentTarget.style.color = 'var(--text-secondary)'}
                    >
                      <Icon size={16} style={{ color, flexShrink: 0 }} /> {label}
                    </a>
                  ))}
                </div>
              </Reveal>

              {/* Social links — only shown when admin has set at least one link */}
              {SOCIALS.length > 0 && (
                <Reveal delay={0.15}>
                  <div style={{ background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '20px', padding: '1.75rem' }}>
                    <div style={{ fontSize: '0.7rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#60a5fa', marginBottom: '1.25rem' }}>Follow Us</div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                      {SOCIALS.map(({ icon: Icon, label, href, color }) => (
                        <a key={label} href={href} target="_blank" rel="noreferrer"
                          style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', padding: '0.65rem 0.9rem', borderRadius: '10px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', textDecoration: 'none', color: 'var(--text-secondary)', fontSize: '0.82rem', fontWeight: 700, transition: 'all 0.2s' }}
                          onMouseEnter={e => { e.currentTarget.style.borderColor = color + '44'; e.currentTarget.style.background = color + '11'; e.currentTarget.style.color = color; }}
                          onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.06)'; e.currentTarget.style.background = 'rgba(255,255,255,0.03)'; e.currentTarget.style.color = 'var(--text-secondary)'; }}
                        >
                          <Icon size={15} style={{ color }} /> {label}
                        </a>
                      ))}
                    </div>
                  </div>
                </Reveal>
              )}


              {/* Response time badge */}
              <Reveal delay={0.2}>
                <div style={{ background: 'rgba(16,185,129,0.06)', border: '1px solid rgba(16,185,129,0.2)', borderRadius: '16px', padding: '1.25rem 1.5rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#10b981', boxShadow: '0 0 0 4px rgba(16,185,129,0.15)', flexShrink: 0, animation: 'pulse 2s infinite' }} />
                  <div>
                    <div style={{ fontSize: '0.85rem', fontWeight: 800, color: '#10b981' }}>Team online now</div>
                    <div style={{ fontSize: '0.78rem', color: 'rgba(161,161,170,0.7)', marginTop: '1px' }}>Average response: &lt;4 hours</div>
                  </div>
                </div>
              </Reveal>
            </div>
          </div>
        </div>
      </section>

      {/* ══ FAQ ═══════════════════════════════════════════════════ */}
      <section style={{ padding: '5rem 0 7rem', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
        <div className="container">
          <Reveal style={{ textAlign: 'center', marginBottom: '3rem' }}>
            <div style={{ fontSize: '0.7rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#60a5fa', marginBottom: '0.75rem' }}>FAQ</div>
            <h2 style={{ fontSize: 'clamp(1.8rem, 3vw, 2.4rem)', fontWeight: 900, letterSpacing: '-1px', color: 'var(--text-primary)', margin: '0 0 0.75rem' }}>
              Frequently Asked Questions
            </h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', maxWidth: '500px', margin: '0 auto' }}>
              Can't find an answer? Reach out via the form above or join our Discord.
            </p>
          </Reveal>

          <div style={{ maxWidth: '760px', margin: '0 auto' }}>
            {FAQS.map((faq, i) => <FaqItem key={i} {...faq} index={i} />)}
          </div>
        </div>
      </section>

      {/* responsive + animation helpers */}
      <style>{`
        @keyframes pulse {
          0%, 100% { box-shadow: 0 0 0 4px rgba(16,185,129,0.15); }
          50%       { box-shadow: 0 0 0 8px rgba(16,185,129,0.06); }
        }
        @keyframes spin { to { transform: rotate(360deg); } }
        @media (max-width: 1024px) {
          .contact-form-grid { grid-template-columns: 1fr !important; }
          .contact-card-grid { grid-template-columns: 1fr !important; }
        }
        @media (max-width: 640px) {
          .contact-row { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  );
}
