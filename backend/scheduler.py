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
