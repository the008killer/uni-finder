const pool = require('../config/db');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET;

exports.register = async (req, res) => {
  try {
    const { username, email, password } = req.body;

    if (!username || !email || !password) {
      return res.status(400).json({ success: false, error: 'All fields are required' });
    }

    // Check if user exists
    const userExists = await pool.query('SELECT * FROM users WHERE email = $1 OR username = $2', [email, username]);
    if (userExists.rows.length > 0) {
      return res.status(400).json({ success: false, error: 'Username or email already taken' });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    // Insert user
    const newUser = await pool.query(
      'INSERT INTO users (username, email, password_hash) VALUES ($1, $2, $3) RETURNING id, username, email, avatar_url',
      [username, email, passwordHash]
    );

    // Generate token
    const token = jwt.sign({ id: newUser.rows[0].id }, JWT_SECRET, { expiresIn: '7d' });

    res.status(201).json({ success: true, token, user: newUser.rows[0] });
  } catch (err) {
    console.error('Registration error:', err.message);
    res.status(500).json({ success: false, error: 'Server error during registration' });
  }
};

exports.login = async (req, res) => {
  try {
    const identifier = (req.body.identifier || req.body.email).trim();
    const { password } = req.body;

    if (!identifier || !password) {
      return res.status(400).json({
        success: false,
        error: 'Email or username and password are required'
      });
    }

    const result = await pool.query(
      `SELECT *
        FROM users
        WHERE LOWER(email) = LOWER($1)
        OR LOWER(username) = LOWER($1)
        LIMIT 1`,
      [identifier]
    );
    const user = result.rows[0];

    // Check password
    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return res.status(400).json({ success: false, error: 'Invalid credentials' });
    }

    // if 2fa is enabled . don't issue token yet - ask for 2fa
    if (user.two_factor_enabled) {
      return res.json({
        success: true,
        requires2FA: true,
        userId: user.id
      });
    }
    // Generate token
    const token = jwt.sign({ id: user.id }, JWT_SECRET, { expiresIn: '7d' });

    res.json({
      success: true,
      token,
      user: { id: user.id, username: user.username, email: user.email, avatar_url: user.avatar_url }
    });
  } catch (err) {
    console.error('Login error:', err.message);
    res.status(500).json({ success: false, error: 'Server error during login' });
  }
};

// Get authenticated user info
exports.getMe = async (req, res) => {
  try {
    const result = await pool.query('SELECT id, username, email, country, avatar_url, two_factor_enabled FROM users WHERE id = $1', [req.user.id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }
    res.json({ success: true, user: result.rows[0] });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};