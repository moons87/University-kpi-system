from sqlalchemy import String
from sqlalchemy.orm import Mapped, mapped_column
from typing import Optional
from database import Base


class Group(Base):
    __tablename__ = "groups"

    id:              Mapped[int]           = mapped_column(primary_key=True)
    name:            Mapped[str]           = mapped_column(String(100), nullable=False)
    education_level: Mapped[Optional[str]] = mapped_column(String(50))
