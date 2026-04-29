import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Cookie, ChevronDown, ChevronUp, Mail, MapPin, ArrowRight, ExternalLink } from 'lucide-react';

const EFFECTIVE_DATE = 'April 29, 2026';
const COMPANY = 'R&C Worldwide Solutions LLC';
const EMAIL = 'admin@roberttrades.com';
const ADDRESS = '30 N Gould St, Sheridan, WY 82801';

const COOKIE_CATEGORIES = [
  {
    name: 'Strictly Necessary',
    color: '#10b981',
    hue: '160',
    desc: 'Essential for the Site to function. Cannot be disabled.',
    examples: ['Login session', 'Server routing', 'Fraud protection', 'Cart & checkout', 'Cookie consent choices'],
  },
  {
    name: 'Performance & Analytics',
    color: '#60a5fa',
    hue: '213',
    desc: 'Help us understand how visitors use the Site.',
    examples: ['Pages visited & time spent', 'Links clicked', 'Referring site or campaign', 'Device & browser info', 'Geographic region'],
  },
  {
    name: 'Functionality',
    color: '#a78bfa',
    hue: '265',
    desc: 'Remember your preferences for a personalised experience.',
    examples: ['Language & region', 'Display preferences', 'Embedded video playback'],
  },
  {
    name: 'Advertising & Targeting',
    color: '#fb923c',
    hue: '25',
    desc: 'Deliver relevant ads and measure campaign performance.',
    examples: ['Interest-based ads', 'Frequency capping', 'Retargeting audiences', 'Conversion tracking'],
  },
];

const SECTIONS = [
  {
    id: 1, title: 'What Are Cookies?',
    body: `A "cookie" is a small text file that a website places on your computer, phone, tablet, or other device when you visit it. Cookies are widely used to make websites work, to make them work more efficiently, to remember your preferences, and to provide reporting information.\n\nIn this Cookie Policy, the term "cookies" also includes similar technologies such as:\n\n• Pixel tags (web beacons / tracking pixels) — tiny images embedded in pages or emails that detect when they have been viewed;\n• Local storage and session storage — data stored locally in your browser;\n• Software development kits (SDKs) — code that performs functions similar to cookies;\n• Device identifiers — unique IDs such as advertising identifiers; and\n• Server logs and similar passive data collection tools.`,
  },
  {
    id: 2, title: 'Why We Use Cookies',
    body: `We use cookies for the following purposes:\n\n• To operate the Site and deliver the Services you request;\n• To authenticate you and keep your account secure;\n• To remember your preferences and settings;\n• To understand how visitors find and use the Site so we can improve it;\n• To measure the performance of our marketing campaigns;\n• To deliver advertising relevant to your interests, both on the Site and on third-party platforms; and\n• To detect and prevent fraud, abuse, and security threats.`,
  },
  {
    id: 3, title: 'Categories of Cookies We Use',
    subsections: [
      { title: '3.1 Strictly Necessary Cookies', body: `Essential for the Site to function. They enable core features such as page navigation, secure login, account authentication, shopping cart and checkout functions, load balancing, and storing your cookie consent choices. You cannot opt out of these cookies through our cookie tool, though you can block them via browser settings (which may break parts of the Site).` },
      { title: '3.2 Performance and Analytics Cookies', body: `Help us understand how visitors interact with the Site by collecting and reporting information anonymously or in aggregate. Information typically collected includes: pages visited and time spent, links clicked, referring website or campaign, device/browser/OS, and general geographic region. Common providers include Google Analytics.` },
      { title: '3.3 Functionality Cookies', body: `Allow the Site to remember choices you make and provide enhanced or more personal features — such as your language, region, or display preferences. The information these cookies collect may be anonymized and they generally do not track your browsing activity on other websites.` },
      { title: '3.4 Advertising and Targeting Cookies', body: `Used to deliver advertising more relevant to your interests. They also limit the number of times you see an ad, measure advertising campaign effectiveness, and build profiles for retargeting on third-party platforms such as Meta (Facebook/Instagram), Google, YouTube, and TikTok. These cookies are usually placed by third-party advertising networks with our permission.` },
    ],
  },
  {
    id: 4, title: 'Third-Party Cookies and Providers',
    subsections: [
      { title: '4.1 Meta (Facebook and Instagram)', body: `We use the Meta Pixel and may use the Meta Conversions API to measure advertising effectiveness, track conversions, and build Custom and Lookalike Audiences. Information shared with Meta may include hashed contact details, event data, page URLs, and technical identifiers.\n\nPrivacy Policy: https://www.facebook.com/privacy/policy\nTo opt out of Meta Custom Audiences, email ${EMAIL} with subject "Opt Out of Meta Custom Audiences."` },
      { title: '4.2 Google', body: `We use Google Analytics, Google Ads, Google Display Network, DoubleClick, Google Tag Manager, and Remarketing with Google Analytics.\n\nPrivacy Policy: https://policies.google.com/privacy\nOpt out of Google Analytics: https://tools.google.com/dlpage/gaoptout/\nManage Google ad personalization: https://adssettings.google.com` },
      { title: '4.3 TikTok', body: `If we run advertising on TikTok, we may use the TikTok Pixel to measure campaign effectiveness, track conversions, and build audiences.\n\nPrivacy Policy: https://www.tiktok.com/legal/privacy-policy\nManage preferences in your TikTok account settings.` },
      { title: '4.4 Other Advertising Partners', body: `We may also work with other partners including Pinterest, Snapchat, X (formerly Twitter), Microsoft Advertising/LinkedIn, and email and marketing automation providers. Each maintains its own privacy policy.` },
      { title: '4.5 Operational Service Providers', body: `We use service providers for website hosting, security, CDN, payment processing, customer support, live chat, email delivery, A/B testing, and embedded content. These providers may set cookies as part of delivering their services.` },
    ],
  },
  {
    id: 5, title: 'First-Party vs. Third-Party Cookies',
    body: `• FIRST-PARTY COOKIES are set by the Site (roberttrades.com) directly. We use them primarily for essential functionality, preferences, and our own analytics.\n\n• THIRD-PARTY COOKIES are set by domains other than roberttrades.com when you visit our Site — typically by service providers and advertising partners described in Section 4.`,
  },
  {
    id: 6, title: 'Session vs. Persistent Cookies',
    body: `• SESSION COOKIES exist only while your browser is open and are automatically deleted when you close it. Typically used to keep you logged in during a single visit.\n\n• PERSISTENT COOKIES remain on your device after your browser is closed, until they expire or you delete them. Used to remember preferences across visits and recognise returning users. Durations typically range from a few days to approximately two years.`,
  },
  {
    id: 7, title: 'Legal Basis for Using Cookies (EEA, UK, and Switzerland)',
    body: `If you are located in the European Economic Area, the United Kingdom, or Switzerland:\n\n• STRICTLY NECESSARY COOKIES — placed on the basis of our legitimate interest in operating a secure and functional website. Consent is not required.\n\n• ALL OTHER COOKIES (analytics, functionality, advertising) — placed only with your consent, which you may give through our cookie consent tool. You may withdraw your consent at any time as described in Section 8.`,
  },
  {
    id: 8, title: 'How to Manage or Disable Cookies',
    subsections: [
      { title: '8.1 Our Cookie Consent Tool', body: `Where required by law, when you first visit the Site we display a cookie banner allowing you to accept, reject, or customise non-essential cookies. You can revisit your choices at any time by clicking "Cookie Preferences" on the Site, or by clearing cookies in your browser.` },
      { title: '8.2 Browser Settings', body: `Most browsers let you view, manage, delete, and block cookies in settings under "Privacy" or "Security."\n\n• Google Chrome: https://support.google.com/chrome/answer/95647\n• Mozilla Firefox: https://support.mozilla.org/kb/cookies-information-websites-store-on-your-computer\n• Apple Safari: https://support.apple.com/guide/safari/manage-cookies-sfri11471/mac\n• Microsoft Edge: https://support.microsoft.com/microsoft-edge\n• General: https://www.aboutcookies.org\n\nNote: blocking cookies may prevent parts of the Site from working properly.` },
      { title: '8.3 Mobile Device Settings', body: `• iOS: Settings > Privacy & Security > Tracking, and Settings > Privacy & Security > Apple Advertising\n• Android: Settings > Privacy > Ads, or Settings > Google > Ads` },
      { title: '8.4 Industry Opt-Out Tools', body: `• DAA: https://optout.aboutads.info\n• NAI: https://optout.networkadvertising.org\n• EDAA (Europe): https://www.youronlinechoices.eu\n• Canada: https://youradchoices.ca/choices\n\nThese tools opt you out of interest-based advertising but do not block all advertising.` },
      { title: '8.5 Do Not Track and Global Privacy Control', body: `Some browsers send "Do Not Track" (DNT) or Global Privacy Control (GPC) signals. There is no universally accepted standard for DNT. Where required by law (including for California residents under the CCPA), we treat a GPC signal as a valid opt-out request for the "sale" or "sharing" of personal information.` },
    ],
  },
  {
    id: 9, title: 'Cookies in Marketing Emails',
    body: `Our marketing emails may include pixel tags or tracking links that allow us to measure whether emails are opened, which links are clicked, and how recipients interact with our content.\n\nYou can limit email tracking by configuring your email client to block remote images. You can stop receiving marketing emails at any time by clicking "unsubscribe" in any marketing email or by emailing ${EMAIL}.`,
  },
  {
    id: 10, title: 'Children',
    body: `The Site is not directed to children under the age of 13 (or the applicable minimum age in your jurisdiction). We do not knowingly use cookies to collect personal information from children. If you believe a child has provided personal information to us, please contact ${EMAIL} so we can take appropriate action.`,
  },
  {
    id: 11, title: 'Changes to This Cookie Policy',
    body: `We may update this Cookie Policy from time to time to reflect changes in the cookies and technologies we use, or for operational, legal, or regulatory reasons. When we make material changes, we will update the "Last Updated" date and, where required by law, post a notice or re-present our cookie banner. We encourage you to review this Cookie Policy periodically.`,
  },
  {
    id: 12, title: 'How to Contact Us',
    body: `If you have questions, comments, or complaints about this Cookie Policy or our use of cookies, please contact us:\n\n${COMPANY}\nAttn: Privacy\n${ADDRESS}\nEmail: ${EMAIL}`,
  },
];

const easing = [0.16, 1, 0.3, 1];

const SectionCard = ({ section, index }) => {
  const [open, setOpen] = useState(false);
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: index * 0.03, ease: easing }}
      style={{
        background: open ? 'rgba(37,99,235,0.04)' : 'rgba(255,255,255,0.025)',
        border: `1px solid ${open ? 'rgba(37,99,235,0.3)' : 'rgba(255,255,255,0.07)'}`,
        borderRadius: '16px', marginBottom: '0.75rem', overflow: 'hidden', transition: 'all 0.25s',
      }}
      onMouseEnter={e => { if (!open) e.currentTarget.style.borderColor = 'rgba(37,99,235,0.2)'; }}
      onMouseLeave={e => { if (!open) e.currentTarget.style.borderColor = 'rgba(255,255,255,0.07)'; }}
    >
      <button
        onClick={() => setOpen(o => !o)}
        style={{ width: '100%', textAlign: 'left', padding: '1.1rem 1.5rem', background: 'transparent', border: 'none', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem' }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
          <span style={{ flexShrink: 0, width: '28px', height: '28px', borderRadius: '8px', background: 'rgba(37,99,235,0.12)', border: '1px solid rgba(37,99,235,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.65rem', fontWeight: 900, color: '#60a5fa' }}>
            {section.id}
          </span>
          <span style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--text-primary)', lineHeight: 1.35 }}>{section.title}</span>
        </div>
        <span style={{ flexShrink: 0, color: open ? '#60a5fa' : 'var(--text-secondary)', transition: 'color 0.2s' }}>
          {open ? <ChevronUp size={17} /> : <ChevronDown size={17} />}
        </span>
      </button>

      {open && (
        <div style={{ padding: '0 1.5rem 1.4rem' }}>
          {section.subsections ? (
            section.subsections.map(sub => (
              <div key={sub.title} style={{ marginBottom: '1.25rem' }}>
                <div style={{ fontSize: '0.78rem', fontWeight: 800, color: '#60a5fa', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.5rem' }}>{sub.title}</div>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: 1.75, margin: 0, whiteSpace: 'pre-line' }}>{sub.body}</p>
              </div>
            ))
          ) : (
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: 1.75, margin: 0, whiteSpace: 'pre-line' }}>{section.body}</p>
          )}
        </div>
      )}
    </motion.div>
  );
};

export default function CookiePolicy() {
  return (
    <div style={{ background: 'var(--bg-primary)', minHeight: '100vh', overflowX: 'hidden' }}>

      {/* HERO */}
      <section style={{ position: 'relative', padding: '7rem 0 5rem', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: '-10%', left: '50%', transform: 'translateX(-50%)', width: '900px', height: '500px', background: 'radial-gradient(ellipse at center, rgba(16,185,129,0.08) 0%, transparent 70%)', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', inset: 0, backgroundImage: 'linear-gradient(rgba(255,255,255,0.02) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.02) 1px, transparent 1px)', backgroundSize: '60px 60px', pointerEvents: 'none' }} />

        <div className="container" style={{ position: 'relative', zIndex: 1, textAlign: 'center' }}>
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5 }}
            style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.25)', borderRadius: '99px', padding: '0.35rem 1rem', marginBottom: '1.5rem', fontSize: '0.75rem', fontWeight: 800, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#34d399' }}>
            <Cookie size={12} /> Legal
          </motion.div>

          <motion.h1 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.06 }}
            style={{ fontSize: 'clamp(2.2rem, 5vw, 3.5rem)', fontWeight: 900, letterSpacing: '-2px', lineHeight: 1.1, color: 'var(--text-primary)', marginBottom: '1.25rem' }}>
            Cookie <span className="text-gradient">Policy</span>
          </motion.h1>

          <motion.p initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.1 }}
            style={{ fontSize: '1rem', color: 'var(--text-secondary)', maxWidth: '580px', margin: '0 auto 2rem', lineHeight: 1.7 }}>
            How <strong style={{ color: 'var(--text-primary)' }}>{COMPANY}</strong> uses cookies and similar tracking technologies on roberttrades.com · Effective {EFFECTIVE_DATE}
          </motion.p>

          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.14 }}
            style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
            {[
              { icon: <Mail size={13} />, label: EMAIL, href: `mailto:${EMAIL}` },
              { icon: <MapPin size={13} />, label: ADDRESS },
            ].map(({ icon, label, href }) => (
              <div key={label} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '99px', padding: '0.35rem 1rem', fontSize: '0.78rem', color: 'var(--text-secondary)', fontWeight: 500 }}>
                <span style={{ color: '#34d399' }}>{icon}</span>
                {href ? <a href={href} style={{ color: 'inherit', textDecoration: 'none' }}>{label}</a> : label}
              </div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* COOKIE CATEGORIES OVERVIEW */}
      <section style={{ padding: '0 0 3rem' }}>
        <div className="container" style={{ maxWidth: '860px' }}>
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.16 }}
            style={{ marginBottom: '2.5rem' }}>
            <div style={{ fontSize: '0.7rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#34d399', marginBottom: '0.75rem', textAlign: 'center' }}>Cookie Categories at a Glance</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))', gap: '1rem' }}>
              {COOKIE_CATEGORIES.map(cat => (
                <div key={cat.name}
                  style={{ background: `hsla(${cat.hue},70%,60%,0.05)`, border: `1px solid hsla(${cat.hue},70%,60%,0.18)`, borderRadius: '16px', padding: '1.25rem', transition: 'all 0.25s' }}
                  onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.style.borderColor = `hsla(${cat.hue},70%,60%,0.35)`; }}
                  onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.borderColor = `hsla(${cat.hue},70%,60%,0.18)`; }}
                >
                  <div style={{ fontSize: '0.78rem', fontWeight: 800, color: cat.color, marginBottom: '0.4rem' }}>{cat.name}</div>
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', margin: '0 0 0.75rem', lineHeight: 1.55 }}>{cat.desc}</p>
                  <ul style={{ margin: 0, padding: '0 0 0 1rem', fontSize: '0.75rem', color: 'var(--text-secondary)', lineHeight: 1.8 }}>
                    {cat.examples.map(ex => <li key={ex}>{ex}</li>)}
                  </ul>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Sections accordion */}
          <div>
            {SECTIONS.map((section, i) => (
              <SectionCard key={section.id} section={section} index={i} />
            ))}
          </div>
        </div>
      </section>

      {/* FOOTER CTA */}
      <section style={{ padding: '4rem 0 6rem', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
        <div className="container" style={{ textAlign: 'center' }}>
          <div style={{ background: 'linear-gradient(135deg, rgba(16,185,129,0.07), rgba(37,99,235,0.04))', border: '1px solid rgba(16,185,129,0.18)', borderRadius: '24px', padding: '3rem 2rem', display: 'inline-block', maxWidth: '560px', width: '100%' }}>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 900, color: 'var(--text-primary)', marginBottom: '0.75rem', letterSpacing: '-0.5px' }}>Questions about cookies?</h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', lineHeight: 1.65, marginBottom: '1.75rem' }}>
              Contact us at <a href={`mailto:${EMAIL}`} style={{ color: '#34d399', fontWeight: 700 }}>{EMAIL}</a> or read our related policies.
            </p>
            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center', flexWrap: 'wrap' }}>
              <Link to="/terms" style={{ padding: '0.8rem 1.75rem', fontWeight: 800, borderRadius: '12px', background: 'linear-gradient(135deg,#1d4ed8,#2563eb)', color: '#fff', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '0.5rem', boxShadow: '0 8px 24px rgba(37,99,235,0.3)' }}>
                Terms of Service <ArrowRight size={15} />
              </Link>
              <Link to="/contact" style={{ padding: '0.8rem 1.75rem', fontWeight: 700, borderRadius: '12px', border: '1.5px solid rgba(255,255,255,0.1)', color: 'var(--text-secondary)', textDecoration: 'none', transition: 'all 0.2s' }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(16,185,129,0.4)'; e.currentTarget.style.color = '#34d399'; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'; e.currentTarget.style.color = 'var(--text-secondary)'; }}>
                Contact Us
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
