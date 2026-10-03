from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.security import require_roles
from app.database.session import get_db
from app.models.student_profile import StudentProfile
from app.models.user import User
from app.schemas.profile import StudentProfileCreate, StudentProfileResponse

router = APIRouter(prefix="/api/v1/profile", tags=["profile"])


@router.get("/me", response_model=StudentProfileResponse)
def get_student_profile(
    current_user: User = Depends(require_roles("student")),
    db: Session = Depends(get_db),
) -> StudentProfile:
    profile = db.query(StudentProfile).filter(StudentProfile.user_id == current_user.id).first()
    if profile is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Student profile not found. Complete your profile first.",
        )
    return profile


@router.put("/me", response_model=StudentProfileResponse)
def upsert_student_profile(
    payload: StudentProfileCreate,
    current_user: User = Depends(require_roles("student")),
    db: Session = Depends(get_db),
) -> StudentProfile:
    profile = db.query(StudentProfile).filter(StudentProfile.user_id == current_user.id).first()

    if profile is None:
        profile = StudentProfile(user_id=current_user.id)
        db.add(profile)

    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(profile, field, value)

    db.commit()
    db.refresh(profile)
    return profile
