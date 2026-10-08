import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const cli = fileURLToPath(new URL("../node_modules/@playwright/test/cli.js", import.meta.url));
const run = spawnSync(process.execPath, [cli, "test", "e2e/final-screenshots.spec.ts", "--project=chromium"], {
  stdio: "inherit",
  env: { ...process.env, GENERATE_SCREENSHOTS: "1" },
});
if (run.error) throw run.error;
process.exit(run.status ?? 1);
