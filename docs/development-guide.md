# Development Guide

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
