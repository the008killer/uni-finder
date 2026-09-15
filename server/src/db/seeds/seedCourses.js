// server/src/db/seeds/seedCourses.js

const pool = require('../../config/db');
const fs = require('fs');
const path = require('path');

// ============================================================
// FILE READER
// ============================================================

function readRawFile(filePath) {
    const buffer = fs.readFileSync(filePath);

    try {
        return new TextDecoder('utf-8', { fatal: true }).decode(buffer);
    } catch (e) {
        return new TextDecoder('windows-1252').decode(buffer);
    }
}

// ============================================================
// CSV PARSER
// ============================================================

function cleanVal(value) {
    if (value === undefined || value === null) return null;

    const text = String(value).trim();

    if (!text) return null;
    if (text.toLowerCase() === 'none') return null;
    if (text.toLowerCase() === 'n/a') return null;

    return text;
}

function parseCSVLine(line, separator = ';') {
    const result = [];
    let current = '';
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
        const char = line[i];

        if (char === '"') {
            // Handle escaped double quote ""
            if (inQuotes && line[i + 1] === '"') {
                current += '"';
                i++;
            } else {
                inQuotes = !inQuotes;
            }
        } else if (char === separator && !inQuotes) {
            result.push(cleanVal(current));
            current = '';
        } else {
            current += char;
        }
    }

    result.push(cleanVal(current));

    return result;
}

function parseCSV(filePath) {
    let raw = readRawFile(filePath);

    // Remove UTF-8 BOM if present
    if (raw.charCodeAt(0) === 0xFEFF) {
        raw = raw.slice(1);
    }

    const lines = raw
        .split(/\r?\n/)
        .filter(line => line.trim() !== '');

    if (lines.length === 0) {
        return [];
    }

    const headers = parseCSVLine(lines[0]).map(header =>
        header ? header.trim() : ''
    );

    return lines.slice(1).map(line => {
        const values = parseCSVLine(line);
        const row = {};

        headers.forEach((header, index) => {
            if (header) {
                row[header] = values[index] || null;
            }
        });

        return row;
    });
}

// ============================================================
// LANGUAGE
// ============================================================

function detectLanguage(langField) {
    const language = (langField || '').toLowerCase();

    if (!language) {
        return 'german';
    }

    const hasGerman =
        language.includes('german') ||
        language.includes('deutsch');

    const hasEnglish =
        language.includes('english') ||
        language.includes('englisch');

    if (hasGerman && hasEnglish) {
        return 'mixed';
    }

    if (hasEnglish) {
        return 'english';
    }

    return 'german';
}

// ============================================================
// DEGREE TYPE
// ============================================================

function detectDegreeType(courseName) {
    if (!courseName) return null;

    const name = courseName.toLowerCase();

    if (
        name.includes('master') ||
        name.includes('msc') ||
        name.includes('(ma)') ||
        name.includes('m.a.') ||
        name.includes('meng') ||
        name.includes('m.eng') ||
        name.includes('llm') ||
        name.includes('mba') ||
        name.includes('med')
    ) {
        return 'master';
    }

    if (
        name.includes('bachelor') ||
        name.includes('bsc') ||
        name.includes('(ba)') ||
        name.includes('b.a.') ||
        name.includes('beng') ||
        name.includes('b.eng') ||
        name.includes('llb') ||
        name.includes('(bed)')
    ) {
        return 'bachelor';
    }

    return null;
}

// ============================================================
// DURATION
// ============================================================

function parseDuration(durationStr) {
    if (!durationStr) return null;

    const value = durationStr.toLowerCase();

    // Example: "4 semesters"
    const semesterMatch = value.match(/(\d+)\s*sem/);

    if (semesterMatch) {
        return parseInt(semesterMatch[1], 10);
    }

    // Example: "2 years"
    const yearMatch = value.match(/(\d+)\s*year/);

    if (yearMatch) {
        return parseInt(yearMatch[1], 10) * 2;
    }

    // Example: "24 months"
    const monthMatch = value.match(/(\d+)\s*month/);

    if (monthMatch) {
        return Math.round(parseInt(monthMatch[1], 10) / 6);
    }

    return null;
}

// ============================================================
// TUITION
// ============================================================

function parseTuition(feeStr) {
    if (!feeStr) return 0;

    const value = String(feeStr).trim();

    if (!value) return 0;

    /*
     * Keep only digits, comma and decimal point.
     *
     * Examples:
     * "1500 EUR"     -> 1500
     * "1,500 EUR"    -> 1500
     * "750.00 EUR"   -> 750
     */

    let cleaned = value.replace(/[^\d.,]/g, '');

    if (!cleaned) return 0;

    // European format: 1.500,00
    if (cleaned.includes('.') && cleaned.includes(',')) {
        if (cleaned.lastIndexOf(',') > cleaned.lastIndexOf('.')) {
            cleaned = cleaned
                .replace(/\./g, '')
                .replace(',', '.');
        } else {
            cleaned = cleaned.replace(/,/g, '');
        }
    } else if (cleaned.includes(',')) {
        // Could be 1500,50 or 1,500
        const parts = cleaned.split(',');

        if (
            parts.length === 2 &&
            parts[1].length <= 2
        ) {
            cleaned = parts[0] + '.' + parts[1];
        } else {
            cleaned = cleaned.replace(/,/g, '');
        }
    }

    const fee = parseFloat(cleaned);

    return Number.isFinite(fee) ? fee : 0;
}

// ============================================================
// LANGUAGE LEVEL
// ============================================================

function parseLevel(levelStr) {
    if (!levelStr) return null;

    const levels = String(levelStr)
        .split(',')
        .map(value => value.trim())
        .filter(Boolean);

    if (levels.length === 0) {
        return null;
    }

    return levels[levels.length - 1];
}

// ============================================================
// SUBJECT
// ============================================================

function parseSubject(rawSubject) {
    if (!rawSubject) {
        return 'Humanities and Social Sciences';
    }

    const subject = String(rawSubject)
        .trim()
        .toLowerCase();

    const map = {
        'agriculture, food and beverage technology':
            'Agricultural and Forest Sciences',

        'agriculture, forestry and nutritional sciences in general':
            'Agricultural and Forest Sciences',

        'forestry, wood economics':
            'Agricultural and Forest Sciences',

        'land management, environmental architecture':
            'Agricultural and Forest Sciences',

        'nutritional and domestic science':
            'Agricultural and Forest Sciences',

        'art, art theory in general':
            'Art, Music, Design',

        'design':
            'Art, Music, Design',

        'fine arts':
            'Art, Music, Design',

        'music, musicology':
            'Art, Music, Design',

        'performing arts, film and television, drama':
            'Art, Music, Design',

        'business and economics':
            'Economic Sciences, Law',

        'law':
            'Economic Sciences, Law',

        'law, economics and social sciences in general':
            'Economic Sciences, Law',

        'architecture':
            'Engineering Sciences',

        'civil engineering':
            'Engineering Sciences',

        'electrical engineering':
            'Engineering Sciences',

        'engineering in general':
            'Engineering Sciences',

        'industrial engineering':
            'Engineering Sciences',

        'mechanical engineering / process engineering':
            'Engineering Sciences',

        'mining, metallurgy':
            'Engineering Sciences',

        'surveying':
            'Engineering Sciences',

        'town and country planning':
            'Engineering Sciences',

        'transport engineering, nautical science':
            'Engineering Sciences',

        'classical philology':
            'Language and Cultural Studies',

        'english studies, american studies':
            'Language and Cultural Studies',

        'general and comparative literature and linguistics':
            'Language and Cultural Studies',

        'german language course (including literature and culture studies)':
            'Language and Cultural Studies',

        'german language and literature (german, germanic languages except english)':
            'Language and Cultural Studies',

        'german as a technical language':
            'Language and Cultural Studies',

        'german as an academic language':
            'Language and Cultural Studies',

        'languages and cultural studies in general':
            'Language and Cultural Studies',

        'other / non-european languages and cultural studies':
            'Language and Cultural Studies',

        'preparatory course for german language examinations':
            'Language and Cultural Studies',

        'romance languages':
            'Language and Cultural Studies',

        'slavonic, baltic, finno-ugrian studies':
            'Language and Cultural Studies',

        'translation and interpretation':
            'Language and Cultural Studies',

        'biology':
            'Mathematics, Natural Sciences',

        'chemistry':
            'Mathematics, Natural Sciences',

        'computer science':
            'Mathematics, Natural Sciences',

        'earth sciences (excluding geography)':
            'Mathematics, Natural Sciences',

        'geography':
            'Mathematics, Natural Sciences',

        'mathematics':
            'Mathematics, Natural Sciences',

        'mathematics, natural sciences in general':
            'Mathematics, Natural Sciences',

        'physics, astronomy':
            'Mathematics, Natural Sciences',

        'clinical practical veterinary medicine':
            'Medicine, Health Sciences',

        'clinical, practical medicine (excluding dentistry)':
            'Medicine, Health Sciences',

        'dentistry (clinical, practical)':
            'Medicine, Health Sciences',

        'medicine in general':
            'Medicine, Health Sciences',

        'pharmacy':
            'Medicine, Health Sciences',

        'pre-clinical medical studies (including dentistry)':
            'Medicine, Health Sciences',

        'public administration':
            'Public Administration',

        'didactics of german as a foreign language':
            'Teaching Degrees'
    };

    return map[subject] || 'Humanities and Social Sciences';
}

// ============================================================
// UNIVERSITY MATCHING
// ============================================================

function normalizeText(value) {
    return String(value || '')
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/ß/g, 'ss')
        .replace(/[^a-z0-9]/g, '')
        .trim();
}

function normalizeCity(value) {
    return normalizeText(value);
}

/*
 * Only perform SAFE university matching.
 *
 * IMPORTANT:
 * A failed match returns null.
 *
 * We NEVER create a university here.
 * The course will still be inserted.
 */

function findUniversityId(uniName, cityName, universities) {
    if (!uniName) {
        return null;
    }

    const targetName = normalizeText(uniName);
    const targetCity = normalizeCity(cityName);

    // --------------------------------------------------------
    // 1. Exact original name
    // --------------------------------------------------------

    let match = universities.find(
        university =>
            normalizeText(university.name) === targetName
    );

    if (match) {
        return match.id;
    }

    // --------------------------------------------------------
    // 2. Exact name + city
    // --------------------------------------------------------

    if (targetCity) {
        match = universities.find(university => {
            const sameName =
                normalizeText(university.name) === targetName;

            const sameCity =
                normalizeCity(university.city) === targetCity;

            return sameName && sameCity;
        });

        if (match) {
            return match.id;
        }
    }

    // --------------------------------------------------------
    // 3. Conservative containment match
    //
    // Only accept when the university name is substantially
    // represented in the other name and the city agrees.
    // --------------------------------------------------------

    if (targetCity && targetName.length >= 8) {
        const candidates = universities.filter(university => {
            const universityName = normalizeText(university.name);
            const universityCity = normalizeCity(university.city);

            const sameCity =
                universityCity === targetCity ||
                universityCity.includes(targetCity) ||
                targetCity.includes(universityCity);

            const sameName =
                universityName.includes(targetName) ||
                targetName.includes(universityName);

            return sameCity && sameName;
        });

        // Only use the result when there is exactly one candidate.
        if (candidates.length === 1) {
            return candidates[0].id;
        }
    }

    // --------------------------------------------------------
    // No safe match
    // --------------------------------------------------------

    return null;
}

// ============================================================
// MAIN
// ============================================================

async function run() {
    console.log('========================================');
    console.log('COURSE SEEDER');
    console.log('========================================\n');

    const filePath = path.join(__dirname, 'courses_de.csv');

    if (!fs.existsSync(filePath)) {
        console.error('❌ courses_de.csv not found:');
        console.error(filePath);
        process.exit(1);
    }

    // --------------------------------------------------------
    // Make sure the database allows unmatched universities.
    // --------------------------------------------------------

    await pool.query(`
        ALTER TABLE programs
        ALTER COLUMN university_id DROP NOT NULL;
    `);

    await pool.query(`
        ALTER TABLE programs
        ADD COLUMN IF NOT EXISTS source_university_name VARCHAR(300);
    `);

    await pool.query(`
        ALTER TABLE programs
        ADD COLUMN IF NOT EXISTS source_city VARCHAR(150);
    `);

    // --------------------------------------------------------
    // Load universities.
    // --------------------------------------------------------

    console.log('Loading universities...');

    const universityResult = await pool.query(`
        SELECT
            id,
            name,
            city
        FROM universities
        WHERE country = 'Germany'
        ORDER BY id;
    `);

    const universities = universityResult.rows;

    console.log(
        `Universities loaded: ${universities.length}\n`
    );

    // --------------------------------------------------------
    // Load courses.
    // --------------------------------------------------------

    console.log('Loading courses CSV...');

    const rows = parseCSV(filePath);

    console.log(`CSV courses found: ${rows.length}\n`);

    // --------------------------------------------------------
    // Clear ONLY course data.
    //
    // Do not delete universities.
    // --------------------------------------------------------

    console.log('Clearing existing programs...');

    await pool.query(`
        TRUNCATE TABLE programs RESTART IDENTITY CASCADE;
    `);

    // --------------------------------------------------------
    // Build all program records.
    //
    // IMPORTANT:
    // Every valid CSV row becomes a program.
    // University matching does NOT control insertion.
    // --------------------------------------------------------

    const programs = [];

    let matchedUniversities = 0;
    let unmatchedUniversities = 0;

    for (const row of rows) {
        const courseId = cleanVal(row['Course ID']);

        const courseName = cleanVal(row['Course Name']);

        const courseShortName =
            cleanVal(row['Course Short Name']);

        const subjectName =
            cleanVal(row['Subject Name']);

        // CSV header contains a trailing space in the original file.
        const universityName =
            cleanVal(row['University Name']) ||
            cleanVal(row['University Name ']);

        const cityName =
            cleanVal(row['City Name']);

        const teachingLanguages =
            cleanVal(row['Teaching languages Instruction']);

        const germanLevel =
            cleanVal(row['Required German language']);

        const englishLevel =
            cleanVal(row['Required English language']);

        const beginning =
            cleanVal(row['Beginning']);

        const duration =
            cleanVal(row['Duration of Programme']);

        const tuition =
            cleanVal(row['Tuition Fees']);

        const courseLink =
            cleanVal(row['Course Details Link']);

        // A course without a course name is not useful.
        if (!courseName) {
            continue;
        }

        // ----------------------------------------------------
        // Try to find university.
        //
        // Failure is completely OK.
        // ----------------------------------------------------

        const universityId = findUniversityId(
            universityName,
            cityName,
            universities
        );

        if (universityId) {
            matchedUniversities++;
        } else {
            unmatchedUniversities++;
        }

        // ----------------------------------------------------
        // ALWAYS push the course.
        // ----------------------------------------------------

        programs.push({
            university_id: universityId,

            source_university_name: universityName,
            source_city: cityName,

            name: courseName,
            name_short: courseShortName,

            degree_type: detectDegreeType(courseName),

            language: detectLanguage(
                teachingLanguages
            ),

            subject_area: parseSubject(
                subjectName
            ),

            duration_semesters: parseDuration(
                duration
            ),

            tuition_fee_eur: parseTuition(
                tuition
            ),

            required_german_level: parseLevel(
                germanLevel
            ),

            required_english_level: parseLevel(
                englishLevel
            ),

            semester_start: beginning,

            course_link: courseLink,

            external_id: courseId
                ? `daad_${courseId}`
                : null
        });
    }

    console.log('Course preparation complete.');
    console.log(`Courses prepared:       ${programs.length}`);
    console.log(`University matched:     ${matchedUniversities}`);
    console.log(`University unmatched:   ${unmatchedUniversities}\n`);

    // --------------------------------------------------------
    // Insert ALL courses.
    // --------------------------------------------------------

    console.log('Inserting courses...');

    const BATCH_SIZE = 100;

    let inserted = 0;

    for (
        let start = 0;
        start < programs.length;
        start += BATCH_SIZE
    ) {
        const batch = programs.slice(
            start,
            start + BATCH_SIZE
        );

        const values = [];
        const params = [];

        let parameterIndex = 1;

        for (const program of batch) {
            values.push(`
                (
                    $${parameterIndex},
                    $${parameterIndex + 1},
                    $${parameterIndex + 2},
                    $${parameterIndex + 3},
                    $${parameterIndex + 4},
                    $${parameterIndex + 5},
                    $${parameterIndex + 6},
                    $${parameterIndex + 7},
                    $${parameterIndex + 8},
                    $${parameterIndex + 9},
                    $${parameterIndex + 10},
                    $${parameterIndex + 11},
                    $${parameterIndex + 12},
                    $${parameterIndex + 13},
                    $${parameterIndex + 14},
                    $${parameterIndex + 15}
                )
            `);

            params.push(
                program.university_id,
                program.source_university_name,
                program.source_city,
                program.name,
                program.name_short,
                program.degree_type,
                program.language,
                program.subject_area,
                program.duration_semesters,
                program.tuition_fee_eur,
                program.required_german_level,
                program.required_english_level,
                program.semester_start,
                program.course_link,
                program.external_id,
                null // description
            );

            parameterIndex += 16;
        }

        const query = `
            INSERT INTO programs (
                university_id,
                source_university_name,
                source_city,
                name,
                name_short,
                degree_type,
                language,
                subject_area,
                duration_semesters,
                tuition_fee_eur,
                required_german_level,
                required_english_level,
                semester_start,
                course_link,
                external_id,
                description
            )
            VALUES ${values.join(',')}
        `;

        await pool.query(query, params);

        inserted += batch.length;

        console.log(
            `   Inserted ${inserted}/${programs.length}`
        );
    }

    // --------------------------------------------------------
    // Verify database count.
    // --------------------------------------------------------

    const countResult = await pool.query(`
        SELECT COUNT(*) AS count
        FROM programs;
    `);

    const databaseCount =
        parseInt(countResult.rows[0].count, 10);

    // --------------------------------------------------------
    // Verify that LEFT JOIN returns the same count.
    // --------------------------------------------------------

    const joinedCountResult = await pool.query(`
        SELECT COUNT(*) AS count
        FROM programs p
        LEFT JOIN universities u
            ON u.id = p.university_id;
    `);

    const joinedCount =
        parseInt(joinedCountResult.rows[0].count, 10);

    // --------------------------------------------------------
    // Final output
    // --------------------------------------------------------

    console.log('\n========================================');
    console.log('COURSE SEED COMPLETE');
    console.log('========================================');

    console.log(
        `CSV courses:             ${rows.length}`
    );

    console.log(
        `Programs inserted:      ${inserted}`
    );

    console.log(
        `Programs in database:   ${databaseCount}`
    );

    console.log(
        `LEFT JOIN result:       ${joinedCount}`
    );

    console.log(
        `With university_id:     ${matchedUniversities}`
    );

    console.log(
        `Without university_id:  ${unmatchedUniversities}`
    );

    console.log('========================================\n');

    if (databaseCount !== rows.length) {
        console.error(
            `⚠️ WARNING: CSV has ${rows.length} courses but database has ${databaseCount}.`
        );
    }

    if (joinedCount !== rows.length) {
        console.error(
            `⚠️ WARNING: LEFT JOIN returned ${joinedCount} instead of ${rows.length}.`
        );
    } else {
        console.log(
            `✅ All ${joinedCount} courses are available through LEFT JOIN.`
        );
    }

    await pool.end();
    process.exit(0);
}

// ============================================================
// ERROR HANDLING
// ============================================================

run().catch(error => {
    console.error('\n❌ COURSE SEED FAILED');
    console.error(error);
    process.exit(1);
});