from sqlalchemy import ForeignKey, Numeric, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column
from typing import Optional
from decimal import Decimal
from database import Base


class KPIScore(Base):
    __tablename__ = "kpi_scores"
    __table_args__ = (UniqueConstraint("teacher_id", "time_id"),)

    id:                Mapped[int]              = mapped_column(primary_key=True)
    teacher_id:        Mapped[int]              = mapped_column(ForeignKey("teachers.id"), nullable=False)
    time_id:           Mapped[int]              = mapped_column(ForeignKey("time_dim.id"), nullable=False)
    teaching_score:    Mapped[Optional[Decimal]] = mapped_column(Numeric(5, 2))
    research_score:    Mapped[Optional[Decimal]] = mapped_column(Numeric(5, 2))
    project_score:     Mapped[Optional[Decimal]] = mapped_column(Numeric(5, 2))
    achievement_score: Mapped[Optional[Decimal]] = mapped_column(Numeric(5, 2))
    total_score:       Mapped[Optional[Decimal]] = mapped_column(Numeric(5, 2))
