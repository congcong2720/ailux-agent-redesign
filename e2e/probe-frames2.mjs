import { chromium } from "@playwright/test";
import fs from "node:fs";
import path from "node:path";

const auth = path.resolve("e2e/.auth/user.json");
const outDir = path.resolve("test-results", "remote-probe");
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
await page.goto(
  "https://test-agent.ailuxbio.com/agent?ailux=%7Bapp%7D%2Fconversation%2F0db49341-6d62-4dc1-8f62-feb1e8e83b7b",
  { waitUntil: "domcontentloaded", timeout: 60_000 },
);
await page.waitForTimeout(10000);

const iframeAttrs = await page.locator("iframe").evaluateAll((els) =>
  els.map((el) => ({
    src: el.getAttribute("src"),
    id: el.id,
    name: el.name,
    cls: el.className,
  })),
);
console.log("iframeAttrs", iframeAttrs);

for (const [i, frame] of page.frames().entries()) {
  const info = await frame
    .evaluate(() => {
      const text = (document.body?.innerText || "").slice(0, 500);
      const htmlLen = document.documentElement?.outerHTML?.length || 0;
      const btns = [...document.querySelectorAll("button")]
        .map((b) => (b.innerText || "").trim().slice(0, 40))
        .filter(Boolean)
        .slice(0, 20);
      const inputs = [...document.querySelectorAll("textarea, input, [contenteditable='true']")].map(
        (el) => ({
          tag: el.tagName,
          ph: el.getAttribute("placeholder") || "",
          aria: el.getAttribute("aria-label") || "",
        }),
      );
      return { htmlLen, text, btns, inputs };
    })
    .catch((e) => ({ error: e.message }));
  console.log(`\nFRAME[${i}] ${frame.url()}`);
  console.log(JSON.stringify(info, null, 2));
}

// Try interacting via Frame object directly
const appFrame =
  page.frames().find((f) => /ailux-agent-app/i.test(f.url())) || page.mainFrame();
console.log("\nusing frame", appFrame.url());

const newTask = appFrame.getByRole("button", { name: "新任务" });
console.log("新任务 count", await newTask.count());
if (await newTask.count()) {
  await newTask.click();
  await page.waitForTimeout(3000);
  const after = await appFrame.evaluate(() => ({
    url: location.href,
    inputs: [...document.querySelectorAll("textarea, input, [contenteditable='true']")].map((el) => ({
      tag: el.tagName,
      ph: el.getAttribute("placeholder") || "",
    })),
    text: (document.body?.innerText || "").slice(0, 800),
  }));
  console.log("after new task", JSON.stringify(after, null, 2));
  await page.screenshot({ path: path.join(outDir, "after-new-task.png"), fullPage: true });
}

await browser.close();
