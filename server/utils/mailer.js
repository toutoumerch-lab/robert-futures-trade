const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  host:   process.env.SMTP_HOST || 'smtp.gmail.com',
  port:   Number(process.env.SMTP_PORT) || 587,
  secure: process.env.SMTP_SECURE === 'true', // false → STARTTLS on 587
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_APP_PASSWORD,
  },
  // Tight timeouts so a blocked/slow SMTP never hangs the process
  connectionTimeout: 10_000,  // 10s to establish TCP connection
  greetingTimeout:   10_000,  // 10s to receive SMTP greeting
  socketTimeout:     20_000,  // 20s of socket inactivity before abort
  tls: {
    rejectUnauthorized: true,
  },
});

// Verify credentials at startup — logs error but never crashes the server
transporter.verify((err) => {
  if (err) {
    console.error('[SMTP] Connection check failed:', err.message);
    console.error('[SMTP] Check GMAIL_USER, GMAIL_APP_PASSWORD, and that port 587 is reachable');
  } else {
    console.log('[SMTP] Ready — connected to', process.env.SMTP_HOST || 'smtp.gmail.com', 'port', process.env.SMTP_PORT || 587);
  }
});

/**
 * Send an email.  Always resolves (never throws) so callers don't need try/catch.
 * @returns {{ success: boolean, messageId?: string, error?: string }}
 */
const sendMail = async (to, subject, html, { replyTo } = {}) => {
  try {
    const mailOptions = {
      from: `"Robert Trades" <${process.env.GMAIL_USER}>`,
      to,
      subject,
      html,
    };
    if (replyTo) mailOptions.replyTo = replyTo;

    const info = await transporter.sendMail(mailOptions);
    console.log(`[SMTP] Sent to ${to} — messageId: ${info.messageId}`);
    return { success: true, messageId: info.messageId };
  } catch (err) {
    console.error(`[SMTP] Failed to send to ${to}:`, err.message);
    return { success: false, error: err.message };
  }
};

module.exports = { sendMail };
