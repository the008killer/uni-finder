const pool = require('../config/db');

exports.getPrograms = async (req, res) => {
  try {
    const {
      q, degree, language, subject, city, uniType, maxFee,
      page = 1, limit = 12, sortBy = 'name'
    } = req.query;

    const offset = (parseInt(page) - 1) * parseInt(limit);
    const conditions = [];
    const values = [];
    let idx = 1;

    if (q && q.trim()) {
      conditions.push(`(p.name ILIKE $${idx} OR u.name ILIKE $${idx} OR p.subject_area ILIKE $${idx} OR u.city ILIKE $${idx})`);
      values.push(`%${q.trim()}%`);
      idx++;
    }
    if (degree) {
      conditions.push(`p.degree_type = $${idx}`);
      values.push(degree.toLowerCase());
      idx++;
    }
    if (language) {
      conditions.push(`p.language = $${idx}`);
      values.push(language.toLowerCase());
      idx++;
    }
    if (subject) {
      conditions.push(`p.subject_area ILIKE $${idx}`);
      values.push(`%${subject}%`);
      idx++;
    }
    if (city) {
      conditions.push(`u.city ILIKE $${idx}`);
      values.push(`%${city}%`);
      idx++;
    }
    if (uniType) {
      conditions.push(`u.type = $${idx}`);
      values.push(uniType.toLowerCase());
      idx++;
    }
    if (maxFee !== undefined && maxFee !== '') {
      conditions.push(`p.tuition_fee_eur <= $${idx}`);
      values.push(parseFloat(maxFee));
      idx++;
    }

    const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    let orderBy = 'ORDER BY p.name ASC';
    if (sortBy === 'fee_asc') orderBy = 'ORDER BY p.tuition_fee_eur ASC';
    if (sortBy === 'fee_desc') orderBy = 'ORDER BY p.tuition_fee_eur DESC';

    const countRes = await pool.query(
      `SELECT COUNT(*) FROM programs p JOIN universities u ON p.university_id = u.id ${where}`,
      values
    );
    const total = parseInt(countRes.rows[0].count);

    const dataQuery = `
      SELECT 
        p.id, p.name AS course_name, p.name_short, p.degree_type,
        p.language, p.subject_area, p.duration_semesters,
        p.tuition_fee_eur, p.required_german_level,
        p.required_english_level, p.semester_start, p.course_link,
        u.id AS university_id, u.name AS university_name,
        u.city, u.state, u.type AS university_type,
        u.website AS university_website,
        cg.id AS chat_group_id
      FROM programs p
      JOIN universities u ON p.university_id = u.id
      LEFT JOIN chat_groups cg ON cg.program_id = p.id
      ${where}
      ${orderBy}
      LIMIT $${idx} OFFSET $${idx + 1}
    `;
    values.push(parseInt(limit), offset);
    const dataRes = await pool.query(dataQuery, values);

    res.json({
      success: true,
      data: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(total / parseInt(limit)),
        results: dataRes.rows
      }
    });
  } catch (err) {
    console.error('Programs error:', err.message);
    res.status(500).json({ success: false, error: 'Error fetching programs' });
  }
};

exports.getProgramById = async (req, res) => {
  try {
    const query = `
      SELECT p.*, u.name AS university_name, u.city, u.state,
        u.country, u.type AS university_type,
        u.website AS university_website,
        cg.id AS chat_group_id
      FROM programs p
      JOIN universities u ON p.university_id = u.id
      LEFT JOIN chat_groups cg ON cg.program_id = p.id
      WHERE p.id = $1
    `;
    const result = await pool.query(query, [req.params.id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Not found' });
    }
    res.json({ success: true, data: result.rows[0] });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};