from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional

from database import get_db
from models import Patent
from schemas.patent import PatentCreate, PatentOut
from auth.jwt import get_current_user

router = APIRouter(prefix="/patents", tags=["patents"])


@router.get("/", response_model=List[PatentOut])
def list_patents(
    teacher_id: Optional[int] = None,
    time_id:    Optional[int] = None,
    db: Session = Depends(get_db),
    _=Depends(get_current_user),
):
    q = db.query(Patent)
    if teacher_id: q = q.filter(Patent.teacher_id == teacher_id)
    if time_id:    q = q.filter(Patent.time_id    == time_id)
    return q.all()


@router.post("/", response_model=PatentOut)
def create_patent(body: PatentCreate, db: Session = Depends(get_db), _=Depends(get_current_user)):
    obj = Patent(**body.model_dump())
    db.add(obj); db.commit(); db.refresh(obj)
    return obj


@router.put("/{item_id}", response_model=PatentOut)
def update_patent(item_id: int, body: PatentCreate, db: Session = Depends(get_db), _=Depends(get_current_user)):
    obj = db.get(Patent, item_id)
    if not obj: raise HTTPException(404, "Not found")
    for k, v in body.model_dump().items(): setattr(obj, k, v)
    db.commit(); db.refresh(obj)
    return obj


@router.delete("/{item_id}", status_code=204)
def delete_patent(item_id: int, db: Session = Depends(get_db), _=Depends(get_current_user)):
    obj = db.get(Patent, item_id)
    if not obj: raise HTTPException(404, "Not found")
    db.delete(obj); db.commit()
