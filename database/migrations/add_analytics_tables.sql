CREATE TABLE IF NOT EXISTS etl_runs (
    id            SERIAL PRIMARY KEY,
    year          INT         NOT NULL,
    semester      INT         NOT NULL CHECK (semester IN (1, 2)),
    trigger       VARCHAR(20) NOT NULL CHECK (trigger IN ('cli', 'api', 'scheduler')),
    started_at    TIMESTAMP   NOT NULL DEFAULT NOW(),
    finished_at   TIMESTAMP,
    status        VARCHAR(20) NOT NULL DEFAULT 'running'
                  CHECK (status IN ('running', 'done', 'error')),
    error_message TEXT
);

CREATE TABLE IF NOT EXISTS analytics_teacher_kpi (
    id                SERIAL PRIMARY KEY,
    teacher_id        INT          NOT NULL REFERENCES teachers(id) ON DELETE CASCADE,
    teacher_name      VARCHAR(200),
    department_name   VARCHAR(200),
    position_name     VARCHAR(100),
    year              INT          NOT NULL,
    semester          INT          NOT NULL,
    teaching_score    DECIMAL(5,2),
    research_score    DECIMAL(5,2),
    project_score     DECIMAL(5,2),
    achievement_score DECIMAL(5,2),
    total_score       DECIMAL(5,2),
    hours_total       DECIMAL(10,2),
    scopus_wos_count  INT,
    local_pub_count   INT,
    patent_count      INT,
    project_count     INT,
    project_budget    DECIMAL(15,2),
    ach_intl          INT,
    ach_natl          INT,
    ach_local         INT,
    updated_at        TIMESTAMP DEFAULT NOW(),
    UNIQUE (teacher_id, year, semester)
);

CREATE TABLE IF NOT EXISTS analytics_dept_summary (
    id              SERIAL PRIMARY KEY,
    department_id   INT          NOT NULL REFERENCES departments(id) ON DELETE CASCADE,
    department_name VARCHAR(200),
    year            INT          NOT NULL,
    semester        INT          NOT NULL,
    teacher_count   INT,
    avg_total_score DECIMAL(5,2),
    max_total_score DECIMAL(5,2),
    min_total_score DECIMAL(5,2),
    avg_teaching    DECIMAL(5,2),
    avg_research    DECIMAL(5,2),
    avg_project     DECIMAL(5,2),
    avg_achievement DECIMAL(5,2),
    updated_at      TIMESTAMP DEFAULT NOW(),
    UNIQUE (department_id, year, semester)
);

CREATE TABLE IF NOT EXISTS analytics_rankings (
    id           SERIAL PRIMARY KEY,
    teacher_id   INT          NOT NULL REFERENCES teachers(id) ON DELETE CASCADE,
    teacher_name VARCHAR(200),
    dept_name    VARCHAR(200),
    year         INT          NOT NULL,
    semester     INT          NOT NULL,
    rank_overall INT          NOT NULL,
    rank_in_dept INT          NOT NULL,
    total_score  DECIMAL(5,2),
    updated_at   TIMESTAMP DEFAULT NOW(),
    UNIQUE (teacher_id, year, semester)
);

CREATE TABLE IF NOT EXISTS analytics_trends (
    id           SERIAL PRIMARY KEY,
    teacher_id   INT          NOT NULL REFERENCES teachers(id) ON DELETE CASCADE,
    teacher_name VARCHAR(200),
    year         INT          NOT NULL,
    semester     INT          NOT NULL,
    total_score  DECIMAL(5,2),
    prev_score   DECIMAL(5,2),
    delta        DECIMAL(5,2),
    updated_at   TIMESTAMP DEFAULT NOW(),
    UNIQUE (teacher_id, year, semester)
);
