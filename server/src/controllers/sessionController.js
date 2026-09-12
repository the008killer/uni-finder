const pool = require('../config/db');
const { auth } = require('../config/firebase-admin');
const jwt = require('jsonwebtoken');

exports.createSession = async (req, res) => {
  try {
    const { idToken, name, email } = req.body;

    if (!idToken) {
      return res.status(400).json({ success: false, error: 'ID token is required' });
    }

    if (!auth) {
      return res.status(500).json({ 
        success: false, 
        error: 'Firebase Admin not initialized on server. Check server environment variables.' 
      });
    }

    // 1. Verify the Firebase ID token
    const decoded = await auth.verifyIdToken(idToken);
    const firebaseUid = decoded.uid;
    const userEmail = (decoded.email || email || '').trim().toLowerCase();
    const userName = (decoded.name || name || userEmail.split('@')[0]).trim();
    const userAvatar = decoded.picture || null;

    if (!userEmail) {
      return res.status(400).json({ success: false, error: 'User email not found in token' });
    }

    // 2. Check if user already exists in PostgreSQL
    let userRes = await pool.query(
      'SELECT id, username, email, avatar_url FROM users WHERE LOWER(email) = $1',
      [userEmail]
    );

    let user;

    if (userRes.rows.length === 0) {
      // 3. Create new user in PostgreSQL
      const insertRes = await pool.query(
        `INSERT INTO users (username, email, password_hash, avatar_url) 
         VALUES ($1, $2, $3, $4) 
         RETURNING id, username, email, avatar_url`,
        [userName, userEmail, `firebase:${firebaseUid}`, userAvatar]
      );
      user = insertRes.rows[0];
    } else {
      user = userRes.rows[0];
      // Update avatar if provided by Google sign-in and not already set
      if (userAvatar && !user.avatar_url) {
        await pool.query('UPDATE users SET avatar_url = $1 WHERE id = $2', [userAvatar, user.id]);
        user.avatar_url = userAvatar;
      }
    }

    // 4. Issue standard UniFinder JWT for ongoing session requests
    const token = jwt.sign(
      { id: user.id, firebaseUid },
      process.env.JWT_SECRET || 'fallback_secret',
      { expiresIn: '7d' }
    );

    res.json({
      success: true,
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        avatar_url: user.avatar_url,
      },
    });
  } catch (err) {
    console.error('Session creation error:', err.message);
    res.status(401).json({ success: false, error: 'Invalid or expired Firebase token' });
  }
};