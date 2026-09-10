const pool = require('../config/db');

exports.toggleBookmark = async (req, res) => {
    try {
        const userId = req.user.id;
        const { programId } = req.params;

        const existing = await pool.query(
            'SELECT id FROM bookmarks WHERE user_id = $1 AND program_id = $2',
            [userId, programId]
        );

        if (existing.rows.length > 0) {
            await pool.query(
                'DELETE FROM bookmarks WHERE user_id = $1 AND program_id = $2',
                [userId, programId]
            );
            return res.json({ success: true, bookmarked: false, message: 'Removed from saved courses' });
        } else {
            await pool.query(
                'INSERT INTO bookmarks (user_id, program_id) VALUES ($1, $2)',
                [userId, programId]
            );
            return res.json({ success: true, bookmarked: true, message: 'Course saved successfully' });
        }
    } catch (err) {
        console.error('Bookmark toggle error:', err.message);
        res.status(500).json({ success: false, error: 'Server error' });
    }
};

exports.checkBookmarkStatus = async (req, res) => {
    try {
        const userId = req.user.id;
        const { programId } = req.params;

        const result = await pool.query(
            'SELECT id FROM bookmarks WHERE user_id = $1 AND program_id = $2',
            [userId, programId]
        );

        res.json({ success: true, bookmarked: result.rows.length > 0 });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
};

// Get all bookmarked program IDs for current user (for search cards highlighting)
exports.getMyBookmarkIds = async (req, res) => {
    try {
        const userId = req.user.id;
        const result = await pool.query('SELECT program_id FROM bookmarks WHERE user_id = $1', [userId]);
        const ids = result.rows.map(r => r.program_id);
        res.json({ success: true, data: ids });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
};

exports.removeBookmark = async (req, res) => {
  try {
    const userId = req.user.id;
    const { programId } = req.params;

    await pool.query(
      'DELETE FROM bookmarks WHERE user_id = $1 AND program_id = $2',
      [userId, programId]
    );

    res.json({ success: true, message: 'Bookmark removed' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};