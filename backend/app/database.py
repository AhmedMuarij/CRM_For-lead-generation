import os
from sqlalchemy import create_engine
from sqlalchemy.pool import NullPool
from sqlalchemy.orm import sessionmaker, DeclarativeBase
from app.config import get_settings

settings = get_settings()


def _normalized_url(url: str) -> str:
    """Some providers hand out `postgres://`, which SQLAlchemy 2.x rejects."""
    if url.startswith("postgres://"):
        return url.replace("postgres://", "postgresql://", 1)
    return url


DATABASE_URL = _normalized_url(settings.DATABASE_URL)

_is_sqlite = DATABASE_URL.startswith("sqlite")
# Vercel sets VERCEL=1 in every serverless invocation.
_is_serverless = bool(os.getenv("VERCEL"))

if _is_sqlite:
    engine = create_engine(
        DATABASE_URL,
        connect_args={"check_same_thread": False},
    )
elif _is_serverless:
    # Each invocation may run in a fresh, short-lived container, so a
    # client-side pool would leak connections and exhaust Postgres.
    # Pooling belongs to the provider's pooler (Neon/Supabase/PgBouncer) —
    # point DATABASE_URL at its *pooled* endpoint.
    engine = create_engine(
        DATABASE_URL,
        poolclass=NullPool,
        pool_pre_ping=True,
    )
else:
    engine = create_engine(
        DATABASE_URL,
        pool_pre_ping=True,
        pool_size=10,
        max_overflow=20,
    )

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


class Base(DeclarativeBase):
    pass


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
