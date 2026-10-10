from uuid import uuid4

import pytest
from fastapi.testclient import TestClient
from pydantic import ValidationError

from app.core.security import create_access_token
from app.database.session import SessionLocal
from app.main import app
from app.models.user import User
from app.schemas.profile import StudentProfileCreate

client = TestClient(app)


def test_student_profile_schema_validates_fields() -> None:
    profile = StudentProfileCreate(
        full_name="  Ada Lovelace  ",
        portfolio_url="https://example.com/ada",
        skills=["Python"],
    )
    assert profile.full_name == "Ada Lovelace"

    for payload in (
        {"graduation_year": 1800},
        {"portfolio_url": "javascript:alert(1)"},
        {"headline": "x" * 161},
        {"skills": ["   "]},
    ):
        with pytest.raises(ValidationError):
            StudentProfileCreate(**payload)


def _create_user(role: str) -> User:
    db = SessionLocal()
    try:
        email = f"{role}-{uuid4()}@example.com"
        user = User(email=email, password_hash="hashed-password", role=role, is_active=True)
        db.add(user)
        db.commit()
        db.refresh(user)
        return user
    finally:
        db.close()


def test_student_profile_can_be_created_and_loaded() -> None:
    user = _create_user("student")
    token = create_access_token(str(user.id), user.role)
    headers = {"Authorization": f"Bearer {token}"}

    profile_payload = {
        "full_name": "Ada Lovelace",
        "headline": "Aspiring software engineer",
        "bio": "I build products that turn ideas into real experiences.",
        "university": "University of London",
        "degree_program": "Mathematics",
        "graduation_year": 2027,
        "skills": ["Python", "SQL", "FastAPI"],
        "location": "London, UK",
    }

    create_response = client.put("/api/v1/profile/me", json=profile_payload, headers=headers)
    assert create_response.status_code == 200
    assert create_response.json()["full_name"] == "Ada Lovelace"
    assert create_response.json()["skills"] == ["Python", "SQL", "FastAPI"]
    assert create_response.json()["degree_program"] == "Mathematics"

    read_response = client.get("/api/v1/profile/me", headers=headers)
    assert read_response.status_code == 200
    assert read_response.json()["headline"] == "Aspiring software engineer"
    assert read_response.json()["university"] == "University of London"

    update_response = client.put(
        "/api/v1/profile/me",
        json={"headline": "Software engineer intern"},
        headers=headers,
    )
    assert update_response.status_code == 200
    assert update_response.json()["headline"] == "Software engineer intern"
    assert update_response.json()["full_name"] == "Ada Lovelace"


def test_company_user_is_blocked_from_student_profile_routes() -> None:
    user = _create_user("company")
    token = create_access_token(str(user.id), user.role)
    headers = {"Authorization": f"Bearer {token}"}

    response = client.get("/api/v1/profile/me", headers=headers)
    assert response.status_code == 403

    update_response = client.put("/api/v1/profile/me", json={"headline": "Not a student"}, headers=headers)
    assert update_response.status_code == 403


def test_profile_routes_require_authentication() -> None:
    assert client.get("/api/v1/profile/me").status_code == 401
    assert client.put("/api/v1/profile/me", json={"headline": "Unauthenticated"}).status_code == 401


def test_missing_student_profile_returns_not_found() -> None:
    user = _create_user("student")
    token = create_access_token(str(user.id), user.role)

    response = client.get(
        "/api/v1/profile/me",
        headers={"Authorization": f"Bearer {token}"},
    )

    assert response.status_code == 404


def test_student_cannot_submit_another_users_profile_id() -> None:
    user = _create_user("student")
    token = create_access_token(str(user.id), user.role)

    response = client.put(
        "/api/v1/profile/me",
        json={"user_id": str(uuid4()), "headline": "Attempted ownership change"},
        headers={"Authorization": f"Bearer {token}"},
    )

    assert response.status_code == 422


def test_student_profile_rejects_invalid_fields() -> None:
    user = _create_user("student")
    token = create_access_token(str(user.id), user.role)
    headers = {"Authorization": f"Bearer {token}"}

    response = client.put(
        "/api/v1/profile/me",
        json={"graduation_year": 1800, "portfolio_url": "javascript:alert(1)"},
        headers=headers,
    )

    assert response.status_code == 422
