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
