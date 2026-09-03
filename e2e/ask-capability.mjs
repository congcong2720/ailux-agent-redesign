/**
 * 登录态下打开 Agent，提问「你有什么能力」，保存截图与回复文本。
 *   node e2e/ask-capability.mjs
 */
import { chromium } from "@playwright/test";
import fs from "node:fs";
import path from "node:path";

const auth = path.resolve("e2e/.auth/user.json");
const outDir = path.resolve("test-results", "remote-agent-smoke");
const question = "请用中文简要说明你有哪些核心能力？列出 5 条即可。";
const origin = "https://test-agent.ailuxbio.com";

if (!fs.existsSync(auth)) {
  console.error("缺少 e2e/.auth/user.json");
  process.exit(1);
}
fs.mkdirSync(outDir, { recursive: true });

const stored = JSON.parse(fs.readFileSync(auth, "utf-8"));
const token =
  stored.cookies?.find((c) => c.name === "access_token")?.value ||
  process.env.AILUX_ACCESS_TOKEN ||
  "";
if (!token) {
  console.error("user.json 中没有 access_token");
  process.exit(1);
}

const browser = await chromium.launch({ headless: false, channel: "chrome" }).catch(() =>
  chromium.launch({ headless: false }),
);
const context = await browser.newContext({
  locale: "zh-CN",
  viewport: { width: 1440, height: 960 },
});

// 会话 cookie(expires:-1) 在部分场景会丢；显式写入带过期时间的 cookie + initScript
const expires = Math.floor(Date.now() / 1000) + 12 * 3600;
await context.addCookies([
  {
    name: "access_token",
    value: token,
    domain: "test-agent.ailuxbio.com",
    path: "/",
    secure: true,
    httpOnly: false,
    sameSite: "Lax",
    expires,
  },
]);
await context.addInitScript((t) => {
  document.cookie = `access_token=${encodeURIComponent(t)};path=/;Secure;SameSite=Lax`;
}, token);

const page = await context.newPage();

function appFrame() {
  return page.frames().find((f) => /ailux-agent-app/i.test(f.url()));
}

async function waitAppReady(timeoutMs = 90_000) {
  const started = Date.now();
  while (Date.now() - started < timeoutMs) {
    if (/\/login/i.test(page.url())) {
      throw new Error(`被重定向到登录页: ${page.url()}`);
    }
    const frame = appFrame();
    if (frame) {
      const info = await frame
        .evaluate(() => {
          const text = document.body?.innerText || "";
          return {
            textLen: text.length,
            hasNewTask: /新任务/.test(text),
            textareas: document.querySelectorAll("textarea").length,
            snippet: text.slice(0, 120).replace(/\s+/g, " "),
          };
        })
        .catch(() => null);
      if (info) {
        console.log("app:", JSON.stringify(info));
        if (info.hasNewTask || info.textareas > 0) return frame;
      }
    }
    await page.waitForTimeout(800);
  }
  throw new Error("Agent iframe 未就绪: " + page.frames().map((f) => f.url()).join(" | "));
}

async function clickButtonByText(frame, re) {
  const ok = await frame.evaluate((pattern) => {
    const rx = new RegExp(pattern);
    const btn = [...document.querySelectorAll("button")].find((b) => rx.test(b.innerText || ""));
    if (!btn) return false;
    btn.click();
    return true;
  }, re.source);
  if (!ok) throw new Error(`未找到按钮: ${re}`);
}

async function fillTextarea(frame, value) {
  await frame.evaluate((v) => {
    const ta = document.querySelector("textarea");
    if (!ta) throw new Error("no textarea");
    ta.focus();
    const desc = Object.getOwnPropertyDescriptor(window.HTMLTextAreaElement.prototype, "value");
    desc?.set?.call(ta, v);
    ta.dispatchEvent(new Event("input", { bubbles: true }));
    ta.dispatchEvent(new Event("change", { bubbles: true }));
  }, value);
}

try {
  // 先打 auth/me 确认 cookie 随请求带上
  const me = await page.request.get(`${origin}/api/v1/auth/me`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  console.log("auth/me", me.status());

  await page.goto(`${origin}/home`, { waitUntil: "domcontentloaded", timeout: 60_000 });
  console.log("home:", page.url());
  await page.screenshot({ path: path.join(outDir, "01-home.png"), fullPage: true });

  await page.goto(`${origin}/agent`, { waitUntil: "domcontentloaded", timeout: 60_000 });
  console.log("agent:", page.url());
  if (/\/login/i.test(page.url())) {
    // 再注入一次 cookie 后重试
    await page.evaluate((t) => {
      document.cookie = `access_token=${encodeURIComponent(t)};path=/`;
    }, token);
    await page.goto(`${origin}/agent`, { waitUntil: "domcontentloaded", timeout: 60_000 });
    console.log("agent retry:", page.url());
  }

  const app = await waitAppReady();
  await page.screenshot({ path: path.join(outDir, "02-agent.png"), fullPage: true });

  await clickButtonByText(app, /新任务/);
  await page.waitForTimeout(1500);

  {
    const started = Date.now();
    while (Date.now() - started < 30_000) {
      const n = await app.evaluate(() => document.querySelectorAll("textarea").length);
      if (n > 0) break;
      await page.waitForTimeout(400);
    }
  }

  await fillTextarea(app, question);
  await clickButtonByText(app, /^发送$/);
  console.log("sent question");
  await page.waitForTimeout(2500);
  await page.screenshot({ path: path.join(outDir, "03-question-sent.png"), fullPage: true });

  const started = Date.now();
  let bodyText = "";
  let sawThinking = false;
  while (Date.now() - started < 180_000) {
    bodyText = await app.evaluate(() => document.body?.innerText || "");
    const idx = bodyText.indexOf(question);
    const afterQ = idx >= 0 ? bodyText.slice(idx + question.length) : "";
    const thinking = /思考中|生成中|正在/.test(afterQ);
    if (thinking) sawThinking = true;
    // 侧栏也有「能力」字样，只看问题之后的主对话区文本
    const hasReply =
      sawThinking &&
      !thinking &&
      afterQ.length > 80 &&
      /能力|抗体|结构|序列|预测|工具|工作流|可以帮|支持|靶点|分析|Skill/.test(afterQ);
    if (hasReply) {
      await page.waitForTimeout(8000); // 等流式结束
      bodyText = await app.evaluate(() => document.body?.innerText || "");
      break;
    }
    process.stdout.write(thinking ? "t" : ".");
    await page.waitForTimeout(2000);
  }
  console.log("");

  fs.writeFileSync(
    path.join(outDir, "04-capability-reply.txt"),
    `Q: ${question}\n\n--- page text ---\n${bodyText.slice(0, 8000)}\n`,
    "utf-8",
  );
  await page.screenshot({ path: path.join(outDir, "04-capability-reply.png"), fullPage: true });

  // 刷新保存带 expires 的登录态
  await context.storageState({ path: auth });

  const idx = bodyText.indexOf(question);
  const afterQ = idx >= 0 ? bodyText.slice(idx + question.length) : "";
  const ok =
    idx >= 0 &&
    !/思考中/.test(afterQ) &&
    afterQ.length > 80 &&
    /能力|抗体|结构|序列|预测|工具|工作流|Skill/.test(afterQ);
  console.log(ok ? "SUCCESS: got capability reply" : "WARN: reply incomplete");
  console.log("snippet:\n", bodyText.slice(Math.max(0, idx), idx + 2000));

  console.log("窗口保持 15s 供查看…");
  await page.waitForTimeout(15_000);
  await browser.close();
  process.exit(ok ? 0 : 2);
} catch (e) {
  console.error(e);
  await page.screenshot({ path: path.join(outDir, "error.png"), fullPage: true }).catch(() => {});
  console.log("final url:", page.url());
  await browser.close().catch(() => {});
  process.exit(1);
}
