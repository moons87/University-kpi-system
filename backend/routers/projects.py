from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional

from database import get_db
from models import Project
from schemas.project import ProjectCreate, ProjectOut
from auth.jwt import get_current_user

router = APIRouter(prefix="/projects", tags=["projects"])


@router.get("/", response_model=List[ProjectOut])
def list_projects(
    teacher_id: Optional[int] = None,
    time_id:    Optional[int] = None,
    db: Session = Depends(get_db),
    _=Depends(get_current_user),
):
    q = db.query(Project)
    if teacher_id: q = q.filter(Project.teacher_id == teacher_id)
    if time_id:    q = q.filter(Project.time_id    == time_id)
    return q.all()


@router.post("/", response_model=ProjectOut)
def create_project(body: ProjectCreate, db: Session = Depends(get_db), _=Depends(get_current_user)):
    obj = Project(**body.model_dump())
    db.add(obj); db.commit(); db.refresh(obj)
    return obj


@router.put("/{item_id}", response_model=ProjectOut)
def update_project(item_id: int, body: ProjectCreate, db: Session = Depends(get_db), _=Depends(get_current_user)):
    obj = db.get(Project, item_id)
    if not obj: raise HTTPException(404, "Not found")
    for k, v in body.model_dump().items(): setattr(obj, k, v)
    db.commit(); db.refresh(obj)
    return obj


@router.delete("/{item_id}", status_code=204)
def delete_project(item_id: int, db: Session = Depends(get_db), _=Depends(get_current_user)):
    obj = db.get(Project, item_id)
    if not obj: raise HTTPException(404, "Not found")
    db.delete(obj); db.commit()
