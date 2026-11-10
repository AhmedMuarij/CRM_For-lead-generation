#!/usr/bin/env python3
"""
Seed script: creates 1 manager, 5 employees, and 100 sample leads
with varied statuses, calls, follow-ups, and notes.

⚠️  Seeding DELETES every user, lead, call, follow-up, note, audit log and
import log in the database first. It refuses to run on a database that
already has users unless you pass --reset.

Passwords: set SEED_PASSWORD to give every demo account that password.
Without it, each account gets a random password, printed at the end.

Usage (from backend/ directory):
    python seed.py                                  # empty database
    python seed.py --reset                          # wipe and re-seed
    SEED_PASSWORD='...' python seed.py --reset      # fixed demo password
"""
import sys
import os
import random
import secrets
from datetime import datetime, timedelta

# Windows consoles default to a non-UTF-8 codepage (e.g. cp1252), which can't
# encode the emoji in the log messages below — reconfigure stdout so this
# script runs the same on Windows as it does on Linux/Mac.
if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app.database import SessionLocal, engine
from app.models import User, Lead, Call, FollowUp, LeadNote, AuditLog, ImportLog
from app.models.user import UserRole
from app.models.lead import LeadStatus
from app.models.call import CallOutcome
from app.models.follow_up import FollowUpStatus
from app.auth.utils import get_password_hash
from app.database import Base

# Create all tables (in case migrations haven't run yet)
Base.metadata.create_all(bind=engine)

db = SessionLocal()

# ─── Safety check ──────────────────────────────────────────────
# Seeding wipes everything. Never do that to a database with real users in it
# unless the person running this explicitly asked for it.
existing_users = db.query(User).count()
if existing_users and "--reset" not in sys.argv:
    print(f"✋ This database already has {existing_users} user(s).")
    print("   Seeding would DELETE all users, leads, calls, follow-ups, notes,")
    print("   audit logs and import logs. Nothing was changed.")
    print("   If you really want to wipe it and load demo data, run:")
    print("       python seed.py --reset")
    db.close()
    sys.exit(1)

print("🌱 Seeding EV CRM database...")

# ─── Clear existing data ───────────────────────────────────────
# Children first: audit/import logs reference leads and users, so deleting
# leads or users while they exist fails on Postgres's foreign keys.
db.query(AuditLog).delete()
db.query(ImportLog).delete()
db.query(LeadNote).delete()
db.query(FollowUp).delete()
db.query(Call).delete()
db.query(Lead).delete()
db.query(User).delete()
db.commit()
print("   Cleared existing data")

# ─── Users ────────────────────────────────────────────────────
# No hardcoded passwords: this repo is public, so anything written here is a
# login anyone can use on a database seeded with it.
SEED_PASSWORD = os.getenv("SEED_PASSWORD", "").strip()


def demo_password() -> str:
    return SEED_PASSWORD or secrets.token_urlsafe(9)


credentials: list[tuple[str, str, str]] = []  # (label, email, password)

manager_password = demo_password()
manager = User(
    name="Admin Manager",
    email="manager@evcrm.com",
    password_hash=get_password_hash(manager_password),
    role=UserRole.MANAGER,
    active=True,
)
db.add(manager)
credentials.append(("Manager", manager.email, manager_password))

employee_data = [
    ("Ahmed Khan",    "ahmed@evcrm.com"),
    ("Sara Malik",    "sara@evcrm.com"),
    ("Bilal Raza",    "bilal@evcrm.com"),
    ("Fatima Shaikh", "fatima@evcrm.com"),
    ("Usman Ali",     "usman@evcrm.com"),
]
employees = []
for name, email in employee_data:
    pwd = demo_password()
    credentials.append((name.split()[0], email, pwd))
    emp = User(
        name=name,
        email=email,
        password_hash=get_password_hash(pwd),
        role=UserRole.EMPLOYEE,
        active=True,
    )
    db.add(emp)
    employees.append(emp)

db.commit()
db.refresh(manager)
for e in employees:
    db.refresh(e)
print(f"   ✓ Created 1 manager + {len(employees)} employees")

# ─── Lead sample data ─────────────────────────────────────────
CITIES = ["Karachi", "Lahore", "Islamabad", "Peshawar", "Quetta", "Dubai", "London", "Riyadh"]
VEHICLES = ["EV Sedan V1", "EV SUV V2", "EV Pickup H1", "EV Van H2", "EV Compact V1"]
UNITS = ["5_units", "10_units", "15_units", "35_units", "1_unit"]
OPS = ["self-operated", "company-operated"]
CALL_TIMES = ["anytime", "9:00_am-12:00_pm", "12:00_pm-3:00_pm", "3:00_pm-6:00_pm"]
SOURCES = ["fb", "ig", "google", "referral", "walk-in"]
OUTCOMES = list(CallOutcome)

STATUS_DIST = [
    (LeadStatus.NEW, 20),
    (LeadStatus.CONTACTED, 20),
    (LeadStatus.FOLLOW_UP, 20),
    (LeadStatus.PENDING, 10),
    (LeadStatus.NO_RESPONSE, 10),
    (LeadStatus.WON, 10),
    (LeadStatus.LOST, 10),
]

status_pool = []
for s, count in STATUS_DIST:
    status_pool.extend([s] * count)

random.shuffle(status_pool)

first_names = ["Ali", "Ayesha", "Hassan", "Hina", "Zain", "Nadia", "Omar", "Sana",
               "Tariq", "Rehan", "Mehwish", "Asif", "Raza", "Shaista", "Imran",
               "Maria", "Jawad", "Bushra", "Kamran", "Zara"]
last_names  = ["Khan", "Ahmed", "Malik", "Raza", "Sheikh", "Butt", "Chaudhry",
               "Siddiqui", "Mirza", "Qureshi", "Ali", "Baig", "Hussain", "Iqbal"]

now = datetime.utcnow()

leads = []
for i in range(100):
    status = status_pool[i]
    emp = random.choice(employees)
    created_days_ago = random.randint(1, 60)
    created_at = now - timedelta(days=created_days_ago)
    name = f"{random.choice(first_names)} {random.choice(last_names)}"
    city = random.choice(CITIES)
    phone = f"03{random.randint(0,4)}{random.randint(10000000,99999999)}"
    from app.services.phone_utils import normalize_phone as np_fn
    norm_phone = np_fn(phone)

    lead = Lead(
        external_lead_id=f"GS-{1000 + i}",
        customer_name=name,
        phone=phone,
        phone_normalized=norm_phone,
        city=city,
        gender=random.choice(["male", "female"]),
        vehicle_interest=random.choice(VEHICLES),
        units=random.choice(UNITS),
        operation_type=random.choice(OPS),
        preferred_call_time=random.choice(CALL_TIMES),
        source=random.choice(SOURCES),
        campaign=random.choice(["ROAS_Aug2026", "Brand_Awareness", "Lead_Gen_Q3"]),
        status=status,
        assigned_employee_id=emp.id,
        source_created_at=created_at,
        created_at=created_at,
        updated_at=created_at,
    )
    db.add(lead)
    leads.append((lead, emp, created_at))

db.flush()

# ─── Calls, follow-ups, notes for non-NEW leads ───────────────
follow_up_count = 0
call_count = 0

for lead, emp, created_at in leads:
    if lead.status == LeadStatus.NEW:
        continue

    # Add 1-3 calls
    n_calls = random.randint(1, 3)
    for attempt in range(1, n_calls + 1):
        call_time = created_at + timedelta(hours=random.randint(2, 48) * attempt)
        outcome = random.choice(OUTCOMES)
        c = Call(
            lead_id=lead.id,
            employee_id=emp.id,
            call_datetime=call_time,
            outcome=outcome,
            notes=random.choice([
                "Customer was interested, will call back.",
                "No answer, tried twice.",
                "Customer asked for brochure.",
                "Customer comparing with other brands.",
                None,
            ]),
            attempt_number=attempt,
        )
        db.add(c)
        lead.contact_attempt_count = attempt
        lead.last_call_at = call_time
        call_count += 1

    # Follow-up leads
    if lead.status == LeadStatus.FOLLOW_UP:
        # 30% are overdue
        if random.random() < 0.3:
            scheduled_at = now - timedelta(hours=random.randint(2, 72))
        else:
            scheduled_at = now + timedelta(hours=random.randint(1, 72))

        fu = FollowUp(
            lead_id=lead.id,
            employee_id=emp.id,
            scheduled_at=scheduled_at,
            status=FollowUpStatus.SCHEDULED,
            notes="Follow-up as discussed.",
        )
        db.add(fu)
        lead.next_follow_up_at = scheduled_at
        follow_up_count += 1

    # Notes
    note_text = random.choice([
        "Customer is interested in fleet purchase.",
        "Waiting for management approval.",
        "Customer prefers evening calls.",
        "Referred by existing customer.",
    ])
    n = LeadNote(lead_id=lead.id, employee_id=emp.id, content=note_text)
    db.add(n)

db.commit()
print(f"   ✓ Created 100 leads, {call_count} call logs, {follow_up_count} follow-ups")
print()
print("─" * 50)
print("✅ Seed complete!")
print()
print("Login credentials:")
for label, email, pwd in credentials:
    print(f"  {label:<8}: {email:<20} /  {pwd}")
if not SEED_PASSWORD:
    print()
    print("  These passwords were generated randomly and are not stored anywhere")
    print("  else — save them now. Set SEED_PASSWORD to choose your own.")
