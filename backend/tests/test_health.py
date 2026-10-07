from fastapi.testclient import TestClient

from app.main import app

client = TestClient(app)


def test_health_check() -> None:
    root_response = client.get("/")
    response = client.get("/api/v1/health")
    assert root_response.status_code == 200
    assert response.status_code == 200
    assert response.json()["status"] == "ok"
    assert response.json()["database"] == "ok"
    assert client.get("/docs").status_code == 200
    assert client.get("/redoc").status_code == 200
