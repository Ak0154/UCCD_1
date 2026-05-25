from unittest.mock import MagicMock
from fastapi.testclient import TestClient
from api.main import app
from api.auth import hash_password, verify_password, create_access_token, require_role

client = TestClient(app)


def test_hash_and_verify_password():
    """Password hashing and verification round-trip."""
    plain = "secure-password-123"
    hashed = hash_password(plain)
    assert hashed != plain
    assert len(hashed) > 20
    assert verify_password(plain, hashed)
    assert not verify_password("wrong-password", hashed)


def test_login_invalid_credentials():
    """POST /api/v1/auth/login with bad credentials returns 401."""
    response = client.post("/api/v1/auth/login", json={
        "email": "nobody@example.com",
        "password": "wrongpass"
    })
    assert response.status_code == 401


def test_protected_route_no_token():
    """Protected routes reject requests without bearer token."""
    response = client.get("/api/v1/dashboard/kpis")
    assert response.status_code == 403 or response.status_code == 401