const nodemailer = require('nodemailer');

const port = parseInt(process.env.SMTP_PORT, 10) || 465;

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.zoho.com',
  port: port,
  secure: port === 465, 
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
  tls: {
    rejectUnauthorized: false,
  },
  connectionTimeout: 15000,
  greetingTimeout: 15000,
  socketTimeout: 15000,
});

const sendEmail = async (to, subject, html) => {
  if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
    console.log('\n [DEV MODE] Password reset email logged to console:');
    console.log(`   To: ${to}`);
    console.log(`   Subject: ${subject}`);
    console.log(`   Body: ${html}\n`);
    return;
  }

  await transporter.sendMail({
    from: `"UniFinder" <${process.env.SMTP_USER}>`,
    to,
    subject,
    html,
  });
  console.log(`Email sent successfully to ${to}`);
};

module.exports = { sendEmail };