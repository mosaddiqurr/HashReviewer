"""VirusTotal hash-only lookup. No submission, file access, or persistence."""
from __future__ import annotations

import asyncio
from datetime import UTC, datetime
from pathlib import Path
from typing import Annotated, Literal

import httpx
from pydantic import BaseModel, Field, SecretStr, StrictInt, ValidationError
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_prefix="HASHSENTRY_", env_file=Path(__file__).resolve().parents[2] / ".env", extra="ignore")
    virus_total_api_key: SecretStr | None = None
    reputation_requests_per_minute: int = Field(default=4, ge=1, le=60)

    @property
    def api_key(self) -> str:
        return self.virus_total_api_key.get_secret_value().strip() if self.virus_total_api_key else ""


Count = Annotated[StrictInt, Field(ge=0, le=100_000)]


class DetectionStats(BaseModel):
    malicious: Count
    suspicious: Count
    undetected: Count
    harmless: Count = 0


class ReputationResult(BaseModel):
    status: Literal["found", "not_found"]
    sha256: str
    verdict: Literal["Suspicious", "No known detections", "Unknown", "No analysis available"]
    explanation: str
    stats: DetectionStats | None = None
    analyzedAt: str | None = None


class LookupUnavailable(Exception):
    """Deliberately contains no provider response or credentials."""


async def lookup_virustotal(sha256: str, api_key: str) -> ReputationResult:
    try:
        # Preserve the existing GET /files/{hash} design. There is no upload path.
        async with asyncio.timeout(10):
            async with httpx.AsyncClient(timeout=8, follow_redirects=False, trust_env=False) as client:
                response = await client.get(
                    f"https://www.virustotal.com/api/v3/files/{sha256}",
                    headers={"x-apikey": api_key, "Accept": "application/json"},
                )
    except (httpx.HTTPError, TimeoutError):
        raise LookupUnavailable from None
    if response.status_code == 404:
        return ReputationResult(
            status="not_found", sha256=sha256, verdict="Unknown",
            explanation="VirusTotal has no report for this fingerprint. An unknown result does not establish safety.",
        )
    if response.status_code != 200:
        raise LookupUnavailable
    try:
        data = response.json()["data"]
        if data["type"] != "file" or data["id"] != sha256:
            raise ValueError("wrong fingerprint")
        attributes = data["attributes"]
        stats = DetectionStats.model_validate(attributes["last_analysis_stats"])
        timestamp = attributes.get("last_analysis_date")
        analyzed_at = None
        if timestamp is not None:
            if type(timestamp) is not int or timestamp < 0:
                raise ValueError("invalid timestamp")
            analyzed_at = datetime.fromtimestamp(timestamp, UTC).isoformat()
    except (KeyError, TypeError, ValueError, OverflowError, OSError, ValidationError):
        raise LookupUnavailable from None

    if stats.malicious or stats.suspicious:
        verdict = "Suspicious"
        explanation = (
            f"{stats.malicious} engines flagged this fingerprint as malicious and "
            f"{stats.suspicious} as suspicious. Review this evidence before trusting the file."
        )
    elif stats.undetected or stats.harmless:
        verdict = "No known detections"
        explanation = (
            "No engines in the recorded report flagged this fingerprint as malicious or suspicious. "
            "This does not establish that the file is safe."
        )
    else:
        verdict = "No analysis available"
        explanation = (
            "The report contains no usable engine classifications. "
            "There is not enough evidence to assess this fingerprint."
        )
    return ReputationResult(
        status="found", sha256=sha256, verdict=verdict, explanation=explanation,
        stats=stats, analyzedAt=analyzed_at,
    )
