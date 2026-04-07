from sqlalchemy import String
from sqlalchemy.orm import Mapped, mapped_column
from database import Base


class Degree(Base):
    __tablename__ = "degrees"

    id:   Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(String(100), nullable=False)
