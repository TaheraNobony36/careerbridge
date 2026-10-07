# API Design

The backend exposes REST endpoints under the `/api/v1` prefix. Current foundation endpoints include the API/database health check, authentication, and the existing protected application routes.

## Authentication

- `POST /api/v1/auth/register` creates student or company accounts. The role must be `student` or `company`; privileged roles are rejected.
- `POST /api/v1/auth/register/student` and `POST /api/v1/auth/register/company` remain as compatibility endpoints.
- `POST /api/v1/auth/login` returns an access token and safe user data; a refresh token is set in an HttpOnly cookie.
- `POST /api/v1/auth/refresh` rotates the refresh cookie and returns a new access token.
- `POST /api/v1/auth/logout` revokes the refresh session and clears the cookie.
- `GET /api/v1/auth/me` requires a Bearer access token and returns public user fields only.
- `GET /api/v1/admin/users` requires an admin or super-admin access token.

Access tokens are short-lived and stateless. Refresh-token fingerprints and revocation state are stored in PostgreSQL. Role checks load the current User record from the database rather than trusting role claims from the client.

## Conventions

- All protected endpoints should require authentication and RBAC checks.
- Errors should follow a consistent JSON object shape.
- Pagination should use `page` and `page_size` parameters.
- FastAPI OpenAPI docs are automatically available at `/docs`.
