from sqlalchemy import String, Text, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column
from typing import Optional
from database import Base


class Publication(Base):
    __tablename__ = "publications"

    id:         Mapped[int]           = mapped_column(primary_key=True)
    teacher_id: Mapped[int]           = mapped_column(ForeignKey("teachers.id"), nullable=False)
    time_id:    Mapped[int]           = mapped_column(ForeignKey("time_dim.id"), nullable=False)
    title:      Mapped[str]           = mapped_column(Text, nullable=False)
    type:       Mapped[str]           = mapped_column(String(20), nullable=False)
    quartile:   Mapped[Optional[str]] = mapped_column(String(5))
