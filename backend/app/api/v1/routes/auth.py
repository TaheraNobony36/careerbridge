from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.config.settings import settings
from app.core.security import (
    create_access_token,
    create_refresh_token,
    decode_token,
    get_current_user,
    get_password_hash,
    require_roles,
    verify_password,
)
from app.database.session import get_db
from app.models.user import User
from app.schemas.auth import AuthResponse, LoginRequest, MessageResponse, RefreshTokenRequest, RegisterRequest, TokenResponse, UserPublic

router = APIRouter(prefix="/api/v1/auth", tags=["auth"])


def _build_user_payload(user: User) -> UserPublic:
    return UserPublic.model_validate(user)


@router.post("/register/student", response_model=AuthResponse, status_code=status.HTTP_201_CREATED)
def register_student(payload: RegisterRequest, db: Session = Depends(get_db)) -> AuthResponse:
    normalized_email = payload.email.lower()
    existing_user = db.query(User).filter(User.email == normalized_email).first()
    if existing_user:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Email already registered")

    user = User(
        email=normalized_email,
        password_hash=get_password_hash(payload.password),
        role="student",
        is_active=True,
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    access_token = create_access_token(str(user.id), user.role)
    refresh_token = create_refresh_token(str(user.id), user.role)
    return AuthResponse(
        user=_build_user_payload(user),
        access_token=access_token,
        refresh_token=refresh_token,
    )


@router.post("/register/company", response_model=AuthResponse, status_code=status.HTTP_201_CREATED)
def register_company(payload: RegisterRequest, db: Session = Depends(get_db)) -> AuthResponse:
    normalized_email = payload.email.lower()
    existing_user = db.query(User).filter(User.email == normalized_email).first()
    if existing_user:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Email already registered")

    user = User(
        email=normalized_email,
        password_hash=get_password_hash(payload.password),
        role="company",
        is_active=True,
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    access_token = create_access_token(str(user.id), user.role)
    refresh_token = create_refresh_token(str(user.id), user.role)
    return AuthResponse(
        user=_build_user_payload(user),
        access_token=access_token,
        refresh_token=refresh_token,
    )


@router.post("/login", response_model=TokenResponse)
def login_user(payload: LoginRequest, db: Session = Depends(get_db)) -> TokenResponse:
    normalized_email = payload.email.lower()
    user = db.query(User).filter(User.email == normalized_email).first()
    if not user or not verify_password(payload.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

    access_token = create_access_token(str(user.id), user.role)
    refresh_token = create_refresh_token(str(user.id), user.role)
    return TokenResponse(access_token=access_token, refresh_token=refresh_token)


@router.post("/refresh", response_model=TokenResponse)
def refresh_token(payload: RefreshTokenRequest) -> TokenResponse:
    token_payload = decode_token(payload.refresh_token, settings.jwt_refresh_secret)
    if token_payload.get("type") != "refresh":
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid refresh token")

    access_token = create_access_token(str(token_payload["sub"]), str(token_payload["role"]))
    refresh_token = create_refresh_token(str(token_payload["sub"]), str(token_payload["role"]))
    return TokenResponse(access_token=access_token, refresh_token=refresh_token)


@router.post("/logout", response_model=MessageResponse)
def logout_user() -> MessageResponse:
    return MessageResponse(message="Logged out successfully")


@router.get("/me", response_model=UserPublic)
def get_current_user_profile(user: User = Depends(get_current_user)) -> UserPublic:
    return UserPublic.model_validate(user)


@router.get("/admin-check")
def admin_check(user: User = Depends(require_roles("admin"))) -> dict[str, str]:
    return {"message": f"Admin access granted for {user.email}"}
