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

Copy the example environment file:

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
