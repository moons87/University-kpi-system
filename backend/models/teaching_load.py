from sqlalchemy import ForeignKey, Integer
from sqlalchemy.orm import Mapped, mapped_column
from database import Base


class TeachingLoad(Base):
    __tablename__ = "teaching_load"

    id:         Mapped[int] = mapped_column(primary_key=True)
    teacher_id: Mapped[int] = mapped_column(ForeignKey("teachers.id"), nullable=False)
    subject_id: Mapped[int] = mapped_column(ForeignKey("subjects.id"), nullable=False)
    group_id:   Mapped[int] = mapped_column(ForeignKey("groups.id"),   nullable=False)
    time_id:    Mapped[int] = mapped_column(ForeignKey("time_dim.id"), nullable=False)
    hours:      Mapped[int] = mapped_column(Integer, nullable=False)
