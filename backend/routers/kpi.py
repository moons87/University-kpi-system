from fastapi import APIRouter, Depends, HTTPException, Query, BackgroundTasks
from sqlalchemy.orm import Session
from typing import List, Optional
import uuid
import datetime

from database import get_db, SessionLocal
from models import KPIScore, KPIDetail, Teacher, TimeDim, User
from schemas.kpi import KPIScoreOut, KPIDetailOut, KPISummaryOut, KPISummaryItem
from auth.jwt import get_current_user
from services.kpi_engine import calculate_kpi

router = APIRouter(prefix="/kpi", tags=["kpi"])

# ── In-memory job tracker ──────────────────────────────────────────────────────
# Dict: job_id -> { status, started_at, finished_at, result, error }
_jobs: dict[str, dict] = {}


def _run_calculation(job_id: str, year: int, semester: int):
    """Background task — gets its own DB session."""
    _jobs[job_id]["status"] = "running"
    db = SessionLocal()
    try:
        result = calculate_kpi(year, semester, db)
        _jobs[job_id]["status"]      = "done"
        _jobs[job_id]["result"]      = result
        _jobs[job_id]["finished_at"] = datetime.datetime.utcnow().isoformat()
    except Exception as e:
        _jobs[job_id]["status"]      = "error"
        _jobs[job_id]["error"]       = str(e)
        _jobs[job_id]["finished_at"] = datetime.datetime.utcnow().isoformat()
    finally:
        db.close()


# ──────────────────────────────────────────────────────────────────────────────

@router.get("/scores", response_model=List[KPIScoreOut])
def list_kpi_scores(
    teacher_id: Optional[int] = None,
    time_id:    Optional[int] = None,
    db: Session = Depends(get_db),
    _=Depends(get_current_user),
):
    q = db.query(KPIScore)
    if teacher_id: q = q.filter(KPIScore.teacher_id == teacher_id)
    if time_id:    q = q.filter(KPIScore.time_id    == time_id)
    return q.all()


@router.get("/details", response_model=List[KPIDetailOut])
def list_kpi_details(
    teacher_id: Optional[int] = None,
    time_id:    Optional[int] = None,
    category:   Optional[str] = None,
    db: Session = Depends(get_db),
    _=Depends(get_current_user),
):
    q = db.query(KPIDetail)
    if teacher_id: q = q.filter(KPIDetail.teacher_id == teacher_id)
    if time_id:    q = q.filter(KPIDetail.time_id    == time_id)
    if category:   q = q.filter(KPIDetail.category   == category)
    return q.all()


@router.post("/calculate")
def trigger_calculate(
    background_tasks: BackgroundTasks,
    year:     int = Query(...),
    semester: int = Query(...),
    current_user: User = Depends(get_current_user),
):
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Not authorized to recalculate KPI")

    job_id = str(uuid.uuid4())
    _jobs[job_id] = {
        "status":      "queued",
        "started_at":  datetime.datetime.utcnow().isoformat(),
        "finished_at": None,
        "result":      None,
        "error":       None,
        "year":        year,
        "semester":    semester,
    }

    background_tasks.add_task(_run_calculation, job_id, year, semester)
    return {"job_id": job_id, "status": "queued"}


@router.get("/calculate/status/{job_id}")
def get_job_status(job_id: str, _=Depends(get_current_user)):
    job = _jobs.get(job_id)
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    return job


@router.get("/summary", response_model=KPISummaryOut)
def kpi_summary(
    time_id: int = Query(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Not authorized to view reports")

    time_obj = db.get(TimeDim, time_id)
    if not time_obj:
        raise HTTPException(404, "TimeDim not found")

    scores   = db.query(KPIScore).filter(KPIScore.time_id == time_id).all()
    teachers = {t.id: t.full_name for t in db.query(Teacher).all()}

    items = [
        KPISummaryItem(
            teacher_id=s.teacher_id,
            teacher_name=teachers.get(s.teacher_id, "Unknown"),
            total_score=s.total_score,
        )
        for s in sorted(scores, key=lambda x: x.total_score or 0, reverse=True)
    ]

    return KPISummaryOut(time_id=time_id, year=time_obj.year, semester=time_obj.semester, teachers=items)
