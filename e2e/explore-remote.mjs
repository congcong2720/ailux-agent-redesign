import { chromium } from "@playwright/test";
import fs from "node:fs";
import path from "node:path";

const url =
  process.env.TARGET_URL ||
  "https://test-agent.ailuxbio.com/agent?ailux=%7Bapp%7D%2Fconversation%2F0db49341-6d62-4dc1-8f62-feb1e8e83b7b";
const outDir = path.resolve("test-results", "remote-explore");
fs.mkdirSync(outDir, { recursive: true });

const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({
  locale: "zh-CN",
  viewport: { width: 1440, height: 960 },
  storageState: process.env.STORAGE_STATE || undefined,
});
const page = await context.newPage();

const consoleErrors = [];
page.on("console", (msg) => {
  if (msg.type() === "error") consoleErrors.push(msg.text());
});

const result = {
  url,
  finalUrl: "",
  title: "",
  hasLoginHint: false,
  visibleTexts: [],
  buttons: [],
  inputs: 0,
  textareas: 0,
  consoleErrors: [],
  ok: false,
  note: "",
};

try {
  const resp = await page.goto(url, { waitUntil: "domcontentloaded", timeout: 60_000 });
  await page.waitForTimeout(4000);
  result.finalUrl = page.url();
  result.title = await page.title();
  result.status = resp?.status() ?? null;

  const bodyText = (await page.locator("body").innerText().catch(() => "")) || "";
  result.hasLoginHint = /登录|login|sign in|sso|飞书|oauth|unauthorized|未授权|请先/i.test(bodyText);

  const texts = await page.locator("h1,h2,h3,button,a,[role='button'],textarea,input").evaluateAll((els) =>
    els
      .slice(0, 80)
      .map((el) => ({
        tag: el.tagName.toLowerCase(),
        text: (el.innerText || el.getAttribute("placeholder") || el.getAttribute("aria-label") || "").trim().slice(0, 80),
      }))
      .filter((x) => x.text),
  );
  result.visibleTexts = texts.filter((t) => ["h1", "h2", "h3"].includes(t.tag)).slice(0, 20);
  result.buttons = texts.filter((t) => ["button", "a"].includes(t.tag) || t.tag === "button").slice(0, 30);
  // also capture role=button via text list
  result.buttons = texts
    .filter((t) => t.tag === "button" || t.tag === "a")
    .slice(0, 40);
  result.inputs = await page.locator("input:visible").count();
  result.textareas = await page.locator("textarea:visible").count();
  result.consoleErrors = consoleErrors.slice(0, 10);

  await page.screenshot({ path: path.join(outDir, "page.png"), fullPage: true });

  // light smoke: if composer exists, type a harmless probe (do NOT send unless clearly a demo)
  const composer = page.locator("textarea:visible").first();
  if ((await composer.count()) > 0) {
    result.note = "检测到输入框，仅做可见性检查，未自动发送消息，避免污染会话。";
    result.ok = !result.hasLoginHint;
  } else if (result.hasLoginHint) {
    result.note = "疑似未登录或跳到登录页；Playwright 独立浏览器不会继承你本机 Chrome 登录态。";
    result.ok = false;
  } else {
    result.note = "页面已打开，但未识别到对话输入框；可能仍在加载或需要额外权限。";
    result.ok = Boolean(result.title);
  }
} catch (err) {
  result.note = String(err);
  await page.screenshot({ path: path.join(outDir, "error.png"), fullPage: true }).catch(() => {});
} finally {
  fs.writeFileSync(path.join(outDir, "result.json"), JSON.stringify(result, null, 2), "utf-8");
  await browser.close();
}

console.log(JSON.stringify(result, null, 2));
