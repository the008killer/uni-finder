const pool = require('../config/db');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const { sendEmail } = require('../config/mailer');

// Step 1: Generate reset token & send email
exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email || !email.trim()) {
      return res.status(400).json({ success: false, error: 'Email is required' });
    }

    const cleanEmail = email.trim().toLowerCase();

    // Check if user exists (case-insensitive)
    const userRes = await pool.query(
      'SELECT id, email, username FROM users WHERE LOWER(email) = $1 OR LOWER(username) = $1',
      [cleanEmail]
    );

    // Security practice: Return success even if email not found to avoid user enumeration
    if (userRes.rows.length === 0) {
      return res.json({
        success: true,
        message: 'If an account exists with that email, a reset link has been sent.'
      });
    }

    const user = userRes.rows[0];
    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetExpires = new Date(Date.now() + 3600000); // 1 hour expiration

    // Save token and expiry in database
    await pool.query(
      `UPDATE users 
       SET password_reset_token = $1, password_reset_expires = $2 
       WHERE id = $3`,
      [resetToken, resetExpires, user.id]
    );

    // Build reset URL compatible with HashRouter
    let clientUrl = (process.env.CLIENT_URL || 'https://adhikariashwin0.com.np/unifinder').replace(/\/+$/, '');
    if (!clientUrl.includes('/unifinder')) {
      clientUrl = `${clientUrl}/unifinder`;
    }
    const resetUrl = `${clientUrl}/#/reset-password/${resetToken}`;

    // Send email safely (catches errors internally so route never crashes)
    try {
      await sendEmail(
        user.email,
        'UniFinder — Password Reset Request',
        `
        <div style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; rounded: 12px;">
          <h2 style="color: #0284c7;">UniFinder Password Reset</h2>
          <p>Hello <strong>${user.username}</strong>,</p>
          <p>You requested a password reset for your UniFinder account. Click the button below to choose a new password (link is valid for 1 hour):</p>
          <div style="margin: 24px 0;">
            <a href="${resetUrl}" style="background-color: #0284c7; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">
              Reset Password
            </a>
          </div>
          <p style="font-size: 12px; color: #64748b;">Or copy this link to your browser:<br/><a href="${resetUrl}">${resetUrl}</a></p>
          <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 20px 0;" />
          <p style="font-size: 11px; color: #94a3b8;">If you did not request a password reset, you can safely ignore this email.</p>
        </div>
        `
      );
    } catch (mailErr) {
      console.error('Mail delivery failed, logging fallback link:', mailErr.message);
      console.log(`Fallback Reset Link: ${resetUrl}`);
    }

    res.json({
      success: true,
      message: 'If an account exists with that email, a reset link has been sent.'
    });

  } catch (err) {
    console.error('Forgot password fatal error:', err);
    res.status(500).json({ success: false, error: 'Server error processing request' });
  }
};

// Step 2: Validate token and update password
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

    // Check token validity and expiration
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

    // Hash new password
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    // Update password and invalidate token
    await pool.query(
      `UPDATE users 
       SET password_hash = $1, password_reset_token = NULL, password_reset_expires = NULL 
       WHERE id = $2`,
      [passwordHash, userId]
    );

    res.json({ success: true, message: 'Password reset successfully. You can now log in.' });

  } catch (err) {
    console.error('Reset password error:', err);
    res.status(500).json({ success: false, error: 'Server error resetting password' });
  }
};