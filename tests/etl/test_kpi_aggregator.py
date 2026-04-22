import pandas as pd
import pytest
from etl.transformers.kpi_aggregator import _transform_teacher_kpi


@pytest.fixture
def kpi_df():
    return pd.DataFrame([{
        "teacher_id":       1,
        "teacher_name":     "Alice",
        "department_name":  "CS",
        "position_name":    "Professor",
        "teaching_score":   80.0,
        "research_score":   70.0,
        "project_score":    60.0,
        "achievement_score":50.0,
        "total_score":      68.5,
    }])


@pytest.fixture
def details_df():
    return pd.DataFrame([
        {"teacher_id": 1, "metric_name": "hours_total",              "value": 240.0},
        {"teacher_id": 1, "metric_name": "scopus_wos_count",         "value": 3.0},
        {"teacher_id": 1, "metric_name": "local_pub_count",          "value": 5.0},
        {"teacher_id": 1, "metric_name": "patent_count",             "value": 2.0},
        {"teacher_id": 1, "metric_name": "project_count",            "value": 1.0},
        {"teacher_id": 1, "metric_name": "project_budget",           "value": 4_000_000.0},
        {"teacher_id": 1, "metric_name": "achievement_international", "value": 1.0},
        {"teacher_id": 1, "metric_name": "achievement_national",      "value": 2.0},
        {"teacher_id": 1, "metric_name": "achievement_local",         "value": 0.0},
    ])


def test_produces_one_row(kpi_df, details_df):
    result = _transform_teacher_kpi(kpi_df, details_df, 2024, 1)
    assert len(result) == 1


def test_maps_scores_and_period(kpi_df, details_df):
    row = _transform_teacher_kpi(kpi_df, details_df, 2024, 1).iloc[0]
    assert row["teaching_score"] == 80.0
    assert row["total_score"] == 68.5
    assert row["year"] == 2024
    assert row["semester"] == 1


def test_maps_raw_metrics(kpi_df, details_df):
    row = _transform_teacher_kpi(kpi_df, details_df, 2024, 1).iloc[0]
    assert row["hours_total"] == 240.0
    assert row["scopus_wos_count"] == 3
    assert row["local_pub_count"] == 5
    assert row["patent_count"] == 2
    assert row["ach_intl"] == 1
    assert row["ach_natl"] == 2
    assert row["ach_local"] == 0


def test_missing_details_defaults_to_zero(kpi_df):
    empty = pd.DataFrame(columns=["teacher_id", "metric_name", "value"])
    row = _transform_teacher_kpi(kpi_df, empty, 2024, 1).iloc[0]
    assert row["hours_total"] == 0.0
    assert row["scopus_wos_count"] == 0
    assert row["ach_intl"] == 0


def test_empty_kpi_returns_empty(details_df):
    empty_kpi = pd.DataFrame(columns=[
        "teacher_id", "teacher_name", "department_name", "position_name",
        "teaching_score", "research_score", "project_score",
        "achievement_score", "total_score",
    ])
    result = _transform_teacher_kpi(empty_kpi, details_df, 2024, 1)
    assert result.empty
