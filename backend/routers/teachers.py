from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session, joinedload
from typing import List, Optional

from database import get_db
from models import Teacher
from schemas.teacher import TeacherCreate, TeacherOut, TeacherDetail
from auth.jwt import get_current_user

router = APIRouter(prefix="/teachers", tags=["teachers"])


@router.get("/", response_model=List[TeacherOut])
def list_teachers(
    department_id: Optional[int] = None,
    db: Session = Depends(get_db),
    _=Depends(get_current_user),
):
    q = db.query(Teacher)
    if department_id:
        q = q.filter(Teacher.department_id == department_id)
    return q.all()


@router.post("/", response_model=TeacherOut)
def create_teacher(body: TeacherCreate, db: Session = Depends(get_db), _=Depends(get_current_user)):
    obj = Teacher(**body.model_dump())
    db.add(obj)
    db.commit()
    db.refresh(obj)
    return obj


@router.get("/{teacher_id}", response_model=TeacherDetail)
def get_teacher(teacher_id: int, db: Session = Depends(get_db), _=Depends(get_current_user)):
    obj = (
        db.query(Teacher)
        .options(joinedload(Teacher.position), joinedload(Teacher.degree), joinedload(Teacher.department))
        .filter(Teacher.id == teacher_id)
        .first()
    )
    if not obj:
        raise HTTPException(status_code=404, detail="Teacher not found")
    return obj


@router.put("/{teacher_id}", response_model=TeacherOut)
def update_teacher(teacher_id: int, body: TeacherCreate, db: Session = Depends(get_db), _=Depends(get_current_user)):
    obj = db.get(Teacher, teacher_id)
    if not obj:
        raise HTTPException(status_code=404, detail="Teacher not found")
    for k, v in body.model_dump().items():
        setattr(obj, k, v)
    db.commit()
    db.refresh(obj)
    return obj
