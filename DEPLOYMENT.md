# Deploying EV CRM to Vercel

The repo deploys as **two Vercel projects from the same GitHub repo** —
one for the Next.js frontend, one for the FastAPI backend running as a
Python serverless function. Postgres is hosted separately (Neon's free
tier is the assumed default).

```
repo root
├── frontend/   → Vercel project #1  (Next.js)
└── backend/    → Vercel project #2  (FastAPI on api/index.py)
```

---

## 1. Create the database

Any Postgres works; Neon has a free tier that needs no card.

1. Sign up at **neon.tech** → **New Project**
2. Copy the **pooled** connection string — it has `-pooler` in the host.

> **Use the pooled endpoint.** A serverless function opens a connection per
> invocation, so a direct connection quickly exhausts Postgres' limit.
> `app/database.py` disables SQLAlchemy's own pool when running on Vercel
> and leaves pooling to the provider.

## 2. Apply migrations

Migrations are **not** run automatically — a serverless cold start can
happen on any request, so migrating at startup would race with itself.
Run them once from your machine, pointed at the production database:

```bash
cd backend
python -m venv .venv
./.venv/Scripts/python.exe -m pip install -r requirements-dev.txt   # Windows
# source .venv/bin/activate && pip install -r requirements-dev.txt  # macOS/Linux

# PowerShell
$env:DATABASE_URL="postgresql://...-pooler.../dbname?sslmode=require"
python -m alembic upgrade head
python seed.py      # optional: creates the demo manager + employee logins
```

Re-run `alembic upgrade head` the same way whenever a new migration lands.

## 3. Deploy the backend

**vercel.com/new** → import the repo → then:

| Setting | Value |
|---|---|
| **Root Directory** | `backend` |
| Framework Preset | Other |

Environment variables:

| Key | Value |
|---|---|
| `DATABASE_URL` | the pooled Neon string |
| `SECRET_KEY` | `python -c "import secrets; print(secrets.token_hex(32))"` |
| `FRONTEND_ORIGIN` | the frontend's URL (fill in after step 4, then redeploy) |

Verify once deployed:

```bash
curl https://<backend>.vercel.app/api/health
# {"status":"ok","service":"EV CRM API"}
```

## 4. Deploy the frontend

**vercel.com/new** → import the *same* repo again → then:

| Setting | Value |
|---|---|
| **Root Directory** | `frontend` |
| Framework Preset | Next.js (auto-detected) |

Environment variable:

| Key | Value |
|---|---|
| `NEXT_PUBLIC_API_URL` | `https://<backend>.vercel.app` |

Then go back to the **backend** project and set `FRONTEND_ORIGIN` to this
frontend URL, and redeploy it so CORS accepts the browser's requests.

---

## Notes and limits

- **Preview deployments** get generated URLs that `FRONTEND_ORIGIN` won't
  match. To allow them, set `FRONTEND_ORIGIN_REGEX` on the backend, anchored
  to your own project so it can't match unrelated `*.vercel.app` apps:
  `https://ev-crm-.*-yourteam\.vercel\.app`
- **Google Sheets import**: on Vercel the filesystem is read-only, so paste
  the service account key's **raw JSON** into `GOOGLE_SERVICE_ACCOUNT_JSON`
  (locally a file path also works). A very large sheet can exceed the
  function's 60s limit — import in batches if that happens.
- **Seeded logins are demo credentials.** Change the passwords immediately
  if you seed a database that's reachable from the internet.

## Running locally

```bash
# backend  → http://localhost:8000
cd backend && cp .env.example .env    # then edit values
python -m alembic upgrade head && python seed.py
python -m uvicorn app.main:app --reload

# frontend → http://localhost:3000
cd frontend && npm install && npm run dev
```
