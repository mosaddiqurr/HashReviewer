# Publication readiness

Validated on 23 October 2026 for the interface and workflow update to [mosaddiqurr/HashReviewer](https://github.com/mosaddiqurr/HashReviewer).

## Changes

- Replace the original interface with the paper-and-vermilion design, locally served fonts, responsive layouts, automatic motion, and an optional dark theme.
- Make Home the single file checker, including hash copy actions, receipts, sample checks, replacement, and clearing. Preserve old /check links with a redirect.
- Consolidate navigation to Home, Verify, Compare, and About. Simplify tool headers and the footer.
- Refresh documentation, screenshots, the README status badge, and the changelog.
- Resolve reported dependency advisories with Vite 8.3.5, Vitest 4.1.12, and certifi 2026.10.19.
- Fix the previous container CI startup failure by moving all Nginx temporary paths to the writable /tmp mount. Keep the read-only filesystem, non-root user, and dropped capabilities.
- Exclude local browser binaries, caches, and analysis artifacts from Docker builds, and add CI container diagnostics on failure.

## Validation

| Check | Result |
| --- | --- |
| Frontend unit tests | 62 passed |
| Backend tests | 33 passed |
| Frontend and backend lint | Passed |
| TypeScript and production build | Passed |
| Development browser checks | 22 passed; documentation screenshot generator skipped |
| Compiled-app desktop and mobile checks | 21 passed |
| npm audit and locked backend pip-audit | No known vulnerabilities reported |
| Backend dependency consistency | pip check passed |
| Documentation screenshots | Six refreshed images |
| Docker images | Both images built |
| Static container runtime | Routes, security headers, SVG favicon, missing assets, and absent-backend behavior passed |
| Optional backend container | Healthy; proxied disabled-reputation response and no-store header passed |

The source and staged publication set are reviewed for whitespace, credentials, private absolute paths, and generated artifacts before committing. Private configuration, dependency environments, build outputs, caches, receipts, local browser binaries, and test reports remain excluded from Git.

## Deployment and limits

The production frontend is built into frontend/dist. Serve it at an HTTPS origin root with SPA route rewrites and the security headers in [deployment details](DEPLOYMENT.md). Repository publication does not configure website hosting. GitHub Pages repository-subpath hosting requires separate base-path and router changes.

Core file operations remain local. Optional reputation requires a suitable server-side VirusTotal credential. Provider tests use simulated reports; live authentication and quota were not validated. Receipts are unsigned and depend on a trusted reference. Automated accessibility checks do not replace full manual assistive-technology testing.

Backend tests emit a Starlette TestClient deprecation warning; all 33 pass. Dependency audit results describe the versions checked on the validation date.

## Publication verification

Publish the reviewed update as a normal commit on the existing main branch. Confirm the remote branch matches the local commit and check the new GitHub Actions run for frontend, backend, and container jobs. Do not include local validation artifacts or force-push the existing release history.
