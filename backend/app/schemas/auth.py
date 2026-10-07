from typing import Annotated
from uuid import UUID

from pydantic import BaseModel, ConfigDict, EmailStr, StringConstraints, field_validator

from app.models.user import UserRole


class UserPublic(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    email: str
    role: str
    is_active: bool


RegistrationPassword = Annotated[str, StringConstraints(min_length=12, max_length=72)]


class RegisterRequest(BaseModel):
    email: EmailStr
    password: RegistrationPassword
    full_name: str | None = None
    company_name: str | None = None

    @field_validator("password")
    @classmethod
    def validate_password_strength(cls, password: str) -> str:
        if len(password.encode("utf-8")) > 72:
            raise ValueError("Password must be at most 72 UTF-8 bytes")
        if not any(character.islower() for character in password):
            raise ValueError("Password must include a lowercase letter")
        if not any(character.isupper() for character in password):
            raise ValueError("Password must include an uppercase letter")
        if not any(character.isdigit() for character in password):
            raise ValueError("Password must include a number")
        return password


class PublicRegisterRequest(RegisterRequest):
    role: UserRole


    @field_validator("role", mode="before")
    @classmethod
    def normalize_role(cls, role: str | UserRole) -> str | UserRole:
        return role.strip().lower() if isinstance(role, str) else role


class LoginRequest(BaseModel):
    email: EmailStr
    password: Annotated[str, StringConstraints(min_length=1, max_length=72)]

    @field_validator("password")
    @classmethod
    def validate_bcrypt_length(cls, password: str) -> str:
        if len(password.encode("utf-8")) > 72:
            raise ValueError("Password exceeds supported length")
        return password


class TokenResponse(BaseModel):
    user: UserPublic
    access_token: str
    token_type: str = "bearer"


class AuthResponse(BaseModel):
    user: UserPublic
    access_token: str
    token_type: str = "bearer"


class MessageResponse(BaseModel):
    message: str
