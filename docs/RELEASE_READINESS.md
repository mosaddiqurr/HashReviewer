# HashReviewer v1.0.0 release readiness

Validated on 9 October 2026 for publication to `mosaddiqurr/HashReviewer`.

The release contains the browser application, optional reputation API, dependency lockfiles, tests, CI, Docker configuration, documentation, and existing product assets. Private configuration, local tooling, dependency environments, build output, caches, generated receipts, and browser-test reports are excluded.

## Release changes

- Update the transitive `source-map-js` dependency to 1.2.2 to address [GHSA-68fv-2mgg-jv7q](https://github.com/advisories/GHSA-68fv-2mgg-jv7q).
- Exclude the local Python package cache from Git.
- Remove the unconfigured README live-demo link. Repository publication does not create a hosted application.
- Refresh publication instructions and remove outdated local repository-status claims.
- Remove trailing blank lines flagged by the staged whitespace check.

## Local validation

| Check | Result |
| --- | --- |
| Frontend unit tests | 62 passed |
| Backend tests | 33 passed |
| Frontend and backend lint | Passed |
| TypeScript and production build | Passed |
| Compiled-app desktop and mobile browser checks | 18 passed |
| Development browser checks | 19 passed; screenshot generator intentionally skipped |
| npm audit after dependency patch | No known vulnerabilities reported |
| Locked backend pip-audit | No known vulnerabilities reported |
| Backend dependency consistency | pip check passed |
| Docker Compose configuration | Passed |

The compiled-app checks exercise hashing against independent expected digests, a 64 MiB file, cancellation, repeated checks, copy actions, receipt download and import, renamed-file verification, invalid receipts, changed files, local comparisons, unavailable reputation, hash-only reputation requests, provider failures, and contradictory evidence. Desktop and two mobile viewports passed automated accessibility and layout checks.

The publication review covers the exact staged file set, whitespace, credential-like literals, private file paths, and unwanted development attribution. The initial release has no earlier commit history to inspect. The release commit message is `release: HashReviewer v1.0.0`, using the repository owner's configured Git identity.

## Deployment and remaining limits

The production frontend is built into `frontend/dist`. All core operations run locally in the browser; file contents are never submitted by the application. Reputation remains optional and requires an appropriate server-side VirusTotal credential. Provider tests use synthetic reports; live authentication and provider quota were not verified.

For a future live deployment, serve at an HTTPS origin root with SPA route rewrites and the security headers described in [deployment details](DEPLOYMENT.md). GitHub Pages repository-subpath hosting needs base-path and router changes. Repository publication alone does not configure website hosting.

Container image builds and runtime checks run in GitHub Actions after publication. Local validation covers Compose configuration only. Existing documentation screenshots were retained. Automated accessibility checks do not replace full manual assistive-technology testing. Backend tests emit a Starlette TestClient deprecation warning; all 33 pass.

## Publication

Review the staged diff and publish the initial commit to the empty destination repository:

```sh
git diff --cached --check
git diff --cached --stat
git diff --cached
git commit -m "release: HashReviewer v1.0.0"
git push -u origin main
```

Confirm that the remote branch matches the local release commit and review its GitHub Actions results. Repeat dependency audits and publication scans for later releases.
