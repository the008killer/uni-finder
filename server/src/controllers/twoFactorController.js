// server/src/controllers/twoFactorController.js
const pool = require('../config/db');
const crypto = require('crypto');
const QRCode = require('qrcode');

// ==========================================
// Native RFC 6238 TOTP Engine (Zero otplib dependency)
// ==========================================
const BASE32_CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';

function generateSecret(length = 20) {
  const buffer = crypto.randomBytes(length);
  let secret = '';
  for (let i = 0; i < buffer.length; i++) {
    secret += BASE32_CHARS[buffer[i] % 32];
  }
  return secret;
}

function base32Decode(base32) {
  const cleaned = (base32 || '').toUpperCase().replace(/[^A-Z2-7]/g, '');
  let bits = '';
  for (let i = 0; i < cleaned.length; i++) {
    const val = BASE32_CHARS.indexOf(cleaned[i]);
    bits += val.toString(2).padStart(5, '0');
  }
  const bytes = [];
  for (let i = 0; i + 8 <= bits.length; i += 8) {
    bytes.push(parseInt(bits.substring(i, i + 8), 2));
  }
  return Buffer.from(bytes);
}

function generateTOTP(secret, timeStepOffset = 0) {
  const key = base32Decode(secret);
  const epoch = Math.floor(Date.now() / 1000);
  const timeStep = Math.floor(epoch / 30) + timeStepOffset;

  const buf = Buffer.alloc(8);
  buf.writeBigInt64BE(BigInt(timeStep));

  const hmac = crypto.createHmac('sha1', key).update(buf).digest();
  const offset = hmac[hmac.length - 1] & 0xf;
  const code = (
    ((hmac[offset] & 0x7f) << 24) |
    ((hmac[offset + 1] & 0xff) << 16) |
    ((hmac[offset + 2] & 0xff) << 8) |
    (hmac[offset + 3] & 0xff)
  ) % 1000000;

  return code.toString().padStart(6, '0');
}

function verifyTOTP(token, secret, window = 1) {
  if (!token || !secret) return false;
  const cleanToken = String(token).trim();
  for (let i = -window; i <= window; i++) {
    if (generateTOTP(secret, i) === cleanToken) {
      return true;
    }
  }
  return false;
}

function makeKeyUri(account, issuer, secret) {
  return `otpauth://totp/${encodeURIComponent(issuer)}:${encodeURIComponent(account)}?secret=${secret}&issuer=${encodeURIComponent(issuer)}&algorithm=SHA1&digits=6&period=30`;
}

// ==========================================
// Endpoints
// ==========================================

// Step 1: Generate secret + QR code
exports.setup2FA = async (req, res) => {
  try {
    const userId = req.user.id;
    const userRes = await pool.query('SELECT email, two_factor_enabled FROM users WHERE id = $1', [userId]);
    const user = userRes.rows[0];

    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    if (user.two_factor_enabled) {
      return res.status(400).json({ success: false, error: '2FA is already enabled' });
    }

    const secret = generateSecret(20);
    const otpauthUrl = makeKeyUri(user.email, 'UniFinder', secret);
    const qrCodeDataUrl = await QRCode.toDataURL(otpauthUrl);

    await pool.query('UPDATE users SET two_factor_secret = $1 WHERE id = $2', [secret, userId]);

    res.json({
      success: true,
      data: {
        secret,
        qrCode: qrCodeDataUrl,
      },
    });
  } catch (err) {
    console.error('2FA setup error:', err.message);
    res.status(500).json({ success: false, error: 'Failed to setup 2FA' });
  }
};

// Step 2: Verify code & activate
exports.verify2FASetup = async (req, res) => {
  try {
    const userId = req.user.id;
    const { token } = req.body;

    if (!token) {
      return res.status(400).json({ success: false, error: 'Verification code is required' });
    }

    const userRes = await pool.query('SELECT two_factor_secret FROM users WHERE id = $1', [userId]);
    const secret = userRes.rows[0]?.two_factor_secret;

    if (!secret) {
      return res.status(400).json({ success: false, error: 'No 2FA setup in progress' });
    }

    const isValid = verifyTOTP(token, secret);
    if (!isValid) {
      return res.status(400).json({ success: false, error: 'Invalid code. Please try again.' });
    }

    await pool.query('UPDATE users SET two_factor_enabled = TRUE WHERE id = $1', [userId]);

    res.json({ success: true, message: '2FA enabled successfully!' });
  } catch (err) {
    console.error('2FA verify error:', err.message);
    res.status(500).json({ success: false, error: err.message });
  }
};

// Step 3: Verify code during login
exports.verify2FALogin = async (req, res) => {
  try {
    const { userId, token } = req.body;

    if (!userId || !token) {
      return res.status(400).json({ success: false, error: 'User ID and code are required' });
    }

    const userRes = await pool.query(
      'SELECT id, username, email, avatar_url, two_factor_secret FROM users WHERE id = $1',
      [userId]
    );

    if (userRes.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    const user = userRes.rows[0];

    if (!user.two_factor_secret) {
      return res.status(400).json({ success: false, error: '2FA is not configured for this account' });
    }

    const isValid = verifyTOTP(token, user.two_factor_secret);
    if (!isValid) {
      return res.status(400).json({ success: false, error: 'Invalid 2FA code. Please try again.' });
    }

    const jwt = require('jsonwebtoken');
    const jwtToken = jwt.sign({ id: user.id }, process.env.JWT_SECRET || 'fallback_secret', { expiresIn: '7d' });

    // Return token AND user object
    res.json({
      success: true,
      token: jwtToken,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        avatar_url: user.avatar_url,
      }
    });
  } catch (err) {
    console.error('2FA login error:', err.message);
    res.status(500).json({ success: false, error: err.message });
  }
};

// Step 4: Disable 2FA
exports.disable2FA = async (req, res) => {
  try {
    const { token } = req.body;
    const userId = req.user.id;

    const userRes = await pool.query('SELECT two_factor_secret FROM users WHERE id = $1', [userId]);
    const secret = userRes.rows[0]?.two_factor_secret;

    if (!secret) {
      return res.status(400).json({ success: false, error: '2FA is not enabled' });
    }

    const isValid = verifyTOTP(token, secret);
    if (!isValid) {
      return res.status(400).json({ success: false, error: 'Invalid code. Cannot disable 2FA.' });
    }

    await pool.query(
      'UPDATE users SET two_factor_enabled = FALSE, two_factor_secret = NULL WHERE id = $1',
      [userId]
    );

    res.json({ success: true, message: '2FA disabled successfully' });
  } catch (err) {
    console.error('2FA disable error:', err.message);
    res.status(500).json({ success: false, error: err.message });
  }
};