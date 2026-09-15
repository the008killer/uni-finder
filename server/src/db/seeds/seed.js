const pool = require('../../config/db');
const fs = require('fs');
const path = require('path');

// Read file with correct encoding (UTF-8 or Windows-1252)
function readRawFile(filePath) {
    const buffer = fs.readFileSync(filePath);
    try {
        return new TextDecoder('utf-8', { fatal: true }).decode(buffer);
    } catch (e) {
        return new TextDecoder('windows-1252').decode(buffer);
    }
}

// Clean CSV line splitter
function parseCSVLine(line, separator = ';') {
    const result = [];
    let current = '';
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
        const char = line[i];
        if (char === '"') inQuotes = !inQuotes;
        else if (char === separator && !inQuotes) {
            result.push(current.trim());
            current = '';
        } else current += char;
    }
    result.push(current.trim());
    return result;
}

// Clean string placeholders
function cleanVal(str) {
    if (!str) return null;
    const t = str.trim();
    if (t.toLowerCase() === 'none' || t === 'N/A' || t === '') return null;
    return t;
}

// Translate English university names to authentic German names
function translateToGermanName(engName) {
    let name = engName.trim();

    // "University of Tübingen" -> "Universität Tübingen"
    if (name.startsWith("University of ")) {
        name = "Universität " + name.replace("University of ", "");
    }
    // "Technical University of Munich" -> "Technische Universität München"
    else if (name.startsWith("Technical University of ")) {
        name = "Technische Universität " + name.replace("Technical University of ", "");
    }
    else if (name.startsWith("Technical University ")) {
        name = "Technische Universität " + name.replace("Technical University ", "");
    }
    // "RWTH Aachen University" -> "RWTH Aachen" or "Rheinisch-Westfälische Technische Hochschule Aachen"
    else if (name.endsWith(" University")) {
        name = "Universität " + name.replace(" University", "");
    }

    // Translating common city names & generic terms
    name = name
        .replace(/\bMunich\b/g, 'München')
        .replace(/\bCologne\b/g, 'Köln')
        .replace(/\bNuremberg\b/g, 'Nürnberg')
        .replace(/\bBavaria\b/g, 'Bayern')
        .replace(/\bUniversity of Applied Sciences\b/gi, 'Hochschule für angewandte Wissenschaften')
        .replace(/\bApplied Sciences\b/gi, 'Angewandte Wissenschaften');

    return name;
}

// Detect if a university is private based on tuition fees or known private names
function detectUniversityType(uniName, tuitionFee) {
    const name = uniName.toLowerCase();

    const privateKeywords = ['srh', 'sdi', 'gisma', 'iu university', 'macromedia', 'bsbi', 'berlin school of business', 'arden', 'kühne', 'private'];
    const isKnownPrivate = privateKeywords.some(keyword => name.includes(keyword));

    if (isKnownPrivate || tuitionFee > 1500) {
        return 'private';
    }
    return 'public';
}

function detectLanguage(langField) {
    const l = (langField || '').toLowerCase();
    if (!l) return 'german';
    const hasGerman = l.includes('german') || l.includes('deutsch');
    const hasEnglish = l.includes('english') || l.includes('englisch');
    if (hasGerman && hasEnglish) return 'mixed';
    if (hasEnglish) return 'english';
    return 'german';
}

function detectDegreeType(courseName) {
    if (!courseName) return null;
    const n = courseName.toLowerCase();
    if (n.includes('master') || n.includes('m.sc') || n.includes('m.a.') || n.includes('m.eng') || n.includes('llm') || n.includes('mba') || n.includes('m.ed')) return 'master';
    if (n.includes('bachelor') || n.includes('b.sc') || n.includes('b.a.') || n.includes('b.eng') || n.includes('llb') || n.includes('b.ed')) return 'bachelor';
    return null;
}

function parseDuration(durationStr) {
    if (!durationStr) return null;
    const semMatch = durationStr.match(/(\d+)\s*sem/i);
    if (semMatch) return parseInt(semMatch[1], 10);
    const yearMatch = durationStr.match(/(\d+)\s*year/i);
    if (yearMatch) return parseInt(yearMatch[1], 10) * 2;
    const monthMatch = durationStr.match(/(\d+)\s*month/i);
    if (monthMatch) return Math.round(parseInt(monthMatch[1], 10) / 6);
    return null;
}

function parseTuition(feeStr) {
    if (!feeStr) return 0;
    const cleaned = feeStr.replace(/[^0-9.,]/g, '').replace(',', '.');
    const fee = parseFloat(cleaned);
    return isNaN(fee) ? 0 : fee;
}

function parseLevel(levelStr) {
    if (!levelStr) return null;
    const levels = levelStr.split(',').map(s => s.trim()).filter(Boolean);
    if (levels.length === 0) return null;
    return levels[levels.length - 1];
}

async function run() {
    console.log('🚀 Starting Unified Seeder...\n');

    const filePath = path.join(__dirname, 'courses_de.csv');
    if (!fs.existsSync(filePath)) {
        console.error('❌ courses_de.csv not found!');
        process.exit(1);
    }

    // Clear previous data
    console.log('🧹 Clearing old tables...');
    await pool.query('TRUNCATE TABLE bookmarks, messages, chat_members, chat_groups, programs, universities RESTART IDENTITY CASCADE;');

    const raw = readRawFile(filePath);
    const lines = raw.trim().split(/\r?\n/);
    const headers = parseCSVLine(lines[0]);

    // Map header indexes
    const idxId = headers.findIndex(h => h.toLowerCase().includes('course id'));
    const idxName = headers.findIndex(h => h.toLowerCase().includes('course name'));
    const idxShort = headers.findIndex(h => h.toLowerCase().includes('course short name'));
    const idxSubj = headers.findIndex(h => h.toLowerCase().includes('subject name'));
    const idxUni = headers.findIndex(h => h.toLowerCase().includes('university name'));
    const idxCity = headers.findIndex(h => h.toLowerCase().includes('city name'));
    const idxLang = headers.findIndex(h => h.toLowerCase().includes('languages instruction') || h.toLowerCase().includes('teaching'));
    const idxGer = headers.findIndex(h => h.toLowerCase().includes('german language'));
    const idxEng = headers.findIndex(h => h.toLowerCase().includes('english language'));
    const idxBeg = headers.findIndex(h => h.toLowerCase().includes('beginning'));
    const idxDur = headers.findIndex(h => h.toLowerCase().includes('duration'));
    const idxFee = headers.findIndex(h => h.toLowerCase().includes('tuition'));
    const idxLink = headers.findIndex(h => h.toLowerCase().includes('course details link') || h.toLowerCase().includes('link'));

    console.log(`Processing ${lines.length - 1} courses...`);

    const uniqueUnis = new Map();
    const rawPrograms = [];

    // Phase 1: Parse and collect unique universities
    for (let i = 1; i < lines.length; i++) {
        const values = parseCSVLine(lines[i]);
        const rawUniName = cleanVal(values[idxUni]);
        const cityName = cleanVal(values[idxCity]) || 'Unknown';
        const tuition = parseTuition(cleanVal(values[idxFee]));

        if (!rawUniName) continue;

        if (!uniqueUnis.has(rawUniName)) {
            const germanName = translateToGermanName(rawUniName);
            const type = detectUniversityType(rawUniName, tuition);
            uniqueUnis.set(rawUniName, {
                name: germanName,
                city: cityName,
                type: type,
                temp_id: uniqueUnis.size + 1
            });
        }

        rawPrograms.push({
            courseId: cleanVal(values[idxId]),
            name: cleanVal(values[idxName]),
            shortName: cleanVal(values[idxShort]),
            subject: cleanVal(values[idxSubj]) || 'General',
            rawUni: rawUniName,
            lang: cleanVal(values[idxLang]),
            gerLevel: cleanVal(values[idxGer]),
            engLevel: cleanVal(values[idxEng]),
            beginning: cleanVal(values[idxBeg]),
            duration: cleanVal(values[idxDur]),
            tuition: tuition,
            link: cleanVal(values[idxLink])
        });
    }

    // Phase 2: Insert Universities
    console.log(`Inserting ${uniqueUnis.size} uniquely parsed German universities...`);
    const uniDbMap = new Map(); // Maps rawUniName to DB integer id

    for (const [rawName, u] of uniqueUnis.entries()) {
        const query = `
      INSERT INTO universities (name, city, country, type, website, description, hsk_nr)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      ON CONFLICT (hsk_nr) DO UPDATE SET name = EXCLUDED.name
      RETURNING id;
    `;
        const res = await pool.query(query, [
            u.name, u.city, 'Germany', u.type, null, `${u.type.toUpperCase()} University`, u.temp_id
        ]);
        uniDbMap.set(rawName, res.rows[0].id);
    }

    // Phase 3: Batch Insert Programs
    console.log(`Saving ${rawPrograms.length} courses into Neon with 100% match rate...`);
    const BATCH_SIZE = 100;
    let insertedCount = 0;

    for (let i = 0; i < rawPrograms.length; i += BATCH_SIZE) {
        const batch = rawPrograms.slice(i, i + BATCH_SIZE);
        const valuePlaceholders = [];
        const params = [];
        let pIdx = 1;

        for (const item of batch) {
            const dbUniId = uniDbMap.get(item.rawUni);
            if (!dbUniId) continue;

            const degreeType = detectDegreeType(item.name);

            valuePlaceholders.push(
                `($${pIdx}, $${pIdx + 1}, $${pIdx + 2}, $${pIdx + 3}, $${pIdx + 4}, $${pIdx + 5}, $${pIdx + 6}, $${pIdx + 7}, $${pIdx + 8}, $${pIdx + 9}, $${pIdx + 10}, $${pIdx + 11}, $${pIdx + 12})`
            );

            params.push(
                dbUniId, item.name, item.shortName, degreeType, detectLanguage(item.lang),
                item.subject, parseDuration(item.duration), item.tuition,
                parseLevel(item.gerLevel), parseLevel(item.engLevel),
                item.beginning, item.link, `daad_live_${item.courseId || Math.random().toString(36).substring(2, 9)}`
            );
            pIdx += 13;
            insertedCount++;
        }

        if (params.length === 0) continue;

        const query = `
      INSERT INTO programs (
        university_id, name, name_short, degree_type, language,
        subject_area, duration_semesters, tuition_fee_eur,
        required_german_level, required_english_level,
        semester_start, course_link, external_id
      )
      VALUES ${valuePlaceholders.join(', ')}
      ON CONFLICT (external_id) DO NOTHING;
    `;
        await pool.query(query, params);
    }

    // Phase 4: Create Chat Groups
    console.log('Auto-creating chat groups...');
    await pool.query(`
    INSERT INTO chat_groups (university_id, program_id, name)
    SELECT 
      p.university_id, 
      p.id, 
      LEFT(u.name || ' — ' || p.name, 500)
    FROM programs p
    JOIN universities u ON p.university_id = u.id
    ON CONFLICT (university_id, program_id) DO NOTHING;
  `);

    console.log('========================================');
    console.log('Unified Database Seeding Complete!');
    console.log(`   Universities Saved:   ${uniqueUnis.size}`);
    console.log(`   Courses Saved:        ${insertedCount}`);
    console.log(`   Chat Groups Created:   ${insertedCount}`);
    console.log('========================================\n');
    process.exit(0);
}

run().catch(err => {
    console.error('\n Fatal Seeding Error:', err.message);
    process.exit(1);
});