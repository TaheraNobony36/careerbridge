import uuid

from fastapi.testclient import TestClient

from app.core.security import get_password_hash
from app.database.session import SessionLocal
from app.main import app
from app.models.user import User

client = TestClient(app)


def test_student_registration_and_login() -> None:
    email = f"student.auth.{uuid.uuid4().hex}@example.com"
    payload = {
        "email": email,
        "password": "StrongPass123!",
        "full_name": "Student Auth",
    }

    response = client.post("/api/v1/auth/register/student", json=payload)
    assert response.status_code == 201, response.text
    body = response.json()
    assert body["user"]["email"] == email
    assert body["user"]["role"] == "student"

    login_response = client.post(
        "/api/v1/auth/login",
        json={"email": email, "password": "StrongPass123!"},
    )
    assert login_response.status_code == 200, login_response.text
    login_body = login_response.json()
    assert "access_token" in login_body
    assert "refresh_token" in login_body
    assert login_body["token_type"] == "bearer"


def test_company_registration_and_admin_guard() -> None:
    company_email = f"company.auth.{uuid.uuid4().hex}@example.com"
    response = client.post(
        "/api/v1/auth/register/company",
        json={
            "email": company_email,
            "password": "StrongPass123!",
            "full_name": "Company Auth",
            "company_name": "Bridge Coders",
        },
    )
    assert response.status_code == 201, response.text
    assert response.json()["user"]["role"] == "company"

    admin_email = f"admin.auth.{uuid.uuid4().hex}@example.com"
    db = SessionLocal()
    db.add(
        User(
            email=admin_email,
            password_hash=get_password_hash("AdminPass123!"),
            role="admin",
            is_active=True,
        )
    )
    db.commit()
    db.close()

    token_response = client.post(
        "/api/v1/auth/login",
        json={"email": admin_email, "password": "AdminPass123!"},
    )
    assert token_response.status_code == 200, token_response.text
    admin_token = token_response.json()["access_token"]

    admin_response = client.get(
        "/api/v1/admin/users",
        headers={"Authorization": f"Bearer {admin_token}"},
    )
    assert admin_response.status_code == 200, admin_response.text

    company_login = client.post(
        "/api/v1/auth/login",
        json={"email": company_email, "password": "StrongPass123!"},
    )
    assert company_login.status_code == 200, company_login.text
    company_token = company_login.json()["access_token"]

    forbidden_response = client.get(
        "/api/v1/admin/users",
        headers={"Authorization": f"Bearer {company_token}"},
    )
    assert forbidden_response.status_code == 403, forbidden_response.text
