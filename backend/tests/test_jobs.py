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


def test_company_can_create_job_and_student_can_list_jobs() -> None:
    company = _create_user("company")
    company_token = create_access_token(str(company.id), company.role)

    company_headers = {"Authorization": f"Bearer {company_token}"}
    job_payload = {
        "title": "Software Engineering Intern",
        "description": "Build features for a modern internship platform.",
        "company_name": "Northstar Labs",
        "location": "Remote",
        "job_type": "internship",
        "salary": "£18/hr",
        "skills": ["Python", "FastAPI", "React"],
    }

    create_response = client.post("/api/v1/jobs", json=job_payload, headers=company_headers)
    assert create_response.status_code == 201
    assert create_response.json()["title"] == "Software Engineering Intern"

    student = _create_user("student")
    student_token = create_access_token(str(student.id), student.role)
    list_response = client.get("/api/v1/jobs", headers={"Authorization": f"Bearer {student_token}"})
    assert list_response.status_code == 200
    assert list_response.json()[0]["title"] == "Software Engineering Intern"


def test_company_can_list_their_own_jobs() -> None:
    company = _create_user("company")
    token = create_access_token(str(company.id), company.role)
    headers = {"Authorization": f"Bearer {token}"}

    client.post(
        "/api/v1/jobs",
        json={
            "title": "Product Design Intern",
            "description": "Design polished user flows.",
            "company_name": "Pixel Harbor",
            "location": "London",
            "job_type": "internship",
            "salary": "£20/hr",
            "skills": ["Figma", "UX"],
        },
        headers=headers,
    )

    response = client.get("/api/v1/jobs/my", headers=headers)
    assert response.status_code == 200
    assert any(job["title"] == "Product Design Intern" for job in response.json())
