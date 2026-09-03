/**
 * 使用已保存登录态打开测试环境并做轻量冒烟。
 * 需要先：pnpm test:e2e:auth
 */
import { chromium } from "@playwright/test";
import fs from "node:fs";
import path from "node:path";

const auth = path.resolve("e2e/.auth/user.json");
const url =
  process.env.TARGET_URL ||
  "https://test-agent.ailuxbio.com/agent?ailux=%7Bapp%7D%2Fconversation%2F0db49341-6d62-4dc1-8f62-feb1e8e83b7b";
const outDir = path.resolve("test-results", "remote-authed");
const proxyServer = process.env.PLAYWRIGHT_PROXY || process.env.HTTPS_PROXY || process.env.HTTP_PROXY || "";

if (!fs.existsSync(auth)) {
  console.error("缺少登录态文件 e2e/.auth/user.json，请先运行: pnpm test:e2e:auth");
  process.exit(1);
}

fs.mkdirSync(outDir, { recursive: true });

const launchOptions = { headless: true };
if (proxyServer) {
  launchOptions.proxy = { server: proxyServer.includes("://") ? proxyServer : `http://${proxyServer}` };
}

const browser = await chromium.launch(launchOptions);
const context = await browser.newContext({
  storageState: auth,
  locale: "zh-CN",
  viewport: { width: 1440, height: 960 },
});
const page = await context.newPage();
await page.goto(url, { waitUntil: "domcontentloaded", timeout: 60_000 });
await page.waitForTimeout(4000);

const finalUrl = page.url();
const title = await page.title();
const body = (await page.locator("body").innerText().catch(() => "")) || "";
const loggedOut = /\/login|登录/.test(finalUrl) || (/登录/.test(body) && !/发送|对话|Agent|会话/.test(body));

await page.screenshot({ path: path.join(outDir, "page.png"), fullPage: true });

const summary = {
  finalUrl,
  title,
  loggedOut,
  textareas: await page.locator("textarea:visible").count(),
  inputs: await page.locator("input:visible").count(),
  note: loggedOut ? "登录态无效或已过期，请重新 pnpm test:e2e:auth" : "已进入登录后页面，可继续加自动化用例",
};
fs.writeFileSync(path.join(outDir, "result.json"), JSON.stringify(summary, null, 2), "utf-8");
console.log(JSON.stringify(summary, null, 2));
await browser.close();
process.exit(loggedOut ? 2 : 0);
