const pool = require('../config/db');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const { sendEmail } = require('../config/mailer');

exports.forgotPassword = async (req, res) => {
  const { email } = req.body;
  console.log(`\[PASSWORD RESET] Request received for: "${email}"`);

  try {
    if (!email || !email.trim()) {
      console.log('[PASSWORD RESET] Rejected: Email parameter is empty');
      return res.status(400).json({ success: false, error: 'Email is required' });
    }

    const cleanEmail = email.trim().toLowerCase();

    // 1. Query Database
    console.log(`[PASSWORD RESET] Querying database for email or username matching: "${cleanEmail}"`);
    const userRes = await pool.query(
      'SELECT id, email, username FROM users WHERE LOWER(email) = $1 OR LOWER(username) = $1',
      [cleanEmail]
    );

    console.log(`[PASSWORD RESET] Database query returned ${userRes.rows.length} matching rows`);

    if (userRes.rows.length === 0) {
      console.log(`[PASSWORD RESET] Email/Username "${cleanEmail}" does not exist in the database.`);
      return res.json({ 
        success: true, 
        message: 'If an account exists with that email, a reset link has been sent.' 
      });
    }

    const user = userRes.rows[0];
    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetExpires = new Date(Date.now() + 3600000); // 1 hour

    // 2. Save token
    console.log(`[PASSWORD RESET] Saving reset token to database for user ID: ${user.id} (${user.username})`);
    await pool.query(
      `UPDATE users 
       SET password_reset_token = $1, password_reset_expires = $2 
       WHERE id = $3`,
      [resetToken, resetExpires, user.id]
    );
    console.log('[PASSWORD RESET] Token saved successfully');

    // 3. Build reset URL
    const resetUrl = `https://www.adhikariashwin0.com.np/unifinder/#/reset-password/${resetToken}`;
    console.log(`[PASSWORD RESET] Generated Link: ${resetUrl}`);

    // 4. Return instant response
    res.json({ 
      success: true, 
      message: 'If an account exists with that email, a reset link has been sent.' 
    });

    // 5. Send email in background
    console.log(`[PASSWORD RESET] Dispatching email in background to: ${user.email}`);
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
    )
    .then(() => {
      console.log(`[PASSWORD RESET] Email successfully sent to ${user.email}`);
    })
    .catch(err => {
      console.error('[PASSWORD RESET] Background mailer failed:', err.message);
      console.log(`[FALLBACK] Use this manual link for ${user.email}:\n${resetUrl}`);
    });

  } catch (err) {
    console.error('[PASSWORD RESET] Fatal internal error:', err.message);
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