const { Resend } = require('resend');
const nodemailer = require('nodemailer');

const smtpTransporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 587,
  secure: false, // true for 465, false for other ports
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_APP_PASSWORD,
  },
  tls: {
    rejectUnauthorized: false // Helps with some VPS network restrictions
  }
});

const sendSmtpMail = async (to, subject, html) => {
  try {
    const info = await smtpTransporter.sendMail({
      from: `"Robert Trades" <${process.env.GMAIL_USER}>`,
      to,
      subject,
      html,
    });
    console.log('Email sent via SMTP:', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('SMTP email send failed:', error.message);
    return { success: false, error: error.message };
  }
};

const sendMail = async (to, subject, html, { replyTo } = {}) => {
  try {
    const resend = new Resend(process.env.RESEND_API_KEY);

    const fromAddress = process.env.RESEND_FROM || `Robert Trades <onboarding@resend.dev>`;

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

module.exports = { sendMail, sendSmtpMail };

