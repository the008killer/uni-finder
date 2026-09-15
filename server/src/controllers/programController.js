const pool = require('../config/db');

exports.getPrograms = async (req, res) => {
  try {
    const {
      q,
      degree,
      language,
      subject,
      city,
      uniType,
      maxFee,
      page = 1,
      limit = 12,
      sortBy = 'name'
    } = req.query;

    const pageNum = Math.max(parseInt(page, 10) || 1, 1);
    const limitNum = Math.max(parseInt(limit, 10) || 12, 1);
    const offset = (pageNum - 1) * limitNum;

    const conditions = [];
    const values = [];
    let idx = 1;

    // --------------------------------------------------------
    // SEARCH
    // --------------------------------------------------------

    if (q && q.trim()) {
      conditions.push(`
        (
          p.name ILIKE $${idx}
          OR p.name_short ILIKE $${idx}
          OR p.subject_area ILIKE $${idx}
          OR u.name ILIKE $${idx}
          OR u.name_en ILIKE $${idx}
          OR u.city ILIKE $${idx}
          OR p.source_university_name ILIKE $${idx}
          OR p.source_city ILIKE $${idx}
        )
      `);

      values.push(`%${q.trim()}%`);
      idx++;
    }

    // --------------------------------------------------------
    // DEGREE
    // --------------------------------------------------------

    if (degree) {
      conditions.push(`p.degree_type = $${idx}`);
      values.push(degree.toLowerCase());
      idx++;
    }

    // --------------------------------------------------------
    // LANGUAGE
    // --------------------------------------------------------

    if (language) {
      conditions.push(`p.language = $${idx}`);
      values.push(language.toLowerCase());
      idx++;
    }

    // --------------------------------------------------------
    // SUBJECT
    // --------------------------------------------------------

    if (subject) {
      conditions.push(`p.subject_area ILIKE $${idx}`);
      values.push(`%${subject}%`);
      idx++;
    }

    // --------------------------------------------------------
    // CITY
    //
    // Use BOTH:
    //   1. matched university city
    //   2. original DAAD course city
    //
    // This is important for courses where university_id = NULL.
    // --------------------------------------------------------

    if (city) {
      conditions.push(`
        (
          u.city ILIKE $${idx}
          OR p.source_city ILIKE $${idx}
        )
      `);

      values.push(`%${city}%`);
      idx++;
    }

    // --------------------------------------------------------
    // UNIVERSITY TYPE
    //
    // This naturally only applies when a university is matched.
    // --------------------------------------------------------

    if (uniType) {
      conditions.push(`u.type = $${idx}`);
      values.push(uniType.toLowerCase());
      idx++;
    }

    // --------------------------------------------------------
    // MAXIMUM TUITION
    // --------------------------------------------------------

    if (maxFee !== undefined && maxFee !== '') {
      const fee = parseFloat(maxFee);

      if (!Number.isNaN(fee)) {
        conditions.push(`p.tuition_fee_eur <= $${idx}`);
        values.push(fee);
        idx++;
      }
    }

    const where =
      conditions.length > 0
        ? `WHERE ${conditions.join(' AND ')}`
        : '';

    // --------------------------------------------------------
    // SORTING
    // --------------------------------------------------------

    let orderBy = 'ORDER BY p.name ASC';

    if (sortBy === 'fee_asc') {
      orderBy = `
        ORDER BY
          p.tuition_fee_eur ASC NULLS LAST,
          p.name ASC
      `;
    }

    if (sortBy === 'fee_desc') {
      orderBy = `
        ORDER BY
          p.tuition_fee_eur DESC NULLS LAST,
          p.name ASC
      `;
    }

    // --------------------------------------------------------
    // COUNT
    //
    // IMPORTANT:
    // LEFT JOIN means unmatched courses are included.
    // --------------------------------------------------------

    const countRes = await pool.query(
      `
        SELECT COUNT(*)
        FROM programs p

        LEFT JOIN universities u
          ON p.university_id = u.id

        ${where}
      `,
      values
    );

    const total = parseInt(countRes.rows[0].count, 10);

    // --------------------------------------------------------
    // DATA
    //
    // IMPORTANT:
    // LEFT JOIN keeps ALL programs, including those where
    // university_id is NULL.
    // --------------------------------------------------------

    const dataQuery = `
      SELECT
        p.id,

        p.name AS course_name,
        p.name_short,

        p.degree_type,
        p.language,
        p.subject_area,
        p.duration_semesters,
        p.tuition_fee_eur,

        p.required_german_level,
        p.required_english_level,

        p.semester_start,
        p.course_link,

        /*
         * Original DAAD information.
         * These remain available even if university matching failed.
         */
        p.source_university_name,
        p.source_city,

        /*
         * University information.
         * These are NULL when no university was matched.
         */
        u.id AS university_id,
        u.name AS university_name,
        u.name_en AS university_name_en,

        COALESCE(u.city, p.source_city) AS city,

        u.state,
        u.country,
        u.type AS university_type,

        u.website AS university_website,
        u.logo_url AS university_logo,

        cg.id AS chat_group_id

      FROM programs p

      LEFT JOIN universities u
        ON p.university_id = u.id

      LEFT JOIN chat_groups cg
        ON cg.program_id = p.id

      ${where}

      ${orderBy}

      LIMIT $${idx}
      OFFSET $${idx + 1}
    `;

    const dataValues = [
      ...values,
      limitNum,
      offset
    ];

    const dataRes = await pool.query(
      dataQuery,
      dataValues
    );

    // --------------------------------------------------------
    // RESPONSE
    // --------------------------------------------------------

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
    console.error(
      'Programs error:',
      err
    );

    res.status(500).json({
      success: false,
      error: 'Error fetching programs'
    });
  }
};


exports.getProgramById = async (req, res) => {
  try {
    const query = `
      SELECT
        p.*,

        u.id AS university_id,
        u.name AS university_name,
        u.name_en AS university_name_en,

        COALESCE(u.city, p.source_city) AS city,

        u.state,
        u.country,
        u.type AS university_type,

        u.website AS university_website,
        u.logo_url AS university_logo,

        cg.id AS chat_group_id

      FROM programs p

      LEFT JOIN universities u
        ON p.university_id = u.id

      LEFT JOIN chat_groups cg
        ON cg.program_id = p.id

      WHERE p.id = $1
    `;

    const result = await pool.query(
      query,
      [req.params.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Not found'
      });
    }

    res.json({
      success: true,
      data: result.rows[0]
    });

  } catch (err) {
    console.error(
      'Program by ID error:',
      err
    );

    res.status(500).json({
      success: false,
      error: 'Error fetching program'
    });
  }
};