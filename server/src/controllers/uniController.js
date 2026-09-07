const pool = require('../config/db');

exports.getUniversities = async (req, res) => {
  try {
    const { q, city, type, page = 1, limit = 12 } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);
    const conditions = [];
    const values = [];
    let idx = 1;

    if (q) {
      conditions.push(`(u.name ILIKE $${idx} OR u.city ILIKE $${idx})`);
      values.push(`%${q.trim()}%`);
      idx++;
    }
    if (city) {
      conditions.push(`u.city ILIKE $${idx}`);
      values.push(`%${city.trim()}%`);
      idx++;
    }
    if (type) {
      conditions.push(`u.type = $${idx}`);
      values.push(type.toLowerCase());
      idx++;
    }

    const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const countRes = await pool.query(`SELECT COUNT(*) FROM universities u ${where}`, values);
    const total = parseInt(countRes.rows[0].count);

    values.push(parseInt(limit), offset);
    const dataRes = await pool.query(`
      SELECT u.*, COUNT(p.id) AS course_count
      FROM universities u
      LEFT JOIN programs p ON p.university_id = u.id
      ${where}
      GROUP BY u.id
      ORDER BY u.name ASC
      LIMIT $${idx} OFFSET $${idx + 1}
    `, values);

    res.json({
      success: true,
      data: { total, page: parseInt(page), limit: parseInt(limit), totalPages: Math.ceil(total / parseInt(limit)), results: dataRes.rows }
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

exports.getUniversityById = async (req, res) => {
  try {
    const uniRes = await pool.query('SELECT * FROM universities WHERE id = $1', [req.params.id]);
    if (uniRes.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Not found' });
    }
    const progRes = await pool.query(`
      SELECT p.*, cg.id AS chat_group_id
      FROM programs p
      LEFT JOIN chat_groups cg ON cg.program_id = p.id
      WHERE p.university_id = $1
      ORDER BY p.name ASC
    `, [req.params.id]);

    res.json({ success: true, data: { university: uniRes.rows[0], programs: progRes.rows } });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};