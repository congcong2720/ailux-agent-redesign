import { chromium } from "@playwright/test";

const browser = await chromium.launch({ headless: true, channel: "chrome" }).catch(() =>
  chromium.launch({ headless: true }),
);
const page = await (await browser.newContext({ locale: "zh-CN" })).newPage();

/** @type {any[]} */
const captured = [];
page.on("request", async (req) => {
  if (!/oauth2\/authorize/i.test(req.url())) return;
  captured.push({
    url: req.url(),
    method: req.method(),
    headers: req.headers(),
    postData: req.postData(),
  });
});
page.on("response", async (res) => {
  if (!/oauth2\/authorize|oauth2\/login|auth\/me/i.test(res.url())) return;
  captured.push({
    type: "response",
    url: res.url(),
    status: res.status(),
    body: (await res.text().catch(() => "")).slice(0, 500),
  });
});

await page.goto("https://test-agent.ailuxbio.com/login", { waitUntil: "networkidle" });
await page.getByPlaceholder("请输入邮箱").fill("demo.user@xtalpi.com");
await page.getByPlaceholder("请输入密码").fill("WrongPass123!");
await page.getByRole("button", { name: "登录", exact: true }).click();
await page.waitForTimeout(3000);

// Also inspect network for any follow-up if somehow different
console.log(JSON.stringify({ url: page.url(), captured }, null, 2));
await browser.close();
