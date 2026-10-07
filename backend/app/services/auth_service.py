from datetime import datetime, timezone
from hashlib import sha256
from uuid import UUID

from fastapi import HTTPException, status
from sqlalchemy import func, update
from sqlalchemy.orm import Session

from app.config.settings import settings
from app.core.security import create_access_token, create_refresh_token, decode_token
from app.models.refresh_token import RefreshToken
from app.models.user import User


def _fingerprint(token: str) -> str:
    return sha256(token.encode("utf-8")).hexdigest()


def add_refresh_session(db: Session, user: User) -> str:
    token = create_refresh_token(str(user.id), user.role)
    db.add(
        RefreshToken(
            user_id=user.id,
            token_hash=_fingerprint(token),
            expires_at=datetime.fromtimestamp(
                decode_token(token, settings.jwt_refresh_secret)["exp"],
                tz=timezone.utc,
            ),
        )
    )
    return token


def rotate_refresh_session(db: Session, token: str) -> tuple[User, str, str]:
    payload = decode_token(token, settings.jwt_refresh_secret)
    subject = payload.get("sub")
    if payload.get("type") != "refresh" or not isinstance(subject, str):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired refresh token",
        )

    try:
        user_id = UUID(subject)
    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired refresh token",
        ) from exc

    consumed = db.execute(
        update(RefreshToken)
        .where(
            RefreshToken.user_id == user_id,
            RefreshToken.token_hash == _fingerprint(token),
            RefreshToken.revoked_at.is_(None),
            RefreshToken.expires_at > func.now(),
        )
        .values(revoked_at=func.now())
    )
    if consumed.rowcount != 1:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired refresh token",
        )

    user = db.get(User, user_id)
    if user is None or not user.is_active:
        db.commit()
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired refresh token",
        )

    new_refresh_token = add_refresh_session(db, user)
    access_token = create_access_token(str(user.id), user.role)
    db.commit()
    return user, access_token, new_refresh_token


def revoke_refresh_session(db: Session, token: str | None) -> None:
    if token is None:
        return

    db.execute(
        update(RefreshToken)
        .where(
            RefreshToken.token_hash == _fingerprint(token),
            RefreshToken.revoked_at.is_(None),
        )
        .values(revoked_at=func.now())
    )
    db.commit()
