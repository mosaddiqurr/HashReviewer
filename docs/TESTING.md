# Testing

Tests target the four product workflows, error recovery, and privacy boundaries. No coverage percentage is required.

## Frontend

From `frontend`:

```sh
npm ci
npm test
npm run lint
npm run build
npx playwright install chromium
npm run e2e
npm run e2e:production
npm audit
```

Unit tests check all three hash algorithms against independent Node.js results, empty inputs, UTF-8 content, binary inputs at 4 MiB chunk boundaries, failed reads, receipt schema validation, size and digest differences, renamed files, comparisons, cancellation, stale worker messages, and worker cleanup on navigation.

Browser tests use synthetic file bytes and run the actual hashing worker. They verify clipboard contents, a real receipt download followed by verification, changed files, same-size differences, renamed files, empty files, drag-and-drop, replacement after invalid input, configured and unavailable reputation, and concise read errors. They assert that reputation requests contain only SHA-256 and happen only after a click; local comparison sends no API requests.

The suite starts its own Vite server on `127.0.0.1:5180`. Desktop Chrome, a 320-pixel viewport, and Pixel 7 emulation cover navigation, result layout, overflow, and automated accessibility checks. A free port is required. The test reports are ignored by Git.

After building, `npm run e2e:production` runs the desktop workflows and both mobile viewports against the compiled app through Vite preview. The development-only worker-error injection is excluded; unit tests and the development browser suite cover that recovery path.

```sh
npm run screenshots
```

The screenshot script regenerates `docs/screenshots/home.png`, `home-hero.png`, `home-results.png`, `verify-clean.png`, `verify.png`, and `compare.png` using harmless fixtures. Home is the only file checker; the former `/check` route redirects there. Screenshot generation is separate from normal test runs so CI does not rewrite documentation assets.

## Backend

Install the development dependencies from the repository root:

```sh
python -m pip install -r backend/requirements.txt -e "./backend[dev]"
cd backend
python -m pytest
python -m ruff check .
```

The API tests intercept HTTP requests with HTTPX MockTransport. They check credential availability, hash-only GET requests, verdicts, unknown hashes, malformed counts, wrong fingerprint binding, quota protection, network failures, upstream error sanitization, and the absence of upload and obsolete product endpoints. No real key is used or consumed.

Live VirusTotal validation needs a legitimate configured key and available provider quota. Mocked tests establish request and response behavior without pretending to be a live provider check.

## Release validation

Before publication, confirm the production build, frontend and backend tests, lint, dependency audits, fresh screenshots, and a source-file secret scan. Keep `.env`, generated receipts, databases, logs, dependency directories, build outputs, and test artifacts out of the publication set.

Review the staged publication files with `git diff --cached --check`, `git diff --cached --stat`, and `git diff --cached` before committing. Scan the exact staged file set for credentials and private paths. Review the exact candidate changes and keep local validation artifacts out of the commit.

### Validated on 23 October 2026

| Check | Result |
| --- | --- |
| Frontend unit tests | 62 passed |
| Backend tests | 33 passed |
| Frontend and backend lint | Passed |
| TypeScript and production build | Passed |
| Development desktop and mobile browser suite | 22 passed; documentation screenshot generator skipped in normal runs |
| Compiled-app desktop and mobile browser suite | 21 passed |
| npm audit | No known vulnerabilities reported |
| Locked backend pip-audit | No known vulnerabilities reported |
| Backend dependency consistency | pip check passed |
| Documentation screenshots | Six refreshed images |
| Docker images | Frontend and optional backend built successfully |
| Container runtime | Static routes, headers, assets, absent backend, and credential-free optional backend passed |

The real browser worker hashed a 64 MiB file, and a running 256 MiB check was cancelled before restarting. Tests cover the Home checker, the legacy /check redirect, receipts, changed and renamed files, comparison copy and clear actions, both themes, automatic and reduced motion, and error recovery. Automated accessibility and overflow checks cover all four current pages and mobile result layouts.

The repository's previous container CI failure was reproduced as an attempt to create Nginx temporary directories on a read-only filesystem. All temporary paths now use the existing /tmp mount; the container remains unprivileged with a read-only root filesystem. Static routes, the SVG favicon, security headers, missing assets, and unavailable-backend handling passed local container checks.

Tests use synthetic provider reports. A live VirusTotal request was not made; provider authentication and quota require a legitimate configured key. Backend tests emit a Starlette TestClient deprecation warning and all 33 pass. Automated accessibility checks do not replace manual assistive-technology testing.

Dependency audits are point-in-time checks. Repeat them before a later release. See [release readiness](RELEASE_READINESS.md) for the publication scope and deployment limits.
