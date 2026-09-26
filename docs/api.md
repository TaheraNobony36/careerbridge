# API Design

The backend exposes REST endpoints under the `/api/v1` prefix. The initial scaffold provides a health ping at `/api/v1/health` and will expand into auth, student, company, jobs, applications, CV, chat, payments, notifications, and admin APIs.

## Conventions

- All protected endpoints should require authentication and RBAC checks.
- Errors should follow a consistent JSON object shape.
- Pagination should use `page` and `page_size` parameters.
- FastAPI OpenAPI docs are automatically available at `/docs`.
