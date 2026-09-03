/**
 * 用 access_token 跳过账密登录，写入 e2e/.auth/user.json 并打开页面。
 *
 * 用法（勿把 token 写进仓库 / 提交 git）：
 *   $env:AILUX_ACCESS_TOKEN="你的token"
 *   pnpm test:e2e:auth:token
 *
 * 可选：
 *   $env:TARGET_URL="https://test-agent.ailuxbio.com/home"
 *   $env:HEADLESS="1"
 */
import { chromium } from "@playwright/test";
import fs from "node:fs";
import path from "node:path";

const token = (process.env.AILUX_ACCESS_TOKEN || process.argv[2] || "").trim();
const targetUrl =
  process.env.TARGET_URL || "https://test-agent.ailuxbio.com/home";
const outFile = path.resolve("e2e/.auth/user.json");
const headless = process.env.HEADLESS === "1" || process.env.HEADLESS === "true";

if (!token) {
  console.error("缺少 token。请设置环境变量 AILUX_ACCESS_TOKEN 后重试。");
  process.exit(1);
}

fs.mkdirSync(path.dirname(outFile), { recursive: true });

const launchOptions = { headless, channel: "chrome" };
let browser;
try {
  browser = await chromium.launch(launchOptions);
} catch {
  delete launchOptions.channel;
  browser = await chromium.launch(launchOptions);
}

const context = await browser.newContext({
  locale: "zh-CN",
  viewport: { width: 1440, height: 960 },
});

// 与线上一致：cookie key = access_token；请求头 Authorization: Bearer <token>
await context.addCookies([
  {
    name: "access_token",
    value: token,
    domain: "test-agent.ailuxbio.com",
    path: "/",
    secure: true,
    httpOnly: false,
    sameSite: "Lax",
    expires: Math.floor(Date.now() / 1000) + 12 * 3600,
  },
]);
await context.addInitScript((t) => {
  document.cookie = `access_token=${encodeURIComponent(t)};path=/;Secure;SameSite=Lax`;
}, token);

const page = await context.newPage();

// 先验证 token 是否被后端接受
const me = await page.request.get("https://test-agent.ailuxbio.com/api/v1/auth/me", {
  headers: { Authorization: `Bearer ${token}` },
});
const meStatus = me.status();
const meBody = await me.text().catch(() => "");
console.log(`[auth/me] status=${meStatus}`);
if (meStatus >= 400) {
  console.error("token 无效或已过期，/api/v1/auth/me 失败：", meBody.slice(0, 300));
  await browser.close();
  process.exit(2);
}

await page.goto(targetUrl, { waitUntil: "domcontentloaded", timeout: 60_000 });
await page.waitForTimeout(2500);

const finalUrl = page.url();
const loggedOut = /\/login(?:\?|$)/i.test(finalUrl);
console.log("当前页:", finalUrl);

await context.storageState({ path: outFile });
console.log("已保存登录态:", outFile);

if (loggedOut) {
  console.error("仍被重定向到登录页。可能还需要其它 cookie，或 token 权限不足。");
  if (!headless) {
    console.log("窗口保持打开 60s，便于你查看。");
    await page.waitForTimeout(60_000);
  }
  await browser.close();
  process.exit(3);
}

console.log("已进入登录后页面。");
if (!headless) {
  console.log("窗口保持打开；关闭浏览器或 Ctrl+C 结束。");
  await new Promise((resolve) => browser.on("disconnected", resolve));
} else {
  await browser.close();
}
