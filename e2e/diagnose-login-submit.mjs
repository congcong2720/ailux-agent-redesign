import { chromium } from "@playwright/test";
import fs from "node:fs";
import path from "node:path";

const outDir = path.resolve("test-results", "login-diagnose");
fs.mkdirSync(outDir, { recursive: true });

const browser = await chromium.launch({ headless: true, channel: "chrome" }).catch(() =>
  chromium.launch({ headless: true }),
);
const page = await (await browser.newContext({ locale: "zh-CN" })).newPage();

const api = [];
page.on("response", async (res) => {
  const url = res.url();
  if (/login|auth|token|user|session|api/i.test(url)) {
    let body = "";
    try {
      body = (await res.text()).slice(0, 500);
    } catch {
      /* ignore */
    }
    api.push({ status: res.status(), url, method: res.request().method(), body });
  }
});

await page.goto("https://test-agent.ailuxbio.com/login", { waitUntil: "networkidle" });
await page.getByPlaceholder("请输入邮箱").fill("probe-not-a-real-user@example.com");
await page.getByPlaceholder("请输入密码").fill("wrong-password-for-probe");

const toastPromise = page
  .locator(".el-message,.el-notification,.toast,text=错误,text=失败,text=无效")
  .first()
  .textContent({ timeout: 5000 })
  .catch(() => null);

await page.getByRole("button", { name: "登录", exact: true }).click();
await page.waitForTimeout(4000);
const toast = await toastPromise;
await page.screenshot({ path: path.join(outDir, "04-bad-login.png"), fullPage: true });

const result = {
  url: page.url(),
  toast,
  bodySnippet: ((await page.locator("body").innerText()) || "").slice(0, 1500),
  api: api.slice(0, 30),
};
fs.writeFileSync(path.join(outDir, "submit-report.json"), JSON.stringify(result, null, 2), "utf-8");
console.log(JSON.stringify(result, null, 2));
await browser.close();
