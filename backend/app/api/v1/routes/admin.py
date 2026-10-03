from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.security import require_roles
from app.database.session import get_db
from app.models.user import User
from app.schemas.auth import UserPublic

router = APIRouter(prefix="/api/v1/admin", tags=["admin"])


@router.get("/users", response_model=list[UserPublic])
def list_users(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles("admin")),
) -> list[UserPublic]:
    del current_user
    users = db.query(User).all()
    return [UserPublic.model_validate(user) for user in users]
