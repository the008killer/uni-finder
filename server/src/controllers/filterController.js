const pool = require('../config/db');

exports.getFilterOptions = async (req, res) => {
  try {
    const [subjectsRes, citiesRes, statesRes] = await Promise.all([
      pool.query(`
        SELECT DISTINCT subject_area 
        FROM programs 
        WHERE subject_area IS NOT NULL AND subject_area != 'None'
        ORDER BY subject_area ASC
      `),
      pool.query(`
        SELECT DISTINCT city 
        FROM universities 
        WHERE city IS NOT NULL AND city != 'Unknown'
        ORDER BY city ASC
      `),
      pool.query(`
        SELECT DISTINCT state 
        FROM universities 
        WHERE state IS NOT NULL 
        ORDER BY state ASC
      `)
    ]);

    res.json({
      success: true,
      data: {
        subjects: subjectsRes.rows.map(r => r.subject_area),
        cities: citiesRes.rows.map(r => r.city),
        states: statesRes.rows.map(r => r.state),
        degrees: ['bachelor', 'master'],
        languages: ['english', 'german', 'mixed'],
        uniTypes: ['public', 'private', 'church'],
        countries: ['Germany']
      }
    });
  } catch (err) {
    console.error('Filter options error:', err.message);
    res.status(500).json({ success: false, error: 'Server error' });
  }
};