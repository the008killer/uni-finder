const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.SMTP_PORT) || 587,
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
  connectionTimeout: 5000, // 5s timeout to prevent request hanging
  greetingTimeout: 5000,
  socketTimeout: 5000,
});

// If no SMTP is configured, log to console instead
const sendEmail = async (to, subject, html) => {
  if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
    console.log('\n[DEV MODE] Email would be sent:');
    console.log(`   To: ${to}`);
    console.log(`   Subject: ${subject}`);
    console.log(`   Body: ${html}\n`);
    return;
  }

  try {
    await transporter.sendMail({
      from: `"UniFinder" <${process.env.SMTP_USER}>`,
      to,
      subject,
      html,
    });
  } catch (err) {
    console.error('Nodemailer failed to send email:', err.message);
    console.log(`Fallback Reset Email Content for ${to}:\n${html}`);
  }
};

module.exports = { sendEmail };