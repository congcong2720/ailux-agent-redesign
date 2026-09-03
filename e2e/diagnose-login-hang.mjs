import { chromium } from "@playwright/test";
import fs from "node:fs";
import path from "node:path";

const outDir = path.resolve("test-results", "login-hang");
fs.mkdirSync(outDir, { recursive: true });

const browser = await chromium.launch({ headless: true, channel: "chrome" }).catch(() =>
  chromium.launch({ headless: true }),
);
const context = await browser.newContext({ locale: "zh-CN", viewport: { width: 1440, height: 960 } });
const page = await context.newPage();

const events = [];
page.on("request", (req) => {
  const url = req.url();
  if (/api|oauth|auth|xops|token|login/i.test(url)) {
    events.push({ t: Date.now(), kind: "req", method: req.method(), url });
  }
});
page.on("response", async (res) => {
  const url = res.url();
  if (/api|oauth|auth|xops|token|login/i.test(url)) {
    let body = "";
    try {
      body = (await res.text()).slice(0, 400);
    } catch {
      /* ignore */
    }
    events.push({ t: Date.now(), kind: "res", status: res.status(), url, body });
  }
});
page.on("requestfailed", (req) => {
  events.push({
    t: Date.now(),
    kind: "fail",
    url: req.url(),
    error: req.failure()?.errorText,
  });
});

await page.goto("https://test-agent.ailuxbio.com/login", { waitUntil: "networkidle" });

// Observe loading spinner behavior on empty submit and on button disabled state
const before = {
  url: page.url(),
  loginDisabled: await page.getByRole("button", { name: "登录", exact: true }).isDisabled(),
};

// Fill placeholders only if env provides credentials (optional)
const email = process.env.AILUX_EMAIL || "";
const password = process.env.AILUX_PASSWORD || "";
if (email && password) {
  await page.getByPlaceholder("请输入邮箱").fill(email);
  await page.getByPlaceholder("请输入密码").fill(password);
  await page.getByRole("button", { name: "登录", exact: true }).click();
  // wait up to 30s for either navigation or spinner stuck
  const start = Date.now();
  while (Date.now() - start < 30000) {
    const url = page.url();
    const spinning = await page.locator(".el-loading-mask,.is-loading,.el-button.is-loading").count();
    if (!/\/login/.test(url)) break;
    if (spinning === 0 && Date.now() - start > 5000) break;
    await page.waitForTimeout(500);
  }
  await page.screenshot({ path: path.join(outDir, "with-creds.png"), fullPage: true });
} else {
  // Probe authorize latency with intentional wrong password to see if API itself is slow
  await page.getByPlaceholder("请输入邮箱").fill("latency-probe@example.com");
  await page.getByPlaceholder("请输入密码").fill("latency-probe");
  const t0 = Date.now();
  const respPromise = page.waitForResponse(
    (r) => r.url().includes("/oauth2/authorize") || r.url().includes("/auth"),
    { timeout: 30000 },
  );
  await page.getByRole("button", { name: "登录", exact: true }).click();
  let respInfo = null;
  try {
    const resp = await respPromise;
    respInfo = {
      ms: Date.now() - t0,
      status: resp.status(),
      url: resp.url(),
      body: (await resp.text()).slice(0, 300),
    };
  } catch (e) {
    respInfo = { ms: Date.now() - t0, error: String(e) };
  }
  await page.waitForTimeout(2000);
  await page.screenshot({ path: path.join(outDir, "wrong-pass.png"), fullPage: true });
  before.probe = respInfo;
}

const spinning = await page.locator(".el-loading-mask,.is-loading,.el-button.is-loading").count();
const result = {
  before,
  finalUrl: page.url(),
  spinningCount: spinning,
  bodySnippet: ((await page.locator("body").innerText()) || "").slice(0, 1200),
  events,
};
fs.writeFileSync(path.join(outDir, "report.json"), JSON.stringify(result, null, 2), "utf-8");
console.log(JSON.stringify(result, null, 2));
await browser.close();
