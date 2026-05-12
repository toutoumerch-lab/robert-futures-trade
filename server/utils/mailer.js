const { Resend } = require('resend');

const FROM_ADDRESS = process.env.RESEND_FROM || process.env.MAIL_FROM || `"Robert Trades" <noreply@roberttrades.com>`;

// Lazy-initialize so a missing key logs a warning instead of crashing the server
let _resend = null;
const getResend = () => {
  if (!process.env.RESEND_API_KEY) {
    console.error('[MAIL] RESEND_API_KEY is not set in .env — emails will not send');
    return null;
  }
  if (!_resend) {
    _resend = new Resend(process.env.RESEND_API_KEY);
    console.log('[MAIL] Resend client ready');
  }
  return _resend;
};

/**
 * Send an email via Resend (HTTPS API, never blocked by DigitalOcean).
 * Always resolves — never throws — so callers don't need try/catch.
 * @returns {{ success: boolean, messageId?: string, error?: string }}
 */
const sendMail = async (to, subject, html, { replyTo } = {}) => {
  try {
    const payload = {
      from: FROM_ADDRESS,
      to,
      subject,
      html,
    };
    if (replyTo) payload.reply_to = replyTo;

    const client = getResend();
    if (!client) return { success: false, error: 'RESEND_API_KEY not configured' };

    const { data, error } = await client.emails.send(payload);

    if (error) {
      console.error(`[MAIL] Resend error to ${to}:`, error.message || error);
      return { success: false, error: error.message || String(error) };
    }

    console.log(`[MAIL] Sent to ${to} — id: ${data.id}`);
    return { success: true, messageId: data.id };
  } catch (err) {
    console.error(`[MAIL] Unexpected error sending to ${to}:`, err.message);
    return { success: false, error: err.message };
  }
};

module.exports = { sendMail };
