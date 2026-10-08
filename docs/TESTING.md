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

The screenshot script regenerates `docs/screenshots/home.png`, `check.png`, `verify.png`, and `compare.png` using harmless fixtures. Screenshot generation is separate from normal test runs so CI does not rewrite documentation assets.

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

Review the staged publication files with `git diff --cached --check`, `git diff --cached --stat`, and `git diff --cached` before committing. Scan the exact staged file set for credentials and private paths. The initial release has no earlier commit history to audit.

### Validated on 5 October 2026

| Check | Result |
| --- | --- |
| Frontend unit tests | 62 passed |
| Backend tests | 33 passed |
| Frontend and backend lint | Passed |
| Desktop and mobile browser suite | 19 passed; documentation screenshot generator skipped in normal runs |
| Compiled-app desktop and mobile workflows | 18 passed |
| Production build | Passed with the original logo and a separate hashing worker |
| Backend startup and installed dependencies | Uvicorn started; health 200, disabled reputation status 200, lookup without key 503; pip check passed |
| npm audit and locked backend pip-audit | No known vulnerabilities found |
| Documentation screenshots | Four newly generated images, visually inspected |
| Publication files | 67 source, configuration, documentation, lockfile, and asset files scanned; no development attribution, credential-like literals, or private-file paths found |
| Docker Compose | Configuration validated |

The environment used Node.js 24.15.0 and Python 3.12.10. The real worker hashed a 64 MiB file and a running 256 MiB job was cancelled before restarting. Browser tests cover repeated selection, clearing results, refresh without saved state, unavailable-backend recovery, and rejection of reputation verdicts inconsistent with the reported counts. Automated accessibility checks cover all five pages, mobile results, and a reputation result.

Tests cover configured reputation through synthetic provider responses; a live VirusTotal request was not made because no real key was supplied. Docker image builds and container behavior were not validated locally because the Docker daemon was unavailable. Compose configuration passed; CI now includes image builds and runtime checks for static routes, assets, security headers, an absent backend, and disabled reputation. Those new container checks await their first CI run.

The backend tests emit a dependency deprecation warning about Starlette's HTTPX-based TestClient. All tests pass; the application provider client and runtime startup remain functional.

Dependency audits and source scans are checks at the time of validation. Repeat them before a later release. See [release readiness](RELEASE_READINESS.md) for the current release checks.
