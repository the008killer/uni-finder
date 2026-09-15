const pool = require('../config/db');

exports.getUniversities = async (req, res) => {
  try {
    const { q, city, type, page = 1, limit = 12 } = req.query;

    const pageNum = Math.max(parseInt(page, 10) || 1, 1);
    const limitNum = Math.max(parseInt(limit, 10) || 12, 1);
    const offset = (pageNum - 1) * limitNum;

    const conditions = [];
    const values = [];
    let idx = 1;

    if (q) {
      conditions.push(`
        (
          u.name ILIKE $${idx}
          OR u.name_en ILIKE $${idx}
          OR u.city ILIKE $${idx}
        )
      `);

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

    const where =
      conditions.length > 0
        ? `WHERE ${conditions.join(' AND ')}`
        : '';

    // Count universities
    const countRes = await pool.query(
      `
        SELECT COUNT(*)
        FROM universities u
        ${where}
      `,
      values
    );

    const total = parseInt(countRes.rows[0].count, 10);

    // Pagination parameters
    const dataValues = [...values, limitNum, offset];

    const dataRes = await pool.query(
      `
        SELECT
          u.*,
          COUNT(p.id)::INTEGER AS course_count
        FROM universities u
        LEFT JOIN programs p
          ON p.university_id = u.id
        ${where}
        GROUP BY u.id
        ORDER BY u.name ASC
        LIMIT $${idx}
        OFFSET $${idx + 1}
      `,
      dataValues
    );

    res.json({
      success: true,
      data: {
        total,
        page: pageNum,
        limit: limitNum,
        totalPages: Math.ceil(total / limitNum),
        results: dataRes.rows
      }
    });
  } catch (err) {
    console.error('Get universities error:', err);

    res.status(500).json({
      success: false,
      error: err.message
    });
  }
};


exports.getUniversityById = async (req, res) => {
  try {
    const universityId = req.params.id;

    const uniRes = await pool.query(
      `
        SELECT *
        FROM universities
        WHERE id = $1
      `,
      [universityId]
    );

    if (uniRes.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Not found'
      });
    }

    /*
     * Only show programs that are actually linked
     * to this university.
     *
     * Courses with university_id = NULL are still
     * available through the main course endpoint.
     */
    const progRes = await pool.query(
      `
        SELECT
          p.*,
          cg.id AS chat_group_id,

          u.name AS university_name,
          u.name_en AS university_name_en,
          u.website AS university_website,
          u.logo_url AS university_logo

        FROM programs p

        LEFT JOIN chat_groups cg
          ON cg.program_id = p.id

        LEFT JOIN universities u
          ON u.id = p.university_id

        WHERE p.university_id = $1

        ORDER BY p.name ASC
      `,
      [universityId]
    );

    res.json({
      success: true,
      data: {
        university: uniRes.rows[0],
        programs: progRes.rows
      }
    });
  } catch (err) {
    console.error('Get university error:', err);

    res.status(500).json({
      success: false,
      error: err.message
    });
  }
};