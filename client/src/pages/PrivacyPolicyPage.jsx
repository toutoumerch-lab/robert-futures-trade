import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Shield, ChevronDown, ChevronUp, Mail, MapPin, ArrowRight } from 'lucide-react';

const EFFECTIVE_DATE = 'April 29, 2026';
const COMPANY = 'R&C Worldwide Solutions LLC';
const EMAIL = 'admin@roberttrades.com';
const ADDRESS = '30 N Gould St, Sheridan, WY 82801';

const SECTIONS = [
  {
    id: 1, title: 'Scope of This Policy',
    body: `This Policy applies to information we collect through the Site and our related Services, including online purchases, account registrations, email and SMS subscriptions, customer support communications, surveys, promotions, and our marketing on third-party platforms (such as Meta/Facebook, Instagram, Google, YouTube, and TikTok).\n\nThis Policy does not apply to information collected by third parties we do not own or control, including third-party websites or social media platforms linked from our Site.`,
  },
  {
    id: 2, title: 'Who We Are',
    body: `The Site roberttrades.com is owned and operated by ${COMPANY}, a limited liability company. For purposes of the EU General Data Protection Regulation ("GDPR"), the UK GDPR, and similar laws, ${COMPANY} is the "controller" of personal data collected through the Services, except where we act as a processor on behalf of a third party.`,
  },
  {
    id: 3, title: 'Information We Collect',
    subsections: [
      {
        title: '3.1 Information You Provide Directly',
        body: `• Identifiers and contact details: name, email address, postal address, telephone number, and username.\n• Account and profile information: login credentials, preferences, and profile details.\n• Commercial information: products or services purchased, transaction history, and subscription level.\n• Payment information: billing address and payment card details (processed by PCI-compliant third-party processors — not stored by us).\n• Marketing preferences: subscription status, communication preferences, and consent choices.\n• Survey and promotion responses.\n• Communications: content of emails, chats, and customer service interactions.`,
      },
      {
        title: '3.2 Information Collected Automatically',
        body: `• Device and technical data: IP address, device type, OS, browser type and version.\n• Usage data: pages viewed, links clicked, search terms, referring/exit URLs, time and date of visits.\n• Approximate location derived from your IP address.\n• Subscription metadata: opt-in timestamp, opt-in method, and email engagement (opens, clicks).\n• Cookies and similar technologies: see Section 8 below.`,
      },
      {
        title: '3.3 Information From Third Parties',
        body: `We may receive information from: service providers (email/marketing platforms, analytics, payment processors); advertising and social media partners (Meta, Google, TikTok) sharing aggregated campaign and audience-matching data; affiliates and business partners that refer customers; and publicly available sources used in compliance with applicable law.`,
      },
    ],
  },
  {
    id: 4, title: 'How We Use Your Information',
    body: `• Provide the Services: process transactions, deliver digital products, manage subscriptions, and provide customer support.\n• Account management: create and maintain your account, authenticate users, and manage billing.\n• Communications: send transactional messages and, where opted in, marketing emails and SMS.\n• Personalization: tailor content, recommendations, and offers based on your interests.\n• Marketing and advertising: promote our products across owned channels and third-party platforms.\n• Analytics and improvement: understand usage, diagnose issues, and improve features.\n• Security and fraud prevention: detect, investigate, and prevent fraudulent or harmful activity.\n• Legal and compliance: comply with applicable laws, court orders, and enforce our Terms of Service.\n• Business operations: corporate transactions such as mergers or asset sales, subject to this Policy.\n\nLegal Bases (EEA/UK): We process your data on the bases of: performance of a contract; legitimate interests; consent (for marketing and certain cookies); and legal obligation.`,
  },
  {
    id: 5, title: 'How We Share Information',
    body: `We do not sell personal information for monetary consideration in the traditional sense. However, certain advertising disclosures may be considered a "sale" or "sharing" under California and similar state laws (see Section 11). We share information with:\n\n• Service providers and processors: vendors for hosting, email, CRM, analytics, payment, customer support, and fraud prevention — contractually limited to use data only to serve us.\n• Advertising and analytics partners: Meta, Google, TikTok — we may share hashed identifiers for audience matching and conversion measurement.\n• Business partners: where you purchase a co-branded product, we share necessary information with the partner.\n• Corporate transactions: in connection with a merger, acquisition, or asset sale.\n• Legal, safety, and compliance: to comply with legal process, enforce our Terms, or protect rights and safety.\n• With your consent or at your direction.`,
  },
  {
    id: 6, title: 'Your Marketing Choices',
    subsections: [
      { title: '6.1 Email', body: `Unsubscribe from marketing emails at any time by clicking "unsubscribe" in any marketing email or by emailing ${EMAIL}. You will continue to receive transactional messages (receipts, account notices) even after unsubscribing.` },
      { title: '6.2 SMS / Text Messages', body: `If you have consented to receive SMS messages, opt out at any time by replying STOP or by contacting us at ${EMAIL}. Message and data rates may apply. We do not share mobile phone numbers or SMS opt-in information with third parties for their marketing.` },
      { title: '6.3 Postal Mail and Telephone', body: `You may opt out of postal mail or telephone marketing by contacting us using the contact details in Section 16.` },
    ],
  },
  {
    id: 7, title: 'Advertising and Social Media Platforms',
    subsections: [
      { title: '7.1 Meta Pixel and Conversions API', body: `We use the Meta Pixel and may use the Meta Conversions API to measure advertising effectiveness on Facebook and Instagram, optimize ad delivery, and build Custom and Lookalike Audiences. Information shared may include hashed contact details, event data, and technical identifiers.\n\nTo opt out of Meta Custom Audiences, email ${EMAIL} with subject "Opt Out of Meta Custom Audiences." You may also adjust ad preferences within Facebook and Instagram directly.` },
      { title: '7.2 Google Analytics and Google Ads', body: `We use Google Analytics, Google Ads, Google Display Network, and related products to understand Site usage, measure conversions, and serve relevant advertising on Google properties (including YouTube).\n\nOpt out of Google Analytics: https://tools.google.com/dlpage/gaoptout/\nManage Google ad personalization: https://adssettings.google.com` },
      { title: '7.3 Other Advertising Networks', body: `We may work with TikTok, Pinterest, Snapchat, X/Twitter, Microsoft Advertising, and similar partners. Industry opt-outs:\n• DAA: https://optout.aboutads.info\n• NAI: https://optout.networkadvertising.org\n• EDAA: https://www.youronlinechoices.eu` },
    ],
  },
  {
    id: 8, title: 'Cookies, Pixels, and Tracking Technologies',
    body: `We and our service providers use cookies, pixels, web beacons, local storage, SDKs, and similar technologies to operate the Site, remember preferences, analyze performance, and deliver advertising.\n\nCategories:\n• STRICTLY NECESSARY — Required for authentication, security, and load balancing. Cannot be turned off.\n• PERFORMANCE / ANALYTICS — Understand visitor interactions and measure traffic (e.g., Google Analytics).\n• FUNCTIONALITY — Remember choices and provide personalized features.\n• ADVERTISING / TARGETING — Build interest profiles and show relevant ads (e.g., Meta Pixel, Google Ads, TikTok Pixel).\n\nYou can manage cookies through your browser settings or our cookie consent tool. Disabling certain cookies may affect Site functionality. We honor Global Privacy Control (GPC) signals as opt-out requests where required by law. See our full Cookie Policy for details.`,
  },
  {
    id: 9, title: 'Data Retention',
    body: `We retain personal information for as long as reasonably necessary to fulfill the purposes in this Policy — including providing the Services, complying with legal, tax, and accounting obligations, resolving disputes, preventing fraud, and enforcing our agreements. When no longer needed, we will delete, anonymize, or de-identify it in accordance with our retention schedule and applicable law.`,
  },
  {
    id: 10, title: 'Data Security',
    body: `We maintain administrative, technical, and physical safeguards designed to protect personal information against unauthorized access, disclosure, alteration, and destruction. These include access controls, encryption in transit (TLS/HTTPS), and use of reputable third-party processors with appropriate security commitments.\n\nNo method of transmission over the Internet is one hundred percent secure. While we strive to protect your information, we cannot guarantee absolute security. You are responsible for maintaining the confidentiality of your account credentials.`,
  },
  {
    id: 11, title: 'Your Privacy Rights',
    subsections: [
      {
        title: '11.1 Rights Available to All Users',
        body: `• Access: request a copy of the personal information we hold about you.\n• Correction: request that we correct inaccurate or incomplete information.\n• Deletion: request that we delete personal information about you.\n• Opt out of marketing: stop receiving marketing emails or SMS at any time.`,
      },
      {
        title: '11.2 California Residents (CCPA / CPRA)',
        body: `California residents have additional rights including: Right to Know, Right to Delete, Right to Correct, Right to Opt Out of "sale" or "sharing" of personal information (email ${EMAIL} with subject "Do Not Sell or Share My Personal Information" or use the link on our Site), Right to Limit Use of Sensitive Personal Information, and Right to Non-Discrimination.\n\nCalifornia Civil Code §1798.83 (Shine the Light): email ${EMAIL} with subject "California Privacy Request" once per calendar year.`,
      },
      {
        title: '11.3 Other U.S. State Residents',
        body: `Residents of Virginia, Colorado, Connecticut, Utah, Texas, Oregon, Montana, and other similar states may have rights to access, correct, delete, obtain a portable copy of, and opt out of targeted advertising or sale of personal data. Contact us at ${EMAIL} to exercise these rights. You may also have the right to appeal our decision.`,
      },
      {
        title: '11.4 EEA, UK, and Swiss Residents (GDPR)',
        body: `You have rights to: access, rectification, erasure, and restriction of processing; data portability; objection to processing (including direct marketing); withdrawal of consent; and lodging a complaint with your local supervisory authority.`,
      },
      {
        title: '11.5 How to Exercise Your Rights',
        body: `Email us at ${EMAIL} or write to ${ADDRESS}. We may need to verify your identity before fulfilling your request. You may use an authorized agent subject to verification. We will respond within the time required by applicable law.`,
      },
    ],
  },
  {
    id: 12, title: 'International Data Transfers',
    body: `${COMPANY} is based in the United States. If you are located outside the U.S., your information will be transferred to, processed, and stored in the U.S. or other jurisdictions where we or our service providers operate.\n\nWhere required by law (including for transfers from the EEA, UK, or Switzerland), we rely on appropriate safeguards such as the European Commission's Standard Contractual Clauses, the UK International Data Transfer Addendum, or other lawful transfer mechanisms.`,
  },
  {
    id: 13, title: "Children's Privacy",
    body: `The Services are not directed to children under the age of 13 (or the minimum age in your jurisdiction, where higher). We do not knowingly collect personal information from children under 13.\n\nIf we learn we have collected such information without verifiable parental consent, we will promptly delete it. If you are a parent or guardian and believe your child has provided us with personal information, please contact us at ${EMAIL}.`,
  },
  {
    id: 14, title: 'Third-Party Links and Services',
    body: `The Services may contain links to third-party websites, plug-ins, or applications that we do not own or control. This Policy does not apply to those third-party services. We encourage you to review their privacy policies before providing any personal information.`,
  },
  {
    id: 15, title: 'Public Forums and User-Submitted Content',
    body: `If the Services include comment areas, reviews, or other public forums, any information you disclose in those areas may be read and used by others. Exercise caution when deciding what to share publicly. We are not responsible for personal information you choose to make public.`,
  },
  {
    id: 16, title: 'How to Contact Us',
    body: `If you have questions, comments, or complaints about this Policy or wish to exercise any of your rights, please contact us:\n\n${COMPANY}\nAttn: Privacy\n${ADDRESS}\nEmail: ${EMAIL}\n\nIf you are located in the EEA or UK and wish to lodge a complaint, you may also contact your local data protection authority.`,
  },
  {
    id: 17, title: 'Changes to This Policy',
    body: `We may update this Policy from time to time. When we make material changes, we will revise the "Last Updated" date and, where required by law, provide additional notice. Your continued use of the Services after the effective date constitutes your acceptance of the changes. We encourage you to review this Policy periodically.`,
  },
  {
    id: 18, title: 'Acknowledgment',
    body: `By using the Services, you acknowledge that you have read this Privacy Policy and understand how we collect, use, and disclose your information.`,
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
      style={{ background: open ? 'rgba(99,102,241,0.04)' : 'rgba(255,255,255,0.025)', border: `1px solid ${open ? 'rgba(99,102,241,0.3)' : 'rgba(255,255,255,0.07)'}`, borderRadius: '16px', marginBottom: '0.75rem', overflow: 'hidden', transition: 'all 0.25s' }}
      onMouseEnter={e => { if (!open) e.currentTarget.style.borderColor = 'rgba(99,102,241,0.2)'; }}
      onMouseLeave={e => { if (!open) e.currentTarget.style.borderColor = 'rgba(255,255,255,0.07)'; }}
    >
      <button onClick={() => setOpen(o => !o)}
        style={{ width: '100%', textAlign: 'left', padding: '1.1rem 1.5rem', background: 'transparent', border: 'none', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
          <span style={{ flexShrink: 0, width: '28px', height: '28px', borderRadius: '8px', background: 'rgba(99,102,241,0.12)', border: '1px solid rgba(99,102,241,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.65rem', fontWeight: 900, color: '#a5b4fc' }}>
            {section.id}
          </span>
          <span style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--text-primary)', lineHeight: 1.35 }}>{section.title}</span>
        </div>
        <span style={{ flexShrink: 0, color: open ? '#a5b4fc' : 'var(--text-secondary)', transition: 'color 0.2s' }}>
          {open ? <ChevronUp size={17} /> : <ChevronDown size={17} />}
        </span>
      </button>
      {open && (
        <div style={{ padding: '0 1.5rem 1.4rem' }}>
          {section.subsections ? section.subsections.map(sub => (
            <div key={sub.title} style={{ marginBottom: '1.25rem' }}>
              <div style={{ fontSize: '0.78rem', fontWeight: 800, color: '#a5b4fc', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.5rem' }}>{sub.title}</div>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: 1.75, margin: 0, whiteSpace: 'pre-line' }}>{sub.body}</p>
            </div>
          )) : (
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: 1.75, margin: 0, whiteSpace: 'pre-line' }}>{section.body}</p>
          )}
        </div>
      )}
    </motion.div>
  );
};

export default function PrivacyPolicy() {
  return (
    <div style={{ background: 'var(--bg-primary)', minHeight: '100vh', overflowX: 'hidden' }}>

      {/* HERO */}
      <section style={{ position: 'relative', padding: '7rem 0 5rem', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: '-10%', left: '50%', transform: 'translateX(-50%)', width: '900px', height: '500px', background: 'radial-gradient(ellipse at center, rgba(99,102,241,0.09) 0%, transparent 70%)', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', inset: 0, backgroundImage: 'linear-gradient(rgba(255,255,255,0.02) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.02) 1px, transparent 1px)', backgroundSize: '60px 60px', pointerEvents: 'none' }} />
        <div className="container" style={{ position: 'relative', zIndex: 1, textAlign: 'center' }}>

          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5 }}
            style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.25)', borderRadius: '99px', padding: '0.35rem 1rem', marginBottom: '1.5rem', fontSize: '0.75rem', fontWeight: 800, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#a5b4fc' }}>
            <Shield size={12} /> Legal
          </motion.div>

          <motion.h1 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.06 }}
            style={{ fontSize: 'clamp(2.2rem, 5vw, 3.5rem)', fontWeight: 900, letterSpacing: '-2px', lineHeight: 1.1, color: 'var(--text-primary)', marginBottom: '1.25rem' }}>
            Privacy <span className="text-gradient">Policy</span>
          </motion.h1>

          <motion.p initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.1 }}
            style={{ fontSize: '1rem', color: 'var(--text-secondary)', maxWidth: '580px', margin: '0 auto 2rem', lineHeight: 1.7 }}>
            How <strong style={{ color: 'var(--text-primary)' }}>{COMPANY}</strong> collects, uses, and protects your information · Effective {EFFECTIVE_DATE}
          </motion.p>

          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.14 }}
            style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
            {[
              { icon: <Mail size={13} />, label: EMAIL, href: `mailto:${EMAIL}`, color: '#a5b4fc' },
              { icon: <MapPin size={13} />, label: ADDRESS, color: '#a5b4fc' },
            ].map(({ icon, label, href, color }) => (
              <div key={label} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '99px', padding: '0.35rem 1rem', fontSize: '0.78rem', color: 'var(--text-secondary)', fontWeight: 500 }}>
                <span style={{ color }}>{icon}</span>
                {href ? <a href={href} style={{ color: 'inherit', textDecoration: 'none' }}>{label}</a> : label}
              </div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* INTRO NOTICE */}
      <section style={{ padding: '0 0 3rem' }}>
        <div className="container" style={{ maxWidth: '860px' }}>
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.16 }}
            style={{ background: 'rgba(99,102,241,0.06)', border: '1px solid rgba(99,102,241,0.2)', borderRadius: '16px', padding: '1.5rem 2rem', marginBottom: '2rem' }}>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem', lineHeight: 1.8, margin: 0 }}>
              This Privacy Policy describes how <strong style={{ color: 'var(--text-primary)' }}>{COMPANY}</strong> collects, uses, discloses, and safeguards information about you when you visit roberttrades.com, purchase our products, or otherwise engage with us. By accessing or using the Services, you acknowledge that you have read and understood this Policy.
            </p>
          </motion.div>

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
          <div style={{ background: 'linear-gradient(135deg, rgba(99,102,241,0.07), rgba(37,99,235,0.04))', border: '1px solid rgba(99,102,241,0.18)', borderRadius: '24px', padding: '3rem 2rem', display: 'inline-block', maxWidth: '560px', width: '100%' }}>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 900, color: 'var(--text-primary)', marginBottom: '0.75rem', letterSpacing: '-0.5px' }}>Questions about your privacy?</h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', lineHeight: 1.65, marginBottom: '1.75rem' }}>
              Contact us at <a href={`mailto:${EMAIL}`} style={{ color: '#a5b4fc', fontWeight: 700 }}>{EMAIL}</a> or read our related policies.
            </p>
            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center', flexWrap: 'wrap' }}>
              <Link to="/terms" style={{ padding: '0.8rem 1.75rem', fontWeight: 800, borderRadius: '12px', background: 'linear-gradient(135deg,#4f46e5,#6366f1)', color: '#fff', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '0.5rem', boxShadow: '0 8px 24px rgba(99,102,241,0.3)' }}>
                Terms of Service <ArrowRight size={15} />
              </Link>
              <Link to="/cookie-policy" style={{ padding: '0.8rem 1.75rem', fontWeight: 700, borderRadius: '12px', border: '1.5px solid rgba(255,255,255,0.1)', color: 'var(--text-secondary)', textDecoration: 'none', transition: 'all 0.2s' }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(99,102,241,0.4)'; e.currentTarget.style.color = '#a5b4fc'; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'; e.currentTarget.style.color = 'var(--text-secondary)'; }}>
                Cookie Policy
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
