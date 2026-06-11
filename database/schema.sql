-- =============================================================
-- University Analytics Platform — Database Schema (MySQL 8+)
-- =============================================================

-- Clean slate (for re-running during development).
-- MySQL has no DROP TABLE ... CASCADE; disable FK checks instead.
SET FOREIGN_KEY_CHECKS = 0;
DROP TABLE IF EXISTS users;
DROP TABLE IF EXISTS kpi_details;
DROP TABLE IF EXISTS kpi_scores;
DROP TABLE IF EXISTS projects;
DROP TABLE IF EXISTS achievements;
DROP TABLE IF EXISTS patents;
DROP TABLE IF EXISTS publications;
DROP TABLE IF EXISTS teaching_load;
DROP TABLE IF EXISTS `groups`;
DROP TABLE IF EXISTS subjects;
DROP TABLE IF EXISTS teachers;
DROP TABLE IF EXISTS time_dim;
DROP TABLE IF EXISTS departments;
DROP TABLE IF EXISTS degrees;
DROP TABLE IF EXISTS positions;
SET FOREIGN_KEY_CHECKS = 1;

-- =======================
-- DIMENSIONS (LOOKUP TABLES)
-- =======================

CREATE TABLE positions (
    id   INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE degrees (
    id   INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE departments (
    id   INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(200) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE time_dim (
    id       INT AUTO_INCREMENT PRIMARY KEY,
    year     INT NOT NULL,
    semester INT NOT NULL CHECK (semester IN (1, 2)),
    quarter  INT          CHECK (quarter  IN (1, 2, 3, 4)),
    UNIQUE (year, semester)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =======================
-- MAIN ENTITY
-- =======================

CREATE TABLE teachers (
    id            INT AUTO_INCREMENT PRIMARY KEY,
    full_name     VARCHAR(200) NOT NULL,
    email         VARCHAR(200) UNIQUE,
    position_id   INT,
    degree_id     INT,
    department_id INT,
    created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (position_id)   REFERENCES positions(id),
    FOREIGN KEY (degree_id)     REFERENCES degrees(id),
    FOREIGN KEY (department_id) REFERENCES departments(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =======================
-- AUTH SYSTEM
-- =======================

CREATE TABLE users (
    id            INT AUTO_INCREMENT PRIMARY KEY,
    teacher_id    INT,
    email         VARCHAR(200) UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    role          VARCHAR(20) NOT NULL DEFAULT 'teacher'
                  CHECK (role IN ('admin', 'teacher', 'advisor')),
    FOREIGN KEY (teacher_id) REFERENCES teachers(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =======================
-- ACADEMIC ACTIVITIES
-- =======================

CREATE TABLE subjects (
    id   INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(200) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- `groups` is a reserved word in MySQL 8 — must be quoted.
CREATE TABLE `groups` (
    id              INT AUTO_INCREMENT PRIMARY KEY,
    name            VARCHAR(100) NOT NULL,
    education_level VARCHAR(50),  -- bachelor, master, phd
    advisor_id      INT,
    FOREIGN KEY (advisor_id) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE teaching_load (
    id         INT AUTO_INCREMENT PRIMARY KEY,
    teacher_id INT NOT NULL,
    subject_id INT NOT NULL,
    group_id   INT NOT NULL,
    time_id    INT NOT NULL,
    hours      INT NOT NULL CHECK (hours > 0),
    FOREIGN KEY (teacher_id) REFERENCES teachers(id) ON DELETE CASCADE,
    FOREIGN KEY (subject_id) REFERENCES subjects(id),
    FOREIGN KEY (group_id)   REFERENCES `groups`(id),
    FOREIGN KEY (time_id)    REFERENCES time_dim(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =======================
-- RESEARCH ACTIVITY
-- =======================

CREATE TABLE publications (
    id         INT AUTO_INCREMENT PRIMARY KEY,
    teacher_id INT  NOT NULL,
    time_id    INT  NOT NULL,
    title      TEXT NOT NULL,
    type       VARCHAR(50) NOT NULL CHECK (type IN (
                   'Scopus', 'WoS', 'Вестник', 'Конференция',
                   'КОКСНВО', 'Международная конференция', 'Монография', 'Учебное пособие',
                   'Зарубежные журналы'
               )),
    quartile   VARCHAR(5)  CHECK (quartile IN ('Q1', 'Q2', 'Q3', 'Q4')),
    FOREIGN KEY (teacher_id) REFERENCES teachers(id) ON DELETE CASCADE,
    FOREIGN KEY (time_id)    REFERENCES time_dim(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE patents (
    id                  INT AUTO_INCREMENT PRIMARY KEY,
    teacher_id          INT  NOT NULL,
    time_id             INT  NOT NULL,
    title               TEXT NOT NULL,
    registration_number VARCHAR(100),
    FOREIGN KEY (teacher_id) REFERENCES teachers(id) ON DELETE CASCADE,
    FOREIGN KEY (time_id)    REFERENCES time_dim(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE achievements (
    id         INT AUTO_INCREMENT PRIMARY KEY,
    teacher_id INT  NOT NULL,
    time_id    INT  NOT NULL,
    title      TEXT NOT NULL,
    level      VARCHAR(20) NOT NULL CHECK (level IN ('international', 'national', 'local')),
    FOREIGN KEY (teacher_id) REFERENCES teachers(id) ON DELETE CASCADE,
    FOREIGN KEY (time_id)    REFERENCES time_dim(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE projects (
    id             INT AUTO_INCREMENT PRIMARY KEY,
    teacher_id     INT  NOT NULL,
    time_id        INT  NOT NULL,
    title          TEXT NOT NULL,
    funding_source VARCHAR(200),
    budget         DECIMAL(15, 2),
    start_date     DATE,
    end_date       DATE,
    FOREIGN KEY (teacher_id) REFERENCES teachers(id) ON DELETE CASCADE,
    FOREIGN KEY (time_id)    REFERENCES time_dim(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =======================
-- KPI SYSTEM
-- =======================

CREATE TABLE kpi_scores (
    id                INT AUTO_INCREMENT PRIMARY KEY,
    teacher_id        INT NOT NULL,
    time_id           INT NOT NULL,
    teaching_score    DECIMAL(5, 2),
    research_score    DECIMAL(5, 2),
    project_score     DECIMAL(5, 2),
    achievement_score DECIMAL(5, 2),
    total_score       DECIMAL(5, 2),
    UNIQUE (teacher_id, time_id),
    FOREIGN KEY (teacher_id) REFERENCES teachers(id) ON DELETE CASCADE,
    FOREIGN KEY (time_id)    REFERENCES time_dim(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE kpi_details (
    id          INT AUTO_INCREMENT PRIMARY KEY,
    teacher_id  INT          NOT NULL,
    time_id     INT          NOT NULL,
    category    VARCHAR(50)  NOT NULL,
    metric_name VARCHAR(100) NOT NULL,
    value       DECIMAL(20, 2),
    score       DECIMAL(5, 2),
    FOREIGN KEY (teacher_id) REFERENCES teachers(id) ON DELETE CASCADE,
    FOREIGN KEY (time_id)    REFERENCES time_dim(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
