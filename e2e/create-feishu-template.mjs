import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

const content = fs.readFileSync(
  path.resolve("e2e/feishu-agent-test-template.xml"),
  "utf-8",
);

const r = spawnSync(
  "lark-cli",
  [
    "docs",
    "+create",
    "--api-version",
    "v2",
    "--as",
    "user",
    "--parent-position",
    "my_library",
    "--content",
    content,
  ],
  { encoding: "utf-8", maxBuffer: 20 * 1024 * 1024 },
);

if (r.stdout) process.stdout.write(r.stdout);
if (r.stderr) process.stderr.write(r.stderr);
process.exit(r.status ?? 1);
