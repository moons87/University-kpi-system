from sqlalchemy.orm import Session
from sqlalchemy import delete, func, case

from models import (
    Teacher, TeachingLoad, Publication, Patent,
    Achievement, Project, KPIScore, KPIDetail, TimeDim, KPISetting
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

# Категории публикаций
SCOPUS_WOS_TYPES = ("Scopus", "WoS")
LOCAL_PUB_TYPES  = ("local", "Вестник", "Конференция", "Article", "Monograph",
                    "КОКСНВО", "Международная конференция", "Монография", "Учебное пособие",
                    "Зарубежные журналы")

# Категории достижений
INTL_LEVELS  = ("international", "International")
NATL_LEVELS  = ("national",      "National")
LOCAL_LEVELS = ("local",         "university",   "University")


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

    # ── Динамические настройки из БД (с резервными значениями по умолчанию) ──
    db_settings = db.query(KPISetting).all()
    dynamic_weights = WEIGHTS.copy()
    dynamic_max     = MAX_VALUES.copy()
    for s in db_settings:
        if s.key.startswith("weight_"):
            k = s.key[len("weight_"):]
            if k in dynamic_weights:
                dynamic_weights[k] = s.value
        elif s.key.startswith("max_"):
            k = s.key[len("max_"):]
            if k in dynamic_max:
                dynamic_max[k] = s.value

    teacher_ids = [t.id for t in teachers]

    # ── Учебная нагрузка: SUM(hours) GROUP BY teacher ──────────────────────
    hours_map: dict[int, float] = {
        row.teacher_id: float(row.total)
        for row in db.query(
            TeachingLoad.teacher_id,
            func.sum(TeachingLoad.hours).label("total")
        ).filter(
            TeachingLoad.teacher_id.in_(teacher_ids),
            TeachingLoad.time_id == time_id
        ).group_by(TeachingLoad.teacher_id).all()
    }

    # ── Публикации: CASE WHEN для разбивки за один запрос ──────────────────
    pub_agg = db.query(
        Publication.teacher_id,
        func.sum(case((Publication.type.in_(SCOPUS_WOS_TYPES), 1), else_=0)).label("scopus_wos"),
        func.sum(case((Publication.type.in_(LOCAL_PUB_TYPES),  1), else_=0)).label("local_pub"),
    ).filter(
        Publication.teacher_id.in_(teacher_ids),
        Publication.time_id == time_id
    ).group_by(Publication.teacher_id).all()

    scopus_wos_map: dict[int, int] = {r.teacher_id: int(r.scopus_wos) for r in pub_agg}
    local_pub_map:  dict[int, int] = {r.teacher_id: int(r.local_pub)  for r in pub_agg}

    # ── Патенты: COUNT GROUP BY teacher ────────────────────────────────────
    patent_map: dict[int, int] = {
        row.teacher_id: int(row.cnt)
        for row in db.query(
            Patent.teacher_id,
            func.count(Patent.id).label("cnt")
        ).filter(
            Patent.teacher_id.in_(teacher_ids),
            Patent.time_id == time_id
        ).group_by(Patent.teacher_id).all()
    }

    # ── Проекты: COUNT + SUM(budget) GROUP BY teacher ───────────────────────
    proj_agg = db.query(
        Project.teacher_id,
        func.count(Project.id).label("cnt"),
        func.sum(Project.budget).label("total_budget"),
    ).filter(
        Project.teacher_id.in_(teacher_ids),
        Project.time_id == time_id
    ).group_by(Project.teacher_id).all()

    proj_count_map:  dict[int, int]   = {r.teacher_id: int(r.cnt)                 for r in proj_agg}
    proj_budget_map: dict[int, float] = {r.teacher_id: float(r.total_budget or 0) for r in proj_agg}

    # ── Достижения: CASE WHEN по уровням за один запрос ────────────────────
    ach_agg = db.query(
        Achievement.teacher_id,
        func.sum(case((Achievement.level.in_(INTL_LEVELS),  1), else_=0)).label("intl"),
        func.sum(case((Achievement.level.in_(NATL_LEVELS),  1), else_=0)).label("natl"),
        func.sum(case((Achievement.level.in_(LOCAL_LEVELS), 1), else_=0)).label("local_ach"),
    ).filter(
        Achievement.teacher_id.in_(teacher_ids),
        Achievement.time_id == time_id
    ).group_by(Achievement.teacher_id).all()

    intl_ach_map:  dict[int, int] = {r.teacher_id: int(r.intl)      for r in ach_agg}
    natl_ach_map:  dict[int, int] = {r.teacher_id: int(r.natl)      for r in ach_agg}
    local_ach_map: dict[int, int] = {r.teacher_id: int(r.local_ach) for r in ach_agg}

    # ── Удаляем старые результаты ───────────────────────────────────────────
    db.execute(delete(KPIDetail).where(KPIDetail.time_id == time_id))
    db.execute(delete(KPIScore).where(KPIScore.time_id  == time_id))
    db.commit()

    details_to_insert = []
    scores_to_insert  = []

    for teacher in teachers:
        tid = teacher.id

        # Учебная работа
        hours          = hours_map.get(tid, 0.0)
        teaching_score = _normalize(hours, dynamic_max["hours_total"])
        details_to_insert.append(KPIDetail(
            teacher_id=tid, time_id=time_id,
            category="teaching", metric_name="hours_total",
            value=hours, score=teaching_score,
        ))

        # Наука
        scopus_wos   = scopus_wos_map.get(tid, 0)
        local_pub    = local_pub_map.get(tid, 0)
        patent_count = patent_map.get(tid, 0)

        sw_score  = _normalize(scopus_wos,   dynamic_max["scopus_wos_count"])
        loc_score = _normalize(local_pub,    dynamic_max["local_count"])
        pat_score = _normalize(patent_count, dynamic_max["patent_count"])
        research_score = round(sw_score * 0.6 + loc_score * 0.2 + pat_score * 0.2, 2)

        for metric, val, sc in [
            ("scopus_wos_count", scopus_wos,   sw_score),
            ("local_pub_count",  local_pub,    loc_score),
            ("patent_count",     patent_count, pat_score),
        ]:
            details_to_insert.append(KPIDetail(
                teacher_id=tid, time_id=time_id,
                category="research", metric_name=metric,
                value=float(val), score=sc,
            ))

        # Проекты
        proj_count  = proj_count_map.get(tid, 0)
        proj_budget = proj_budget_map.get(tid, 0.0)

        pc_score = _normalize(proj_count,  dynamic_max["project_count"])
        pb_score = _normalize(proj_budget, dynamic_max["project_budget"])
        project_score = round(pc_score * 0.5 + pb_score * 0.5, 2)

        for metric, val, sc in [
            ("project_count",  proj_count,  pc_score),
            ("project_budget", proj_budget, pb_score),
        ]:
            details_to_insert.append(KPIDetail(
                teacher_id=tid, time_id=time_id,
                category="project", metric_name=metric,
                value=float(val), score=sc,
            ))

        # Достижения
        intl_count  = intl_ach_map.get(tid, 0)
        natl_count  = natl_ach_map.get(tid, 0)
        local_count = local_ach_map.get(tid, 0)

        intl_sc  = _normalize(intl_count,  dynamic_max["achievement_intl"])
        natl_sc  = _normalize(natl_count,  dynamic_max["achievement_natl"])
        local_sc = _normalize(local_count, dynamic_max["achievement_local"])
        achievement_score = round(intl_sc * 0.5 + natl_sc * 0.35 + local_sc * 0.15, 2)

        for metric, val, sc in [
            ("achievement_international", intl_count,  intl_sc),
            ("achievement_national",      natl_count,  natl_sc),
            ("achievement_local",         local_count, local_sc),
        ]:
            details_to_insert.append(KPIDetail(
                teacher_id=tid, time_id=time_id,
                category="achievement", metric_name=metric,
                value=float(val), score=sc,
            ))

        total_score = round(
            teaching_score    * dynamic_weights["teaching"]    +
            research_score    * dynamic_weights["research"]    +
            project_score     * dynamic_weights["project"]     +
            achievement_score * dynamic_weights["achievement"],
            2,
        )

        scores_to_insert.append(KPIScore(
            teacher_id=tid, time_id=time_id,
            teaching_score=teaching_score,
            research_score=research_score,
            project_score=project_score,
            achievement_score=achievement_score,
            total_score=total_score,
        ))

    db.bulk_save_objects(details_to_insert)
    db.bulk_save_objects(scores_to_insert)
    db.commit()

    return {"calculated": len(scores_to_insert)}
