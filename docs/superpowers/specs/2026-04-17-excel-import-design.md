# Excel Import Pipeline — Design Spec
**Date:** 2026-04-17  
**Status:** Approved

---

## Summary

Add an Excel import feature that allows admin and advisor users to upload `.xlsx` files containing teacher data (teachers, teaching load, publications, patents, projects, achievements) through a web UI. Before committing to the database, a preview with row-level validation is shown.

---

## Architecture

### Backend

**New files:**
- `backend/routers/import_data.py` — two endpoints: `/import/preview` and `/import/confirm`
- `backend/services/import_service.py` — Excel parsing, validation, bulk DB write
- `backend/schemas/import_schemas.py` — Pydantic models for request/response

**Endpoints:**

| Method | Path | Description |
|---|---|---|
| POST | `/import/preview` | Accepts `.xlsx`, returns per-row validation result |
| POST | `/import/confirm` | Accepts validated rows, writes to DB via bulk insert |

### Frontend

**New files:**
- `frontend/src/pages/ImportPage.jsx` — main import page
- `frontend/src/components/ImportUploader.jsx` — drag & drop / file picker
- `frontend/src/components/ImportPreviewTable.jsx` — color-coded preview table
- `frontend/src/components/ImportSummary.jsx` — stats after import
- `frontend/src/api/import.js` — axios calls for preview and confirm

---

## Excel File Formats

Two supported structures (auto-detected):

**Multi-sheet (one file):** Sheets named `Преподаватели`, `Нагрузка`, `Публикации`, `Патенты`, `Проекты`, `Достижения`

**Single-sheet (separate files):** Detected by filename: `teachers.xlsx`, `publications.xlsx`, etc.

### Expected Columns

| Type | Required | Optional |
|---|---|---|
| Преподаватели | ФИО, Кафедра, Должность | Степень, Email |
| Нагрузка | ФИО, Предмет, Группа, Часы, Год, Семестр | — |
| Публикации | ФИО, Название, Тип, Год | Квартиль, Семестр |
| Патенты | ФИО, Номер, Год | Семестр |
| Проекты | ФИО, Название, Источник финансирования, Бюджет, Дата начала | Дата конца |
| Достижения | ФИО, Название, Уровень, Год | Семестр |

---

## Validation Rules

| Status | Condition |
|---|---|
| ✅ ok | All required fields valid, no duplicates |
| ⚠️ warning | Duplicate already in DB, or optional field missing |
| ❌ error | Required field empty, ФИО not found in DB, invalid enum value |

`/import/confirm` imports only `ok` and `warning` rows. Error rows are skipped.

### Preview Response Schema

```json
{
  "sheet": "Публикации",
  "total": 50,
  "valid": 44,
  "warnings": 3,
  "errors": 3,
  "rows": [
    {"row": 2, "status": "ok", "data": {}},
    {"row": 5, "status": "error", "message": "ФИО 'Иванов И.И.' не найден в БД"},
    {"row": 9, "status": "warning", "message": "Дубликат публикации"}
  ]
}
```

---

## UI Flow

1. User uploads `.xlsx` → immediate `POST /import/preview`
2. Preview table shown: green (ok), yellow (warning), red (error) rows
3. Summary badge: "44 ready | 3 warnings | 3 errors"
4. User clicks **"Импортировать N строк"** → `POST /import/confirm`
5. Success toast: "Импортировано X записей", form resets

### Access Control

Page visible only to `admin` and `advisor` roles. Added to sidebar navigation.

---

## Dependencies

- `openpyxl` — Excel parsing (add to `backend/requirements.txt`)
- `pandas` — DataFrame-based validation (already implied in project)

---

## Out of Scope

- CSV import
- Column mapping UI (columns must match expected names)
- Rollback of partial imports (errors are skipped, not rolled back)
- ETL KPI recalculation after import (done separately via `/kpi/calculate`)
