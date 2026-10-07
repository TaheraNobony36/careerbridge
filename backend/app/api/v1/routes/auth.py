from typing import Annotated

from fastapi import APIRouter, Cookie, Depends, HTTPException, Response, status
from fastapi.responses import JSONResponse
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.config.settings import settings
from app.core.security import (
    create_access_token,
    get_current_user,
    hash_password,
    require_roles,
    verify_password,
)
from app.database.session import get_db
from app.models.user import User, UserRole
from app.schemas.auth import (
    AuthResponse,
    LoginRequest,
    MessageResponse,
    PublicRegisterRequest,
    RegisterRequest,
    TokenResponse,
    UserPublic,
)
from app.services.auth_service import (
    add_refresh_session,
    revoke_refresh_session,
    rotate_refresh_session,
)

router = APIRouter(prefix="/api/v1/auth", tags=["auth"])
REFRESH_COOKIE_NAME = "careerbridge_refresh"
REFRESH_COOKIE_PATH = "/api/v1/auth"


def _build_user_payload(user: User) -> UserPublic:
    return UserPublic.model_validate(user)


def _set_refresh_cookie(response: Response, token: str) -> None:
    production = settings.environment.lower() not in {"development", "local", "test"}
    response.set_cookie(
        key=REFRESH_COOKIE_NAME,
        value=token,
        httponly=True,
        secure=production,
        samesite="none" if production else "lax",
        max_age=settings.refresh_token_expire_days * 24 * 60 * 60,
        path=REFRESH_COOKIE_PATH,
    )


def _clear_refresh_cookie(response: Response) -> None:
    production = settings.environment.lower() not in {"development", "local", "test"}
    response.delete_cookie(
        key=REFRESH_COOKIE_NAME,
        httponly=True,
        secure=production,
        samesite="none" if production else "lax",
        path=REFRESH_COOKIE_PATH,
    )


def _register_user(
    payload: RegisterRequest,
    role: UserRole,
    response: Response,
    db: Session,
) -> AuthResponse:
    normalized_email = str(payload.email).strip().lower()
    existing_user = db.query(User).filter(User.email == normalized_email).first()
    if existing_user:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Email already registered")

    user = User(
        email=normalized_email,
        password_hash=hash_password(payload.password),
        role=role.value,
        is_active=True,
    )
    db.add(user)
    try:
        db.flush()
        refresh_token = add_refresh_session(db, user)
        db.commit()
    except IntegrityError as exc:
        db.rollback()
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Email already registered") from exc
    db.refresh(user)

    access_token = create_access_token(str(user.id), user.role)
    _set_refresh_cookie(response, refresh_token)
    return AuthResponse(
        user=_build_user_payload(user),
        access_token=access_token,
    )


@router.post("/register", response_model=AuthResponse, status_code=status.HTTP_201_CREATED)
def register(
    payload: PublicRegisterRequest,
    response: Response,
    db: Annotated[Session, Depends(get_db)],
) -> AuthResponse:
    if payload.role not in {UserRole.STUDENT, UserRole.COMPANY}:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="This role cannot self-register")
    return _register_user(payload, payload.role, response, db)


@router.post("/register/student", response_model=AuthResponse, status_code=status.HTTP_201_CREATED)
def register_student(
    payload: RegisterRequest,
    response: Response,
    db: Annotated[Session, Depends(get_db)],
) -> AuthResponse:
    return _register_user(payload, UserRole.STUDENT, response, db)


@router.post("/register/company", response_model=AuthResponse, status_code=status.HTTP_201_CREATED)
def register_company(
    payload: RegisterRequest,
    response: Response,
    db: Annotated[Session, Depends(get_db)],
) -> AuthResponse:
    return _register_user(payload, UserRole.COMPANY, response, db)


@router.post("/login", response_model=TokenResponse)
def login_user(
    payload: LoginRequest,
    response: Response,
    db: Annotated[Session, Depends(get_db)],
) -> TokenResponse:
    normalized_email = str(payload.email).strip().lower()
    user = db.query(User).filter(User.email == normalized_email).first()
    if user is None or not verify_password(payload.password, user.password_hash) or not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

    access_token = create_access_token(str(user.id), user.role)
    refresh_token = add_refresh_session(db, user)
    db.commit()
    _set_refresh_cookie(response, refresh_token)
    return TokenResponse(user=_build_user_payload(user), access_token=access_token)


@router.post("/refresh", response_model=None)
def refresh_token(
    response: Response,
    db: Annotated[Session, Depends(get_db)],
    refresh_token: Annotated[str | None, Cookie(alias=REFRESH_COOKIE_NAME)] = None,
) -> TokenResponse | JSONResponse:
    if refresh_token is None:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Refresh session required")
    try:
        user, access_token, rotated_token = rotate_refresh_session(db, refresh_token)
    except HTTPException as exc:
        error_response = JSONResponse(
            status_code=exc.status_code,
            content={"detail": exc.detail},
            headers=exc.headers,
        )
        _clear_refresh_cookie(error_response)
        return error_response

    _set_refresh_cookie(response, rotated_token)
    return TokenResponse(user=_build_user_payload(user), access_token=access_token)


@router.post("/logout", response_model=MessageResponse)
def logout_user(
    response: Response,
    db: Annotated[Session, Depends(get_db)],
    refresh_token: Annotated[str | None, Cookie(alias=REFRESH_COOKIE_NAME)] = None,
) -> MessageResponse:
    revoke_refresh_session(db, refresh_token)
    _clear_refresh_cookie(response)
    return MessageResponse(message="Logged out successfully")


@router.get("/me", response_model=UserPublic)
def get_current_user_profile(user: Annotated[User, Depends(get_current_user)]) -> UserPublic:
    return UserPublic.model_validate(user)


@router.get("/admin-check")
def admin_check(
    user: Annotated[User, Depends(require_roles(UserRole.ADMIN, UserRole.SUPER_ADMIN))],
) -> dict[str, str]:
    return {"message": f"Admin access granted for {user.email}"}
