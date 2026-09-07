const {Pool} = require('pg');
require('dotenv').config();

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    sal: {
        rejectUnauthorized: false // for neon
    }
});

// test connection
pool.query('SELECT NOW()', (err,res) => {
    if (err){
        console.error('Database Connection Failed', err.message);
    } else {
        console.log('Database connected', res.rows[0].now);
    }
});

module.exports = pool;