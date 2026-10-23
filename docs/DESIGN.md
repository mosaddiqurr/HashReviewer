# Interface design

HashReviewer uses warm paper surfaces, ink typography, vermilion accents, and square ruled workspaces. Space Grotesk provides the interface type; JetBrains Mono distinguishes fingerprints and technical labels. Both fonts are served locally.

## Layout and navigation

Home is the single file-checking destination. Visitors can select or drop a file, inspect SHA-256, SHA-1, and MD5, copy fingerprints, download an integrity receipt, replace the file, or clear the result without leaving the page. The sample button runs the same browser worker on a harmless three-byte file.

Verify, Compare, and About are the remaining navigation destinations. The former `/check` route redirects to Home for existing bookmarks. Tool pages use a title and description without decorative header strips or repeated privacy banners. The footer contains only the brand link.

The same paper-and-ink visual language continues through all four pages. An optional dark theme uses warm ink surfaces and coral accents. The theme setting lasts for the current app session and uses no browser storage.

## Motion and accessibility

Motion provides staged entry transitions. Native CSS animates a slow background scan rule and the decorative hash mark. Animations run automatically; reduced-motion preferences disable continuous animation and reduce entry movement.

The layout adapts to phone, tablet, and desktop widths. Fingerprints and long filenames wrap on narrow screens. Keyboard focus, the skip link, input labels, result announcements, and underlined prose links are preserved. Navigation colors change immediately to maintain contrast through route and theme changes.

## Privacy and performance

File contents stay in the browser. After hashing, the app may request the reputation service's availability without sending file metadata. A reputation lookup sends only SHA-256 and requires an explicit action. Receipt and comparison semantics are described in the README.

The interface uses a small native SVG favicon, locally bundled fonts, Motion's smaller `m` components, and Phosphor icons. It needs no canvas renderer, external video, remote visual assets, or font service.

## Verification

Browser checks cover landing-page uploads, downloaded receipts, replacement and clearing, automatic and reduced motion, both themes, verification, comparison, clipboard actions, error recovery, and mobile accessibility. Documentation screenshots show the empty checker, completed results, the simplified Verify page, and comparison results.

A local Lighthouse mobile audit of the paper redesign on 23 October 2026 scored 94 for performance and 100 for accessibility, best practices, and SEO. It measured 2.4 seconds largest contentful paint, 140 ms total blocking time, and zero cumulative layout shift. Lighthouse flagged the host CPU as slower than its expected baseline; these are local laboratory measurements rather than field-performance guarantees.
