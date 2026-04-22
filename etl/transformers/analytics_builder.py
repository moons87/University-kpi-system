from __future__ import annotations

from datetime import datetime, timezone

import pandas as pd
from sqlalchemy import text
from sqlalchemy.orm import Session

from etl.db import read_df


def _transform_dept_summary(df: pd.DataFrame, year: int, semester: int) -> pd.DataFrame:
    """Pure: aggregate teacher rows by department_id."""
    if df.empty:
        return pd.DataFrame()

    df = df.dropna(subset=["department_id"]).copy()
    df["department_id"] = df["department_id"].astype(int)

    grouped = df.groupby(["department_id", "department_name"]).agg(
        teacher_count   =("teacher_id",       "count"),
        avg_total_score =("total_score",       "mean"),
        max_total_score =("total_score",       "max"),
        min_total_score =("total_score",       "min"),
        avg_teaching    =("teaching_score",    "mean"),
        avg_research    =("research_score",    "mean"),
        avg_project     =("project_score",     "mean"),
        avg_achievement =("achievement_score", "mean"),
    ).reset_index()

    r = lambda v: round(float(v), 2)
    now = datetime.now(timezone.utc)
    records = [
        {
            "department_id":   int(row["department_id"]),
            "department_name": row["department_name"],
            "year":            year,
            "semester":        semester,
            "teacher_count":   int(row["teacher_count"]),
            "avg_total_score": r(row["avg_total_score"]),
            "max_total_score": r(row["max_total_score"]),
            "min_total_score": r(row["min_total_score"]),
            "avg_teaching":    r(row["avg_teaching"]),
            "avg_research":    r(row["avg_research"]),
            "avg_project":     r(row["avg_project"]),
            "avg_achievement": r(row["avg_achievement"]),
            "updated_at":      now,
        }
        for _, row in grouped.iterrows()
    ]
    return pd.DataFrame(records)


def _transform_rankings(df: pd.DataFrame, year: int, semester: int) -> pd.DataFrame:
    """Pure: compute overall and within-dept rank for each teacher row."""
    if df.empty:
        return pd.DataFrame()

    df = df.copy()
    df["rank_overall"] = (
        df["total_score"].rank(method="min", ascending=False).astype(int)
    )
    df["rank_in_dept"] = (
        df.groupby("department_id")["total_score"]
        .rank(method="min", ascending=False)
        .astype(int)
    )

    now = datetime.now(timezone.utc)
    return pd.DataFrame({
        "teacher_id":   df["teacher_id"].astype(int),
        "teacher_name": df["teacher_name"],
        "dept_name":    df["department_name"],
        "year":         year,
        "semester":     semester,
        "rank_overall": df["rank_overall"],
        "rank_in_dept": df["rank_in_dept"],
        "total_score":  df["total_score"].astype(float),
        "updated_at":   now,
    })


def _transform_trends(
    curr: pd.DataFrame,
    prev: pd.DataFrame,
    year: int,
    semester: int,
) -> pd.DataFrame:
    """Pure: compute delta between current and previous period score."""
    if curr.empty:
        return pd.DataFrame()

    if not prev.empty:
        merged = curr.merge(
            prev[["teacher_id", "total_score"]].rename(
                columns={"total_score": "prev_score"}
            ),
            on="teacher_id",
            how="left",
        )
    else:
        merged = curr.copy()
        merged["prev_score"] = float("nan")

    merged["delta"] = merged["total_score"] - merged["prev_score"]

    now = datetime.now(timezone.utc)
    return pd.DataFrame({
        "teacher_id":   merged["teacher_id"].astype(int),
        "teacher_name": merged["teacher_name"],
        "year":         year,
        "semester":     semester,
        "total_score":  merged["total_score"].astype(float),
        "prev_score":   merged["prev_score"],
        "delta":        merged["delta"],
        "updated_at":   now,
    })


# ── DB-level builders ─────────────────────────────────────────────────────────

def build_dept_summary(db: Session, year: int, semester: int) -> int:
    df = read_df(db, """
        SELECT atk.teacher_id, t.department_id, d.name AS department_name,
               atk.total_score,       atk.teaching_score,
               atk.research_score,    atk.project_score,
               atk.achievement_score
        FROM   analytics_teacher_kpi atk
        JOIN   teachers t    ON atk.teacher_id    = t.id
        LEFT JOIN departments d ON t.department_id = d.id
        WHERE  atk.year = :year AND atk.semester = :semester
    """, {"year": year, "semester": semester})

    summary = _transform_dept_summary(df, year, semester)
    if summary.empty:
        return 0

    db.execute(
        text("DELETE FROM analytics_dept_summary WHERE year = :year AND semester = :semester"),
        {"year": year, "semester": semester},
    )
    db.execute(text("""
        INSERT INTO analytics_dept_summary (
            department_id, department_name, year, semester,
            teacher_count, avg_total_score, max_total_score, min_total_score,
            avg_teaching, avg_research, avg_project, avg_achievement, updated_at
        ) VALUES (
            :department_id, :department_name, :year, :semester,
            :teacher_count, :avg_total_score, :max_total_score, :min_total_score,
            :avg_teaching, :avg_research, :avg_project, :avg_achievement, :updated_at
        )
    """), summary.to_dict(orient="records"))
    return len(summary)


def build_rankings(db: Session, year: int, semester: int) -> int:
    df = read_df(db, """
        SELECT atk.teacher_id, atk.teacher_name, atk.department_name,
               t.department_id,  atk.total_score
        FROM   analytics_teacher_kpi atk
        JOIN   teachers t ON atk.teacher_id = t.id
        WHERE  atk.year = :year AND atk.semester = :semester
    """, {"year": year, "semester": semester})

    rankings = _transform_rankings(df, year, semester)
    if rankings.empty:
        return 0

    db.execute(
        text("DELETE FROM analytics_rankings WHERE year = :year AND semester = :semester"),
        {"year": year, "semester": semester},
    )
    db.execute(text("""
        INSERT INTO analytics_rankings (
            teacher_id, teacher_name, dept_name, year, semester,
            rank_overall, rank_in_dept, total_score, updated_at
        ) VALUES (
            :teacher_id, :teacher_name, :dept_name, :year, :semester,
            :rank_overall, :rank_in_dept, :total_score, :updated_at
        )
    """), rankings.to_dict(orient="records"))
    return len(rankings)


def build_trends(db: Session, year: int, semester: int) -> int:
    curr = read_df(db, """
        SELECT teacher_id, teacher_name, total_score
        FROM   analytics_teacher_kpi
        WHERE  year = :year AND semester = :semester
    """, {"year": year, "semester": semester})

    prev_year = year - 1 if semester == 1 else year
    prev_sem  = 2        if semester == 1 else 1

    prev = read_df(db, """
        SELECT teacher_id, total_score
        FROM   analytics_teacher_kpi
        WHERE  year = :year AND semester = :semester
    """, {"year": prev_year, "semester": prev_sem})

    trends = _transform_trends(curr, prev, year, semester)
    if trends.empty:
        return 0

    db.execute(
        text("DELETE FROM analytics_trends WHERE year = :year AND semester = :semester"),
        {"year": year, "semester": semester},
    )
    db.execute(text("""
        INSERT INTO analytics_trends (
            teacher_id, teacher_name, year, semester,
            total_score, prev_score, delta, updated_at
        ) VALUES (
            :teacher_id, :teacher_name, :year, :semester,
            :total_score, :prev_score, :delta, :updated_at
        )
    """), trends.to_dict(orient="records"))
    return len(trends)
