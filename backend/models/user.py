from sqlalchemy import String, Text, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column
from typing import Optional
from database import Base


class User(Base):
    __tablename__ = "users"

    id:            Mapped[int]           = mapped_column(primary_key=True)
    teacher_id:    Mapped[Optional[int]] = mapped_column(ForeignKey("teachers.id"), nullable=True)
    email:         Mapped[str]           = mapped_column(String(200), unique=True, nullable=False)
    password_hash: Mapped[str]           = mapped_column(Text, nullable=False)
    role:          Mapped[str]           = mapped_column(String(20), nullable=False, default="teacher")
