# Development Guide

## Environment setup

Create the repo-root environment file before running the app:

```
cp .env.example .env
```

## Local backend

```
cd backend
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

## Local frontend

```
cd frontend
npm install
npm run dev -- --host 0.0.0.0
```

## Project foundation layout

The Phase 1 foundation introduces a cleaner structure for later work:

- backend/app/api/v1/routes/health.py for API routing
- backend/app/database/session.py for database session setup
- backend/app/config/settings.py for environment-aware settings
- empty domain folders for future app growth
- frontend/src folders for components, pages, services, hooks, and routes

## Database foundation

Phase 2 adds the SQLAlchemy + PostgreSQL setup used for the core user model and migrations.

- [backend/app/database/base.py](backend/app/database/base.py): common DeclarativeBase
- [backend/app/models/user.py](backend/app/models/user.py): initial user table
- [backend/alembic.ini](backend/alembic.ini): Alembic config
- [backend/alembic/versions/20261003120000_initial_user_model.py](backend/alembic/versions/20261003120000_initial_user_model.py): first migration

To initialize the database schema:

```
cd backend
alembic upgrade head
```

## Authentication and RBAC

Phase 3 adds the first auth layer for the platform:

- [backend/app/core/security.py](backend/app/core/security.py): password hashing, JWT creation, token decoding, and role enforcement
- [backend/app/api/v1/routes/auth.py](backend/app/api/v1/routes/auth.py): registration, login, logout, refresh, and current-user routes
- [backend/app/api/v1/routes/admin.py](backend/app/api/v1/routes/admin.py): admin-only guard for management APIs

Main auth flows:

```
POST /api/v1/auth/register/student
POST /api/v1/auth/register/company
POST /api/v1/auth/login
POST /api/v1/auth/refresh
POST /api/v1/auth/logout
GET /api/v1/auth/me
GET /api/v1/admin/users
```

## Testing

```
cd backend
source .venv/bin/activate
pytest
```

```
cd frontend
npm run build
npm run lint
```
