# Changelog

## 24 October 2026

- Distinguish a missing or blocked hashing worker from an unreadable file, and provide a refresh action when the checker cannot start.
- Add regression coverage for stale worker assets, refresh recovery, and hashing a dropped file after recovery.

## 23 October 2026

- Redesign all pages with paper surfaces, vermilion accents, local variable fonts, and responsive ruled workspaces.
- Move the full file checker onto Home, including clipboard actions, integrity receipts, sample checks, replacement, and clearing.
- Consolidate navigation to Home, Verify, Compare, and About; redirect legacy `/check` links to Home.
- Simplify tool headers and the footer, remove repeated privacy strips, and run animation automatically while respecting reduced-motion preferences.
- Expand browser coverage for Home, both themes, receipt downloads, comparison copy actions, and mobile results.
- Refresh screenshots, design notes, and publication documentation.
- Fix Nginx temporary paths for read-only container startup, exclude local caches from Docker builds, and add CI failure diagnostics.
- Update Vite to 8.3.5, Vitest to 4.1.12, and certifi to 2026.10.19 to resolve reported dependency advisories.

## Initial release

- Calculate SHA-256, SHA-1, and MD5 locally in a streaming browser worker.
- Create unsigned integrity receipts, verify files, and compare two files.
- Offer optional hash-only reputation lookup through a server-side VirusTotal proxy.
- Include unit and browser tests, CI, Docker configuration, and deployment documentation.
