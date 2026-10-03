from uuid import uuid4

from fastapi.testclient import TestClient

from app.core.security import create_access_token
from app.database.session import SessionLocal
from app.main import app
from app.models.student_profile import StudentProfile
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


def test_student_receives_recommended_jobs_based_on_skills() -> None:
    company = _create_user("company")
    student = _create_user("student")
    student_token = create_access_token(str(student.id), student.role)

    db = SessionLocal()
    try:
        profile = StudentProfile(
            user_id=student.id,
            full_name="Ada Lovelace",
            headline="Software engineer",
            university="Imperial College",
            skills=["Python", "FastAPI", "React", "SQL"],
        )
        db.add(profile)
        db.commit()
    finally:
        db.close()

    company_db = SessionLocal()
    try:
        from app.models.job import Job

        best_match = Job(
            company_id=company.id,
            company_name="Northstar Labs",
            title="Python Engineer",
            description="Build backend services.",
            location="Remote",
            job_type="full-time",
            salary="£50k",
            skills=["Python", "FastAPI", "SQL"],
            is_active=True,
        )
        weak_match = Job(
            company_id=company.id,
            company_name="Pixel Harbor",
            title="Design Intern",
            description="Design website experiences.",
            location="London",
            job_type="internship",
            salary="£18/hr",
            skills=["Figma", "UX"],
            is_active=True,
        )
        company_db.add_all([best_match, weak_match])
        company_db.commit()
    finally:
        company_db.close()

    response = client.get(
        "/api/v1/jobs/recommendations",
        headers={"Authorization": f"Bearer {student_token}"},
    )
    assert response.status_code == 200
    assert response.json()[0]["title"] == "Python Engineer"
    assert response.json()[0]["match_score"] >= 60
    assert response.json()[0]["matched_skills"] == ["Python", "FastAPI", "SQL"]


def test_company_user_cannot_access_recommendations() -> None:
    company = _create_user("company")
    token = create_access_token(str(company.id), company.role)

    response = client.get(
        "/api/v1/jobs/recommendations",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert response.status_code == 403
