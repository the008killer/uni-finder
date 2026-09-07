const pool = require('../config/db');
const fs = require('fs');
const path = require('path');

async function migrate() {
    try {
        const sql = fs.readFileSync(
            path.join(__dirname,'migrations', '001_initial.sql'),
            'utf-8'
        );
        await pool.query(sql);
        console.log('All tables created successfully!');
        process.exit(0);
    } catch (err) {
        console.error('Migration failed:', err.message);
        process.exit(1);
    }
}

migrate();