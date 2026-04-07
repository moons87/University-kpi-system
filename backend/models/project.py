from sqlalchemy import String, Text, ForeignKey, Numeric, Date
from sqlalchemy.orm import Mapped, mapped_column
from typing import Optional
from datetime import date
from decimal import Decimal
from database import Base


class Project(Base):
    __tablename__ = "projects"

    id:             Mapped[int]              = mapped_column(primary_key=True)
    teacher_id:     Mapped[int]              = mapped_column(ForeignKey("teachers.id"), nullable=False)
    time_id:        Mapped[int]              = mapped_column(ForeignKey("time_dim.id"), nullable=False)
    title:          Mapped[str]              = mapped_column(Text, nullable=False)
    funding_source: Mapped[Optional[str]]    = mapped_column(String(200))
    budget:         Mapped[Optional[Decimal]] = mapped_column(Numeric(15, 2))
    start_date:     Mapped[Optional[date]]   = mapped_column(Date)
    end_date:       Mapped[Optional[date]]   = mapped_column(Date)
