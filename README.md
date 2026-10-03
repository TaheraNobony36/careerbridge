# CareerBridge

CareerBridge is a production-oriented internship and job platform for students, companies, recruiters, and administrators. This repository contains a monorepo scaffold for a fast API backend and a Vite React frontend intended for deployment on Render.

## Stack

- Frontend: React + TypeScript + Vite + Tailwind-ready structure
- Backend: Python 3.12 + FastAPI + SQLAlchemy + Pydantic
- Database: PostgreSQL
- Cache/background jobs: Redis
- Storage: S3-compatible abstraction layer design
- Deployment: Docker + Render

## Repository Layout

- backend/app: FastAPI application packages
- backend/tests: backend tests
- frontend: React frontend
- docs: project documentation
- .github/workflows: CI/CD workflow files

## Getting Started

### 1. Create environment file

Copy the example environment file from the repo root:

```
cp .env.example .env
```

### 2. Backend setup

```
cd backend
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

### 3. Frontend setup

```
cd frontend
npm install
npm run dev -- --host 0.0.0.0
```

### 4. Docker compose

```
docker compose up --build
```

## Phase 1 foundation status

The project has been organized into a clean starter structure for the planned CareerBridge architecture:

- backend/app/api for versioned route modules
- backend/app/config for environment settings
- backend/app/database for database session initialization
- backend/app/core, models, schemas, services, repositories, middleware, and utils for future business logic
- frontend/src with prepared component, page, hook, service, context, type, utility, and route directories

This keeps the repo ready for the next steps in authentication, profiles, and job management without replacing the existing scaffold.

## Phase 2 database foundation status

The backend now includes a working PostgreSQL + SQLAlchemy foundation and the first Alembic migration:

- SQLAlchemy engine and session configuration in [backend/app/database/session.py](backend/app/database/session.py)
- Declarative base in [backend/app/database/base.py](backend/app/database/base.py)
- Initial user model in [backend/app/models/user.py](backend/app/models/user.py)
- Alembic config in [backend/alembic.ini](backend/alembic.ini)
- Initial migration in [backend/alembic/versions/20261003120000_initial_user_model.py](backend/alembic/versions/20261003120000_initial_user_model.py)

To apply the migration locally:

```
cd backend
alembic upgrade head
```

## Phase 3 authentication and RBAC status

The backend now includes the first auth layer for students, companies, and admins:

- JWT access and refresh token generation in [backend/app/core/security.py](backend/app/core/security.py)
- Student and company registration endpoints in [backend/app/api/v1/routes/auth.py](backend/app/api/v1/routes/auth.py)
- Login, logout, refresh, and current-user endpoints in [backend/app/api/v1/routes/auth.py](backend/app/api/v1/routes/auth.py)
- Admin-only user listing in [backend/app/api/v1/routes/admin.py](backend/app/api/v1/routes/admin.py)
- Public auth schemas in [backend/app/schemas/auth.py](backend/app/schemas/auth.py)

Example auth endpoints:

```
POST /api/v1/auth/register/student
POST /api/v1/auth/register/company
POST /api/v1/auth/login
POST /api/v1/auth/refresh
POST /api/v1/auth/logout
GET /api/v1/auth/me
GET /api/v1/admin/users
```

## Quality Gates

- Backend tests: `pytest`
- Frontend build: `npm run build`
- Linting: `ruff` and `npm run lint`

## Important Notes

- Do not commit real secrets.
- Keep uploaded files in object storage rather than local app storage.
- Use the modular architecture defined in the project brief.

## Roadmap

The project is planned in staged phases from authentication and profiles through job search, skill matching, applications, CV generation, payments, chat, and admin systems.
