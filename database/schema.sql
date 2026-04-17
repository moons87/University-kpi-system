-- =============================================================
-- University Analytics Platform — Database Schema
-- =============================================================

-- Clean slate (for re-running during development)
DROP TABLE IF EXISTS users CASCADE;
DROP TABLE IF EXISTS kpi_details CASCADE;
DROP TABLE IF EXISTS kpi_scores CASCADE;
DROP TABLE IF EXISTS projects CASCADE;
DROP TABLE IF EXISTS achievements CASCADE;
DROP TABLE IF EXISTS patents CASCADE;
DROP TABLE IF EXISTS publications CASCADE;
DROP TABLE IF EXISTS teaching_load CASCADE;
DROP TABLE IF EXISTS groups CASCADE;
DROP TABLE IF EXISTS subjects CASCADE;
DROP TABLE IF EXISTS teachers CASCADE;
DROP TABLE IF EXISTS time_dim CASCADE;
DROP TABLE IF EXISTS departments CASCADE;
DROP TABLE IF EXISTS degrees CASCADE;
DROP TABLE IF EXISTS positions CASCADE;

-- =======================
-- DIMENSIONS (LOOKUP TABLES)
-- =======================

CREATE TABLE positions (
    id   SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL
);

CREATE TABLE degrees (
    id   SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL
);

CREATE TABLE departments (
    id   SERIAL PRIMARY KEY,
    name VARCHAR(200) NOT NULL
);

CREATE TABLE time_dim (
    id       SERIAL PRIMARY KEY,
    year     INT NOT NULL,
    semester INT NOT NULL CHECK (semester IN (1, 2)),
    quarter  INT          CHECK (quarter  IN (1, 2, 3, 4)),
    UNIQUE (year, semester)
);

-- =======================
-- MAIN ENTITY
-- =======================

CREATE TABLE teachers (
    id            SERIAL PRIMARY KEY,
    full_name     VARCHAR(200) NOT NULL,
    email         VARCHAR(200) UNIQUE,
    position_id   INT REFERENCES positions(id),
    degree_id     INT REFERENCES degrees(id),
    department_id INT REFERENCES departments(id),
    created_at    TIMESTAMP DEFAULT NOW()
);

-- =======================
-- AUTH SYSTEM
-- =======================

CREATE TABLE users (
    id            SERIAL PRIMARY KEY,
    teacher_id    INT REFERENCES teachers(id),
    email         VARCHAR(200) UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    role          VARCHAR(20) NOT NULL DEFAULT 'teacher'
                  CHECK (role IN ('admin', 'teacher', 'advisor'))
);

-- =======================
-- ACADEMIC ACTIVITIES
-- =======================

CREATE TABLE subjects (
    id   SERIAL PRIMARY KEY,
    name VARCHAR(200) NOT NULL
);

CREATE TABLE groups (
    id              SERIAL PRIMARY KEY,
    name            VARCHAR(100) NOT NULL,
    education_level VARCHAR(50),  -- bachelor, master, phd
    advisor_id      INT REFERENCES users(id) ON DELETE SET NULL
);

CREATE TABLE teaching_load (
    id         SERIAL PRIMARY KEY,
    teacher_id INT NOT NULL REFERENCES teachers(id) ON DELETE CASCADE,
    subject_id INT NOT NULL REFERENCES subjects(id),
    group_id   INT NOT NULL REFERENCES groups(id),
    time_id    INT NOT NULL REFERENCES time_dim(id),
    hours      INT NOT NULL CHECK (hours > 0)
);

-- =======================
-- RESEARCH ACTIVITY
-- =======================

CREATE TABLE publications (
    id         SERIAL PRIMARY KEY,
    teacher_id INT  NOT NULL REFERENCES teachers(id) ON DELETE CASCADE,
    time_id    INT  NOT NULL REFERENCES time_dim(id),
    title      TEXT NOT NULL,
    type       VARCHAR(20) NOT NULL CHECK (type IN ('Scopus', 'WoS', 'local')),
    quartile   VARCHAR(5)  CHECK (quartile IN ('Q1', 'Q2', 'Q3', 'Q4'))
);

CREATE TABLE patents (
    id                  SERIAL PRIMARY KEY,
    teacher_id          INT  NOT NULL REFERENCES teachers(id) ON DELETE CASCADE,
    time_id             INT  NOT NULL REFERENCES time_dim(id),
    title               TEXT NOT NULL,
    registration_number VARCHAR(100)
);

CREATE TABLE achievements (
    id         SERIAL PRIMARY KEY,
    teacher_id INT  NOT NULL REFERENCES teachers(id) ON DELETE CASCADE,
    time_id    INT  NOT NULL REFERENCES time_dim(id),
    title      TEXT NOT NULL,
    level      VARCHAR(20) NOT NULL CHECK (level IN ('international', 'national', 'local'))
);

CREATE TABLE projects (
    id             SERIAL PRIMARY KEY,
    teacher_id     INT  NOT NULL REFERENCES teachers(id) ON DELETE CASCADE,
    time_id        INT  NOT NULL REFERENCES time_dim(id),
    title          TEXT NOT NULL,
    funding_source VARCHAR(200),
    budget         DECIMAL(15, 2),
    start_date     DATE,
    end_date       DATE
);

-- =======================
-- KPI SYSTEM
-- =======================

CREATE TABLE kpi_scores (
    id                SERIAL PRIMARY KEY,
    teacher_id        INT NOT NULL REFERENCES teachers(id) ON DELETE CASCADE,
    time_id           INT NOT NULL REFERENCES time_dim(id),
    teaching_score    DECIMAL(5, 2),
    research_score    DECIMAL(5, 2),
    project_score     DECIMAL(5, 2),
    achievement_score DECIMAL(5, 2),
    total_score       DECIMAL(5, 2),
    UNIQUE (teacher_id, time_id)
);

CREATE TABLE kpi_details (
    id          SERIAL PRIMARY KEY,
    teacher_id  INT         NOT NULL REFERENCES teachers(id) ON DELETE CASCADE,
    time_id     INT         NOT NULL REFERENCES time_dim(id),
    category    VARCHAR(50) NOT NULL,
    metric_name VARCHAR(100) NOT NULL,
    value       DECIMAL(10, 2),
    score       DECIMAL(5, 2)
);
