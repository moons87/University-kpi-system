from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

from database import get_db
from models import Student, StudentGrade
from schemas.student import StudentCreate, StudentOut, GradeOut
from auth.jwt import get_current_user, require_advisor_or_admin

router = APIRouter(prefix="/students", tags=["students"])


def _load_grades(db: Session, student_id: int) -> List[StudentGrade]:
    return db.query(StudentGrade).filter(StudentGrade.student_id == student_id).all()


@router.get("/", response_model=List[StudentOut])
def list_students(db: Session = Depends(get_db), _=Depends(get_current_user)):
    students = db.query(Student).all()
    result = []
    for s in students:
        out = StudentOut.model_validate(s)
        out.grades = [GradeOut.model_validate(g) for g in _load_grades(db, s.id)]
        result.append(out)
    return result


@router.get("/{student_id}", response_model=StudentOut)
def get_student(student_id: int, db: Session = Depends(get_db), _=Depends(get_current_user)):
    s = db.get(Student, student_id)
    if not s:
        raise HTTPException(status_code=404, detail="Student not found")
    out = StudentOut.model_validate(s)
    out.grades = [GradeOut.model_validate(g) for g in _load_grades(db, s.id)]
    return out


@router.post("/", response_model=StudentOut)
def create_student(
    body: StudentCreate,
    db: Session = Depends(get_db),
    _=Depends(require_advisor_or_admin),
):
    data = body.model_dump(exclude={"grades"})
    student = Student(**data)
    db.add(student)
    db.commit()
    db.refresh(student)

    for g in body.grades:
        grade = StudentGrade(student_id=student.id, subject_id=g.subject_id, grade=g.grade)
        db.add(grade)
    db.commit()

    out = StudentOut.model_validate(student)
    out.grades = [GradeOut.model_validate(g) for g in _load_grades(db, student.id)]
    return out


@router.put("/{student_id}", response_model=StudentOut)
def update_student(
    student_id: int,
    body: StudentCreate,
    db: Session = Depends(get_db),
    _=Depends(require_advisor_or_admin),
):
    student = db.get(Student, student_id)
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")

    for key, val in body.model_dump(exclude={"grades"}).items():
        setattr(student, key, val)

    db.query(StudentGrade).filter(StudentGrade.student_id == student_id).delete()
    for g in body.grades:
        grade = StudentGrade(student_id=student_id, subject_id=g.subject_id, grade=g.grade)
        db.add(grade)

    db.commit()
    db.refresh(student)

    out = StudentOut.model_validate(student)
    out.grades = [GradeOut.model_validate(g) for g in _load_grades(db, student.id)]
    return out


@router.delete("/{student_id}", status_code=204)
def delete_student(
    student_id: int,
    db: Session = Depends(get_db),
    _=Depends(require_advisor_or_admin),
):
    student = db.get(Student, student_id)
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")
    db.query(StudentGrade).filter(StudentGrade.student_id == student_id).delete()
    db.delete(student)
    db.commit()
