from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import List

from database import get_db
from models import Subject
from schemas.subject import SubjectCreate, SubjectOut
from auth.jwt import get_current_user, require_admin

router = APIRouter(prefix="/subjects", tags=["subjects"])


@router.get("/", response_model=List[SubjectOut])
def list_subjects(db: Session = Depends(get_db), _=Depends(get_current_user)):
    return db.query(Subject).all()


@router.post("/", response_model=SubjectOut)
def create_subject(
    body: SubjectCreate,
    db: Session = Depends(get_db),
    _=Depends(require_admin),
):
    obj = Subject(**body.model_dump())
    db.add(obj)
    db.commit()
    db.refresh(obj)
    return obj
