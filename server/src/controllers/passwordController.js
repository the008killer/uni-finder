const pool = require('../config/db');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const { sendEmail } = require('../config/mailer');

exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email || !email.trim()) {
      return res.status(400).json({ success: false, error: 'Email is required' });
    }

    const cleanEmail = email.trim().toLowerCase();

    // 1. Find user by email or username
    const userRes = await pool.query(
      'SELECT id, email, username FROM users WHERE LOWER(email) = $1 OR LOWER(username) = $1',
      [cleanEmail]
    );

    if (userRes.rows.length === 0) {
      console.log(`Password reset requested for NON-EXISTENT email/username: "${cleanEmail}"`);
      return res.json({
        success: true,
        message: 'If an account exists with that email, a reset link has been sent.'
      });
    }

    const user = userRes.rows[0];
    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetExpires = new Date(Date.now() + 3600000); // 1 hour

    // 2. Save token in PostgreSQL
    await pool.query(
      `UPDATE users 
       SET password_reset_token = $1, password_reset_expires = $2 
       WHERE id = $3`,
      [resetToken, resetExpires, user.id]
    );

    // 3. Build reset URL
    const resetUrl = `https://www.adhikariashwin0.com.np/unifinder/#/reset-password/${resetToken}`;

    // 4. Send response immediately (50ms response to prevent timeouts)
    res.json({
      success: true,
      message: 'If an account exists with that email, a reset link has been sent.'
    });

    // 5. Send email in background (non-blocking)
    sendEmail(
      user.email,
      'UniFinder — Password Reset Request',
      `
      <div style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 12px;">
        <h2 style="color: #0284c7;">UniFinder Password Reset</h2>
        <p>Hello <strong>${user.username}</strong>,</p>
        <p>You requested a password reset. Click the button below (link is valid for 1 hour):</p>
        <div style="margin: 24px 0;">
          <a href="${resetUrl}" style="background-color: #0284c7; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">
            Reset Password
          </a>
        </div>
        <p style="font-size: 12px; color: #64748b;">Or copy this link:<br/><a href="${resetUrl}">${resetUrl}</a></p>
      </div>
      `
    ).catch(err => {
      console.error('Background mailer error:', err.message);
      console.log(`Fallback Reset Link for ${user.email}:\n${resetUrl}`);
    });

  } catch (err) {
    console.error('❌ Forgot password error:', err.message);
    res.status(500).json({ success: false, error: 'Server error processing request' });
  }
};

exports.resetPassword = async (req, res) => {
  try {
    const { token } = req.params;
    const { password } = req.body;

    if (!token || !password) {
      return res.status(400).json({ success: false, error: 'Token and new password are required' });
    }

    if (password.length < 8) {
      return res.status(400).json({ success: false, error: 'Password must be at least 8 characters' });
    }

    const userRes = await pool.query(
      `SELECT id FROM users 
       WHERE password_reset_token = $1 
         AND password_reset_expires > NOW()`,
      [token]
    );

    if (userRes.rows.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Invalid or expired reset token. Please request a new link.'
      });
    }

    const userId = userRes.rows[0].id;
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    await pool.query(
      `UPDATE users 
       SET password_hash = $1, password_reset_token = NULL, password_reset_expires = NULL 
       WHERE id = $2`,
      [passwordHash, userId]
    );

    res.json({ success: true, message: 'Password reset successfully. You can now log in.' });

  } catch (err) {
    console.error('Reset password error:', err.message);
    res.status(500).json({ success: false, error: 'Server error resetting password' });
  }
};