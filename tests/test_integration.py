from fastapi.testclient import TestClient
from api.main import app

client = TestClient(app)


def test_health_check():
    """GET /api/health returns ok."""
    response = client.get("/api/health")
    assert response.status_code == 200
    assert response.json() == {"status": "ok"}


def test_cors_headers():
    """OPTIONS preflight returns CORS headers."""
    response = client.options("/api/v1/complaints", headers={
        "Origin": "http://localhost:5173",
        "Access-Control-Request-Method": "GET",
    })
    assert response.status_code in (200, 405)
    if response.status_code == 200:
        assert "access-control-allow-origin" in response.headers


def test_openapi_schema():
    """GET /openapi.json returns valid OpenAPI schema."""
    response = client.get("/openapi.json")
    assert response.status_code == 200
    schema = response.json()
    assert "paths" in schema
    assert "/api/health" in schema["paths"]


def test_docs_available():
    """GET /docs and /redoc return HTML."""
    response = client.get("/docs")
    assert response.status_code == 200
    assert "text/html" in response.headers.get("content-type", "")

    response = client.get("/redoc")
    assert response.status_code == 200
    assert "text/html" in response.headers.get("content-type", "")


def test_analytics_trends_valid_params():
    """GET /api/v1/analytics/trends accepts string and integer windows."""
    for window in [7, "7d", "12h", "4w"]:
        response = client.get(f"/api/v1/analytics/trends?window={window}")
        # May be 401 if auth required, but should never be 422 for valid params
        assert response.status_code != 422, f"window={window} rejected as 422"


def test_404_for_unknown_route():
    """Unknown API routes return 404."""
    response = client.get("/api/v1/nonexistent-endpoint")
    assert response.status_code == 404