import httpx
import pytest
from fastapi.testclient import TestClient
from pydantic import SecretStr

from app import reputation as provider
from app.main import create_app
from app.reputation import Settings

SHA = "a" * 64


def report(malicious=3, suspicious=1, undetected=62):
    return {"data": {"id": SHA, "type": "file", "attributes": {
        "last_analysis_stats": {"malicious": malicious, "suspicious": suspicious, "undetected": undetected, "harmless": 0},
        "last_analysis_date": 1700000000,
    }}}


@pytest.fixture
def upstream(monkeypatch):
    state = {"status": 200, "body": report(), "error": None, "requests": []}
    original = httpx.AsyncClient

    def handler(request):
        state["requests"].append(request)
        if state["error"]:
            raise state["error"]
        return httpx.Response(state["status"], json=state["body"])

    monkeypatch.setattr(provider.httpx, "AsyncClient", lambda **kwargs: original(transport=httpx.MockTransport(handler), **kwargs))
    return state


def client(key="unit-test-placeholder", limit=4):
    return TestClient(create_app(Settings(_env_file=None, virus_total_api_key=SecretStr(key) if key else None, reputation_requests_per_minute=limit)))


def test_disabled_backend(upstream):
    c = client(key="")
    assert c.get("/api/health").json() == {"status": "ok"}
    assert c.get("/api/reputation/status").json() == {"available": False}
    assert c.get(f"/api/reputation/{SHA}").status_code == 503
    assert not upstream["requests"]


def test_hash_only_lookup(upstream):
    c = client()
    assert c.get("/api/reputation/status").json() == {"available": True}
    response = c.get(f"/api/reputation/{SHA.upper()}")
    assert response.status_code == 200
    data = response.json()
    assert data["verdict"] == "Suspicious"
    assert data["stats"] == {"malicious": 3, "suspicious": 1, "undetected": 62, "harmless": 0}
    assert data["sha256"] == SHA
    assert data["analyzedAt"] == "2023-11-14T22:13:20+00:00"
    request, = upstream["requests"]
    assert request.method == "GET" and request.content == b""
    assert str(request.url) == f"https://www.virustotal.com/api/v3/files/{SHA}"
    assert request.headers["x-apikey"] == "unit-test-placeholder"
    assert "unit-test-placeholder" not in response.text
    assert response.headers["cache-control"] == "no-store"


@pytest.mark.parametrize(("body", "verdict"), [(report(0, 0), "No known detections"), (report(0, 1), "Suspicious"), (report(0, 0, 0), "No analysis available")])
def test_verdicts(upstream, body, verdict):
    upstream["body"] = body
    assert client().get(f"/api/reputation/{SHA}").json()["verdict"] == verdict


def test_not_found(upstream):
    upstream["status"] = 404
    data = client().get(f"/api/reputation/{SHA}").json()
    assert data["verdict"] == "Unknown" and data["stats"] is None


@pytest.mark.parametrize("status", [301, 400, 401, 403, 429, 500, 503])
def test_provider_failures(upstream, status):
    upstream.update(status=status, body={"private": "raw-vendor-error"})
    response = client().get(f"/api/reputation/{SHA}")
    assert response.status_code == 503
    assert response.json() == {"message": "Reputation lookup is unavailable."}


@pytest.mark.parametrize("body", [None, {}, {"data": []}, report(-1), report(True), report("3"), report(None), report(100001)])
def test_bad_responses(upstream, body):
    upstream["body"] = body
    assert client().get(f"/api/reputation/{SHA}").status_code == 503


def test_wrong_fingerprint(upstream):
    upstream["body"]["data"]["id"] = "b" * 64
    assert client().get(f"/api/reputation/{SHA}").status_code == 503


@pytest.mark.parametrize("error", [httpx.ConnectError("private details"), httpx.ReadTimeout("private details")])
def test_network_errors(upstream, error):
    upstream["error"] = error
    response = client().get(f"/api/reputation/{SHA}")
    assert response.status_code == 503 and "private" not in response.text


def test_quota(upstream):
    c = client(limit=1)
    assert c.get(f"/api/reputation/{SHA}").status_code == 200
    response = c.get(f"/api/reputation/{SHA}")
    assert response.status_code == 429 and response.headers["retry-after"] == "60"
    assert len(upstream["requests"]) == 1


@pytest.mark.parametrize("value", ["invalid", "g" * 64, "a" * 63, "a" * 65])
def test_invalid_hashes(upstream, value):
    assert client().get(f"/api/reputation/{value}").status_code == 400
    assert not upstream["requests"]


def test_no_upload_or_old_endpoints(upstream):
    c = client()
    assert c.post(f"/api/reputation/{SHA}", content=b"file bytes").status_code == 413
    assert c.post(f"/api/reputation/{SHA}").status_code == 405
    for path in ["/api/v1/auth/login", "/api/v1/static-analyses", "/api/v1/cases", "/api/v1/dashboard"]:
        assert c.get(path).status_code == 404
    assert not upstream["requests"]


def test_request_bodies_are_rejected_before_lookup(upstream):
    response = client().request("GET", f"/api/reputation/{SHA}", content=b"file bytes")
    assert response.status_code == 413
    assert response.json() == {"message": "Request bodies are not accepted."}
    assert response.headers["cache-control"] == "no-store"
    assert not upstream["requests"]


def test_same_origin_only_and_security_headers(upstream):
    c = client()
    response = c.get("/api/reputation/status", headers={"Origin": "https://untrusted.example"})
    assert "access-control-allow-origin" not in response.headers
    assert response.headers["x-content-type-options"] == "nosniff"
    assert response.headers["referrer-policy"] == "no-referrer"
    assert c.options(f"/api/reputation/{SHA}", headers={"Origin": "https://untrusted.example", "Access-Control-Request-Method": "GET"}).status_code == 405
    assert not upstream["requests"]


def test_quota_recovers_after_window(upstream, monkeypatch):
    from app import main

    clock = [0.0]
    monkeypatch.setattr(main.time, "monotonic", lambda: clock[0])
    c = client(limit=1)
    assert c.get(f"/api/reputation/{SHA}").status_code == 200
    clock[0] = 59.9
    assert c.get(f"/api/reputation/{SHA}").status_code == 429
    clock[0] = 60.0
    assert c.get(f"/api/reputation/{SHA}").status_code == 200
    assert len(upstream["requests"]) == 2
