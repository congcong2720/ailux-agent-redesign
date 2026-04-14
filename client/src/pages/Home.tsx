/*
Design reminder for this file:
- Philosophy: Minimal agent workspace for biotech tasks
- Keep only four visible modules: task list, conversation, plan, result files
- Preserve Ailux brand blues with restrained accents and clean panel structure
- Prioritize clarity of use over visual storytelling
*/
import { Button } from "@/components/ui/button";
import {
  Bot,
  CircleCheckBig,
  Clock3,
  Database,
  FileSpreadsheet,
  FileText,
  FolderOpen,
  Paperclip,
  Play,
  Search,
  SendHorizonal,
  Share2,
  Sparkles,
} from "lucide-react";

type PlanStep = {
  title: string;
  detail: string;
  time: string;
  status: "done" | "running" | "waiting";
};

const tasks = [
  { title: "双抗内化功能预测模型", meta: "当前任务", active: true },
  { title: "内化特征关联分析", meta: "3w ago", active: false },
  { title: "EGFR 抗体优化", meta: "3w ago", active: false },
  { title: "CDR 区域内化影响评估", meta: "3w ago", active: false },
  { title: "HER2×CD3 对照实验", meta: "3w ago", active: false },
];

const messages = [
  {
    role: "user",
    content:
      "请基于双抗内化实验场景，生成模拟数据，完成 EDA、特征重要性分析、预测建模，并输出实验建议。",
  },
  {
    role: "agent",
    content:
      "已收到任务。我会先生成模拟数据集，再完成 EDA、特征重要性分析和模型比较，并把结果文件整理到右侧 Result 区域。",
  },
  {
    role: "agent",
    content:
      "当前正在执行探索性数据分析（EDA），已确认 KD 与内化率、靶点共定位与内化率存在显著关系。",
  },
];

const planSteps: PlanStep[] = [
  {
    title: "生成模拟数据集",
    detail: "150 条双抗记录已生成",
    time: "4s",
    status: "done",
  },
  {
    title: "探索性数据分析（EDA）",
    detail: "正在分析分布、相关性与离群点",
    time: "19s",
    status: "running",
  },
  {
    title: "特征重要性分析",
    detail: "等待当前步骤完成后执行",
    time: "32s",
    status: "waiting",
  },
  {
    title: "构建预测模型",
    detail: "将比较 XGBoost / RF / SVM",
    time: "1m27s",
    status: "waiting",
  },
];

const files = [
  { name: "bsab_internalization_dataset.csv", meta: "数据集 · 28.5 KB", icon: Database },
  { name: "eda_report.json", meta: "结构化报告 · 6.1 KB", icon: FileText },
  { name: "fig2_correlation_heatmap.png", meta: "热图 · 293 KB", icon: FileText },
  { name: "model_comparison.xlsx", meta: "模型对比表 · 43 KB", icon: FileSpreadsheet },
];

const statusStyles = {
  done: "border-[rgba(23,36,216,0.12)] bg-[rgba(23,36,216,0.08)] text-[#161FAD]",
  running: "border-[rgba(255,201,151,0.4)] bg-[rgba(255,201,151,0.24)] text-[#8a5216]",
  waiting: "border-slate-200 bg-slate-100 text-slate-500",
};

const statusLabels = {
  done: "完成",
  running: "进行中",
  waiting: "待执行",
};

export default function Home() {
  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,#f8faff_0%,#eef3ff_100%)] text-slate-900">
      <div className="mx-auto flex min-h-screen max-w-[1600px] flex-col p-4 lg:p-5">
        <header className="mb-4 flex flex-wrap items-center justify-between gap-4 rounded-[28px] border border-white/70 bg-white/80 px-5 py-4 shadow-[0_20px_50px_rgba(15,23,42,0.06)] backdrop-blur">
          <div>
            <p className="text-xs uppercase tracking-[0.22em] text-slate-400">Ailux Agent</p>
            <h1 className="mt-1 text-[26px] font-semibold tracking-tight text-[#070261]">智能体工作台</h1>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" className="h-10 rounded-2xl border-slate-200 bg-white px-4 text-slate-700 hover:bg-slate-50">
              <Share2 className="mr-2 h-4 w-4" />分享
            </Button>
            <Button className="h-10 rounded-2xl bg-[#161FAD] px-4 text-white shadow-[0_14px_28px_rgba(22,31,173,0.22)] hover:bg-[#1724D8]">
              <Play className="mr-2 h-4 w-4" />运行任务
            </Button>
          </div>
        </header>

        <div className="grid flex-1 gap-4 xl:grid-cols-[260px_minmax(0,1fr)_340px]">
          <aside className="rounded-[28px] border border-white/70 bg-white/82 p-4 shadow-[0_20px_50px_rgba(15,23,42,0.05)] backdrop-blur">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Tasks</p>
                <h2 className="mt-1 text-lg font-semibold text-[#070261]">任务列表</h2>
              </div>
              <Button className="h-9 rounded-2xl bg-[#161FAD] px-3 text-white hover:bg-[#1724D8]">
                <Sparkles className="mr-1.5 h-4 w-4" />新建
              </Button>
            </div>

            <div className="space-y-2">
              {tasks.map((task) => (
                <button
                  key={task.title}
                  className={`w-full rounded-[22px] border px-4 py-3 text-left transition ${
                    task.active
                      ? "border-[rgba(23,36,216,0.12)] bg-[linear-gradient(180deg,rgba(23,36,216,0.08),rgba(132,140,254,0.08))] shadow-[0_12px_28px_rgba(23,36,216,0.08)]"
                      : "border-transparent bg-slate-50 hover:border-slate-200 hover:bg-white"
                  }`}
                >
                  <p className={`truncate text-sm ${task.active ? "font-semibold text-[#070261]" : "font-medium text-slate-700"}`}>{task.title}</p>
                  <p className="mt-1 text-xs text-slate-400">{task.meta}</p>
                </button>
              ))}
            </div>
          </aside>

          <section className="flex min-h-[720px] flex-col rounded-[28px] border border-white/70 bg-white/82 shadow-[0_20px_50px_rgba(15,23,42,0.05)] backdrop-blur">
            <div className="border-b border-slate-200/80 px-5 py-4">
              <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Conversation</p>
              <h2 className="mt-1 text-lg font-semibold text-[#070261]">Agent 对话区域</h2>
            </div>

            <div className="flex-1 space-y-4 overflow-y-auto px-5 py-5">
              {messages.map((message, index) => (
                <div key={`${message.role}-${index}`} className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}>
                  <div className={`max-w-[85%] rounded-[24px] px-4 py-3 text-sm leading-7 shadow-sm ${
                    message.role === "user"
                      ? "bg-[#1724D8] text-white"
                      : "border border-slate-200 bg-slate-50 text-slate-700"
                  }`}>
                    {message.role === "agent" ? (
                      <div className="mb-2 flex items-center gap-2 text-xs font-medium text-[#161FAD]">
                        <Bot className="h-4 w-4" />Ailux Agent
                      </div>
                    ) : null}
                    <p>{message.content}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="border-t border-slate-200/80 px-5 py-4">
              <div className="rounded-[24px] border border-slate-200 bg-slate-50 p-3">
                <textarea
                  className="min-h-[96px] w-full resize-none border-0 bg-transparent text-sm leading-7 outline-none placeholder:text-slate-400"
                  placeholder="继续向 Agent 提问，例如：请补充连接区长度与靶点共定位之间的交互分析。"
                />
                <div className="mt-3 flex items-center justify-between gap-3 border-t border-slate-200 pt-3">
                  <div className="flex items-center gap-2 text-slate-500">
                    <button className="rounded-2xl p-2 transition hover:bg-white hover:text-[#161FAD]"><Paperclip className="h-4 w-4" /></button>
                    <button className="rounded-2xl p-2 transition hover:bg-white hover:text-[#161FAD]"><Database className="h-4 w-4" /></button>
                  </div>
                  <Button className="h-10 rounded-2xl bg-[#161FAD] px-4 text-white hover:bg-[#1724D8]">
                    发送
                    <SendHorizonal className="ml-2 h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          </section>

          <aside className="grid gap-4 lg:grid-rows-[minmax(0,1fr)_minmax(0,1fr)]">
            <section className="rounded-[28px] border border-white/70 bg-white/82 p-4 shadow-[0_20px_50px_rgba(15,23,42,0.05)] backdrop-blur">
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Plan</p>
                  <h2 className="mt-1 text-lg font-semibold text-[#070261]">计划</h2>
                </div>
                <div className="inline-flex items-center gap-1 rounded-full bg-[rgba(255,201,151,0.22)] px-3 py-1 text-xs font-medium text-[#8a5216]">
                  <Clock3 className="h-3.5 w-3.5" />2 / 4
                </div>
              </div>
              <div className="mb-4 h-2 rounded-full bg-slate-100">
                <div className="h-2 w-1/2 rounded-full bg-[linear-gradient(90deg,#161FAD_0%,#848CFE_70%,#FFC997_100%)]" />
              </div>
              <div className="space-y-3">
                {planSteps.map((step) => (
                  <article key={step.title} className="rounded-[22px] border border-slate-100 bg-slate-50 p-4">
                    <div className="flex items-start gap-3">
                      <div className={`mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full border ${statusStyles[step.status]}`}>
                        <CircleCheckBig className="h-4 w-4" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-3">
                          <p className="text-sm font-semibold text-slate-800">{step.title}</p>
                          <span className="text-xs text-slate-400">{step.time}</span>
                        </div>
                        <p className="mt-1 text-xs leading-5 text-slate-500">{step.detail}</p>
                        <span className={`mt-2 inline-flex rounded-full border px-2.5 py-1 text-[11px] font-medium ${statusStyles[step.status]}`}>
                          {statusLabels[step.status]}
                        </span>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            </section>

            <section className="rounded-[28px] border border-white/70 bg-white/82 p-4 shadow-[0_20px_50px_rgba(15,23,42,0.05)] backdrop-blur">
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Result</p>
                  <h2 className="mt-1 text-lg font-semibold text-[#070261]">结果文件</h2>
                </div>
                <FolderOpen className="h-4 w-4 text-slate-400" />
              </div>

              <div className="mb-4 rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2">
                <div className="flex items-center gap-2 text-slate-400">
                  <Search className="h-4 w-4" />
                  <input className="w-full border-0 bg-transparent text-sm outline-none placeholder:text-slate-400" placeholder="搜索文件..." />
                </div>
              </div>

              <div className="space-y-2.5">
                {files.map((file) => {
                  const Icon = file.icon;
                  return (
                    <button
                      key={file.name}
                      className="flex w-full items-start gap-3 rounded-[20px] border border-slate-100 bg-slate-50 px-3 py-3 text-left transition hover:border-[rgba(23,36,216,0.14)] hover:bg-white"
                    >
                      <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[rgba(23,36,216,0.08)] text-[#161FAD]">
                        <Icon className="h-4 w-4" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-slate-800">{file.name}</p>
                        <p className="mt-1 text-xs text-slate-400">{file.meta}</p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </section>
          </aside>
        </div>
      </div>
    </div>
  );
}
