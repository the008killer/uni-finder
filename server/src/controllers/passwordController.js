const pool = require('../config/db');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const { sendEmail } = require('../config/mailer');

// Step 1: User enters email → generate reset token
exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ success: false, error: 'Email is required' });
    }

    const userRes = await pool.query('SELECT id, email FROM users WHERE email = $1', [email]);
    if (userRes.rows.length === 0) {
      // Don't reveal if email exists or not (security best practice)
      return res.json({ success: true, message: 'If the email exists, a reset link has been sent.' });
    }

    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetExpires = new Date(Date.now() + 3600000); // 1 hour

    await pool.query(
      'UPDATE users SET password_reset_token = $1, password_reset_expires = $2 WHERE id = $3',
      [resetToken, resetExpires, userRes.rows[0].id]
    );

    const resetUrl = `${process.env.CLIENT_URL || 'http://localhost:5173'}/reset-password/${resetToken}`;

    await sendEmail(
      email,
      'UniFinder — Password Reset',
      `<p>You requested a password reset. Click the link below (valid for 1 hour):</p>
       <a href="${resetUrl}">${resetUrl}</a>
       <p>If you did not request this, ignore this email.</p>`
    );

    res.json({ success: true, message: 'If the email exists, a reset link has been sent.' });
  } catch (err) {
    console.error('Forgot password error:', err.message);
    res.status(500).json({ success: false, error: 'Server error' });
  }
};

// Step 2: User clicks link → enters new password
exports.resetPassword = async (req, res) => {
  try {
    const { token } = req.params;
    const { password } = req.body;

    if (!password || password.length < 6) {
      return res.status(400).json({ success: false, error: 'Password must be at least 6 characters' });
    }

    const userRes = await pool.query(
      'SELECT id FROM users WHERE password_reset_token = $1 AND password_reset_expires > NOW()',
      [token]
    );

    if (userRes.rows.length === 0) {
      return res.status(400).json({ success: false, error: 'Invalid or expired reset token' });
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    await pool.query(
      'UPDATE users SET password_hash = $1, password_reset_token = NULL, password_reset_expires = NULL WHERE id = $2',
      [passwordHash, userRes.rows[0].id]
    );

    res.json({ success: true, message: 'Password reset successfully. You can now log in.' });
  } catch (err) {
    console.error('Reset password error:', err.message);
    res.status(500).json({ success: false, error: 'Server error' });
  }
};