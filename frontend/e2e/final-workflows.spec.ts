import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import { expect, test, type Page } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

const content = Buffer.from("HashReviewer integrity demonstration.\n");
const sha256 = createHash("sha256").update(content).digest("hex");
const fixture = { name: "example.txt", mimeType: "text/plain", buffer: content };
const receipt = { format: "hashreviewer.integrity-receipt", version: 1, filename: fixture.name, size: content.length, sha256, createdAt: "2026-10-04T00:00:00.000Z" };
const receiptFile = { name: "example.txt.integrity.json", mimeType: "application/json", buffer: Buffer.from(JSON.stringify(receipt)) };

async function noReputation(page: Page) {
  await page.route((url) => url.pathname.startsWith("/api/"), (route) => route.fulfill({ json: { available: false } }));
}
async function check(page: Page) {
  await page.goto("/");
  await page.getByLabel("Drop a file here").setInputFiles(fixture);
  await expect(page.getByTestId("sha256")).toHaveText(sha256, { timeout: 15000 });
}

test("home is the only file checker and legacy links redirect to it", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "Every byte. Accounted for.", exact: true })).toBeVisible();
  await expect(page.getByText("Drop a file here", { exact: true })).toBeVisible();
  await expect(page.getByRole("navigation").getByRole("link")).toHaveText(["Home", "Verify", "Compare", "About"]);
  await page.getByLabel("Drop a file here").setInputFiles(fixture);
  await expect(page.getByTestId("sha256")).toHaveText(sha256);
  await expect(page).toHaveURL(/\/$/);
  await page.goto("/check");
  await expect(page).toHaveURL(/\/$/);
  await expect(page.getByLabel("Drop a file here")).toBeVisible();
  expect(errors).toEqual([]);
});

test("all three hashes are correct and only a capability request happens automatically", async ({ page }) => {
  const requests: { url: string; method: string; body: string | null }[] = [];
  await page.route((url) => url.pathname.startsWith("/api/"), (route) => { const req = route.request(); requests.push({ url: req.url(), method: req.method(), body: req.postData() }); return route.fulfill({ json: { available: false } }); });
  await check(page);
  for (const algorithm of ["sha256", "sha1", "md5"]) await expect(page.getByTestId(algorithm)).toHaveText(createHash(algorithm).update(content).digest("hex"));
  await expect(page.getByText("Reputation lookup is unavailable.", { exact: true })).toBeVisible();
  expect(requests.length).toBeGreaterThan(0);
  for (const req of requests) { expect(req.url).toMatch(/\/api\/reputation\/status$/); expect(req.method).toBe("GET"); expect(req.body).toBeNull(); }
});

test("copy actions put the complete values on the clipboard", async ({ page, context }) => {
  await context.grantPermissions(["clipboard-read", "clipboard-write"]);
  await noReputation(page); await check(page);
  await page.getByRole("button", { name: "Copy SHA-256", exact: true }).click();
  expect(await page.evaluate(() => navigator.clipboard.readText())).toBe(sha256);
  await page.getByRole("button", { name: "Copy all hashes", exact: true }).click();
  const text = await page.evaluate(() => navigator.clipboard.readText());
  expect(text).toContain(`SHA-256: ${sha256}`); expect(text).toContain("SHA-1:"); expect(text).toContain("MD5:");
});

test("create and verify the actual downloaded receipt, then detect changed bytes", async ({ page }) => {
  await noReputation(page); await check(page);
  const downloaded = page.waitForEvent("download");
  await page.getByRole("button", { name: "Create integrity receipt" }).click();
  const download = await downloaded;
  expect(download.suggestedFilename()).toBe("example.txt.integrity.json");
  const path = await download.path(); expect(path).not.toBeNull();
  const bytes = await readFile(path!);
  const record = JSON.parse(bytes.toString());
  expect(record).toMatchObject({ format: receipt.format, version: 1, filename: fixture.name, size: content.length, sha256 });
  for (const algorithm of ["sha1", "md5"]) expect(record[algorithm]).toBe(createHash(algorithm).update(content).digest("hex"));
  expect(Object.keys(record).sort()).toEqual(["format", "version", "filename", "size", "sha256", "sha1", "md5", "createdAt"].sort());
  expect(record.createdAt).toMatch(/^\d{4}-\d{2}-\d{2}T/);
  expect(bytes.length).toBeLessThan(1024);
  await page.goto("/verify");
  await page.getByLabel("File to verify").setInputFiles(fixture);
  await page.getByLabel("Integrity receipt", { exact: true }).setInputFiles({ ...receiptFile, buffer: bytes });
  await expect(page.getByRole("heading", { name: "VERIFIED", exact: true })).toBeVisible();
  await page.getByLabel("File to verify").setInputFiles({ ...fixture, buffer: Buffer.from("Modified file") });
  await expect(page.getByRole("heading", { name: "CHANGED", exact: true })).toBeVisible();
  await expect(page.getByText("Current SHA-256", { exact: true })).toBeVisible();
  await expect(page.locator(".evidence-row").filter({ hasText: "Size" })).toContainText("Different");
});

test("renaming a file preserves content verification and explains the name difference", async ({ page }) => {
  await page.goto("/verify");
  await page.getByLabel("Integrity receipt", { exact: true }).setInputFiles(receiptFile);
  await page.getByLabel("File to verify").setInputFiles({ ...fixture, name: "renamed.txt" });
  await expect(page.getByRole("heading", { name: "VERIFIED", exact: true })).toBeVisible();
  await expect(page.getByText("Renamed", { exact: true })).toBeVisible();
});

test("invalid and oversized receipts show a simple error and can be replaced", async ({ page }) => {
  await page.goto("/verify");
  await page.getByLabel("File to verify").setInputFiles(fixture);
  for (const buffer of [Buffer.from("{bad JSON"), Buffer.from(JSON.stringify({ ...receipt, version: 2 })), Buffer.alloc(16385, 32)]) {
    await page.getByLabel("Integrity receipt", { exact: true }).setInputFiles({ ...receiptFile, buffer });
    await expect(page.getByRole("alert")).toHaveText("The receipt is invalid.");
    await expect(page.getByRole("heading", { name: "VERIFIED", exact: true })).toHaveCount(0);
  }
  await page.getByLabel("Integrity receipt", { exact: true }).setInputFiles(receiptFile);
  await expect(page.getByRole("heading", { name: "VERIFIED", exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Clear both files" }).click();
  await expect(page.getByRole("heading", { name: "VERIFIED", exact: true })).toHaveCount(0);
});

test("compare identical files, renamed files, same-length changes, and different sizes locally", async ({ page, context }) => {
  await context.grantPermissions(["clipboard-read", "clipboard-write"]);
  const apiRequests: string[] = [];
  page.on("request", (request) => { if (new URL(request.url()).pathname.startsWith("/api/")) apiRequests.push(request.url()); });
  await page.goto("/compare");
  await page.getByLabel("File A", { exact: true }).setInputFiles(fixture);
  await page.getByLabel("File B", { exact: true }).setInputFiles({ ...fixture, name: "renamed.txt" });
  await expect(page.getByRole("heading", { name: "IDENTICAL", exact: true })).toBeVisible();
  const sameSize = Buffer.from(content); sameSize[0] = 88;
  await page.getByLabel("File B", { exact: true }).setInputFiles({ ...fixture, buffer: sameSize });
  await expect(page.getByRole("heading", { name: "DIFFERENT", exact: true })).toBeVisible();
  await expect(page.getByText("0 bytes · Same size")).toBeVisible();
  await page.getByLabel("File B", { exact: true }).setInputFiles({ ...fixture, buffer: Buffer.concat([content, Buffer.from("extra")]) });
  await expect(page.getByText("5 bytes · File B is larger")).toBeVisible();
  for (const [label, bytes] of [["File A", content], ["File B", Buffer.concat([content, Buffer.from("extra")])]] as const) {
    await page.getByRole("button", { name: `Copy ${label} SHA-256`, exact: true }).click();
    expect(await page.evaluate(() => navigator.clipboard.readText())).toBe(createHash("sha256").update(bytes).digest("hex"));
  }
  await page.getByRole("button", { name: "Clear both files", exact: true }).click();
  await expect(page.getByRole("heading", { name: "DIFFERENT", exact: true })).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Clear both files", exact: true })).toHaveCount(0);
  expect(apiRequests).toEqual([]);
});

test("empty files have standard hashes and verify correctly", async ({ page }) => {
  await noReputation(page); await page.goto("/");
  await page.getByLabel("Drop a file here").setInputFiles({ ...fixture, name: "empty.txt", buffer: Buffer.alloc(0) });
  for (const algorithm of ["sha256", "sha1", "md5"]) await expect(page.getByTestId(algorithm)).toHaveText(createHash(algorithm).digest("hex"));
  await page.goto("/verify");
  await page.getByLabel("File to verify").setInputFiles({ ...fixture, name: "empty.txt", buffer: Buffer.alloc(0) });
  await page.getByLabel("Integrity receipt", { exact: true }).setInputFiles({ ...receiptFile, buffer: Buffer.from(JSON.stringify({ ...receipt, filename: "empty.txt", size: 0, sha256: createHash("sha256").digest("hex") })) });
  await expect(page.getByRole("heading", { name: "VERIFIED", exact: true })).toBeVisible();
});

test("a 64 MiB file streams correctly without sending its contents", async ({ page }) => {
  test.setTimeout(90000);
  const network: { method: string; body: string | null }[] = [];
  page.on("request", (request) => network.push({ method: request.method(), body: request.postData() }));
  await noReputation(page);
  await page.goto("/");
  await page.getByLabel("Drop a file here").evaluate((input: HTMLInputElement) => {
    const chunk = new Uint8Array(4 * 1024 * 1024);
    const transfer = new DataTransfer();
    transfer.items.add(new File(Array.from({ length: 16 }, () => chunk), "large.bin"));
    input.files = transfer.files;
    input.dispatchEvent(new Event("change", { bubbles: true }));
  });
  const chunk = Buffer.alloc(4 * 1024 * 1024);
  for (const algorithm of ["sha256", "sha1", "md5"]) {
    const digest = createHash(algorithm);
    for (let i = 0; i < 16; i++) digest.update(chunk);
    await expect(page.getByTestId(algorithm)).toHaveText(digest.digest("hex"), { timeout: 60000 });
  }
  expect(network.every((request) => request.method === "GET" && request.body === null)).toBe(true);
});

test("cancel a running worker, repeat a check, clear, and refresh without saved file state", async ({ page }) => {
  await noReputation(page);
  await page.goto("/");
  await page.getByLabel("Drop a file here").evaluate((input: HTMLInputElement) => {
    const chunk = new Uint8Array(4 * 1024 * 1024);
    const transfer = new DataTransfer();
    transfer.items.add(new File(Array.from({ length: 64 }, () => chunk), "cancel.bin"));
    input.files = transfer.files;
    input.dispatchEvent(new Event("change", { bubbles: true }));
  });
  await page.getByRole("button", { name: "Cancel", exact: true }).click();
  await expect(page.getByText("Hashing cancelled. Choose a file to start again.")).toBeVisible();
  await expect(page.getByTestId("sha256")).toHaveCount(0);
  for (let i = 0; i < 2; i++) {
    await page.getByLabel("Drop a file here").setInputFiles(fixture);
    await expect(page.getByTestId("sha256")).toHaveText(sha256);
    await page.getByRole("button", { name: "Clear file", exact: true }).click();
    await expect(page.getByTestId("sha256")).toHaveCount(0);
  }
  await page.getByLabel("Drop a file here").setInputFiles(fixture);
  await expect(page.getByTestId("sha256")).toHaveText(sha256);
  await page.reload();
  await expect(page.getByTestId("sha256")).toHaveCount(0);
  expect(await page.evaluate(() => ({ local: localStorage.length, session: sessionStorage.length }))).toEqual({ local: 0, session: 0 });
});

test("unreachable backend leaves hashing usable and connection retry recovers", async ({ page }) => {
  await page.route("**/api/reputation/**", (route) => route.abort("connectionrefused"));
  await check(page);
  await expect(page.getByText("Reputation lookup is unavailable.", { exact: true })).toBeVisible();
  await page.unroute("**/api/reputation/**");
  await page.route("**/api/reputation/status", (route) => route.fulfill({ json: { available: true } }));
  await page.getByRole("button", { name: "Retry connection" }).click();
  await expect(page.getByRole("button", { name: "Check reputation", exact: true })).toBeEnabled();
});

test("contradictory reputation evidence is rejected and a later request can recover", async ({ page }) => {
  let valid = false;
  await page.route("**/api/reputation/**", (route) => route.request().url().endsWith("/status")
    ? route.fulfill({ json: { available: true } })
    : route.fulfill({ json: { status: "found", sha256, verdict: valid ? "Suspicious" : "No known detections", explanation: "One engine flagged this fingerprint.", stats: { malicious: 1, suspicious: 0, undetected: 60, harmless: 0 }, analyzedAt: null } }));
  await check(page);
  await page.getByRole("button", { name: "Check reputation", exact: true }).click();
  await expect(page.getByRole("alert")).toHaveText("Reputation lookup is unavailable.");
  await expect(page.getByRole("heading", { name: "No known detections", exact: true })).toHaveCount(0);
  valid = true;
  await page.getByRole("button", { name: "Check reputation", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Suspicious", exact: true })).toBeVisible();
  expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
});

test("drag-and-drop hashes a file in the browser", async ({ page }) => {
  await noReputation(page); await page.goto("/");
  const dataTransfer = await page.evaluateHandle(() => { const transfer = new DataTransfer(); transfer.items.add(new File(["abc"], "dropped.txt", { type: "text/plain" })); return transfer; });
  await page.locator(".file-drop").dispatchEvent("drop", { dataTransfer });
  await expect(page.getByTestId("sha256")).toHaveText(createHash("sha256").update("abc").digest("hex"));
});

test("optional reputation submits only SHA-256 after a click and renders concise evidence", async ({ page }) => {
  const lookups: string[] = [];
  await page.route("**/api/reputation/**", (route) => {
    const req = route.request();
    if (req.url().endsWith("/status")) return route.fulfill({ json: { available: true } });
    lookups.push(req.url()); expect(req.method()).toBe("GET"); expect(req.postData()).toBeNull();
    return route.fulfill({ json: { status: "found", sha256, verdict: "Suspicious", stats: { malicious: 3, suspicious: 1, undetected: 62, harmless: 0 }, analyzedAt: "2026-10-04T00:00:00+00:00", explanation: "3 engines flagged this fingerprint as malicious and 1 as suspicious. Review this evidence before trusting the file." } });
  });
  await check(page);
  await expect(page.getByRole("button", { name: "Check reputation", exact: true })).toBeEnabled();
  expect(lookups).toEqual([]);
  await page.getByRole("button", { name: "Check reputation", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Suspicious", exact: true })).toBeVisible();
  await expect(page.getByText("Why this result?", { exact: true })).toBeVisible();
  expect(lookups).toEqual([`http://127.0.0.1:5180/api/reputation/${sha256}`]);
});

test("offline reputation and provider failures leave receipts usable", async ({ page }) => {
  await page.route("**/api/reputation/**", (route) => route.request().url().endsWith("/status") ? route.fulfill({ json: { available: true } }) : route.fulfill({ status: 503, json: { message: "private-provider-details" } }));
  await check(page);
  await page.getByRole("button", { name: "Check reputation", exact: true }).click();
  await expect(page.getByRole("alert")).toHaveText("Reputation lookup is unavailable.");
  await expect(page.getByText("private-provider-details")).toHaveCount(0);
  const download = page.waitForEvent("download");
  await page.getByRole("button", { name: "Create integrity receipt" }).click();
  await download;
  await page.getByRole("button", { name: "Clear file", exact: true }).click();
  await expect(page.getByTestId("sha256")).toHaveCount(0);
});

test("read errors are concise and a new file can recover", async ({ page }) => {
  await page.route("**/src/hashing/hash.worker.ts*", (route) => route.fulfill({ contentType: "text/javascript", body: 'self.onmessage = () => self.postMessage({type:"error"});' }));
  await page.goto("/");
  await page.getByLabel("Drop a file here").setInputFiles(fixture);
  await expect(page.getByRole("alert")).toHaveText("Could not read this file.");
  await page.unroute("**/src/hashing/hash.worker.ts*");
  await page.getByLabel("Drop a file here").setInputFiles(fixture);
  await expect(page.getByTestId("sha256")).toHaveText(sha256);
});

test("a stale worker asset offers refresh and file drops work after recovery", async ({ page }) => {
  await noReputation(page);
  await page.route("**/hash.worker*", (route) => route.fulfill({ contentType: "text/html", body: "<!doctype html><title>Missing worker</title>" }));
  await page.goto("/");
  await page.getByLabel("Drop a file here").setInputFiles(fixture);
  await expect(page.getByRole("alert")).toContainText("The file checker could not start. Refresh the page, then choose your file again.");
  await expect(page.getByText("Could not read this file.", { exact: true })).toHaveCount(0);
  await expect(page.getByTestId("sha256")).toHaveCount(0);
  await expect(page.locator("main > div")).toHaveCSS("opacity", "1");
  await expect(page.locator(".landing-checker")).toHaveCSS("opacity", "1");
  expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
  await page.unroute("**/hash.worker*");
  await Promise.all([page.waitForEvent("load"), page.getByRole("button", { name: "Refresh page", exact: true }).click()]);
  await expect(page.getByRole("alert")).toHaveCount(0);
  const transfer = await page.evaluateHandle(() => {
    const data = new DataTransfer();
    data.items.add(new File(["abc"], "recovered-drop.txt", { type: "text/plain" }));
    return data;
  });
  await page.locator(".file-drop").dispatchEvent("drop", { dataTransfer: transfer });
  for (const algorithm of ["sha256", "sha1", "md5"]) await expect(page.getByTestId(algorithm)).toHaveText(createHash(algorithm).update("abc").digest("hex"));
});

test("all public pages pass accessibility checks and About has the correct creator link", async ({ page }) => {
  await noReputation(page);
  for (const path of ["/", "/verify", "/compare", "/about"]) {
    await page.goto(path);
    await expect(page.locator("main > div")).toHaveCSS("opacity", "1");
    if (path === "/") await expect(page.locator(".landing-checker")).toHaveCSS("opacity", "1");
    expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
  }
  const creator = page.getByRole("link", { name: "Mosaddiqur Rahman ↗" });
  await expect(creator).toHaveAttribute("href", "https://www.linkedin.com/in/mosaddiqur/");
  await expect(creator).toHaveAttribute("target", "_blank");
  await expect(creator).toHaveAttribute("rel", "noopener noreferrer");
  await page.goto("/history");
  await expect(page.getByRole("heading", { name: "Let’s check a file." })).toBeVisible();
});

test("landing-page checks support receipts, replacing files, and clearing without navigation", async ({ page }) => {
  const requests: { url: string; method: string; body: string | null }[] = [];
  await page.route((url) => url.pathname.startsWith("/api/"), (route) => {
    const request = route.request();
    requests.push({ url: request.url(), method: request.method(), body: request.postData() });
    return route.fulfill({ json: { available: false } });
  });
  await page.goto("/");
  await page.getByLabel("Drop a file here").setInputFiles(fixture);
  for (const algorithm of ["sha256", "sha1", "md5"]) await expect(page.getByTestId(algorithm)).toHaveText(createHash(algorithm).update(content).digest("hex"));
  const downloadPromise = page.waitForEvent("download");
  await page.getByRole("button", { name: "Create integrity receipt", exact: true }).click();
  const download = await downloadPromise;
  const downloaded = JSON.parse(await readFile((await download.path())!, "utf8"));
  expect(downloaded.sha256).toBe(sha256);
  expect(downloaded.filename).toBe(fixture.name);
  expect(requests.every((request) => request.url.endsWith("/api/reputation/status") && request.method === "GET" && request.body === null)).toBe(true);
  await page.getByLabel("Drop a file here").setInputFiles({ ...fixture, buffer: Buffer.from("changed") });
  await expect(page.getByTestId("sha256")).toHaveText(createHash("sha256").update("changed").digest("hex"));
  await page.getByRole("button", { name: "Clear file", exact: true }).click();
  await expect(page.getByTestId("sha256")).toHaveCount(0);
  await expect(page).toHaveURL(/\/$/);
});

test("sample checks, automatic animations, and both themes work across navigation", async ({ page }) => {
  test.setTimeout(60000);
  await noReputation(page);
  await page.goto("/");
  await expect(page.locator("html")).toHaveAttribute("data-theme", "light");
  await page.getByRole("button", { name: "Try a sample file", exact: true }).click();
  await expect(page.getByTestId("sha256")).toHaveText(createHash("sha256").update("abc").digest("hex"));
  await expect(page.getByRole("button", { name: /Pause animations|Resume animations/ })).toHaveCount(0);
  expect(await page.locator(".paper-grid").evaluate((element) => getComputedStyle(element, "::after").animationPlayState)).toBe("running");
  expect(await page.locator(".paper-grid").evaluate((element) => getComputedStyle(element, "::after").animationName)).toBe("paper-scan");
  for (const theme of ["light", "dark"]) {
    if (theme === "dark") await page.getByRole("button", { name: "Switch to dark theme", exact: true }).click();
    for (const label of ["Verify", "Compare", "About", "Home"]) {
      await page.getByRole("navigation").getByRole("link", { name: label, exact: true }).click();
      await expect(page.locator("main > div")).toHaveCSS("opacity", "1");
      if (label === "Home") await expect(page.locator(".landing-checker")).toHaveCSS("opacity", "1");
      await expect(page.locator("html")).toHaveAttribute("data-theme", theme);
      expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
    }
  }
  expect(await page.evaluate(() => ({ local: localStorage.length, session: sessionStorage.length }))).toEqual({ local: 0, session: 0 });
});

test("reduced motion leaves the background still and landing checks usable", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await noReputation(page);
  await page.goto("/");
  await expect(page.locator(".landing-checker")).toHaveCSS("opacity", "1");
  expect(await page.locator(".paper-grid").evaluate((element) => getComputedStyle(element, "::after").animationName)).toBe("none");
  await page.getByLabel("Drop a file here").setInputFiles(fixture);
  await expect(page.getByTestId("sha256")).toHaveText(sha256);
});
