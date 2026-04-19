/*
Design reminder for this file:
- Build the product around three core screens: new task, running workspace, final results
- Preserve the Ailux blue system and restrained product feel from the UI specification
- Keep the shell stable: left task rail + center primary workspace + right plan/result side panel
- Prioritize clarity, traceability, and result consumption over decorative storytelling
*/
import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  ArrowUpRight,
  BarChart3,
  Bot,
  CheckCircle2,
  ChevronRight,
  CircleDashed,
  Clock3,
  Database,
  FileCode2,
  FileJson,
  FileSpreadsheet,
  FileText,
  FolderOpen,
  FlaskConical,
  PanelRightOpen,
  Play,
  Plus,
  Search,
  SendHorizonal,
  Share2,
  Sparkles,
  Upload,
  UserCircle2,
  WandSparkles,
} from "lucide-react";

type ViewMode = "new" | "running" | "result";
type SideTab = "plan" | "results";
type StepStatus = "done" | "running" | "waiting" | "failed";
type ResultType = "csv" | "json" | "png" | "xlsx";

type PlanStep = {
  id: string;
  title: string;
  detail: string;
  duration: string;
  status: StepStatus;
  summary: string;
};

type ResultFile = {
  id: string;
  name: string;
  meta: string;
  step: string;
  type: ResultType;
};

type PreviewTab = {
  id: string;
  label: string;
  active?: boolean;
};

const screenMeta: Record<
  ViewMode,
  { eyebrow: string; title: string; subtitle: string; primaryAction: string; secondaryAction?: string }
> = {
  new: {
    eyebrow: "New Task",
    title: "新任务",
    subtitle: "从自然语言描述、文件上传和推荐模板开始发起新的分析任务。",
    primaryAction: "开始任务",
  },
  running: {
    eyebrow: "Task Running",
    title: "双抗内化功能预测模型",
    subtitle: "对话、执行步骤与右侧计划信息实时联动，帮助用户理解当前进展。",
    primaryAction: "查看结果",
    secondaryAction: "继续追问",
  },
  result: {
    eyebrow: "Result Review",
    title: "结果总览",
    subtitle: "聚焦最终结论、关键文件预览与可解释结果，方便科研用户做复核与导出。",
    primaryAction: "导出报告",
    secondaryAction: "再次运行",
  },
};

const historyTasks = [
  { id: "draft", title: "新对话", meta: "创建任务", isDraft: true },
  { id: "t1", title: "双抗内化功能预测模型", meta: "当前任务" },
  { id: "t2", title: "内化特征关联分析", meta: "3 分钟前" },
  { id: "t3", title: "EGFR 抗体优化", meta: "昨天 18:20" },
  { id: "t4", title: "CDR 区域内化影响评估", meta: "04-12 14:32" },
];

const recommendedPrompts = [
  "上传实验数据，挖掘双表位双抗内化相关特征",
  "给我一条 DLL3 双抗功能预测的固定分析流程，并说明每步输出",
  "输入 PDB 与 CSV 后，帮我生成结构、特征和结果解释报告",
];

const runningMessages = [
  {
    role: "user",
    content:
      "现在模拟一个流程，给你实验数据，分析双表位双抗内化功能与哪些特征有关，设计并构建一个针对双抗内化功能的预测模型。",
    time: "18:29",
  },
  {
    role: "agent",
    content:
      "好的，我将按照固定工作流完成数据生成、EDA、特征重要性分析、预测建模和生物学解释，并把中间结果沉淀到右侧 Results 中。",
    time: "18:29",
  },
  {
    role: "agent",
    content:
      "当前正在执行探索性数据分析（EDA），已确认 KD 与内化率、靶点共定位与内化率存在显著关系，下一步会进入关键特征排序。",
    time: "18:30",
  },
];

const runningSteps: PlanStep[] = [
  {
    id: "step-1",
    title: "生成模拟实验数据集",
    detail: "生成 150 条双抗分子记录，覆盖靶点生物学、结合力学和结构特征。",
    duration: "4s",
    status: "done",
    summary: "已产出结构化数据集与概览统计。",
  },
  {
    id: "step-2",
    title: "探索性数据分析（EDA）",
    detail: "分析特征分布、相关矩阵、离群点与内化率之间的关系。",
    duration: "19s",
    status: "running",
    summary: "正在写入分布图、热图与关键发现摘要。",
  },
  {
    id: "step-3",
    title: "特征重要性分析",
    detail: "使用 SHAP 与随机森林重要性识别关键预测因子。",
    duration: "32s",
    status: "waiting",
    summary: "等待上一步完成后启动。",
  },
  {
    id: "step-4",
    title: "构建预测模型",
    detail: "比较 XGBoost、Random Forest 与 SVM 的预测性能。",
    duration: "1m27s",
    status: "waiting",
    summary: "将输出模型对比表与最佳模型说明。",
  },
  {
    id: "step-5",
    title: "模型评估与可视化",
    detail: "展示 R²、RMSE、ROC 及学习曲线等关键评估结果。",
    duration: "25s",
    status: "waiting",
    summary: "输出图表文件与结构化结果摘要。",
  },
  {
    id: "step-6",
    title: "生物学解释与总结",
    detail: "汇总关键特征和设计建议，形成最终结论。",
    duration: "16s",
    status: "waiting",
    summary: "最终输出面向科研用户的解释性结论。",
  },
];

const resultFiles: ResultFile[] = [
  {
    id: "dataset",
    name: "bsab_dataset.csv",
    meta: "数据集 · 28.5 KB",
    step: "步骤 1 · 数据生成",
    type: "csv",
  },
  {
    id: "summary",
    name: "data_summary.json",
    meta: "汇总结果 · 6.1 KB",
    step: "步骤 1 · 数据生成",
    type: "json",
  },
  {
    id: "heatmap",
    name: "fig2_correlation_heatmap.png",
    meta: "热图 · 293 KB",
    step: "步骤 2 · EDA 分析",
    type: "png",
  },
  {
    id: "importance",
    name: "fig3_key_feature_scatter.png",
    meta: "散点图 · 319 KB",
    step: "步骤 3 · 特征重要性",
    type: "png",
  },
  {
    id: "comparison",
    name: "model_comparison.xlsx",
    meta: "模型对比表 · 43 KB",
    step: "步骤 4 · 预测模型",
    type: "xlsx",
  },
];

const previewTabs: PreviewTab[] = [
  { id: "overview", label: "最终评估" },
  { id: "dataset", label: "bsab_dataset.csv", active: true },
  { id: "importance", label: "fig5_rf_feature_importance" },
  { id: "scatter", label: "fig3_key_feature_scatter" },
];

const datasetPreviewRows = [
  ["BsAb_001", "8.134", "16.298", "ScFv-Fc", "mid-stalk", "membrane-proximal"],
  ["BsAb_002", "3.797", "2.976", "IgG-like", "distal", "distal"],
  ["BsAb_003", "9.750", "30.048", "IgG-like", "mid-stalk", "membrane-proximal"],
  ["BsAb_004", "27.782", "1.819", "DVD-Ig", "mid-stalk", "mid-stalk"],
  ["BsAb_005", "3.384", "13.288", "Fab-Fc", "distal", "mid-stalk"],
  ["BsAb_006", "3.384", "66.053", "Fab-Fc", "mid-stalk", "distal"],
];

const finalInsights = [
  {
    title: "关键发现 01",
    detail: "KD 与内化率呈负相关，尤其在 5nM 以下样本中表现出更稳定的高内化水平。",
  },
  {
    title: "关键发现 02",
    detail: "靶点共定位评分与内化率的解释力最高，是模型中最稳定的核心特征之一。",
  },
  {
    title: "关键发现 03",
    detail: "最佳模型为 XGBoost，综合 R² 与误差指标后优于 RF 与 SVM。",
  },
];

const statusStyles: Record<
  StepStatus,
  { badge: string; chip: string; icon: string; label: string }
> = {
  done: {
    badge: "border-[rgba(23,36,216,0.12)] bg-[rgba(23,36,216,0.08)] text-[#161FAD]",
    chip: "border-[rgba(23,36,216,0.12)] bg-[rgba(23,36,216,0.08)] text-[#161FAD]",
    icon: "border-[rgba(23,36,216,0.12)] bg-[rgba(23,36,216,0.08)] text-[#161FAD]",
    label: "完成",
  },
  running: {
    badge: "border-[rgba(255,201,151,0.45)] bg-[rgba(255,201,151,0.2)] text-[#8a5216]",
    chip: "border-[rgba(255,201,151,0.45)] bg-[rgba(255,201,151,0.2)] text-[#8a5216]",
    icon: "border-[rgba(255,201,151,0.45)] bg-[rgba(255,201,151,0.2)] text-[#8a5216]",
    label: "进行中",
  },
  waiting: {
    badge: "border-slate-200 bg-slate-100 text-slate-500",
    chip: "border-slate-200 bg-slate-100 text-slate-500",
    icon: "border-slate-200 bg-slate-100 text-slate-500",
    label: "待执行",
  },
  failed: {
    badge: "border-[rgba(220,38,38,0.16)] bg-[rgba(220,38,38,0.1)] text-red-600",
    chip: "border-[rgba(220,38,38,0.16)] bg-[rgba(220,38,38,0.1)] text-red-600",
    icon: "border-[rgba(220,38,38,0.16)] bg-[rgba(220,38,38,0.1)] text-red-600",
    label: "失败",
  },
};

function ResultTypeIcon({ type }: { type: ResultType }) {
  if (type === "csv") return <Database className="h-4 w-4" />;
  if (type === "json") return <FileJson className="h-4 w-4" />;
  if (type === "xlsx") return <FileSpreadsheet className="h-4 w-4" />;
  return <FileText className="h-4 w-4" />;
}

function ScreenSwitch({
  activeView,
  onChange,
}: {
  activeView: ViewMode;
  onChange: (view: ViewMode) => void;
}) {
  const items: { id: ViewMode; label: string }[] = [
    { id: "new", label: "新建任务" },
    { id: "running", label: "任务运行中" },
    { id: "result", label: "结果展示" },
  ];

  return (
    <div className="inline-flex rounded-2xl border border-slate-200 bg-slate-50 p-1">
      {items.map((item) => {
        const active = activeView === item.id;
        return (
          <button
            key={item.id}
            onClick={() => onChange(item.id)}
            className={`rounded-xl px-3 py-2 text-[12px] font-medium transition ${
              active
                ? "bg-white text-[#161FAD] shadow-[0_6px_16px_rgba(15,23,42,0.06)]"
                : "text-slate-500 hover:text-slate-700"
            }`}
          >
            {item.label}
          </button>
        );
      })}
    </div>
  );
}

function Sidebar({ activeView }: { activeView: ViewMode }) {
  return (
    <aside className="flex min-h-[760px] flex-col rounded-[24px] border border-white/70 bg-white/84 p-4 shadow-[0_16px_40px_rgba(15,23,42,0.045)] backdrop-blur">
      <div className="mb-5 flex items-center gap-3 rounded-[18px] border border-slate-100 bg-slate-50/90 px-3 py-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[linear-gradient(135deg,#161FAD_0%,#848CFE_100%)] text-white shadow-[0_10px_22px_rgba(22,31,173,0.2)]">
          <FlaskConical className="h-5 w-5" />
        </div>
        <div>
          <p className="text-[11px] uppercase tracking-[0.24em] text-slate-400">Ailux Agent</p>
          <p className="text-[14px] font-semibold text-[#070261]">智能体平台</p>
        </div>
      </div>

      <button
        className={`mb-4 flex w-full items-center gap-2 rounded-[18px] border px-3.5 py-3 text-left text-[13px] font-medium transition ${
          activeView === "new"
            ? "border-[rgba(23,36,216,0.12)] bg-[linear-gradient(180deg,rgba(23,36,216,0.08),rgba(132,140,254,0.08))] text-[#161FAD] shadow-[0_12px_28px_rgba(23,36,216,0.08)]"
            : "border-transparent bg-slate-50 text-slate-700 hover:border-slate-200 hover:bg-white"
        }`}
      >
        <Plus className="h-4 w-4" />新对话
      </button>

      <div className="mb-3 flex items-center justify-between">
        <div>
          <p className="text-[11px] uppercase tracking-[0.18em] text-slate-400">Tasks</p>
          <h2 className="mt-1 text-[17px] font-semibold text-[#070261]">任务列表</h2>
        </div>
        <button className="rounded-xl p-2 text-slate-400 transition hover:bg-slate-50 hover:text-[#161FAD]">
          <PanelRightOpen className="h-4 w-4" />
        </button>
      </div>

      <div className="flex-1 space-y-2">
        {historyTasks.filter((task) => !task.isDraft).map((task) => {
          const active = activeView !== "new" && task.id === "t1";

          return (
            <button
              key={task.id}
              className={`w-full rounded-[18px] border px-3.5 py-3 text-left transition ${
                active
                  ? "border-[rgba(23,36,216,0.12)] bg-[linear-gradient(180deg,rgba(23,36,216,0.08),rgba(132,140,254,0.08))] shadow-[0_12px_28px_rgba(23,36,216,0.08)]"
                  : "border-transparent bg-slate-50/80 hover:border-slate-200 hover:bg-white"
              }`}
            >
              <p className={`truncate text-[13px] ${active ? "font-semibold text-[#070261]" : "font-medium text-slate-700"}`}>
                {task.title}
              </p>
              <p className="mt-1 text-[11px] text-slate-400">{task.meta}</p>
            </button>
          );
        })}
      </div>

      <div className="mt-4 flex items-center gap-3 rounded-[18px] border border-slate-100 bg-slate-50/90 px-3 py-3">
        <UserCircle2 className="h-8 w-8 text-slate-400" />
        <div>
          <p className="text-[13px] font-medium text-slate-700">Chen Lab</p>
          <p className="text-[11px] text-slate-400">已登录 · 项目成员</p>
        </div>
      </div>
    </aside>
  );
}

function NewTaskWorkspace({
  prompt,
  onPromptChange,
  onPromptPick,
  onStart,
}: {
  prompt: string;
  onPromptChange: (value: string) => void;
  onPromptPick: (value: string) => void;
  onStart: () => void;
}) {
  return (
    <section className="flex min-h-[760px] flex-col rounded-[24px] border border-white/70 bg-white/84 shadow-[0_16px_40px_rgba(15,23,42,0.045)] backdrop-blur">
      <div className="border-b border-slate-200/80 px-6 py-5">
        <p className="text-[11px] uppercase tracking-[0.18em] text-slate-400">New Conversation</p>
        <h2 className="mt-1 text-[17px] font-semibold text-[#070261]">有什么我能帮你的吗？</h2>
      </div>

      <div className="flex flex-1 flex-col justify-between px-6 py-6">
        <div>
          <div className="rounded-[24px] border border-[rgba(23,36,216,0.08)] bg-[linear-gradient(180deg,rgba(248,250,255,0.98)_0%,rgba(236,241,255,0.95)_100%)] p-6 shadow-[inset_0_1px_0_rgba(255,255,255,0.8)]">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-[rgba(23,36,216,0.08)] px-3 py-1 text-[11px] font-medium text-[#161FAD]">
              <WandSparkles className="h-3.5 w-3.5" />
              自然语言发起任务
            </div>
            <h3 className="text-[22px] font-semibold tracking-tight text-[#070261]">
              从目标描述开始，让 Agent 帮你完成模型、工具和执行流程的组织。
            </h3>
            <p className="mt-3 max-w-[720px] text-[13px] leading-6 text-slate-600">
              当前界面处于新任务工作态。中间区不展示旧任务内容，右侧也不会带入历史计划与结果。你可以直接输入研究目标，或先上传 CSV、PDB 等文件，再由 Agent 自动生成可追踪的执行路径。
            </p>
          </div>

          <div className="mt-6">
            <div className="mb-3 flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-[#161FAD]" />
              <p className="text-[13px] font-medium text-slate-700">推荐任务</p>
            </div>
            <div className="space-y-3">
              {recommendedPrompts.map((item) => (
                <button
                  key={item}
                  onClick={() => onPromptPick(item)}
                  className="flex w-full items-start justify-between gap-3 rounded-[18px] border border-slate-100 bg-slate-50/80 px-4 py-4 text-left transition hover:border-[rgba(23,36,216,0.14)] hover:bg-white"
                >
                  <div>
                    <p className="text-[13px] font-medium text-slate-700">{item}</p>
                    <p className="mt-1 text-[11px] text-slate-400">点击后自动填入输入框，不会直接发送。</p>
                  </div>
                  <ArrowUpRight className="mt-0.5 h-4 w-4 shrink-0 text-slate-300" />
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-6 rounded-[18px] border border-slate-200 bg-slate-50/90 p-3">
          <textarea
            value={prompt}
            onChange={(event) => onPromptChange(event.target.value)}
            className="min-h-[72px] w-full resize-none border-0 bg-transparent text-[13px] leading-6 outline-none placeholder:text-slate-400"
            placeholder="描述你的目标，或上传数据后提问…"
          />
          <div className="mt-2 flex items-center justify-between gap-3 border-t border-slate-200 pt-2.5">
            <div className="flex items-center gap-2">
              <button className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-[12px] font-medium text-slate-600 transition hover:border-[rgba(23,36,216,0.18)] hover:text-[#161FAD]">
                <Upload className="mr-1.5 inline h-4 w-4" />上传文件
              </button>
              <p className="text-[11px] text-slate-400">支持 CSV、PDB 等输入文件</p>
            </div>
            <Button
              onClick={onStart}
              disabled={!prompt.trim()}
              className="h-9 rounded-xl bg-[#161FAD] px-4 text-[13px] text-white shadow-[0_10px_24px_rgba(22,31,173,0.18)] hover:bg-[#1724D8] disabled:cursor-not-allowed disabled:bg-slate-300"
            >
              发送
              <SendHorizonal className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}

function RunningWorkspace({
  prompt,
  onPromptChange,
}: {
  prompt: string;
  onPromptChange: (value: string) => void;
}) {
  return (
    <section className="flex min-h-[760px] flex-col rounded-[24px] border border-white/70 bg-white/84 shadow-[0_16px_40px_rgba(15,23,42,0.045)] backdrop-blur">
      <div className="border-b border-slate-200/80 px-6 py-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-[11px] uppercase tracking-[0.18em] text-slate-400">Conversation & Execution</p>
            <h2 className="mt-1 text-[17px] font-semibold text-[#070261]">双抗内化功能预测模型</h2>
          </div>
          <div className="inline-flex items-center gap-2 rounded-full border border-[rgba(255,201,151,0.45)] bg-[rgba(255,201,151,0.2)] px-3 py-1 text-[11px] font-medium text-[#8a5216]">
            <Clock3 className="h-3.5 w-3.5" />
            运行中
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-6 py-6">
        <div className="space-y-4">
          {runningMessages.map((message, index) => {
            const isUser = message.role === "user";
            return (
              <div key={`${message.role}-${index}`} className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
                <div className={`max-w-[88%] rounded-[20px] px-4 py-3 text-[13px] leading-6 shadow-sm ${
                  isUser ? "bg-[#1724D8] text-white" : "border border-slate-200 bg-slate-50 text-slate-700"
                }`}>
                  {!isUser ? (
                    <div className="mb-1.5 flex items-center gap-2 text-[11px] font-medium text-[#161FAD]">
                      <Bot className="h-4 w-4" />Ailux Agent
                    </div>
                  ) : null}
                  <p>{message.content}</p>
                  <p className={`mt-2 text-[10px] ${isUser ? "text-white/75" : "text-slate-400"}`}>{message.time}</p>
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-8">
          <div className="mb-3 flex items-center justify-between">
            <p className="text-[11px] uppercase tracking-[0.18em] text-slate-400">Execution Steps</p>
            <p className="text-[11px] text-slate-400">与右侧 Plan 步骤保持同步</p>
          </div>
          <div className="space-y-3">
            {runningSteps.map((step) => {
              const style = statusStyles[step.status];
              return (
                <button
                  key={step.id}
                  className="flex w-full items-center gap-3 rounded-[18px] border border-[rgba(22,31,173,0.06)] bg-[linear-gradient(180deg,rgba(243,252,248,0.8)_0%,rgba(247,251,255,0.9)_100%)] px-4 py-3 text-left transition hover:border-[rgba(23,36,216,0.14)] hover:bg-white"
                >
                  <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full border ${style.icon}`}>
                    {step.status === "done" ? <CheckCircle2 className="h-4 w-4" /> : <CircleDashed className="h-4 w-4" />}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-3">
                      <p className="truncate text-[13px] font-semibold text-slate-800">{step.title}</p>
                      <span className="text-[11px] text-slate-400">{step.duration}</span>
                    </div>
                    <p className="mt-1 text-[11px] leading-5 text-slate-500">{step.detail}</p>
                  </div>
                  <ChevronRight className="h-4 w-4 text-slate-300" />
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <div className="border-t border-slate-200/80 px-6 py-4">
        <div className="rounded-[18px] border border-slate-200 bg-slate-50/90 p-3">
          <textarea
            value={prompt}
            onChange={(event) => onPromptChange(event.target.value)}
            className="min-h-[68px] w-full resize-none border-0 bg-transparent text-[13px] leading-6 outline-none placeholder:text-slate-400"
            placeholder="继续向 Agent 追问，例如：请解释为什么共定位评分是最高贡献特征。"
          />
          <div className="mt-2 flex items-center justify-between gap-3 border-t border-slate-200 pt-2.5">
            <div className="flex items-center gap-2 text-slate-500">
              <button className="rounded-xl p-2 transition hover:bg-white hover:text-[#161FAD]">
                <Upload className="h-4 w-4" />
              </button>
              <button className="rounded-xl p-2 transition hover:bg-white hover:text-[#161FAD]">
                <Database className="h-4 w-4" />
              </button>
            </div>
            <Button className="h-9 rounded-xl bg-[#161FAD] px-4 text-[13px] text-white hover:bg-[#1724D8]">
              发送
              <SendHorizonal className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}

function ResultWorkspace({ selectedFile }: { selectedFile: ResultFile }) {
  return (
    <section className="flex min-h-[760px] flex-col rounded-[24px] border border-white/70 bg-white/84 shadow-[0_16px_40px_rgba(15,23,42,0.045)] backdrop-blur">
      <div className="border-b border-slate-200/80 px-6 py-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-[11px] uppercase tracking-[0.18em] text-slate-400">Final Result Review</p>
            <h2 className="mt-1 text-[17px] font-semibold text-[#070261]">双抗内化功能预测模型 · 最终结果</h2>
          </div>
          <div className="inline-flex items-center gap-2 rounded-full border border-[rgba(23,36,216,0.12)] bg-[rgba(23,36,216,0.08)] px-3 py-1 text-[11px] font-medium text-[#161FAD]">
            <CheckCircle2 className="h-3.5 w-3.5" />
            已完成
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-6 py-6">
        <div className="grid gap-4 lg:grid-cols-3">
          {finalInsights.map((item) => (
            <article key={item.title} className="rounded-[20px] border border-slate-100 bg-slate-50/85 p-4">
              <p className="text-[11px] uppercase tracking-[0.18em] text-slate-400">Insight</p>
              <h3 className="mt-1 text-[13px] font-semibold text-[#070261]">{item.title}</h3>
              <p className="mt-2 text-[12px] leading-6 text-slate-600">{item.detail}</p>
            </article>
          ))}
        </div>

        <div className="mt-5 rounded-[22px] border border-slate-100 bg-white shadow-[0_8px_24px_rgba(15,23,42,0.04)]">
          <div className="flex flex-wrap items-center gap-2 border-b border-slate-200/80 px-4 py-3">
            {previewTabs.map((tab) => (
              <button
                key={tab.id}
                className={`rounded-xl px-3 py-2 text-[12px] font-medium transition ${
                  tab.active
                    ? "bg-[rgba(255,201,151,0.32)] text-[#6c4b1d]"
                    : "text-slate-500 hover:bg-slate-50 hover:text-slate-700"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="px-4 py-4">
            <div className="mb-3 flex items-center justify-between gap-3">
              <div>
                <p className="text-[12px] font-medium text-slate-700">{selectedFile.name}</p>
                <p className="mt-1 text-[11px] text-slate-400">{selectedFile.step} · {selectedFile.meta}</p>
              </div>
              <Button variant="outline" className="h-8 rounded-xl border-slate-200 bg-white px-3 text-[12px] text-slate-600 hover:bg-slate-50">
                下载文件
              </Button>
            </div>

            {selectedFile.type === "csv" ? (
              <div className="overflow-hidden rounded-[18px] border border-slate-200">
                <div className="overflow-x-auto">
                  <table className="min-w-full border-collapse text-left text-[12px]">
                    <thead>
                      <tr className="bg-slate-50 text-slate-500">
                        {[
                          "sample_id",
                          "KD_arm1_nM",
                          "KD_arm2_nM",
                          "antibody_format",
                          "epitope_pos_A",
                          "epitope_pos_B",
                        ].map((head) => (
                          <th key={head} className="border-b border-slate-200 px-3 py-2.5 font-medium">
                            {head}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {datasetPreviewRows.map((row, index) => (
                        <tr key={`${row[0]}-${index}`} className="even:bg-slate-50/60">
                          {row.map((cell) => (
                            <td key={`${row[0]}-${cell}`} className="border-b border-slate-100 px-3 py-2.5 text-slate-700">
                              {cell}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className="bg-slate-50/70 px-3 py-2 text-[11px] text-slate-400">Showing first 100 rows. Download file to see all data.</div>
              </div>
            ) : selectedFile.type === "json" ? (
              <div className="rounded-[18px] border border-slate-200 bg-[#0f172a] p-4 font-mono text-[12px] leading-6 text-slate-200">
                <p>{`{`}</p>
                <p className="pl-4">"best_model": "XGBoost",</p>
                <p className="pl-4">"top_features": ["target_colocalization", "KD_arm1_nM", "linker_flexibility"],</p>
                <p className="pl-4">"r2": 0.72,</p>
                <p className="pl-4">"rmse": 0.106</p>
                <p>{`}`}</p>
              </div>
            ) : selectedFile.type === "xlsx" ? (
              <div className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
                <div className="rounded-[18px] border border-slate-200 bg-slate-50/80 p-4">
                  <p className="text-[12px] font-medium text-slate-700">模型比较摘要</p>
                  <div className="mt-4 space-y-3">
                    {[
                      ["XGBoost", "R² 0.72", "RMSE 0.106"],
                      ["Random Forest", "R² 0.69", "RMSE 0.118"],
                      ["SVM", "R² 0.64", "RMSE 0.131"],
                    ].map(([name, score, error]) => (
                      <div key={name} className="flex items-center justify-between rounded-[16px] border border-slate-100 bg-white px-3 py-3">
                        <p className="text-[12px] font-medium text-slate-700">{name}</p>
                        <div className="text-right">
                          <p className="text-[11px] text-slate-500">{score}</p>
                          <p className="text-[11px] text-slate-400">{error}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="rounded-[18px] border border-slate-200 bg-[linear-gradient(180deg,rgba(248,250,255,0.98),rgba(236,241,255,0.95))] p-4">
                  <p className="text-[12px] font-medium text-slate-700">结论建议</p>
                  <p className="mt-3 text-[12px] leading-6 text-slate-600">
                    推荐默认展示 XGBoost 作为最佳模型，并在结果页同步展示可解释特征与模型性能对比，帮助业务用户快速理解选择依据。
                  </p>
                </div>
              </div>
            ) : (
              <div className="grid gap-4 lg:grid-cols-[1.15fr_0.85fr]">
                <div className="rounded-[18px] border border-slate-200 bg-[linear-gradient(180deg,rgba(244,247,255,1)_0%,rgba(255,255,255,1)_100%)] p-5">
                  <div className="flex items-end gap-3">
                    {[48, 78, 66, 92, 57, 86].map((height, index) => (
                      <div key={`${height}-${index}`} className="flex flex-1 flex-col items-center gap-2">
                        <div
                          className="w-full rounded-t-[12px] bg-[linear-gradient(180deg,#161FAD_0%,#848CFE_100%)]"
                          style={{ height }}
                        />
                        <span className="text-[10px] text-slate-400">F{index + 1}</span>
                      </div>
                    ))}
                  </div>
                  <p className="mt-4 text-[11px] text-slate-400">示意图：关键特征贡献或相关性结果预览。</p>
                </div>
                <div className="rounded-[18px] border border-slate-200 bg-slate-50/80 p-4">
                  <p className="text-[12px] font-medium text-slate-700">图像结果摘要</p>
                  <ul className="mt-3 space-y-3 text-[12px] leading-6 text-slate-600">
                    <li>靶点共定位评分在高内化组中显著更高。</li>
                    <li>KD 过高时内化率显著下降，呈现负相关趋势。</li>
                    <li>连接区柔性在中等区间时，模型表现更稳定。</li>
                  </ul>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

function SidePanel({
  view,
  sideTab,
  onSideTabChange,
  selectedFileId,
  onSelectFile,
}: {
  view: ViewMode;
  sideTab: SideTab;
  onSideTabChange: (tab: SideTab) => void;
  selectedFileId: string;
  onSelectFile: (id: string) => void;
}) {
  const showEmpty = view === "new";
  const progressDone = runningSteps.filter((item) => item.status === "done").length;
  const progressPercent = view === "result" ? 100 : 42;
  const groupedFiles = useMemo(() => {
    return resultFiles.reduce<Record<string, ResultFile[]>>((acc, file) => {
      if (!acc[file.step]) acc[file.step] = [];
      acc[file.step].push(file);
      return acc;
    }, {});
  }, []);

  return (
    <aside className="flex min-h-[760px] flex-col rounded-[24px] border border-white/70 bg-white/84 shadow-[0_16px_40px_rgba(15,23,42,0.045)] backdrop-blur">
      <div className="border-b border-slate-200/80 px-4 py-4">
        <div className="inline-flex rounded-2xl border border-slate-200 bg-slate-50 p-1">
          {[
            { id: "plan" as SideTab, label: "计划" },
            { id: "results" as SideTab, label: "结果文件" },
          ].map((tab) => {
            const active = sideTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => onSideTabChange(tab.id)}
                className={`rounded-xl px-3 py-2 text-[12px] font-medium transition ${
                  active ? "bg-white text-[#161FAD] shadow-[0_6px_16px_rgba(15,23,42,0.06)]" : "text-slate-500 hover:text-slate-700"
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-4">
        {sideTab === "plan" ? (
          showEmpty ? (
            <div className="rounded-[20px] border border-dashed border-slate-200 bg-slate-50/70 p-5">
              <p className="text-[11px] uppercase tracking-[0.18em] text-slate-400">Plan</p>
              <h3 className="mt-1 text-[15px] font-semibold text-[#070261]">等待生成计划</h3>
              <p className="mt-3 text-[12px] leading-6 text-slate-500">
                首条消息发送成功后，右侧会生成当前任务对应的步骤计划、进度条和每一步的执行摘要。当前新任务态不会展示旧任务数据。
              </p>
            </div>
          ) : (
            <div>
              <div className="mb-4 flex items-center justify-between gap-3">
                <div>
                  <p className="text-[11px] uppercase tracking-[0.18em] text-slate-400">Plan</p>
                  <h3 className="mt-1 text-[17px] font-semibold text-[#070261]">计划</h3>
                </div>
                <div className="inline-flex items-center gap-1 rounded-full bg-[rgba(255,201,151,0.2)] px-2.5 py-1 text-[11px] font-medium text-[#8a5216]">
                  <Clock3 className="h-3.5 w-3.5" />
                  {view === "result" ? "6 / 6" : `${progressDone + 1} / 6`}
                </div>
              </div>
              <div className="mb-4">
                <div className="mb-1 flex items-center justify-between text-[11px] text-slate-400">
                  <span>整体进度</span>
                  <span>{progressPercent}%</span>
                </div>
                <div className="h-2 rounded-full bg-slate-100">
                  <div
                    className="h-2 rounded-full bg-[linear-gradient(90deg,#161FAD_0%,#848CFE_68%,#FFC997_100%)]"
                    style={{ width: `${progressPercent}%` }}
                  />
                </div>
              </div>
              <div className="space-y-3">
                {runningSteps.map((step) => {
                  const style = statusStyles[view === "result" && step.status === "waiting" ? "done" : step.status];
                  const iconDone = view === "result" || step.status === "done";
                  return (
                    <article key={step.id} className="rounded-[18px] border border-slate-100 bg-slate-50/90 p-3.5">
                      <div className="flex items-start gap-3">
                        <div className={`mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full border ${style.icon}`}>
                          {iconDone ? <CheckCircle2 className="h-4 w-4" /> : <CircleDashed className="h-4 w-4" />}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center justify-between gap-3">
                            <p className="text-[13px] font-semibold text-slate-800">{step.title}</p>
                            <span className="text-[11px] text-slate-400">{step.duration}</span>
                          </div>
                          <p className="mt-1 text-[11px] leading-5 text-slate-500">{step.summary}</p>
                          <span className={`mt-2 inline-flex rounded-full border px-2.5 py-1 text-[10px] font-medium ${style.chip}`}>
                            {style.label}
                          </span>
                        </div>
                      </div>
                    </article>
                  );
                })}
              </div>
            </div>
          )
        ) : showEmpty ? (
          <div className="rounded-[20px] border border-dashed border-slate-200 bg-slate-50/70 p-5">
            <p className="text-[11px] uppercase tracking-[0.18em] text-slate-400">Results</p>
            <h3 className="mt-1 text-[15px] font-semibold text-[#070261]">暂无结果文件</h3>
            <p className="mt-3 text-[12px] leading-6 text-slate-500">
              当任务启动后，系统会按步骤将数据集、图像、日志、JSON 汇总等文件增量写入当前任务的结果区，并支持按文件名搜索。
            </p>
          </div>
        ) : (
          <div>
            <div className="mb-4 flex items-center justify-between gap-3">
              <div>
                <p className="text-[11px] uppercase tracking-[0.18em] text-slate-400">Results</p>
                <h3 className="mt-1 text-[17px] font-semibold text-[#070261]">结果文件</h3>
              </div>
              <div className="inline-flex items-center gap-1 rounded-full bg-slate-50 px-2.5 py-1 text-[11px] font-medium text-slate-500">
                <FolderOpen className="h-3.5 w-3.5" />
                {resultFiles.length} 个文件
              </div>
            </div>

            <div className="mb-4 rounded-[18px] border border-slate-200 bg-slate-50/90 px-3 py-2.5">
              <div className="flex items-center gap-2 text-slate-400">
                <Search className="h-4 w-4" />
                <input className="w-full border-0 bg-transparent text-[13px] outline-none placeholder:text-slate-400" placeholder="搜索文件" />
              </div>
            </div>

            <div className="space-y-4">
              {Object.entries(groupedFiles).map(([group, files]) => (
                <div key={group}>
                  <p className="mb-2 text-[11px] font-medium uppercase tracking-[0.14em] text-slate-400">{group}</p>
                  <div className="space-y-2.5">
                    {files.map((file) => {
                      const active = selectedFileId === file.id;
                      return (
                        <button
                          key={file.id}
                          onClick={() => onSelectFile(file.id)}
                          className={`flex w-full items-start gap-3 rounded-[18px] border px-3 py-3 text-left transition ${
                            active
                              ? "border-[rgba(23,36,216,0.14)] bg-[rgba(23,36,216,0.05)]"
                              : "border-slate-100 bg-slate-50/90 hover:border-[rgba(23,36,216,0.14)] hover:bg-white"
                          }`}
                        >
                          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[rgba(23,36,216,0.08)] text-[#161FAD]">
                            <ResultTypeIcon type={file.type} />
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-[13px] font-medium text-slate-800">{file.name}</p>
                            <p className="mt-1 text-[11px] text-slate-400">{file.meta}</p>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </aside>
  );
}

export default function Home() {
  const [activeView, setActiveView] = useState<ViewMode>("new");
  const [sideTab, setSideTab] = useState<SideTab>("plan");
  const [composerValue, setComposerValue] = useState("");
  const [selectedFileId, setSelectedFileId] = useState<string>("dataset");

  const selectedFile = resultFiles.find((file) => file.id === selectedFileId) ?? resultFiles[0];
  const meta = screenMeta[activeView];

  const handleScreenChange = (view: ViewMode) => {
    setActiveView(view);
    setSideTab(view === "result" ? "results" : "plan");
  };

  const handlePromptPick = (value: string) => {
    setComposerValue(value);
  };

  const handleStart = () => {
    setActiveView("running");
    setSideTab("plan");
  };

  const handlePrimaryAction = () => {
    if (activeView === "new") {
      handleStart();
      return;
    }

    if (activeView === "running") {
      setActiveView("result");
      setSideTab("results");
      return;
    }

    setSideTab("results");
  };

  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,#f8faff_0%,#eef3ff_100%)] text-slate-900">
      <div className="mx-auto flex min-h-screen max-w-[1580px] flex-col p-4 lg:p-5">
          <div className="grid flex-1 gap-4 xl:grid-cols-[260px_minmax(0,1fr)_360px]">
          <Sidebar activeView={activeView} />

          {activeView === "new" ? (
            <NewTaskWorkspace
              prompt={composerValue}
              onPromptChange={setComposerValue}
              onPromptPick={handlePromptPick}
              onStart={handleStart}
            />
          ) : activeView === "running" ? (
            <RunningWorkspace prompt={composerValue} onPromptChange={setComposerValue} />
          ) : (
            <ResultWorkspace selectedFile={selectedFile} />
          )}

          <SidePanel
            view={activeView}
            sideTab={sideTab}
            onSideTabChange={setSideTab}
            selectedFileId={selectedFileId}
            onSelectFile={setSelectedFileId}
          />
        </div>
      </div>
    </div>
  );
}
