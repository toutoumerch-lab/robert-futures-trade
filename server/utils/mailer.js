const nodemailer = require('nodemailer');

// Primary SMTP Transporter (Gmail / Google Workspace)
const smtpTransporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 465,
  secure: true, // use SSL
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_APP_PASSWORD,
  },
  connectionTimeout: 5000, // 5 seconds
  greetingTimeout: 5000,
  socketTimeout: 5000,
});

/**
 * Sends an email using SMTP (Nodemailer)
 */
const sendMail = async (to, subject, html, { replyTo } = {}) => {
  try {
    const payload = {
      from: `"Robert Trades" <${process.env.GMAIL_USER}>`,
      to,
      subject,
      html,
    };
    if (replyTo) payload.replyTo = replyTo;

    const info = await smtpTransporter.sendMail(payload);
    console.log('Email sent successfully via SMTP:', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('Email send failed (SMTP):', error.message);
    return { success: false, error: error.message };
  }
};

// Legacy alias for compatibility during migration
const sendSmtpMail = sendMail;

module.exports = { sendMail, sendSmtpMail };
