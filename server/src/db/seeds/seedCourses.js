// server/src/db/seeds/seedCourses.js

const pool = require('../../config/db');
const fs = require('fs');
const path = require('path');

// ============================================================
// 1. FILE & CSV PARSERS
// ============================================================

function readRawFile(filePath) {
    const buffer = fs.readFileSync(filePath);
    try {
        return new TextDecoder('utf-8', { fatal: true }).decode(buffer);
    } catch (e) {
        return new TextDecoder('windows-1252').decode(buffer);
    }
}

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
    if (raw.charCodeAt(0) === 0xFEFF) raw = raw.slice(1);

    const lines = raw.split(/\r?\n/).filter(line => line.trim() !== '');
    if (lines.length === 0) return [];

    const headers = parseCSVLine(lines[0]).map(h => (h ? h.trim() : ''));

    return lines.slice(1).map(line => {
        const values = parseCSVLine(line);
        const row = {};
        headers.forEach((header, index) => {
            if (header) row[header] = values[index] || null;
        });
        return row;
    });
}

// ============================================================
// 2. PARSER HELPERS
// ============================================================

function detectLanguage(langField) {
    const language = (langField || '').toLowerCase();
    if (!language) return 'german';
    const hasGerman = language.includes('german') || language.includes('deutsch');
    const hasEnglish = language.includes('english') || language.includes('englisch');
    if (hasGerman && hasEnglish) return 'mixed';
    if (hasEnglish) return 'english';
    return 'german';
}

function detectDegreeType(courseName) {
    if (!courseName) return null;
    const name = courseName.toLowerCase();
    if (name.includes('master') || name.includes('msc') || name.includes('(ma)') || name.includes('m.a.') ||
        name.includes('meng') || name.includes('m.eng') || name.includes('llm') || name.includes('mba') || name.includes('med')) {
        return 'master';
    }
    if (name.includes('bachelor') || name.includes('bsc') || name.includes('(ba)') || name.includes('b.a.') ||
        name.includes('beng') || name.includes('b.eng') || name.includes('llb') || name.includes('(bed)')) {
        return 'bachelor';
    }
    return null;
}

function parseDuration(durationStr) {
    if (!durationStr) return null;
    const value = durationStr.toLowerCase();
    const semesterMatch = value.match(/(\d+)\s*sem/);
    if (semesterMatch) return parseInt(semesterMatch[1], 10);
    const yearMatch = value.match(/(\d+)\s*year/);
    if (yearMatch) return parseInt(yearMatch[1], 10) * 2;
    const monthMatch = value.match(/(\d+)\s*month/);
    if (monthMatch) return Math.round(parseInt(monthMatch[1], 10) / 6);
    return null;
}

function parseTuition(feeStr) {
    if (!feeStr) return 0;
    const value = String(feeStr).trim();
    if (!value) return 0;

    let cleaned = value.replace(/[^\d.,]/g, '');
    if (!cleaned) return 0;

    if (cleaned.includes('.') && cleaned.includes(',')) {
        if (cleaned.lastIndexOf(',') > cleaned.lastIndexOf('.')) {
            cleaned = cleaned.replace(/\./g, '').replace(',', '.');
        } else {
            cleaned = cleaned.replace(/,/g, '');
        }
    } else if (cleaned.includes(',')) {
        const parts = cleaned.split(',');
        if (parts.length === 2 && parts[1].length <= 2) {
            cleaned = parts[0] + '.' + parts[1];
        } else {
            cleaned = cleaned.replace(/,/g, '');
        }
    }
    const fee = parseFloat(cleaned);
    return Number.isFinite(fee) ? fee : 0;
}

function parseLevel(levelStr) {
    if (!levelStr) return null;
    const levels = String(levelStr).split(',').map(v => v.trim()).filter(Boolean);
    return levels.length === 0 ? null : levels[levels.length - 1];
}

function parseSubject(rawSubject) {
    if (!rawSubject) return 'Humanities and Social Sciences';
    const s = String(rawSubject).trim().toLowerCase();

    const map = {
        'agriculture, food and beverage technology': 'Agricultural and Forest Sciences',
        'agriculture, forestry and nutritional sciences in general': 'Agricultural and Forest Sciences',
        'forestry, wood economics': 'Agricultural and Forest Sciences',
        'land management, environmental architecture': 'Agricultural and Forest Sciences',
        'nutritional and domestic science': 'Agricultural and Forest Sciences',
        'art, art theory in general': 'Art, Music, Design',
        'design': 'Art, Music, Design',
        'fine arts': 'Art, Music, Design',
        'music, musicology': 'Art, Music, Design',
        'performing arts, film and television, drama': 'Art, Music, Design',
        'business and economics': 'Economic Sciences, Law',
        'law': 'Economic Sciences, Law',
        'law, economics and social sciences in general': 'Economic Sciences, Law',
        'architecture': 'Engineering Sciences',
        'civil engineering': 'Engineering Sciences',
        'electrical engineering': 'Engineering Sciences',
        'engineering in general': 'Engineering Sciences',
        'industrial engineering': 'Engineering Sciences',
        'mechanical engineering / process engineering': 'Engineering Sciences',
        'mining, metallurgy': 'Engineering Sciences',
        'surveying': 'Engineering Sciences',
        'town and country planning': 'Engineering Sciences',
        'transport engineering, nautical science': 'Engineering Sciences',
        'classical philology': 'Language and Cultural Studies',
        'english studies, american studies': 'Language and Cultural Studies',
        'general and comparative literature and linguistics': 'Language and Cultural Studies',
        'german language course (including literature and culture studies)': 'Language and Cultural Studies',
        'german language and literature (german, germanic languages except english)': 'Language and Cultural Studies',
        'german as a technical language': 'Language and Cultural Studies',
        'german as an academic language': 'Language and Cultural Studies',
        'languages and cultural studies in general': 'Language and Cultural Studies',
        'other / non-european languages and cultural studies': 'Language and Cultural Studies',
        'preparatory course for german language examinations': 'Language and Cultural Studies',
        'romance languages': 'Language and Cultural Studies',
        'slavonic, baltic, finno-ugrian studies': 'Language and Cultural Studies',
        'translation and interpretation': 'Language and Cultural Studies',
        'biology': 'Mathematics, Natural Sciences',
        'chemistry': 'Mathematics, Natural Sciences',
        'computer science': 'Mathematics, Natural Sciences',
        'earth sciences (excluding geography)': 'Mathematics, Natural Sciences',
        'geography': 'Mathematics, Natural Sciences',
        'mathematics': 'Mathematics, Natural Sciences',
        'mathematics, natural sciences in general': 'Mathematics, Natural Sciences',
        'physics, astronomy': 'Mathematics, Natural Sciences',
        'clinical practical veterinary medicine': 'Medicine, Health Sciences',
        'clinical, practical medicine (excluding dentistry)': 'Medicine, Health Sciences',
        'dentistry (clinical, practical)': 'Medicine, Health Sciences',
        'medicine in general': 'Medicine, Health Sciences',
        'pharmacy': 'Medicine, Health Sciences',
        'pre-clinical medical studies (including dentistry)': 'Medicine, Health Sciences',
        'public administration': 'Public Administration',
        'didactics of german as a foreign language': 'Teaching Degrees'
    };

    return map[s] || 'Humanities and Social Sciences';
}

// ============================================================
// 3. COMPREHENSIVE GERMAN ACADEMIC TRANSLATION DICTIONARY
// ============================================================

const ACADEMIC_DICTIONARY = {
    'rwth aachen university': 'Rheinisch-Westfälische Technische Hochschule Aachen',
    'rwth aachen': 'Rheinisch-Westfälische Technische Hochschule Aachen',
    'technical university of munich': 'Technische Universität München',
    'technical university munich': 'Technische Universität München',
    'tum': 'Technische Universität München',
    'lmu munich': 'Ludwig-Maximilians-Universität München',
    'lmu münchen': 'Ludwig-Maximilians-Universität München',
    'lmu muenchen': 'Ludwig-Maximilians-Universität München',
    'university of munich': 'Ludwig-Maximilians-Universität München',
    'free university of berlin': 'Freie Universität Berlin',
    'fu berlin': 'Freie Universität Berlin',
    'humboldt university of berlin': 'Humboldt-Universität zu Berlin',
    'humboldt-universität zu berlin': 'Humboldt-Universität zu Berlin',
    'humboldt university berlin': 'Humboldt-Universität zu Berlin',
    'hu berlin': 'Humboldt-Universität zu Berlin',
    'technical university of berlin': 'Technische Universität Berlin',
    'tu berlin': 'Technische Universität Berlin',
    'university of bonn': 'Rheinische Friedrich-Wilhelms-Universität Bonn',
    'bonn university': 'Rheinische Friedrich-Wilhelms-Universität Bonn',
    'university of göttingen': 'Georg-August-Universität Göttingen',
    'university of goettingen': 'Georg-August-Universität Göttingen',
    'georg-august-universität göttingen': 'Georg-August-Universität Göttingen',
    'university of tübingen': 'Eberhard Karls Universität Tübingen',
    'university of tuebingen': 'Eberhard Karls Universität Tübingen',
    'eberhard karls universität tübingen': 'Eberhard Karls Universität Tübingen',
    'university of heidelberg': 'Ruprecht-Karls-Universität Heidelberg',
    'heidelberg university': 'Ruprecht-Karls-Universität Heidelberg',
    'university of freiburg': 'Albert-Ludwigs-Universität Freiburg im Breisgau',
    'freiburg university': 'Albert-Ludwigs-Universität Freiburg im Breisgau',
    'university of cologne': 'Universität zu Köln',
    'university of koeln': 'Universität zu Köln',
    'cologne university': 'Universität zu Köln',
    'university of münster': 'Westfälische Wilhelms-Universität Münster',
    'university of muenster': 'Westfälische Wilhelms-Universität Münster',
    'fau erlangen-nürnberg': 'Friedrich-Alexander-Universität Erlangen-Nürnberg',
    'fau erlangen-nuernberg': 'Friedrich-Alexander-Universität Erlangen-Nürnberg',
    'university of erlangen-nuremberg': 'Friedrich-Alexander-Universität Erlangen-Nürnberg',
    'karlsruhe institute of technology': 'Karlsruher Institut für Technologie',
    'karlsruhe institute of technology (kit)': 'Karlsruher Institut für Technologie',
    'kit': 'Karlsruher Institut für Technologie',
    'dresden university of technology': 'Technische Universität Dresden',
    'tu dresden': 'Technische Universität Dresden',
    'darmstadt university of technology': 'Technische Universität Darmstadt',
    'tu darmstadt': 'Technische Universität Darmstadt',
    'university of stuttgart': 'Universität Stuttgart',
    'stuttgart university': 'Universität Stuttgart',
    'tu dortmund university': 'Technische Universität Dortmund',
    'tu dortmund': 'Technische Universität Dortmund',
    'hamburg university of technology': 'Technische Universität Hamburg',
    'tu hamburg': 'Technische Universität Hamburg',
    'tuhh': 'Technische Universität Hamburg',
    'braunschweig university of technology': 'Technische Universität Braunschweig',
    'tu braunschweig': 'Technische Universität Braunschweig',
    'chemnitz university of technology': 'Technische Universität Chemnitz',
    'tu chemnitz': 'Technische Universität Chemnitz',
    'clausthal university of technology': 'Technische Universität Clausthal',
    'tu clausthal': 'Technische Universität Clausthal',
    'brandenburg university of technology cottbus-senftenberg': 'Brandenburgische Technische Universität Cottbus-Senftenberg',
    'btu cottbus-senftenberg': 'Brandenburgische Technische Universität Cottbus-Senftenberg',
    'btu cottbus': 'Brandenburgische Technische Universität Cottbus-Senftenberg',
    'ilmenau university of technology': 'Technische Universität Ilmenau',
    'tu ilmenau': 'Technische Universität Ilmenau',
    'tu bergakademie freiberg': 'Technische Universität Bergakademie Freiberg',
    'freiberg university of mining and technology': 'Technische Universität Bergakademie Freiberg',
    'rptu university of kaiserslautern-landau': 'Rheinland-Pfälzische Technische Universität Kaiserslautern-Landau',
    'rptu kaiserslautern-landau': 'Rheinland-Pfälzische Technische Universität Kaiserslautern-Landau',
    'tu kaiserslautern': 'Rheinland-Pfälzische Technische Universität Kaiserslautern-Landau',
    'charite - universitätsmedizin berlin': 'Charité - Universitätsmedizin Berlin',
    'charité - universitätsmedizin berlin': 'Charité - Universitätsmedizin Berlin',
    'charite': 'Charité - Universitätsmedizin Berlin',
    'charité': 'Charité - Universitätsmedizin Berlin',
    'hannover medical school': 'Medizinische Hochschule Hannover',
    'mhh': 'Medizinische Hochschule Hannover',
    'university of veterinary medicine hannover': 'Stiftung Tierärztliche Hochschule Hannover',
    'tiho hannover': 'Stiftung Tierärztliche Hochschule Hannover',
    'university of leipzig': 'Universität Leipzig',
    'leipzig university': 'Universität Leipzig',
    'university of potsdam': 'Universität Potsdam',
    'potsdam university': 'Universität Potsdam',
    'university of bremen': 'Universität Bremen',
    'bremen university': 'Universität Bremen',
    'university of bayreuth': 'Universität Bayreuth',
    'bayreuth university': 'Universität Bayreuth',
    'university of wuerzburg': 'Julius-Maximilians-Universität Würzburg',
    'university of würzburg': 'Julius-Maximilians-Universität Würzburg',
    'würzburg university': 'Julius-Maximilians-Universität Würzburg',
    'university of mainz': 'Johannes Gutenberg-Universität Mainz',
    'johannes gutenberg university mainz': 'Johannes Gutenberg-Universität Mainz',
    'mainz university': 'Johannes Gutenberg-Universität Mainz',
    'university of giessen': 'Justus-Liebig-Universität Gießen',
    'university of gießen': 'Justus-Liebig-Universität Gießen',
    'jlu giessen': 'Justus-Liebig-Universität Gießen',
    'university of duesseldorf': 'Heinrich-Heine-Universität Düsseldorf',
    'university of düsseldorf': 'Heinrich-Heine-Universität Düsseldorf',
    'heinrich heine university düsseldorf': 'Heinrich-Heine-Universität Düsseldorf',
    'university of frankfurt': 'Goethe-Universität Frankfurt am Main',
    'goethe university frankfurt': 'Goethe-Universität Frankfurt am Main',
    'goethe-universität frankfurt am main': 'Goethe-Universität Frankfurt am Main',
    'university of hamburg': 'Universität Hamburg',
    'hamburg university': 'Universität Hamburg',
    'university of jena': 'Friedrich-Schiller-Universität Jena',
    'jena university': 'Friedrich-Schiller-Universität Jena',
    'friedrich schiller university jena': 'Friedrich-Schiller-Universität Jena',
    'university of kiel': 'Christian-Albrechts-Universität zu Kiel',
    'kiel university': 'Christian-Albrechts-Universität zu Kiel',
    'christian-albrechts-universität zu kiel': 'Christian-Albrechts-Universität zu Kiel',
    'university of marburg': 'Philipps-Universität Marburg',
    'marburg university': 'Philipps-Universität Marburg',
    'philipps-universität marburg': 'Philipps-Universität Marburg',
    'university of halle-wittenberg': 'Martin-Luther-Universität Halle-Wittenberg',
    'martin luther university halle-wittenberg': 'Martin-Luther-Universität Halle-Wittenberg',
    'martin-luther-universität halle-wittenberg': 'Martin-Luther-Universität Halle-Wittenberg',
    'university of hannover': 'Gottfried Wilhelm Leibniz Universität Hannover',
    'leibniz university hannover': 'Gottfried Wilhelm Leibniz Universität Hannover',
    'leibniz universität hannover': 'Gottfried Wilhelm Leibniz Universität Hannover',
    'university of rostock': 'Universität Rostock',
    'rostock university': 'Universität Rostock',
    'university of greifswald': 'Universität Greifswald',
    'greifswald university': 'Universität Greifswald',
    'university of passau': 'Universität Passau',
    'passau university': 'Universität Passau',
    'university of regensburg': 'Universität Regensburg',
    'regensburg university': 'Universität Regensburg',
    'university of augsburg': 'Universität Augsburg',
    'augsburg university': 'Universität Augsburg',
    'university of bamberg': 'Otto-Friedrich-Universität Bamberg',
    'bamberg university': 'Otto-Friedrich-Universität Bamberg',
    'university of bielefeld': 'Universität Bielefeld',
    'bielefeld university': 'Universität Bielefeld',
    'university of bochum': 'Ruhr-Universität Bochum',
    'ruhr university bochum': 'Ruhr-Universität Bochum',
    'ruhr-universität bochum': 'Ruhr-Universität Bochum',
    'university of duisburg-essen': 'Universität Duisburg-Essen',
    'university of erfurt': 'Universität Erfurt',
    'erfurt university': 'Universität Erfurt',
    'university of hagen': 'FernUniversität in Hagen',
    'fernuniversität in hagen': 'FernUniversität in Hagen',
    'university of hildesheim': 'Universität Hildesheim',
    'hildesheim university': 'Universität Hildesheim',
    'university of hohenheim': 'Universität Hohenheim',
    'hohenheim university': 'Universität Hohenheim',
    'university of kassel': 'Universität Kassel',
    'kassel university': 'Universität Kassel',
    'university of koblenz-landau': 'Universität Koblenz',
    'university of koblenz': 'Universität Koblenz',
    'university of konstanz': 'Universität Konstanz',
    'konstanz university': 'Universität Konstanz',
    'university of lübeck': 'Universität zu Lübeck',
    'university of luebeck': 'Universität zu Lübeck',
    'university of lüneburg': 'Leuphana Universität Lüneburg',
    'leuphana university lüneburg': 'Leuphana Universität Lüneburg',
    'leuphana universität lüneburg': 'Leuphana Universität Lüneburg',
    'university of magdeburg': 'Otto-von-Guericke-Universität Magdeburg',
    'otto von guericke university magdeburg': 'Otto-von-Guericke-Universität Magdeburg',
    'otto-von-guericke-universität magdeburg': 'Otto-von-Guericke-Universität Magdeburg',
    'university of mannheim': 'Universität Mannheim',
    'mannheim university': 'Universität Mannheim',
    'university of oldenburg': 'Carl von Ossietzky Universität Oldenburg',
    'carl von ossietzky university of oldenburg': 'Carl von Ossietzky Universität Oldenburg',
    'university of osnabrück': 'Universität Osnabrück',
    'university of osnabrueck': 'Universität Osnabrück',
    'university of paderborn': 'Universität Paderborn',
    'paderborn university': 'Universität Paderborn',
    'university of saarland': 'Universität des Saarlandes',
    'saarland university': 'Universität des Saarlandes',
    'university of siegen': 'Universität Siegen',
    'siegen university': 'Universität Siegen',
    'university of trier': 'Universität Trier',
    'trier university': 'Universität Trier',
    'university of ulm': 'Universität Ulm',
    'ulm university': 'Universität Ulm',
    'university of vechta': 'Universität Vechta',
    'university of weimar': 'Bauhaus-Universität Weimar',
    'bauhaus-universität weimar': 'Bauhaus-Universität Weimar',
    'bauhaus university weimar': 'Bauhaus-Universität Weimar',
    'university of wuppertal': 'Bergische Universität Wuppertal',
    'bergische universität wuppertal': 'Bergische Universität Wuppertal',
    'cologne university of applied sciences': 'Technische Hochschule Köln',
    'th köln': 'Technische Hochschule Köln',
    'th koeln': 'Technische Hochschule Köln',
    'hamburg university of applied sciences': 'Hochschule für Angewandte Wissenschaften Hamburg',
    'haw hamburg': 'Hochschule für Angewandte Wissenschaften Hamburg',
    'munich university of applied sciences': 'Hochschule für angewandte Wissenschaften München',
    'hm hochschule münchen': 'Hochschule für angewandte Wissenschaften München',
    'hochschule münchen': 'Hochschule für angewandte Wissenschaften München',
    'htw berlin': 'Hochschule für Technik und Wirtschaft Berlin',
    'htw berlin - university of applied sciences': 'Hochschule für Technik und Wirtschaft Berlin',
    'hwr berlin': 'Hochschule für Wirtschaft und Recht Berlin',
    'berlin school of economics and law': 'Hochschule für Wirtschaft und Recht Berlin',
    'beuth university of applied sciences berlin': 'Berliner Hochschule für Technik',
    'bht berlin': 'Berliner Hochschule für Technik',
    'frankfurt university of applied sciences': 'Frankfurt University of Applied Sciences',
    'darmstadt university of applied sciences': 'Hochschule Darmstadt',
    'h-da': 'Hochschule Darmstadt',
    'dresden university of applied sciences': 'Hochschule für Technik und Wirtschaft Dresden',
    'htw dresden': 'Hochschule für Technik und Wirtschaft Dresden',
    'leipzig university of applied sciences': 'Hochschule für Technik, Wirtschaft und Kultur Leipzig',
    'htwk leipzig': 'Hochschule für Technik, Wirtschaft und Kultur Leipzig',
    'nuremberg university of applied sciences': 'Technische Hochschule Nürnberg Georg Simon Ohm',
    'th nürnberg': 'Technische Hochschule Nürnberg Georg Simon Ohm',
    'augsburg university of applied sciences': 'Technische Hochschule Augsburg',
    'tha augsburg': 'Technische Hochschule Augsburg',
    'ingolstadt university of applied sciences': 'Technische Hochschule Ingolstadt',
    'thi ingolstadt': 'Technische Hochschule Ingolstadt',
    'karlsruhe university of applied sciences': 'Hochschule Karlsruhe - Technik und Wirtschaft',
    'hka karlsruhe': 'Hochschule Karlsruhe - Technik und Wirtschaft',
    'mannheim university of applied sciences': 'Hochschule Mannheim',
    'ulm university of applied sciences': 'Technische Hochschule Ulm',
    'thu ulm': 'Technische Hochschule Ulm',
    'regensburg university of applied sciences': 'Ostbayerische Technische Hochschule Regensburg',
    'oth regensburg': 'Ostbayerische Technische Hochschule Regensburg',
    'amberg-weiden university of applied sciences': 'Ostbayerische Technische Hochschule Amberg-Weiden',
    'oth amberg-weiden': 'Ostbayerische Technische Hochschule Amberg-Weiden',
    'deggendorf institute of technology': 'Technische Hochschule Deggendorf',
    'th deggendorf': 'Technische Hochschule Deggendorf',
    'rosenheim technical university of applied sciences': 'Technische Hochschule Rosenheim',
    'th rosenheim': 'Technische Hochschule Rosenheim',
    'würzburg-schweinfurt university of applied sciences': 'Technische Hochschule Würzburg-Schweinfurt',
    'thws': 'Technische Hochschule Würzburg-Schweinfurt',
    'fh aachen university of applied sciences': 'Fachhochschule Aachen',
    'fh aachen': 'Fachhochschule Aachen',
    'fh dortmund': 'Fachhochschule Dortmund',
    'fh dortmund university of applied sciences': 'Fachhochschule Dortmund',
    'fh münster university of applied sciences': 'FH Münster',
    'fh münster': 'FH Münster',
    'fh muenster': 'FH Münster',
    'hochschule düsseldorf': 'Hochschule Düsseldorf',
    'hochschule duesseldorf': 'Hochschule Düsseldorf',
    'hsd düsseldorf': 'Hochschule Düsseldorf',
    'hochschule bonn-rhein-sieg': 'Hochschule Bonn-Rhein-Sieg',
    'h-brs': 'Hochschule Bonn-Rhein-Sieg',
    'university of applied sciences bielefeld': 'Fachhochschule Bielefeld',
    'bielefeld university of applied sciences': 'Fachhochschule Bielefeld',
    'hs bielefeld': 'Fachhochschule Bielefeld',
    'hochschule bremen': 'Hochschule Bremen',
    'city university of applied sciences bremen': 'Hochschule Bremen',
    'hochschule osnabrück': 'Hochschule Osnabrück',
    'osnabrück university of applied sciences': 'Hochschule Osnabrück',
    'hochschule hannover': 'Hochschule Hannover',
    'hannover university of applied sciences and arts': 'Hochschule Hannover',
    'ostfalia university of applied sciences': 'Ostfalia Hochschule für angewandte Wissenschaften',
    'ostfalia': 'Ostfalia Hochschule für angewandte Wissenschaften',
    'jade university of applied sciences': 'Jade Hochschule',
    'jade hochschule': 'Jade Hochschule',
    'hochschule emden/leer': 'Hochschule Emden/Leer',
    'kiel university of applied sciences': 'Fachhochschule Kiel',
    'fh kiel': 'Fachhochschule Kiel',
    'flensburg university of applied sciences': 'Hochschule Flensburg',
    'luebeck university of applied sciences': 'Technische Hochschule Lübeck',
    'th lübeck': 'Technische Hochschule Lübeck',
    'hochschule fulda': 'Hochschule Fulda',
    'fulda university of applied sciences': 'Hochschule Fulda',
    'hochschule rheinmain': 'Hochschule RheinMain',
    'rheinmain university of applied sciences': 'Hochschule RheinMain',
    'technische hochschule mittelhessen': 'Technische Hochschule Mittelhessen',
    'thm': 'Technische Hochschule Mittelhessen',
    'hochschule aschaffenburg': 'Technische Hochschule Aschaffenburg',
    'th aschaffenburg': 'Technische Hochschule Aschaffenburg',
    'hochschule ansbach': 'Hochschule für angewandte Wissenschaften Ansbach',
    'hochschule coburg': 'Hochschule für angewandte Wissenschaften Coburg',
    'hochschule hof': 'Hochschule für Angewandte Wissenschaften Hof',
    'hochschule kempten': 'Hochschule für angewandte Wissenschaften Kempten',
    'hochschule landshut': 'Hochschule für angewandte Wissenschaften Landshut',
    'hochschule neu-ulm': 'Hochschule für angewandte Wissenschaften Neu-Ulm',
    'hnu': 'Hochschule für angewandte Wissenschaften Neu-Ulm',
    'hochschule weihenstephan-triesdorf': 'Hochschule Weihenstephan-Triesdorf',
    'hswt': 'Hochschule Weihenstephan-Triesdorf',
    'hochschule aalen': 'Hochschule Aalen - Technik, Wirtschaft und Gesundheit',
    'hochschule albstadt-sigmaringen': 'Hochschule Albstadt-Sigmaringen',
    'hochschule biberach': 'Hochschule Biberach',
    'hochschule esslingen': 'Hochschule Esslingen',
    'esslingen university of applied sciences': 'Hochschule Esslingen',
    'hochschule furtwangen': 'Hochschule Furtwangen',
    'furtwangen university': 'Hochschule Furtwangen',
    'hfu furtwangen': 'Hochschule Furtwangen',
    'hochschule heilbronn': 'Hochschule Heilbronn',
    'heilbronn university of applied sciences': 'Hochschule Heilbronn',
    'hochschule konstanz': 'Hochschule Konstanz Technik, Wirtschaft und Gestaltung',
    'htwg konstanz': 'Hochschule Konstanz Technik, Wirtschaft und Gestaltung',
    'hochschule nürtingen-geislingen': 'Hochschule für Wirtschaft und Umwelt Nürtingen-Geislingen',
    'hfwu': 'Hochschule für Wirtschaft und Umwelt Nürtingen-Geislingen',
    'hochschule offenburg': 'Hochschule Offenburg',
    'offenburg university of applied sciences': 'Hochschule Offenburg',
    'hochschule pforzheim': 'Hochschule Pforzheim - Gestaltung, Technik, Wirtschaft und Recht',
    'pforzheim university': 'Hochschule Pforzheim - Gestaltung, Technik, Wirtschaft und Recht',
    'hochschule ravensburg-weingarten': 'Hochschule Ravensburg-Weingarten',
    'rwu': 'Hochschule Ravensburg-Weingarten',
    'hochschule reutlingen': 'Hochschule Reutlingen',
    'reutlingen university': 'Hochschule Reutlingen',
    'hochschule rottenburg': 'Hochschule für Forstwirtschaft Rottenburg',
    'hochschule für technik stuttgart': 'Hochschule für Technik Stuttgart',
    'hft stuttgart': 'Hochschule für Technik Stuttgart',
    'hochschule der medien stuttgart': 'Hochschule der Medien Stuttgart',
    'hdm stuttgart': 'Hochschule der Medien Stuttgart',
    'hochschule trier': 'Hochschule Trier',
    'trier university of applied sciences': 'Hochschule Trier',
    'hochschule kaiserslautern': 'Hochschule Kaiserslautern',
    'hochschule koblenz': 'Hochschule Koblenz',
    'hochschule ludwigshafen': 'Hochschule für Wirtschaft und Gesellschaft Ludwigshafen',
    'hochschule mainz': 'Hochschule Mainz',
    'hochschule worms': 'Hochschule Worms',
    'worms university of applied sciences': 'Hochschule Worms',
    'th bingen': 'Technische Hochschule Bingen',
    'technische hochschule bingen': 'Technische Hochschule Bingen',
    'hochschule magdeburg-stendal': 'Hochschule Magdeburg-Stendal',
    'hochschule anhalt': 'Hochschule Anhalt - Anhalt University of Applied Sciences',
    'anhalt university of applied sciences': 'Hochschule Anhalt - Anhalt University of Applied Sciences',
    'hochschule harz': 'Hochschule Harz',
    'hochschule merseburg': 'Hochschule Merseburg',
    'hochschule schmalkalden': 'Hochschule Schmalkalden',
    'schmalkalden university of applied sciences': 'Hochschule Schmalkalden',
    'ernst-abbe-hochschule jena': 'Ernst-Abbe-Hochschule Jena',
    'eah jena': 'Ernst-Abbe-Hochschule Jena',
    'fachhochschule erfurt': 'Fachhochschule Erfurt',
    'hochschule nordhausen': 'Hochschule Nordhausen',
    'hochschule zittau/görlitz': 'Hochschule Zittau/Görlitz',
    'hochschule mittweida': 'Hochschule Mittweida',
    'westsächsische hochschule zwickau': 'Westsächsische Hochschule Zwickau',
    'hochschule stralsund': 'Hochschule Stralsund',
    'hochschule wismar': 'Hochschule Wismar',
    'hochschule neubrandenburg': 'Hochschule Neubrandenburg',
    'rhine-waal university of applied sciences': 'Hochschule Rhein-Waal',
    'hochschule rhein-waal': 'Hochschule Rhein-Waal',
    'eberswalde university for sustainable development': 'Hochschule für nachhaltige Entwicklung Eberswalde',
    'th brandenburg': 'Technische Hochschule Brandenburg',
    'brandenburg university of applied sciences': 'Technische Hochschule Brandenburg',
    'th wildau': 'Technische Hochschule Wildau',
    'technical university of applied sciences wildau': 'Technische Hochschule Wildau',
    'frankfurt school of finance & management': 'Frankfurt School of Finance & Management',
    'frankfurt school': 'Frankfurt School of Finance & Management',
    'whu - otto beisheim school of management': 'WHU - Otto Beisheim School of Management',
    'whu': 'WHU - Otto Beisheim School of Management',
    'esmt berlin': 'European School of Management and Technology',
    'esmt': 'European School of Management and Technology',
    'constructor university': 'Constructor University Bremen',
    'constructor university bremen': 'Constructor University Bremen',
    'jacobs university bremen': 'Constructor University Bremen',
    'jacobs university': 'Constructor University Bremen',
    'kühne logistics university': 'Kühne Logistics University - Wissenschaftliche Hochschule für Logistik und Unternehmensführung',
    'klu': 'Kühne Logistics University - Wissenschaftliche Hochschule für Logistik und Unternehmensführung',
    'hertie school': 'Hertie School',
    'hertie school of governance': 'Hertie School',
    'bucerius law school': 'Bucerius Law School, Hochschule für Rechtswissenschaft',
    'srh berlin university of applied sciences': 'SRH Berlin University of Applied Sciences',
    'srh hochschule heidelberg': 'SRH Hochschule Heidelberg',
    'srh university heidelberg': 'SRH Hochschule Heidelberg',
    'iu international university of applied sciences': 'IU Internationale Hochschule',
    'iu international university': 'IU Internationale Hochschule',
    'iu internationale hochschule': 'IU Internationale Hochschule',
    'macromedia university of applied sciences': 'Hochschule Macromedia',
    'hochschule macromedia': 'Hochschule Macromedia',
    'fom university of applied sciences': 'FOM Hochschule für Oekonomie & Management',
    'fom hochschule': 'FOM Hochschule für Oekonomie & Management',
    'munich business school': 'Munich Business School',
    'ebs universität für wirtschaft und recht': 'EBS Universität für Wirtschaft und Recht',
    'ebs university': 'EBS Universität für Wirtschaft und Recht',
    'cbs international business school': 'CBS International Business School',
    'gisma business school': 'Gisma University of Applied Sciences',
    'gisma university of applied sciences': 'Gisma University of Applied Sciences',
    'gisma': 'Gisma University of Applied Sciences',
    'bard college berlin': 'Bard College Berlin, A Liberal Arts University',
    'code university of applied sciences': 'CODE University of Applied Sciences',
    'code university': 'CODE University of Applied Sciences',
    'alanus hochschule': 'Alanus Hochschule für Kunst und Gesellschaft',
    'alanus university': 'Alanus Hochschule für Kunst und Gesellschaft',
    'hhl leipzig graduate school of management': 'HHL Leipzig Graduate School of Management',
    'hhl': 'HHL Leipzig Graduate School of Management'
};

// ============================================================
// 4. SMART MULTI-TIER MATCHER
// ============================================================

const STOP_WORDS = new Set([
    'universitat', 'university', 'hochschule', 'technische', 'technical',
    'applied', 'sciences', 'angewandte', 'wissenschaften', 'fachhochschule',
    'fur', 'and', 'und', 'der', 'die', 'das', 'zu', 'am', 'main', 'im',
    'breisgau', 'school', 'international', 'institute', 'technology',
    'center', 'of', 'the', 'an', 'gmbh', 'state'
]);

function cleanString(str) {
    return String(str || '')
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/ß/g, 'ss')
        .replace(/[^a-z0-9]/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
}

function getDistinctiveTokens(str) {
    const cleaned = cleanString(str);
    return cleaned.split(' ').filter(token => token.length > 2 && !STOP_WORDS.has(token));
}

function normalizeSimple(value) {
    return cleanString(value).replace(/\s+/g, '');
}

function findUniversityId(uniName, cityName, universities) {
    if (!uniName) return null;

    const rawLower = cleanString(uniName);
    const cityClean = cleanString(cityName);

    // TIER 1: Comprehensive Dictionary
    if (ACADEMIC_DICTIONARY[rawLower]) {
        const targetGerman = ACADEMIC_DICTIONARY[rawLower];
        const directMatch = universities.find(u => cleanString(u.name) === cleanString(targetGerman));
        if (directMatch) return directMatch.id;
        
        const dictTokens = getDistinctiveTokens(targetGerman);
        if (dictTokens.length > 0) {
            const found = universities.find(u => {
                const uTokens = getDistinctiveTokens(u.name);
                return dictTokens.every(t => uTokens.includes(t));
            });
            if (found) return found.id;
        }
    }

    // TIER 2: Exact Full Normalized Name Match
    const targetSimple = normalizeSimple(uniName);
    let match = universities.find(u => normalizeSimple(u.name) === targetSimple);
    if (match) return match.id;

    // TIER 3: Distinctive Keyword / Token-Set Intersection
    const targetTokens = getDistinctiveTokens(uniName);
    if (targetTokens.length > 0) {
        const candidates = universities.filter(u => {
            const uTokens = getDistinctiveTokens(u.name);
            const uCity = cleanString(u.city);

            const allTokensMatch = targetTokens.every(token => 
                uTokens.some(ut => ut === token || ut.startsWith(token) || token.startsWith(ut))
            );

            if (!allTokensMatch) return false;

            if (cityClean && uCity) {
                const cityMatches = uCity === cityClean || uCity.includes(cityClean) || cityClean.includes(uCity);
                if (cityMatches) return true;
                const isUniqueToken = targetTokens.some(t => t.length >= 6);
                return isUniqueToken;
            }

            return true;
        });

        if (candidates.length === 1) {
            return candidates[0].id;
        } else if (candidates.length > 1) {
            const isTech = rawLower.includes('techni') || rawLower.includes('tu ') || rawLower.includes('th ');
            const isApp = rawLower.includes('applied') || rawLower.includes('hochschule') || rawLower.includes('fh ');

            const exactTypeMatch = candidates.find(c => {
                const cName = cleanString(c.name);
                if (isTech && (cName.includes('techni') || cName.includes('tu ') || cName.includes('th '))) return true;
                if (isApp && (cName.includes('hochschule') || cName.includes('fachhochschule') || cName.includes('haw'))) return true;
                if (!isTech && !isApp && (cName.includes('universitat') && !cName.includes('techni'))) return true;
                return false;
            });

            if (exactTypeMatch) return exactTypeMatch.id;
            return candidates[0].id;
        }
    }

    // TIER 4: City Unique Fallback
    if (cityClean) {
        const cityUnis = universities.filter(u => cleanString(u.city) === cityClean);
        if (cityUnis.length === 1) return cityUnis[0].id;
    }

    return null;
}

// ============================================================
// 5. WEBSITE INFERENCE FOR DYNAMIC UNIVERSITIES
// ============================================================

function inferWebsite(name, city) {
    const n = cleanString(name);
    const c = cleanString(city).replace(/[^a-z]/g, '');

    if (n.includes('srh')) return 'https://www.srh.de';
    if (n.includes('iu ') || n.includes('iu internationale')) return 'https://www.iu.org';
    if (n.includes('lancaster')) return 'https://www.lancasterleipzig.de';
    if (n.includes('gisma')) return 'https://www.gisma.com';
    if (n.includes('bsbi')) return 'https://www.berlinsbi.com';
    if (n.includes('europe for applied') || n.includes(' ue ')) return 'https://www.ue-germany.com';
    if (n.includes('goethe institut') || n.includes('goethe-institut')) return 'https://www.goethe.de';
    if (n.includes('max planck')) return 'https://www.mpg.de';
    if (n.includes('fraunhofer')) return 'https://www.fraunhofer.de';
    if (n.includes('helmholtz')) return 'https://www.helmholtz.de';
    if (n.includes('macromedia')) return 'https://www.macromedia-fachhochschule.de';
    if (n.includes('fom')) return 'https://www.fom.de';
    if (n.includes('iubh')) return 'https://www.iu.org';
    if (n.includes('esmt')) return 'https://esmt.berlin';
    if (n.includes('whu')) return 'https://www.whu.edu';
    if (n.includes('code university')) return 'https://code.berlin';

    // Generic fallback
    if (n.includes('hochschule') || n.includes('fachhochschule') || n.includes('applied sciences')) {
        return c ? `https://www.hs-${c}.de` : 'https://www.daad.de';
    }

    return c ? `https://www.uni-${c}.de` : 'https://www.daad.de';
}

function detectUniversityType(name, tuition) {
    const n = cleanString(name);
    const privateKeywords = /srh|sdi|gisma|bsbi|iu |macromedia|arden|fom|ue germany|business school|international school|private|hhl|esmt|whu|bard|frankfurt school|hertie|jacobs|constructor|kuhne|bucerius|code university/i;
    if (privateKeywords.test(name) || tuition > 1500) return 'private';
    return 'public';
}

// ============================================================
// 6. MAIN EXECUTION
// ============================================================

async function run() {
    console.log('========================================');
    console.log('🚀 ADVANCED ACCURACY COURSE SEEDER');
    console.log('========================================\n');

    const filePath = path.join(__dirname, 'courses_de.csv');
    if (!fs.existsSync(filePath)) {
        console.error('❌ courses_de.csv not found:', filePath);
        process.exit(1);
    }

    // Prepare table columns
    await pool.query(`ALTER TABLE programs ALTER COLUMN university_id DROP NOT NULL;`);
    await pool.query(`ALTER TABLE programs ADD COLUMN IF NOT EXISTS source_university_name VARCHAR(300);`);
    await pool.query(`ALTER TABLE programs ADD COLUMN IF NOT EXISTS source_city VARCHAR(150);`);
    await pool.query(`ALTER TABLE programs ADD COLUMN IF NOT EXISTS subject_group VARCHAR(100);`);

    // Load universities
    console.log('📦 Loading universities from database...');
    const universityResult = await pool.query(`
        SELECT id, name, city, type
        FROM universities
        WHERE country = 'Germany'
        ORDER BY id;
    `);
    const universities = universityResult.rows;
    console.log(`   ✅ Loaded ${universities.length} German universities into RAM.\n`);

    console.log('📑 Reading and processing courses_de.csv...');
    const rows = parseCSV(filePath);
    console.log(`   Found ${rows.length} rows in CSV.\n`);

    // Clear old programs
    console.log('🧹 Truncating old course records...');
    await pool.query('TRUNCATE TABLE programs RESTART IDENTITY CASCADE;');

    const programs = [];
    let matched = 0;
    let unmatched = 0;
    let dynamicallyCreated = 0;
    let nextDynamicId = 20000;
    const unmatchedNames = new Set();

    for (const row of rows) {
        const courseId = cleanVal(row['Course ID']);
        const courseName = cleanVal(row['Course Name']);
        const courseShortName = cleanVal(row['Course Short Name']);
        const subjectName = cleanVal(row['Subject Name']);
        const universityName = cleanVal(row['University Name']) || cleanVal(row['University Name ']);
        const cityName = cleanVal(row['City Name']);
        const teachingLanguages = cleanVal(row['Teaching languages Instruction']);
        const germanLevel = cleanVal(row['Required German language']);
        const englishLevel = cleanVal(row['Required English language']);
        const beginning = cleanVal(row['Beginning']);
        const duration = cleanVal(row['Duration of Programme']);
        const tuition = cleanVal(row['Tuition Fees']);
        const courseLink = cleanVal(row['Course Details Link']);

        if (!courseName) continue;

        let universityId = findUniversityId(universityName, cityName, universities);

        // DYNAMIC AUTO-CREATOR: If unmatched, create the university on the fly
        if (!universityId && universityName) {
            const fee = parseTuition(tuition);
            const uniType = detectUniversityType(universityName, fee);
            const website = inferWebsite(universityName, cityName);

            try {
                const insertRes = await pool.query(`
                    INSERT INTO universities (name, city, country, type, website, description)
                    VALUES ($1, $2, 'Germany', $3, $4, $5)
                    RETURNING id, name, city;
                `, [
                    universityName,
                    cityName || 'Unknown',
                    uniType,
                    website,
                    `${uniType.toUpperCase()} Higher Education Institution`,
                ]);

                universityId = insertRes.rows[0].id;
                universities.push({
                    id: universityId,
                    name: universityName,
                    city: cityName || 'Unknown'
                });
                dynamicallyCreated++;
            } catch (err) {
                console.error(`⚠️ Auto-create error for [${universityName}]:`, err.message);
            }
        }

        if (universityId) {
            matched++;
        } else {
            unmatched++;
            if (universityName) unmatchedNames.add(`${universityName} (${cityName})`);
        }

        programs.push({
            university_id: universityId,
            source_university_name: universityName,
            source_city: cityName,
            name: courseName,
            name_short: courseShortName,
            degree_type: detectDegreeType(courseName),
            language: detectLanguage(teachingLanguages),
            subject_area: subjectName || 'General',
            subject_group: parseSubject(subjectName),
            duration_semesters: parseDuration(duration),
            tuition_fee_eur: parseTuition(tuition),
            required_german_level: parseLevel(germanLevel),
            required_english_level: parseLevel(englishLevel),
            semester_start: beginning,
            course_link: courseLink,
            external_id: courseId ? `daad_${courseId}` : null
        });
    }

    console.log('⚡ Matching complete:');
    console.log(`   ✅ Matched to existing:   ${matched - dynamicallyCreated}`);
    console.log(`   ➕ Dynamically created:   ${dynamicallyCreated}`);
    console.log(`   ❓ Still unmatched:       ${unmatched}\n`);

    // Batch insert programs
    console.log('💾 Inserting programs into Neon database in batches...');
    const BATCH_SIZE = 100;
    let inserted = 0;

    for (let start = 0; start < programs.length; start += BATCH_SIZE) {
        const batch = programs.slice(start, start + BATCH_SIZE);
        const values = [];
        const params = [];
        let pIdx = 1;

        for (const prog of batch) {
            values.push(`(
                $${pIdx}, $${pIdx + 1}, $${pIdx + 2}, $${pIdx + 3}, $${pIdx + 4},
                $${pIdx + 5}, $${pIdx + 6}, $${pIdx + 7}, $${pIdx + 8}, $${pIdx + 9},
                $${pIdx + 10}, $${pIdx + 11}, $${pIdx + 12}, $${pIdx + 13}, $${pIdx + 14}, $${pIdx + 15}
            )`);

            params.push(
                prog.university_id,
                prog.source_university_name,
                prog.source_city,
                prog.name,
                prog.name_short,
                prog.degree_type,
                prog.language,
                prog.subject_area,
                prog.subject_group,
                prog.duration_semesters,
                prog.tuition_fee_eur,
                prog.required_german_level,
                prog.required_english_level,
                prog.semester_start,
                prog.course_link,
                prog.external_id
            );
            pIdx += 16;
        }

        const query = `
            INSERT INTO programs (
                university_id, source_university_name, source_city,
                name, name_short, degree_type, language,
                subject_area, subject_group, duration_semesters, tuition_fee_eur,
                required_german_level, required_english_level,
                semester_start, course_link, external_id
            )
            VALUES ${values.join(',')}
            ON CONFLICT (external_id) DO NOTHING;
        `;
        await pool.query(query, params);
        inserted += batch.length;
    }

    // Auto-create chat groups
    console.log('💬 Auto-creating real-time chat groups...');
    await pool.query(`
        INSERT INTO chat_groups (university_id, program_id, name)
        SELECT 
            p.university_id, 
            p.id, 
            LEFT(COALESCE(u.name, p.source_university_name) || ' — ' || p.name, 500)
        FROM programs p
        LEFT JOIN universities u ON p.university_id = u.id
        WHERE p.university_id IS NOT NULL
        ON CONFLICT (university_id, program_id) DO NOTHING;
    `);

    console.log('\n========================================');
    console.log('🎉 HIGH-ACCURACY SEED COMPLETE!');
    console.log(`   📚 Total Courses Saved:      ${inserted}`);
    console.log(`   🏛️  With University Linked:   ${matched}`);
    console.log(`   ❓ Without University ID:    ${unmatched}`);
    console.log(`   ➕ Auto-created Universities: ${dynamicallyCreated}`);
    console.log('========================================\n');

    if (unmatchedNames.size > 0 && unmatchedNames.size <= 25) {
        console.log('Unmatched Institutes List:');
        [...unmatchedNames].forEach(name => console.log(`   - ${name}`));
    }

    await pool.end();
    process.exit(0);
}

run().catch(err => {
    console.error('Fatal execution error:', err);
    process.exit(1);
});