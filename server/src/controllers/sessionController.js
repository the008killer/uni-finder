const pool = require('../config/db');
const admin = require('../config/firebase-admin');
const jwt = require('jsonwebtoken');

exports.createSession = async (req, res) => {
  try {
    const { idToken, name, email } = req.body;

    if (!idToken) {
      return res.status(400).json({ success: false, error: 'ID token is required' });
    }

    // Verify the Firebase token
    const decoded = await admin.auth().verifyIdToken(idToken);
    const firebaseUid = decoded.uid;
    const userEmail = decoded.email || email;
    const userName = decoded.name || name || userEmail.split('@')[0];

    // Check if user exists in our PostgreSQL database
    let userRes = await pool.query('SELECT * FROM users WHERE email = $1', [userEmail]);

    if (userRes.rows.length === 0) {
      // Create new user in our database
      userRes = await pool.query(
        `INSERT INTO users (username, email, password_hash) 
         VALUES ($1, $2, $3) 
         RETURNING id, username, email, avatar_url`,
        [userName, userEmail, `firebase:${firebaseUid}`]
      );
    }

    const user = userRes.rows[0];

    // Issue our own JWT for API calls
    const token = jwt.sign(
      { id: user.id, firebaseUid },
      process.env.JWT_SECRET || 'fallback_secret',
      { expiresIn: '7d' }
    );

    res.json({
      success: true,
      token,
      user: { id: user.id, username: user.username, email: user.email, avatar_url: user.avatar_url },
    });
  } catch (err) {
    console.error('Session creation error:', err.message);
    res.status(401).json({ success: false, error: 'Invalid Firebase token' });
  }
};