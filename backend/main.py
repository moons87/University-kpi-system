import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from scheduler import create_scheduler

from routers import (
    auth, positions, degrees, departments, time_dim,
    teachers, subjects, groups,
    teaching_load, publications, patents, achievements, projects,
    kpi, kpi_settings, students, import_data, etl,
)

from database import engine, Base
import models

Base.metadata.create_all(bind=engine)

logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    scheduler = create_scheduler()
    scheduler.start()
    logger.info("[scheduler] APScheduler started — nightly ETL at 02:00")
    yield
    scheduler.shutdown(wait=False)
    logger.info("[scheduler] APScheduler stopped")


app = FastAPI(
    title="University Analytics API",
    version="1.0.0",
    lifespan=lifespan,
    # Hide detailed error responses from OpenAPI docs in production
    docs_url="/docs",
    redoc_url="/redoc",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ── Global exception handler — never expose internal details to clients ──────
@app.exception_handler(Exception)
async def generic_exception_handler(request: Request, exc: Exception):
    logger.exception("Unhandled exception on %s %s: %s", request.method, request.url.path, exc)
    return JSONResponse(
        status_code=500,
        content={"detail": "Internal server error"},
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
