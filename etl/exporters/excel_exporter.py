from __future__ import annotations
import os

import pandas as pd
from sqlalchemy import text
from sqlalchemy.engine import Engine


def export_excel(engine: Engine, year: int, semester: int) -> str:
    """Write a multi-sheet Excel workbook. Returns the file path."""
    out_dir = os.path.join("etl", "exports", f"{year}_S{semester}")
    os.makedirs(out_dir, exist_ok=True)
    out_path = os.path.join(out_dir, f"report_{year}_S{semester}.xlsx")

    sheets: dict[str, str] = {
        "KPI Scores": f"""
            SELECT * FROM analytics_teacher_kpi
            WHERE year = {year} AND semester = {semester}
        """,
        "Department Summary": f"""
            SELECT * FROM analytics_dept_summary
            WHERE year = {year} AND semester = {semester}
        """,
        "Rankings": f"""
            SELECT * FROM analytics_rankings
            WHERE year = {year} AND semester = {semester}
        """,
        "Trends": f"""
            SELECT * FROM analytics_trends
            WHERE year = {year} AND semester = {semester}
        """,
        "Teacher Details": """
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
        with pd.ExcelWriter(out_path, engine="openpyxl") as writer:
            for sheet_name, sql in sheets.items():
                df = pd.read_sql_query(text(sql), conn)
                df.to_excel(writer, sheet_name=sheet_name, index=False)

    return out_path
