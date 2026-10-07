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

PostgreSQL is the supported application database. Configure `DATABASE_URL` in the repository-root `.env`; for local Compose use matching `POSTGRES_DB`, `POSTGRES_USER`, `POSTGRES_PASSWORD`, and `POSTGRES_PORT` values. Keep these local development credentials out of production deployments.

Start the PostgreSQL service from the repository root:

```
docker compose up -d postgres
```

Alembic reads `DATABASE_URL` from the same backend settings as the application. From `backend/`, apply the schema or inspect the current revision:

```
alembic upgrade head
alembic current
```

The migrations create the existing schema, including the initial `users` table and later tables already present in the repository. To verify a rollback, use only a disposable test database:

```
alembic downgrade -1
alembic upgrade head
```

## Authentication and RBAC

Authentication uses bcrypt password hashes, short-lived access JWTs, and rotating refresh JWTs. Configure `SECRET_KEY`, `JWT_SECRET_KEY`, `JWT_REFRESH_SECRET`, `JWT_ALGORITHM`, `ACCESS_TOKEN_EXPIRE_MINUTES`, and `REFRESH_TOKEN_EXPIRE_DAYS` in the root `.env`. New passwords must be at least 12 characters and include uppercase, lowercase, and numeric characters.

Available endpoints:

```
POST /api/v1/auth/register              role: student or company
POST /api/v1/auth/register/student       compatibility endpoint
POST /api/v1/auth/register/company      compatibility endpoint
POST /api/v1/auth/login
POST /api/v1/auth/refresh
POST /api/v1/auth/logout
GET  /api/v1/auth/me
GET  /api/v1/admin/users
```

Refresh tokens are stored in the browser only as an HttpOnly cookie; PostgreSQL stores their SHA-256 fingerprints and revocation timestamps. Access tokens remain in frontend memory. Logout revokes the refresh session, while already issued access tokens expire naturally. The cookie is Secure and SameSite=None outside development/test environments.

Public registration cannot create `admin` or `super_admin` users. To bootstrap an admin, apply migrations and run `python -m app.cli.create_admin` from `backend/`; the command prompts for an email and password without echoing or storing the password in source.

## Testing

```
cd backend
alembic upgrade head
pytest -q
```

```
cd frontend
npm run build
npm run lint
```
