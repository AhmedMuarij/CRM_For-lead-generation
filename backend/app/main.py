from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.config import get_settings

settings = get_settings()

app = FastAPI(
    title="EV CRM API",
    description="Call-center CRM for an EV automobile company",
    version="1.0.0",
)

# Routers are imported after the app exists so that a failure in one of them
# surfaces as a normal import error rather than a confusing startup crash.
from app.routers import (  # noqa: E402
    auth, users, leads, calls, follow_ups, notes, dashboard, reports, import_gs,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_origin_regex=settings.FRONTEND_ORIGIN_REGEX or None,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

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
