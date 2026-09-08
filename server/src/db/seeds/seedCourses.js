// server/src/db/seeds/seedCourses.js
const pool = require('../../config/db');
const fs = require('fs');
const path = require('path');

// ============================
// 1. CSV PARSER (Semicolon)
// ============================

function readRawFile(filePath) {
  const buffer = fs.readFileSync(filePath);
  try {
    const utf8Decoder = new TextDecoder('utf-8', { fatal: true });
    return utf8Decoder.decode(buffer);
  } catch (e) {
    const windowsDecoder = new TextDecoder('windows-1252');
    return windowsDecoder.decode(buffer);
  }
}


function parseCSVLine(line, separator = ';') {
  const result = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === separator && !inQuotes) {
      result.push(cleanVal(current));
      current = '';
    } else {
      current += char;
    }
  }
  result.push(current);
  return result;
}

function parseCSV(filePath) {
  let raw = readRawFile(filePath);
  if (raw.charCodeAt(0) === 0xFEFF) raw = raw.slice(1);

  const lines = raw.trim().split(/\r?\n/);
  if (lines.length === 0) return [];

  const headers = parseCSVLine(lines[0]).map(h => (h || '').trim());
  return lines.slice(1).map(line => {
    const values = parseCSVLine(line);
    const row = {};
    headers.forEach((header, i) => {
      row[header] = values[i] || null;
    });
    return row;
  });
}

// ============================
// 2. HELPERS
// ============================
function cleanVal(val) {
  if (!val || val.toLowerCase() === 'none' || val === 'N/A') return null;
  return val;
}

function detectLanguage(langField) {
  const l = (langField || '').toLowerCase();
  if (!l || l === 'none') return 'german';
  const hasGerman = l.includes('german') || l.includes('deutsch');
  const hasEnglish = l.includes('english') || l.includes('englisch');
  if (hasGerman && hasEnglish) return 'mixed';
  if (hasEnglish) return 'english';
  return 'german';
}

function detectDegreeType(courseName) {
  if (!courseName) return null;
  const n = courseName.toLowerCase();
  if (n.includes('master') || n.includes('m.sc') || n.includes('m.a.') ||
      n.includes('m.eng') || n.includes('llm') || n.includes('mba') ||
      n.includes('m.ed') || n.includes('master of')) return 'master';

  if (n.includes('bachelor') || n.includes('b.sc') || n.includes('b.a.') ||
      n.includes('b.eng') || n.includes('llb') || n.includes('b.ed') ||
      n.includes('bachelor of')) return 'bachelor';

  return null;
}

function parseDuration(durationStr) {
  const d = cleanVal(durationStr);
  if (!d) return null;
  const semMatch = d.match(/(\d+)\s*sem/i);
  if (semMatch) return parseInt(semMatch[1], 10);
  const yearMatch = d.match(/(\d+)\s*year/i);
  if (yearMatch) return parseInt(yearMatch[1], 10) * 2;
  const monthMatch = d.match(/(\d+)\s*month/i);
  if (monthMatch) return Math.round(parseInt(monthMatch[1], 10) / 6);
  return null;
}

function parseTuition(feeStr) {
  const f = cleanVal(feeStr);
  if (!f) return 0;
  const cleaned = f.replace(/[^0-9.,]/g, '').replace(',', '.');
  const fee = parseFloat(cleaned);
  return isNaN(fee) ? 0 : fee;
}

function parseLevel(levelStr) {
  const l = cleanVal(levelStr);
  if (!l) return null;
  const levels = l.split(',').map(s => s.trim()).filter(Boolean);
  if (levels.length === 0) return null;
  return levels[levels.length - 1];
}

// Strip generic terms to find core name
function normalizeName(str) {
  return (str || '')
    .toLowerCase()
    .replace(/university of applied sciences/g, '')
    .replace(/technical university of/g, '')
    .replace(/university of/g, '')
    .replace(/universität|hochschule|fachhochschule|technische/g, '')
    .replace(/[^a-z0-9]/g, ' ')
    .trim();
}

// Fast in-memory matcher
function matchUniversityInMemory(uniName, cityName, dbUnis) {
  if (!uniName) return null;
  const target = uniName.toLowerCase().trim();
  const cityTarget = (cityName || '').toLowerCase().trim();

  // 1. Exact Name
  let match = dbUnis.find(u => u.name.toLowerCase() === target);
  if (match) return match.id;

  // 2. Substring Name Match
  match = dbUnis.find(u => u.name.toLowerCase().includes(target) || target.includes(u.name.toLowerCase()));
  if (match) return match.id;

  // 3. Core Keywords + City Match
  const coreTarget = normalizeName(target);
  if (coreTarget.length > 2) {
    match = dbUnis.find(u => {
      const uCity = (u.city || '').toLowerCase();
      const uCore = normalizeName(u.name);
      const sameCity = cityTarget && (uCity.includes(cityTarget) || cityTarget.includes(uCity));
      const sameCore = uCore.includes(coreTarget) || coreTarget.includes(uCore);
      return (sameCity && sameCore) || (sameCore && coreTarget.length >= 4);
    });
    if (match) return match.id;
  }

  // 4. City-only fallback if exactly one university exists in that city
  if (cityTarget) {
    const cityUnis = dbUnis.filter(u => u.city.toLowerCase() === cityTarget);
    if (cityUnis.length === 1) return cityUnis[0].id;
  }

  return null;
}

// ============================
// 3. MAIN SCRIPT
// ============================
async function run() {
  console.log('Starting Course Seeder...\n');

  let filePath = path.join(__dirname, 'courses_de.csv');
  if (!fs.existsSync(filePath)) {
    filePath = path.join(__dirname, 'courses_de.tsv');
  }

  if (!fs.existsSync(filePath)) {
    console.error('❌ Data file not found in seeds folder!');
    process.exit(1);
  }

  // 1. Load all universities into RAM once
  console.log('Loading universities from Neon into memory...');
  const uniRes = await pool.query('SELECT id, name, city FROM universities');
  const dbUnis = uniRes.rows;
  console.log(`Loaded ${dbUnis.length} universities into memory.\n`);

  // 2. Parse CSV
  const rows = parseCSV(filePath);
  console.log(`Loaded ${rows.length} rows from CSV. Processing...\n`);

  let matched = 0;
  let unmatched = 0;
  let bachelorCount = 0;
  let masterCount = 0;
  let otherCount = 0;
  const programsToInsert = [];

  for (const row of rows) {
    const courseId = cleanVal(row['Course ID']);
    const courseName = cleanVal(row['Course Name']);
    const courseShort = cleanVal(row['Course Short Name']);
    const subjectName = cleanVal(row['Subject Name']) || 'General';
    const uniName = cleanVal(row['University Name'] || row['University Name ']);
    const cityName = cleanVal(row['City Name']);
    const langInstruction = cleanVal(row['Teaching languages Instruction']);
    const germanLevel = cleanVal(row['Required German language']);
    const englishLevel = cleanVal(row['Required English language']);
    const semesterStart = cleanVal(row['Beginning']);
    const duration = cleanVal(row['Duration of Programme']);
    const tuition = cleanVal(row['Tuition Fees']);
    const courseLink = cleanVal(row['Course Details Link']);

    if (!courseName || !uniName) continue;

    // Instant match in RAM
    const uniId = matchUniversityInMemory(uniName, cityName, dbUnis);

    if (!uniId) {
      unmatched++;
      continue;
    }

    matched++;
    const degreeType = detectDegreeType(courseName);
    if (degreeType === 'bachelor') bachelorCount++;
    else if (degreeType === 'master') masterCount++;
    else otherCount++;

    programsToInsert.push({
      university_id: uniId,
      name: courseName,
      name_short: courseShort,
      degree_type: degreeType,
      language: detectLanguage(langInstruction),
      subject_area: subjectName,
      duration_semesters: parseDuration(duration),
      tuition_fee_eur: parseTuition(tuition),
      required_german_level: parseLevel(germanLevel),
      required_english_level: parseLevel(englishLevel),
      semester_start: semesterStart,
      course_link: courseLink,
      external_id: `kaggle_${courseId || Math.random().toString(36).substring(2, 9)}`
    });
  }

  console.log(`In-memory matching done! Matched: ${matched} | Unmatched: ${unmatched}`);
  console.log('Inserting courses into Neon in batches of 100...');

  // Batch insert
  const BATCH_SIZE = 100;
  for (let i = 0; i < programsToInsert.length; i += BATCH_SIZE) {
    const batch = programsToInsert.slice(i, i + BATCH_SIZE);
    
    // Construct single query with multiple rows
    const valuePlaceholders = [];
    const params = [];
    let idx = 1;

    for (const item of batch) {
      valuePlaceholders.push(
        `($${idx}, $${idx+1}, $${idx+2}, $${idx+3}, $${idx+4}, $${idx+5}, $${idx+6}, $${idx+7}, $${idx+8}, $${idx+9}, $${idx+10}, $${idx+11}, $${idx+12})`
      );
      params.push(
        item.university_id, item.name, item.name_short, item.degree_type, item.language,
        item.subject_area, item.duration_semesters, item.tuition_fee_eur,
        item.required_german_level, item.required_english_level,
        item.semester_start, item.course_link, item.external_id
      );
      idx += 13;
    }

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
    process.stdout.write(`\r   Inserted ${Math.min(i + BATCH_SIZE, programsToInsert.length)} / ${programsToInsert.length} courses...`);
  }

  console.log('\n\n Auto-creating chat groups for all newly added courses...');
  
  // Single query creates all chat groups in 50ms
  await pool.query(`
    INSERT INTO chat_groups (university_id, program_id, name)
    SELECT 
      p.university_id, 
      p.id, 
      u.name || ' — ' || p.name
    FROM programs p
    JOIN universities u ON p.university_id = u.id
    ON CONFLICT (university_id, program_id) DO NOTHING;
  `);

  console.log('========================================');
  console.log('Courses Seeding Complete!');
  console.log(`   Total Courses Saved:   ${programsToInsert.length}`);
  console.log(`   Bachelor Programs:     ${bachelorCount}`);
  console.log(`   Master Programs:       ${masterCount}`);
  console.log(`   Other / Cert / PhD:    ${otherCount}`);
  console.log(`   Chat Groups Generated: ${programsToInsert.length}`);
  console.log('========================================\n');

  process.exit(0);
}

run().catch(err => {
  console.error('\n Fatal Seeding Error:', err.message);
  process.exit(1);
});