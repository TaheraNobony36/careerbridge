# CareerBridge

CareerBridge is a monorepo with a FastAPI backend and a React, TypeScript, and Vite frontend. The repository already contains database-backed routes and user-facing screens; this guide covers local setup without introducing new product features.

## Prerequisites

- Python 3.12+
- Node.js 20+
- PostgreSQL 16, or Docker Compose for a local PostgreSQL instance

## Backend setup

From the repository root, create the environment file and a virtual environment:

```sh
cp -n .env.example .env
cd backend
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
```

## Frontend setup

```sh
cd frontend
cp -n .env.example .env
npm install
```

## Environment variables

Backend settings are loaded from the repository-root `.env`. Set `DATABASE_URL` for your PostgreSQL instance and use local-only values for `SECRET_KEY`, `JWT_SECRET_KEY`, and `JWT_REFRESH_SECRET`. Set `JWT_ALGORITHM`, `ACCESS_TOKEN_EXPIRE_MINUTES`, and `REFRESH_TOKEN_EXPIRE_DAYS` as needed. For Compose, `POSTGRES_USER`, `POSTGRES_PASSWORD`, and `POSTGRES_DB` must match the credentials in `DATABASE_URL`. `CORS_ORIGINS` accepts a comma-separated list of frontend origins. `JWT_SECRET` remains supported as an alias for `JWT_SECRET_KEY`.

The frontend reads `VITE_API_BASE_URL` from `frontend/.env`; the default is `http://localhost:8000/api/v1`. Never put production secrets in either environment file or frontend variables.

## Running locally

Start PostgreSQL from the repository root after setting the connection values in `.env`:

```sh
docker compose up -d postgres
```

Then run the backend from `backend/`:

```sh
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

Run the frontend from `frontend/` in a second terminal:

```sh
npm run dev -- --host 0.0.0.0
```

The API root is `/`, the health check is `/api/v1/health`, and the OpenAPI interfaces are `/docs` and `/redoc`.

## Authentication

Register with `POST /api/v1/auth/register` using an email, a password of at least 12 characters with uppercase, lowercase, and numeric characters, and role `student` or `company`. The existing `/register/student` and `/register/company` endpoints remain available. Admin roles cannot self-register; create an initial admin interactively from `backend/` with `python -m app.cli.create_admin` after applying migrations.

Login and registration return a 15-minute access token by default and safe user data. The refresh token is stored as a SHA-256 fingerprint in PostgreSQL and sent only as an HttpOnly cookie (7-day lifetime by default). The frontend keeps the access token in memory and uses the cookie to restore and refresh a session. Logout revokes the refresh session; already issued stateless access tokens can remain valid until their configured expiry.

To run the API and PostgreSQL with Docker Compose:

```sh
docker compose up --build
```

## Running tests

With PostgreSQL available and `DATABASE_URL` set, run migrations and backend tests:

```sh
cd backend
alembic upgrade head
pytest -q
```

Exercise a migration rollback only against a disposable or test database:

```sh
cd backend
alembic downgrade -1
alembic upgrade head
```

Run frontend lint and production build:

```sh
cd frontend
npm run lint
npm run build
```
