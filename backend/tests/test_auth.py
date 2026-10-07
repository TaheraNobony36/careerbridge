from datetime import timedelta
from hashlib import sha256
from uuid import UUID, uuid4

import pytest
from fastapi import HTTPException
from fastapi.testclient import TestClient

from app.core.security import (
    create_access_token,
    hash_password,
    require_roles,
    verify_password,
)
from app.database.session import SessionLocal
from app.main import app
from app.models.refresh_token import RefreshToken
from app.models.user import User, UserRole


@pytest.fixture()
def client():
    with TestClient(app) as test_client:
        yield test_client


def _create_user(role: UserRole, is_active: bool = True) -> User:
    with SessionLocal() as db:
        user = User(
            email=f"{role.value}-{uuid4()}@example.com",
            password_hash=hash_password("AdminPassword123"),
            role=role.value,
            is_active=is_active,
        )
        db.add(user)
        db.commit()
        db.refresh(user)
        return user


def test_student_registration_login_and_current_user(client: TestClient) -> None:
    email = f"student-auth-{uuid4()}@example.com"
    response = client.post(
        "/api/v1/auth/register",
        json={"email": email.upper(), "password": "StrongPass123!", "role": "student"},
    )
    assert response.status_code == 201, response.text
    body = response.json()
    assert body["user"]["email"] == email
    assert body["user"]["role"] == "student"
    assert body["user"]["is_active"] is True
    assert "password_hash" not in body["user"]
    assert "refresh_token" not in body
    assert "httponly" in response.headers["set-cookie"].lower()
    with SessionLocal() as db:
        stored_user = db.get(User, UUID(body["user"]["id"]))
        assert stored_user is not None
        assert stored_user.password_hash != "StrongPass123!"
        assert verify_password("StrongPass123!", stored_user.password_hash)

    headers = {"Authorization": f"Bearer {body['access_token']}"}
    current_user = client.get("/api/v1/auth/me", headers=headers)
    assert current_user.status_code == 200
    assert current_user.json() == body["user"]

    login_response = client.post(
        "/api/v1/auth/login",
        json={"email": email.upper(), "password": "StrongPass123!"},
    )
    assert login_response.status_code == 200
    assert login_response.json()["user"]["id"] == body["user"]["id"]
    assert login_response.json()["token_type"] == "bearer"
    assert "refresh_token" not in login_response.json()


def test_company_registration_legacy_route_is_preserved(client: TestClient) -> None:
    response = client.post(
        "/api/v1/auth/register/company",
        json={
            "email": f"company-{uuid4()}@example.com",
            "password": "StrongPass123!",
            "full_name": "Company Contact",
            "company_name": "Bridge Coders",
        },
    )
    assert response.status_code == 201, response.text
    assert response.json()["user"]["role"] == "company"


@pytest.mark.parametrize("role", ["admin", "super_admin"])
def test_public_registration_rejects_privileged_roles(client: TestClient, role: str) -> None:
    response = client.post(
        "/api/v1/auth/register",
        json={"email": f"privileged-{uuid4()}@example.com", "password": "StrongPass123!", "role": role.upper()},
    )
    assert response.status_code == 403


def test_registration_validates_email_password_and_duplicate_email(client: TestClient) -> None:
    base_payload = {"password": "StrongPass123!", "role": "student"}
    assert client.post("/api/v1/auth/register", json={**base_payload, "email": "invalid"}).status_code == 422
    assert client.post(
        "/api/v1/auth/register",
        json={**base_payload, "email": f"weak-{uuid4()}@example.com", "password": "short"},
    ).status_code == 422

    email = f"duplicate-{uuid4()}@example.com"
    payload = {**base_payload, "email": email}
    assert client.post("/api/v1/auth/register", json=payload).status_code == 201
    duplicate = client.post("/api/v1/auth/register", json={**payload, "email": email.upper()})
    assert duplicate.status_code == 409


def test_login_rejects_wrong_missing_and_inactive_users(client: TestClient) -> None:
    user = _create_user(UserRole.STUDENT)
    inactive_user = _create_user(UserRole.STUDENT, is_active=False)

    wrong_password = client.post(
        "/api/v1/auth/login",
        json={"email": user.email, "password": "WrongPassword123"},
    )
    missing_user = client.post(
        "/api/v1/auth/login",
        json={"email": "missing@example.com", "password": "WrongPassword123"},
    )
    inactive = client.post(
        "/api/v1/auth/login",
        json={"email": inactive_user.email, "password": "AdminPassword123"},
    )
    assert wrong_password.status_code == missing_user.status_code == inactive.status_code == 401
    assert wrong_password.json()["detail"] == missing_user.json()["detail"] == inactive.json()["detail"]
    inactive_token = create_access_token(str(inactive_user.id), UserRole.ADMIN.value)
    assert client.get(
        "/api/v1/auth/me",
        headers={"Authorization": f"Bearer {inactive_token}"},
    ).status_code == 401


def test_access_token_validation_and_missing_token(client: TestClient) -> None:
    user = _create_user(UserRole.STUDENT)
    valid_token = create_access_token(str(user.id), user.role)
    expired_token = create_access_token(str(user.id), user.role, expires_delta=timedelta(seconds=-1))

    assert client.get("/api/v1/auth/me").status_code == 401
    assert client.get("/api/v1/auth/me", headers={"Authorization": "Bearer invalid"}).status_code == 401
    assert client.get(
        "/api/v1/auth/me",
        headers={"Authorization": f"Bearer {expired_token}"},
    ).status_code == 401
    assert client.get(
        "/api/v1/auth/me",
        headers={"Authorization": f"Bearer {valid_token}"},
    ).status_code == 200


def test_role_access_is_enforced_for_student_company_admin_and_super_admin(client: TestClient) -> None:
    student = _create_user(UserRole.STUDENT)
    company = _create_user(UserRole.COMPANY)
    admin = _create_user(UserRole.ADMIN)
    super_admin = _create_user(UserRole.SUPER_ADMIN)
    student_headers = {"Authorization": f"Bearer {create_access_token(str(student.id), student.role)}"}
    company_headers = {"Authorization": f"Bearer {create_access_token(str(company.id), company.role)}"}
    admin_headers = {"Authorization": f"Bearer {create_access_token(str(admin.id), admin.role)}"}
    super_admin_headers = {
        "Authorization": f"Bearer {create_access_token(str(super_admin.id), super_admin.role)}"
    }

    assert client.get("/api/v1/applications/my", headers=student_headers).status_code == 200
    assert client.get("/api/v1/jobs/my", headers=student_headers).status_code == 403
    assert client.get("/api/v1/admin/users", headers=student_headers).status_code == 403
    forged_admin_token = create_access_token(str(student.id), UserRole.ADMIN.value)
    assert client.get(
        "/api/v1/admin/users",
        headers={"Authorization": f"Bearer {forged_admin_token}"},
    ).status_code == 403

    assert client.get("/api/v1/jobs/my", headers=company_headers).status_code == 200
    assert client.get("/api/v1/applications/my", headers=company_headers).status_code == 403
    assert client.get("/api/v1/admin/users", headers=company_headers).status_code == 403

    assert client.get("/api/v1/admin/users", headers=admin_headers).status_code == 200
    assert client.get("/api/v1/auth/admin-check", headers=admin_headers).status_code == 200
    assert client.get("/api/v1/admin/users", headers=super_admin_headers).status_code == 200

    require_super_admin = require_roles(UserRole.SUPER_ADMIN)
    with pytest.raises(HTTPException) as forbidden:
        require_super_admin(user=admin)
    assert forbidden.value.status_code == 403
    assert require_super_admin(user=super_admin) is super_admin


def test_refresh_rotates_token_and_logout_revokes_session(client: TestClient) -> None:
    registration = client.post(
        "/api/v1/auth/register",
        json={"email": f"refresh-{uuid4()}@example.com", "password": "StrongPass123!", "role": "student"},
    )
    assert registration.status_code == 201
    access_token = registration.json()["access_token"]
    original_refresh = client.cookies.get("careerbridge_refresh")
    assert original_refresh is not None
    assert client.get(
        "/api/v1/auth/me",
        headers={"Authorization": f"Bearer {original_refresh}"},
    ).status_code == 401

    old_hash = sha256(original_refresh.encode("utf-8")).hexdigest()
    with SessionLocal() as db:
        assert db.query(RefreshToken).filter(RefreshToken.token_hash == old_hash).one_or_none() is not None

    refreshed = client.post("/api/v1/auth/refresh")
    assert refreshed.status_code == 200, refreshed.text
    rotated_refresh = refreshed.cookies.get("careerbridge_refresh") or client.cookies.get("careerbridge_refresh")
    assert rotated_refresh is not None
    assert rotated_refresh != original_refresh

    client.cookies.set("careerbridge_refresh", original_refresh, path="/api/v1/auth")
    replay = client.post("/api/v1/auth/refresh")
    assert replay.status_code == 401
    assert "max-age=0" in replay.headers["set-cookie"].lower()

    client.cookies.set("careerbridge_refresh", rotated_refresh, path="/api/v1/auth")
    rotated_hash = sha256(rotated_refresh.encode("utf-8")).hexdigest()
    logout = client.post("/api/v1/auth/logout")
    assert logout.status_code == 200
    with SessionLocal() as db:
        stored_session = db.query(RefreshToken).filter(RefreshToken.token_hash == rotated_hash).one()
        assert stored_session.revoked_at is not None
    assert client.post("/api/v1/auth/refresh").status_code == 401
    assert client.get(
        "/api/v1/auth/me",
        headers={"Authorization": f"Bearer {access_token}"},
    ).status_code == 200
