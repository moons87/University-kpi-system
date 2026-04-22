from __future__ import annotations

import argparse
import os
import sys
from datetime import datetime

# When run as a script (python etl/pipeline.py), Python adds etl/ to sys.path
# instead of the repo root. Add repo root explicitly so `etl.*` imports work.
_REPO_ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..")
if _REPO_ROOT not in sys.path:
    sys.path.insert(0, _REPO_ROOT)

_BACKEND_DIR = os.path.join(_REPO_ROOT, "backend")
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
    2-4. Build analytics tables in a single transaction.
    5-6. Export CSV + Excel (outside transaction).
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

        # Steps 2-4 — analytics tables (one transaction)
        n_t  = build_teacher_kpi(db, year, semester)
        n_d  = build_dept_summary(db, year, semester)
        n_r  = build_rankings(db, year, semester)
        n_tr = build_trends(db, year, semester)
        db.commit()

        # Steps 5-6 — exports (after commit, failure doesn't rollback DB)
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
