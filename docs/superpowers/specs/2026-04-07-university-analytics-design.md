# University Department Analytics Platform — Design Spec
**Date:** 2026-04-07  
**Approach:** Iterative by layers (DB → Backend → Frontend → ETL)  
**Stack:** React + MUI + FastAPI + PostgreSQL + Pandas + Power BI  
**Setup:** Local (no Docker)

---

## 1. Architecture Overview

Build in 4 layers, each fully working before moving to the next:

```
Layer 1: Database      — PostgreSQL schema, seed data, Alembic migrations
Layer 2: Backend       — FastAPI, SQLAlchemy ORM, JWT auth, KPI engine
Layer 3: Frontend      — React + MUI, Axios, Zustand, MUI X Charts
Layer 4: ETL           — Pandas pipeline, CSV/Excel export for Power BI
```

**Readiness criterion per layer:** each layer can be started and tested independently (psql for DB, Swagger UI for backend, browser for frontend).

---

## 2. Database Schema (15 tables)

Full DBML source: [`database/schema.dbml`](../../../database/schema.dbml)

### Dimensions (Lookup Tables)

**`positions`** — `id, name`  
**`degrees`** — `id, name`  
**`departments`** — `id, name`  
**`time_dim`** — `id, year, semester, quarter`

### Auth

**`users`**
```
id, teacher_id (FK → teachers), email, password_hash, role
```
Roles: `admin`, `teacher`.

### Core Entity

**`teachers`**
```
id, full_name, email,
position_id (FK → positions),
degree_id   (FK → degrees),
department_id (FK → departments),
created_at
```

### Academic Activities

**`subjects`** — `id, name`  
**`groups`** — `id, name, education_level`

**`teaching_load`**
```
id, teacher_id, subject_id, group_id, time_id, hours
```

### Research Activity

**`publications`**
```
id, teacher_id, time_id, title, type (Scopus|WoS|local), quartile (Q1–Q4)
```

**`patents`**
```
id, teacher_id, time_id, title, registration_number
```

**`achievements`**
```
id, teacher_id, time_id, title, level (international|national|local)
```

**`projects`**
```
id, teacher_id, time_id, title, funding_source, budget, start_date, end_date
```

### KPI System

**`kpi_scores`**
```
id, teacher_id, time_id,
teaching_score, research_score, project_score, achievement_score, total_score
```

**`kpi_details`**
```
id, teacher_id, time_id,
category (teaching|research|project), metric_name, value, score
```

**KPI Weights:**
| Category     | Weight | Score field       |
|--------------|--------|-------------------|
| Teaching     | 30%    | teaching_score    |
| Research     | 35%    | research_score    |
| Projects     | 15%    | project_score     |
| Achievements | 20%    | achievement_score |

---

## 3. Backend API (FastAPI)

### Auth
```
POST /auth/login         — returns JWT token (email + password)
```
All other routes require `Authorization: Bearer <token>`.  
Roles: `admin` (full access), `teacher` (own data only).

### Endpoints per resource

| Resource        | Endpoints |
|-----------------|-----------|
| positions       | GET /, POST / |
| degrees         | GET /, POST / |
| departments     | GET /, POST / |
| subjects        | GET /, POST / |
| groups          | GET /, POST / |
| time_dim        | GET /, POST / |
| teachers        | GET /, POST /, GET /{id}, PUT /{id} |
| teaching_load   | GET /, POST /, PUT /{id}, DELETE /{id} |
| publications    | GET /, POST /, PUT /{id}, DELETE /{id} |
| projects        | GET /, POST /, PUT /{id}, DELETE /{id} |
| patents         | GET /, POST /, PUT /{id}, DELETE /{id} |
| achievements    | GET /, POST /, PUT /{id}, DELETE /{id} |
| kpi             | GET /scores, GET /details, POST /calculate, GET /summary |
| users           | GET /, POST /, PUT /{id} (admin only) |

All activity list endpoints support `teacher_id` and `time_id` query filters.

### KPI Engine (`services/kpi_engine.py`)
- Triggered by `POST /kpi/calculate?year=2024&semester=1`
- Reads all activity tables for the period via SQLAlchemy
- Aggregates into Pandas DataFrames per teacher
- Computes per-metric raw values → writes to `kpi_details`
- Normalizes scores (0–100), applies weights → writes to `kpi_scores`

### File structure
```
backend/
  main.py
  database.py
  models/         — one file per table
  routers/        — one file per resource
  schemas/        — Pydantic request/response schemas
  services/
    kpi_engine.py
  auth/
    jwt.py
  requirements.txt
```

---

## 4. Frontend (React + MUI)

### Pages
| Route              | Description |
|--------------------|-------------|
| /login             | Login form, stores JWT in localStorage |
| /dashboard         | KPI bar chart by teacher, stat cards, period selector |
| /teachers          | MUI DataGrid, filter by department |
| /teachers/:id      | Teacher profile: all activities + KPI history chart |
| /teaching-load     | Table with teacher/subject/group/period filters |
| /publications      | Publications table + add form |
| /projects          | Projects table + add form |
| /patents           | Patents table + add form |
| /achievements      | Achievements table + add form |
| /kpi               | KPI scores table + details drawer + "Recalculate" button |
| /reports           | Export to CSV/Excel |

### Reusable Components
- `Sidebar` — navigation drawer
- `KPIChart` — MUI X Charts bar chart (KPI by teacher)
- `TeacherTable` — MUI DataGrid with pagination and filters
- `StatCard` — numeric summary card for Dashboard
- `PeriodSelector` — year + semester dropdown

### State Management
Zustand stores: `authStore`, `teacherStore`, `kpiStore`, `filterStore`

### API Client
Axios instance with JWT interceptor (`src/api/client.js`).  
One file per resource: `src/api/teachers.js`, `src/api/kpi.js`, etc.

---

## 5. ETL Pipeline (Pandas)

```
etl/
  pipeline.py              — orchestrator: python pipeline.py --year 2024 --semester 1
  transformers/
    kpi_aggregator.py      — reads from DB, computes KPI, writes to kpi_scores + kpi_details
    analytics_builder.py   — builds summary DataFrames for Power BI export
  exports/                 — output CSV/Excel files
```

**Pipeline steps:**
1. Connect to PostgreSQL via SQLAlchemy
2. Load activity tables into Pandas DataFrames
3. Aggregate per teacher for the specified period
4. Normalize scores (0–100) and apply weights
5. Write results to `kpi_scores` and `kpi_details` tables
6. Export summary CSV/Excel to `exports/`

**Power BI:** connects directly to PostgreSQL OR reads from `exports/` CSV — both supported.

---

## 6. Environment Variables

```env
DATABASE_URL=postgresql://postgres:password@localhost:5432/university_analytics
SECRET_KEY=your-jwt-secret-key-here
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30
```

---

## 7. Implementation Order

1. **DB** — `schema.sql` (15 tables), `seed.sql`, Alembic setup
2. **Backend** — models → schemas → routers → KPI engine → auth
3. **Frontend** — auth → layout → teachers → activities → dashboard → KPI → reports
4. **ETL** — pipeline → transformers → exports
