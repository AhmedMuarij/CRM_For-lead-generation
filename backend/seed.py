#!/usr/bin/env python3
"""
Seed script: creates 1 manager, 5 employees, and 100 sample leads
with varied statuses, calls, follow-ups, and notes.

Usage (from backend/ directory):
    python seed.py
"""
import sys
import os
import random
from datetime import datetime, timedelta

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app.database import SessionLocal, engine
from app.models import User, Lead, Call, FollowUp, LeadNote
from app.models.user import UserRole
from app.models.lead import LeadStatus
from app.models.call import CallOutcome
from app.models.follow_up import FollowUpStatus
from app.auth.utils import get_password_hash
from app.database import Base

# Create all tables (in case migrations haven't run yet)
Base.metadata.create_all(bind=engine)

db = SessionLocal()

print("🌱 Seeding EV CRM database...")

# ─── Clear existing data ───────────────────────────────────────
db.query(LeadNote).delete()
db.query(FollowUp).delete()
db.query(Call).delete()
db.query(Lead).delete()
db.query(User).delete()
db.commit()
print("   Cleared existing data")

# ─── Users ────────────────────────────────────────────────────
manager = User(
    name="Admin Manager",
    email="manager@evcrm.com",
    password_hash=get_password_hash("Manager@123"),
    role=UserRole.MANAGER,
    active=True,
)
db.add(manager)

employee_data = [
    ("Ahmed Khan",    "ahmed@evcrm.com",    "Ahmed@123"),
    ("Sara Malik",    "sara@evcrm.com",     "Sara@123"),
    ("Bilal Raza",    "bilal@evcrm.com",    "Bilal@123"),
    ("Fatima Shaikh", "fatima@evcrm.com",   "Fatima@123"),
    ("Usman Ali",     "usman@evcrm.com",    "Usman@123"),
]
employees = []
for name, email, pwd in employee_data:
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
print("  Manager : manager@evcrm.com  /  Manager@123")
print("  Ahmed   : ahmed@evcrm.com    /  Ahmed@123")
print("  Sara    : sara@evcrm.com     /  Sara@123")
print("  Bilal   : bilal@evcrm.com    /  Bilal@123")
print("  Fatima  : fatima@evcrm.com   /  Fatima@123")
print("  Usman   : usman@evcrm.com    /  Usman@123")
