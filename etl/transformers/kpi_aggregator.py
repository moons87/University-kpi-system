from __future__ import annotations

from datetime import datetime

import pandas as pd
from sqlalchemy import text
from sqlalchemy.orm import Session

from etl.db import read_df


def _transform_teacher_kpi(
    kpi_df: pd.DataFrame,
    details_df: pd.DataFrame,
    year: int,
    semester: int,
) -> pd.DataFrame:
    """Pure function: join KPI scores with raw metric details into wide rows."""
    if kpi_df.empty:
        return pd.DataFrame()

    if not details_df.empty:
        pivot = details_df.pivot_table(
            index="teacher_id",
            columns="metric_name",
            values="value",
            aggfunc="first",
        ).reset_index()
        merged = kpi_df.merge(pivot, on="teacher_id", how="left")
    else:
        merged = kpi_df.copy()

    def _col(name: str) -> pd.Series:
        return (
            merged[name].fillna(0)
            if name in merged.columns
            else pd.Series(0, index=merged.index)
        )

    now = datetime.utcnow()
    return pd.DataFrame({
        "teacher_id":        merged["teacher_id"].astype(int),
        "teacher_name":      merged["teacher_name"],
        "department_name":   merged["department_name"],
        "position_name":     merged["position_name"],
        "year":              year,
        "semester":          semester,
        "teaching_score":    merged["teaching_score"].fillna(0).astype(float),
        "research_score":    merged["research_score"].fillna(0).astype(float),
        "project_score":     merged["project_score"].fillna(0).astype(float),
        "achievement_score": merged["achievement_score"].fillna(0).astype(float),
        "total_score":       merged["total_score"].fillna(0).astype(float),
        "hours_total":       _col("hours_total").astype(float),
        "scopus_wos_count":  _col("scopus_wos_count").astype(int),
        "local_pub_count":   _col("local_pub_count").astype(int),
        "patent_count":      _col("patent_count").astype(int),
        "project_count":     _col("project_count").astype(int),
        "project_budget":    _col("project_budget").astype(float),
        "ach_intl":          _col("achievement_international").astype(int),
        "ach_natl":          _col("achievement_national").astype(int),
        "ach_local":         _col("achievement_local").astype(int),
        "updated_at":        now,
    })


def build_teacher_kpi(db: Session, year: int, semester: int) -> int:
    """Load from DB, transform, delete-and-insert analytics_teacher_kpi. Returns row count."""
    kpi_df = read_df(db, """
        SELECT ks.teacher_id,
               ks.teaching_score, ks.research_score,
               ks.project_score,  ks.achievement_score, ks.total_score,
               t.full_name  AS teacher_name,
               d.name       AS department_name,
               p.name       AS position_name
        FROM   kpi_scores ks
        JOIN   time_dim td ON ks.time_id    = td.id
        JOIN   teachers t  ON ks.teacher_id = t.id
        LEFT JOIN departments d ON t.department_id = d.id
        LEFT JOIN positions   p ON t.position_id   = p.id
        WHERE  td.year = :year AND td.semester = :semester
    """, {"year": year, "semester": semester})

    details_df = read_df(db, """
        SELECT kd.teacher_id, kd.metric_name, kd.value
        FROM   kpi_details kd
        JOIN   time_dim td ON kd.time_id = td.id
        WHERE  td.year = :year AND td.semester = :semester
    """, {"year": year, "semester": semester})

    rows_df = _transform_teacher_kpi(kpi_df, details_df, year, semester)
    if rows_df.empty:
        return 0

    db.execute(
        text("DELETE FROM analytics_teacher_kpi WHERE year = :y AND semester = :s"),
        {"y": year, "s": semester},
    )
    db.execute(text("""
        INSERT INTO analytics_teacher_kpi (
            teacher_id, teacher_name, department_name, position_name,
            year, semester,
            teaching_score, research_score, project_score, achievement_score, total_score,
            hours_total, scopus_wos_count, local_pub_count, patent_count,
            project_count, project_budget, ach_intl, ach_natl, ach_local, updated_at
        ) VALUES (
            :teacher_id, :teacher_name, :department_name, :position_name,
            :year, :semester,
            :teaching_score, :research_score, :project_score, :achievement_score, :total_score,
            :hours_total, :scopus_wos_count, :local_pub_count, :patent_count,
            :project_count, :project_budget, :ach_intl, :ach_natl, :ach_local, :updated_at
        )
    """), rows_df.to_dict(orient="records"))

    return len(rows_df)
