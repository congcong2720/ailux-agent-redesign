import { expect, test, type Frame, type Page } from "@playwright/test";
import fs from "node:fs";
import path from "node:path";

const AUTH = path.resolve("e2e/.auth/user.json");
const REMOTE = "https://test-agent.ailuxbio.com";
const AGENT_URL = `${REMOTE}/agent`;
const OUT = path.resolve("test-results", "remote-agent-smoke");

test.use({
  storageState: AUTH,
  baseURL: REMOTE,
  channel: "chrome",
});

function requireAuth() {
  test.skip(!fs.existsSync(AUTH), "缺少 e2e/.auth/user.json，请先 pnpm test:e2e:auth:token");
}

function findAppFrame(page: Page): Frame | undefined {
  return page.frames().find((f) => /ailux-agent-app/i.test(f.url()));
}

async function waitAppFrame(page: Page, timeoutMs = 90_000): Promise<Frame> {
  const started = Date.now();
  while (Date.now() - started < timeoutMs) {
    const frame = findAppFrame(page);
    if (frame) {
      const ready = await frame
        .evaluate(() => {
          const text = document.body?.innerText || "";
          return /新任务/.test(text) || document.querySelectorAll("textarea").length > 0;
        })
        .catch(() => false);
      if (ready) return frame;
    }
    await page.waitForTimeout(400);
  }
  throw new Error(`Agent iframe 未就绪。frames=${JSON.stringify(page.frames().map((f) => f.url()))}`);
}

async function clickButtonByText(frame: Frame, pattern: string) {
  const ok = await frame.evaluate((p) => {
    const rx = new RegExp(p);
    const btn = [...document.querySelectorAll("button")].find((b) => rx.test(b.innerText || ""));
    if (!btn) return false;
    btn.click();
    return true;
  }, pattern);
  expect(ok, `应找到按钮 ${pattern}`).toBeTruthy();
}

async function fillTextarea(frame: Frame, value: string) {
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

async function openAgent(page: Page) {
  await page.goto(AGENT_URL, { waitUntil: "domcontentloaded", timeout: 60_000 });
  return waitAppFrame(page);
}

test.describe("远程 AiluxAgent 冒烟（需登录态）", () => {
  test.beforeAll(() => {
    fs.mkdirSync(OUT, { recursive: true });
  });

  test("首页已登录且可见入口", async ({ page }) => {
    requireAuth();
    await page.goto(`${REMOTE}/home`, { waitUntil: "domcontentloaded" });
    await expect(page.getByText("jinghua.yu").first()).toBeVisible({ timeout: 30_000 });
    await expect(page.getByText("登出")).toBeVisible();
    await expect(page.getByText("探索 AiluxAgent")).toBeVisible();
    await page.screenshot({ path: path.join(OUT, "01-home.png"), fullPage: true });
  });

  test("进入 Agent 工作台", async ({ page }) => {
    requireAuth();
    const app = await openAgent(page);
    const text = await app.evaluate(() => document.body?.innerText || "");
    expect(text).toMatch(/新任务|已登录/);
    await page.screenshot({ path: path.join(OUT, "02-agent.png"), fullPage: true });
  });

  test("向 Agent 提问：你有什么能力", async ({ page }) => {
    requireAuth();
    test.setTimeout(240_000);

    const app = await openAgent(page);
    await clickButtonByText(app, "新任务");
    await page.waitForTimeout(1500);

    {
      const started = Date.now();
      while (Date.now() - started < 30_000) {
        const n = await app.evaluate(() => document.querySelectorAll("textarea").length);
        if (n > 0) break;
        await page.waitForTimeout(400);
      }
    }

    const question = "请用中文简要说明你有哪些核心能力？列出 5 条即可。";
    await fillTextarea(app, question);
    await clickButtonByText(app, "^发送$");

    const started = Date.now();
    let bodyText = "";
    let sawThinking = false;
    while (Date.now() - started < 180_000) {
      bodyText = await app.evaluate(() => document.body?.innerText || "");
      const idx = bodyText.indexOf(question);
      const afterQ = idx >= 0 ? bodyText.slice(idx + question.length) : "";
      const thinking = /思考中|生成中|正在/.test(afterQ);
      if (thinking) sawThinking = true;
      if (
        sawThinking &&
        !thinking &&
        afterQ.length > 80 &&
        /能力|抗体|结构|序列|预测|工具|工作流|可以帮|支持|靶点|分析|Skill/.test(afterQ)
      ) {
        await page.waitForTimeout(8000);
        bodyText = await app.evaluate(() => document.body?.innerText || "");
        break;
      }
      await page.waitForTimeout(2000);
    }

    fs.writeFileSync(
      path.join(OUT, "04-capability-reply.txt"),
      `Q: ${question}\n\n--- page text ---\n${bodyText.slice(0, 8000)}\n`,
      "utf-8",
    );
    await page.screenshot({ path: path.join(OUT, "04-capability-reply.png"), fullPage: true });

    const idx = bodyText.indexOf(question);
    const afterQ = idx >= 0 ? bodyText.slice(idx + question.length) : "";
    expect(idx).toBeGreaterThanOrEqual(0);
    expect(afterQ).not.toMatch(/思考中/);
    expect(afterQ.length).toBeGreaterThan(80);
    expect(afterQ).toMatch(/能力|抗体|结构|序列|预测|工具|工作流|Skill/);
  });
});

