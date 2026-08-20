from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.config import get_settings
from app.routers import auth, users, leads, calls, follow_ups, notes, dashboard, reports, import_gs
import subprocess, sys, logging

logger = logging.getLogger("uvicorn.error")
settings = get_settings()


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Auto-run migrations on every startup (safe — idempotent)
    try:
        result = subprocess.run(
            [sys.executable, "-m", "alembic", "upgrade", "head"],
            capture_output=True, text=True
        )
        if result.returncode == 0:
            logger.info("Alembic migrations applied successfully")
        else:
            logger.warning(f"Alembic warning: {result.stderr}")
    except Exception as e:
        logger.error(f"Migration failed: {e}")
    yield


app = FastAPI(
    title="EV CRM API",
    description="Call-center CRM for an EV automobile company",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.FRONTEND_ORIGIN, "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register routers
app.include_router(auth.router)
app.include_router(users.router)
app.include_router(leads.router)
app.include_router(calls.router)
app.include_router(follow_ups.router)
app.include_router(notes.router)
app.include_router(dashboard.router)
app.include_router(reports.router)
app.include_router(import_gs.router)


@app.get("/api/health")
def health():
    return {"status": "ok", "service": "EV CRM API"}

