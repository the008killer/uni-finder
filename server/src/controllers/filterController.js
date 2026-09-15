const pool = require('../config/db');

exports.getFilterOptions = async (req, res) => {
  try {
    const [
      subjectsRes,
      citiesRes,
      statesRes
    ] = await Promise.all([

      // Subjects come from courses
      pool.query(`
        SELECT DISTINCT subject_area
        FROM programs
        WHERE subject_area IS NOT NULL
          AND subject_area != ''
          AND subject_area != 'None'
        ORDER BY subject_area ASC
      `),

      // Cities come from the original DAAD course data.
      // This includes courses whose university wasn't matched.
      pool.query(`
        SELECT DISTINCT source_city AS city
        FROM programs
        WHERE source_city IS NOT NULL
          AND source_city != ''
          AND source_city != 'Unknown'
        ORDER BY source_city ASC
      `),

      // States still come from the university registry.
      pool.query(`
        SELECT DISTINCT state
        FROM universities
        WHERE state IS NOT NULL
          AND state != ''
        ORDER BY state ASC
      `)
    ]);

    res.json({
      success: true,
      data: {
        subjects: subjectsRes.rows.map(
          row => row.subject_area
        ),

        cities: citiesRes.rows.map(
          row => row.city
        ),

        states: statesRes.rows.map(
          row => row.state
        ),

        degrees: [
          'bachelor',
          'master'
        ],

        languages: [
          'english',
          'german',
          'mixed'
        ],

        uniTypes: [
          'public',
          'private',
          'church'
        ],

        countries: [
          'Germany'
        ]
      }
    });
  } catch (err) {
    console.error(
      'Filter options error:',
      err.message
    );

    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
};