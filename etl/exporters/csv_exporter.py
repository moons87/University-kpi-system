from __future__ import annotations
import os

import pandas as pd
from sqlalchemy import text
from sqlalchemy.engine import Engine


def export_csvs(engine: Engine, year: int, semester: int) -> str:
    """Write 5 flat CSV files to etl/exports/{year}_S{semester}/. Returns output dir."""
    out_dir = os.path.join("etl", "exports", f"{year}_S{semester}")
    os.makedirs(out_dir, exist_ok=True)

    queries: dict[str, str] = {
        "kpi_scores": f"""
            SELECT * FROM analytics_teacher_kpi
            WHERE year = {year} AND semester = {semester}
        """,
        "departments": f"""
            SELECT * FROM analytics_dept_summary
            WHERE year = {year} AND semester = {semester}
        """,
        "rankings": f"""
            SELECT * FROM analytics_rankings
            WHERE year = {year} AND semester = {semester}
        """,
        "trends": f"""
            SELECT * FROM analytics_trends
            WHERE year = {year} AND semester = {semester}
        """,
        "teachers": """
            SELECT t.id, t.full_name, t.email,
                   d.name  AS department,
                   p.name  AS position,
                   dg.name AS degree
            FROM   teachers t
            LEFT JOIN departments d  ON t.department_id = d.id
            LEFT JOIN positions   p  ON t.position_id   = p.id
            LEFT JOIN degrees     dg ON t.degree_id     = dg.id
        """,
    }

    with engine.connect() as conn:
        for name, sql in queries.items():
            df = pd.read_sql_query(text(sql), conn)
            df.to_csv(os.path.join(out_dir, f"{name}.csv"), index=False)

    return out_dir
