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


def test_student_can_apply_to_job_and_view_own_applications() -> None:
    company = _create_user("company")
    student = _create_user("student")
    company_token = create_access_token(str(company.id), company.role)
    student_token = create_access_token(str(student.id), student.role)

    company_headers = {"Authorization": f"Bearer {company_token}"}
    job_response = client.post(
        "/api/v1/jobs",
        json={
            "title": "Frontend Engineer Intern",
            "description": "Join our product team.",
            "company_name": "Northstar Labs",
            "location": "Remote",
            "job_type": "internship",
            "salary": "£20/hr",
            "skills": ["React", "TypeScript"],
        },
        headers=company_headers,
    )
    job_id = job_response.json()["id"]

    apply_response = client.post(
        f"/api/v1/jobs/{job_id}/apply",
        json={"cover_letter": "I am excited to contribute to your team."},
        headers={"Authorization": f"Bearer {student_token}"},
    )
    assert apply_response.status_code == 201
    assert apply_response.json()["status"] == "applied"

    my_applications = client.get(
        "/api/v1/applications/my",
        headers={"Authorization": f"Bearer {student_token}"},
    )
    assert my_applications.status_code == 200
    assert my_applications.json()[0]["job_id"] == job_id


def test_company_can_list_applications_for_their_job() -> None:
    company = _create_user("company")
    student = _create_user("student")
    company_token = create_access_token(str(company.id), company.role)
    student_token = create_access_token(str(student.id), student.role)

    job_response = client.post(
        "/api/v1/jobs",
        json={
            "title": "Data Analyst Intern",
            "description": "Analyse product and customer data.",
            "company_name": "BrightPath Ltd.",
            "location": "London",
            "job_type": "internship",
            "salary": "£18/hr",
            "skills": ["SQL", "Python"],
        },
        headers={"Authorization": f"Bearer {company_token}"},
    )
    job_id = job_response.json()["id"]

    client.post(
        f"/api/v1/jobs/{job_id}/apply",
        json={"cover_letter": "I would love to help your team."},
        headers={"Authorization": f"Bearer {student_token}"},
    )

    applications = client.get(
        f"/api/v1/jobs/{job_id}/applications",
        headers={"Authorization": f"Bearer {company_token}"},
    )
    assert applications.status_code == 200
    assert len(applications.json()) == 1
    assert applications.json()[0]["applicant_email"] == student.email
