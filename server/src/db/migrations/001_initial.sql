-- ========================
-- 1. UNIVERSITIES TABLE
-- ========================
CREATE TABLE IF NOT EXISTS universities (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    name_en VARCHAR(255),
    city VARCHAR(100) NOT NULL,
    state VARCHAR(100),
    country VARCHAR(50) NOT NULL DEFAULT 'Germany',
    type VARCHAR(20) NOT NULL CHECK (type IN ('public', 'private', 'church')),
    category VARCHAR(50),
    website VARCHAR(500),
    description TEXT,
    logo_url VARCHAR(500),
    hsk_nr INTEGER UNIQUE,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- ========================
-- 2. PROGRAMS TABLE (Courses)
-- ========================
CREATE TABLE IF NOT EXISTS programs (
    id SERIAL PRIMARY KEY,
    university_id INTEGER NOT NULL REFERENCES universities(id) ON DELETE CASCADE,
    name VARCHAR(300) NOT NULL,
    name_short VARCHAR(150),
    degree_type VARCHAR(20) CHECK (degree_type IN ('bachelor', 'master')),
    language VARCHAR(20) NOT NULL CHECK (language IN ('german', 'english', 'mixed')),
    subject_area VARCHAR(100) NOT NULL,
    duration_semesters INTEGER,
    tuition_fee_eur DECIMAL(10,2) DEFAULT 0,
    required_german_level VARCHAR(20),
    required_english_level VARCHAR(20),
    semester_start VARCHAR(50),
    course_link VARCHAR(500),
    description TEXT,
    admission_requirements TEXT,
    application_deadline VARCHAR(100),
    external_id VARCHAR(100) UNIQUE,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- ========================
-- 3. USERS TABLE
-- ========================
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    country VARCHAR(50),
    created_at TIMESTAMP DEFAULT NOW()
);

-- ========================
-- 4. CHAT GROUPS TABLE
-- ========================
CREATE TABLE IF NOT EXISTS chat_groups (
    id SERIAL PRIMARY KEY,
    university_id INTEGER NOT NULL REFERENCES universities(id) ON DELETE CASCADE,
    program_id INTEGER REFERENCES programs(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(university_id, program_id)
);

-- ========================
-- 5. CHAT MEMBERS TABLE
-- ========================
CREATE TABLE IF NOT EXISTS chat_members (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    group_id INTEGER NOT NULL REFERENCES chat_groups(id) ON DELETE CASCADE,
    joined_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(user_id, group_id)
);

-- ========================
-- 6. MESSAGES TABLE
-- ========================
CREATE TABLE IF NOT EXISTS messages (
    id SERIAL PRIMARY KEY,
    group_id INTEGER NOT NULL REFERENCES chat_groups(id) ON DELETE CASCADE,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    sent_at TIMESTAMP DEFAULT NOW()
);

-- ========================
-- 7. BOOKMARKS TABLE
-- ========================
CREATE TABLE IF NOT EXISTS bookmarks (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    program_id INTEGER NOT NULL REFERENCES programs(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(user_id, program_id)
);

-- ========================
-- INDEXES
-- ========================
CREATE INDEX IF NOT EXISTS idx_programs_subject ON programs(subject_area);
CREATE INDEX IF NOT EXISTS idx_programs_degree ON programs(degree_type);
CREATE INDEX IF NOT EXISTS idx_programs_language ON programs(language);
CREATE INDEX IF NOT EXISTS idx_programs_university ON programs(university_id);
CREATE INDEX IF NOT EXISTS idx_universities_country ON universities(country);
CREATE INDEX IF NOT EXISTS idx_universities_city ON universities(city);
CREATE INDEX IF NOT EXISTS idx_universities_type ON universities(type);
CREATE INDEX IF NOT EXISTS idx_universities_category ON universities(category);
CREATE INDEX IF NOT EXISTS idx_messages_group ON messages(group_id);
CREATE INDEX IF NOT EXISTS idx_messages_sent ON messages(sent_at);