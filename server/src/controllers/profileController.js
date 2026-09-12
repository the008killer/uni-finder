const pool = require('../config/db');

exports.getProfile = async (req, res) => {
  try {
    const userId = req.user.id;

    const userRes = await pool.query(
      'SELECT id, username, email, country, avatar_url, two_factor_enabled, created_at FROM users WHERE id = $1',
      [userId]
    );

    if (userRes.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    // Get bookmarked programs
    const bookmarksRes = await pool.query(`
      SELECT p.id, p.name AS course_name, p.degree_type, p.language,
        p.tuition_fee_eur, p.duration_semesters, p.semester_start, -- Added these fields
        u.name AS university_name, u.city,
        b.created_at AS bookmarked_at
      FROM bookmarks b
      JOIN programs p ON b.program_id = p.id
      JOIN universities u ON p.university_id = u.id
      WHERE b.user_id = $1
      ORDER BY b.created_at DESC
      `, [userId]
    );

    // Get joined chat groups
    const chatsRes = await pool.query(`
      SELECT cg.id, cg.name, u.name AS university_name,
        p.name AS course_name, cm.joined_at
      FROM chat_members cm
      JOIN chat_groups cg ON cm.group_id = cg.id
      JOIN universities u ON cg.university_id = u.id
      LEFT JOIN programs p ON cg.program_id = p.id
      WHERE cm.user_id = $1
      ORDER BY cm.joined_at DESC
    `, [userId]);

    // Get notification history
    const notificationsRes = await pool.query(`
      SELECT * FROM notifications 
      WHERE user_id = $1 
      ORDER BY created_at DESC 
      LIMIT 50
    `, [userId]);

    res.json({
      success: true,
      data: {
        user: userRes.rows[0],
        bookmarks: bookmarksRes.rows,
        chats: chatsRes.rows,
        notifications: notificationsRes.rows
      }
    });
  } catch (err) {
    console.error('Profile error:', err.message);
    res.status(500).json({ success: false, error: 'Server error' });
  }
};

exports.updateProfile = async (req, res) => {
  try {
    const userId = req.user.id;
    const { username, country, avatar_url } = req.body;

    const updates = [];
    const values = [];
    let idx = 1;

    if (username) { updates.push(`username = $${idx}`); values.push(username); idx++; }
    if (country !== undefined) { updates.push(`country = $${idx}`); values.push(country); idx++; }
    if (avatar_url !== undefined) { updates.push(`avatar_url = $${idx}`); values.push(avatar_url); idx++; }

    if (updates.length === 0) {
      return res.status(400).json({ success: false, error: 'Nothing to update' });
    }

    values.push(userId);
    const result = await pool.query(
      `UPDATE users SET ${updates.join(', ')} WHERE id = $${idx} RETURNING id, username, email, country, avatar_url`,
      values
    );

    res.json({ success: true, user: result.rows[0] });
  } catch (err) {
    if (err.code === '23505') {
      return res.status(400).json({ success: false, error: 'Username already taken' });
    }
    res.status(500).json({ success: false, error: err.message });
  }
};
