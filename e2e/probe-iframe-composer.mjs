import { chromium } from "@playwright/test";
import fs from "node:fs";
import path from "node:path";

const auth = path.resolve("e2e/.auth/user.json");
const outDir = path.resolve("test-results", "remote-probe");
fs.mkdirSync(outDir, { recursive: true });

const browser = await chromium.launch({ headless: true, channel: "chrome" }).catch(() =>
  chromium.launch({ headless: true }),
);
const context = await browser.newContext({
  storageState: auth,
  locale: "zh-CN",
  viewport: { width: 1440, height: 960 },
});
const page = await context.newPage();
await page.goto("https://test-agent.ailuxbio.com/agent", {
  waitUntil: "domcontentloaded",
  timeout: 60_000,
});

const iframe = page.frameLocator('iframe[src*="ailux-agent-app"]').first();
await iframe.getByRole("button", { name: "新任务" }).waitFor({ timeout: 30_000 });

const dump = await iframe.locator("body").evaluate((body) => {
  const visible = (el) => !!(el.offsetWidth || el.offsetHeight || el.getClientRects().length);
  const inputs = [...body.querySelectorAll("textarea, input, [contenteditable='true']")]
    .filter(visible)
    .map((el) => ({
      tag: el.tagName,
      type: el.getAttribute("type") || "",
      ph: el.getAttribute("placeholder") || "",
      aria: el.getAttribute("aria-label") || "",
      cls: (el.className || "").toString().slice(0, 80),
    }));
  const buttons = [...body.querySelectorAll("button")]
    .filter(visible)
    .map((el) => (el.innerText || el.getAttribute("aria-label") || "").trim().slice(0, 60))
    .filter(Boolean)
    .slice(0, 50);
  return {
    text: (body.innerText || "").slice(0, 2000),
    inputs,
    buttons,
  };
});

fs.writeFileSync(path.join(outDir, "iframe-composer.json"), JSON.stringify(dump, null, 2));
await page.screenshot({ path: path.join(outDir, "iframe-composer.png"), fullPage: true });
console.log(JSON.stringify(dump, null, 2));

// click 新任务 and dump again
await iframe.getByRole("button", { name: "新任务" }).click();
await page.waitForTimeout(2000);
const dump2 = await iframe.locator("body").evaluate((body) => {
  const visible = (el) => !!(el.offsetWidth || el.offsetHeight || el.getClientRects().length);
  const inputs = [...body.querySelectorAll("textarea, input, [contenteditable='true']")]
    .filter(visible)
    .map((el) => ({
      tag: el.tagName,
      ph: el.getAttribute("placeholder") || "",
      aria: el.getAttribute("aria-label") || "",
    }));
  const buttons = [...body.querySelectorAll("button")]
    .filter(visible)
    .map((el) => (el.innerText || el.getAttribute("aria-label") || "").trim().slice(0, 60))
    .filter(Boolean)
    .slice(0, 50);
  return { url: location.href, text: (body.innerText || "").slice(0, 1500), inputs, buttons };
});
fs.writeFileSync(path.join(outDir, "iframe-new-task.json"), JSON.stringify(dump2, null, 2));
console.log("\n## after 新任务\n", JSON.stringify(dump2, null, 2));
await page.screenshot({ path: path.join(outDir, "iframe-new-task.png"), fullPage: true });

await browser.close();
