import pandas as pd
import pytest
from etl.transformers.analytics_builder import (
    _transform_dept_summary,
    _transform_rankings,
    _transform_trends,
)


@pytest.fixture
def teacher_kpi():
    return pd.DataFrame([
        {
            "teacher_id": 1, "teacher_name": "Alice",
            "department_id": 1, "department_name": "CS",
            "total_score": 80.0, "teaching_score": 70.0,
            "research_score": 90.0, "project_score": 60.0, "achievement_score": 80.0,
        },
        {
            "teacher_id": 2, "teacher_name": "Bob",
            "department_id": 1, "department_name": "CS",
            "total_score": 60.0, "teaching_score": 50.0,
            "research_score": 70.0, "project_score": 40.0, "achievement_score": 60.0,
        },
        {
            "teacher_id": 3, "teacher_name": "Carol",
            "department_id": 2, "department_name": "Math",
            "total_score": 70.0, "teaching_score": 60.0,
            "research_score": 80.0, "project_score": 50.0, "achievement_score": 70.0,
        },
    ])


# ── dept summary ─────────────────────────────────────────────────────────────

def test_dept_summary_two_departments(teacher_kpi):
    result = _transform_dept_summary(teacher_kpi, 2024, 1)
    assert len(result) == 2


def test_dept_summary_cs_aggregates(teacher_kpi):
    result = _transform_dept_summary(teacher_kpi, 2024, 1)
    cs = result[result["department_id"] == 1].iloc[0]
    assert cs["teacher_count"] == 2
    assert cs["avg_total_score"] == 70.0
    assert cs["max_total_score"] == 80.0
    assert cs["min_total_score"] == 60.0


def test_dept_summary_period_columns(teacher_kpi):
    result = _transform_dept_summary(teacher_kpi, 2024, 2)
    assert (result["year"] == 2024).all()
    assert (result["semester"] == 2).all()


# ── rankings ─────────────────────────────────────────────────────────────────

def test_rankings_overall_order(teacher_kpi):
    result = _transform_rankings(teacher_kpi, 2024, 1)
    alice = result[result["teacher_id"] == 1].iloc[0]
    carol = result[result["teacher_id"] == 3].iloc[0]
    bob   = result[result["teacher_id"] == 2].iloc[0]
    assert alice["rank_overall"] == 1
    assert carol["rank_overall"] == 2
    assert bob["rank_overall"]   == 3


def test_rankings_in_dept(teacher_kpi):
    result = _transform_rankings(teacher_kpi, 2024, 1)
    alice = result[result["teacher_id"] == 1].iloc[0]
    bob   = result[result["teacher_id"] == 2].iloc[0]
    carol = result[result["teacher_id"] == 3].iloc[0]
    assert alice["rank_in_dept"] == 1   # top in CS
    assert bob["rank_in_dept"]   == 2   # second in CS
    assert carol["rank_in_dept"] == 1   # only one in Math


# ── trends ────────────────────────────────────────────────────────────────────

def test_trends_computes_delta():
    curr = pd.DataFrame([{"teacher_id": 1, "teacher_name": "Alice", "total_score": 80.0}])
    prev = pd.DataFrame([{"teacher_id": 1, "total_score": 70.0}])
    row = _transform_trends(curr, prev, 2024, 1).iloc[0]
    assert row["total_score"] == 80.0
    assert row["prev_score"]  == 70.0
    assert row["delta"]       == 10.0


def test_trends_no_previous_period():
    curr = pd.DataFrame([{"teacher_id": 1, "teacher_name": "Alice", "total_score": 80.0}])
    prev = pd.DataFrame(columns=["teacher_id", "total_score"])
    row = _transform_trends(curr, prev, 2024, 1).iloc[0]
    assert row["total_score"] == 80.0
    assert pd.isna(row["prev_score"])
    assert pd.isna(row["delta"])


def test_trends_new_teacher_no_prev():
    curr = pd.DataFrame([
        {"teacher_id": 1, "teacher_name": "Alice", "total_score": 80.0},
        {"teacher_id": 2, "teacher_name": "Bob",   "total_score": 60.0},
    ])
    prev = pd.DataFrame([{"teacher_id": 1, "total_score": 75.0}])
    result = _transform_trends(curr, prev, 2024, 1)
    bob = result[result["teacher_id"] == 2].iloc[0]
    assert pd.isna(bob["prev_score"])
