import { chromium } from "@playwright/test";
import fs from "node:fs";
import path from "node:path";

const outDir = path.resolve("test-results", "login-diagnose");
fs.mkdirSync(outDir, { recursive: true });

const browser = await chromium.launch({ headless: true, channel: "chrome" }).catch(() =>
  chromium.launch({ headless: true }),
);
const context = await browser.newContext({
  locale: "zh-CN",
  viewport: { width: 1440, height: 960 },
});
const page = await context.newPage();

const network = [];
const consoles = [];
page.on("console", (m) => consoles.push({ type: m.type(), text: m.text() }));
page.on("requestfailed", (req) => {
  network.push({
    kind: "failed",
    url: req.url(),
    method: req.method(),
    error: req.failure()?.errorText,
  });
});
page.on("response", async (res) => {
  const url = res.url();
  if (
    /login|oauth|sso|auth|token|feishu|lark|microsoft|google|okta|redirect|callback/i.test(url) ||
    res.status() >= 400
  ) {
    network.push({
      kind: "response",
      status: res.status(),
      url,
      method: res.request().method(),
    });
  }
});

const report = {
  steps: [],
  finalUrl: "",
  title: "",
  bodySnippet: "",
  loginButtons: [],
  network: [],
  consoles: [],
};

async function step(name, fn) {
  try {
    const data = await fn();
    report.steps.push({ name, ok: true, data });
  } catch (e) {
    report.steps.push({ name, ok: false, error: String(e) });
  }
}

await step("open-login", async () => {
  const resp = await page.goto("https://test-agent.ailuxbio.com/login", {
    waitUntil: "networkidle",
    timeout: 60_000,
  });
  await page.waitForTimeout(2000);
  await page.screenshot({ path: path.join(outDir, "01-login.png"), fullPage: true });
  return { status: resp?.status(), url: page.url(), title: await page.title() };
});

await step("inspect-ui", async () => {
  const buttons = await page.locator("button,a,[role='button']").evaluateAll((els) =>
    els.map((el) => ({
      tag: el.tagName.toLowerCase(),
      text: (el.innerText || "").trim().slice(0, 100),
      href: el.getAttribute("href"),
      type: el.getAttribute("type"),
    })).filter((x) => x.text || x.href),
  );
  const inputs = await page.locator("input").evaluateAll((els) =>
    els.map((el) => ({
      type: el.getAttribute("type"),
      name: el.getAttribute("name"),
      placeholder: el.getAttribute("placeholder"),
      id: el.id,
    })),
  );
  report.loginButtons = buttons.slice(0, 40);
  report.bodySnippet = ((await page.locator("body").innerText()) || "").slice(0, 1200);
  return { buttons: buttons.slice(0, 40), inputs };
});

await step("click-login", async () => {
  const loginBtn = page.getByRole("button", { name: /登录|Login|Sign in/i }).first();
  if ((await loginBtn.count()) === 0) return { skipped: true, reason: "no login button" };
  await Promise.all([
    page.waitForLoadState("domcontentloaded").catch(() => {}),
    loginBtn.click(),
  ]);
  await page.waitForTimeout(5000);
  await page.screenshot({ path: path.join(outDir, "02-after-click-login.png"), fullPage: true });
  return { url: page.url(), title: await page.title() };
});

await step("probe-agent-direct", async () => {
  const resp = await page.goto(
    "https://test-agent.ailuxbio.com/agent?ailux=%7Bapp%7D%2Fconversation%2F0db49341-6d62-4dc1-8f62-feb1e8e83b7b",
    { waitUntil: "domcontentloaded", timeout: 60_000 },
  );
  await page.waitForTimeout(3000);
  await page.screenshot({ path: path.join(outDir, "03-agent-direct.png"), fullPage: true });
  return { status: resp?.status(), url: page.url(), title: await page.title() };
});

report.finalUrl = page.url();
report.title = await page.title();
report.network = network.slice(0, 80);
report.consoles = consoles.filter((c) => c.type === "error" || c.type === "warning").slice(0, 40);

fs.writeFileSync(path.join(outDir, "report.json"), JSON.stringify(report, null, 2), "utf-8");
console.log(JSON.stringify(report, null, 2));
await browser.close();
