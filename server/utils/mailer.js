const { Resend } = require('resend');
const nodemailer = require('nodemailer');

// Primary Mailer using Resend API (to bypass VPS port blocks)
const sendMail = async (to, subject, html, { replyTo } = {}) => {
  try {
    if (!process.env.RESEND_API_KEY) {
      throw new Error('RESEND_API_KEY is missing in .env');
    }

    const resend = new Resend(process.env.RESEND_API_KEY);
    
    // Using onboarding@resend.dev as requested by the user
    const fromAddress = 'Robert Trades <onboarding@resend.dev>';

    const payload = {
      from: fromAddress,
      to: Array.isArray(to) ? to : [to],
      subject,
      html,
    };
    if (replyTo) payload.reply_to = replyTo;

    const { data, error } = await resend.emails.send(payload);

    if (error) {
      console.error('Resend API error:', error.message);
      return { success: false, error: error.message };
    }

    console.log('Email sent successfully via Resend API (Onboarding):', data?.id);
    return { success: true, messageId: data?.id };
  } catch (error) {
    console.error('Email send failed (Resend):', error.message);
    return { success: false, error: error.message };
  }
};

// SMTP Transporter kept only as a secondary fallback or legacy alias
const smtpTransporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 2525, // Alternative port often open on VPS
  secure: false,
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_APP_PASSWORD,
  },
});

const sendSmtpMail = async (to, subject, html) => {
  try {
    const info = await smtpTransporter.sendMail({
      from: `"Robert Trades" <${process.env.GMAIL_USER}>`,
      to,
      subject,
      html,
    });
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('SMTP fallback failed:', error.message);
    return { success: false, error: error.message };
  }
};

module.exports = { sendMail, sendSmtpMail };
