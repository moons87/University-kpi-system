from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional

from database import get_db
from models import TeachingLoad, User
from schemas.teaching_load import TeachingLoadCreate, TeachingLoadOut
from auth.jwt import get_current_user

router = APIRouter(prefix="/teaching-load", tags=["teaching_load"])


@router.get("/", response_model=List[TeachingLoadOut])
def list_teaching_load(
    teacher_id: Optional[int] = None,
    time_id:    Optional[int] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    q = db.query(TeachingLoad)
    if current_user.role != "admin":
        teacher_id = current_user.teacher_id
    if teacher_id: q = q.filter(TeachingLoad.teacher_id == teacher_id)
    if time_id:    q = q.filter(TeachingLoad.time_id    == time_id)
    return q.all()


@router.post("/", response_model=TeachingLoadOut)
def create_teaching_load(body: TeachingLoadCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    data = body.model_dump()
    if current_user.role != "admin":
        data["teacher_id"] = current_user.teacher_id
    obj = TeachingLoad(**data)
    db.add(obj); db.commit(); db.refresh(obj)
    return obj


@router.put("/{item_id}", response_model=TeachingLoadOut)
def update_teaching_load(item_id: int, body: TeachingLoadCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    obj = db.get(TeachingLoad, item_id)
    if not obj: raise HTTPException(404, "Not found")
    if current_user.role != "admin" and obj.teacher_id != current_user.teacher_id:
        raise HTTPException(403, "Not authorized to modify this record")
    data = body.model_dump()
    if current_user.role != "admin":
        data["teacher_id"] = current_user.teacher_id
    for k, v in data.items(): setattr(obj, k, v)
    db.commit(); db.refresh(obj)
    return obj


@router.delete("/{item_id}", status_code=204)
def delete_teaching_load(item_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    obj = db.get(TeachingLoad, item_id)
    if not obj: raise HTTPException(404, "Not found")
    if current_user.role != "admin" and obj.teacher_id != current_user.teacher_id:
        raise HTTPException(403, "Not authorized to delete this record")
    db.delete(obj); db.commit()
