from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import List

from database import get_db
from models import Group
from schemas.group import GroupCreate, GroupOut
from auth.jwt import get_current_user, require_advisor_or_admin

router = APIRouter(prefix="/groups", tags=["groups"])


@router.get("/", response_model=List[GroupOut])
def list_groups(db: Session = Depends(get_db), _=Depends(get_current_user)):
    return db.query(Group).all()


@router.post("/", response_model=GroupOut)
def create_group(
    body: GroupCreate,
    db: Session = Depends(get_db),
    _=Depends(require_advisor_or_admin),
):
    obj = Group(**body.model_dump())
    db.add(obj)
    db.commit()
    db.refresh(obj)
    return obj
