/**
 * 用 Playwright 打开指定网址（有界面），供手动操作。
 * 用法：node e2e/open-url.mjs [url]
 */
import { chromium } from "@playwright/test";

const url = process.argv[2] || process.env.OPEN_URL || "https://test-agent.ailuxbio.com/home";

const launchOptions = { headless: false, channel: "chrome" };
let browser;
try {
  browser = await chromium.launch(launchOptions);
} catch {
  delete launchOptions.channel;
  browser = await chromium.launch(launchOptions);
}

const page = await browser.newPage({ viewport: { width: 1440, height: 960 } });
await page.goto(url, { waitUntil: "domcontentloaded", timeout: 60_000 });
console.log("已打开:", page.url());
console.log("窗口保持打开；关闭浏览器窗口或 Ctrl+C 结束。");

await new Promise((resolve) => {
  browser.on("disconnected", resolve);
});
