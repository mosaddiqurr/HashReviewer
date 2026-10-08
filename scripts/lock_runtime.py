"""Record the optional backend's installed runtime graph, excluding dev tools."""
from importlib import metadata
from pathlib import Path

from packaging.requirements import Requirement

pending = ["fastapi", "httpx", "pydantic-settings", "uvicorn"]
chosen = {}
while pending:
    distribution = metadata.distribution(pending.pop())
    name = distribution.metadata["Name"]
    if name.lower() in chosen:
        continue
    chosen[name.lower()] = (name, distribution.version)
    for raw in distribution.requires or []:
        dependency = Requirement(raw)
        if dependency.marker is None or dependency.marker.evaluate({"extra": ""}):
            pending.append(dependency.name)

destination = Path(__file__).resolve().parents[1] / "backend" / "requirements.txt"
destination.write_text(
    "# Optional backend runtime lock, validated with Python 3.12.\n"
    + "".join(f"{name}=={version}\n" for name, version in sorted(chosen.values(), key=lambda pair: pair[0].lower())),
    encoding="utf-8",
)
print(f"Recorded {len(chosen)} runtime packages in {destination.name}.")
