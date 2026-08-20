"""Vercel serverless entry point.

Vercel's Python runtime looks for `api/index.py` and serves the ASGI
callable exported as `app`. All routing is funnelled here by vercel.json,
so FastAPI keeps owning its own URL space (/api/auth, /api/leads, ...).
"""
import os
import sys

# The function is executed with api/ as the working directory, so the
# project root (which holds the `app` package) must be importable.
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.main import app  # noqa: E402

__all__ = ["app"]
