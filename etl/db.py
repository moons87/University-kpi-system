from __future__ import annotations
import os

import pandas as pd
from dotenv import load_dotenv
from sqlalchemy import create_engine, text
from sqlalchemy.orm import Session, sessionmaker

load_dotenv()

DATABASE_URL = os.getenv(
    "DATABASE_URL",
    "postgresql://postgres:password@localhost:5432/university_analytics",
)

engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(bind=engine)


def read_df(db: Session, sql: str, params: dict | None = None) -> pd.DataFrame:
    """Execute *sql* with *params* and return results as a DataFrame."""
    result = db.execute(text(sql), params or {})
    rows = result.mappings().all()
    if not rows:
        return pd.DataFrame()
    return pd.DataFrame([dict(r) for r in rows])
