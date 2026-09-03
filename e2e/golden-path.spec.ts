import { expect, test, type Page } from "@playwright/test";

/** 右侧 Plan/Results/Reports/Monitor 精确 Tab，避免命中「查看已有结果」等按钮 */
const sideTab = (page: Page, name: "计划" | "结果" | "报告" | "监控") =>
  page.getByRole("button", { name, exact: true });

async function openUserMenu(page: Page) {
  // 展开侧栏用户入口展示 Chen Lab，无 aria-label
  await page.getByText("Chen Lab").click();
}

test.describe("Ailux Agent 原型黄金路径", () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      window.localStorage.setItem("ailux-agent-lang", "zh");
    });
    await page.goto("/");
    await expect(page.getByText("推荐任务")).toBeVisible();
  });

  test("L0: 新任务页可见推荐任务与发送区", async ({ page }) => {
    await expect(page.getByRole("button", { name: "新任务" })).toBeVisible();
    await expect(page.getByText("给我一条 DLL3 双抗功能预测的固定分析流程").first()).toBeVisible();
    await expect(page.getByRole("button", { name: "发送" })).toBeDisabled();
  });

  test("L0: 选择推荐任务并发送后进入 Plan/Results/Reports/Monitor", async ({ page }) => {
    await page.getByText("给我一条 DLL3 双抗功能预测的固定分析流程").first().click();
    await expect(page.locator("textarea")).toHaveValue(/DLL3 双抗功能预测/);

    await page.getByRole("button", { name: "发送" }).click();

    await expect(sideTab(page, "计划")).toBeVisible();
    await expect(sideTab(page, "结果")).toBeVisible();
    await expect(sideTab(page, "报告")).toBeVisible();
    await expect(sideTab(page, "监控")).toBeVisible();

    await sideTab(page, "结果").click();
    await sideTab(page, "报告").click();
    await sideTab(page, "监控").click();
    await sideTab(page, "计划").click();
    await expect(page.getByText("整体进度")).toBeVisible();
  });

  test("T2: 新任务区可展开偏好，并提示项目偏好覆盖", async ({ page }) => {
    await page.getByRole("button", { name: "偏好" }).click();
    await expect(page.getByText(/项目偏好会覆盖冲突的通用偏好/)).toBeVisible();
    await expect(page.getByText("Agent 偏好").first()).toBeVisible();
  });

  test("T2/T3: 用户菜单可进入 Agent 偏好与我的资源", async ({ page }) => {
    await openUserMenu(page);
    await page.getByRole("button", { name: "Agent 偏好" }).click();
    await expect(page.getByText(/通用偏好|项目偏好|Agent 偏好/).first()).toBeVisible();

    await openUserMenu(page);
    await page.getByRole("button", { name: "我的资源" }).click();
    await expect(page.getByRole("button", { name: "模版" }).or(page.getByText("模版")).first()).toBeVisible();
  });

  test("S3/T4: dll3 演示跑通后可看到结果评分入口", async ({ page }) => {
    await page
      .getByText("使用 xtalfold3-fast 和 canonical PDB 模式预测已上传抗体 MSA 文件的 3D 结构")
      .first()
      .click();
    await page.getByRole("button", { name: "发送" }).click();

    await expect(sideTab(page, "报告")).toBeVisible();

    // mock 步骤推进完成后，对话区会出现最终汇总 + 结果评分
    const rating = page.getByText("结果评分").first();
    await expect(rating).toBeVisible({ timeout: 45_000 });

    const ratingHost = page.locator("article").filter({ hasText: "结果评分" }).first();
    const meta = ratingHost.getByTestId("rating-meta");
    await expect(meta).toBeHidden();
    await ratingHost.hover();
    await expect(meta).toBeVisible();
    await expect(meta).toHaveText(/用时/);

    await page.getByRole("button", { name: "不满意", exact: true }).click();
    await expect(page.getByPlaceholder("哪里还可以改进？")).toBeVisible();
    await expect(page.getByRole("button", { name: "目标理解不准确" })).toBeVisible();
    await expect(page.getByRole("button", { name: "目标理解准确" })).toHaveCount(0);

    await page.getByRole("button", { name: "非常满意", exact: true }).click();
    await expect(page.getByPlaceholder("你觉得什么让你满意？")).toBeVisible();
    await expect(page.getByRole("button", { name: "目标理解准确" })).toBeVisible();
    await expect(page.getByRole("button", { name: "目标理解不准确" })).toHaveCount(0);
    await expect(page.getByRole("button", { name: "提交" })).toBeVisible();
    await expect(page.getByRole("button", { name: "关闭" })).toBeVisible();
  });

  test("第四条推荐任务：对话回答下可评价，悬停可见用时", async ({ page }) => {
    await page.getByText("现在 agent 可以正常使用吗？为什么会出现 LLM quota insufficient？").click();
    await page.getByRole("button", { name: "发送" }).click();

    await expect(page.getByText("可以正常使用。")).toBeVisible();
    await expect(page.getByText("常见原因可能是：")).toBeVisible();
    await expect(sideTab(page, "计划")).toBeVisible();
    await expect(page.getByText("暂无计划")).toBeVisible();
    await sideTab(page, "结果").click();
    await expect(page.getByText("暂无结果")).toBeVisible();
    await sideTab(page, "报告").click();
    await expect(page.getByText("暂无报告")).toBeVisible();
    await sideTab(page, "监控").click();
    await expect(page.getByText("暂无监控")).toBeVisible();
    await sideTab(page, "计划").click();

    const ratings = page.getByText("结果评分");
    await expect(ratings).toHaveCount(5);

    const secondReply = page.locator("div").filter({ hasText: "常见原因可能是：" }).filter({ hasText: "结果评分" }).last();
    const meta = secondReply.getByTestId("rating-meta");
    await expect(meta).toBeHidden();
    await secondReply.hover();
    await expect(meta).toBeVisible();
    await expect(meta).toHaveText(/用时 18秒/);

    await secondReply.getByRole("button", { name: "非常满意", exact: true }).click();
    await expect(page.getByPlaceholder("你觉得什么让你满意？")).toBeVisible();
    await expect(page.getByRole("button", { name: "回答准确" })).toBeVisible();
    await expect(page.getByRole("button", { name: "目标理解准确" })).toHaveCount(0);

    await page.getByTestId("jump-bar-5").click();
    await expect(page.getByText("用户中心 → 用量")).toBeVisible();
  });

  test("第五条推荐任务：先理解再执行，完成后可评分", async ({ page }) => {
    await page.getByText("换一个不依赖外部平台的 Skill，帮我做 7K3L 蛋白结构可视化").click();
    await page.getByRole("button", { name: "发送" }).click();

    await expect(page.getByText(/不依赖外部平台或 API Key/)).toBeVisible({ timeout: 10_000 });
    await expect(page.getByText(/执行中|已执行/)).toBeVisible({ timeout: 15_000 });
    await expect(page.getByText("约束：不使用需外部凭证的 Skill")).toBeVisible({ timeout: 15_000 });
    await expect(page.getByText("已读取技能 bio-structure-viz")).toBeVisible({ timeout: 15_000 });
    await expect(page.getByText(/bio-structure-viz 做一次完整的 7K3L/)).toBeVisible({ timeout: 20_000 });
    await expect(page.getByText("结果评分").first()).toBeVisible({ timeout: 20_000 });
    await expect(page.getByRole("button", { name: "计划", exact: true })).toHaveCount(0);

    await expect(page.getByText("结合口袋再标注一下配体，并解释为什么选这个视角")).toBeVisible({ timeout: 10_000 });
    await expect(page.getByText(/收到。我会在现有 7K3L 视图上标出配体/)).toBeVisible({ timeout: 10_000 });
    await expect(page.getByText("核对口袋残基与配体条目")).toBeVisible({ timeout: 10_000 });
    await expect(page.getByRole("button", { name: "全部展示" })).toBeVisible({ timeout: 15_000 });
    await expect(page.getByText("核对口袋残基与配体条目")).toHaveCount(0);
    await page.getByRole("button", { name: "全部展示" }).click();
    await expect(page.getByText("核对口袋残基与配体条目")).toBeVisible();
    await expect(page.getByText(/选这个视角是因为它沿口袋开口看进去/)).toBeVisible({ timeout: 20_000 });
    await expect(page.getByText("结果评分")).toHaveCount(2, { timeout: 20_000 });
  });
});
