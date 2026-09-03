import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

const auth = path.resolve("e2e/.auth/user.json");
if (!fs.existsSync(auth)) {
  console.error("缺少 e2e/.auth/user.json，请先: pnpm test:e2e:auth:token");
  process.exit(1);
}

const headed = process.argv.includes("--headed");
const args = [
  "playwright",
  "test",
  "e2e/remote-agent-smoke.spec.ts",
  "--project=chromium",
];
if (headed) args.push("--headed");

const env = {
  ...process.env,
  PLAYWRIGHT_NO_WEBSERVER: "1",
  PLAYWRIGHT_BASE_URL: "https://test-agent.ailuxbio.com",
};

const r = spawnSync("pnpm", ["exec", ...args], {
  stdio: "inherit",
  env,
  shell: true,
  cwd: process.cwd(),
});
process.exit(r.status ?? 1);
