/**
 * 远程 AiluxAgent 功能走查（登录态）
 *   node e2e/remote-walkthrough.mjs
 */
import { chromium } from "@playwright/test";
import fs from "node:fs";
import path from "node:path";

const auth = path.resolve("e2e/.auth/user.json");
const outDir = path.resolve("test-results", "remote-walkthrough");
const origin = "https://test-agent.ailuxbio.com";

if (!fs.existsSync(auth)) {
  console.error("缺少 e2e/.auth/user.json，请先 pnpm test:e2e:auth:token");
  process.exit(1);
}
fs.mkdirSync(outDir, { recursive: true });

const stored = JSON.parse(fs.readFileSync(auth, "utf-8"));
const token = stored.cookies?.find((c) => c.name === "access_token")?.value || "";
if (!token) {
  console.error("user.json 无 access_token");
  process.exit(1);
}

/** @type {{ id: string, name: string, ok: boolean, detail: string }[]} */
const results = [];
const log = (id, name, ok, detail = "") => {
  results.push({ id, name, ok, detail });
  console.log(`${ok ? "PASS" : "FAIL"} [${id}] ${name}${detail ? " — " + detail : ""}`);
};

const browser = await chromium.launch({ headless: false, channel: "chrome" }).catch(() =>
  chromium.launch({ headless: false }),
);
const context = await browser.newContext({
  locale: "zh-CN",
  viewport: { width: 1440, height: 960 },
});
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
let shot = 0;
async function snap(label) {
  shot += 1;
  const file = path.join(outDir, `${String(shot).padStart(2, "0")}-${label}.png`);
  await page.screenshot({ path: file, fullPage: true }).catch(() => {});
  return file;
}

function appFrame() {
  return page.frames().find((f) => /ailux-agent-app/i.test(f.url()));
}

async function waitApp(timeoutMs = 90_000) {
  const t0 = Date.now();
  while (Date.now() - t0 < timeoutMs) {
    if (/\/login/i.test(page.url())) throw new Error("redirected to login: " + page.url());
    const f = appFrame();
    if (f) {
      const ready = await f
        .evaluate(() => /新任务/.test(document.body?.innerText || ""))
        .catch(() => false);
      if (ready) return f;
    }
    await page.waitForTimeout(500);
  }
  throw new Error("agent iframe not ready");
}

async function bodyText(frame) {
  return frame.evaluate(() => document.body?.innerText || "");
}

async function clickBtn(frame, pattern) {
  return frame.evaluate((p) => {
    const rx = new RegExp(p);
    const btn = [...document.querySelectorAll("button, [role='button']")].find((b) => {
      const raw = (b.innerText || b.getAttribute("aria-label") || "").trim();
      if (rx.test(raw)) return true;
      return raw
        .split(/\n/)
        .map((s) => s.trim())
        .some((line) => rx.test(line));
    });
    if (!btn) return false;
    btn.click();
    return true;
  }, pattern);
}

async function clickText(frame, pattern) {
  return frame.evaluate((p) => {
    const rx = new RegExp(p);
    const el = [...document.querySelectorAll("button, a, [role='button'], div, span")].find((n) => {
      const t = (n.innerText || "").trim();
      return t.length < 80 && rx.test(t) && n.offsetParent !== null;
    });
    if (!el) return false;
    el.click();
    return true;
  }, pattern);
}

try {
  // —— 0. API ——
  const me = await page.request.get(`${origin}/api/v1/auth/me`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  log("A0", "auth/me", me.status() === 200, `status=${me.status()}`);

  // —— 1. 首页 ——
  await page.goto(`${origin}/home`, { waitUntil: "domcontentloaded", timeout: 60_000 });
  await page.waitForTimeout(2000);
  const homeText = await page.locator("body").innerText();
  const homeOk =
    /jinghua\.yu/.test(homeText) && /登出/.test(homeText) && /探索 AiluxAgent/.test(homeText);
  await snap("home");
  log("A1", "首页登录态与入口", homeOk, page.url());

  // —— 2. 进入 Agent ——
  await page.goto(`${origin}/agent`, { waitUntil: "domcontentloaded", timeout: 60_000 });
  let app;
  try {
    app = await waitApp();
    await snap("agent-shell");
    log("A2", "进入 Agent 工作台", true, page.url());
  } catch (e) {
    await snap("agent-fail");
    log("A2", "进入 Agent 工作台", false, String(e.message || e));
    throw e;
  }

  // —— 3. 侧栏关键元素 ——
  {
    const t = await bodyText(app);
    const checks = [
      ["新任务", /新任务/],
      ["已登录", /已登录/],
      ["全局资源", /全局资源/],
      ["任务列表", /近七天|更早|今天/],
    ];
    for (const [name, re] of checks) {
      log(`A3-${name}`, `侧栏可见: ${name}`, re.test(t));
    }
  }

  // —— 4. 新任务页 ——
  {
    const okClick = await clickBtn(app, "新任务");
    await page.waitForTimeout(1500);
    const t = await bodyText(app);
    const hasComposer = await app.evaluate(() => !!document.querySelector("textarea"));
    const hasRecommend = /推荐任务|描述你的目标/.test(t);
    await snap("new-task");
    log("A4", "新任务页（输入区/推荐）", okClick && hasComposer, `recommend=${hasRecommend}`);
  }

  // —— 5. 打开已有任务（侧栏近期；Tab 只在有会话时出现）——
  {
    const opened = await app.evaluate(() => {
      const candidates = [...document.querySelectorAll("button, div, span, a")].filter((el) => {
        const t = (el.innerText || "").replace(/\s+/g, " ").trim();
        if (!t || t.length > 40) return false;
        if (/新任务|全局资源|已登录|近七天|更早|今天|搜索|项目|发送|计划|结果|报告/.test(t))
          return false;
        if (/稳定性|预测|Structure|双抗|能力|流程|未命名|搭建|Build|平台|概述/.test(t)) return true;
        return false;
      });
      const el = candidates[0];
      if (!el) return "";
      el.click();
      return (el.innerText || "").trim().slice(0, 60);
    });
    await page.waitForTimeout(2500);
    await snap("open-existing-task");
    const t = await bodyText(app);
    const hasChat = /发送|继续向 Agent|计划|结果|描述你的目标/.test(t);
    log("A5", "打开侧栏已有任务", !!opened && hasChat, opened || "未找到可点任务");
  }

  // —— 6. 追问框 / 全局资源 / 搜索 ——
  {
    const ph = await app.evaluate(() => {
      const ta = document.querySelector("textarea");
      return ta ? ta.getAttribute("placeholder") || "(no ph)" : "";
    });
    log("A6", "会话输入框", !!ph, ph || "无 textarea");
  }

  {
    const clicked = await clickBtn(app, "全局资源");
    await page.waitForTimeout(1500);
    await snap("global-resources");
    const t = await bodyText(app);
    const panel = /数据|Skill|模版|模板|资源|上传|文件|全局资源/.test(t);
    log("A7", "打开全局资源", clicked && panel, clicked ? "opened" : "click failed");
    await page.keyboard.press("Escape").catch(() => {});
    await page.waitForTimeout(500);
  }

  {
    const filled = await app.evaluate(() => {
      const input = document.querySelector('input[placeholder*="搜索"]');
      if (!input) return false;
      input.focus();
      const desc = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, "value");
      desc?.set?.call(input, "稳定性");
      input.dispatchEvent(new Event("input", { bubbles: true }));
      return true;
    });
    await page.waitForTimeout(1000);
    await snap("search-tasks");
    log("A8", "侧栏搜索任务", filled, filled ? "已输入关键词" : "无搜索框");
    await app.evaluate(() => {
      const input = document.querySelector('input[placeholder*="搜索"]');
      if (!input) return;
      const desc = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, "value");
      desc?.set?.call(input, "");
      input.dispatchEvent(new Event("input", { bubbles: true }));
    });
  }

  // —— 9. 短问答（回复后才会出现 计划/结果/报告）——
  {
    await clickBtn(app, "新任务");
    await page.waitForTimeout(1200);
    const q = "请用一句话介绍你自己。";
    await app.evaluate((v) => {
      const ta = document.querySelector("textarea");
      if (!ta) throw new Error("no textarea");
      ta.focus();
      const desc = Object.getOwnPropertyDescriptor(window.HTMLTextAreaElement.prototype, "value");
      desc?.set?.call(ta, v);
      ta.dispatchEvent(new Event("input", { bubbles: true }));
    }, q);
    await clickBtn(app, "^发送$");
    await snap("short-ask-sent");

    let ok = false;
    let after = "";
    const t0 = Date.now();
    let sawThinking = false;
    while (Date.now() - t0 < 120_000) {
      const text = await bodyText(app);
      const i = text.indexOf(q);
      after = i >= 0 ? text.slice(i + q.length) : "";
      if (/思考中|生成中/.test(after)) sawThinking = true;
      if (sawThinking && !/思考中|生成中/.test(after) && after.length > 40) {
        await page.waitForTimeout(4000);
        after = (await bodyText(app)).slice(i + q.length);
        ok = after.length > 40;
        break;
      }
      await page.waitForTimeout(2000);
    }
    await snap("short-ask-reply");
    fs.writeFileSync(
      path.join(outDir, "short-ask-reply.txt"),
      `Q: ${q}\n\n${after.slice(0, 2000)}\n`,
      "utf-8",
    );
    log("A9", "短问答（一句话介绍）", ok, ok ? after.replace(/\s+/g, " ").slice(0, 120) : "超时或无回复");
  }

  // —— 10. 右侧 Tab（会话产生后）——
  for (const tab of ["计划", "结果", "报告"]) {
    const clicked = await clickBtn(app, `^${tab}$`);
    await page.waitForTimeout(1200);
    await snap(`tab-${tab}`);
    log(`A10-${tab}`, `切换 Tab「${tab}」`, clicked, clicked ? "ok" : "按钮未找到");
  }
  for (const tab of ["历史计划", "流程图"]) {
    const clicked = await clickBtn(app, `^${tab}$`);
    if (!clicked) {
      log(`A10-${tab}`, `切换「${tab}」`, true, "当前无此 Tab，跳过");
      continue;
    }
    await page.waitForTimeout(800);
    await snap(`tab-${tab}`);
    log(`A10-${tab}`, `切换「${tab}」`, true);
  }

  // —— 11. 用户身份 ——
  {
    const t = await bodyText(app);
    log("A11", "用户身份展示", /jinghua\.yu/.test(t) && /管理员|已登录/.test(t));
  }

  await context.storageState({ path: auth });
} catch (e) {
  console.error(e);
  await snap("fatal");
  log("FATAL", "走查中断", false, String(e.message || e));
}

const passed = results.filter((r) => r.ok).length;
const failed = results.filter((r) => !r.ok).length;
const summary = { passed, failed, total: results.length, results, at: new Date().toISOString() };
fs.writeFileSync(path.join(outDir, "summary.json"), JSON.stringify(summary, null, 2), "utf-8");
fs.writeFileSync(
  path.join(outDir, "summary.md"),
  [
    `# 远程走查结果`,
    ``,
    `- 通过: ${passed}/${results.length}`,
    `- 失败: ${failed}`,
    `- 时间: ${summary.at}`,
    ``,
    ...results.map((r) => `- ${r.ok ? "✅" : "❌"} **${r.id}** ${r.name}${r.detail ? ` — ${r.detail}` : ""}`),
    ``,
  ].join("\n"),
  "utf-8",
);

console.log("\n========");
console.log(`走查完成: ${passed}/${results.length} 通过, ${failed} 失败`);
console.log(`报告: ${path.join(outDir, "summary.md")}`);
console.log("窗口保持 10s…");
await page.waitForTimeout(10_000);
await browser.close();
process.exit(failed > 0 ? 2 : 0);
