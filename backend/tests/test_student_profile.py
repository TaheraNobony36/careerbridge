from uuid import uuid4

from fastapi.testclient import TestClient

from app.core.security import create_access_token
from app.database.session import SessionLocal
from app.main import app
from app.models.user import User

client = TestClient(app)


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
        "graduation_year": 2027,
        "skills": ["Python", "SQL", "FastAPI"],
        "location": "London, UK",
    }

    create_response = client.put("/api/v1/profile/me", json=profile_payload, headers=headers)
    assert create_response.status_code == 200
    assert create_response.json()["full_name"] == "Ada Lovelace"
    assert create_response.json()["skills"] == ["Python", "SQL", "FastAPI"]

    read_response = client.get("/api/v1/profile/me", headers=headers)
    assert read_response.status_code == 200
    assert read_response.json()["headline"] == "Aspiring software engineer"
    assert read_response.json()["university"] == "University of London"


def test_company_user_is_blocked_from_student_profile_routes() -> None:
    user = _create_user("company")
    token = create_access_token(str(user.id), user.role)
    headers = {"Authorization": f"Bearer {token}"}

    response = client.get("/api/v1/profile/me", headers=headers)
    assert response.status_code == 403
