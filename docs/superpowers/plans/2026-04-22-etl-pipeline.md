# ETL Pipeline Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a full ETL pipeline that refreshes KPI scores, builds four analytics tables in PostgreSQL, exports CSV + Excel for Power BI, and can be triggered via CLI, FastAPI endpoint, or nightly APScheduler job.

**Architecture:** The `etl/` directory at the repo root is a standalone Python package. `pipeline.py` orchestrates five steps: (1) call the existing `backend/services/kpi_engine.py` to refresh scores, (2–4) build analytics tables in a single transaction via pandas-based transformers, (5–6) export CSVs and an Excel workbook after the transaction commits. A FastAPI router in `backend/routers/etl.py` exposes `POST /etl/run` and `GET /etl/status`; APScheduler runs nightly at 02:00 from `backend/scheduler.py`, started via a FastAPI lifespan event.

**Tech Stack:** Python 3.11, pandas 2.2, openpyxl 3.1, SQLAlchemy 2.0, APScheduler 3.10, FastAPI, PostgreSQL

---

## File Map

| File | Action | Purpose |
|------|--------|---------|
| `database/migrations/add_analytics_tables.sql` | Create | DDL for 5 new tables |
| `backend/requirements.txt` | Modify | Add `apscheduler==3.10.4` |
| `pytest.ini` | Create | pythonpath = . so tests find etl/ |
| `etl/__init__.py` | Create | Package marker |
| `etl/db.py` | Create | SQLAlchemy engine + `read_df` helper |
| `etl/transformers/__init__.py` | Create | Package marker |
| `etl/transformers/kpi_aggregator.py` | Create | `_transform_teacher_kpi` + `build_teacher_kpi` |
| `etl/transformers/analytics_builder.py` | Create | dept summary, rankings, trends |
| `etl/exporters/__init__.py` | Create | Package marker |
| `etl/exporters/csv_exporter.py` | Create | Write flat CSVs |
| `etl/exporters/excel_exporter.py` | Create | Write Excel workbook |
| `etl/pipeline.py` | Create | CLI orchestrator + `run_etl()` |
| `tests/__init__.py` | Create | Package marker |
| `tests/etl/__init__.py` | Create | Package marker |
| `tests/etl/test_kpi_aggregator.py` | Create | Unit tests for `_transform_teacher_kpi` |
| `tests/etl/test_analytics_builder.py` | Create | Unit tests for 3 transform functions |
| `backend/routers/etl.py` | Create | POST /etl/run, GET /etl/status |
| `backend/scheduler.py` | Create | APScheduler nightly job |
| `backend/main.py` | Modify | Register etl router + lifespan scheduler |

---

## Task 1: Database Migration + APScheduler Dependency

**Files:**
- Create: `database/migrations/add_analytics_tables.sql`
- Modify: `backend/requirements.txt`

- [ ] **Step 1: Create migration file**

```sql
-- database/migrations/add_analytics_tables.sql

CREATE TABLE IF NOT EXISTS etl_runs (
    id            SERIAL PRIMARY KEY,
    year          INT         NOT NULL,
    semester      INT         NOT NULL,
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
```

- [ ] **Step 2: Run migration**

```bash
psql -U postgres -d university_analytics \
  -f "database/migrations/add_analytics_tables.sql"
```

Expected output: `CREATE TABLE` × 5 (or `NOTICE: relation already exists` if re-run).

- [ ] **Step 3: Add APScheduler to requirements.txt**

Open `backend/requirements.txt` and append:

```
apscheduler==3.10.4
```

- [ ] **Step 4: Install the new dependency**

```bash
cd backend && pip install apscheduler==3.10.4
```

Expected: `Successfully installed apscheduler-3.10.4`

- [ ] **Step 5: Commit**

```bash
git add database/migrations/add_analytics_tables.sql backend/requirements.txt
git commit -m "feat: add ETL analytics tables migration and APScheduler dependency"
```

---

## Task 2: ETL Package Skeleton + pytest Config

**Files:**
- Create: `pytest.ini`
- Create: `etl/__init__.py`
- Create: `etl/transformers/__init__.py`
- Create: `etl/exporters/__init__.py`
- Create: `etl/db.py`
- Create: `tests/__init__.py`
- Create: `tests/etl/__init__.py`

- [ ] **Step 1: Create pytest.ini at repo root**

```ini
[pytest]
pythonpath = .
testpaths = tests
```

- [ ] **Step 2: Create package markers**

```bash
mkdir -p etl/transformers etl/exporters tests/etl
touch etl/__init__.py etl/transformers/__init__.py etl/exporters/__init__.py
touch tests/__init__.py tests/etl/__init__.py
```

- [ ] **Step 3: Create etl/db.py**

```python
# etl/db.py
from __future__ import annotations
import os

import pandas as pd
from dotenv import load_dotenv
from sqlalchemy import create_engine, text
from sqlalchemy.orm import Session, sessionmaker

load_dotenv()

DATABASE_URL = os.getenv(
    "DATABASE_URL",
    "postgresql://postgres:password@localhost:5432/university_analytics",
)

engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(bind=engine)


def read_df(db: Session, sql: str, params: dict | None = None) -> pd.DataFrame:
    """Execute *sql* with *params* and return results as a DataFrame."""
    result = db.execute(text(sql), params or {})
    rows = result.mappings().all()
    if not rows:
        return pd.DataFrame()
    return pd.DataFrame([dict(r) for r in rows])
```

- [ ] **Step 4: Verify import works**

```bash
python -c "from etl.db import engine, SessionLocal, read_df; print('ok')"
```

Expected: `ok`

- [ ] **Step 5: Commit**

```bash
git add pytest.ini etl/ tests/
git commit -m "feat: add ETL package skeleton and pytest config"
```

---

## Task 3: kpi_aggregator.py (TDD)

**Files:**
- Create: `tests/etl/test_kpi_aggregator.py`
- Create: `etl/transformers/kpi_aggregator.py`

- [ ] **Step 1: Write the failing tests**

```python
# tests/etl/test_kpi_aggregator.py
import pandas as pd
import pytest
from etl.transformers.kpi_aggregator import _transform_teacher_kpi


@pytest.fixture
def kpi_df():
    return pd.DataFrame([{
        "teacher_id":       1,
        "teacher_name":     "Alice",
        "department_name":  "CS",
        "position_name":    "Professor",
        "teaching_score":   80.0,
        "research_score":   70.0,
        "project_score":    60.0,
        "achievement_score":50.0,
        "total_score":      68.5,
    }])


@pytest.fixture
def details_df():
    return pd.DataFrame([
        {"teacher_id": 1, "metric_name": "hours_total",              "value": 240.0},
        {"teacher_id": 1, "metric_name": "scopus_wos_count",         "value": 3.0},
        {"teacher_id": 1, "metric_name": "local_pub_count",          "value": 5.0},
        {"teacher_id": 1, "metric_name": "patent_count",             "value": 2.0},
        {"teacher_id": 1, "metric_name": "project_count",            "value": 1.0},
        {"teacher_id": 1, "metric_name": "project_budget",           "value": 4_000_000.0},
        {"teacher_id": 1, "metric_name": "achievement_international", "value": 1.0},
        {"teacher_id": 1, "metric_name": "achievement_national",      "value": 2.0},
        {"teacher_id": 1, "metric_name": "achievement_local",         "value": 0.0},
    ])


def test_produces_one_row(kpi_df, details_df):
    result = _transform_teacher_kpi(kpi_df, details_df, 2024, 1)
    assert len(result) == 1


def test_maps_scores_and_period(kpi_df, details_df):
    row = _transform_teacher_kpi(kpi_df, details_df, 2024, 1).iloc[0]
    assert row["teaching_score"] == 80.0
    assert row["total_score"] == 68.5
    assert row["year"] == 2024
    assert row["semester"] == 1


def test_maps_raw_metrics(kpi_df, details_df):
    row = _transform_teacher_kpi(kpi_df, details_df, 2024, 1).iloc[0]
    assert row["hours_total"] == 240.0
    assert row["scopus_wos_count"] == 3
    assert row["local_pub_count"] == 5
    assert row["patent_count"] == 2
    assert row["ach_intl"] == 1
    assert row["ach_natl"] == 2
    assert row["ach_local"] == 0


def test_missing_details_defaults_to_zero(kpi_df):
    empty = pd.DataFrame(columns=["teacher_id", "metric_name", "value"])
    row = _transform_teacher_kpi(kpi_df, empty, 2024, 1).iloc[0]
    assert row["hours_total"] == 0.0
    assert row["scopus_wos_count"] == 0
    assert row["ach_intl"] == 0


def test_empty_kpi_returns_empty(details_df):
    empty_kpi = pd.DataFrame(columns=[
        "teacher_id", "teacher_name", "department_name", "position_name",
        "teaching_score", "research_score", "project_score",
        "achievement_score", "total_score",
    ])
    result = _transform_teacher_kpi(empty_kpi, details_df, 2024, 1)
    assert result.empty
```

- [ ] **Step 2: Run tests — verify they fail**

```bash
pytest tests/etl/test_kpi_aggregator.py -v
```

Expected: `ERROR` — `ModuleNotFoundError: No module named 'etl.transformers.kpi_aggregator'`

- [ ] **Step 3: Implement kpi_aggregator.py**

```python
# etl/transformers/kpi_aggregator.py
from __future__ import annotations

from datetime import datetime

import pandas as pd
from sqlalchemy import text
from sqlalchemy.orm import Session

from etl.db import read_df


def _transform_teacher_kpi(
    kpi_df: pd.DataFrame,
    details_df: pd.DataFrame,
    year: int,
    semester: int,
) -> pd.DataFrame:
    """Pure function: join KPI scores with raw metric details into wide rows."""
    if kpi_df.empty:
        return pd.DataFrame()

    if not details_df.empty:
        pivot = details_df.pivot_table(
            index="teacher_id",
            columns="metric_name",
            values="value",
            aggfunc="first",
        ).reset_index()
        merged = kpi_df.merge(pivot, on="teacher_id", how="left")
    else:
        merged = kpi_df.copy()

    def _col(name: str) -> pd.Series:
        return (
            merged[name].fillna(0)
            if name in merged.columns
            else pd.Series(0, index=merged.index)
        )

    now = datetime.utcnow()
    return pd.DataFrame({
        "teacher_id":        merged["teacher_id"].astype(int),
        "teacher_name":      merged["teacher_name"],
        "department_name":   merged["department_name"],
        "position_name":     merged["position_name"],
        "year":              year,
        "semester":          semester,
        "teaching_score":    merged["teaching_score"].fillna(0).astype(float),
        "research_score":    merged["research_score"].fillna(0).astype(float),
        "project_score":     merged["project_score"].fillna(0).astype(float),
        "achievement_score": merged["achievement_score"].fillna(0).astype(float),
        "total_score":       merged["total_score"].fillna(0).astype(float),
        "hours_total":       _col("hours_total").astype(float),
        "scopus_wos_count":  _col("scopus_wos_count").astype(int),
        "local_pub_count":   _col("local_pub_count").astype(int),
        "patent_count":      _col("patent_count").astype(int),
        "project_count":     _col("project_count").astype(int),
        "project_budget":    _col("project_budget").astype(float),
        "ach_intl":          _col("achievement_international").astype(int),
        "ach_natl":          _col("achievement_national").astype(int),
        "ach_local":         _col("achievement_local").astype(int),
        "updated_at":        now,
    })


def build_teacher_kpi(db: Session, year: int, semester: int) -> int:
    """Load from DB, transform, delete-and-insert analytics_teacher_kpi. Returns row count."""
    kpi_df = read_df(db, """
        SELECT ks.teacher_id,
               ks.teaching_score, ks.research_score,
               ks.project_score,  ks.achievement_score, ks.total_score,
               t.full_name  AS teacher_name,
               d.name       AS department_name,
               p.name       AS position_name
        FROM   kpi_scores ks
        JOIN   time_dim td ON ks.time_id    = td.id
        JOIN   teachers t  ON ks.teacher_id = t.id
        LEFT JOIN departments d ON t.department_id = d.id
        LEFT JOIN positions   p ON t.position_id   = p.id
        WHERE  td.year = :year AND td.semester = :semester
    """, {"year": year, "semester": semester})

    details_df = read_df(db, """
        SELECT kd.teacher_id, kd.metric_name, kd.value
        FROM   kpi_details kd
        JOIN   time_dim td ON kd.time_id = td.id
        WHERE  td.year = :year AND td.semester = :semester
    """, {"year": year, "semester": semester})

    rows_df = _transform_teacher_kpi(kpi_df, details_df, year, semester)
    if rows_df.empty:
        return 0

    db.execute(
        text("DELETE FROM analytics_teacher_kpi WHERE year = :y AND semester = :s"),
        {"y": year, "s": semester},
    )
    db.execute(text("""
        INSERT INTO analytics_teacher_kpi (
            teacher_id, teacher_name, department_name, position_name,
            year, semester,
            teaching_score, research_score, project_score, achievement_score, total_score,
            hours_total, scopus_wos_count, local_pub_count, patent_count,
            project_count, project_budget, ach_intl, ach_natl, ach_local, updated_at
        ) VALUES (
            :teacher_id, :teacher_name, :department_name, :position_name,
            :year, :semester,
            :teaching_score, :research_score, :project_score, :achievement_score, :total_score,
            :hours_total, :scopus_wos_count, :local_pub_count, :patent_count,
            :project_count, :project_budget, :ach_intl, :ach_natl, :ach_local, :updated_at
        )
    """), rows_df.to_dict(orient="records"))

    return len(rows_df)
```

- [ ] **Step 4: Run tests — verify they pass**

```bash
pytest tests/etl/test_kpi_aggregator.py -v
```

Expected:
```
test_produces_one_row            PASSED
test_maps_scores_and_period      PASSED
test_maps_raw_metrics            PASSED
test_missing_details_defaults_to_zero PASSED
test_empty_kpi_returns_empty     PASSED
5 passed
```

- [ ] **Step 5: Commit**

```bash
git add etl/transformers/kpi_aggregator.py tests/etl/test_kpi_aggregator.py
git commit -m "feat: add kpi_aggregator transformer with tests"
```

---

## Task 4: analytics_builder.py (TDD)

**Files:**
- Create: `tests/etl/test_analytics_builder.py`
- Create: `etl/transformers/analytics_builder.py`

- [ ] **Step 1: Write the failing tests**

```python
# tests/etl/test_analytics_builder.py
import pandas as pd
import pytest
from etl.transformers.analytics_builder import (
    _transform_dept_summary,
    _transform_rankings,
    _transform_trends,
)


@pytest.fixture
def teacher_kpi():
    return pd.DataFrame([
        {
            "teacher_id": 1, "teacher_name": "Alice",
            "department_id": 1, "department_name": "CS",
            "total_score": 80.0, "teaching_score": 70.0,
            "research_score": 90.0, "project_score": 60.0, "achievement_score": 80.0,
        },
        {
            "teacher_id": 2, "teacher_name": "Bob",
            "department_id": 1, "department_name": "CS",
            "total_score": 60.0, "teaching_score": 50.0,
            "research_score": 70.0, "project_score": 40.0, "achievement_score": 60.0,
        },
        {
            "teacher_id": 3, "teacher_name": "Carol",
            "department_id": 2, "department_name": "Math",
            "total_score": 70.0, "teaching_score": 60.0,
            "research_score": 80.0, "project_score": 50.0, "achievement_score": 70.0,
        },
    ])


# ── dept summary ─────────────────────────────────────────────────────────────

def test_dept_summary_two_departments(teacher_kpi):
    result = _transform_dept_summary(teacher_kpi, 2024, 1)
    assert len(result) == 2


def test_dept_summary_cs_aggregates(teacher_kpi):
    result = _transform_dept_summary(teacher_kpi, 2024, 1)
    cs = result[result["department_id"] == 1].iloc[0]
    assert cs["teacher_count"] == 2
    assert cs["avg_total_score"] == 70.0
    assert cs["max_total_score"] == 80.0
    assert cs["min_total_score"] == 60.0


def test_dept_summary_period_columns(teacher_kpi):
    result = _transform_dept_summary(teacher_kpi, 2024, 2)
    assert (result["year"] == 2024).all()
    assert (result["semester"] == 2).all()


# ── rankings ─────────────────────────────────────────────────────────────────

def test_rankings_overall_order(teacher_kpi):
    result = _transform_rankings(teacher_kpi, 2024, 1)
    alice = result[result["teacher_id"] == 1].iloc[0]
    carol = result[result["teacher_id"] == 3].iloc[0]
    bob   = result[result["teacher_id"] == 2].iloc[0]
    assert alice["rank_overall"] == 1
    assert carol["rank_overall"] == 2
    assert bob["rank_overall"]   == 3


def test_rankings_in_dept(teacher_kpi):
    result = _transform_rankings(teacher_kpi, 2024, 1)
    alice = result[result["teacher_id"] == 1].iloc[0]
    bob   = result[result["teacher_id"] == 2].iloc[0]
    carol = result[result["teacher_id"] == 3].iloc[0]
    assert alice["rank_in_dept"] == 1   # top in CS
    assert bob["rank_in_dept"]   == 2   # second in CS
    assert carol["rank_in_dept"] == 1   # only one in Math


# ── trends ────────────────────────────────────────────────────────────────────

def test_trends_computes_delta():
    curr = pd.DataFrame([{"teacher_id": 1, "teacher_name": "Alice", "total_score": 80.0}])
    prev = pd.DataFrame([{"teacher_id": 1, "total_score": 70.0}])
    row = _transform_trends(curr, prev, 2024, 1).iloc[0]
    assert row["total_score"] == 80.0
    assert row["prev_score"]  == 70.0
    assert row["delta"]       == 10.0


def test_trends_no_previous_period():
    curr = pd.DataFrame([{"teacher_id": 1, "teacher_name": "Alice", "total_score": 80.0}])
    prev = pd.DataFrame(columns=["teacher_id", "total_score"])
    row = _transform_trends(curr, prev, 2024, 1).iloc[0]
    assert row["total_score"] == 80.0
    assert pd.isna(row["prev_score"])
    assert pd.isna(row["delta"])


def test_trends_new_teacher_no_prev():
    curr = pd.DataFrame([
        {"teacher_id": 1, "teacher_name": "Alice", "total_score": 80.0},
        {"teacher_id": 2, "teacher_name": "Bob",   "total_score": 60.0},
    ])
    prev = pd.DataFrame([{"teacher_id": 1, "total_score": 75.0}])
    result = _transform_trends(curr, prev, 2024, 1)
    bob = result[result["teacher_id"] == 2].iloc[0]
    assert pd.isna(bob["prev_score"])
```

- [ ] **Step 2: Run tests — verify they fail**

```bash
pytest tests/etl/test_analytics_builder.py -v
```

Expected: `ERROR` — `ModuleNotFoundError: No module named 'etl.transformers.analytics_builder'`

- [ ] **Step 3: Implement analytics_builder.py**

```python
# etl/transformers/analytics_builder.py
from __future__ import annotations

from datetime import datetime

import pandas as pd
from sqlalchemy import text
from sqlalchemy.orm import Session

from etl.db import read_df


def _transform_dept_summary(df: pd.DataFrame, year: int, semester: int) -> pd.DataFrame:
    """Pure: aggregate teacher rows by department_id."""
    if df.empty:
        return pd.DataFrame()

    df = df.dropna(subset=["department_id"]).copy()
    df["department_id"] = df["department_id"].astype(int)

    grouped = df.groupby(["department_id", "department_name"]).agg(
        teacher_count   =("teacher_id",       "count"),
        avg_total_score =("total_score",       "mean"),
        max_total_score =("total_score",       "max"),
        min_total_score =("total_score",       "min"),
        avg_teaching    =("teaching_score",    "mean"),
        avg_research    =("research_score",    "mean"),
        avg_project     =("project_score",     "mean"),
        avg_achievement =("achievement_score", "mean"),
    ).reset_index()

    r = lambda v: round(float(v), 2)
    now = datetime.utcnow()
    records = [
        {
            "department_id":   int(row["department_id"]),
            "department_name": row["department_name"],
            "year":            year,
            "semester":        semester,
            "teacher_count":   int(row["teacher_count"]),
            "avg_total_score": r(row["avg_total_score"]),
            "max_total_score": r(row["max_total_score"]),
            "min_total_score": r(row["min_total_score"]),
            "avg_teaching":    r(row["avg_teaching"]),
            "avg_research":    r(row["avg_research"]),
            "avg_project":     r(row["avg_project"]),
            "avg_achievement": r(row["avg_achievement"]),
            "updated_at":      now,
        }
        for _, row in grouped.iterrows()
    ]
    return pd.DataFrame(records)


def _transform_rankings(df: pd.DataFrame, year: int, semester: int) -> pd.DataFrame:
    """Pure: compute overall and within-dept rank for each teacher row."""
    if df.empty:
        return pd.DataFrame()

    df = df.copy()
    df["rank_overall"] = (
        df["total_score"].rank(method="min", ascending=False).astype(int)
    )
    df["rank_in_dept"] = (
        df.groupby("department_id")["total_score"]
        .rank(method="min", ascending=False)
        .astype(int)
    )

    now = datetime.utcnow()
    return pd.DataFrame({
        "teacher_id":   df["teacher_id"].astype(int),
        "teacher_name": df["teacher_name"],
        "dept_name":    df["department_name"],
        "year":         year,
        "semester":     semester,
        "rank_overall": df["rank_overall"],
        "rank_in_dept": df["rank_in_dept"],
        "total_score":  df["total_score"].astype(float),
        "updated_at":   now,
    })


def _transform_trends(
    curr: pd.DataFrame,
    prev: pd.DataFrame,
    year: int,
    semester: int,
) -> pd.DataFrame:
    """Pure: compute delta between current and previous period score."""
    if curr.empty:
        return pd.DataFrame()

    if not prev.empty:
        merged = curr.merge(
            prev[["teacher_id", "total_score"]].rename(
                columns={"total_score": "prev_score"}
            ),
            on="teacher_id",
            how="left",
        )
    else:
        merged = curr.copy()
        merged["prev_score"] = float("nan")

    merged["delta"] = merged["total_score"] - merged["prev_score"]

    now = datetime.utcnow()
    return pd.DataFrame({
        "teacher_id":   merged["teacher_id"].astype(int),
        "teacher_name": merged["teacher_name"],
        "year":         year,
        "semester":     semester,
        "total_score":  merged["total_score"].astype(float),
        "prev_score":   merged["prev_score"],
        "delta":        merged["delta"],
        "updated_at":   now,
    })


# ── DB-level builders ─────────────────────────────────────────────────────────

def build_dept_summary(db: Session, year: int, semester: int) -> int:
    df = read_df(db, """
        SELECT atk.teacher_id, t.department_id, d.name AS department_name,
               atk.total_score,       atk.teaching_score,
               atk.research_score,    atk.project_score,
               atk.achievement_score
        FROM   analytics_teacher_kpi atk
        JOIN   teachers t    ON atk.teacher_id    = t.id
        LEFT JOIN departments d ON t.department_id = d.id
        WHERE  atk.year = :year AND atk.semester = :semester
    """, {"year": year, "semester": semester})

    summary = _transform_dept_summary(df, year, semester)
    if summary.empty:
        return 0

    db.execute(
        text("DELETE FROM analytics_dept_summary WHERE year = :y AND semester = :s"),
        {"y": year, "s": semester},
    )
    db.execute(text("""
        INSERT INTO analytics_dept_summary (
            department_id, department_name, year, semester,
            teacher_count, avg_total_score, max_total_score, min_total_score,
            avg_teaching, avg_research, avg_project, avg_achievement, updated_at
        ) VALUES (
            :department_id, :department_name, :year, :semester,
            :teacher_count, :avg_total_score, :max_total_score, :min_total_score,
            :avg_teaching, :avg_research, :avg_project, :avg_achievement, :updated_at
        )
    """), summary.to_dict(orient="records"))
    return len(summary)


def build_rankings(db: Session, year: int, semester: int) -> int:
    df = read_df(db, """
        SELECT atk.teacher_id, atk.teacher_name, atk.department_name,
               t.department_id,  atk.total_score
        FROM   analytics_teacher_kpi atk
        JOIN   teachers t ON atk.teacher_id = t.id
        WHERE  atk.year = :year AND atk.semester = :semester
    """, {"year": year, "semester": semester})

    rankings = _transform_rankings(df, year, semester)
    if rankings.empty:
        return 0

    db.execute(
        text("DELETE FROM analytics_rankings WHERE year = :y AND semester = :s"),
        {"y": year, "s": semester},
    )
    db.execute(text("""
        INSERT INTO analytics_rankings (
            teacher_id, teacher_name, dept_name, year, semester,
            rank_overall, rank_in_dept, total_score, updated_at
        ) VALUES (
            :teacher_id, :teacher_name, :dept_name, :year, :semester,
            :rank_overall, :rank_in_dept, :total_score, :updated_at
        )
    """), rankings.to_dict(orient="records"))
    return len(rankings)


def build_trends(db: Session, year: int, semester: int) -> int:
    curr = read_df(db, """
        SELECT teacher_id, teacher_name, total_score
        FROM   analytics_teacher_kpi
        WHERE  year = :year AND semester = :semester
    """, {"year": year, "semester": semester})

    prev_year = year - 1 if semester == 1 else year
    prev_sem  = 2        if semester == 1 else 1

    prev = read_df(db, """
        SELECT teacher_id, total_score
        FROM   analytics_teacher_kpi
        WHERE  year = :year AND semester = :semester
    """, {"year": prev_year, "semester": prev_sem})

    trends = _transform_trends(curr, prev, year, semester)
    if trends.empty:
        return 0

    db.execute(
        text("DELETE FROM analytics_trends WHERE year = :y AND semester = :s"),
        {"y": year, "s": semester},
    )
    db.execute(text("""
        INSERT INTO analytics_trends (
            teacher_id, teacher_name, year, semester,
            total_score, prev_score, delta, updated_at
        ) VALUES (
            :teacher_id, :teacher_name, :year, :semester,
            :total_score, :prev_score, :delta, :updated_at
        )
    """), trends.to_dict(orient="records"))
    return len(trends)
```

- [ ] **Step 4: Run tests — verify they pass**

```bash
pytest tests/etl/test_analytics_builder.py -v
```

Expected:
```
test_dept_summary_two_departments   PASSED
test_dept_summary_cs_aggregates     PASSED
test_dept_summary_period_columns    PASSED
test_rankings_overall_order         PASSED
test_rankings_in_dept               PASSED
test_trends_computes_delta          PASSED
test_trends_no_previous_period      PASSED
test_trends_new_teacher_no_prev     PASSED
8 passed
```

- [ ] **Step 5: Run all tests to confirm no regressions**

```bash
pytest tests/etl/ -v
```

Expected: `13 passed`

- [ ] **Step 6: Commit**

```bash
git add etl/transformers/analytics_builder.py tests/etl/test_analytics_builder.py
git commit -m "feat: add analytics_builder transformer with tests"
```

---

## Task 5: Exporters (CSV + Excel)

**Files:**
- Create: `etl/exporters/csv_exporter.py`
- Create: `etl/exporters/excel_exporter.py`

- [ ] **Step 1: Create csv_exporter.py**

```python
# etl/exporters/csv_exporter.py
from __future__ import annotations
import os

import pandas as pd
from sqlalchemy import text
from sqlalchemy.engine import Engine


def export_csvs(engine: Engine, year: int, semester: int) -> str:
    """Write 5 flat CSV files to etl/exports/{year}_S{semester}/. Returns output dir."""
    out_dir = os.path.join("etl", "exports", f"{year}_S{semester}")
    os.makedirs(out_dir, exist_ok=True)

    queries: dict[str, str] = {
        "kpi_scores": f"""
            SELECT * FROM analytics_teacher_kpi
            WHERE year = {year} AND semester = {semester}
        """,
        "departments": f"""
            SELECT * FROM analytics_dept_summary
            WHERE year = {year} AND semester = {semester}
        """,
        "rankings": f"""
            SELECT * FROM analytics_rankings
            WHERE year = {year} AND semester = {semester}
        """,
        "trends": f"""
            SELECT * FROM analytics_trends
            WHERE year = {year} AND semester = {semester}
        """,
        "teachers": """
            SELECT t.id, t.full_name, t.email,
                   d.name  AS department,
                   p.name  AS position,
                   dg.name AS degree
            FROM   teachers t
            LEFT JOIN departments d  ON t.department_id = d.id
            LEFT JOIN positions   p  ON t.position_id   = p.id
            LEFT JOIN degrees     dg ON t.degree_id     = dg.id
        """,
    }

    with engine.connect() as conn:
        for name, sql in queries.items():
            df = pd.read_sql_query(text(sql), conn)
            df.to_csv(os.path.join(out_dir, f"{name}.csv"), index=False)

    return out_dir
```

- [ ] **Step 2: Create excel_exporter.py**

```python
# etl/exporters/excel_exporter.py
from __future__ import annotations
import os

import pandas as pd
from sqlalchemy import text
from sqlalchemy.engine import Engine


def export_excel(engine: Engine, year: int, semester: int) -> str:
    """Write a multi-sheet Excel workbook. Returns the file path."""
    out_dir = os.path.join("etl", "exports", f"{year}_S{semester}")
    os.makedirs(out_dir, exist_ok=True)
    out_path = os.path.join(out_dir, f"report_{year}_S{semester}.xlsx")

    sheets: dict[str, str] = {
        "KPI Scores": f"""
            SELECT * FROM analytics_teacher_kpi
            WHERE year = {year} AND semester = {semester}
        """,
        "Department Summary": f"""
            SELECT * FROM analytics_dept_summary
            WHERE year = {year} AND semester = {semester}
        """,
        "Rankings": f"""
            SELECT * FROM analytics_rankings
            WHERE year = {year} AND semester = {semester}
        """,
        "Trends": f"""
            SELECT * FROM analytics_trends
            WHERE year = {year} AND semester = {semester}
        """,
        "Teacher Details": """
            SELECT t.id, t.full_name, t.email,
                   d.name  AS department,
                   p.name  AS position,
                   dg.name AS degree
            FROM   teachers t
            LEFT JOIN departments d  ON t.department_id = d.id
            LEFT JOIN positions   p  ON t.position_id   = p.id
            LEFT JOIN degrees     dg ON t.degree_id     = dg.id
        """,
    }

    with engine.connect() as conn:
        with pd.ExcelWriter(out_path, engine="openpyxl") as writer:
            for sheet_name, sql in sheets.items():
                df = pd.read_sql_query(text(sql), conn)
                df.to_excel(writer, sheet_name=sheet_name, index=False)

    return out_path
```

- [ ] **Step 3: Verify imports**

```bash
python -c "from etl.exporters.csv_exporter import export_csvs; from etl.exporters.excel_exporter import export_excel; print('ok')"
```

Expected: `ok`

- [ ] **Step 4: Commit**

```bash
git add etl/exporters/csv_exporter.py etl/exporters/excel_exporter.py
git commit -m "feat: add CSV and Excel exporters"
```

---

## Task 6: pipeline.py (CLI Orchestrator)

**Files:**
- Create: `etl/pipeline.py`

- [ ] **Step 1: Create pipeline.py**

```python
# etl/pipeline.py
from __future__ import annotations

import argparse
import os
import sys
from datetime import datetime

# Allow importing backend/services without installing the backend as a package
_BACKEND_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "backend")
if _BACKEND_DIR not in sys.path:
    sys.path.insert(0, _BACKEND_DIR)

from sqlalchemy import text  # noqa: E402 — after sys.path patch

from etl.db import SessionLocal, engine  # noqa: E402
from etl.exporters.csv_exporter import export_csvs  # noqa: E402
from etl.exporters.excel_exporter import export_excel  # noqa: E402
from etl.transformers.analytics_builder import (  # noqa: E402
    build_dept_summary,
    build_rankings,
    build_trends,
)
from etl.transformers.kpi_aggregator import build_teacher_kpi  # noqa: E402


def _current_period() -> tuple[int, int]:
    now = datetime.now()
    semester = 1 if now.month >= 9 else 2
    return now.year, semester


def run_etl(year: int, semester: int, trigger: str = "cli") -> dict:
    """
    Full ETL run for *year* / *semester*.

    Steps
    -----
    1. Refresh kpi_scores + kpi_details via kpi_engine (own commit).
    2–4. Build analytics tables in a single transaction.
    5–6. Export CSV + Excel (outside transaction).
    """
    from services.kpi_engine import calculate_kpi  # backend import after sys.path patch

    db = SessionLocal()
    run_id: int | None = None

    try:
        # Record run start
        row = db.execute(text("""
            INSERT INTO etl_runs (year, semester, trigger, started_at, status)
            VALUES (:year, :semester, :trigger, NOW(), 'running')
            RETURNING id
        """), {"year": year, "semester": semester, "trigger": trigger})
        db.commit()
        run_id = row.scalar()

        # Step 1 — KPI scores (commits internally)
        calculate_kpi(year, semester, db)

        # Steps 2–4 — analytics tables (one transaction)
        n_t  = build_teacher_kpi(db, year, semester)
        n_d  = build_dept_summary(db, year, semester)
        n_r  = build_rankings(db, year, semester)
        n_tr = build_trends(db, year, semester)
        db.commit()

        # Steps 5–6 — exports (after commit, failure doesn't rollback DB)
        csv_dir = export_csvs(engine, year, semester)
        xlsx    = export_excel(engine, year, semester)

        # Mark done
        db.execute(text("""
            UPDATE etl_runs SET status = 'done', finished_at = NOW()
            WHERE id = :id
        """), {"id": run_id})
        db.commit()

        return {
            "status":       "done",
            "run_id":       run_id,
            "teacher_rows": n_t,
            "dept_rows":    n_d,
            "rank_rows":    n_r,
            "trend_rows":   n_tr,
            "csv_dir":      csv_dir,
            "xlsx":         xlsx,
        }

    except Exception as exc:
        db.rollback()
        if run_id:
            db.execute(text("""
                UPDATE etl_runs
                SET status = 'error', finished_at = NOW(), error_message = :msg
                WHERE id = :id
            """), {"id": run_id, "msg": str(exc)})
            db.commit()
        raise

    finally:
        db.close()


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="University Analytics ETL")
    parser.add_argument("--year",     type=int, help="Academic year (default: auto-detect)")
    parser.add_argument("--semester", type=int, choices=[1, 2],
                        help="Semester 1 or 2 (default: auto-detect)")
    args = parser.parse_args()

    year, semester = args.year, args.semester
    if not year or not semester:
        year, semester = _current_period()

    print(f"[ETL] Running for {year} semester {semester}...")
    try:
        result = run_etl(year, semester, trigger="cli")
        print(f"[ETL] Done: {result}")
        sys.exit(0)
    except Exception as e:
        print(f"[ETL] Failed: {e}", file=sys.stderr)
        sys.exit(1)
```

- [ ] **Step 2: Smoke test — import check**

```bash
python -c "from etl.pipeline import run_etl, _current_period; print(_current_period())"
```

Expected: `(2026, 1)` (or whatever the current auto-detected period is)

- [ ] **Step 3: End-to-end CLI test against real DB**

Make sure kpi_scores already has data for 2024 semester 1 (run KPI recalculate from the UI first, or seed.sql already has data for time_id 3 = 2024 S1).

```bash
python etl/pipeline.py --year 2024 --semester 1
```

Expected output:
```
[ETL] Running for 2024 semester 1...
[ETL] Done: {'status': 'done', 'run_id': 1, 'teacher_rows': 5, 'dept_rows': 2, 'rank_rows': 5, 'trend_rows': 5, 'csv_dir': 'etl/exports/2024_S1', 'xlsx': 'etl/exports/2024_S1/report_2024_S1.xlsx'}
```

Verify files exist:
```bash
ls etl/exports/2024_S1/
```

Expected:
```
departments.csv  kpi_scores.csv  rankings.csv  report_2024_S1.xlsx  teachers.csv  trends.csv
```

- [ ] **Step 4: Commit**

```bash
git add etl/pipeline.py etl/exports/.gitkeep
git commit -m "feat: add ETL pipeline CLI orchestrator"
```

---

## Task 7: FastAPI ETL Router

**Files:**
- Create: `backend/routers/etl.py`
- Modify: `backend/main.py`

- [ ] **Step 1: Create backend/routers/etl.py**

```python
# backend/routers/etl.py
from __future__ import annotations

import os
import sys
from typing import Any

from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException
from sqlalchemy import text
from sqlalchemy.orm import Session

from auth.jwt import get_current_user, require_admin
from database import get_db

# Allow etl/ package import from the backend process
_REPO_ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "..")
if _REPO_ROOT not in sys.path:
    sys.path.insert(0, _REPO_ROOT)

router = APIRouter(prefix="/etl", tags=["etl"])


def _run_in_background(year: int, semester: int) -> None:
    try:
        from etl.pipeline import run_etl
        run_etl(year, semester, trigger="api")
    except Exception:
        pass  # error already written to etl_runs by run_etl


@router.post("/run")
def trigger_etl(
    year: int,
    semester: int,
    background_tasks: BackgroundTasks,
    _: Any = Depends(require_admin),
) -> dict:
    if semester not in (1, 2):
        raise HTTPException(status_code=400, detail="semester must be 1 or 2")
    background_tasks.add_task(_run_in_background, year, semester)
    return {"status": "queued", "year": year, "semester": semester}


@router.get("/status")
def etl_status(
    db: Session = Depends(get_db),
    _: Any = Depends(get_current_user),
) -> dict:
    row = db.execute(text("""
        SELECT id, year, semester, trigger,
               started_at, finished_at, status, error_message
        FROM   etl_runs
        ORDER BY started_at DESC
        LIMIT 1
    """)).mappings().first()
    if not row:
        return {"status": "never_run"}
    return dict(row)
```

- [ ] **Step 2: Register the router in main.py**

In `backend/main.py`, add `etl` to the imports and register the router. The final import block:

```python
from routers import (
    auth, positions, degrees, departments, time_dim,
    teachers, subjects, groups,
    teaching_load, publications, patents, achievements, projects,
    kpi, kpi_settings, students, import_data, etl,
)
```

And add after `app.include_router(import_data.router)`:

```python
app.include_router(etl.router)
```

- [ ] **Step 3: Restart backend and verify endpoints appear**

```bash
cd backend && uvicorn main:app --reload --port 8000
```

Open `http://localhost:8000/docs` and confirm `POST /etl/run` and `GET /etl/status` appear under the **etl** section.

- [ ] **Step 4: Test status endpoint (no auth required to test quickly)**

```bash
curl -s http://localhost:8000/etl/status \
  -H "Authorization: Bearer <admin_token>"
```

Expected (first time): `{"status": "never_run"}` or the last run record.

- [ ] **Step 5: Commit**

```bash
git add backend/routers/etl.py backend/main.py
git commit -m "feat: add ETL FastAPI router with /etl/run and /etl/status"
```

---

## Task 8: APScheduler Nightly Job

**Files:**
- Create: `backend/scheduler.py`
- Modify: `backend/main.py`

- [ ] **Step 1: Create backend/scheduler.py**

```python
# backend/scheduler.py
from __future__ import annotations

import os
import sys
from datetime import datetime

from apscheduler.schedulers.background import BackgroundScheduler

_REPO_ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..")
if _REPO_ROOT not in sys.path:
    sys.path.insert(0, _REPO_ROOT)


def _detect_period() -> tuple[int, int]:
    now = datetime.now()
    semester = 1 if now.month >= 9 else 2
    return now.year, semester


def _nightly_etl() -> None:
    year, semester = _detect_period()
    print(f"[scheduler] Starting nightly ETL for {year} semester {semester}")
    try:
        from etl.pipeline import run_etl
        result = run_etl(year, semester, trigger="scheduler")
        print(f"[scheduler] ETL done: {result}")
    except Exception as exc:
        print(f"[scheduler] ETL failed: {exc}")


def create_scheduler() -> BackgroundScheduler:
    """Create and configure the APScheduler. Caller must call .start()."""
    scheduler = BackgroundScheduler()
    scheduler.add_job(_nightly_etl, "cron", hour=2, minute=0, id="nightly_etl")
    return scheduler
```

- [ ] **Step 2: Add lifespan to main.py**

Replace the current `app = FastAPI(...)` block and add a lifespan context manager. The full updated top of `backend/main.py`:

```python
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from routers import (
    auth, positions, degrees, departments, time_dim,
    teachers, subjects, groups,
    teaching_load, publications, patents, achievements, projects,
    kpi, kpi_settings, students, import_data, etl,
)
from database import engine, Base
from scheduler import create_scheduler
import models

Base.metadata.create_all(bind=engine)


@asynccontextmanager
async def lifespan(app: FastAPI):
    scheduler = create_scheduler()
    scheduler.start()
    print("[scheduler] APScheduler started — nightly ETL at 02:00")
    yield
    scheduler.shutdown(wait=False)
    print("[scheduler] APScheduler stopped")


app = FastAPI(title="University Analytics API", version="1.0.0", lifespan=lifespan)
```

Keep the rest of `main.py` (CORS middleware, `include_router` calls, `/health` endpoint) unchanged.

- [ ] **Step 3: Restart backend and verify scheduler starts**

```bash
cd backend && uvicorn main:app --reload --port 8000
```

Expected log line among startup output:
```
[scheduler] APScheduler started — nightly ETL at 02:00
```

- [ ] **Step 4: Verify no import errors**

```bash
curl -s http://localhost:8000/health
```

Expected: `{"status": "ok"}`

- [ ] **Step 5: Run all unit tests to confirm nothing broken**

```bash
pytest tests/etl/ -v
```

Expected: `13 passed`

- [ ] **Step 6: Commit**

```bash
git add backend/scheduler.py backend/main.py
git commit -m "feat: add APScheduler nightly ETL job via FastAPI lifespan"
```

---

## Self-Review Checklist

### Spec coverage
| Spec requirement | Task |
|-----------------|------|
| 5 new analytics tables | Task 1 |
| APScheduler dependency | Task 1 |
| etl/db.py with engine + read_df | Task 2 |
| kpi_aggregator: `_transform_teacher_kpi` (pure) | Task 3 |
| kpi_aggregator: `build_teacher_kpi` (DB) | Task 3 |
| analytics_builder: dept summary, rankings, trends (pure + DB) | Task 4 |
| csv_exporter: 5 CSV files | Task 5 |
| excel_exporter: 5-sheet workbook | Task 5 |
| pipeline.py CLI `--year --semester` | Task 6 |
| pipeline.py `run_etl()` shared function | Task 6 |
| `etl_runs` tracking table | Task 1 + Task 6 |
| DB transaction strategy (KPI own commit, analytics single tx, exports outside tx) | Task 6 |
| `POST /etl/run` admin endpoint | Task 7 |
| `GET /etl/status` endpoint | Task 7 |
| APScheduler nightly at 02:00 | Task 8 |
| Lifespan startup/shutdown | Task 8 |

### No placeholders found ✓
### Type consistency
- `run_etl()` defined in Task 6, called from Task 7 (`_run_in_background`) and Task 8 (`_nightly_etl`) ✓
- `build_teacher_kpi(db, year, semester)` defined Task 3, called Task 6 ✓
- `build_dept_summary / build_rankings / build_trends` defined Task 4, called Task 6 ✓
- `export_csvs(engine, year, semester)` defined Task 5, called Task 6 ✓
- `export_excel(engine, year, semester)` defined Task 5, called Task 6 ✓
- `read_df(db, sql, params)` defined Task 2, used Task 3 + Task 4 ✓
