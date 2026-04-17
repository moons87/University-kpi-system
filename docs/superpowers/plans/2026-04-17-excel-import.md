# Excel Import Pipeline Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Allow admin and advisor users to upload `.xlsx` files via the web UI, preview validated rows with color-coded errors, and confirm import into PostgreSQL.

**Architecture:** Two FastAPI endpoints (`/import/preview` and `/import/confirm`) parse and write Excel data using pandas/openpyxl. React page with drag-and-drop uploader shows a color-coded preview table before final confirmation.

**Tech Stack:** FastAPI, pandas, openpyxl, SQLAlchemy 2.0, React, Material UI, axios

---

## File Map

**Backend — create:**
- `backend/routers/import_data.py` — `/import/preview` and `/import/confirm` endpoints
- `backend/services/import_service.py` — Excel parsing, validation, bulk DB write
- `backend/schemas/import_schemas.py` — Pydantic response models

**Backend — modify:**
- `backend/requirements.txt` — add `openpyxl==3.1.2`
- `backend/main.py` — register `import_data` router

**Frontend — create:**
- `frontend/src/api/import.js` — axios calls for preview and confirm
- `frontend/src/pages/ImportPage.js` — main import page
- `frontend/src/components/ImportUploader.js` — drag & drop file zone
- `frontend/src/components/ImportPreviewTable.js` — color-coded preview table
- `frontend/src/components/ImportSummary.js` — stats badge after import

**Frontend — modify:**
- `frontend/src/App.js` — add `/import` route
- `frontend/src/components/Sidebar.jsx` — add "Импорт" nav item

---

## Task 1: Add openpyxl and create Pydantic schemas

**Files:**
- Modify: `backend/requirements.txt`
- Create: `backend/schemas/import_schemas.py`

- [ ] **Step 1: Add openpyxl to requirements**

Open `backend/requirements.txt` and add this line at the end:
```
openpyxl==3.1.2
```

- [ ] **Step 2: Create import schemas**

Create `backend/schemas/import_schemas.py`:

```python
from pydantic import BaseModel
from typing import Any, List, Literal, Optional


class ImportRow(BaseModel):
    row: int
    status: Literal["ok", "warning", "error"]
    message: Optional[str] = None
    data: dict[str, Any] = {}


class SheetPreview(BaseModel):
    sheet: str
    total: int
    valid: int
    warnings: int
    errors: int
    rows: List[ImportRow]


class PreviewResponse(BaseModel):
    sheets: List[SheetPreview]


class ConfirmResponse(BaseModel):
    imported: int
    skipped: int
    details: List[str]
```

- [ ] **Step 3: Commit**

```bash
git add backend/requirements.txt backend/schemas/import_schemas.py
git commit -m "feat: add openpyxl dependency and import schemas"
```

---

## Task 2: Create import service (parsing + validation)

**Files:**
- Create: `backend/services/import_service.py`

- [ ] **Step 1: Create the service file**

Create `backend/services/import_service.py`:

```python
from io import BytesIO
from typing import Any
import pandas as pd
from sqlalchemy.orm import Session
from models import Teacher, Department, TimeDim, TeachingLoad, Publication, Patent, Achievement, Project
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

        data = {"teacher_id": teacher_map[name.lower()], "registration_number": number, "year": year}
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
            pub_type=data["pub_type"],
            year=data["year"],
            quartile=data.get("quartile"),
        ))
    elif sheet_type == "patents":
        db.add(Patent(
            teacher_id=data["teacher_id"],
            registration_number=data["registration_number"],
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
            funding_source=data["funding_source"],
            budget=data["budget"],
        ))
```

- [ ] **Step 2: Commit**

```bash
git add backend/services/import_service.py
git commit -m "feat: add Excel import service with validation"
```

---

## Task 3: Create import router and register it

**Files:**
- Create: `backend/routers/import_data.py`
- Modify: `backend/main.py`

- [ ] **Step 1: Create the router**

Create `backend/routers/import_data.py`:

```python
from fastapi import APIRouter, Depends, File, HTTPException, UploadFile
from sqlalchemy.orm import Session
from database import get_db
from auth.jwt import require_advisor_or_admin
from models import User
from schemas.import_schemas import ConfirmResponse, PreviewResponse
from services.import_service import commit_import, parse_excel
from pydantic import BaseModel
from typing import Any

router = APIRouter(prefix="/import", tags=["import"])


class ConfirmRequest(BaseModel):
    sheets: list[dict[str, Any]]


@router.post("/preview", response_model=PreviewResponse)
async def preview_import(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    _: User = Depends(require_advisor_or_admin),
):
    if not file.filename.endswith(".xlsx"):
        raise HTTPException(status_code=400, detail="Только .xlsx файлы поддерживаются")
    content = await file.read()
    sheets = parse_excel(content, db)
    if not sheets:
        raise HTTPException(status_code=422, detail="Не найдено ни одного распознанного листа")
    return PreviewResponse(sheets=sheets)


@router.post("/confirm", response_model=ConfirmResponse)
async def confirm_import(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    _: User = Depends(require_advisor_or_admin),
):
    if not file.filename.endswith(".xlsx"):
        raise HTTPException(status_code=400, detail="Только .xlsx файлы поддерживаются")
    content = await file.read()
    sheets = parse_excel(content, db)
    imported, skipped, details = commit_import(sheets, db)
    return ConfirmResponse(imported=imported, skipped=skipped, details=details)
```

- [ ] **Step 2: Register router in main.py**

Open `backend/main.py`. Find the imports block:

```python
from routers import (
    auth, positions, degrees, departments, time_dim,
    teachers, subjects, groups,
    teaching_load, publications, patents, achievements, projects,
    kpi, kpi_settings, students,
)
```

Change it to:

```python
from routers import (
    auth, positions, degrees, departments, time_dim,
    teachers, subjects, groups,
    teaching_load, publications, patents, achievements, projects,
    kpi, kpi_settings, students, import_data,
)
```

Then find `app.include_router(students.router)` and add after it:

```python
app.include_router(import_data.router)
```

- [ ] **Step 3: Commit**

```bash
git add backend/routers/import_data.py backend/main.py
git commit -m "feat: add import router and register endpoints"
```

---

## Task 4: Frontend API module

**Files:**
- Create: `frontend/src/api/import.js`

- [ ] **Step 1: Create the API module**

Create `frontend/src/api/import.js`:

```javascript
import client from './client';

export const previewImport = (file) => {
  const form = new FormData();
  form.append('file', file);
  return client.post('/import/preview', form, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }).then((r) => r.data);
};

export const confirmImport = (file) => {
  const form = new FormData();
  form.append('file', file);
  return client.post('/import/confirm', form, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }).then((r) => r.data);
};
```

- [ ] **Step 2: Commit**

```bash
git add frontend/src/api/import.js
git commit -m "feat: add import API module"
```

---

## Task 5: ImportUploader component

**Files:**
- Create: `frontend/src/components/ImportUploader.js`

- [ ] **Step 1: Create the component**

Create `frontend/src/components/ImportUploader.js`:

```jsx
import { useRef, useState } from 'react';
import { Box, Button, Typography } from '@mui/material';
import UploadFileIcon from '@mui/icons-material/UploadFile';

export default function ImportUploader({ onFile, loading }) {
  const inputRef = useRef();
  const [dragging, setDragging] = useState(false);

  const handle = (file) => {
    if (file && file.name.endsWith('.xlsx')) onFile(file);
  };

  return (
    <Box
      onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
      onDragLeave={() => setDragging(false)}
      onDrop={(e) => { e.preventDefault(); setDragging(false); handle(e.dataTransfer.files[0]); }}
      onClick={() => inputRef.current.click()}
      sx={{
        border: '2px dashed',
        borderColor: dragging ? 'primary.main' : 'divider',
        borderRadius: 2,
        p: 6,
        textAlign: 'center',
        cursor: 'pointer',
        bgcolor: dragging ? 'rgba(176,125,42,0.05)' : 'background.paper',
        transition: 'all 0.15s',
        '&:hover': { borderColor: 'primary.main', bgcolor: 'rgba(176,125,42,0.03)' },
      }}
    >
      <input
        ref={inputRef}
        type="file"
        accept=".xlsx"
        style={{ display: 'none' }}
        onChange={(e) => handle(e.target.files[0])}
      />
      <UploadFileIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 1 }} />
      <Typography variant="body1" color="text.secondary">
        Перетащите .xlsx файл сюда или нажмите для выбора
      </Typography>
      <Typography variant="body2" color="text.disabled" mt={0.5}>
        Поддерживается один файл с листами: Преподаватели, Нагрузка, Публикации, Патенты, Проекты, Достижения
      </Typography>
      {loading && (
        <Typography variant="body2" color="primary" mt={1}>Загрузка...</Typography>
      )}
    </Box>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add frontend/src/components/ImportUploader.js
git commit -m "feat: add ImportUploader drag-and-drop component"
```

---

## Task 6: ImportPreviewTable component

**Files:**
- Create: `frontend/src/components/ImportPreviewTable.js`

- [ ] **Step 1: Create the component**

Create `frontend/src/components/ImportPreviewTable.js`:

```jsx
import {
  Accordion, AccordionDetails, AccordionSummary,
  Box, Chip, Table, TableBody, TableCell,
  TableHead, TableRow, Typography,
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';

const STATUS_COLOR = { ok: 'success', warning: 'warning', error: 'error' };
const STATUS_LABEL = { ok: 'OK', warning: 'Предупреждение', error: 'Ошибка' };

function SheetTable({ sheet }) {
  return (
    <Accordion defaultExpanded>
      <AccordionSummary expandIcon={<ExpandMoreIcon />}>
        <Typography fontWeight={600} mr={2}>{sheet.sheet}</Typography>
        <Chip label={`✅ ${sheet.valid}`} color="success" size="small" sx={{ mr: 0.5 }} />
        <Chip label={`⚠️ ${sheet.warnings}`} color="warning" size="small" sx={{ mr: 0.5 }} />
        <Chip label={`❌ ${sheet.errors}`} color="error" size="small" />
      </AccordionSummary>
      <AccordionDetails sx={{ p: 0 }}>
        <Table size="small">
          <TableHead>
            <TableRow sx={{ bgcolor: '#f8fafc' }}>
              <TableCell width={60}>Строка</TableCell>
              <TableCell width={140}>Статус</TableCell>
              <TableCell>Сообщение / Данные</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {sheet.rows.map((row) => (
              <TableRow
                key={row.row}
                sx={{
                  bgcolor:
                    row.status === 'error'   ? 'rgba(220,38,38,0.05)'  :
                    row.status === 'warning' ? 'rgba(217,119,6,0.05)'  : 'transparent',
                }}
              >
                <TableCell>{row.row}</TableCell>
                <TableCell>
                  <Chip
                    label={STATUS_LABEL[row.status]}
                    color={STATUS_COLOR[row.status]}
                    size="small"
                    variant="outlined"
                  />
                </TableCell>
                <TableCell sx={{ fontSize: '0.8rem', color: '#64748b' }}>
                  {row.message || JSON.stringify(row.data)}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </AccordionDetails>
    </Accordion>
  );
}

export default function ImportPreviewTable({ preview }) {
  if (!preview) return null;
  return (
    <Box mt={3}>
      {preview.sheets.map((sheet) => (
        <SheetTable key={sheet.sheet} sheet={sheet} />
      ))}
    </Box>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add frontend/src/components/ImportPreviewTable.js
git commit -m "feat: add ImportPreviewTable color-coded component"
```

---

## Task 7: ImportSummary component

**Files:**
- Create: `frontend/src/components/ImportSummary.js`

- [ ] **Step 1: Create the component**

Create `frontend/src/components/ImportSummary.js`:

```jsx
import { Alert, Box, Typography } from '@mui/material';

export default function ImportSummary({ result }) {
  if (!result) return null;
  return (
    <Box mt={2}>
      <Alert severity={result.skipped > 0 ? 'warning' : 'success'}>
        <Typography variant="body2">
          Импортировано: <strong>{result.imported}</strong> записей.
          Пропущено: <strong>{result.skipped}</strong>.
        </Typography>
        {result.details.length > 0 && (
          <Box mt={1} component="ul" sx={{ pl: 2, m: 0 }}>
            {result.details.map((d, i) => (
              <li key={i}><Typography variant="body2">{d}</Typography></li>
            ))}
          </Box>
        )}
      </Alert>
    </Box>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add frontend/src/components/ImportSummary.js
git commit -m "feat: add ImportSummary result component"
```

---

## Task 8: ImportPage

**Files:**
- Create: `frontend/src/pages/ImportPage.js`

- [ ] **Step 1: Create the page**

Create `frontend/src/pages/ImportPage.js`:

```jsx
import { useState } from 'react';
import { Box, Button, Typography, Stack } from '@mui/material';
import ImportUploader from '../components/ImportUploader';
import ImportPreviewTable from '../components/ImportPreviewTable';
import ImportSummary from '../components/ImportSummary';
import { previewImport, confirmImport } from '../api/import';

export default function ImportPage() {
  const [file, setFile]       = useState(null);
  const [preview, setPreview] = useState(null);
  const [result, setResult]   = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState(null);

  const totalImportable = preview
    ? preview.sheets.reduce((sum, s) => sum + s.valid + s.warnings, 0)
    : 0;

  const handleFile = async (f) => {
    setFile(f);
    setPreview(null);
    setResult(null);
    setError(null);
    setLoading(true);
    try {
      const data = await previewImport(f);
      setPreview(data);
    } catch (e) {
      setError(e.response?.data?.detail || 'Ошибка при загрузке файла');
    } finally {
      setLoading(false);
    }
  };

  const handleConfirm = async () => {
    if (!file) return;
    setLoading(true);
    setError(null);
    try {
      const data = await confirmImport(file);
      setResult(data);
      setPreview(null);
      setFile(null);
    } catch (e) {
      setError(e.response?.data?.detail || 'Ошибка при импорте');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setFile(null);
    setPreview(null);
    setResult(null);
    setError(null);
  };

  return (
    <Box>
      <Typography variant="h5" mb={3}>Импорт данных</Typography>

      {!preview && !result && (
        <ImportUploader onFile={handleFile} loading={loading} />
      )}

      {error && (
        <Typography color="error" mt={2}>{error}</Typography>
      )}

      {preview && (
        <>
          <ImportPreviewTable preview={preview} />
          <Stack direction="row" spacing={2} mt={3}>
            <Button variant="outlined" onClick={handleReset} disabled={loading}>
              Отмена
            </Button>
            <Button
              variant="contained"
              onClick={handleConfirm}
              disabled={loading || totalImportable === 0}
            >
              Импортировать {totalImportable} строк
            </Button>
          </Stack>
        </>
      )}

      <ImportSummary result={result} />

      {result && (
        <Button variant="outlined" onClick={handleReset} sx={{ mt: 2 }}>
          Загрузить ещё файл
        </Button>
      )}
    </Box>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add frontend/src/pages/ImportPage.js
git commit -m "feat: add ImportPage with preview and confirm flow"
```

---

## Task 9: Wire up route and sidebar

**Files:**
- Modify: `frontend/src/App.js`
- Modify: `frontend/src/components/Sidebar.jsx`

- [ ] **Step 1: Add route to App.js**

Open `frontend/src/App.js`. Add the import after the last page import:

```javascript
import ImportPage from './pages/ImportPage';
```

Find `<Route path="/settings" .../>` and add after it:

```jsx
<Route path="/import" element={<AppLayout><ImportPage /></AppLayout>} />
```

- [ ] **Step 2: Add sidebar nav item**

Open `frontend/src/components/Sidebar.jsx`. Add this import at the top with the other icon imports:

```javascript
import FileUploadIcon from '@mui/icons-material/FileUpload';
```

Find the `NAV` array. Add this entry after the `Студенты` entry:

```javascript
{ label: 'Импорт', icon: FileUploadIcon, path: '/import', group: 'data', advisorVisible: true },
```

- [ ] **Step 3: Commit**

```bash
git add frontend/src/App.js frontend/src/components/Sidebar.jsx
git commit -m "feat: add /import route and sidebar nav entry"
```

---

## Task 10: Install openpyxl and smoke test

- [ ] **Step 1: Install openpyxl in backend**

```bash
cd backend
pip install openpyxl==3.1.2
```

- [ ] **Step 2: Start backend and verify endpoints exist**

```bash
uvicorn main:app --reload --port 8000
```

Open `http://localhost:8000/docs` in a browser. Confirm you see:
- `POST /import/preview`
- `POST /import/confirm`

- [ ] **Step 3: Start frontend and verify page loads**

```bash
cd frontend
npm start
```

Navigate to `http://localhost:3000/import` while logged in as admin or advisor. Confirm:
- Upload zone is visible
- Sidebar shows "Импорт" item
- Teacher-role user does NOT see the sidebar item

- [ ] **Step 4: Manual end-to-end test**

Create a test file `test_import.xlsx` with one sheet named `Преподаватели` and columns `ФИО`, `Кафедра`, `Должность`. Add 2 valid rows and 1 row with an empty `Кафедра`.

Upload the file on `/import`. Verify:
- Preview shows 2 green rows and 1 red row
- Confirm button says "Импортировать 2 строк"
- After confirm, success banner appears
- Records appear in the database

- [ ] **Step 5: Final commit**

```bash
git add -A
git commit -m "feat: complete Excel import pipeline"
```
