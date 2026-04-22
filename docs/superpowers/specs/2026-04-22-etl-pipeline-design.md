# ETL Pipeline — Design Spec

**Date:** 2026-04-22
**Status:** Approved

---

## Goal

Build a standalone ETL pipeline that:
1. Refreshes KPI scores (reuses existing `kpi_engine.py`)
2. Builds a full analytics layer in PostgreSQL (4 new tables)
3. Exports CSV files + an Excel workbook for Power BI
4. Can be triggered via CLI, FastAPI endpoint (admin), or nightly APScheduler job

---

## Architecture

```
pipeline.py (CLI / API / Scheduler)
  │
  ├── 1. kpi_engine.calculate_kpi()       → refreshes kpi_scores, kpi_details
  │                                          (committed immediately — operational data)
  │
  ├── 2. kpi_aggregator.py               → upserts analytics_teacher_kpi
  │
  ├── 3. analytics_builder.py            → upserts analytics_dept_summary
  │                                          analytics_rankings
  │                                          analytics_trends
  │      (steps 2–3 in one transaction — rollback together on failure)
  │
  ├── 4. csv_exporter.py                 → writes etl/exports/YYYY_SN/*.csv
  │                                          (after DB commit — export failure doesn't rollback)
  │
  └── 5. excel_exporter.py              → writes etl/exports/YYYY_SN/report_YYYY_SN.xlsx
```

---

## New Database Tables

### `etl_runs`
Tracks every pipeline execution for observability.

```sql
CREATE TABLE etl_runs (
    id            SERIAL PRIMARY KEY,
    year          INT NOT NULL,
    semester      INT NOT NULL,
    trigger       VARCHAR(20) NOT NULL CHECK (trigger IN ('cli', 'api', 'scheduler')),
    started_at    TIMESTAMP NOT NULL DEFAULT NOW(),
    finished_at   TIMESTAMP,
    status        VARCHAR(20) NOT NULL DEFAULT 'running'
                  CHECK (status IN ('running', 'done', 'error')),
    error_message TEXT
);
```

### `analytics_teacher_kpi`
Flat wide table — one row per teacher per period. Primary Power BI source.

```sql
CREATE TABLE analytics_teacher_kpi (
    id                SERIAL PRIMARY KEY,
    teacher_id        INT NOT NULL REFERENCES teachers(id) ON DELETE CASCADE,
    teacher_name      VARCHAR(200),
    department_name   VARCHAR(200),
    position_name     VARCHAR(100),
    year              INT NOT NULL,
    semester          INT NOT NULL,
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
```

### `analytics_dept_summary`
Department-level aggregates per period.

```sql
CREATE TABLE analytics_dept_summary (
    id              SERIAL PRIMARY KEY,
    department_id   INT NOT NULL REFERENCES departments(id) ON DELETE CASCADE,
    department_name VARCHAR(200),
    year            INT NOT NULL,
    semester        INT NOT NULL,
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
```

### `analytics_rankings`
Overall and within-department rankings per period.

```sql
CREATE TABLE analytics_rankings (
    id           SERIAL PRIMARY KEY,
    teacher_id   INT NOT NULL REFERENCES teachers(id) ON DELETE CASCADE,
    teacher_name VARCHAR(200),
    dept_name    VARCHAR(200),
    year         INT NOT NULL,
    semester     INT NOT NULL,
    rank_overall INT NOT NULL,
    rank_in_dept INT NOT NULL,
    total_score  DECIMAL(5,2),
    updated_at   TIMESTAMP DEFAULT NOW(),
    UNIQUE (teacher_id, year, semester)
);
```

### `analytics_trends`
Period-over-period score delta per teacher.

```sql
CREATE TABLE analytics_trends (
    id           SERIAL PRIMARY KEY,
    teacher_id   INT NOT NULL REFERENCES teachers(id) ON DELETE CASCADE,
    teacher_name VARCHAR(200),
    year         INT NOT NULL,
    semester     INT NOT NULL,
    total_score  DECIMAL(5,2),
    prev_score   DECIMAL(5,2),
    delta        DECIMAL(5,2),
    updated_at   TIMESTAMP DEFAULT NOW(),
    UNIQUE (teacher_id, year, semester)
);
```

---

## File Structure

```
etl/
├── pipeline.py              CLI entry point
├── db.py                    SQLAlchemy engine from DATABASE_URL in .env
├── transformers/
│   ├── kpi_aggregator.py    builds analytics_teacher_kpi
│   └── analytics_builder.py builds dept_summary, rankings, trends
└── exporters/
    ├── csv_exporter.py      writes flat CSVs
    └── excel_exporter.py    writes Excel workbook

backend/
├── routers/etl.py           POST /etl/run, GET /etl/status (admin only)
└── scheduler.py             APScheduler nightly job

database/migrations/
└── add_analytics_tables.sql
```

---

## Export Layout

**Directory:** `etl/exports/YYYY_S{N}/` (e.g. `etl/exports/2024_S1/`)

**CSV files:**
- `kpi_scores.csv` — from `analytics_teacher_kpi`
- `departments.csv` — from `analytics_dept_summary`
- `rankings.csv` — from `analytics_rankings`
- `trends.csv` — from `analytics_trends`
- `teachers.csv` — from `teachers` joined with `departments`, `positions`, `degrees`

**Excel workbook:** `report_2024_S1.xlsx` with sheets:
- `KPI Scores` — teacher KPI wide table
- `Department Summary` — dept aggregates
- `Rankings` — overall + in-dept rank
- `Trends` — period delta
- `Teacher Details` — teacher roster with metadata

Exports happen **after** the DB transaction commits. An export failure is logged but does not roll back the analytics tables.

---

## Trigger Modes

### CLI
```bash
python etl/pipeline.py --year 2024 --semester 1
python etl/pipeline.py                          # auto-detects current period
```
- Prints progress to stdout
- Exit code 0 on success, 1 on failure

### FastAPI (admin only)
- `POST /etl/run?year=2024&semester=1` — queues run in background thread, returns `{run_id, status: "queued"}`
- `GET /etl/status` — returns last `etl_runs` record: `{year, semester, started_at, finished_at, status, error_message}`
- Same polling pattern as existing KPI recalculate endpoint

### Scheduler (APScheduler)
- `BackgroundScheduler` starts with `backend/main.py`
- Nightly job at **02:00** for the auto-detected current academic period
- Failure is logged + written to `etl_runs`; server does not crash

---

## Transaction Strategy

| Step | Transaction |
|------|-------------|
| `kpi_engine.calculate_kpi()` | Own commit (operational data) |
| Analytics table writes (steps 2–3) | Single transaction — rollback together on failure |
| CSV + Excel export (steps 4–5) | Outside DB transaction — failure logged, not rolled back |
| `etl_runs` record update | Final commit after exports |

---

## Key Constraints

- No new Python dependencies beyond what is already in `requirements.txt` (`pandas`, `openpyxl`, `sqlalchemy`, `psycopg2-binary`, `apscheduler` needs to be added)
- `etl/db.py` reads `DATABASE_URL` from `.env` — same file as the backend
- `etl/` can run standalone (no FastAPI import) so it works as a pure CLI tool
- Analytics tables are **truncate-and-reinsert** per period, not append-only, so re-running is idempotent
- `APScheduler` package must be added to `requirements.txt`
