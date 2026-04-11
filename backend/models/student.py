from sqlalchemy import String, Integer, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column
from typing import Optional
from database import Base


class Student(Base):
    __tablename__ = "students"

    id:              Mapped[int]           = mapped_column(primary_key=True)
    full_name:       Mapped[str]           = mapped_column(String(200), nullable=False)
    group_id:        Mapped[Optional[int]] = mapped_column(ForeignKey("groups.id"), nullable=True)
    education_level: Mapped[str]           = mapped_column(String(50), nullable=False)
    enrollment_year: Mapped[int]           = mapped_column(Integer, nullable=False)
    origin:          Mapped[Optional[str]] = mapped_column(String(200))
    language:        Mapped[Optional[str]] = mapped_column(String(50))
    payment_form:    Mapped[str]           = mapped_column(String(20), nullable=False)
    gender:          Mapped[Optional[str]] = mapped_column(String(10))
