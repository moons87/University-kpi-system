from sqlalchemy import String, ForeignKey, Numeric
from sqlalchemy.orm import Mapped, mapped_column
from typing import Optional
from decimal import Decimal
from database import Base


class KPIDetail(Base):
    __tablename__ = "kpi_details"

    id:          Mapped[int]              = mapped_column(primary_key=True)
    teacher_id:  Mapped[int]              = mapped_column(ForeignKey("teachers.id"), nullable=False)
    time_id:     Mapped[int]              = mapped_column(ForeignKey("time_dim.id"), nullable=False)
    category:    Mapped[str]              = mapped_column(String(50), nullable=False)
    metric_name: Mapped[str]              = mapped_column(String(100), nullable=False)
    value:       Mapped[Optional[Decimal]] = mapped_column(Numeric(10, 2))
    score:       Mapped[Optional[Decimal]] = mapped_column(Numeric(5, 2))
