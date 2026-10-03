"""API routes package."""

from .admin import router as admin_router
from .auth import router as auth_router
from .health import router as health_router

__all__ = ["admin_router", "auth_router", "health_router"]
