from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import List

from database import get_db
from models import TimeDim
from schemas.time_dim import TimeDimCreate, TimeDimOut
from auth.jwt import get_current_user, require_admin

router = APIRouter(prefix="/time-dim", tags=["time_dim"])


@router.get("/", response_model=List[TimeDimOut])
def list_time_dim(db: Session = Depends(get_db), _=Depends(get_current_user)):
    return db.query(TimeDim).order_by(TimeDim.year, TimeDim.semester).all()


@router.post("/", response_model=TimeDimOut)
def create_time_dim(body: TimeDimCreate, db: Session = Depends(get_db), _=Depends(require_admin)):
    obj = TimeDim(**body.model_dump())
    db.add(obj)
    db.commit()
    db.refresh(obj)
    return obj
