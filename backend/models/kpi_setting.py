from sqlalchemy import String, Float
from sqlalchemy.orm import Mapped, mapped_column
from database import Base

class KPISetting(Base):
    __tablename__ = "kpi_settings"

    key:   Mapped[str]   = mapped_column(String(50), primary_key=True)
    value: Mapped[float] = mapped_column(Float, nullable=False)
