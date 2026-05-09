const { Resend } = require('resend');

const sendMail = async (to, subject, html, { replyTo } = {}) => {
  try {
    const resend = new Resend(process.env.RESEND_API_KEY);

    const fromAddress = process.env.RESEND_FROM || `"Robert Trades" <noreply@roberttrades.com>`;

    const payload = {
      from: fromAddress,
      to: Array.isArray(to) ? to : [to],
      subject,
      html,
    };
    if (replyTo) payload.reply_to = replyTo;

    const { data, error } = await resend.emails.send(payload);

    if (error) {
      console.error('Resend email failed:', error);
      return { success: false, error };
    }

    console.log('Email sent via Resend:', data?.id);
    return { success: true, messageId: data?.id };
  } catch (error) {
    console.error('Email send failed:', error.message);
    return { success: false, error };
  }
};

module.exports = { sendMail };

