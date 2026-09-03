/**
 * 探查远程已登录页面的可交互元素，结果写入 test-results/remote-probe/
 */
import { chromium } from "@playwright/test";
import fs from "node:fs";
import path from "node:path";

const auth = path.resolve("e2e/.auth/user.json");
const outDir = path.resolve("test-results", "remote-probe");
const startUrl = process.env.TARGET_URL || "https://test-agent.ailuxbio.com/home";

if (!fs.existsSync(auth)) {
  console.error("缺少 e2e/.auth/user.json");
  process.exit(1);
}
fs.mkdirSync(outDir, { recursive: true });

const browser = await chromium.launch({ headless: true, channel: "chrome" }).catch(() =>
  chromium.launch({ headless: true }),
);
const context = await browser.newContext({
  storageState: auth,
  locale: "zh-CN",
  viewport: { width: 1440, height: 960 },
});
const page = await context.newPage();
await page.goto(startUrl, { waitUntil: "domcontentloaded", timeout: 60_000 });
await page.waitForTimeout(4000);

const dump = async (label) => {
  const info = await page.evaluate(() => {
    const textOf = (el) => (el.innerText || el.textContent || "").trim().slice(0, 80);
    const buttons = [...document.querySelectorAll("button, [role='button'], a")]
      .filter((el) => el.offsetParent !== null)
      .slice(0, 80)
      .map((el) => ({
        tag: el.tagName,
        text: textOf(el),
        aria: el.getAttribute("aria-label") || "",
        href: el.getAttribute("href") || "",
      }))
      .filter((b) => b.text || b.aria);
    const inputs = [...document.querySelectorAll("textarea, input, [contenteditable='true']")]
      .filter((el) => el.offsetParent !== null)
      .map((el) => ({
        tag: el.tagName,
        type: el.getAttribute("type") || "",
        placeholder: el.getAttribute("placeholder") || "",
        aria: el.getAttribute("aria-label") || "",
        name: el.getAttribute("name") || "",
      }));
    return {
      url: location.href,
      title: document.title,
      bodySnippet: (document.body?.innerText || "").slice(0, 2500),
      buttons,
      inputs,
    };
  });
  await page.screenshot({ path: path.join(outDir, `${label}.png`), fullPage: true });
  fs.writeFileSync(path.join(outDir, `${label}.json`), JSON.stringify(info, null, 2), "utf-8");
  console.log(`\n## ${label}`);
  console.log("url:", info.url);
  console.log("inputs:", JSON.stringify(info.inputs, null, 2));
  console.log(
    "buttons:",
    info.buttons
      .slice(0, 40)
      .map((b) => b.text || b.aria)
      .join(" | "),
  );
  console.log("body:", info.bodySnippet.slice(0, 800));
  return info;
};

const home = await dump("01-home");

// 尝试点击看起来像 Agent / 对话 / 新任务 的入口
const clickCandidates = [
  /AiluxAgent|Agent|对话|新任务|新建|开始|进入|打开/i,
  /Xagent|Protein/i,
];
for (const re of clickCandidates) {
  const btn = page
    .locator("button, [role='button'], a")
    .filter({ hasText: re })
    .first();
  if (await btn.count()) {
    const t = (await btn.innerText().catch(() => "")) || "";
    console.log("click:", t.slice(0, 60));
    await btn.click({ timeout: 5000 }).catch((e) => console.log("click fail", e.message));
    await page.waitForTimeout(3000);
    await dump("02-after-click");
    break;
  }
}

// 若已有 textarea，尝试进 agent 路径
if (/\/agent/i.test(page.url()) === false) {
  await page.goto("https://test-agent.ailuxbio.com/agent", {
    waitUntil: "domcontentloaded",
    timeout: 60_000,
  });
  await page.waitForTimeout(4000);
  await dump("03-agent");
}

await browser.close();
console.log("\nprobe done ->", outDir);
