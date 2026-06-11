from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

from database import get_db
from models import Group
from models.user import User
from schemas.group import GroupCreate, GroupOut, GroupUpdate
from schemas.user import UserOut
from auth.jwt import get_current_user, require_advisor_or_admin

router = APIRouter(prefix="/groups", tags=["groups"])


@router.get("/advisors", response_model=List[UserOut])
def list_advisors(db: Session = Depends(get_db), _=Depends(get_current_user)):
    return db.query(User).filter(User.role == "advisor").all()


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


@router.patch("/{group_id}", response_model=GroupOut)
def update_group(
    group_id: int,
    body: GroupUpdate,
    db: Session = Depends(get_db),
    _=Depends(require_advisor_or_admin),
):
    obj = db.query(Group).filter(Group.id == group_id).first()
    if not obj:
        raise HTTPException(status_code=404, detail="Group not found")
    if "advisor_id" in body.model_fields_set:
        if body.advisor_id is not None:
            advisor = db.query(User).filter(User.id == body.advisor_id, User.role == "advisor").first()
            if not advisor:
                raise HTTPException(status_code=400, detail="User is not an advisor")
        obj.advisor_id = body.advisor_id
    db.commit()
    db.refresh(obj)
    return obj
