import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./e2e",
  testMatch: /final-.*\.spec\.ts/,
  workers: 2,
  outputDir: "../playwright-results",
  fullyParallel: true,
  retries: process.env.CI ? 2 : 0,
  reporter: [["list"], ["html", { outputFolder: "../playwright-report", open: "never" }]],
  use: {
    baseURL: "http://127.0.0.1:5180",
    trace: "on-first-retry",
  },
  webServer: {
    command: process.env.TEST_PRODUCTION
      ? "npm run preview -- --host 127.0.0.1 --port 5180"
      : "npm run dev -- --host 127.0.0.1 --port 5180",
    url: "http://127.0.0.1:5180",
    reuseExistingServer: false,
  },
  projects: [
    {
      name: "chromium",
      testIgnore: /responsive\.spec\.ts/,
      use: { ...devices["Desktop Chrome"] },
    },
    {
      name: "mobile-320",
      testMatch: /final-responsive\.spec\.ts/,
      use: { ...devices["Desktop Chrome"], viewport: { width: 320, height: 720 } },
    },
    {
      name: "mobile-pixel7",
      testMatch: /final-responsive\.spec\.ts/,
      use: { ...devices["Pixel 7"] },
    },
  ],
});
