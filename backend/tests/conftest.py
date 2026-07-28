import pytest
import httpx
from app.core.config import settings

BASE_URL = "http://backend:8000/v1"

SEED_USERS = {
    "admin": {"email": "admin@test.com", "password": "admin123"},
    "org_admin": {"email": "user@test.com", "password": "user123"},
    "editor": {"email": "member@test.com", "password": "member123"},
}


def _login(email: str, password: str) -> str:
    r = httpx.post(f"{BASE_URL}/auth/login", json={"email": email, "password": password})
    assert r.status_code == 200, f"Login failed for {email}: {r.text}"
    return r.json()["access_token"]


@pytest.fixture(scope="session")
def client() -> httpx.Client:
    return httpx.Client(base_url=BASE_URL)


@pytest.fixture(scope="session")
def admin_token() -> str:
    return _login(**SEED_USERS["admin"])


@pytest.fixture(scope="session")
def org_admin_token() -> str:
    return _login(**SEED_USERS["org_admin"])


@pytest.fixture(scope="session")
def editor_token() -> str:
    return _login(**SEED_USERS["editor"])


@pytest.fixture(scope="session")
def seeded_org_id() -> int:
    return 1


@pytest.fixture(scope="session")
def admin_headers(admin_token: str) -> dict:
    return {"Authorization": f"Bearer {admin_token}"}


@pytest.fixture(scope="session")
def org_admin_headers(org_admin_token: str) -> dict:
    return {"Authorization": f"Bearer {org_admin_token}"}


@pytest.fixture(scope="session")
def editor_headers(editor_token: str) -> dict:
    return {"Authorization": f"Bearer {editor_token}"}
