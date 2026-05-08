const nodemailer = require('nodemailer');

const sendMail = async (to, subject, html, { replyTo } = {}) => {
  try {
    const transporter = nodemailer.createTransport({
      host: 'smtp.gmail.com',
      port: 587,
      secure: false, // true for 465, false for other ports
      auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_APP_PASSWORD,
      },
      connectionTimeout: 10000,
      greetingTimeout: 10000,
      socketTimeout: 10000,
    });

    const mailOptions = {
      from: `"Robert Trades" <${process.env.GMAIL_USER}>`,
      to,
      subject,
      html,
    };
    if (replyTo) mailOptions.replyTo = replyTo;

    const info = await transporter.sendMail(mailOptions);
    console.log('Email sent:', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('Email send failed:', error.message);
    return { success: false, error };
  }
};

module.exports = { sendMail };
