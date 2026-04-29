const { Resend } = require('resend');
const { pool }   = require('../config/db');

const getResend = () => new Resend(process.env.RESEND_API_KEY);

/* ── Fetch the current contact email from settings ── */
const getContactEmail = async () => {
  try {
    const result = await pool.query(
      "SELECT value FROM settings WHERE key = 'contact_email'"
    );
    return result.rows[0]?.value || 'admin@roberttrades.com';
  } catch {
    return 'admin@roberttrades.com';
  }
};

/* ── POST /api/contact ── */
const sendContactMessage = async (req, res) => {
  const { name, email, subject, message } = req.body;

  // Basic validation
  if (!name?.trim() || !email?.trim() || !message?.trim()) {
    return res.status(400).json({ error: 'Name, email and message are required.' });
  }
  if (!/\S+@\S+\.\S+/.test(email)) {
    return res.status(400).json({ error: 'Invalid email address.' });
  }

  // Check Resend is configured
  if (!process.env.RESEND_API_KEY || process.env.RESEND_API_KEY === 're_your_api_key_here') {
    console.warn('[Contact] Resend API key not configured — email not sent.');
    return res.status(503).json({ error: 'Email service is not configured yet. Please contact us directly at admin@roberttrades.com' });
  }

  const toEmail    = await getContactEmail();
  const fromEmail  = process.env.RESEND_FROM || 'onboarding@resend.dev';

  const SUBJECT_LABELS = {
    general:     'General Inquiry',
    courses:     'Course Support',
    billing:     'Billing & Payments',
    technical:   'Technical Issue',
    partnership: 'Partnership / Collab',
    other:       'Other',
  };
  const subjectLabel = SUBJECT_LABELS[subject] || subject || 'General Inquiry';

  const html = `
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; background: #f9fafb; border-radius: 12px; overflow: hidden;">
      <div style="background: #1d4ed8; padding: 24px 32px;">
        <h2 style="color: #fff; margin: 0; font-size: 20px;">New Contact Form Message</h2>
        <p style="color: rgba(255,255,255,0.75); margin: 4px 0 0; font-size: 13px;">Robert Trades Futures Platform</p>
      </div>
      <div style="padding: 28px 32px; background: #fff;">
        <table style="width:100%; border-collapse: collapse; font-size: 14px;">
          <tr>
            <td style="padding: 8px 0; color: #6b7280; width: 110px; font-weight: 600;">Name</td>
            <td style="padding: 8px 0; color: #111827; font-weight: 700;">${name}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; color: #6b7280; font-weight: 600;">Email</td>
            <td style="padding: 8px 0;"><a href="mailto:${email}" style="color: #2563eb;">${email}</a></td>
          </tr>
          <tr>
            <td style="padding: 8px 0; color: #6b7280; font-weight: 600;">Subject</td>
            <td style="padding: 8px 0; color: #111827;">${subjectLabel}</td>
          </tr>
        </table>
        <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 20px 0;" />
        <p style="color: #6b7280; font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em; margin: 0 0 10px;">Message</p>
        <p style="color: #111827; font-size: 15px; line-height: 1.7; white-space: pre-wrap; margin: 0;">${message}</p>
      </div>
      <div style="padding: 16px 32px; background: #f3f4f6; text-align: center;">
        <p style="color: #9ca3af; font-size: 12px; margin: 0;">
          Sent via the contact form on <strong>roberttrades.com</strong> · Reply to this email to respond to ${name}.
        </p>
      </div>
    </div>
  `;

  try {
    const resend = getResend();
    const { error } = await resend.emails.send({
      from:     fromEmail,
      to:       toEmail,
      replyTo:  email,
      subject:  `[Contact Form] ${subjectLabel} — from ${name}`,
      html,
    });

    if (error) {
      console.error('[Contact] Resend error:', error);
      return res.status(500).json({ error: 'Failed to send message. Please try again later.' });
    }

    res.json({ message: 'Message sent successfully.' });
  } catch (err) {
    console.error('[Contact] Unexpected error:', err.message);
    res.status(500).json({ error: 'Failed to send message. Please try again later.' });
  }
};

module.exports = { sendContactMessage };
