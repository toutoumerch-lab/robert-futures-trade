import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { FileText, ChevronDown, ChevronUp, Mail, MapPin, ArrowRight } from 'lucide-react';

const EFFECTIVE_DATE = 'April 29, 2026';
const COMPANY = 'R&C Worldwide Solutions LLC';
const EMAIL = 'admin@roberttrades.com';
const ADDRESS = '30 N Gould St, Sheridan, WY 82801';

const SECTIONS = [
  {
    id: 1, title: 'Eligibility',
    body: `The Services are intended for users who are at least eighteen (18) years of age and who can form legally binding contracts under applicable law. By using the Services, you represent and warrant that:\n\n• You are at least 18 years old;\n• You have the legal capacity and authority to enter into these Terms;\n• You are not barred from using the Services under the laws of the United States or any other applicable jurisdiction;\n• You are not located in, under the control of, or a national or resident of any country or region subject to U.S. embargo;\n• All information you provide to us is true, accurate, current, and complete.\n\nIf you are using the Services on behalf of a business or other legal entity, you represent that you have the authority to bind that entity to these Terms.`,
  },
  {
    id: 2, title: 'Account Registration and Security',
    body: `Some Services require that you create an account. When you register, you agree to:\n\n• Provide accurate, current, and complete information;\n• Maintain and promptly update your account information;\n• Maintain the security and confidentiality of your login credentials;\n• Accept responsibility for all activities that occur under your account;\n• Notify us immediately at ${EMAIL} of any unauthorized use of your account.\n\nYou may not share your account credentials, transfer your account to another person, or allow another person to access the Services using your account.`,
  },
  {
    id: 3, title: 'Description of Services',
    body: `Through the Services, we may offer educational and informational content, digital products, online courses, newsletters, written materials, video content, community forums, coaching or mentoring, software tools, and related products and services.\n\nWe reserve the right to modify, suspend, or discontinue any portion of the Services at any time, with or without notice. We will not be liable to you or to any third party for any modification, suspension, or discontinuation of the Services.`,
  },
  {
    id: 4, title: 'Educational Purpose; No Financial, Investment, or Legal Advice',
    body: `ALL CONTENT, MATERIALS, PRODUCTS, AND SERVICES OFFERED THROUGH THE SITE ARE PROVIDED FOR GENERAL EDUCATIONAL AND INFORMATIONAL PURPOSES ONLY. They are not, and should not be construed as: investment advice, financial advice, trading advice or recommendations, tax advice, legal advice, accounting advice, or a solicitation or offer to buy or sell any security.\n\n${COMPANY} is not a registered investment adviser, broker-dealer, futures commission merchant, or other licensed financial professional. You should consult with appropriately licensed professionals before making any investment, financial, tax, legal, or business decision.\n\nYou are solely responsible for your own decisions and for any consequences of those decisions, including any losses.`,
  },
  {
    id: 5, title: 'Risk Disclosure',
    body: `TRADING AND INVESTING INVOLVE SUBSTANTIAL RISK OF LOSS AND ARE NOT SUITABLE FOR EVERY INVESTOR. YOU MAY LOSE SOME OR ALL OF YOUR INVESTED CAPITAL.\n\nYou acknowledge and agree that:\n\n• Past performance is not indicative of future results;\n• Hypothetical or back-tested results have inherent limitations and do not represent actual trading;\n• Markets are volatile and unpredictable;\n• Leveraged products can result in losses that exceed your initial investment;\n• You should only risk capital that you can afford to lose entirely.`,
  },
  {
    id: 6, title: 'No Guarantee of Results; Earnings Disclaimer',
    body: `We make no representations, warranties, or guarantees that you will achieve any particular results, earnings, profits, or success from using the Services.\n\nAny examples, case studies, testimonials, or earnings statements are for illustrative purposes only. They reflect the experiences of specific individuals and are not typical. Individual results will vary based on numerous factors including your background, experience, effort, market conditions, capital, and risk tolerance.\n\nYou acknowledge that we have not made, and you are not relying on, any representation regarding income, profits, or financial outcomes.`,
  },
  {
    id: 7, title: 'Testimonials and Endorsements',
    body: `Testimonials, reviews, and endorsements reflect the real-life experiences and opinions of individual users. However, these experiences are personal and may not be representative of all users. We do not claim that any user's experience is typical or guaranteed.\n\nTestimonials are not intended to represent that anyone will achieve the same or similar results. Where required, testimonials may be accompanied by disclosures regarding compensation or other material connections.`,
  },
  {
    id: 8, title: 'Purchases, Payments, and Billing',
    subsections: [
      { title: '8.1 Pricing and Payment', body: `All prices are listed in U.S. Dollars and are exclusive of applicable taxes. We reserve the right to change prices at any time, but changes will not affect already-accepted orders. When you make a purchase, you authorize us or our payment processor to charge your payment method for the total amount including any taxes and fees.` },
      { title: '8.2 Subscriptions and Auto-Renewal', body: `Subscription-based Services automatically renew at the end of each period at the then-current price, unless you cancel before the renewal date. You may cancel at any time through your account settings or by contacting ${EMAIL}. Cancellation takes effect at the end of the current billing period.` },
      { title: '8.3 Refund Policy', body: `Unless otherwise stated at the time of purchase, all sales are final. Digital products, downloadable content, and services that have already been delivered or accessed are not eligible for refund. To request a refund where eligible, contact ${EMAIL} within the time period stated in the applicable refund policy.` },
      { title: '8.4 Chargebacks', body: `If you initiate a chargeback without first attempting to resolve the issue with us, we reserve the right to suspend or terminate your account, deny future purchases, and pursue collection of any amounts owed including reasonable attorneys' fees.` },
    ],
  },
  {
    id: 9, title: 'Intellectual Property Rights',
    body: `All content, features, and functionality made available through the Services — including text, graphics, logos, images, audio, video, software, course materials, and the "look and feel" of the Site — are owned by ${COMPANY} or its licensors and are protected by United States and international intellectual property laws.\n\nSubject to these Terms, we grant you a limited, non-exclusive, non-transferable, revocable license to access and use the Services for your personal, non-commercial use only. You may not copy, resell, redistribute, record, reverse engineer, scrape, or use the Services for any commercial purpose without our prior written consent.`,
  },
  {
    id: 10, title: 'User-Submitted Content',
    body: `By submitting content (comments, reviews, images, etc.), you grant ${COMPANY} a worldwide, perpetual, royalty-free, sublicensable license to use, modify, distribute, and publicly display your content in connection with the Services.\n\nYou represent that you own or have all necessary rights to your submitted content, that it does not violate any third-party rights, and that it complies with these Terms. We reserve the right to remove User Content at any time at our sole discretion.`,
  },
  {
    id: 11, title: 'Acceptable Use Policy',
    body: `You agree NOT to use the Services to: violate any applicable law; infringe any intellectual property or privacy rights; post harmful, threatening, or obscene content; impersonate any person or entity; distribute viruses or malicious code; attempt unauthorized access to any part of the Services; engage in spamming; or encourage any third party to do any of the foregoing.\n\nViolation may result in immediate termination of your access and potential civil or criminal liability.`,
  },
  {
    id: 12, title: 'Third-Party Links, Products, and Services',
    body: `The Services may contain links to websites, products, or services owned or operated by third parties. We do not endorse, control, or assume responsibility for any third-party services. Your use of any third-party service is at your own risk and is subject to that party's terms and policies.\n\nWe may participate in affiliate programs and may receive compensation when you click on links to third-party products. This does not increase the price you pay.`,
  },
  {
    id: 13, title: 'DMCA / Copyright Infringement',
    body: `If you believe material on the Services infringes your copyright, send a written notice to our designated agent including: signature of the copyright owner; identification of the infringed work; identification of the infringing material; your contact information; a good-faith belief statement; and a perjury statement.\n\nSend notices to:\n${COMPANY} — Attn: DMCA Agent\n${ADDRESS}\nEmail: ${EMAIL}\n\nWe may terminate accounts of repeat infringers at our discretion.`,
  },
  {
    id: 14, title: 'Disclaimers',
    body: `THE SERVICES ARE PROVIDED "AS IS" AND "AS AVAILABLE," WITHOUT WARRANTIES OF ANY KIND. TO THE FULLEST EXTENT PERMITTED BY LAW, ${COMPANY.toUpperCase()} AND ITS OFFICERS, DIRECTORS, EMPLOYEES, AND AGENTS DISCLAIM ALL WARRANTIES, EXPRESS OR IMPLIED, INCLUDING WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, AND NON-INFRINGEMENT.\n\nTHE COMPANY MAKES NO WARRANTY THAT THE SERVICES WILL MEET YOUR REQUIREMENTS, BE UNINTERRUPTED OR ERROR-FREE, OR THAT ANY INFORMATION OBTAINED WILL BE ACCURATE OR RELIABLE. YOUR USE IS AT YOUR SOLE RISK.`,
  },
  {
    id: 15, title: 'Limitation of Liability',
    body: `TO THE FULLEST EXTENT PERMITTED BY LAW, THE COMPANY PARTIES WILL NOT BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, PUNITIVE, OR EXEMPLARY DAMAGES ARISING OUT OF YOUR USE OF THE SERVICES.\n\nTHE TOTAL AGGREGATE LIABILITY OF THE COMPANY PARTIES TO YOU SHALL NOT EXCEED THE GREATER OF (A) THE TOTAL AMOUNT YOU PAID US IN THE TWELVE MONTHS PRECEDING THE CLAIM, OR (B) ONE HUNDRED U.S. DOLLARS ($100).`,
  },
  {
    id: 16, title: 'Indemnification',
    body: `You agree to defend, indemnify, and hold harmless the Company Parties from and against all claims, damages, losses, liabilities, costs, and expenses (including reasonable attorneys' fees) arising out of or related to: your access to or use of the Services; your violation of these Terms; your violation of any third-party right; your User Content; or any decisions you make based on information from the Services.`,
  },
  {
    id: 17, title: 'Termination',
    body: `We may suspend or terminate your access to the Services at any time, with or without notice and with or without cause. You may terminate your account at any time by contacting ${EMAIL}.\n\nUpon termination, your right to use the Services ceases immediately. Provisions that by their nature should survive termination — including disclaimers, indemnity, limitation of liability, and dispute resolution — shall survive.`,
  },
  {
    id: 18, title: 'Electronic Communications and Consent',
    body: `By using the Services, you consent to receive communications from us electronically, including via email and notices posted on the Site. You agree that all agreements, notices, disclosures, and other communications provided electronically satisfy any legal requirement that such communications be in writing.`,
  },
  {
    id: 19, title: 'Modifications to the Terms',
    body: `We may modify these Terms at any time. If we make material changes, we will notify you by updating the "Last Updated" date and, where appropriate, by providing additional notice. Your continued use of the Services after the effective date of the revised Terms constitutes your acceptance. If you do not agree, you must stop using the Services.`,
  },
  {
    id: 20, title: 'Governing Law and Venue',
    body: `These Terms shall be governed by the laws of the State of Wyoming, without regard to conflict-of-laws principles. Subject to the arbitration clause, exclusive jurisdiction and venue shall be the state or federal courts in Sheridan County, Wyoming. The United Nations Convention on Contracts for the International Sale of Goods does not apply.`,
  },
  {
    id: 21, title: 'Dispute Resolution; Binding Arbitration; Class Action Waiver',
    subsections: [
      { title: '21.1 Informal Resolution', body: `Before initiating any formal proceeding, you agree to first contact us at ${EMAIL} with a written description of your claim. The parties will attempt to resolve the dispute informally for at least sixty (60) days.` },
      { title: '21.2 Binding Arbitration', body: `If informal resolution fails, disputes shall be resolved through binding individual arbitration administered by the AAA under its Consumer Arbitration Rules, in Sheridan, Wyoming. The arbitrator's decision is final and binding.` },
      { title: '21.3 Class Action Waiver', body: `YOU AND THE COMPANY AGREE THAT EACH MAY BRING CLAIMS ONLY IN AN INDIVIDUAL CAPACITY AND NOT AS A PLAINTIFF OR CLASS MEMBER IN ANY CLASS OR REPRESENTATIVE PROCEEDING.` },
      { title: '21.4 30-Day Right to Opt Out', body: `You may opt out of arbitration by sending written notice to ${EMAIL} within thirty (30) days of first becoming subject to these Terms, including your name, postal address, email address, and a clear opt-out statement.` },
    ],
  },
  { id: 22, title: 'Statute of Limitations', body: `Any claim or cause of action arising out of or related to the Services or these Terms must be filed within one (1) year after such claim arose, or be forever barred, except where prohibited by applicable law.` },
  { id: 23, title: 'Force Majeure', body: `We will not be liable for any failure or delay in performance caused by events beyond our reasonable control, including acts of God, natural disasters, war, terrorism, internet failures, power outages, governmental actions, pandemics, or supplier failures.` },
  { id: 24, title: 'Assignment', body: `You may not assign or transfer these Terms or any rights under them without our prior written consent. Any attempted assignment is void. We may assign or transfer these Terms without restriction or notice to you.` },
  { id: 25, title: 'Severability', body: `If any provision of these Terms is held to be invalid or unenforceable, that provision shall be enforced to the maximum extent permissible, and the remaining provisions shall remain in full force and effect.` },
  { id: 26, title: 'No Waiver', body: `Our failure to enforce any right or provision shall not be deemed a waiver of that right or provision. Any waiver must be in writing and signed by an authorized representative of ${COMPANY}.` },
  { id: 27, title: 'Entire Agreement', body: `These Terms, together with our Privacy Policy and any other policies incorporated by reference, constitute the entire agreement between you and ${COMPANY} regarding the Services and supersede all prior agreements and representations.` },
  { id: 28, title: 'Relationship of the Parties', body: `Nothing in these Terms creates any agency, partnership, joint venture, employment, or franchise relationship between you and ${COMPANY}. Neither party has the authority to bind the other or incur any obligation on the other's behalf.` },
  { id: 29, title: 'Export Controls', body: `You agree to comply with all applicable U.S. and foreign export-control and trade-sanctions laws in connection with your use of the Services. You represent that you are not located in any country subject to U.S. embargoes and are not on any U.S. government list of prohibited parties.` },
  { id: 30, title: 'How to Contact Us', body: `If you have questions, comments, or complaints about these Terms or the Services, please contact us:\n\n${COMPANY}\nAttn: Legal\n${ADDRESS}\nEmail: ${EMAIL}` },
];

const SectionCard = ({ section, index }) => {
  const [open, setOpen] = useState(false);
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: index * 0.03, ease: [0.16, 1, 0.3, 1] }}
      style={{ background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '16px', marginBottom: '0.75rem', overflow: 'hidden', transition: 'border-color 0.2s' }}
      onMouseEnter={e => e.currentTarget.style.borderColor = 'rgba(37,99,235,0.25)'}
      onMouseLeave={e => e.currentTarget.style.borderColor = open ? 'rgba(37,99,235,0.3)' : 'rgba(255,255,255,0.07)'}
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
                <div style={{ fontSize: '0.8rem', fontWeight: 800, color: '#60a5fa', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.5rem' }}>{sub.title}</div>
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

export default function TermsOfService() {
  return (
    <div style={{ background: 'var(--bg-primary)', minHeight: '100vh', overflowX: 'hidden' }}>

      {/* HERO */}
      <section style={{ position: 'relative', padding: '7rem 0 5rem', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: '-10%', left: '50%', transform: 'translateX(-50%)', width: '900px', height: '500px', background: 'radial-gradient(ellipse at center, rgba(37,99,235,0.1) 0%, transparent 70%)', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', inset: 0, backgroundImage: 'linear-gradient(rgba(255,255,255,0.02) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.02) 1px, transparent 1px)', backgroundSize: '60px 60px', pointerEvents: 'none' }} />

        <div className="container" style={{ position: 'relative', zIndex: 1, textAlign: 'center' }}>
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5 }}
            style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', background: 'rgba(37,99,235,0.1)', border: '1px solid rgba(37,99,235,0.25)', borderRadius: '99px', padding: '0.35rem 1rem', marginBottom: '1.5rem', fontSize: '0.75rem', fontWeight: 800, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#60a5fa' }}>
            <FileText size={12} /> Legal
          </motion.div>

          <motion.h1 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.06 }}
            style={{ fontSize: 'clamp(2.2rem, 5vw, 3.5rem)', fontWeight: 900, letterSpacing: '-2px', lineHeight: 1.1, color: 'var(--text-primary)', marginBottom: '1.25rem' }}>
            Terms of <span className="text-gradient">Service</span>
          </motion.h1>

          <motion.p initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.1 }}
            style={{ fontSize: '1rem', color: 'var(--text-secondary)', maxWidth: '560px', margin: '0 auto 2rem', lineHeight: 1.7 }}>
            Operated by <strong style={{ color: 'var(--text-primary)' }}>{COMPANY}</strong> · Effective {EFFECTIVE_DATE}
          </motion.p>

          {/* Quick info strip */}
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.14 }}
            style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
            {[
              { icon: <Mail size={13} />, label: EMAIL, href: `mailto:${EMAIL}` },
              { icon: <MapPin size={13} />, label: ADDRESS },
            ].map(({ icon, label, href }) => (
              <div key={label} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '99px', padding: '0.35rem 1rem', fontSize: '0.78rem', color: 'var(--text-secondary)', fontWeight: 500 }}>
                <span style={{ color: '#60a5fa' }}>{icon}</span>
                {href ? <a href={href} style={{ color: 'inherit', textDecoration: 'none' }}>{label}</a> : label}
              </div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* IMPORTANT NOTICE */}
      <section style={{ padding: '0 0 3rem' }}>
        <div className="container" style={{ maxWidth: '860px' }}>
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.18 }}
            style={{ background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: '16px', padding: '1.5rem 2rem', marginBottom: '2rem' }}>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem', lineHeight: 1.8, margin: 0 }}>
              <strong style={{ color: '#f87171' }}>PLEASE READ CAREFULLY.</strong> These Terms contain important information about your legal rights and obligations, including limitations and exclusions, indemnification obligations, and a binding arbitration clause and class action waiver (Section 21) that affect how disputes are resolved. By accessing or using the Services, you agree to be bound by these Terms.
            </p>
          </motion.div>

          {/* Sections */}
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
          <div style={{ background: 'linear-gradient(135deg, rgba(37,99,235,0.08), rgba(37,99,235,0.03))', border: '1px solid rgba(37,99,235,0.18)', borderRadius: '24px', padding: '3rem 2rem', display: 'inline-block', maxWidth: '560px', width: '100%' }}>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 900, color: 'var(--text-primary)', marginBottom: '0.75rem', letterSpacing: '-0.5px' }}>Questions about these Terms?</h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', lineHeight: 1.65, marginBottom: '1.75rem' }}>
              Contact us at <a href={`mailto:${EMAIL}`} style={{ color: '#60a5fa', fontWeight: 700 }}>{EMAIL}</a> or visit our Contact page.
            </p>
            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center', flexWrap: 'wrap' }}>
              <Link to="/contact" className="btn btn-primary" style={{ padding: '0.8rem 1.75rem', fontWeight: 800, borderRadius: '12px', display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}>
                Contact Us <ArrowRight size={15} />
              </Link>
              <Link to="/" style={{ padding: '0.8rem 1.75rem', fontWeight: 700, borderRadius: '12px', border: '1.5px solid rgba(255,255,255,0.1)', color: 'var(--text-secondary)', textDecoration: 'none', transition: 'all 0.2s' }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(37,99,235,0.4)'; e.currentTarget.style.color = '#93c5fd'; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'; e.currentTarget.style.color = 'var(--text-secondary)'; }}>
                Back to Home
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
