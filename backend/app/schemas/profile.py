from uuid import UUID

from pydantic import (
    AnyHttpUrl,
    BaseModel,
    ConfigDict,
    Field,
    TypeAdapter,
    field_validator,
)

http_url_adapter = TypeAdapter(AnyHttpUrl)


class StudentProfileBase(BaseModel):
    model_config = ConfigDict(str_strip_whitespace=True, extra="forbid")

    full_name: str | None = Field(default=None, max_length=150)
    headline: str | None = Field(default=None, max_length=160)
    bio: str | None = Field(default=None, max_length=2000)
    university: str | None = Field(default=None, max_length=255)
    degree_program: str | None = Field(default=None, max_length=255)
    graduation_year: int | None = Field(default=None, ge=1900, le=2100)
    skills: list[str] = Field(default_factory=list, max_length=30)
    location: str | None = Field(default=None, max_length=150)
    portfolio_url: str | None = Field(default=None, max_length=255)
    linkedin_url: str | None = Field(default=None, max_length=255)
    github_url: str | None = Field(default=None, max_length=255)

    @field_validator("portfolio_url", "linkedin_url", "github_url")
    @classmethod
    def validate_http_url(cls, value: str | None) -> str | None:
        if value is None:
            return None

        try:
            return str(http_url_adapter.validate_python(value))
        except ValueError as exc:
            raise ValueError("URL must be an absolute HTTP or HTTPS URL") from exc

    @field_validator("skills")
    @classmethod
    def validate_skills(cls, values: list[str]) -> list[str]:
        if any(not skill for skill in values):
            raise ValueError("Skills cannot be blank")
        if any(len(skill) > 50 for skill in values):
            raise ValueError("Skills must be 50 characters or fewer")
        return values


class StudentProfileCreate(StudentProfileBase):
    pass


class StudentProfileResponse(StudentProfileBase):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    user_id: UUID
