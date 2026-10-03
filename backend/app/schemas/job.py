from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field


class JobBase(BaseModel):
    title: str
    description: str
    company_name: str
    location: str | None = None
    job_type: str = "internship"
    salary: str | None = None
    skills: list[str] = Field(default_factory=list)


class JobCreate(JobBase):
    pass


class JobResponse(JobBase):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    company_id: UUID
    is_active: bool


class JobRecommendationResponse(JobResponse):
    match_score: int
    matched_skills: list[str]
