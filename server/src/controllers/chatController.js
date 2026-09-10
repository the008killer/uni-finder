const pool = require('../config/db');

// Get active groups user is currently a member of
exports.getMyGroups = async (req, res) => {
    try {
        const userId = req.user.id;
        const result = await pool.query(`
      SELECT cg.id, cg.name, 
        COALESCE(u.name, '') AS university_name,
        COALESCE(p.name, '') AS course_name, 
        p.degree_type,
        cm.joined_at
      FROM chat_members cm
      JOIN chat_groups cg ON cm.group_id = cg.id
      LEFT JOIN universities u ON cg.university_id = u.id
      LEFT JOIN programs p ON cg.program_id = p.id
      WHERE cm.user_id = $1
      ORDER BY cm.joined_at DESC;
    `, [userId]);

        res.json({ success: true, data: result.rows });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
};

// Join a chat group manually
exports.joinGroup = async (req, res) => {
    try {
        const userId = req.user.id;
        const { groupId } = req.params;

        await pool.query(`
      INSERT INTO chat_members (user_id, group_id)
      VALUES ($1, $2)
      ON CONFLICT (user_id, group_id) DO NOTHING;
    `, [userId, groupId]);

        res.json({ success: true, message: 'Joined chat group successfully' });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
};

// Fetch chat message history for pagination
exports.getRoomMessages = async (req, res) => {
    try {
        const { groupId } = req.params;
        const { section = 'general', limit = 50 } = req.query;

        const result = await pool.query(`
      SELECT m.id, m.content, m.sent_at, m.section,
        u.id AS sender_id, u.username, u.avatar_url
      FROM messages m
      JOIN users u ON m.user_id = u.id
      WHERE m.group_id = $1 AND m.section = $2
      ORDER BY m.sent_at ASC
      LIMIT $3;
    `, [groupId, section, parseInt(limit, 10)]);

        const formatted = result.rows.map(r => ({
            id: r.id,
            content: r.content,
            sent_at: r.sent_at,
            section: r.section,
            sender: {
                id: r.sender_id,
                username: r.username,
                avatar_url: r.avatar_url,
            }
        }));

        res.json({ success: true, data: formatted });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
};

// leave chat function
exports.leaveGroup = async (req, res) => {
  try {
    const userId = req.user.id;
    const { groupId } = req.params;

    await pool.query(
      'DELETE FROM chat_members WHERE user_id = $1 AND group_id = $2',
      [userId, groupId]
    );

    res.json({ success: true, message: 'Left chat group successfully' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};