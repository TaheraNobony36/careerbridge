from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.v1.routes.admin import router as admin_router
from app.api.v1.routes.applications import router as applications_router
from app.api.v1.routes.auth import router as auth_router
from app.api.v1.routes.health import router as health_router
from app.api.v1.routes.jobs import router as jobs_router
from app.api.v1.routes.profile import router as profile_router
from app.config.settings import settings

app = FastAPI(
    title=settings.app_name,
    version="0.1.0",
    description="CareerBridge platform API",
    debug=settings.debug,
    docs_url="/docs",
    redoc_url="/redoc",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(health_router)
app.include_router(auth_router)
app.include_router(profile_router)
app.include_router(jobs_router)
app.include_router(applications_router)
app.include_router(admin_router)


@app.get("/")
def root() -> dict[str, str]:
    return {"message": "CareerBridge API"}
