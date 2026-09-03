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

page.on("console", (msg) => {
  if (/error|fail|cors|auth/i.test(msg.text())) console.log("console:", msg.type(), msg.text().slice(0, 200));
});
page.on("pageerror", (err) => console.log("pageerror:", err.message.slice(0, 200)));
page.on("response", (res) => {
  const u = res.url();
  if (/api|agent|conversation|auth|me/i.test(u) && res.status() >= 400) {
    console.log("bad resp", res.status(), u.slice(0, 160));
  }
});

await page.goto("https://test-agent.ailuxbio.com/home", { waitUntil: "networkidle", timeout: 60_000 });
await page.waitForTimeout(1500);

// CTA
const cta = page.getByRole("link", { name: /探索 AiluxAgent/i }).or(page.getByRole("button", { name: /探索 AiluxAgent/i }));
if (await cta.count()) {
  await cta.first().click();
  await page.waitForTimeout(2000);
}

await page.goto("https://test-agent.ailuxbio.com/agent", { waitUntil: "domcontentloaded", timeout: 60_000 });

for (const wait of [3000, 8000, 15000]) {
  await page.waitForTimeout(wait === 3000 ? 3000 : wait - 3000);
  const frames = page.frames().map((f) => f.url());
  const htmlLen = (await page.content()).length;
  const iframes = await page.locator("iframe").count();
  const textareas = await page.locator("textarea").count();
  const allTextareas = await page.locator("textarea").count();
  let frameInputs = [];
  for (const f of page.frames()) {
    const n = await f.locator("textarea, input, [contenteditable='true']").count().catch(() => 0);
    if (n) frameInputs.push({ url: f.url().slice(0, 120), n });
  }
  console.log(`t=${wait}ms url=${page.url()} htmlLen=${htmlLen} iframes=${iframes} textareas=${allTextareas}`);
  console.log("frames:", frames);
  console.log("frameInputs:", frameInputs);
  await page.screenshot({ path: path.join(outDir, `agent-t${wait}.png`), fullPage: true });
}

// try clicking 探索 via direct navigation with ailux param from earlier conversation
const known =
  "https://test-agent.ailuxbio.com/agent?ailux=%7Bapp%7D%2Fconversation%2F0db49341-6d62-4dc1-8f62-feb1e8e83b7b";
await page.goto(known, { waitUntil: "domcontentloaded", timeout: 60_000 });
await page.waitForTimeout(12000);
const frames2 = page.frames().map((f) => f.url());
let frameInputs2 = [];
for (const f of page.frames()) {
  const texts = await f
    .locator("textarea, input, [contenteditable='true'], button")
    .evaluateAll((els) =>
      els.slice(0, 40).map((el) => ({
        tag: el.tagName,
        ph: el.getAttribute("placeholder") || "",
        text: (el.innerText || "").slice(0, 40),
        aria: el.getAttribute("aria-label") || "",
      })),
    )
    .catch(() => []);
  if (texts.length) frameInputs2.push({ url: f.url().slice(0, 140), texts });
}
console.log("known conversation url:", page.url());
console.log("frames:", frames2);
console.log("frameInputs2:", JSON.stringify(frameInputs2, null, 2).slice(0, 4000));
await page.screenshot({ path: path.join(outDir, "agent-known.png"), fullPage: true });
fs.writeFileSync(
  path.join(outDir, "agent-known.json"),
  JSON.stringify({ url: page.url(), frames: frames2, frameInputs2 }, null, 2),
);

await browser.close();
