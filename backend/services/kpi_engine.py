import pandas as pd
from sqlalchemy.orm import Session
from sqlalchemy import delete

from models import (
    Teacher, TeachingLoad, Publication, Patent,
    Achievement, Project, KPIScore, KPIDetail, TimeDim
)

WEIGHTS = {
    "teaching":    0.30,
    "research":    0.35,
    "project":     0.15,
    "achievement": 0.20,
}

MAX_VALUES = {
    "hours_total":       300,
    "scopus_wos_count":  5,
    "local_count":       10,
    "patent_count":      3,
    "project_count":     3,
    "project_budget":    10_000_000,
    "achievement_intl":  2,
    "achievement_natl":  4,
    "achievement_local": 6,
}


def _normalize(value: float, max_val: float) -> float:
    return round(min(value, max_val) / max_val * 100, 2) if max_val > 0 else 0.0


def calculate_kpi(year: int, semester: int, db: Session) -> dict:
    time_obj = db.query(TimeDim).filter(
        TimeDim.year == year, TimeDim.semester == semester
    ).first()
    if not time_obj:
        raise ValueError(f"No time_dim entry for year={year} semester={semester}")
    time_id = time_obj.id

    teachers = db.query(Teacher).all()
    if not teachers:
        return {"calculated": 0}

    teacher_ids = [t.id for t in teachers]

    tl_rows   = db.query(TeachingLoad).filter(TeachingLoad.teacher_id.in_(teacher_ids), TeachingLoad.time_id == time_id).all()
    pub_rows  = db.query(Publication).filter(Publication.teacher_id.in_(teacher_ids), Publication.time_id == time_id).all()
    pat_rows  = db.query(Patent).filter(Patent.teacher_id.in_(teacher_ids), Patent.time_id == time_id).all()
    ach_rows  = db.query(Achievement).filter(Achievement.teacher_id.in_(teacher_ids), Achievement.time_id == time_id).all()
    proj_rows = db.query(Project).filter(Project.teacher_id.in_(teacher_ids), Project.time_id == time_id).all()

    tl_df   = pd.DataFrame([{"teacher_id": r.teacher_id, "hours": r.hours} for r in tl_rows])
    pub_df  = pd.DataFrame([{"teacher_id": r.teacher_id, "type": r.type} for r in pub_rows])
    pat_df  = pd.DataFrame([{"teacher_id": r.teacher_id} for r in pat_rows])
    ach_df  = pd.DataFrame([{"teacher_id": r.teacher_id, "level": r.level} for r in ach_rows])
    proj_df = pd.DataFrame([{"teacher_id": r.teacher_id, "budget": float(r.budget or 0)} for r in proj_rows])

    db.execute(delete(KPIDetail).where(KPIDetail.time_id == time_id))
    db.execute(delete(KPIScore).where(KPIScore.time_id == time_id))
    db.commit()

    details_to_insert = []
    scores_to_insert  = []

    for teacher in teachers:
        tid = teacher.id

        hours = tl_df[tl_df.teacher_id == tid]["hours"].sum() if not tl_df.empty else 0
        teaching_score = _normalize(float(hours), MAX_VALUES["hours_total"])
        details_to_insert.append(KPIDetail(teacher_id=tid, time_id=time_id, category="teaching", metric_name="hours_total", value=float(hours), score=teaching_score))

        t_pub = pub_df[pub_df.teacher_id == tid] if not pub_df.empty else pd.DataFrame()
        scopus_wos   = len(t_pub[t_pub["type"].isin(["Scopus", "WoS"])]) if not t_pub.empty else 0
        local_pub    = len(t_pub[t_pub["type"] == "local"]) if not t_pub.empty else 0
        patent_count = len(pat_df[pat_df.teacher_id == tid]) if not pat_df.empty else 0

        sw_score  = _normalize(scopus_wos,   MAX_VALUES["scopus_wos_count"])
        loc_score = _normalize(local_pub,    MAX_VALUES["local_count"])
        pat_score = _normalize(patent_count, MAX_VALUES["patent_count"])
        research_score = round(sw_score * 0.6 + loc_score * 0.2 + pat_score * 0.2, 2)

        for metric, val, sc in [("scopus_wos_count", scopus_wos, sw_score), ("local_pub_count", local_pub, loc_score), ("patent_count", patent_count, pat_score)]:
            details_to_insert.append(KPIDetail(teacher_id=tid, time_id=time_id, category="research", metric_name=metric, value=float(val), score=sc))

        t_proj = proj_df[proj_df.teacher_id == tid] if not proj_df.empty else pd.DataFrame()
        proj_count  = len(t_proj)
        proj_budget = t_proj["budget"].sum() if not t_proj.empty else 0

        pc_score = _normalize(proj_count,  MAX_VALUES["project_count"])
        pb_score = _normalize(proj_budget, MAX_VALUES["project_budget"])
        project_score = round(pc_score * 0.5 + pb_score * 0.5, 2)

        for metric, val, sc in [("project_count", proj_count, pc_score), ("project_budget", proj_budget, pb_score)]:
            details_to_insert.append(KPIDetail(teacher_id=tid, time_id=time_id, category="project", metric_name=metric, value=float(val), score=sc))

        t_ach = ach_df[ach_df.teacher_id == tid] if not ach_df.empty else pd.DataFrame()
        intl_count  = len(t_ach[t_ach["level"] == "international"]) if not t_ach.empty else 0
        natl_count  = len(t_ach[t_ach["level"] == "national"])      if not t_ach.empty else 0
        local_count = len(t_ach[t_ach["level"] == "local"])         if not t_ach.empty else 0

        intl_sc  = _normalize(intl_count,  MAX_VALUES["achievement_intl"])
        natl_sc  = _normalize(natl_count,  MAX_VALUES["achievement_natl"])
        local_sc = _normalize(local_count, MAX_VALUES["achievement_local"])
        achievement_score = round(intl_sc * 0.5 + natl_sc * 0.35 + local_sc * 0.15, 2)

        for metric, val, sc in [("achievement_international", intl_count, intl_sc), ("achievement_national", natl_count, natl_sc), ("achievement_local", local_count, local_sc)]:
            details_to_insert.append(KPIDetail(teacher_id=tid, time_id=time_id, category="achievement", metric_name=metric, value=float(val), score=sc))

        total_score = round(
            teaching_score * WEIGHTS["teaching"] +
            research_score * WEIGHTS["research"] +
            project_score  * WEIGHTS["project"] +
            achievement_score * WEIGHTS["achievement"],
            2,
        )

        scores_to_insert.append(KPIScore(
            teacher_id=tid, time_id=time_id,
            teaching_score=teaching_score, research_score=research_score,
            project_score=project_score, achievement_score=achievement_score,
            total_score=total_score,
        ))

    db.bulk_save_objects(details_to_insert)
    db.bulk_save_objects(scores_to_insert)
    db.commit()

    return {"calculated": len(scores_to_insert)}
