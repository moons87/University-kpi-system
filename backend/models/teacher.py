from sqlalchemy import String, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.sql import func
from typing import Optional
from datetime import datetime
from database import Base


class Teacher(Base):
    __tablename__ = "teachers"

    id:            Mapped[int]               = mapped_column(primary_key=True)
    full_name:     Mapped[str]               = mapped_column(String(200), nullable=False)
    email:         Mapped[Optional[str]]     = mapped_column(String(200), unique=True)
    position_id:   Mapped[Optional[int]]     = mapped_column(ForeignKey("positions.id"))
    degree_id:     Mapped[Optional[int]]     = mapped_column(ForeignKey("degrees.id"))
    department_id: Mapped[Optional[int]]     = mapped_column(ForeignKey("departments.id"))
    created_at:    Mapped[Optional[datetime]] = mapped_column(server_default=func.now())

    position:   Mapped[Optional["Position"]]   = relationship("Position")
    degree:     Mapped[Optional["Degree"]]     = relationship("Degree")
    department: Mapped[Optional["Department"]] = relationship("Department")
