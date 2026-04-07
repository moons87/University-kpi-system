from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import List

from database import get_db
from models import Position
from schemas.position import PositionCreate, PositionOut
from auth.jwt import get_current_user

router = APIRouter(prefix="/positions", tags=["positions"])


@router.get("/", response_model=List[PositionOut])
def list_positions(db: Session = Depends(get_db), _=Depends(get_current_user)):
    return db.query(Position).all()


@router.post("/", response_model=PositionOut)
def create_position(body: PositionCreate, db: Session = Depends(get_db), _=Depends(get_current_user)):
    obj = Position(**body.model_dump())
    db.add(obj)
    db.commit()
    db.refresh(obj)
    return obj
