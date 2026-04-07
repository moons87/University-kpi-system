from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import List

from database import get_db
from models import Degree
from schemas.degree import DegreeCreate, DegreeOut
from auth.jwt import get_current_user

router = APIRouter(prefix="/degrees", tags=["degrees"])


@router.get("/", response_model=List[DegreeOut])
def list_degrees(db: Session = Depends(get_db), _=Depends(get_current_user)):
    return db.query(Degree).all()


@router.post("/", response_model=DegreeOut)
def create_degree(body: DegreeCreate, db: Session = Depends(get_db), _=Depends(get_current_user)):
    obj = Degree(**body.model_dump())
    db.add(obj)
    db.commit()
    db.refresh(obj)
    return obj
