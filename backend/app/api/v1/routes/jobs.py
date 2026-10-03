from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.security import require_roles
from app.database.session import get_db
from app.models.job import Job
from app.models.student_profile import StudentProfile
from app.models.user import User
from app.schemas.job import JobCreate, JobRecommendationResponse, JobResponse

router = APIRouter(prefix="/api/v1", tags=["jobs"])


@router.get("/jobs", response_model=list[JobResponse])
def list_jobs(db: Session = Depends(get_db)) -> list[Job]:
    jobs = db.query(Job).filter(Job.is_active.is_(True)).order_by(Job.created_at.desc()).all()
    return jobs


@router.get("/jobs/my", response_model=list[JobResponse])
def list_company_jobs(
    current_user: User = Depends(require_roles("company")),
    db: Session = Depends(get_db),
) -> list[Job]:
    jobs = (
        db.query(Job)
        .filter(Job.company_id == current_user.id, Job.is_active.is_(True))
        .order_by(Job.created_at.desc())
        .all()
    )
    return jobs


@router.get("/jobs/recommendations", response_model=list[JobRecommendationResponse])
def recommend_jobs(
    current_user: User = Depends(require_roles("student")),
    db: Session = Depends(get_db),
) -> list[JobRecommendationResponse]:
    profile = db.query(StudentProfile).filter(StudentProfile.user_id == current_user.id).first()
    if profile is None:
        return []

    student_skills = {skill.strip().lower() for skill in (profile.skills or []) if skill and skill.strip()}
    jobs = db.query(Job).filter(Job.is_active.is_(True)).order_by(Job.created_at.desc()).all()

    recommendations: list[JobRecommendationResponse] = []
    for job in jobs:
        normalized_skills = [skill.strip() for skill in (job.skills or []) if skill and skill.strip()]
        matched = [skill for skill in normalized_skills if skill.lower() in student_skills]

        denominator = max(len(student_skills), len(normalized_skills), 1)
        score = int(round((len(matched) / denominator) * 100)) if normalized_skills else 0

        recommendations.append(
            JobRecommendationResponse(
                id=job.id,
                company_id=job.company_id,
                company_name=job.company_name,
                title=job.title,
                description=job.description,
                location=job.location,
                job_type=job.job_type,
                salary=job.salary,
                skills=normalized_skills,
                is_active=job.is_active,
                match_score=score,
                matched_skills=matched,
            )
        )

    recommendations.sort(key=lambda item: (-item.match_score, -len(item.matched_skills), item.title.lower()))
    return recommendations


@router.post("/jobs", response_model=JobResponse, status_code=status.HTTP_201_CREATED)
def create_job(
    payload: JobCreate,
    current_user: User = Depends(require_roles("company")),
    db: Session = Depends(get_db),
) -> Job:
    job = Job(
        company_id=current_user.id,
        company_name=payload.company_name,
        title=payload.title,
        description=payload.description,
        location=payload.location,
        job_type=payload.job_type,
        salary=payload.salary,
        skills=payload.skills,
        is_active=True,
    )
    db.add(job)
    db.commit()
    db.refresh(job)
    return job
