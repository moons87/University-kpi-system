from sqlalchemy import String, Text, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column
from database import Base


class Achievement(Base):
    __tablename__ = "achievements"

    id:         Mapped[int] = mapped_column(primary_key=True)
    teacher_id: Mapped[int] = mapped_column(ForeignKey("teachers.id"), nullable=False)
    time_id:    Mapped[int] = mapped_column(ForeignKey("time_dim.id"), nullable=False)
    title:      Mapped[str] = mapped_column(Text, nullable=False)
    level:      Mapped[str] = mapped_column(String(20), nullable=False)
