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
