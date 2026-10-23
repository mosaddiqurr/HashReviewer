# Deployment

The frontend is a static React/Vite app. Its core file operations require no server API, database, accounts, queues, or external services.

## Static hosting

Run `npm ci` and `npm run build` from `frontend`. Publish `frontend/dist` at your site's root. Serve over HTTPS and rewrite `/check`, `/verify`, `/compare`, `/about`, and other application paths to `index.html`. The app redirects legacy `/check` links to Home. Return missing static assets as 404 responses.

The app is intended for origin-root hosting. A GitHub Pages repository subpath needs base-path and router configuration before deployment; GitHub repository publication itself needs no such changes.

Deploy builds atomically and retain previous hashed assets long enough for already-open tabs to finish using them. The hashing worker loads when a file is selected, so removing its previous asset can interrupt a check in an older tab. The app offers a page refresh when its worker cannot start. During local development, use `npm run dev`; refresh preview tabs after rebuilding production assets.

Use the headers in `frontend/nginx.conf` as a reference: a restrictive same-origin content security policy with `worker-src 'self'`, no framing, no MIME sniffing, and no referrer disclosure. No external fonts or scripts are needed.

## Optional reputation backend

Install `backend` with Python 3.12+. Run `uvicorn app.main:app --app-dir backend --host 127.0.0.1 --port 8000 --no-access-log` from the repository root.

Set `HASHSENTRY_VIRUS_TOTAL_API_KEY` only in the server environment or the ignored root `.env` file. Never expose it through a variable beginning with `VITE_`. Empty credentials disable reputation. `HASHSENTRY_REPUTATION_REQUESTS_PER_MINUTE` defaults to 4, shared across requests within a process.

Expose `/api` through the same origin as the frontend. Configure a reverse proxy to the private backend address. The app has no cross-origin credential flow or CORS configuration.

`VITE_API_URL` is intentionally unnecessary: production requests use relative `/api/...` URLs. `VITE_API_PROXY_TARGET` changes only Vite's local development/preview proxy. It is not a production API setting. Production application requests do not depend on localhost. Same-origin hosting requires no allowed CORS origins; no wildcard CORS headers are emitted. Keep the backend private behind the proxy.

Endpoints:

| Method | Route | Purpose |
| --- | --- | --- |
| GET | `/api/health` | Process readiness |
| GET | `/api/reputation/status` | Whether a credential is configured; no credential is returned |
| GET | `/api/reputation/{sha256}` | Existing VirusTotal hash report, normalized for display |

There is no upload endpoint. Invalid hashes never reach the provider. Authentication failures, malformed reports, redirects, and provider outages produce a generic unavailable response. Provider calls have an 8-second network timeout and a 10-second total deadline.

The backend rejects nonempty request bodies, including streamed bodies, before reading them. The included Nginx gateway also limits request bodies to 1 KiB. Status and lookup responses are marked `no-store`. Provider responses must match the requested fingerprint; counts are bounded and verdicts are checked against those counts in the browser.

The status endpoint confirms configuration, not that the provider has accepted the key. Multiple processes or replicas need a shared gateway quota to protect a common key. Provider account terms and daily quotas still apply.

Before enabling optional reputation, choose an API entitlement permitted for your use. VirusTotal's [Public API restrictions](https://docs.virustotal.com/reference/public-vs-premium-api) currently specify 4 requests per minute and 500 per day and restrict commercial products and certain business workflows. The process limiter enforces the configured minute quota only; it is not a daily quota or access control. Static hosting with reputation disabled needs no provider entitlement.

Disable request logs for reputation routes where possible: a queried hash identifies a fingerprint. Hosting infrastructure and provider logs are outside the application's control.

## Docker

From the repository root:

```sh
docker compose up --build
```

Open `http://localhost:8080`. Only the frontend starts. It resolves the optional API dynamically, so its absence does not stop the UI. Reputation is unavailable; the core remains usable.

To enable the backend, copy `.env.example` to `.env`, set the server key, and run:

```sh
docker compose --profile reputation up --build
```

The backend is reachable only on the internal Compose network; it has no published host port. Both containers run as a non-root user with a read-only root filesystem and temporary storage. The frontend image copies the bundled fonts and static assets, including the SVG favicon, using the repository as build context.

Terminate HTTPS at the hosting gateway. The included port 8080 listener is for local use or behind that gateway. Vite's development and preview servers are local validation tools.
