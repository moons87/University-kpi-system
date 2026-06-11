from __future__ import annotations
import os

import pandas as pd
from dotenv import load_dotenv
from sqlalchemy import create_engine, text
from sqlalchemy.orm import Session, sessionmaker

_ENV_PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "backend", ".env")
load_dotenv(_ENV_PATH)

DATABASE_URL = os.getenv("DATABASE_URL")
if not DATABASE_URL:
    raise EnvironmentError(
        "DATABASE_URL environment variable is not set. "
        "ETL cannot start without an explicit database connection string."
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
