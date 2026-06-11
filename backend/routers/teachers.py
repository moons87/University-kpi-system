from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session, joinedload
from typing import List, Optional

from database import get_db
from models import Teacher, User
from schemas.teacher import TeacherCreate, TeacherOut, TeacherDetail
from auth.jwt import get_current_user
from routers.auth import pwd_context

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
def create_teacher(
    body: TeacherCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Only admins can create teachers")
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
def update_teacher(
    teacher_id: int,
    body: TeacherCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if current_user.role != "admin":
        if current_user.teacher_id is None:
            raise HTTPException(status_code=403, detail="Your account is not linked to a teacher record")
        if current_user.teacher_id != teacher_id:
            raise HTTPException(status_code=403, detail="You can only edit your own profile")
    obj = db.get(Teacher, teacher_id)
    if not obj:
        raise HTTPException(status_code=404, detail="Teacher not found")
    for k, v in body.model_dump().items():
        setattr(obj, k, v)
    db.commit()
    db.refresh(obj)
    return obj


@router.post("/{teacher_id}/create-account")
def create_teacher_account(
    teacher_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Admin-only: create a login account for an existing teacher."""
    import secrets
    import logging
    _logger = logging.getLogger(__name__)

    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Only admins can create accounts")

    teacher = db.get(Teacher, teacher_id)
    if not teacher:
        raise HTTPException(status_code=404, detail="Teacher not found")
    if not teacher.email:
        raise HTTPException(status_code=400, detail="Teacher has no email. Set an email first.")

    existing = db.query(User).filter(User.teacher_id == teacher_id).first()
    if existing:
        raise HTTPException(status_code=409, detail="Account already exists for this teacher")

    # Generate a cryptographically secure temporary password
    temp_password = secrets.token_urlsafe(12)
    new_user = User(
        email=teacher.email,
        password_hash=pwd_context.hash(temp_password),
        role="teacher",
        teacher_id=teacher_id,
    )
    db.add(new_user)
    db.commit()

    # Log the temp password server-side only — never return it in the HTTP response
    _logger.info(
        "Account created for teacher_id=%d email=%s temp_password=%s — share via secure channel",
        teacher_id, teacher.email, temp_password,
    )

    return {
        "status":  "created",
        "email":   teacher.email,
        "message": "Account created. Share the temporary password via a secure channel (server log).",
    }
