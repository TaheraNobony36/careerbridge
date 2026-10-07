import uuid

import pytest
from sqlalchemy import inspect, text
from sqlalchemy.exc import IntegrityError

from app.database.session import SessionLocal, engine
from app.models.user import User, UserRole


def test_database_engine_is_configured() -> None:
    assert engine is not None

    with engine.connect() as connection:
        assert connection.execute(text("SELECT 1")).scalar_one() == 1

    inspector = inspect(engine)
    assert "users" in inspector.get_table_names()
    assert User.__table__.name == "users"


def test_user_can_be_created_with_uuid_and_timestamps() -> None:
    user = User(
        email=f"db-test-{uuid.uuid4().hex}@example.test",
        password_hash="test-hash",
    )
    with SessionLocal() as db:
        db.add(user)
        db.flush()
        assert isinstance(user.id, uuid.UUID)
        assert user.created_at.tzinfo is not None
        assert user.updated_at.tzinfo is not None
        db.rollback()


def test_user_email_is_unique_after_normalization() -> None:
    email = f"db-test-{uuid.uuid4().hex}@example.test"
    with SessionLocal() as db:
        db.add(User(email=email, password_hash="test-hash"))
        db.flush()
        db.add(User(email=email.upper(), password_hash="test-hash"))
        with pytest.raises(IntegrityError):
            db.flush()
        db.rollback()


def test_user_required_fields_are_enforced() -> None:
    user = User(email=f"db-test-{uuid.uuid4().hex}@example.test", password_hash=None)
    with SessionLocal() as db:
        db.add(user)
        with pytest.raises(IntegrityError):
            db.flush()
        db.rollback()


def test_user_roles_are_supported_and_constrained() -> None:
    expected_roles = {"student", "company", "admin", "super_admin"}
    assert {role.value for role in UserRole} == expected_roles

    with SessionLocal() as db:
        db.add(
            User(
                email=f"db-test-{uuid.uuid4().hex}@example.test",
                password_hash="test-hash",
                role="invalid-role",
            )
        )
        with pytest.raises(IntegrityError):
            db.flush()
        db.rollback()
