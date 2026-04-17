from io import BytesIO
from typing import Any
import pandas as pd
from sqlalchemy.orm import Session
from models import Teacher, Department, TeachingLoad, Publication, Patent, Achievement, Project
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


def _parse_teachers(df: pd.DataFrame, db: Session) -> SheetPreview:
    rows: list[ImportRow] = []
    dept_map = {d.name.lower(): d.id for d in db.query(Department).all()}

    for i, raw in df.iterrows():
        row_num = int(i) + 2
        name = str(raw.get("ФИО", "")).strip()
        dept_name = str(raw.get("Кафедра", "")).strip()
        position = str(raw.get("Должность", "")).strip()

        if not name or not dept_name or not position:
            rows.append(_row_err(row_num, "Обязательные поля: ФИО, Кафедра, Должность"))
            continue

        if dept_name.lower() not in dept_map:
            rows.append(_row_err(row_num, f"Кафедра '{dept_name}' не найдена в БД"))
            continue

        exists = db.query(Teacher).filter(Teacher.full_name == name).first()
        data = {"full_name": name, "dept_name": dept_name, "position": position,
                "email": str(raw.get("Email", "") or "").strip() or None,
                "degree": str(raw.get("Степень", "") or "").strip() or None,
                "department_id": dept_map[dept_name.lower()]}
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
        subject = str(raw.get("Предмет", "")).strip()
        group = str(raw.get("Группа", "")).strip()
        try:
            hours = float(raw.get("Часы", 0) or 0)
            year = int(raw.get("Год", 0) or 0)
            semester = int(raw.get("Семестр", 0) or 0)
        except (ValueError, TypeError):
            rows.append(_row_err(row_num, "Часы, Год, Семестр должны быть числами"))
            continue

        if not name or not subject or not group or not hours or not year or not semester:
            rows.append(_row_err(row_num, "Обязательные поля: ФИО, Предмет, Группа, Часы, Год, Семестр"))
            continue

        if name.lower() not in teacher_map:
            rows.append(_row_err(row_num, f"ФИО '{name}' не найден в БД"))
            continue

        data = {"teacher_id": teacher_map[name.lower()], "subject": subject,
                "group": group, "hours": hours, "year": year, "semester": semester}
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

        quartile = str(raw.get("Квартиль", "") or "").strip() or None
        data = {"teacher_id": teacher_map[name.lower()], "title": title,
                "pub_type": pub_type, "year": year, "quartile": quartile}
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
        except (ValueError, TypeError):
            rows.append(_row_err(row_num, "Год должен быть числом"))
            continue

        if not name or not number or not year:
            rows.append(_row_err(row_num, "Обязательные поля: ФИО, Номер, Год"))
            continue
        if name.lower() not in teacher_map:
            rows.append(_row_err(row_num, f"ФИО '{name}' не найден в БД"))
            continue

        data = {"teacher_id": teacher_map[name.lower()], "title": title,
                "registration_number": number, "year": year}
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

        data = {"teacher_id": teacher_map[name.lower()], "title": title, "level": level, "year": year}
        rows.append(_row_ok(data, row_num))

    valid = sum(1 for r in rows if r.status == "ok")
    warnings = sum(1 for r in rows if r.status == "warning")
    errors = sum(1 for r in rows if r.status == "error")
    return SheetPreview(sheet="Достижения", total=len(rows),
                        valid=valid, warnings=warnings, errors=errors, rows=rows)


def _parse_projects(df: pd.DataFrame, db: Session) -> SheetPreview:
    rows: list[ImportRow] = []
    teacher_map = {t.full_name.lower(): t.id for t in db.query(Teacher).all()}

    for i, raw in df.iterrows():
        row_num = int(i) + 2
        name = str(raw.get("ФИО", "")).strip()
        title = str(raw.get("Название", "")).strip()
        source = str(raw.get("Источник финансирования", "")).strip()
        start_date = str(raw.get("Дата начала", "")).strip()
        try:
            budget = float(raw.get("Бюджет", 0) or 0)
        except (ValueError, TypeError):
            rows.append(_row_err(row_num, "Бюджет должен быть числом"))
            continue

        if not name or not title or not source or not start_date:
            rows.append(_row_err(row_num, "Обязательные поля: ФИО, Название, Источник финансирования, Дата начала"))
            continue
        if name.lower() not in teacher_map:
            rows.append(_row_err(row_num, f"ФИО '{name}' не найден в БД"))
            continue

        end_date = str(raw.get("Дата конца", "") or "").strip() or None
        data = {"teacher_id": teacher_map[name.lower()], "title": title, "funding_source": source,
                "budget": budget, "start_date": start_date, "end_date": end_date}
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
        existing = db.query(Teacher).filter(Teacher.full_name == data["full_name"]).first()
        if not existing:
            db.add(Teacher(
                full_name=data["full_name"],
                email=data.get("email"),
                department_id=data.get("department_id"),
            ))
    elif sheet_type == "teaching_load":
        db.add(TeachingLoad(
            teacher_id=data["teacher_id"],
            hours=data["hours"],
        ))
    elif sheet_type == "publications":
        db.add(Publication(
            teacher_id=data["teacher_id"],
            title=data["title"],
            type=data["pub_type"],
            quartile=data.get("quartile"),
        ))
    elif sheet_type == "patents":
        db.add(Patent(
            teacher_id=data["teacher_id"],
            title=data.get("title", ""),
            registration_number=data.get("registration_number"),
        ))
    elif sheet_type == "achievements":
        db.add(Achievement(
            teacher_id=data["teacher_id"],
            title=data["title"],
            level=data["level"],
        ))
    elif sheet_type == "projects":
        db.add(Project(
            teacher_id=data["teacher_id"],
            title=data["title"],
            funding_source=data.get("funding_source"),
            budget=data.get("budget"),
            start_date=data.get("start_date") or None,
            end_date=data.get("end_date") or None,
        ))
