const { Resend } = require('resend');

// Resend sends over HTTPS (port 443) — works on DigitalOcean with no firewall changes.
// Sign up at resend.com, add a verified domain/email, copy the API key to .env as RESEND_API_KEY.
const resend = new Resend(process.env.RESEND_API_KEY);

const FROM_ADDRESS = process.env.RESEND_FROM || process.env.MAIL_FROM || `"Robert Trades" <noreply@roberttrades.com>`;

if (!process.env.RESEND_API_KEY) {
  console.error('[MAIL] WARNING: RESEND_API_KEY is not set — emails will fail');
} else {
  console.log('[MAIL] Resend client ready');
}

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

    const { data, error } = await resend.emails.send(payload);

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
