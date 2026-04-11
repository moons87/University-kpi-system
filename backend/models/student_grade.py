from sqlalchemy import ForeignKey, Float
from sqlalchemy.orm import Mapped, mapped_column
from typing import Optional
from database import Base


class StudentGrade(Base):
    __tablename__ = "student_grades"

    id:         Mapped[int]             = mapped_column(primary_key=True)
    student_id: Mapped[int]             = mapped_column(ForeignKey("students.id"), nullable=False)
    subject_id: Mapped[int]             = mapped_column(ForeignKey("subjects.id"), nullable=False)
    grade:      Mapped[Optional[float]] = mapped_column(Float, nullable=True)
