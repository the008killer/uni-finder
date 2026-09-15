const pool = require('../../config/db');
const fs = require('fs');
const path = require('path');

const file = path.join(__dirname, 'universities_de.csv');

const clean = (v = '') =>
    String(v).normalize('NFC').replace(/\s+/g, ' ').trim();

function parseTSV(file) {
    const lines = fs.readFileSync(file, 'utf8')
        .replace(/^\uFEFF/, '')
        .split(/\r?\n/)
        .filter(Boolean);

    const headers = lines.shift().split('\t').map(clean);

    return lines.map(line => {
        const values = line.split('\t');

        return Object.fromEntries(
            headers.map((h, i) => [h, clean(values[i] || '')])
        );
    });
}

function getType(v = '') {
    v = v.toLowerCase();
    if (v.includes('privat')) return 'private';
    if (v.includes('kirch')) return 'church';
    return 'public';
}

function getCategory(v = '') {
    v = v.toLowerCase();

    if (v.includes('universit') && !v.includes('fach'))
        return 'university';

    if (v.includes('fachhochschule') || v.includes('haw'))
        return 'university of applied sciences';

    if (v.includes('kunst') || v.includes('musik'))
        return 'arts college';

    if (v.includes('pädagog') || v.includes('padagog'))
        return 'pedagogical college';

    return 'other';
}

async function seedUniversities() {
    if (!fs.existsSync(file))
        throw new Error('universities_de.csv not found');

    const rows = parseTSV(file);

    await pool.query(`
        TRUNCATE TABLE
            bookmarks,
            messages,
            chat_members,
            chat_groups,
            programs,
            universities
        RESTART IDENTITY CASCADE
    `);

    let count = 0;

    for (const r of rows) {
        const name = r['Hochschulname'] || r['Hochschulkurzname'];
        if (!name) continue;

        const students = parseInt(r['Anzahl Studierende'], 10) || 0;
        const founded = parseInt(r['Gründungsjahr'], 10) || null;

        await pool.query(`
            INSERT INTO universities (
                name,
                city,
                state,
                country,
                type,
                category,
                website,
                description
            )
            VALUES ($1,$2,$3,'Germany',$4,$5,$6,$7)
        `, [
            name,
            r['Ort (Hausanschrift)'] || 'Unknown',
            r['Bundesland'] || null,
            getType(r['Trägerschaft']),
            getCategory(r['Hochschultyp']),
            r['Home Page'] || null,
            [
                getCategory(r['Hochschultyp']),
                founded && `Founded: ${founded}`,
                students && `~${students.toLocaleString()} students`
            ].filter(Boolean).join(' | ')
        ]);

        count++;
    }

    console.log(`Universities seeded: ${count}`);
}

seedUniversities()
    .then(() => process.exit(0))
    .catch(err => {
        console.error(err);
        process.exit(1);
    });

