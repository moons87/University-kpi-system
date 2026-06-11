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

-- Admin user (password: admin_uni_2024 — unique bcrypt hash, dev only, CHANGE IN PRODUCTION)
INSERT INTO users (email, password_hash, role) VALUES
    ('admin@uni.kz', '$2b$12$aSmUSEfURI2QoivR35t/Yuwy.Vl906A7BwhYNiYW.Q.RuEkC1C.BK', 'admin');

-- Teacher users (each has a unique password hash; passwords: teach_pass_secure / teach_pass_secure2)
INSERT INTO users (teacher_id, email, password_hash, role) VALUES
    (1, 'a.ivanov@uni.kz',  '$2b$12$iw8jDtMmIrhtrP5TA1PoLegIHxHkbL7U/i0Bm5/cpyIT9NKrZOO76', 'teacher'),
    (2, 'm.petrova@uni.kz', '$2b$12$DQQHka.WsGPQ17yQP/5xfeS3mDFeiyayEpgGC.RZlZGEGFD3PROuK', 'teacher');
