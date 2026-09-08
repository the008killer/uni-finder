// server/src/db/seeds/seedUniversities.js
const pool = require('../../config/db');
const fs = require('fs');
const path = require('path');

// Smart reader that decodes UTF-8 or Windows-1252 without deleting or altering characters
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

function getFieldValue(row, headerPatterns) {
  const keys = Object.keys(row);
  for (const pattern of headerPatterns) {
    const foundKey = keys.find(k => 
      k.toLowerCase().replace(/[^a-z0-9]/g, '').includes(pattern.toLowerCase().replace(/[^a-z0-9]/g, ''))
    );
    if (foundKey && row[foundKey] !== undefined && row[foundKey] !== '') {
      return row[foundKey].trim();
    }
  }
  return '';
}

function parseTSV(filePath) {
  let raw = readRawFile(filePath);
  if (raw.charCodeAt(0) == 0xFEFF) raw = raw.slice(1);

  const lines = raw.trim().split(/\r?\n/);
  
  if (lines.length === 0) return [];
  
  const headers = lines[0].split('\t').map(h => h.trim());
  
  return lines.slice(1).map(line => {
    const values = line.split('\t');
    const row = {};
    headers.forEach((header, i) => {
      row[header] = (values[i] || '').trim();
    });
    return row;
  });
}

function determineType(traegerschaft) {
  const t = (traegerschaft || '').toLowerCase();
  if (t.includes('privat')) return 'private';
  if (t.includes('kirchlich')) return 'church';
  return 'public';
}

function determineCategory(hochschultyp) {
  const t = (hochschultyp || '').toLowerCase();
  if (t.includes('universit') && !t.includes('fach')) return 'university';
  if (t.includes('fachhochschule') || t.includes('haw')) return 'university of applied sciences';
  if (t.includes('künst') || t.includes('kunst') || t.includes('musik')) return 'arts college';
  if (t.includes('pädagog') || t.includes('padagog')) return 'pedagogical college';
  return 'other';
}

async function seedUniversities() {
  console.log('Reading university data...\n');
  
  let filePath = path.join(__dirname, 'universities_de.tsv');
  if (!fs.existsSync(filePath)) {
    filePath = path.join(__dirname, 'universities_de.csv');
  }

  if (!fs.existsSync(filePath)) {
    console.error('Data file not found in src/db/seeds/');
    process.exit(1);
  }

  const rows = parseTSV(filePath);
  console.log(`Found ${rows.length} rows in file.\n`);

  let inserted = 0;
  let skipped = 0;
  let publicCount = 0;
  let privateCount = 0;
  let churchCount = 0;

  for (const row of rows) {
    const hsNrStr = getFieldValue(row, ['hsnr', 'hs-nr', 'id']);
    const hsNr = parseInt(hsNrStr, 10);
    
    if (!hsNr) {
      skipped++;
      continue;
    }

    const name = getFieldValue(row, ['hochschulname', 'hochschulkurzname', 'name']);
    const city = getFieldValue(row, ['ort', 'stadt', 'city']) || 'Unknown';
    const state = getFieldValue(row, ['bundesland', 'state']) || null;
    const rawTraeger = getFieldValue(row, ['tragerschaft', 'traegerschaft', 'traeger', 'träger']);
    const rawType = getFieldValue(row, ['hochschultyp', 'typ', 'type']);
    const website = getFieldValue(row, ['home page', 'homepage', 'website', 'url']) || null;
    const studentCount = parseInt(getFieldValue(row, ['studierende', 'students']), 10) || 0;
    const foundedYear = parseInt(getFieldValue(row, ['gründungsjahr', 'grundungsjahr', 'founded']), 10) || null;

    const type = determineType(rawTraeger);
    const category = determineCategory(rawType);

    const description = [
      category,
      foundedYear ? `Founded: ${foundedYear}` : null,
      studentCount > 0 ? `~${studentCount.toLocaleString()} students` : null
    ].filter(Boolean).join(' | ');

    try {
      const query = `
        INSERT INTO universities (
          name, city, state, country, type, website, description, hsk_nr
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        ON CONFLICT (hsk_nr) DO UPDATE SET
          name = EXCLUDED.name,
          city = EXCLUDED.city,
          state = EXCLUDED.state,
          type = EXCLUDED.type,
          website = EXCLUDED.website,
          description = EXCLUDED.description,
          updated_at = NOW();
      `;

      await pool.query(query, [
        name, city, state, 'Germany', type, website, description, hsNr
      ]);

      if (type === 'private') privateCount++;
      else if (type === 'church') churchCount++;
      else publicCount++;

      inserted++;
    } catch (err) {
      console.error(`Error inserting [${name}] with type [${type}]:`, err.message);
    }
  }

  console.log('\n========================================');
  console.log(`Seeding complete!`);
  console.log(`   Total inserted: ${inserted}`);
  console.log(`   Public:  ${publicCount}`);
  console.log(`   Private: ${privateCount}`);
  console.log(`   Church:  ${churchCount}`);
  console.log(`   Skipped: ${skipped}`);
  console.log('========================================\n');
}

seedUniversities()
  .then(() => process.exit(0))
  .catch(err => {
    console.error('Fatal error:', err);
    process.exit(1);
  });