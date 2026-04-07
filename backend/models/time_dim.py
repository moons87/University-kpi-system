from sqlalchemy import Integer, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column
from typing import Optional
from database import Base


class TimeDim(Base):
    __tablename__ = "time_dim"
    __table_args__ = (UniqueConstraint("year", "semester"),)

    id:       Mapped[int]           = mapped_column(primary_key=True)
    year:     Mapped[int]           = mapped_column(Integer, nullable=False)
    semester: Mapped[int]           = mapped_column(Integer, nullable=False)
    quarter:  Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
