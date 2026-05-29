# University Department Analytics Platform
## CLAUDE.md — Project Guide for AI Assistants

---

## Project Overview

This is a **master's thesis-level** full-stack analytics platform for a university department.
It collects, stores, processes, and visualizes data about teachers and calculates KPI scores.

**Stack:** React + FastAPI + PostgreSQL + Pandas ETL + Power BI

---

## Repository Structure

```
university-analytics/
├── CLAUDE.md                    ← you are here
├── ARCHITECTURE.md              ← system architecture
├── backend/
│   ├── main.py                  ← FastAPI entry point
│   ├── database.py              ← SQLAlchemy engine + session
│   ├── models/                  ← ORM models
│   │   ├── __init__.py
│   │   ├── teacher.py
│   │   ├── department.py
│   │   ├── teaching_load.py
│   │   ├── publication.py
│   │   ├── project.py
│   │   ├── grant.py
│   │   ├── award.py
│   │   └── kpi.py
│   ├── routers/                 ← FastAPI route modules
│   │   ├── teachers.py
│   │   ├── departments.py
│   │   ├── teaching_load.py
│   │   ├── publications.py
│   │   ├── projects.py
│   │   ├── grants.py
│   │   ├── awards.py
│   │   └── kpi.py
│   ├── schemas/                 ← Pydantic request/response schemas
│   ├── services/
│   │   └── kpi_engine.py        ← KPI calculation business logic
│   ├── auth/
│   │   └── jwt.py               ← JWT authentication
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── pages/               ← Route-level components
│   │   ├── components/          ← Reusable UI components
│   │   ├── api/                 ← Axios API clients
│   │   └── store/               ← State management
│   └── package.json
├── database/
│   ├── schema.sql               ← Full DDL schema
│   ├── seed.sql                 ← Sample data
│   └── migrations/              ← Alembic migrations
├── etl/
│   ├── pipeline.py              ← Main ETL orchestrator
│   ├── transformers/
│   │   ├── kpi_aggregator.py
│   │   └── analytics_builder.py
│   └── exports/                 ← CSV/Excel exports for Power BI
└── powerbi/
    └── README.md                ← Power BI connection guide
```

---

## Quick Start

```bash
# 1. Database
psql -U postgres -c "CREATE DATABASE university_analytics;"
psql -U postgres -d university_analytics -f database/schema.sql

# 2. Backend
cd backend
pip install -r requirements.txt
uvicorn main:app --reload --port 8000

# 3. Frontend
cd frontend
npm install
npm start

# 4. ETL (run manually or schedule)
cd etl
python pipeline.py --year 2024 --semester 1
```

---

## Key Design Decisions

| Decision | Choice | Reason |
|---|---|---|
| ORM | SQLAlchemy | Alembic migrations, type safety |
| Auth | JWT Bearer | Stateless, scalable |
| KPI storage | Separate `kpi_scores` table | Historical tracking, fast reads |
| ETL | Pandas + SQLAlchemy | Academic standard, readable |
| Power BI | Direct PostgreSQL + CSV export | Dual strategy for reliability |

---

## KPI Weights (configurable)

| Category | Weight |
|---|---|
| Teaching Load | 30% |
| Publications (Scopus/WoS) | 35% |
| Research Projects | 15% |
| Grants | 10% |
| Awards | 10% |

---

## Environment Variables

```env
DATABASE_URL=postgresql://postgres:password@localhost:5432/university_analytics
SECRET_KEY=your-jwt-secret-key-here
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30
```

## Skill routing

When the user's request matches an available skill, invoke it via the Skill tool. When in doubt, invoke the skill.

Key routing rules:
- Product ideas/brainstorming → invoke /office-hours
- Strategy/scope → invoke /plan-ceo-review
- Architecture → invoke /plan-eng-review
- Design system/plan review → invoke /design-consultation or /plan-design-review
- Full review pipeline → invoke /autoplan
- Bugs/errors → invoke /investigate
- QA/testing site behavior → invoke /qa or /qa-only
- Code review/diff check → invoke /review
- Visual polish → invoke /design-review
- Ship/deploy/PR → invoke /ship or /land-and-deploy
- Save progress → invoke /context-save
- Resume context → invoke /context-restore
- Author a backlog-ready spec/issue → invoke /spec
