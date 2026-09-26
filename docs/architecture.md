# Architecture

This project follows a layered architecture with a Python FastAPI backend and a React frontend. The backend is structured around API, services, repositories, models, schemas, integrations, and workers. The frontend is a Vite app optimized for a clean, responsive experience.

## Core principles

- Clear separation of API handlers and business logic
- Database access behind repositories/services
- External integrations isolated behind provider abstractions
- RBAC and auth checks on every protected route
- Render-friendly deployment configuration
- Open, portable technology choices without Azure dependencies
