from io import BytesIO
from datetime import date as date_type
from decimal import Decimal, InvalidOperation
from typing import Any
import pandas as pd
from sqlalchemy.orm import Session
from models import (
    Teacher, Department, Position, Degree,
    Subject, Group, TimeDim,
    TeachingLoad, Publication, Patent, Achievement, Project,
)
from schemas.import_schemas import ImportRow, SheetPreview


SHEET_ALIASES = {
    "преподаватели": "teachers",
    "teachers": "teachers",
    "нагрузка": "teaching_load",
    "teaching_load": "teaching_load",
    "публикации": "publications",
    "publications": "publications",
    "патенты": "patents",
    "patents": "patents",
    "проекты": "projects",
    "projects": "projects",
    "достижения": "achievements",
    "achievements": "achievements",
}

PUBLICATION_TYPES = {"scopus", "wos", "local"}
ACHIEVEMENT_LEVELS = {"international", "national", "local"}


def _row_ok(data: dict[str, Any], row_num: int) -> ImportRow:
    return ImportRow(row=row_num, status="ok", data=data)


def _row_warn(data: dict[str, Any], row_num: int, msg: str) -> ImportRow:
    return ImportRow(row=row_num, status="warning", message=msg, data=data)


def _row_err(row_num: int, msg: str) -> ImportRow:
    return ImportRow(row=row_num, status="error", message=msg, data={})


def _detect_sheet_type(sheet_name: str) -> str | None:
    return SHEET_ALIASES.get(sheet_name.strip().lower())


def _get_or_create_time(year: int, semester: int, db: Session) -> int:
    obj = db.query(TimeDim).filter_by(year=year, semester=semester).first()
    if not obj:
        obj = TimeDim(year=year, semester=semester)
        db.add(obj)
        db.flush()
    return obj.id


def _get_or_create_subject(name: str, db: Session) -> int:
    obj = db.query(Subject).filter_by(name=name).first()
    if not obj:
        obj = Subject(name=name)
        db.add(obj)
        db.flush()
    return obj.id


def _get_or_create_group(name: str, db: Session) -> int:
    obj = db.query(Group).filter_by(name=name).first()
    if not obj:
        obj = Group(name=name)
        db.add(obj)
        db.flush()
    return obj.id


def _get_or_create_position(name: str, db: Session) -> int:
    obj = db.query(Position).filter_by(name=name).first()
    if not obj:
        obj = Position(name=name)
        db.add(obj)
        db.flush()
    return obj.id


def _get_or_create_degree(name: str, db: Session) -> int:
    obj = db.query(Degree).filter_by(name=name).first()
    if not obj:
        obj = Degree(name=name)
        db.add(obj)
        db.flush()
    return obj.id


def _parse_teachers(df: pd.DataFrame, db: Session) -> SheetPreview:
    rows: list[ImportRow] = []
    dept_map = {d.name.lower(): d.id for d in db.query(Department).all()}

    for i, raw in df.iterrows():
        row_num = int(i) + 2
        name = str(raw.get("ФИО", "")).strip()
        dept_name = str(raw.get("Кафедра", "")).strip()
        position_str = str(raw.get("Должность", "")).strip()

        if not name or not dept_name or not position_str:
            rows.append(_row_err(row_num, "Обязательные поля: ФИО, Кафедра, Должность"))
            continue

        if dept_name.lower() not in dept_map:
            rows.append(_row_err(row_num, f"Кафедра '{dept_name}' не найдена в БД"))
            continue

        position_id = _get_or_create_position(position_str, db)
        degree_str = str(raw.get("Степень", "") or "").strip()
        degree_id = _get_or_create_degree(degree_str, db) if degree_str else None

        data: dict[str, Any] = {
            "full_name": name,
            "email": str(raw.get("Email", "") or "").strip() or None,
            "position_id": position_id,
            "degree_id": degree_id,
            "department_id": dept_map[dept_name.lower()],
        }
        exists = db.query(Teacher).filter(Teacher.full_name == name).first()
        if exists:
            rows.append(_row_warn(data, row_num, f"Преподаватель '{name}' уже существует"))
        else:
            rows.append(_row_ok(data, row_num))

    valid = sum(1 for r in rows if r.status == "ok")
    warnings = sum(1 for r in rows if r.status == "warning")
    errors = sum(1 for r in rows if r.status == "error")
    return SheetPreview(sheet="Преподаватели", total=len(rows),
                        valid=valid, warnings=warnings, errors=errors, rows=rows)


def _parse_teaching_load(df: pd.DataFrame, db: Session) -> SheetPreview:
    rows: list[ImportRow] = []
    teacher_map = {t.full_name.lower(): t.id for t in db.query(Teacher).all()}

    for i, raw in df.iterrows():
        row_num = int(i) + 2
        name = str(raw.get("ФИО", "")).strip()
        subject_str = str(raw.get("Предмет", "")).strip()
        group_str = str(raw.get("Группа", "")).strip()
        try:
            hours = int(float(raw.get("Часы", 0) or 0))
            year = int(raw.get("Год", 0) or 0)
            semester = int(raw.get("Семестр", 1) or 1)
        except (ValueError, TypeError):
            rows.append(_row_err(row_num, "Часы, Год, Семестр должны быть числами"))
            continue

        if not name or not subject_str or not group_str or not hours or not year:
            rows.append(_row_err(row_num, "Обязательные поля: ФИО, Предмет, Группа, Часы, Год"))
            continue

        if name.lower() not in teacher_map:
            rows.append(_row_err(row_num, f"ФИО '{name}' не найден в БД"))
            continue

        time_id = _get_or_create_time(year, semester, db)
        subject_id = _get_or_create_subject(subject_str, db)
        group_id = _get_or_create_group(group_str, db)

        data: dict[str, Any] = {
            "teacher_id": teacher_map[name.lower()],
            "subject_id": subject_id,
            "group_id": group_id,
            "time_id": time_id,
            "hours": hours,
        }
        rows.append(_row_ok(data, row_num))

    valid = sum(1 for r in rows if r.status == "ok")
    warnings = sum(1 for r in rows if r.status == "warning")
    errors = sum(1 for r in rows if r.status == "error")
    return SheetPreview(sheet="Нагрузка", total=len(rows),
                        valid=valid, warnings=warnings, errors=errors, rows=rows)


def _parse_publications(df: pd.DataFrame, db: Session) -> SheetPreview:
    rows: list[ImportRow] = []
    teacher_map = {t.full_name.lower(): t.id for t in db.query(Teacher).all()}

    for i, raw in df.iterrows():
        row_num = int(i) + 2
        name = str(raw.get("ФИО", "")).strip()
        title = str(raw.get("Название", "")).strip()
        pub_type = str(raw.get("Тип", "")).strip().lower()
        try:
            year = int(raw.get("Год", 0) or 0)
            semester = int(raw.get("Семестр", 1) or 1)
        except (ValueError, TypeError):
            rows.append(_row_err(row_num, "Год должен быть числом"))
            continue

        if not name or not title or not pub_type or not year:
            rows.append(_row_err(row_num, "Обязательные поля: ФИО, Название, Тип, Год"))
            continue
        if name.lower() not in teacher_map:
            rows.append(_row_err(row_num, f"ФИО '{name}' не найден в БД"))
            continue
        if pub_type not in PUBLICATION_TYPES:
            rows.append(_row_err(row_num, f"Тип '{pub_type}' должен быть: scopus, wos, local"))
            continue

        time_id = _get_or_create_time(year, semester, db)
        quartile = str(raw.get("Квартиль", "") or "").strip() or None
        data: dict[str, Any] = {
            "teacher_id": teacher_map[name.lower()],
            "time_id": time_id,
            "title": title,
            "type": pub_type,
            "quartile": quartile,
        }
        rows.append(_row_ok(data, row_num))

    valid = sum(1 for r in rows if r.status == "ok")
    warnings = sum(1 for r in rows if r.status == "warning")
    errors = sum(1 for r in rows if r.status == "error")
    return SheetPreview(sheet="Публикации", total=len(rows),
                        valid=valid, warnings=warnings, errors=errors, rows=rows)


def _parse_patents(df: pd.DataFrame, db: Session) -> SheetPreview:
    rows: list[ImportRow] = []
    teacher_map = {t.full_name.lower(): t.id for t in db.query(Teacher).all()}

    for i, raw in df.iterrows():
        row_num = int(i) + 2
        name = str(raw.get("ФИО", "")).strip()
        title = str(raw.get("Название", "")).strip()
        number = str(raw.get("Номер", "")).strip()
        try:
            year = int(raw.get("Год", 0) or 0)
            semester = int(raw.get("Семестр", 1) or 1)
        except (ValueError, TypeError):
            rows.append(_row_err(row_num, "Год должен быть числом"))
            continue

        if not name or not title or not year:
            rows.append(_row_err(row_num, "Обязательные поля: ФИО, Название, Год"))
            continue
        if name.lower() not in teacher_map:
            rows.append(_row_err(row_num, f"ФИО '{name}' не найден в БД"))
            continue

        time_id = _get_or_create_time(year, semester, db)
        data: dict[str, Any] = {
            "teacher_id": teacher_map[name.lower()],
            "time_id": time_id,
            "title": title,
            "registration_number": number or None,
        }
        rows.append(_row_ok(data, row_num))

    valid = sum(1 for r in rows if r.status == "ok")
    warnings = sum(1 for r in rows if r.status == "warning")
    errors = sum(1 for r in rows if r.status == "error")
    return SheetPreview(sheet="Патенты", total=len(rows),
                        valid=valid, warnings=warnings, errors=errors, rows=rows)


def _parse_achievements(df: pd.DataFrame, db: Session) -> SheetPreview:
    rows: list[ImportRow] = []
    teacher_map = {t.full_name.lower(): t.id for t in db.query(Teacher).all()}

    for i, raw in df.iterrows():
        row_num = int(i) + 2
        name = str(raw.get("ФИО", "")).strip()
        title = str(raw.get("Название", "")).strip()
        level = str(raw.get("Уровень", "")).strip().lower()
        try:
            year = int(raw.get("Год", 0) or 0)
            semester = int(raw.get("Семестр", 1) or 1)
        except (ValueError, TypeError):
            rows.append(_row_err(row_num, "Год должен быть числом"))
            continue

        if not name or not title or not level or not year:
            rows.append(_row_err(row_num, "Обязательные поля: ФИО, Название, Уровень, Год"))
            continue
        if name.lower() not in teacher_map:
            rows.append(_row_err(row_num, f"ФИО '{name}' не найден в БД"))
            continue
        if level not in ACHIEVEMENT_LEVELS:
            rows.append(_row_err(row_num, f"Уровень '{level}' должен быть: international, national, local"))
            continue

        time_id = _get_or_create_time(year, semester, db)
        data: dict[str, Any] = {
            "teacher_id": teacher_map[name.lower()],
            "time_id": time_id,
            "title": title,
            "level": level,
        }
        rows.append(_row_ok(data, row_num))

    valid = sum(1 for r in rows if r.status == "ok")
    warnings = sum(1 for r in rows if r.status == "warning")
    errors = sum(1 for r in rows if r.status == "error")
    return SheetPreview(sheet="Достижения", total=len(rows),
                        valid=valid, warnings=warnings, errors=errors, rows=rows)


def _parse_date(value: str) -> date_type | None:
    if not value:
        return None
    for fmt in ("%Y-%m-%d", "%d.%m.%Y", "%d/%m/%Y"):
        try:
            import datetime
            return datetime.datetime.strptime(value, fmt).date()
        except ValueError:
            continue
    return None


def _parse_projects(df: pd.DataFrame, db: Session) -> SheetPreview:
    rows: list[ImportRow] = []
    teacher_map = {t.full_name.lower(): t.id for t in db.query(Teacher).all()}

    for i, raw in df.iterrows():
        row_num = int(i) + 2
        name = str(raw.get("ФИО", "")).strip()
        title = str(raw.get("Название", "")).strip()
        source = str(raw.get("Источник финансирования", "")).strip()
        start_str = str(raw.get("Дата начала", "")).strip()

        try:
            budget_raw = str(raw.get("Бюджет", "") or "").strip()
            budget = Decimal(budget_raw) if budget_raw else None
        except InvalidOperation:
            rows.append(_row_err(row_num, "Бюджет должен быть числом"))
            continue

        try:
            year = int(raw.get("Год", 0) or 0)
            semester = int(raw.get("Семестр", 1) or 1)
        except (ValueError, TypeError):
            year, semester = 0, 1

        if not name or not title or not source or not start_str:
            rows.append(_row_err(row_num, "Обязательные поля: ФИО, Название, Источник финансирования, Дата начала"))
            continue
        if name.lower() not in teacher_map:
            rows.append(_row_err(row_num, f"ФИО '{name}' не найден в БД"))
            continue

        start_date = _parse_date(start_str)
        if not year and start_date:
            year = start_date.year
        if not year:
            rows.append(_row_err(row_num, "Укажите Год или корректную Дату начала"))
            continue

        time_id = _get_or_create_time(year, semester, db)
        end_date = _parse_date(str(raw.get("Дата конца", "") or "").strip())
        data: dict[str, Any] = {
            "teacher_id": teacher_map[name.lower()],
            "time_id": time_id,
            "title": title,
            "funding_source": source,
            "budget": str(budget) if budget is not None else None,
            "start_date": str(start_date) if start_date else None,
            "end_date": str(end_date) if end_date else None,
        }
        rows.append(_row_ok(data, row_num))

    valid = sum(1 for r in rows if r.status == "ok")
    warnings = sum(1 for r in rows if r.status == "warning")
    errors = sum(1 for r in rows if r.status == "error")
    return SheetPreview(sheet="Проекты", total=len(rows),
                        valid=valid, warnings=warnings, errors=errors, rows=rows)


PARSERS = {
    "teachers": _parse_teachers,
    "teaching_load": _parse_teaching_load,
    "publications": _parse_publications,
    "patents": _parse_patents,
    "achievements": _parse_achievements,
    "projects": _parse_projects,
}


def parse_excel(file_bytes: bytes, db: Session) -> list[SheetPreview]:
    xls = pd.ExcelFile(BytesIO(file_bytes), engine="openpyxl")
    results = []
    for sheet_name in xls.sheet_names:
        sheet_type = _detect_sheet_type(sheet_name)
        if sheet_type and sheet_type in PARSERS:
            df = xls.parse(sheet_name, dtype=str).fillna("")
            results.append(PARSERS[sheet_type](df, db))
    return results


def commit_import(sheets: list[SheetPreview], db: Session) -> tuple[int, int, list[str]]:
    imported = 0
    skipped = 0
    details = []

    for sheet in sheets:
        sheet_type = _detect_sheet_type(sheet.sheet)
        for row in sheet.rows:
            if row.status == "error":
                skipped += 1
                continue
            try:
                _write_row(sheet_type, row.data, db)
                imported += 1
            except Exception as e:
                skipped += 1
                details.append(f"Строка {row.row} ({sheet.sheet}): {e}")

    db.commit()
    return imported, skipped, details


def _write_row(sheet_type: str | None, data: dict, db: Session) -> None:
    if sheet_type == "teachers":
        if not db.query(Teacher).filter(Teacher.full_name == data["full_name"]).first():
            db.add(Teacher(
                full_name=data["full_name"],
                email=data.get("email"),
                position_id=data.get("position_id"),
                degree_id=data.get("degree_id"),
                department_id=data.get("department_id"),
            ))
    elif sheet_type == "teaching_load":
        db.add(TeachingLoad(
            teacher_id=data["teacher_id"],
            subject_id=data["subject_id"],
            group_id=data["group_id"],
            time_id=data["time_id"],
            hours=data["hours"],
        ))
    elif sheet_type == "publications":
        db.add(Publication(
            teacher_id=data["teacher_id"],
            time_id=data["time_id"],
            title=data["title"],
            type=data["type"],
            quartile=data.get("quartile"),
        ))
    elif sheet_type == "patents":
        db.add(Patent(
            teacher_id=data["teacher_id"],
            time_id=data["time_id"],
            title=data["title"],
            registration_number=data.get("registration_number"),
        ))
    elif sheet_type == "achievements":
        db.add(Achievement(
            teacher_id=data["teacher_id"],
            time_id=data["time_id"],
            title=data["title"],
            level=data["level"],
        ))
    elif sheet_type == "projects":
        import datetime
        start = datetime.date.fromisoformat(data["start_date"]) if data.get("start_date") else None
        end = datetime.date.fromisoformat(data["end_date"]) if data.get("end_date") else None
        db.add(Project(
            teacher_id=data["teacher_id"],
            time_id=data["time_id"],
            title=data["title"],
            funding_source=data.get("funding_source"),
            budget=Decimal(data["budget"]) if data.get("budget") else None,
            start_date=start,
            end_date=end,
        ))
