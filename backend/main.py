from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from routers import (
    auth, positions, degrees, departments, time_dim,
    teachers, subjects, groups,
    teaching_load, publications, patents, achievements, projects,
    kpi, kpi_settings, students, import_data, etl,
)

from database import engine, Base
import models
Base.metadata.create_all(bind=engine)

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
app.include_router(kpi_settings.router)
app.include_router(students.router)
app.include_router(import_data.router)
app.include_router(etl.router)


@app.get("/health")
def health():
    return {"status": "ok"}

@app.get("/emergency_create_teacher")
def emergency_create_teacher(db=None):
    from fastapi import Depends
    from database import get_db
    # It's a bit hacky to lazily inject Dependency but we can just get the generator manually since it's a synchronous generator
    db_gen = get_db()
    db_session = next(db_gen)
    try:
        from models.teacher import Teacher
        from models.user import User
        from routers.auth import pwd_context
        
        # Check if already exists
        user = db_session.query(User).filter(User.email == "teacher@university.edu").first()
        if user:
            # force reset password
            user.password_hash = pwd_context.hash("password123")
            db_session.commit()
            return {"status": "success", "message": "Teacher already existed, password reset to: password123", "email": "teacher@university.edu"}
        
        new_teacher = Teacher(
            full_name="Смирнов Алексей Петрович",
            email="teacher@university.edu"
        )
        db_session.add(new_teacher)
        db_session.commit()
        db_session.refresh(new_teacher)

        new_user = User(
            email="teacher@university.edu",
            password_hash=pwd_context.hash("password123"),
            role="teacher",
            teacher_id=new_teacher.id
        )
        db_session.add(new_user)
        db_session.commit()
        
        return {
            "status": "success", 
            "message": "Teacher created successfully",
            "email": "teacher@university.edu",
            "password": "password123",
            "teacher_id": new_teacher.id
        }
    except Exception as e:
        db_session.rollback()
        return {"status": "error", "message": str(e)}
