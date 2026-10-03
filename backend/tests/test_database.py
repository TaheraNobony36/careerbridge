from sqlalchemy import inspect, text

from app.database.session import engine
from app.models.user import User


def test_database_engine_is_configured() -> None:
    assert engine is not None

    with engine.connect() as connection:
        assert connection.execute(text("SELECT 1")).scalar_one() == 1

    inspector = inspect(engine)
    assert "users" in inspector.get_table_names()
    assert User.__table__.name == "users"
