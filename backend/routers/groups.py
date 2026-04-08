from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

from database import get_db
from models import Group, User
from schemas.group import GroupCreate, GroupOut
from auth.jwt import get_current_user

router = APIRouter(prefix="/groups", tags=["groups"])


@router.get("/", response_model=List[GroupOut])
def list_groups(db: Session = Depends(get_db), _=Depends(get_current_user)):
    return db.query(Group).all()


@router.post("/", response_model=GroupOut)
def create_group(
    body: GroupCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Only admins can manage groups")
    obj = Group(**body.model_dump())
    db.add(obj)
    db.commit()
    db.refresh(obj)
    return obj
