from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.security import require_roles
from app.database.session import get_db
from app.models.application import Application
from app.models.job import Job
from app.models.user import User
from app.schemas.application import ApplicationCreate, ApplicationResponse

router = APIRouter(prefix="/api/v1", tags=["applications"])


@router.post("/jobs/{job_id}/apply", response_model=ApplicationResponse, status_code=status.HTTP_201_CREATED)
def apply_to_job(
    job_id: UUID,
    payload: ApplicationCreate,
    current_user: User = Depends(require_roles("student")),
    db: Session = Depends(get_db),
) -> Application:
    job = db.query(Job).filter(Job.id == job_id, Job.is_active.is_(True)).first()
    if job is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Job not found")

    existing = (
        db.query(Application)
        .filter(Application.job_id == job_id, Application.applicant_id == current_user.id)
        .first()
    )
    if existing:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="You have already applied to this opportunity.",
        )

    application = Application(
        job_id=job_id,
        applicant_id=current_user.id,
        cover_letter=payload.cover_letter,
        status="applied",
    )
    db.add(application)
    db.commit()
    db.refresh(application)

    return ApplicationResponse(
        id=application.id,
        job_id=application.job_id,
        applicant_id=application.applicant_id,
        applicant_email=current_user.email,
        cover_letter=application.cover_letter,
        status=application.status,
    )


@router.get("/applications/my", response_model=list[ApplicationResponse])
def list_my_applications(
    current_user: User = Depends(require_roles("student")),
    db: Session = Depends(get_db),
) -> list[ApplicationResponse]:
    applications = (
        db.query(Application)
        .filter(Application.applicant_id == current_user.id)
        .order_by(Application.created_at.desc())
        .all()
    )

    return [
        ApplicationResponse(
            id=application.id,
            job_id=application.job_id,
            applicant_id=application.applicant_id,
            applicant_email=current_user.email,
            cover_letter=application.cover_letter,
            status=application.status,
        )
        for application in applications
    ]


@router.get("/jobs/{job_id}/applications", response_model=list[ApplicationResponse])
def list_job_applications(
    job_id: UUID,
    current_user: User = Depends(require_roles("company")),
    db: Session = Depends(get_db),
) -> list[ApplicationResponse]:
    job = db.query(Job).filter(Job.id == job_id).first()
    if job is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Job not found")
    if job.company_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="You cannot view applications for this job")

    applications = (
        db.query(Application)
        .filter(Application.job_id == job_id)
        .order_by(Application.created_at.desc())
        .all()
    )
    return [
        ApplicationResponse(
            id=application.id,
            job_id=application.job_id,
            applicant_id=application.applicant_id,
            applicant_email=application.applicant.email,
            cover_letter=application.cover_letter,
            status=application.status,
        )
        for application in applications
    ]
