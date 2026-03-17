import os
import pytest
import requests
from tenacity import retry, stop_after_attempt, wait_fixed

BASE_URL = os.getenv("BASE_URL", "http://localhost:3000").rstrip("/")

@pytest.fixture(scope="session")
def base_url():
    assert BASE_URL and BASE_URL != "", "Defina BASE_URL env ou edite conftest.py"
    return BASE_URL

@pytest.fixture(scope="session")
def http():
    s = requests.Session()
    s.headers.update({"Content-Type": "application/json"})
    return s

@retry(stop=stop_after_attempt(5), wait=wait_fixed(1))
def _healthcheck(base_url, http):
    r = http.get(f"{base_url}/health", timeout=10)
    assert r.status_code in (200, 404, 405)
    return True

@pytest.fixture(scope="session", autouse=True)
def wait_api(base_url, http):
    try:
        _healthcheck(base_url, http)
    except Exception:
        r = http.get(f"{base_url}/", timeout=10)
        assert r.status_code in (200, 404)
