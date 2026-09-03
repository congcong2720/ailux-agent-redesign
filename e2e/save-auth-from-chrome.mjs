/**
 * 从已开启远程调试的本机 Chrome 导出登录态。
 *
 * 前置（只需做一次）：
 * 1) 完全退出 Chrome（托盘图标也退出）
 * 2) PowerShell 执行下面命令启动 Chrome：
 *    & "$env:ProgramFiles\Google\Chrome\Application\chrome.exe" --remote-debugging-port=9222
 * 3) 在该 Chrome 打开并登录：
 *    https://test-agent.ailuxbio.com/agent
 * 4) 再运行：
 *    pnpm test:e2e:auth:chrome
 */
import { chromium } from "@playwright/test";
import fs from "node:fs";
import path from "node:path";

const outFile = path.resolve("e2e/.auth/user.json");
const cdp = process.env.CHROME_CDP || "http://127.0.0.1:9222";
const checkUrl =
  process.env.TARGET_URL ||
  "https://test-agent.ailuxbio.com/agent?ailux=%7Bapp%7D%2Fconversation%2F0db49341-6d62-4dc1-8f62-feb1e8e83b7b";

fs.mkdirSync(path.dirname(outFile), { recursive: true });

console.log(`[info] 连接本机 Chrome: ${cdp}`);
let browser;
try {
  browser = await chromium.connectOverCDP(cdp);
} catch (e) {
  console.error("无法连接 Chrome 远程调试端口。");
  console.error("请先完全退出 Chrome，再执行：");
  console.error(
    '  & "$env:ProgramFiles\\Google\\Chrome\\Application\\chrome.exe" --remote-debugging-port=9222',
  );
  console.error("然后在该窗口登录测试站，再重新运行本命令。");
  console.error(String(e));
  process.exit(1);
}

const context = browser.contexts()[0] || (await browser.newContext());
const page = context.pages()[0] || (await context.newPage());

// 若当前不在目标站，打开检查页
if (!/test-agent\.ailuxbio\.com/i.test(page.url())) {
  await page.goto(checkUrl, { waitUntil: "domcontentloaded", timeout: 60_000 });
  await page.waitForTimeout(2000);
}

const url = page.url();
const loggedOut = /\/login/i.test(url);
console.log(`[info] 当前页面: ${url}`);
if (loggedOut) {
  console.error("当前仍在登录页。请先在这个 Chrome 窗口完成登录，再重新运行：pnpm test:e2e:auth:chrome");
  process.exit(2);
}

await context.storageState({ path: outFile });
console.log(`[ok] 已保存登录态: ${outFile}`);

// 不要关闭用户的 Chrome
await browser.close().catch(() => {});
process.exit(0);
