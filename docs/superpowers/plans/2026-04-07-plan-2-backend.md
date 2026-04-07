# Backend Layer Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a fully working FastAPI backend with SQLAlchemy ORM, JWT authentication, all REST endpoints, and a KPI calculation engine.

**Architecture:** FastAPI app with one router per resource. SQLAlchemy ORM models mirror the database schema. Pydantic schemas handle request/response validation. KPI engine reads activity tables and writes to `kpi_scores` + `kpi_details`. JWT auth protects all routes. Swagger UI at `/docs` is the test interface.

**Tech Stack:** Python 3.11+, FastAPI, SQLAlchemy 2.x, Pydantic v2, python-jose (JWT), passlib (bcrypt), psycopg2, python-dotenv

**Prerequisite:** Plan 1 complete — database `university_analytics` exists and is seeded.

---

## File Map

```
backend/
  main.py                    — FastAPI app, router registration, CORS
  database.py                — SQLAlchemy engine, SessionLocal, Base, get_db()
  .env                       — environment variables (not committed)
  requirements.txt           — all dependencies pinned
  models/
    __init__.py              — re-exports all models
    position.py              — Position ORM model
    degree.py                — Degree ORM model
    department.py            — Department ORM model
    time_dim.py              — TimeDim ORM model
    teacher.py               — Teacher ORM model
    subject.py               — Subject ORM model
    group.py                 — Group ORM model
    teaching_load.py         — TeachingLoad ORM model
    publication.py           — Publication ORM model
    patent.py                — Patent ORM model
    achievement.py           — Achievement ORM model
    project.py               — Project ORM model
    kpi_score.py             — KPIScore ORM model
    kpi_detail.py            — KPIDetail ORM model
    user.py                  — User ORM model
  schemas/
    __init__.py
    position.py              — PositionCreate, PositionOut
    degree.py                — DegreeCreate, DegreeOut
    department.py            — DepartmentCreate, DepartmentOut
    time_dim.py              — TimeDimCreate, TimeDimOut
    teacher.py               — TeacherCreate, TeacherOut, TeacherDetail
    subject.py               — SubjectCreate, SubjectOut
    group.py                 — GroupCreate, GroupOut
    teaching_load.py         — TeachingLoadCreate, TeachingLoadOut
    publication.py           — PublicationCreate, PublicationOut
    patent.py                — PatentCreate, PatentOut
    achievement.py           — AchievementCreate, AchievementOut
    project.py               — ProjectCreate, ProjectOut
    kpi.py                   — KPIScoreOut, KPIDetailOut, KPISummaryOut
    auth.py                  — LoginRequest, TokenOut
  routers/
    __init__.py
    auth.py                  — POST /auth/login
    positions.py             — GET, POST /positions
    degrees.py               — GET, POST /degrees
    departments.py           — GET, POST /departments
    time_dim.py              — GET, POST /time-dim
    teachers.py              — GET, POST, GET/{id}, PUT/{id} /teachers
    subjects.py              — GET, POST /subjects
    groups.py                — GET, POST /groups
    teaching_load.py         — CRUD /teaching-load
    publications.py          — CRUD /publications
    patents.py               — CRUD /patents
    achievements.py          — CRUD /achievements
    projects.py              — CRUD /projects
    kpi.py                   — GET /kpi/scores, GET /kpi/details, POST /kpi/calculate, GET /kpi/summary
  auth/
    jwt.py                   — create_token(), verify_token(), get_current_user()
  services/
    kpi_engine.py            — calculate_kpi(year, semester, db)
```

---

### Task 1: Project setup and dependencies

**Files:**
- Create: `backend/requirements.txt`
- Create: `backend/.env`

- [ ] **Step 1: Create requirements.txt**

```
fastapi==0.111.0
uvicorn[standard]==0.29.0
sqlalchemy==2.0.30
psycopg2-binary==2.9.9
pydantic==2.7.1
pydantic-settings==2.2.1
python-jose[cryptography]==3.3.0
passlib[bcrypt]==1.7.4
python-dotenv==1.0.1
pandas==2.2.2
```

- [ ] **Step 2: Create .env**

```
DATABASE_URL=postgresql://postgres:password@localhost:5432/university_analytics
SECRET_KEY=dev-secret-key-change-in-production
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30
```

- [ ] **Step 3: Install dependencies**

```bash
cd backend
pip install -r requirements.txt
```
Expected: all packages installed, no errors.

- [ ] **Step 4: Commit**

```bash
git add backend/requirements.txt
git commit -m "feat(backend): add requirements.txt"
```
> Do NOT commit `.env` — add it to `.gitignore`.

```bash
echo "backend/.env" >> .gitignore
git add .gitignore
git commit -m "chore: ignore .env files"
```

---

### Task 2: Database connection

**Files:**
- Create: `backend/database.py`

- [ ] **Step 1: Create database.py**

```python
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, DeclarativeBase
from dotenv import load_dotenv
import os

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")

engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


class Base(DeclarativeBase):
    pass


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
```

- [ ] **Step 2: Verify connection**

```bash
cd backend
python -c "
from database import engine
with engine.connect() as conn:
    print('DB connected:', conn.execute(__import__('sqlalchemy').text('SELECT 1')).scalar())
"
```
Expected: `DB connected: 1`

- [ ] **Step 3: Commit**

```bash
git add backend/database.py
git commit -m "feat(backend): add database connection"
```

---

### Task 3: SQLAlchemy ORM models — dimensions

**Files:**
- Create: `backend/models/__init__.py`
- Create: `backend/models/position.py`
- Create: `backend/models/degree.py`
- Create: `backend/models/department.py`
- Create: `backend/models/time_dim.py`

- [ ] **Step 1: Create models/position.py**

```python
from sqlalchemy import String
from sqlalchemy.orm import Mapped, mapped_column
from database import Base


class Position(Base):
    __tablename__ = "positions"

    id:   Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(String(100), nullable=False)
```

- [ ] **Step 2: Create models/degree.py**

```python
from sqlalchemy import String
from sqlalchemy.orm import Mapped, mapped_column
from database import Base


class Degree(Base):
    __tablename__ = "degrees"

    id:   Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(String(100), nullable=False)
```

- [ ] **Step 3: Create models/department.py**

```python
from sqlalchemy import String
from sqlalchemy.orm import Mapped, mapped_column
from database import Base


class Department(Base):
    __tablename__ = "departments"

    id:   Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(String(200), nullable=False)
```

- [ ] **Step 4: Create models/time_dim.py**

```python
from sqlalchemy import Integer, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column
from typing import Optional
from database import Base


class TimeDim(Base):
    __tablename__ = "time_dim"
    __table_args__ = (UniqueConstraint("year", "semester"),)

    id:       Mapped[int]           = mapped_column(primary_key=True)
    year:     Mapped[int]           = mapped_column(Integer, nullable=False)
    semester: Mapped[int]           = mapped_column(Integer, nullable=False)
    quarter:  Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
```

- [ ] **Step 5: Create models/__init__.py**

```python
from .position   import Position
from .degree     import Degree
from .department import Department
from .time_dim   import TimeDim
```

- [ ] **Step 6: Verify models load**

```bash
cd backend
python -c "from models import Position, Degree, Department, TimeDim; print('Models OK')"
```
Expected: `Models OK`

- [ ] **Step 7: Commit**

```bash
git add backend/models/
git commit -m "feat(backend): add ORM models for dimension tables"
```

---

### Task 4: ORM models — teachers and activity tables

**Files:**
- Create: `backend/models/teacher.py`
- Create: `backend/models/subject.py`
- Create: `backend/models/group.py`
- Create: `backend/models/teaching_load.py`
- Create: `backend/models/publication.py`
- Create: `backend/models/patent.py`
- Create: `backend/models/achievement.py`
- Create: `backend/models/project.py`
- Modify: `backend/models/__init__.py`

- [ ] **Step 1: Create models/teacher.py**

```python
from sqlalchemy import String, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.sql import func
from typing import Optional
from datetime import datetime
from database import Base


class Teacher(Base):
    __tablename__ = "teachers"

    id:            Mapped[int]               = mapped_column(primary_key=True)
    full_name:     Mapped[str]               = mapped_column(String(200), nullable=False)
    email:         Mapped[Optional[str]]     = mapped_column(String(200), unique=True)
    position_id:   Mapped[Optional[int]]     = mapped_column(ForeignKey("positions.id"))
    degree_id:     Mapped[Optional[int]]     = mapped_column(ForeignKey("degrees.id"))
    department_id: Mapped[Optional[int]]     = mapped_column(ForeignKey("departments.id"))
    created_at:    Mapped[Optional[datetime]] = mapped_column(server_default=func.now())

    position:   Mapped[Optional["Position"]]   = relationship("Position")
    degree:     Mapped[Optional["Degree"]]     = relationship("Degree")
    department: Mapped[Optional["Department"]] = relationship("Department")
```

- [ ] **Step 2: Create models/subject.py**

```python
from sqlalchemy import String
from sqlalchemy.orm import Mapped, mapped_column
from database import Base


class Subject(Base):
    __tablename__ = "subjects"

    id:   Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(String(200), nullable=False)
```

- [ ] **Step 3: Create models/group.py**

```python
from sqlalchemy import String
from sqlalchemy.orm import Mapped, mapped_column
from typing import Optional
from database import Base


class Group(Base):
    __tablename__ = "groups"

    id:              Mapped[int]           = mapped_column(primary_key=True)
    name:            Mapped[str]           = mapped_column(String(100), nullable=False)
    education_level: Mapped[Optional[str]] = mapped_column(String(50))
```

- [ ] **Step 4: Create models/teaching_load.py**

```python
from sqlalchemy import ForeignKey, Integer
from sqlalchemy.orm import Mapped, mapped_column
from database import Base


class TeachingLoad(Base):
    __tablename__ = "teaching_load"

    id:         Mapped[int] = mapped_column(primary_key=True)
    teacher_id: Mapped[int] = mapped_column(ForeignKey("teachers.id"), nullable=False)
    subject_id: Mapped[int] = mapped_column(ForeignKey("subjects.id"), nullable=False)
    group_id:   Mapped[int] = mapped_column(ForeignKey("groups.id"),   nullable=False)
    time_id:    Mapped[int] = mapped_column(ForeignKey("time_dim.id"), nullable=False)
    hours:      Mapped[int] = mapped_column(Integer, nullable=False)
```

- [ ] **Step 5: Create models/publication.py**

```python
from sqlalchemy import String, Text, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column
from typing import Optional
from database import Base


class Publication(Base):
    __tablename__ = "publications"

    id:         Mapped[int]           = mapped_column(primary_key=True)
    teacher_id: Mapped[int]           = mapped_column(ForeignKey("teachers.id"), nullable=False)
    time_id:    Mapped[int]           = mapped_column(ForeignKey("time_dim.id"), nullable=False)
    title:      Mapped[str]           = mapped_column(Text, nullable=False)
    type:       Mapped[str]           = mapped_column(String(20), nullable=False)
    quartile:   Mapped[Optional[str]] = mapped_column(String(5))
```

- [ ] **Step 6: Create models/patent.py**

```python
from sqlalchemy import String, Text, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column
from typing import Optional
from database import Base


class Patent(Base):
    __tablename__ = "patents"

    id:                  Mapped[int]           = mapped_column(primary_key=True)
    teacher_id:          Mapped[int]           = mapped_column(ForeignKey("teachers.id"), nullable=False)
    time_id:             Mapped[int]           = mapped_column(ForeignKey("time_dim.id"), nullable=False)
    title:               Mapped[str]           = mapped_column(Text, nullable=False)
    registration_number: Mapped[Optional[str]] = mapped_column(String(100))
```

- [ ] **Step 7: Create models/achievement.py**

```python
from sqlalchemy import String, Text, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column
from database import Base


class Achievement(Base):
    __tablename__ = "achievements"

    id:         Mapped[int] = mapped_column(primary_key=True)
    teacher_id: Mapped[int] = mapped_column(ForeignKey("teachers.id"), nullable=False)
    time_id:    Mapped[int] = mapped_column(ForeignKey("time_dim.id"), nullable=False)
    title:      Mapped[str] = mapped_column(Text, nullable=False)
    level:      Mapped[str] = mapped_column(String(20), nullable=False)
```

- [ ] **Step 8: Create models/project.py**

```python
from sqlalchemy import String, Text, ForeignKey, Numeric, Date
from sqlalchemy.orm import Mapped, mapped_column
from typing import Optional
from datetime import date
from decimal import Decimal
from database import Base


class Project(Base):
    __tablename__ = "projects"

    id:             Mapped[int]              = mapped_column(primary_key=True)
    teacher_id:     Mapped[int]              = mapped_column(ForeignKey("teachers.id"), nullable=False)
    time_id:        Mapped[int]              = mapped_column(ForeignKey("time_dim.id"), nullable=False)
    title:          Mapped[str]              = mapped_column(Text, nullable=False)
    funding_source: Mapped[Optional[str]]    = mapped_column(String(200))
    budget:         Mapped[Optional[Decimal]] = mapped_column(Numeric(15, 2))
    start_date:     Mapped[Optional[date]]   = mapped_column(Date)
    end_date:       Mapped[Optional[date]]   = mapped_column(Date)
```

- [ ] **Step 9: Update models/__init__.py**

```python
from .position      import Position
from .degree        import Degree
from .department    import Department
from .time_dim      import TimeDim
from .teacher       import Teacher
from .subject       import Subject
from .group         import Group
from .teaching_load import TeachingLoad
from .publication   import Publication
from .patent        import Patent
from .achievement   import Achievement
from .project       import Project
```

- [ ] **Step 10: Verify all models load**

```bash
cd backend
python -c "from models import *; print('All models OK')"
```
Expected: `All models OK`

- [ ] **Step 11: Commit**

```bash
git add backend/models/
git commit -m "feat(backend): add ORM models for teachers and activity tables"
```

---

### Task 5: ORM models — KPI and users

**Files:**
- Create: `backend/models/kpi_score.py`
- Create: `backend/models/kpi_detail.py`
- Create: `backend/models/user.py`
- Modify: `backend/models/__init__.py`

- [ ] **Step 1: Create models/kpi_score.py**

```python
from sqlalchemy import ForeignKey, Numeric, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column
from typing import Optional
from decimal import Decimal
from database import Base


class KPIScore(Base):
    __tablename__ = "kpi_scores"
    __table_args__ = (UniqueConstraint("teacher_id", "time_id"),)

    id:                Mapped[int]              = mapped_column(primary_key=True)
    teacher_id:        Mapped[int]              = mapped_column(ForeignKey("teachers.id"), nullable=False)
    time_id:           Mapped[int]              = mapped_column(ForeignKey("time_dim.id"), nullable=False)
    teaching_score:    Mapped[Optional[Decimal]] = mapped_column(Numeric(5, 2))
    research_score:    Mapped[Optional[Decimal]] = mapped_column(Numeric(5, 2))
    project_score:     Mapped[Optional[Decimal]] = mapped_column(Numeric(5, 2))
    achievement_score: Mapped[Optional[Decimal]] = mapped_column(Numeric(5, 2))
    total_score:       Mapped[Optional[Decimal]] = mapped_column(Numeric(5, 2))
```

- [ ] **Step 2: Create models/kpi_detail.py**

```python
from sqlalchemy import String, ForeignKey, Numeric
from sqlalchemy.orm import Mapped, mapped_column
from typing import Optional
from decimal import Decimal
from database import Base


class KPIDetail(Base):
    __tablename__ = "kpi_details"

    id:          Mapped[int]              = mapped_column(primary_key=True)
    teacher_id:  Mapped[int]              = mapped_column(ForeignKey("teachers.id"), nullable=False)
    time_id:     Mapped[int]              = mapped_column(ForeignKey("time_dim.id"), nullable=False)
    category:    Mapped[str]              = mapped_column(String(50), nullable=False)
    metric_name: Mapped[str]              = mapped_column(String(100), nullable=False)
    value:       Mapped[Optional[Decimal]] = mapped_column(Numeric(10, 2))
    score:       Mapped[Optional[Decimal]] = mapped_column(Numeric(5, 2))
```

- [ ] **Step 3: Create models/user.py**

```python
from sqlalchemy import String, Text, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column
from typing import Optional
from database import Base


class User(Base):
    __tablename__ = "users"

    id:            Mapped[int]           = mapped_column(primary_key=True)
    teacher_id:    Mapped[Optional[int]] = mapped_column(ForeignKey("teachers.id"), nullable=True)
    email:         Mapped[str]           = mapped_column(String(200), unique=True, nullable=False)
    password_hash: Mapped[str]           = mapped_column(Text, nullable=False)
    role:          Mapped[str]           = mapped_column(String(20), nullable=False, default="teacher")
```

- [ ] **Step 4: Update models/__init__.py**

```python
from .position      import Position
from .degree        import Degree
from .department    import Department
from .time_dim      import TimeDim
from .teacher       import Teacher
from .subject       import Subject
from .group         import Group
from .teaching_load import TeachingLoad
from .publication   import Publication
from .patent        import Patent
from .achievement   import Achievement
from .project       import Project
from .kpi_score     import KPIScore
from .kpi_detail    import KPIDetail
from .user          import User
```

- [ ] **Step 5: Verify all 15 models load**

```bash
cd backend
python -c "from models import *; print('All 15 models OK')"
```
Expected: `All 15 models OK`

- [ ] **Step 6: Commit**

```bash
git add backend/models/
git commit -m "feat(backend): add KPI and User ORM models — all 15 models complete"
```

---

### Task 6: JWT authentication

**Files:**
- Create: `backend/auth/jwt.py`
- Create: `backend/auth/__init__.py`

- [ ] **Step 1: Create auth/__init__.py**

```python
```
(empty file)

- [ ] **Step 2: Create auth/jwt.py**

```python
from datetime import datetime, timedelta, timezone
from typing import Optional
from jose import JWTError, jwt
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from dotenv import load_dotenv
import os

from database import get_db
from models import User

load_dotenv()

SECRET_KEY = os.getenv("SECRET_KEY", "dev-secret")
ALGORITHM  = os.getenv("ALGORITHM", "HS256")
EXPIRE_MIN = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "30"))

bearer_scheme = HTTPBearer()


def create_access_token(data: dict) -> str:
    payload = data.copy()
    payload["exp"] = datetime.now(timezone.utc) + timedelta(minutes=EXPIRE_MIN)
    return jwt.encode(payload, SECRET_KEY, algorithm=ALGORITHM)


def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(bearer_scheme),
    db: Session = Depends(get_db),
) -> User:
    token = credentials.credentials
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id: Optional[int] = payload.get("sub")
        if user_id is None:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token")
    except JWTError:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token")

    user = db.get(User, int(user_id))
    if user is None:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="User not found")
    return user


def require_admin(current_user: User = Depends(get_current_user)) -> User:
    if current_user.role != "admin":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Admin access required")
    return current_user
```

- [ ] **Step 3: Verify auth module loads**

```bash
cd backend
python -c "from auth.jwt import create_access_token, get_current_user; print('Auth OK')"
```
Expected: `Auth OK`

- [ ] **Step 4: Commit**

```bash
git add backend/auth/
git commit -m "feat(backend): add JWT authentication"
```

---

### Task 7: Pydantic schemas

**Files:**
- Create: `backend/schemas/__init__.py`
- Create: `backend/schemas/auth.py`
- Create: `backend/schemas/position.py`
- Create: `backend/schemas/degree.py`
- Create: `backend/schemas/department.py`
- Create: `backend/schemas/time_dim.py`
- Create: `backend/schemas/teacher.py`
- Create: `backend/schemas/subject.py`
- Create: `backend/schemas/group.py`
- Create: `backend/schemas/teaching_load.py`
- Create: `backend/schemas/publication.py`
- Create: `backend/schemas/patent.py`
- Create: `backend/schemas/achievement.py`
- Create: `backend/schemas/project.py`
- Create: `backend/schemas/kpi.py`

- [ ] **Step 1: Create schemas/__init__.py**

```python
```
(empty file)

- [ ] **Step 2: Create schemas/auth.py**

```python
from pydantic import BaseModel, EmailStr


class LoginRequest(BaseModel):
    email: str
    password: str


class TokenOut(BaseModel):
    access_token: str
    token_type: str = "bearer"
```

- [ ] **Step 3: Create schemas/position.py**

```python
from pydantic import BaseModel


class PositionCreate(BaseModel):
    name: str


class PositionOut(BaseModel):
    id: int
    name: str
    model_config = {"from_attributes": True}
```

- [ ] **Step 4: Create schemas/degree.py**

```python
from pydantic import BaseModel


class DegreeCreate(BaseModel):
    name: str


class DegreeOut(BaseModel):
    id: int
    name: str
    model_config = {"from_attributes": True}
```

- [ ] **Step 5: Create schemas/department.py**

```python
from pydantic import BaseModel


class DepartmentCreate(BaseModel):
    name: str


class DepartmentOut(BaseModel):
    id: int
    name: str
    model_config = {"from_attributes": True}
```

- [ ] **Step 6: Create schemas/time_dim.py**

```python
from pydantic import BaseModel
from typing import Optional


class TimeDimCreate(BaseModel):
    year: int
    semester: int
    quarter: Optional[int] = None


class TimeDimOut(BaseModel):
    id: int
    year: int
    semester: int
    quarter: Optional[int]
    model_config = {"from_attributes": True}
```

- [ ] **Step 7: Create schemas/teacher.py**

```python
from pydantic import BaseModel
from typing import Optional
from datetime import datetime
from .position   import PositionOut
from .degree     import DegreeOut
from .department import DepartmentOut


class TeacherCreate(BaseModel):
    full_name:     str
    email:         Optional[str]  = None
    position_id:   Optional[int]  = None
    degree_id:     Optional[int]  = None
    department_id: Optional[int]  = None


class TeacherOut(BaseModel):
    id:            int
    full_name:     str
    email:         Optional[str]
    position_id:   Optional[int]
    degree_id:     Optional[int]
    department_id: Optional[int]
    created_at:    Optional[datetime]
    model_config = {"from_attributes": True}


class TeacherDetail(TeacherOut):
    position:   Optional[PositionOut]   = None
    degree:     Optional[DegreeOut]     = None
    department: Optional[DepartmentOut] = None
```

- [ ] **Step 8: Create schemas/subject.py**

```python
from pydantic import BaseModel


class SubjectCreate(BaseModel):
    name: str


class SubjectOut(BaseModel):
    id: int
    name: str
    model_config = {"from_attributes": True}
```

- [ ] **Step 9: Create schemas/group.py**

```python
from pydantic import BaseModel
from typing import Optional


class GroupCreate(BaseModel):
    name: str
    education_level: Optional[str] = None


class GroupOut(BaseModel):
    id: int
    name: str
    education_level: Optional[str]
    model_config = {"from_attributes": True}
```

- [ ] **Step 10: Create schemas/teaching_load.py**

```python
from pydantic import BaseModel


class TeachingLoadCreate(BaseModel):
    teacher_id: int
    subject_id: int
    group_id:   int
    time_id:    int
    hours:      int


class TeachingLoadOut(BaseModel):
    id:         int
    teacher_id: int
    subject_id: int
    group_id:   int
    time_id:    int
    hours:      int
    model_config = {"from_attributes": True}
```

- [ ] **Step 11: Create schemas/publication.py**

```python
from pydantic import BaseModel
from typing import Optional


class PublicationCreate(BaseModel):
    teacher_id: int
    time_id:    int
    title:      str
    type:       str
    quartile:   Optional[str] = None


class PublicationOut(BaseModel):
    id:         int
    teacher_id: int
    time_id:    int
    title:      str
    type:       str
    quartile:   Optional[str]
    model_config = {"from_attributes": True}
```

- [ ] **Step 12: Create schemas/patent.py**

```python
from pydantic import BaseModel
from typing import Optional


class PatentCreate(BaseModel):
    teacher_id:          int
    time_id:             int
    title:               str
    registration_number: Optional[str] = None


class PatentOut(BaseModel):
    id:                  int
    teacher_id:          int
    time_id:             int
    title:               str
    registration_number: Optional[str]
    model_config = {"from_attributes": True}
```

- [ ] **Step 13: Create schemas/achievement.py**

```python
from pydantic import BaseModel


class AchievementCreate(BaseModel):
    teacher_id: int
    time_id:    int
    title:      str
    level:      str


class AchievementOut(BaseModel):
    id:         int
    teacher_id: int
    time_id:    int
    title:      str
    level:      str
    model_config = {"from_attributes": True}
```

- [ ] **Step 14: Create schemas/project.py**

```python
from pydantic import BaseModel
from typing import Optional
from datetime import date
from decimal import Decimal


class ProjectCreate(BaseModel):
    teacher_id:     int
    time_id:        int
    title:          str
    funding_source: Optional[str]     = None
    budget:         Optional[Decimal] = None
    start_date:     Optional[date]    = None
    end_date:       Optional[date]    = None


class ProjectOut(BaseModel):
    id:             int
    teacher_id:     int
    time_id:        int
    title:          str
    funding_source: Optional[str]
    budget:         Optional[Decimal]
    start_date:     Optional[date]
    end_date:       Optional[date]
    model_config = {"from_attributes": True}
```

- [ ] **Step 15: Create schemas/kpi.py**

```python
from pydantic import BaseModel
from typing import Optional, List
from decimal import Decimal


class KPIScoreOut(BaseModel):
    id:                int
    teacher_id:        int
    time_id:           int
    teaching_score:    Optional[Decimal]
    research_score:    Optional[Decimal]
    project_score:     Optional[Decimal]
    achievement_score: Optional[Decimal]
    total_score:       Optional[Decimal]
    model_config = {"from_attributes": True}


class KPIDetailOut(BaseModel):
    id:          int
    teacher_id:  int
    time_id:     int
    category:    str
    metric_name: str
    value:       Optional[Decimal]
    score:       Optional[Decimal]
    model_config = {"from_attributes": True}


class KPISummaryItem(BaseModel):
    teacher_id:   int
    teacher_name: str
    total_score:  Optional[Decimal]


class KPISummaryOut(BaseModel):
    time_id: int
    year:    int
    semester: int
    teachers: List[KPISummaryItem]
```

- [ ] **Step 16: Verify all schemas load**

```bash
cd backend
python -c "from schemas.kpi import KPIScoreOut; from schemas.teacher import TeacherDetail; print('Schemas OK')"
```
Expected: `Schemas OK`

- [ ] **Step 17: Commit**

```bash
git add backend/schemas/
git commit -m "feat(backend): add all Pydantic schemas"
```

---

### Task 8: Auth router

**Files:**
- Create: `backend/routers/__init__.py`
- Create: `backend/routers/auth.py`

- [ ] **Step 1: Create routers/__init__.py**

```python
```
(empty file)

- [ ] **Step 2: Create routers/auth.py**

```python
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from passlib.context import CryptContext

from database import get_db
from models import User
from schemas.auth import LoginRequest, TokenOut
from auth.jwt import create_access_token

router = APIRouter(prefix="/auth", tags=["auth"])
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


@router.post("/login", response_model=TokenOut)
def login(body: LoginRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == body.email).first()
    if not user or not pwd_context.verify(body.password, user.password_hash):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid credentials")
    token = create_access_token({"sub": str(user.id), "role": user.role})
    return TokenOut(access_token=token)
```

- [ ] **Step 3: Commit**

```bash
git add backend/routers/
git commit -m "feat(backend): add auth router"
```

---

### Task 9: CRUD routers — lookup tables

**Files:**
- Create: `backend/routers/positions.py`
- Create: `backend/routers/degrees.py`
- Create: `backend/routers/departments.py`
- Create: `backend/routers/time_dim.py`
- Create: `backend/routers/subjects.py`
- Create: `backend/routers/groups.py`

- [ ] **Step 1: Create routers/positions.py**

```python
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import List

from database import get_db
from models import Position
from schemas.position import PositionCreate, PositionOut
from auth.jwt import get_current_user

router = APIRouter(prefix="/positions", tags=["positions"])


@router.get("/", response_model=List[PositionOut])
def list_positions(db: Session = Depends(get_db), _=Depends(get_current_user)):
    return db.query(Position).all()


@router.post("/", response_model=PositionOut)
def create_position(body: PositionCreate, db: Session = Depends(get_db), _=Depends(get_current_user)):
    obj = Position(**body.model_dump())
    db.add(obj)
    db.commit()
    db.refresh(obj)
    return obj
```

- [ ] **Step 2: Create routers/degrees.py**

```python
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import List

from database import get_db
from models import Degree
from schemas.degree import DegreeCreate, DegreeOut
from auth.jwt import get_current_user

router = APIRouter(prefix="/degrees", tags=["degrees"])


@router.get("/", response_model=List[DegreeOut])
def list_degrees(db: Session = Depends(get_db), _=Depends(get_current_user)):
    return db.query(Degree).all()


@router.post("/", response_model=DegreeOut)
def create_degree(body: DegreeCreate, db: Session = Depends(get_db), _=Depends(get_current_user)):
    obj = Degree(**body.model_dump())
    db.add(obj)
    db.commit()
    db.refresh(obj)
    return obj
```

- [ ] **Step 3: Create routers/departments.py**

```python
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import List

from database import get_db
from models import Department
from schemas.department import DepartmentCreate, DepartmentOut
from auth.jwt import get_current_user

router = APIRouter(prefix="/departments", tags=["departments"])


@router.get("/", response_model=List[DepartmentOut])
def list_departments(db: Session = Depends(get_db), _=Depends(get_current_user)):
    return db.query(Department).all()


@router.post("/", response_model=DepartmentOut)
def create_department(body: DepartmentCreate, db: Session = Depends(get_db), _=Depends(get_current_user)):
    obj = Department(**body.model_dump())
    db.add(obj)
    db.commit()
    db.refresh(obj)
    return obj
```

- [ ] **Step 4: Create routers/time_dim.py**

```python
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import List

from database import get_db
from models import TimeDim
from schemas.time_dim import TimeDimCreate, TimeDimOut
from auth.jwt import get_current_user

router = APIRouter(prefix="/time-dim", tags=["time_dim"])


@router.get("/", response_model=List[TimeDimOut])
def list_time_dim(db: Session = Depends(get_db), _=Depends(get_current_user)):
    return db.query(TimeDim).order_by(TimeDim.year, TimeDim.semester).all()


@router.post("/", response_model=TimeDimOut)
def create_time_dim(body: TimeDimCreate, db: Session = Depends(get_db), _=Depends(get_current_user)):
    obj = TimeDim(**body.model_dump())
    db.add(obj)
    db.commit()
    db.refresh(obj)
    return obj
```

- [ ] **Step 5: Create routers/subjects.py**

```python
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import List

from database import get_db
from models import Subject
from schemas.subject import SubjectCreate, SubjectOut
from auth.jwt import get_current_user

router = APIRouter(prefix="/subjects", tags=["subjects"])


@router.get("/", response_model=List[SubjectOut])
def list_subjects(db: Session = Depends(get_db), _=Depends(get_current_user)):
    return db.query(Subject).all()


@router.post("/", response_model=SubjectOut)
def create_subject(body: SubjectCreate, db: Session = Depends(get_db), _=Depends(get_current_user)):
    obj = Subject(**body.model_dump())
    db.add(obj)
    db.commit()
    db.refresh(obj)
    return obj
```

- [ ] **Step 6: Create routers/groups.py**

```python
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import List

from database import get_db
from models import Group
from schemas.group import GroupCreate, GroupOut
from auth.jwt import get_current_user

router = APIRouter(prefix="/groups", tags=["groups"])


@router.get("/", response_model=List[GroupOut])
def list_groups(db: Session = Depends(get_db), _=Depends(get_current_user)):
    return db.query(Group).all()


@router.post("/", response_model=GroupOut)
def create_group(body: GroupCreate, db: Session = Depends(get_db), _=Depends(get_current_user)):
    obj = Group(**body.model_dump())
    db.add(obj)
    db.commit()
    db.refresh(obj)
    return obj
```

- [ ] **Step 7: Commit**

```bash
git add backend/routers/
git commit -m "feat(backend): add CRUD routers for lookup tables"
```

---

### Task 10: CRUD routers — teachers and activities

**Files:**
- Create: `backend/routers/teachers.py`
- Create: `backend/routers/teaching_load.py`
- Create: `backend/routers/publications.py`
- Create: `backend/routers/patents.py`
- Create: `backend/routers/achievements.py`
- Create: `backend/routers/projects.py`

- [ ] **Step 1: Create routers/teachers.py**

```python
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session, joinedload
from typing import List, Optional

from database import get_db
from models import Teacher
from schemas.teacher import TeacherCreate, TeacherOut, TeacherDetail
from auth.jwt import get_current_user

router = APIRouter(prefix="/teachers", tags=["teachers"])


@router.get("/", response_model=List[TeacherOut])
def list_teachers(
    department_id: Optional[int] = None,
    db: Session = Depends(get_db),
    _=Depends(get_current_user),
):
    q = db.query(Teacher)
    if department_id:
        q = q.filter(Teacher.department_id == department_id)
    return q.all()


@router.post("/", response_model=TeacherOut)
def create_teacher(body: TeacherCreate, db: Session = Depends(get_db), _=Depends(get_current_user)):
    obj = Teacher(**body.model_dump())
    db.add(obj)
    db.commit()
    db.refresh(obj)
    return obj


@router.get("/{teacher_id}", response_model=TeacherDetail)
def get_teacher(teacher_id: int, db: Session = Depends(get_db), _=Depends(get_current_user)):
    obj = (
        db.query(Teacher)
        .options(joinedload(Teacher.position), joinedload(Teacher.degree), joinedload(Teacher.department))
        .filter(Teacher.id == teacher_id)
        .first()
    )
    if not obj:
        raise HTTPException(status_code=404, detail="Teacher not found")
    return obj


@router.put("/{teacher_id}", response_model=TeacherOut)
def update_teacher(teacher_id: int, body: TeacherCreate, db: Session = Depends(get_db), _=Depends(get_current_user)):
    obj = db.get(Teacher, teacher_id)
    if not obj:
        raise HTTPException(status_code=404, detail="Teacher not found")
    for k, v in body.model_dump().items():
        setattr(obj, k, v)
    db.commit()
    db.refresh(obj)
    return obj
```

- [ ] **Step 2: Create routers/teaching_load.py**

```python
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional

from database import get_db
from models import TeachingLoad
from schemas.teaching_load import TeachingLoadCreate, TeachingLoadOut
from auth.jwt import get_current_user

router = APIRouter(prefix="/teaching-load", tags=["teaching_load"])


@router.get("/", response_model=List[TeachingLoadOut])
def list_teaching_load(
    teacher_id: Optional[int] = None,
    time_id:    Optional[int] = None,
    db: Session = Depends(get_db),
    _=Depends(get_current_user),
):
    q = db.query(TeachingLoad)
    if teacher_id: q = q.filter(TeachingLoad.teacher_id == teacher_id)
    if time_id:    q = q.filter(TeachingLoad.time_id    == time_id)
    return q.all()


@router.post("/", response_model=TeachingLoadOut)
def create_teaching_load(body: TeachingLoadCreate, db: Session = Depends(get_db), _=Depends(get_current_user)):
    obj = TeachingLoad(**body.model_dump())
    db.add(obj); db.commit(); db.refresh(obj)
    return obj


@router.put("/{item_id}", response_model=TeachingLoadOut)
def update_teaching_load(item_id: int, body: TeachingLoadCreate, db: Session = Depends(get_db), _=Depends(get_current_user)):
    obj = db.get(TeachingLoad, item_id)
    if not obj: raise HTTPException(404, "Not found")
    for k, v in body.model_dump().items(): setattr(obj, k, v)
    db.commit(); db.refresh(obj)
    return obj


@router.delete("/{item_id}", status_code=204)
def delete_teaching_load(item_id: int, db: Session = Depends(get_db), _=Depends(get_current_user)):
    obj = db.get(TeachingLoad, item_id)
    if not obj: raise HTTPException(404, "Not found")
    db.delete(obj); db.commit()
```

- [ ] **Step 3: Create routers/publications.py**

```python
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional

from database import get_db
from models import Publication
from schemas.publication import PublicationCreate, PublicationOut
from auth.jwt import get_current_user

router = APIRouter(prefix="/publications", tags=["publications"])


@router.get("/", response_model=List[PublicationOut])
def list_publications(
    teacher_id: Optional[int] = None,
    time_id:    Optional[int] = None,
    db: Session = Depends(get_db),
    _=Depends(get_current_user),
):
    q = db.query(Publication)
    if teacher_id: q = q.filter(Publication.teacher_id == teacher_id)
    if time_id:    q = q.filter(Publication.time_id    == time_id)
    return q.all()


@router.post("/", response_model=PublicationOut)
def create_publication(body: PublicationCreate, db: Session = Depends(get_db), _=Depends(get_current_user)):
    obj = Publication(**body.model_dump())
    db.add(obj); db.commit(); db.refresh(obj)
    return obj


@router.put("/{item_id}", response_model=PublicationOut)
def update_publication(item_id: int, body: PublicationCreate, db: Session = Depends(get_db), _=Depends(get_current_user)):
    obj = db.get(Publication, item_id)
    if not obj: raise HTTPException(404, "Not found")
    for k, v in body.model_dump().items(): setattr(obj, k, v)
    db.commit(); db.refresh(obj)
    return obj


@router.delete("/{item_id}", status_code=204)
def delete_publication(item_id: int, db: Session = Depends(get_db), _=Depends(get_current_user)):
    obj = db.get(Publication, item_id)
    if not obj: raise HTTPException(404, "Not found")
    db.delete(obj); db.commit()
```

- [ ] **Step 4: Create routers/patents.py**

```python
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional

from database import get_db
from models import Patent
from schemas.patent import PatentCreate, PatentOut
from auth.jwt import get_current_user

router = APIRouter(prefix="/patents", tags=["patents"])


@router.get("/", response_model=List[PatentOut])
def list_patents(
    teacher_id: Optional[int] = None,
    time_id:    Optional[int] = None,
    db: Session = Depends(get_db),
    _=Depends(get_current_user),
):
    q = db.query(Patent)
    if teacher_id: q = q.filter(Patent.teacher_id == teacher_id)
    if time_id:    q = q.filter(Patent.time_id    == time_id)
    return q.all()


@router.post("/", response_model=PatentOut)
def create_patent(body: PatentCreate, db: Session = Depends(get_db), _=Depends(get_current_user)):
    obj = Patent(**body.model_dump())
    db.add(obj); db.commit(); db.refresh(obj)
    return obj


@router.put("/{item_id}", response_model=PatentOut)
def update_patent(item_id: int, body: PatentCreate, db: Session = Depends(get_db), _=Depends(get_current_user)):
    obj = db.get(Patent, item_id)
    if not obj: raise HTTPException(404, "Not found")
    for k, v in body.model_dump().items(): setattr(obj, k, v)
    db.commit(); db.refresh(obj)
    return obj


@router.delete("/{item_id}", status_code=204)
def delete_patent(item_id: int, db: Session = Depends(get_db), _=Depends(get_current_user)):
    obj = db.get(Patent, item_id)
    if not obj: raise HTTPException(404, "Not found")
    db.delete(obj); db.commit()
```

- [ ] **Step 5: Create routers/achievements.py**

```python
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional

from database import get_db
from models import Achievement
from schemas.achievement import AchievementCreate, AchievementOut
from auth.jwt import get_current_user

router = APIRouter(prefix="/achievements", tags=["achievements"])


@router.get("/", response_model=List[AchievementOut])
def list_achievements(
    teacher_id: Optional[int] = None,
    time_id:    Optional[int] = None,
    db: Session = Depends(get_db),
    _=Depends(get_current_user),
):
    q = db.query(Achievement)
    if teacher_id: q = q.filter(Achievement.teacher_id == teacher_id)
    if time_id:    q = q.filter(Achievement.time_id    == time_id)
    return q.all()


@router.post("/", response_model=AchievementOut)
def create_achievement(body: AchievementCreate, db: Session = Depends(get_db), _=Depends(get_current_user)):
    obj = Achievement(**body.model_dump())
    db.add(obj); db.commit(); db.refresh(obj)
    return obj


@router.put("/{item_id}", response_model=AchievementOut)
def update_achievement(item_id: int, body: AchievementCreate, db: Session = Depends(get_db), _=Depends(get_current_user)):
    obj = db.get(Achievement, item_id)
    if not obj: raise HTTPException(404, "Not found")
    for k, v in body.model_dump().items(): setattr(obj, k, v)
    db.commit(); db.refresh(obj)
    return obj


@router.delete("/{item_id}", status_code=204)
def delete_achievement(item_id: int, db: Session = Depends(get_db), _=Depends(get_current_user)):
    obj = db.get(Achievement, item_id)
    if not obj: raise HTTPException(404, "Not found")
    db.delete(obj); db.commit()
```

- [ ] **Step 6: Create routers/projects.py**

```python
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional

from database import get_db
from models import Project
from schemas.project import ProjectCreate, ProjectOut
from auth.jwt import get_current_user

router = APIRouter(prefix="/projects", tags=["projects"])


@router.get("/", response_model=List[ProjectOut])
def list_projects(
    teacher_id: Optional[int] = None,
    time_id:    Optional[int] = None,
    db: Session = Depends(get_db),
    _=Depends(get_current_user),
):
    q = db.query(Project)
    if teacher_id: q = q.filter(Project.teacher_id == teacher_id)
    if time_id:    q = q.filter(Project.time_id    == time_id)
    return q.all()


@router.post("/", response_model=ProjectOut)
def create_project(body: ProjectCreate, db: Session = Depends(get_db), _=Depends(get_current_user)):
    obj = Project(**body.model_dump())
    db.add(obj); db.commit(); db.refresh(obj)
    return obj


@router.put("/{item_id}", response_model=ProjectOut)
def update_project(item_id: int, body: ProjectCreate, db: Session = Depends(get_db), _=Depends(get_current_user)):
    obj = db.get(Project, item_id)
    if not obj: raise HTTPException(404, "Not found")
    for k, v in body.model_dump().items(): setattr(obj, k, v)
    db.commit(); db.refresh(obj)
    return obj


@router.delete("/{item_id}", status_code=204)
def delete_project(item_id: int, db: Session = Depends(get_db), _=Depends(get_current_user)):
    obj = db.get(Project, item_id)
    if not obj: raise HTTPException(404, "Not found")
    db.delete(obj); db.commit()
```

- [ ] **Step 7: Commit**

```bash
git add backend/routers/
git commit -m "feat(backend): add CRUD routers for teachers and activity tables"
```

---

### Task 11: KPI engine

**Files:**
- Create: `backend/services/kpi_engine.py`
- Create: `backend/services/__init__.py`

- [ ] **Step 1: Create services/__init__.py**

```python
```
(empty file)

- [ ] **Step 2: Create services/kpi_engine.py**

```python
import pandas as pd
from sqlalchemy.orm import Session
from sqlalchemy import delete

from models import (
    Teacher, TeachingLoad, Publication, Patent,
    Achievement, Project, KPIScore, KPIDetail, TimeDim
)

# KPI weights (must sum to 1.0)
WEIGHTS = {
    "teaching":    0.30,
    "research":    0.35,
    "project":     0.15,
    "achievement": 0.20,
}

# Max expected values per metric (for normalization to 0-100)
MAX_VALUES = {
    "hours_total":      300,   # max teaching hours per semester
    "scopus_wos_count": 5,     # max Scopus/WoS publications per semester
    "local_count":      10,    # max local publications
    "patent_count":     3,     # max patents
    "project_count":    3,     # max projects
    "project_budget":   10_000_000,  # max total budget
    "achievement_intl": 2,     # max international achievements
    "achievement_natl": 4,     # max national achievements
    "achievement_local": 6,    # max local achievements
}


def _normalize(value: float, max_val: float) -> float:
    """Clamp value to [0, max_val] then scale to [0, 100]."""
    return round(min(value, max_val) / max_val * 100, 2) if max_val > 0 else 0.0


def calculate_kpi(year: int, semester: int, db: Session) -> dict:
    """
    Calculate KPI scores for all teachers for the given year/semester.
    Writes results to kpi_scores and kpi_details tables.
    Returns {"calculated": N} where N is the number of teachers processed.
    """
    # Resolve time_dim id
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
    teacher_map = {t.id: t.full_name for t in teachers}

    # Load activity data into DataFrames
    tl_rows = db.query(TeachingLoad).filter(
        TeachingLoad.teacher_id.in_(teacher_ids),
        TeachingLoad.time_id == time_id,
    ).all()

    pub_rows = db.query(Publication).filter(
        Publication.teacher_id.in_(teacher_ids),
        Publication.time_id == time_id,
    ).all()

    pat_rows = db.query(Patent).filter(
        Patent.teacher_id.in_(teacher_ids),
        Patent.time_id == time_id,
    ).all()

    ach_rows = db.query(Achievement).filter(
        Achievement.teacher_id.in_(teacher_ids),
        Achievement.time_id == time_id,
    ).all()

    proj_rows = db.query(Project).filter(
        Project.teacher_id.in_(teacher_ids),
        Project.time_id == time_id,
    ).all()

    # Aggregate per teacher
    tl_df  = pd.DataFrame([{"teacher_id": r.teacher_id, "hours": r.hours} for r in tl_rows])
    pub_df = pd.DataFrame([{"teacher_id": r.teacher_id, "type": r.type} for r in pub_rows])
    pat_df = pd.DataFrame([{"teacher_id": r.teacher_id} for r in pat_rows])
    ach_df = pd.DataFrame([{"teacher_id": r.teacher_id, "level": r.level} for r in ach_rows])
    proj_df = pd.DataFrame([{"teacher_id": r.teacher_id, "budget": float(r.budget or 0)} for r in proj_rows])

    # Clear existing results for this period
    db.execute(delete(KPIDetail).where(KPIDetail.time_id == time_id))
    db.execute(delete(KPIScore).where(KPIScore.time_id == time_id))
    db.commit()

    details_to_insert = []
    scores_to_insert  = []

    for teacher in teachers:
        tid = teacher.id

        # --- Teaching score ---
        hours = tl_df[tl_df.teacher_id == tid]["hours"].sum() if not tl_df.empty else 0
        teaching_score = _normalize(float(hours), MAX_VALUES["hours_total"])

        details_to_insert.append(KPIDetail(
            teacher_id=tid, time_id=time_id,
            category="teaching", metric_name="hours_total",
            value=float(hours), score=teaching_score,
        ))

        # --- Research score (publications + patents) ---
        t_pub = pub_df[pub_df.teacher_id == tid] if not pub_df.empty else pd.DataFrame()
        scopus_wos = len(t_pub[t_pub["type"].isin(["Scopus", "WoS"])]) if not t_pub.empty else 0
        local_pub  = len(t_pub[t_pub["type"] == "local"]) if not t_pub.empty else 0
        patent_count = len(pat_df[pat_df.teacher_id == tid]) if not pat_df.empty else 0

        sw_score  = _normalize(scopus_wos,   MAX_VALUES["scopus_wos_count"])
        loc_score = _normalize(local_pub,    MAX_VALUES["local_count"])
        pat_score = _normalize(patent_count, MAX_VALUES["patent_count"])
        research_score = round((sw_score * 0.6 + loc_score * 0.2 + pat_score * 0.2), 2)

        for metric, val, sc in [
            ("scopus_wos_count", scopus_wos, sw_score),
            ("local_pub_count",  local_pub,  loc_score),
            ("patent_count",     patent_count, pat_score),
        ]:
            details_to_insert.append(KPIDetail(
                teacher_id=tid, time_id=time_id,
                category="research", metric_name=metric,
                value=float(val), score=sc,
            ))

        # --- Project score ---
        t_proj = proj_df[proj_df.teacher_id == tid] if not proj_df.empty else pd.DataFrame()
        proj_count  = len(t_proj)
        proj_budget = t_proj["budget"].sum() if not t_proj.empty else 0

        pc_score  = _normalize(proj_count,  MAX_VALUES["project_count"])
        pb_score  = _normalize(proj_budget, MAX_VALUES["project_budget"])
        project_score = round((pc_score * 0.5 + pb_score * 0.5), 2)

        for metric, val, sc in [
            ("project_count",  proj_count,  pc_score),
            ("project_budget", proj_budget, pb_score),
        ]:
            details_to_insert.append(KPIDetail(
                teacher_id=tid, time_id=time_id,
                category="project", metric_name=metric,
                value=float(val), score=sc,
            ))

        # --- Achievement score ---
        t_ach = ach_df[ach_df.teacher_id == tid] if not ach_df.empty else pd.DataFrame()
        intl_count = len(t_ach[t_ach["level"] == "international"]) if not t_ach.empty else 0
        natl_count = len(t_ach[t_ach["level"] == "national"])      if not t_ach.empty else 0
        local_count = len(t_ach[t_ach["level"] == "local"])        if not t_ach.empty else 0

        intl_sc  = _normalize(intl_count,  MAX_VALUES["achievement_intl"])
        natl_sc  = _normalize(natl_count,  MAX_VALUES["achievement_natl"])
        local_sc = _normalize(local_count, MAX_VALUES["achievement_local"])
        achievement_score = round((intl_sc * 0.5 + natl_sc * 0.35 + local_sc * 0.15), 2)

        for metric, val, sc in [
            ("achievement_international", intl_count, intl_sc),
            ("achievement_national",      natl_count, natl_sc),
            ("achievement_local",         local_count, local_sc),
        ]:
            details_to_insert.append(KPIDetail(
                teacher_id=tid, time_id=time_id,
                category="achievement", metric_name=metric,
                value=float(val), score=sc,
            ))

        # --- Total weighted score ---
        total_score = round(
            teaching_score    * WEIGHTS["teaching"]    +
            research_score    * WEIGHTS["research"]    +
            project_score     * WEIGHTS["project"]     +
            achievement_score * WEIGHTS["achievement"],
            2,
        )

        scores_to_insert.append(KPIScore(
            teacher_id=tid,
            time_id=time_id,
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
```

- [ ] **Step 3: Commit**

```bash
git add backend/services/
git commit -m "feat(backend): add KPI calculation engine"
```

---

### Task 12: KPI router

**Files:**
- Create: `backend/routers/kpi.py`

- [ ] **Step 1: Create routers/kpi.py**

```python
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional

from database import get_db
from models import KPIScore, KPIDetail, Teacher, TimeDim
from schemas.kpi import KPIScoreOut, KPIDetailOut, KPISummaryOut, KPISummaryItem
from auth.jwt import get_current_user
from services.kpi_engine import calculate_kpi

router = APIRouter(prefix="/kpi", tags=["kpi"])


@router.get("/scores", response_model=List[KPIScoreOut])
def list_kpi_scores(
    teacher_id: Optional[int] = None,
    time_id:    Optional[int] = None,
    db: Session = Depends(get_db),
    _=Depends(get_current_user),
):
    q = db.query(KPIScore)
    if teacher_id: q = q.filter(KPIScore.teacher_id == teacher_id)
    if time_id:    q = q.filter(KPIScore.time_id    == time_id)
    return q.all()


@router.get("/details", response_model=List[KPIDetailOut])
def list_kpi_details(
    teacher_id: Optional[int] = None,
    time_id:    Optional[int] = None,
    category:   Optional[str] = None,
    db: Session = Depends(get_db),
    _=Depends(get_current_user),
):
    q = db.query(KPIDetail)
    if teacher_id: q = q.filter(KPIDetail.teacher_id == teacher_id)
    if time_id:    q = q.filter(KPIDetail.time_id    == time_id)
    if category:   q = q.filter(KPIDetail.category   == category)
    return q.all()


@router.post("/calculate")
def trigger_calculate(
    year:     int = Query(...),
    semester: int = Query(...),
    db: Session = Depends(get_db),
    _=Depends(get_current_user),
):
    try:
        result = calculate_kpi(year, semester, db)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    return result


@router.get("/summary", response_model=KPISummaryOut)
def kpi_summary(
    time_id: int = Query(...),
    db: Session = Depends(get_db),
    _=Depends(get_current_user),
):
    time_obj = db.get(TimeDim, time_id)
    if not time_obj:
        raise HTTPException(404, "TimeDim not found")

    scores = db.query(KPIScore).filter(KPIScore.time_id == time_id).all()
    teachers = {t.id: t.full_name for t in db.query(Teacher).all()}

    items = [
        KPISummaryItem(
            teacher_id=s.teacher_id,
            teacher_name=teachers.get(s.teacher_id, "Unknown"),
            total_score=s.total_score,
        )
        for s in sorted(scores, key=lambda x: x.total_score or 0, reverse=True)
    ]

    return KPISummaryOut(
        time_id=time_id,
        year=time_obj.year,
        semester=time_obj.semester,
        teachers=items,
    )
```

- [ ] **Step 2: Commit**

```bash
git add backend/routers/kpi.py
git commit -m "feat(backend): add KPI router with calculate and summary endpoints"
```

---

### Task 13: FastAPI main app

**Files:**
- Create: `backend/main.py`

- [ ] **Step 1: Create main.py**

```python
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from routers import (
    auth, positions, degrees, departments, time_dim,
    teachers, subjects, groups,
    teaching_load, publications, patents, achievements, projects,
    kpi,
)

app = FastAPI(title="University Analytics API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(positions.router)
app.include_router(degrees.router)
app.include_router(departments.router)
app.include_router(time_dim.router)
app.include_router(teachers.router)
app.include_router(subjects.router)
app.include_router(groups.router)
app.include_router(teaching_load.router)
app.include_router(publications.router)
app.include_router(patents.router)
app.include_router(achievements.router)
app.include_router(projects.router)
app.include_router(kpi.router)


@app.get("/health")
def health():
    return {"status": "ok"}
```

- [ ] **Step 2: Start the server**

```bash
cd backend
uvicorn main:app --reload --port 8000
```
Expected: `Application startup complete.` — no errors.

- [ ] **Step 3: Verify health endpoint**

```bash
curl http://localhost:8000/health
```
Expected: `{"status":"ok"}`

- [ ] **Step 4: Open Swagger UI**

Open `http://localhost:8000/docs` in browser.  
Expected: All 14 router groups visible in the UI.

- [ ] **Step 5: Test login via Swagger**

In Swagger UI, call `POST /auth/login` with:
```json
{"email": "admin@uni.kz", "password": "admin123"}
```
Expected: `{"access_token": "...", "token_type": "bearer"}`

- [ ] **Step 6: Test a protected endpoint**

Copy the token, click "Authorize" in Swagger, paste token.  
Call `GET /teachers/` — expected: list of 5 teachers.

- [ ] **Step 7: Test KPI calculation**

Call `POST /kpi/calculate?year=2024&semester=1`  
Expected: `{"calculated": 5}`

Call `GET /kpi/summary?time_id=3`  
Expected: list of 5 teachers with total_score values.

- [ ] **Step 8: Final commit**

```bash
git add backend/main.py
git commit -m "feat(backend): backend layer complete — all endpoints working"
```

---

## Layer Complete

**Readiness check:** Backend layer is done when:
- [ ] `uvicorn main:app --reload` starts without errors
- [ ] `GET /health` returns `{"status":"ok"}`
- [ ] `POST /auth/login` returns a JWT token
- [ ] `GET /teachers/` returns 5 seeded teachers
- [ ] `POST /kpi/calculate?year=2024&semester=1` returns `{"calculated": 5}`
- [ ] `GET /kpi/summary?time_id=3` returns ranked teacher scores

**Next:** Plan 3 — Frontend (React + MUI + Axios + Zustand)
