# Database Layer Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Create a fully working PostgreSQL database with all 15 tables, constraints, and sample seed data.

**Architecture:** Plain SQL files (`schema.sql`, `seed.sql`) applied directly with `psql`. No ORM at this stage — that comes in Plan 2. The database must be fully operational and queryable before moving to the backend.

**Tech Stack:** PostgreSQL 14+, psql CLI

---

## File Map

| File | Responsibility |
|------|---------------|
| `database/schema.sql` | DDL: CREATE TABLE statements for all 15 tables, constraints, indexes |
| `database/seed.sql` | DML: INSERT sample data (2 departments, 5 teachers, activity records, 1 admin user) |
| `database/schema.dbml` | DBML source (already created — do not modify) |

---

### Task 1: Create the PostgreSQL database

**Files:**
- No files created — shell commands only

- [ ] **Step 1: Verify PostgreSQL is running**

```bash
psql -U postgres -c "SELECT version();"
```
Expected: PostgreSQL version string printed. If error — start PostgreSQL service first.

- [ ] **Step 2: Create the database**

```bash
psql -U postgres -c "CREATE DATABASE university_analytics;"
```
Expected: `CREATE DATABASE`

- [ ] **Step 3: Verify it exists**

```bash
psql -U postgres -c "\l" | grep university_analytics
```
Expected: `university_analytics` listed.

---

### Task 2: Write schema.sql — dimension tables

**Files:**
- Create: `database/schema.sql`

- [ ] **Step 1: Create schema.sql with dimension tables**

Create `database/schema.sql` with the following content:

```sql
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
```

- [ ] **Step 2: Apply and verify**

```bash
psql -U postgres -d university_analytics -f database/schema.sql
```
Expected: `CREATE TABLE` printed 4 times, no errors.

```bash
psql -U postgres -d university_analytics -c "\dt"
```
Expected: `positions`, `degrees`, `departments`, `time_dim` listed.

- [ ] **Step 3: Commit**

```bash
git init
git add database/schema.sql database/schema.dbml
git commit -m "feat(db): add dimension tables to schema.sql"
```

---

### Task 3: Write schema.sql — teachers and academic activity tables

**Files:**
- Modify: `database/schema.sql`

- [ ] **Step 1: Append teachers + academic tables to schema.sql**

Append after the `time_dim` block:

```sql
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
-- ACADEMIC ACTIVITIES
-- =======================

CREATE TABLE subjects (
    id   SERIAL PRIMARY KEY,
    name VARCHAR(200) NOT NULL
);

CREATE TABLE groups (
    id              SERIAL PRIMARY KEY,
    name            VARCHAR(100) NOT NULL,
    education_level VARCHAR(50)  -- bachelor, master, phd
);

CREATE TABLE teaching_load (
    id         SERIAL PRIMARY KEY,
    teacher_id INT NOT NULL REFERENCES teachers(id) ON DELETE CASCADE,
    subject_id INT NOT NULL REFERENCES subjects(id),
    group_id   INT NOT NULL REFERENCES groups(id),
    time_id    INT NOT NULL REFERENCES time_dim(id),
    hours      INT NOT NULL CHECK (hours > 0)
);
```

- [ ] **Step 2: Re-apply and verify**

```bash
psql -U postgres -d university_analytics -f database/schema.sql
```
Expected: all `CREATE TABLE` lines, no errors.

```bash
psql -U postgres -d university_analytics -c "\dt"
```
Expected: 8 tables listed.

- [ ] **Step 3: Commit**

```bash
git add database/schema.sql
git commit -m "feat(db): add teachers and academic activity tables"
```

---

### Task 4: Write schema.sql — research activity and KPI tables

**Files:**
- Modify: `database/schema.sql`

- [ ] **Step 1: Append research + KPI + auth tables to schema.sql**

Append after `teaching_load`:

```sql
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
    category    VARCHAR(50) NOT NULL,  -- teaching, research, project, achievement
    metric_name VARCHAR(100) NOT NULL,
    value       DECIMAL(10, 2),
    score       DECIMAL(5, 2)
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
                  CHECK (role IN ('admin', 'teacher'))
);
```

- [ ] **Step 2: Re-apply and verify all 15 tables**

```bash
psql -U postgres -d university_analytics -f database/schema.sql
```
Expected: 15× `CREATE TABLE`, no errors.

```bash
psql -U postgres -d university_analytics -c "\dt"
```
Expected output — exactly these 15 tables:
```
achievements, degrees, departments, groups, kpi_details, kpi_scores,
patents, positions, projects, publications, subjects, teachers,
teaching_load, time_dim, users
```

- [ ] **Step 3: Verify a foreign key constraint works**

```bash
psql -U postgres -d university_analytics -c "
INSERT INTO teachers (full_name, department_id) VALUES ('Test', 999);
"
```
Expected: `ERROR: insert or update on table "teachers" violates foreign key constraint`

- [ ] **Step 4: Commit**

```bash
git add database/schema.sql
git commit -m "feat(db): add research, KPI and auth tables — schema complete"
```

---

### Task 5: Write seed.sql — lookup data

**Files:**
- Create: `database/seed.sql`

- [ ] **Step 1: Create seed.sql with lookup inserts**

Create `database/seed.sql`:

```sql
-- =============================================================
-- University Analytics Platform — Seed Data
-- =============================================================

-- Positions
INSERT INTO positions (name) VALUES
    ('Professor'),
    ('Associate Professor'),
    ('Senior Lecturer'),
    ('Lecturer'),
    ('Assistant');

-- Degrees
INSERT INTO degrees (name) VALUES
    ('Doctor of Sciences'),
    ('Candidate of Sciences'),
    ('Master'),
    ('Bachelor');

-- Departments
INSERT INTO departments (name) VALUES
    ('Department of Computer Science'),
    ('Department of Mathematics');

-- Time periods
INSERT INTO time_dim (year, semester, quarter) VALUES
    (2023, 1, 1),
    (2023, 2, 2),
    (2024, 1, 1),
    (2024, 2, 2),
    (2025, 1, 1);

-- Subjects
INSERT INTO subjects (name) VALUES
    ('Algorithms and Data Structures'),
    ('Database Management Systems'),
    ('Software Engineering'),
    ('Linear Algebra'),
    ('Calculus');

-- Groups
INSERT INTO groups (name, education_level) VALUES
    ('CS-101', 'bachelor'),
    ('CS-201', 'bachelor'),
    ('CS-301', 'bachelor'),
    ('MATH-101', 'bachelor'),
    ('CS-MSC-01', 'master');
```

- [ ] **Step 2: Apply and verify**

```bash
psql -U postgres -d university_analytics -f database/seed.sql
```
Expected: `INSERT` lines, no errors.

```bash
psql -U postgres -d university_analytics -c "SELECT * FROM positions;"
```
Expected: 5 rows.

```bash
psql -U postgres -d university_analytics -c "SELECT * FROM time_dim;"
```
Expected: 5 rows.

- [ ] **Step 3: Commit**

```bash
git add database/seed.sql
git commit -m "feat(db): add seed data — lookup tables"
```

---

### Task 6: Write seed.sql — teachers and activity data

**Files:**
- Modify: `database/seed.sql`

- [ ] **Step 1: Append teachers and activity inserts to seed.sql**

Append to `database/seed.sql`:

```sql
-- Teachers (department_id 1 = Computer Science, 2 = Mathematics)
INSERT INTO teachers (full_name, email, position_id, degree_id, department_id) VALUES
    ('Aleksei Ivanov',    'a.ivanov@uni.kz',    1, 1, 1),
    ('Marina Petrova',   'm.petrova@uni.kz',   2, 2, 1),
    ('Dmitri Smirnov',   'd.smirnov@uni.kz',   3, 2, 1),
    ('Elena Kozlova',    'e.kozlova@uni.kz',   2, 1, 2),
    ('Sergei Volkov',    's.volkov@uni.kz',    4, 3, 2);

-- Teaching load (time_id 3 = 2024 semester 1)
INSERT INTO teaching_load (teacher_id, subject_id, group_id, time_id, hours) VALUES
    (1, 1, 1, 3, 60),
    (1, 2, 2, 3, 45),
    (2, 3, 1, 3, 60),
    (3, 2, 3, 3, 45),
    (4, 4, 4, 3, 60),
    (5, 5, 4, 3, 75);

-- Publications (time_id 3 = 2024 semester 1)
INSERT INTO publications (teacher_id, time_id, title, type, quartile) VALUES
    (1, 3, 'Deep Learning for Code Analysis',    'Scopus', 'Q1'),
    (1, 3, 'Graph Neural Networks Survey',        'WoS',    'Q2'),
    (2, 3, 'Agile Methods in Academia',           'local',  NULL),
    (4, 3, 'Numerical Methods for PDEs',          'Scopus', 'Q2'),
    (4, 3, 'Matrix Decomposition Algorithms',     'WoS',    'Q1');

-- Patents
INSERT INTO patents (teacher_id, time_id, title, registration_number) VALUES
    (1, 3, 'Automated Code Review System', 'KZ2024-0001'),
    (4, 3, 'Numerical Solver Library',     'KZ2024-0002');

-- Projects
INSERT INTO projects (teacher_id, time_id, title, funding_source, budget, start_date, end_date) VALUES
    (1, 3, 'AI in Education Research',  'Ministry of Science', 5000000.00, '2024-01-01', '2024-12-31'),
    (2, 3, 'Software Quality Metrics',  'University Grant',    1500000.00, '2024-03-01', '2024-11-30'),
    (4, 3, 'Applied Mathematics Tools', 'Ministry of Science', 3000000.00, '2024-01-01', '2025-06-30');

-- Achievements
INSERT INTO achievements (teacher_id, time_id, title, level) VALUES
    (1, 3, 'Best Researcher Award 2024',        'national'),
    (2, 3, 'International Teaching Excellence', 'international'),
    (4, 3, 'National Mathematics Prize',        'national'),
    (5, 3, 'University Teaching Award',         'local');

-- Admin user (password: admin123 — bcrypt hash for dev only)
INSERT INTO users (email, password_hash, role) VALUES
    ('admin@uni.kz', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMqJqhN8/LeAiZ2RKbDxqH9xKa', 'admin');

-- Teacher users
INSERT INTO users (teacher_id, email, password_hash, role) VALUES
    (1, 'a.ivanov@uni.kz',  '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMqJqhN8/LeAiZ2RKbDxqH9xKa', 'teacher'),
    (2, 'm.petrova@uni.kz', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMqJqhN8/LeAiZ2RKbDxqH9xKa', 'teacher');
```

> Note: All passwords are `admin123` in dev. The hash above is a bcrypt hash — replace with proper hashes generated by the backend in production.

- [ ] **Step 2: Re-apply seed from scratch**

```bash
psql -U postgres -d university_analytics -f database/schema.sql
psql -U postgres -d university_analytics -f database/seed.sql
```
Expected: no errors.

- [ ] **Step 3: Verify key counts**

```bash
psql -U postgres -d university_analytics -c "
SELECT
    (SELECT COUNT(*) FROM teachers)     AS teachers,
    (SELECT COUNT(*) FROM publications) AS publications,
    (SELECT COUNT(*) FROM projects)     AS projects,
    (SELECT COUNT(*) FROM patents)      AS patents,
    (SELECT COUNT(*) FROM achievements) AS achievements,
    (SELECT COUNT(*) FROM teaching_load) AS teaching_load,
    (SELECT COUNT(*) FROM users)        AS users;
"
```
Expected:
```
 teachers | publications | projects | patents | achievements | teaching_load | users
----------+--------------+----------+---------+--------------+---------------+-------
        5 |            5 |        3 |       2 |            4 |             6 |     3
```

- [ ] **Step 4: Verify join works (teacher with department)**

```bash
psql -U postgres -d university_analytics -c "
SELECT t.full_name, d.name AS department, p.name AS position
FROM teachers t
JOIN departments d ON t.department_id = d.id
JOIN positions   p ON t.position_id   = p.id;
"
```
Expected: 5 rows with names, departments, and positions.

- [ ] **Step 5: Commit**

```bash
git add database/seed.sql
git commit -m "feat(db): add seed data — teachers, activities, users complete"
```

---

### Task 7: Verify full schema integrity

**Files:**
- No file changes — verification only

- [ ] **Step 1: Verify all FK constraints are in place**

```bash
psql -U postgres -d university_analytics -c "
SELECT
    tc.table_name,
    kcu.column_name,
    ccu.table_name AS foreign_table
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu
    ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage ccu
    ON ccu.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY'
ORDER BY tc.table_name;
"
```
Expected: 15+ rows covering all FK relationships from schema.dbml.

- [ ] **Step 2: Verify CHECK constraints reject bad data**

```bash
psql -U postgres -d university_analytics -c "
INSERT INTO publications (teacher_id, time_id, title, type)
VALUES (1, 3, 'Test', 'invalid_type');
"
```
Expected: `ERROR: new row for relation "publications" violates check constraint`

```bash
psql -U postgres -d university_analytics -c "
INSERT INTO achievements (teacher_id, time_id, title, level)
VALUES (1, 3, 'Test', 'city');
"
```
Expected: `ERROR: new row for relation "achievements" violates check constraint`

- [ ] **Step 3: Final commit**

```bash
git add .
git commit -m "feat(db): database layer complete — schema + seed verified"
```

---

## Layer Complete

**Readiness check:** Database layer is done when:
- [ ] All 15 tables exist in `university_analytics`
- [ ] All foreign keys and check constraints are active
- [ ] Seed data loads without errors
- [ ] Join queries across teachers → activities return correct results

**Next:** Plan 2 — Backend (FastAPI + SQLAlchemy + KPI engine + JWT auth)
