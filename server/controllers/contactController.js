const nodemailer = require('nodemailer');
const { pool }   = require('../config/db');

/* ── lazy-init transporter so env vars are loaded ── */
let _transporter = null;
const getTransporter = () => {
  if (!_transporter) {
    _transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
  }
  return _transporter;
};

/* ── Fetch the current contact email from settings ── */
const getContactEmail = async () => {
  try {
    const result = await pool.query(
      "SELECT value FROM settings WHERE key = 'contact_email'"
    );
    return result.rows[0]?.value || process.env.SMTP_USER;
  } catch {
    return process.env.SMTP_USER;
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

  // Check SMTP is configured
  if (!process.env.SMTP_USER || process.env.SMTP_USER === 'your-gmail@gmail.com') {
    console.warn('[Contact] SMTP not configured — email not sent.');
    return res.status(503).json({ error: 'Email service is not configured yet. Please contact us directly.' });
  }

  const toEmail = await getContactEmail();

  const SUBJECT_LABELS = {
    general:     'General Inquiry',
    courses:     'Course Support',
    billing:     'Billing & Payments',
    technical:   'Technical Issue',
    partnership: 'Partnership / Collab',
    other:       'Other',
  };
  const subjectLabel = SUBJECT_LABELS[subject] || subject || 'General Inquiry';

  const mailOptions = {
    from:    `"Robert Trades Futures — Contact Form" <${process.env.SMTP_USER}>`,
    to:      toEmail,
    replyTo: email,
    subject: `[Contact Form] ${subjectLabel} — from ${name}`,
    html: `
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
            Sent via the contact form on <strong>roberttradesfutures.com</strong> · Reply directly to this email to respond to ${name}.
          </p>
        </div>
      </div>
    `,
  };

  try {
    await getTransporter().sendMail(mailOptions);
    res.json({ message: 'Message sent successfully.' });
  } catch (err) {
    console.error('[Contact] Failed to send email:', err.message);
    res.status(500).json({ error: 'Failed to send message. Please try again later.' });
  }
};

module.exports = { sendContactMessage };
