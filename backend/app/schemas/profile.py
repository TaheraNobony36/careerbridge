from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field


class StudentProfileBase(BaseModel):
    full_name: str | None = None
    headline: str | None = None
    bio: str | None = None
    university: str | None = None
    graduation_year: int | None = None
    skills: list[str] = Field(default_factory=list)
    location: str | None = None
    portfolio_url: str | None = None
    linkedin_url: str | None = None
    github_url: str | None = None


class StudentProfileCreate(StudentProfileBase):
    pass


class StudentProfileResponse(StudentProfileBase):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    user_id: UUID
