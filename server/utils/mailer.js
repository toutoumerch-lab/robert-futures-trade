const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  host:   process.env.SMTP_HOST   || 'smtp.gmail.com',
  port:   Number(process.env.SMTP_PORT) || 587,
  secure: process.env.SMTP_SECURE === 'true', // false → STARTTLS on port 587
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_APP_PASSWORD,
  },
  tls: {
    rejectUnauthorized: true,
  },
});

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
    console.log('Email sent via Gmail SMTP:', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('Gmail SMTP send failed:', error.message);
    return { success: false, error };
  }
};

module.exports = { sendMail };
