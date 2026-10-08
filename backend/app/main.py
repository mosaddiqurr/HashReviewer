"""Optional same-origin reputation proxy for the browser-only application."""
from __future__ import annotations

import re
import time
from collections import deque
from collections.abc import Awaitable, Callable

from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse, Response

from app.reputation import LookupUnavailable, ReputationResult, Settings, lookup_virustotal

UNAVAILABLE = {"message": "Reputation lookup is unavailable."}


def create_app(settings: Settings | None = None) -> FastAPI:
    configuration = settings if settings is not None else Settings()
    app = FastAPI(title="HashReviewer optional reputation proxy", version="1.0.0",
                  docs_url=None, redoc_url=None, openapi_url=None)
    requests: deque[float] = deque()

    @app.middleware("http")
    async def response_headers(request: Request, call_next: Callable[[Request], Awaitable[Response]]) -> Response:
        # No endpoint accepts file bytes or a request body. Reject before reading it.
        if request.headers.get("content-length", "0") != "0" or "transfer-encoding" in request.headers:
            response = JSONResponse({"message": "Request bodies are not accepted."}, status_code=413)
        else:
            response = await call_next(request)
        response.headers["Cache-Control"] = "no-store"
        response.headers["X-Content-Type-Options"] = "nosniff"
        response.headers["Referrer-Policy"] = "no-referrer"
        return response

    @app.exception_handler(Exception)
    async def unexpected_error(_request: Request, _exc: Exception) -> JSONResponse:
        return JSONResponse(UNAVAILABLE, status_code=503)

    @app.get("/api/health")
    async def health() -> dict[str, str]:
        return {"status": "ok"}

    @app.get("/api/reputation/status")
    async def status() -> dict[str, bool]:
        return {"available": bool(configuration.api_key)}

    @app.get("/api/reputation/{sha256}", response_model=ReputationResult)
    async def reputation(sha256: str) -> ReputationResult | JSONResponse:
        if not re.fullmatch(r"[a-fA-F0-9]{64}", sha256):
            return JSONResponse({"message": "A valid SHA-256 is required."}, status_code=400)
        if not configuration.api_key:
            return JSONResponse(UNAVAILABLE, status_code=503)
        now = time.monotonic()
        while requests and now - requests[0] >= 60:
            requests.popleft()
        # There are no awaits between the quota check and append.
        if len(requests) >= configuration.reputation_requests_per_minute:
            return JSONResponse(UNAVAILABLE, status_code=429, headers={"Retry-After": "60"})
        requests.append(now)
        try:
            return await lookup_virustotal(sha256.lower(), configuration.api_key)
        except LookupUnavailable:
            return JSONResponse(UNAVAILABLE, status_code=503)

    return app


app = create_app()
