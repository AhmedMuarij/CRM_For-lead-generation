# 🚀 EV CRM --- Lead Generation & Management System

```{=html}
<p align="center">
```
`<strong>`{=html}A full-stack CRM platform for managing EV leads, sales
activities, follow-ups, employees, and reports.`</strong>`{=html}
```{=html}
</p>
```
```{=html}
<p align="center">
```
`<a href="https://crm-frontend-seven-mu.vercel.app/">`{=html}🌐 Live
Demo`</a>`{=html} •
`<a href="https://github.com/AhmedMuarij/CRM_For-lead-generation">`{=html}💻
GitHub Repository`</a>`{=html}
```{=html}
</p>
```

------------------------------------------------------------------------

## 📌 Overview

**EV CRM** is a full-stack Lead Generation and Customer Relationship
Management system designed to organize the complete lead-management
workflow in one place.

The application provides a modern dashboard for managing leads,
employees, calls, follow-ups, reports, notes, and Google Sheets imports.

The project follows a **monorepo architecture** with separate frontend
and backend deployments:

-   **Frontend:** Next.js + React + TypeScript
-   **Backend:** FastAPI + Python
-   **Database:** PostgreSQL on Neon
-   **Deployment:** Vercel
-   **Source Control:** GitHub

------------------------------------------------------------------------

## ✨ Key Features

-   📊 **Dashboard** --- Overview of CRM activity and key metrics
-   🎯 **Lead Management** --- Create, update, assign, track, and manage
    leads
-   👥 **Employee Management** --- Manage users and roles
-   🔐 **Authentication** --- Secure login and role-based access
-   📞 **Call Tracking** --- Record and manage lead calls
-   🔔 **Follow-ups** --- Schedule and track follow-up activities
-   📝 **Lead Notes & Activities** --- Maintain important lead
    information
-   📈 **Reports & Analytics** --- View business and sales performance
-   📥 **Google Sheets Import** --- Import leads from Google Sheets
-   🗄️ **PostgreSQL Database** --- Relational database for persistent
    CRM data
-   🔄 **Alembic Migrations** --- Version-controlled database schema
-   ☁️ **Production Deployment** --- Frontend and backend deployed
    separately on Vercel

------------------------------------------------------------------------

## 🖼️ Screenshots

> Add your project screenshots below. Recommended screenshots:
> Dashboard, Leads, Lead Details, Follow-ups, Reports, and Employee
> Management.

### 📊 Dashboard

<img width="1353" height="604" alt="Screenshot 2026-08-21 034330" src="https://github.com/user-attachments/assets/70922ef7-3c80-4686-b3dc-f09f954ed86f" />


### 🎯 Lead Management

<img width="1365" height="605" alt="Screenshot 2026-08-21 034438" src="https://github.com/user-attachments/assets/269c9223-6ffd-4b96-a4dd-c87888d0ba76" />

### 📞 Calls & Follow-ups

<img width="1365" height="606" alt="Screenshot 2026-08-21 034413" src="https://github.com/user-attachments/assets/01a13bf7-fcfe-4884-ba8b-5ae9257542b2" />


### 📈 Reports & Analytics

<img width="1366" height="611" alt="Screenshot 2026-08-21 034557" src="https://github.com/user-attachments/assets/920d24a5-1672-49b3-8dd2-4456582575c3" />


------------------------------------------------------------------------

## 🏗️ System Architecture

``` text
                         ┌─────────────────────┐
                         │       User          │
                         └──────────┬──────────┘
                                    │
                                    ▼
                    ┌───────────────────────────┐
                    │     Next.js Frontend      │
                    │   React + TypeScript      │
                    └─────────────┬─────────────┘
                                  │
                              REST API
                                  │
                                  ▼
                    ┌───────────────────────────┐
                    │      FastAPI Backend      │
                    │       Python API           │
                    └─────────────┬─────────────┘
                                  │
                    ┌─────────────┴─────────────┐
                    ▼                           ▼
          ┌──────────────────┐        ┌──────────────────┐
          │ PostgreSQL / Neon│        │ Google Sheets API│
          └──────────────────┘        └──────────────────┘
```

------------------------------------------------------------------------

## 🛠️ Tech Stack

### Frontend

-   Next.js
-   React
-   TypeScript
-   Tailwind CSS
-   Axios
-   Lucide React
-   Heroicons
-   React Hot Toast

### Backend

-   Python
-   FastAPI
-   SQLAlchemy
-   Alembic
-   Pydantic
-   Pydantic Settings
-   JWT Authentication
-   bcrypt
-   gspread
-   Google Authentication

### Database & Deployment

-   PostgreSQL
-   Neon
-   Vercel
-   GitHub

------------------------------------------------------------------------

## 📁 Project Structure

``` text
CRM_For-lead-generation/
│
├── backend/
│   ├── alembic/              # Database migrations
│   ├── api/                  # API routes
│   ├── app/                  # Application logic
│   ├── tests/                # Backend tests
│   ├── seed.py               # Demo/initial data
│   ├── requirements.txt      # Python dependencies
│   └── vercel.json           # Backend deployment config
│
├── frontend/
│   ├── app/                  # Next.js application
│   ├── components/           # Reusable UI components
│   ├── public/               # Static assets
│   ├── package.json          # Node dependencies
│   └── ...
│
├── DEPLOYMENT.md             # Deployment instructions
├── .gitignore
└── README.md
```

------------------------------------------------------------------------

## 🚀 Live Demo

### 🌐 Production Frontend

**https://crm-frontend-seven-mu.vercel.app/**

The frontend and backend are deployed separately using Vercel, with
PostgreSQL hosted on Neon.

------------------------------------------------------------------------

## ⚙️ Local Development

### 1. Clone the repository

``` bash
git clone https://github.com/AhmedMuarij/CRM_For-lead-generation.git
cd CRM_For-lead-generation
```

### 2. Backend Setup

``` bash
cd backend
python -m venv .venv
```

Install dependencies:

``` bash
python -m pip install -r requirements.txt
```

Configure your environment variables:

``` env
DATABASE_URL=your_postgresql_connection_string
SECRET_KEY=your_secret_key
FRONTEND_ORIGIN=http://localhost:3000
```

Run database migrations:

``` bash
python -m alembic upgrade head
```

Seed demo data if required:

``` bash
python seed.py
```

Start the FastAPI backend:

``` bash
uvicorn app.main:app --reload
```

### 3. Frontend Setup

Open another terminal:

``` bash
cd frontend
npm install
npm run dev
```

Then open:

``` text
http://localhost:3000
```

------------------------------------------------------------------------

## 🔐 Environment Variables

### Backend

``` env
DATABASE_URL=
SECRET_KEY=
FRONTEND_ORIGIN=
```

### Frontend

``` env
NEXT_PUBLIC_API_URL=
```

> Never commit real `.env` files, database passwords, API keys, or
> production secrets to GitHub.

------------------------------------------------------------------------

## ☁️ Deployment Architecture

``` text
                     GitHub Repository
                            │
                ┌───────────┴───────────┐
                │                       │
                ▼                       ▼
          frontend/                 backend/
                │                       │
                ▼                       ▼
        Vercel Frontend          Vercel Backend
                                        │
                                        ▼
                                Neon PostgreSQL
```

------------------------------------------------------------------------

## 📦 Deployment

This repository uses one GitHub repository with two Vercel projects:

### Frontend

``` text
Root Directory: frontend
Framework: Next.js
```

### Backend

``` text
Root Directory: backend
Framework: FastAPI
```

The backend connects to Neon PostgreSQL using the production
`DATABASE_URL`.

See [`DEPLOYMENT.md`](./DEPLOYMENT.md) for the complete deployment
process.

------------------------------------------------------------------------

## 🎯 Project Goals

This project was built to gain practical experience in:

-   Full-stack web development
-   REST API development
-   Database design and management
-   Authentication and authorization
-   Frontend/backend integration
-   Third-party API integration
-   CRM workflow design
-   Database migrations
-   Production deployment
-   Performance optimization
-   Real-world business application development

------------------------------------------------------------------------

## 🔒 Security Notes

-   Never expose production database credentials.
-   Never commit `.env` files.
-   Use a strong and unique production `SECRET_KEY`.
-   Change all demo/seeded passwords before real-world use.
-   Restrict database credentials and API access appropriately.

------------------------------------------------------------------------

## 👨‍💻 Author

### Ahmed Muarij Siddiqui

**Software Engineering Student \| Full-Stack Developer**

Interested in software engineering, AI/ML, web development, and building
practical real-world applications.

-   GitHub: https://github.com/AhmedMuarij
-   Repository: https://github.com/AhmedMuarij/CRM_For-lead-generation
-   Live Project: https://crm-frontend-seven-mu.vercel.app/

------------------------------------------------------------------------

## ⭐ Support

If you find this project useful or interesting, consider giving the
repository a ⭐.

------------------------------------------------------------------------

```{=html}
<p align="center">
```
`<strong>`{=html}Built with ❤️ by Ahmed Muarij`</strong>`{=html}
```{=html}
</p>
```
