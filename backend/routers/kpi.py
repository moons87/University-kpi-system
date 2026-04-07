from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional

from database import get_db
from models import KPIScore, KPIDetail, Teacher, TimeDim
from schemas.kpi import KPIScoreOut, KPIDetailOut, KPISummaryOut, KPISummaryItem
from auth.jwt import get_current_user
from services.kpi_engine import calculate_kpi

router = APIRouter(prefix="/kpi", tags=["kpi"])


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
    year:     int = Query(...),
    semester: int = Query(...),
    db: Session = Depends(get_db),
    _=Depends(get_current_user),
):
    try:
        result = calculate_kpi(year, semester, db)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    return result


@router.get("/summary", response_model=KPISummaryOut)
def kpi_summary(
    time_id: int = Query(...),
    db: Session = Depends(get_db),
    _=Depends(get_current_user),
):
    time_obj = db.get(TimeDim, time_id)
    if not time_obj:
        raise HTTPException(404, "TimeDim not found")

    scores = db.query(KPIScore).filter(KPIScore.time_id == time_id).all()
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
