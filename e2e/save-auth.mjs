/**
 * 导出登录态到 e2e/.auth/user.json
 *
 * 用法：
 *   pnpm test:e2e:auth
 *   $env:PLAYWRIGHT_PROXY="http://127.0.0.1:10809"; pnpm test:e2e:auth
 *
 * 在弹出窗口登录；检测到离开 /login 后会自动保存（也可在终端按 Enter 手动保存）。
 */
import { chromium } from "@playwright/test";
import fs from "node:fs";
import path from "node:path";
import readline from "node:readline";
import net from "node:net";

const loginUrl = process.env.LOGIN_URL || "https://test-agent.ailuxbio.com/login";
const outFile = path.resolve("e2e/.auth/user.json");
const proxyServer = process.env.PLAYWRIGHT_PROXY || process.env.HTTPS_PROXY || process.env.HTTP_PROXY || "";

/** 仅 URL 离开 /login 不够：SPA 常先停在 /home 再跳登录，且无 cookie */
async function hasAuthSignal(page) {
  try {
    const cookies = await page.context().cookies("https://test-agent.ailuxbio.com");
    const cookieHit = cookies.some((c) =>
      /token|auth|session|access|refresh|jwt|sso|xops/i.test(`${c.name}=${c.value}`),
    );
    if (cookieHit) return true;
    return await page.evaluate(() => {
      const keys = Object.keys(localStorage);
      const vals = keys.map((k) => `${k}=${localStorage.getItem(k) || ""}`);
      return vals.some((s) =>
        /token|auth|session|access|refresh|jwt|Bearer|login/i.test(s),
      );
    });
  } catch {
    return false;
  }
}

async function canConnect(host, port, timeoutMs = 400) {
  return new Promise((resolve) => {
    const socket = net.connect({ host, port });
    const done = (ok) => {
      socket.destroy();
      resolve(ok);
    };
    socket.setTimeout(timeoutMs);
    socket.on("connect", () => done(true));
    socket.on("timeout", () => done(false));
    socket.on("error", () => done(false));
  });
}

function parseProxy(server) {
  if (!server) return null;
  try {
    const u = new URL(server.includes("://") ? server : `http://${server}`);
    return { server: `${u.protocol}//${u.host}` };
  } catch {
    return { server };
  }
}

fs.mkdirSync(path.dirname(outFile), { recursive: true });

let proxy = parseProxy(proxyServer);
if (proxy) {
  const u = new URL(proxy.server);
  const ok = await canConnect(u.hostname, Number(u.port || 80));
  if (!ok) {
    console.warn(`[warn] 代理 ${proxy.server} 不可连接，改为直连。`);
    proxy = null;
  } else {
    console.log(`[info] 使用代理: ${proxy.server}`);
  }
} else {
  console.log("[info] 未设置 PLAYWRIGHT_PROXY，直连启动。");
  console.log("      若以后要走代理：先开翻墙「系统代理」，再设 PLAYWRIGHT_PROXY=http://127.0.0.1:端口");
}

const launchOptions = { headless: false, channel: "chrome" };
if (proxy) launchOptions.proxy = proxy;

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
const page = await context.newPage();
await page.goto(loginUrl, { waitUntil: "domcontentloaded", timeout: 60_000 });

console.log("\n========================================");
console.log("1) 在弹出的 Chrome 窗口中完成登录");
console.log("2) 进入 Agent / 对话页后，脚本会自动保存");
console.log("3) 也可随时在此终端按 Enter 立即保存");
console.log("========================================\n");
console.log("当前页:", page.url());

let saved = false;
async function save(reason) {
  if (saved) return;
  saved = true;
  await context.storageState({ path: outFile });
  console.log(`\n[${reason}] 已保存: ${outFile}`);
  console.log(`最终页面: ${page.url()}`);
  try {
    await browser.close();
  } catch {
    /* ignore */
  }
}

const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
rl.on("line", async () => {
  await save("手动确认");
  rl.close();
  process.exit(0);
});

// 自动检测：离开 login，且 cookie/localStorage 出现登录信号
const started = Date.now();
while (!saved && Date.now() - started < 10 * 60 * 1000) {
  const current = page.url();
  const leftLogin =
    !/\/login(?:\?|$)/i.test(current) && /test-agent\.ailuxbio\.com/i.test(current);
  if (leftLogin && (await hasAuthSignal(page))) {
    await page.waitForTimeout(2000);
    if (!/\/login(?:\?|$)/i.test(page.url()) && (await hasAuthSignal(page))) {
      await save("检测到已登录");
      rl.close();
      process.exit(0);
    }
  }
  await page.waitForTimeout(1000);
}

if (!saved) {
  console.error("超时未检测到登录成功。请重试 pnpm test:e2e:auth");
  await browser.close().catch(() => {});
  process.exit(1);
}
