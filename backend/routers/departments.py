from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import List

from database import get_db
from models import Department
from schemas.department import DepartmentCreate, DepartmentOut
from auth.jwt import get_current_user

router = APIRouter(prefix="/departments", tags=["departments"])


@router.get("/", response_model=List[DepartmentOut])
def list_departments(db: Session = Depends(get_db), _=Depends(get_current_user)):
    return db.query(Department).all()


@router.post("/", response_model=DepartmentOut)
def create_department(body: DepartmentCreate, db: Session = Depends(get_db), _=Depends(get_current_user)):
    obj = Department(**body.model_dump())
    db.add(obj)
    db.commit()
    db.refresh(obj)
    return obj
