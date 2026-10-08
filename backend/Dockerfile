FROM python:3.12-slim AS builder
ENV PIP_DISABLE_PIP_VERSION_CHECK=1 PIP_NO_CACHE_DIR=1
WORKDIR /build
RUN python -m venv /opt/venv
ENV PATH="/opt/venv/bin:$PATH"
COPY backend/pyproject.toml ./
COPY backend/requirements.txt ./
COPY backend/app ./app
RUN pip install -r requirements.txt .

FROM python:3.12-slim
ENV PATH="/opt/venv/bin:$PATH" PYTHONUNBUFFERED=1 PYTHONDONTWRITEBYTECODE=1
RUN groupadd --gid 10001 hashreviewer && useradd --uid 10001 --gid hashreviewer --no-create-home --shell /usr/sbin/nologin hashreviewer
COPY --from=builder /opt/venv /opt/venv
WORKDIR /app
COPY --chown=hashreviewer:hashreviewer backend/app ./app
USER 10001:10001
EXPOSE 8000
HEALTHCHECK --interval=30s --timeout=3s --retries=3 CMD ["python", "-c", "import urllib.request; urllib.request.urlopen('http://127.0.0.1:8000/api/health', timeout=2)"]
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000", "--no-access-log"]
