import { expect, test } from "@playwright/test";
import { createHash } from "node:crypto";
import AxeBuilder from "@axe-core/playwright";

test("mobile pages and results fit without horizontal scrolling", async ({ page }) => {
  test.setTimeout(90000);
  await page.route((url) => url.pathname.startsWith("/api/"), (route) => route.fulfill({ json: { available: false } }));
  const fixture = { name: "long-filename-for-mobile-integrity-check.txt", mimeType: "text/plain", buffer: Buffer.from("abc") };
  for (const path of ["/", "/verify", "/compare", "/about"]) {
    await page.goto(path);
    await expect(page.locator("main > div")).toHaveCSS("opacity", "1");
    if (path === "/") await expect(page.locator(".landing-checker")).toHaveCSS("opacity", "1");
    if (path === "/") {
      await page.getByLabel("Drop a file here").setInputFiles(fixture);
      await expect(page.getByTestId("sha256")).toBeVisible();
    }
    if (path === "/verify") {
      await page.getByLabel("File to verify").setInputFiles(fixture);
      const receipt = { format: "hashreviewer.integrity-receipt", version: 1, filename: fixture.name, size: 3, sha256: createHash("sha256").update("abc").digest("hex"), createdAt: "2026-10-04T00:00:00.000Z" };
      await page.getByLabel("Integrity receipt", { exact: true }).setInputFiles({ name: "receipt.json", mimeType: "application/json", buffer: Buffer.from(JSON.stringify(receipt)) });
      await expect(page.getByRole("heading", { name: "VERIFIED", exact: true })).toBeVisible();
    }
    if (path === "/compare") {
      await page.getByLabel("File A", { exact: true }).setInputFiles(fixture);
      await page.getByLabel("File B", { exact: true }).setInputFiles({ ...fixture, buffer: Buffer.from("abcd") });
      await expect(page.getByRole("heading", { name: "DIFFERENT", exact: true })).toBeVisible();
    }
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
    expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
  }
});
