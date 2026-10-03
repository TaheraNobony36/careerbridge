from pathlib import Path

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    app_name: str = "careerbridge"
    environment: str = "development"
    database_url: str = "postgresql+psycopg2://postgres:postgres@localhost:5432/careerbridge"
    secret_key: str = "change-me-in-production"
    jwt_secret: str = "change-me-in-production"
    jwt_refresh_secret: str = "change-me-in-production"
    redis_url: str = "redis://localhost:6379/0"
    frontend_url: str = "http://localhost:5173"
    backend_url: str = "http://localhost:8000"
    ai_provider: str = "openai"
    ai_api_key: str = ""
    ai_model: str = "gpt-4o-mini"
    payment_provider: str = "stripe"
    payment_api_key: str = ""
    payment_secret: str = ""
    email_provider: str = "sendgrid"
    email_api_key: str = ""

    model_config = SettingsConfigDict(
        env_file=str(Path(__file__).resolve().parents[3] / ".env"),
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
    )


settings = Settings()
