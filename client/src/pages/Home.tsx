/*
Design reminder for this file:
- Philosophy: Agent-first biotech workspace
- The first thing users must understand is how to start a task, what the agent is doing, and where to read outputs
- Keep the Ailux brand blues and layered visual language, but prioritize usability over showcase composition
- Structure should communicate a clear loop: 输入任务 → Agent 执行 → 查看结果 → 继续追问
*/
import { Button } from "@/components/ui/button";
import {
  ArrowRight,
  Atom,
  BarChart3,
  Bot,
  BrainCircuit,
  CircleCheckBig,
  Clock3,
  Database,
  FileSpreadsheet,
  FileText,
  FlaskConical,
  FolderOpen,
  Lightbulb,
  LoaderCircle,
  PanelLeft,
  Paperclip,
  Play,
  Search,
  SendHorizonal,
  Share2,
  Sparkles,
  SquareTerminal,
  Stethoscope,
  WandSparkles,
} from "lucide-react";

type RunStep = {
  title: string;
  detail: string;
  time: string;
  status: "done" | "running" | "next";
};

const sideItems = [
  "双抗内化研究项目",
  "EGFR 抗体优化",
  "内化特征关联分析",
  "双抗内化功能预测模型",
  "CDR 区域内化影响评估",
];

const primaryNav = [
  { label: "工作台", icon: PanelLeft },
  { label: "任务", icon: Sparkles },
  { label: "实验", icon: FlaskConical },
  { label: "资源", icon: FolderOpen },
];

const starterPrompts = [
  "基于上传的实验数据，分析哪些特征影响双抗内化率，并输出预测模型。",
  "模拟 150 条双抗数据，完成 EDA、特征重要性分析和模型评估。",
  "比较 HER2×CD3 与 EGFR×CD3 在内化率上的差异，并给出实验建议。",
];

const runSteps: RunStep[] = [
  {
    title: "生成模拟数据集",
    detail: "建立 150 条记录，补齐靶点表达、结合动力学、连接区柔性等关键字段。",
    time: "4s",
    status: "done",
  },
  {
    title: "探索性数据分析（EDA）",
    detail: "检查分布、相关性与离群点，确认 KD 与内化率、共定位与内化率的关系。",
    time: "19s",
    status: "running",
  },
  {
    title: "特征重要性分析",
    detail: "结合 SHAP 与随机森林重要性，提取最值得纳入解释的变量。",
    time: "32s",
    status: "next",
  },
  {
    title: "构建预测模型",
    detail: "训练 XGBoost / RF / SVM 并比较效果，形成推荐模型。",
    time: "1m27s",
    status: "next",
  },
];

const outputs = [
  { name: "bsab_internalization_dataset.csv", meta: "数据集 · 28.5 KB", icon: Database },
  { name: "fig2_correlation_heatmap.png", meta: "热图 · 293 KB", icon: BarChart3 },
  { name: "eda_report.json", meta: "结构化报告 · 6.1 KB", icon: FileText },
  { name: "model_comparison.xlsx", meta: "模型对比表 · 43 KB", icon: FileSpreadsheet },
];

const guidance = [
  {
    title: "如何开始",
    detail: "先在输入区描述任务，或直接点击下方示例任务生成一条标准指令。",
    icon: WandSparkles,
  },
  {
    title: "执行中看哪里",
    detail: "中间看对话与执行日志，右侧看计划、当前步骤和已生成文件。",
    icon: SquareTerminal,
  },
  {
    title: "结果出来后做什么",
    detail: "先看总结卡，再打开文件列表，最后继续追问让 Agent 深挖。",
    icon: Lightbulb,
  },
];

const statusClass = {
  done: "bg-[rgba(23,36,216,0.08)] text-[#161FAD] border-[rgba(23,36,216,0.14)]",
  running: "bg-[rgba(255,201,151,0.25)] text-[#8a5216] border-[rgba(255,201,151,0.45)]",
  next: "bg-white text-slate-500 border-slate-200",
};

const statusText = {
  done: "完成",
  running: "执行中",
  next: "待执行",
};

export default function Home() {
  return (
    <div className="ailux-shell min-h-screen overflow-hidden bg-[radial-gradient(circle_at_top_left,rgba(132,140,254,0.16),transparent_24%),linear-gradient(180deg,#f7f9ff_0%,#eef3ff_100%)] text-slate-900">
      <div className="absolute inset-0 pointer-events-none bg-[linear-gradient(90deg,rgba(7,2,97,0.03)_1px,transparent_1px),linear-gradient(rgba(7,2,97,0.03)_1px,transparent_1px)] bg-[size:30px_30px] opacity-30" />

      <div className="relative grid min-h-screen grid-cols-1 xl:grid-cols-[76px_240px_minmax(0,1fr)]">
        <aside className="hidden border-r border-white/50 bg-[linear-gradient(180deg,rgba(255,255,255,0.92),rgba(245,248,255,0.82))] px-3 py-5 backdrop-blur xl:flex xl:flex-col xl:items-center xl:gap-5">
          <div className="flex h-12 w-12 items-center justify-center rounded-[18px] bg-[#070261] text-white shadow-[0_18px_40px_rgba(7,2,97,0.28)]">
            <Bot className="h-6 w-6" />
          </div>
          <div className="mt-4 flex flex-1 flex-col items-center gap-2">
            {primaryNav.map((item, index) => {
              const Icon = item.icon;
              const active = index === 0;
              return (
                <button
                  key={item.label}
                  className={`group flex w-full flex-col items-center gap-2 rounded-2xl px-2 py-3 text-[11px] font-medium transition ${
                    active
                      ? "bg-[linear-gradient(180deg,rgba(23,36,216,0.12),rgba(132,140,254,0.14))] text-[#161FAD]"
                      : "text-slate-500 hover:bg-white/80 hover:text-slate-900"
                  }`}
                >
                  <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white/80 shadow-sm transition group-hover:-translate-y-0.5">
                    <Icon className="h-4 w-4" />
                  </span>
                  <span>{item.label}</span>
                </button>
              );
            })}
          </div>
        </aside>

        <aside className="hidden border-r border-white/50 bg-white/72 px-5 py-5 backdrop-blur xl:flex xl:flex-col">
          <div className="mb-6 flex items-center justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.22em] text-slate-400">Ailux Agent</p>
              <h1 className="mt-2 text-[22px] font-semibold tracking-tight text-[#070261]">智能体工作台</h1>
            </div>
            <button className="rounded-2xl border border-slate-200 bg-white p-2 text-slate-500 shadow-sm transition hover:text-[#161FAD]">
              <PanelLeft className="h-4 w-4" />
            </button>
          </div>

          <Button className="mb-5 h-11 justify-start rounded-2xl bg-[#161FAD] px-4 text-white shadow-[0_18px_32px_rgba(22,31,173,0.24)] hover:bg-[#1724D8]">
            <Sparkles className="mr-2 h-4 w-4" />
            新建 Agent 任务
          </Button>

          <div className="mb-3 flex items-center justify-between">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">最近项目</p>
            <span className="text-xs text-slate-300">+</span>
          </div>
          <div className="space-y-2">
            {sideItems.map((item, index) => {
              const active = item === "双抗内化功能预测模型";
              return (
                <button
                  key={item}
                  className={`w-full rounded-2xl px-3 py-3 text-left transition ${
                    active
                      ? "border border-[rgba(23,36,216,0.10)] bg-[linear-gradient(180deg,rgba(255,255,255,0.96),rgba(239,243,255,0.92))] shadow-[0_18px_36px_rgba(23,36,216,0.08)]"
                      : "bg-transparent hover:bg-white/78"
                  }`}
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <p className={`truncate text-sm ${active ? "font-semibold text-[#070261]" : "text-slate-600"}`}>{item}</p>
                      <p className="mt-1 text-xs text-slate-400">{index < 2 ? "当前项目" : "3w ago"}</p>
                    </div>
                    {active ? <span className="rounded-full bg-[rgba(255,201,151,0.28)] px-2 py-1 text-[10px] font-medium text-[#9a5a1a]">运行中</span> : null}
                  </div>
                </button>
              );
            })}
          </div>

          <div className="mt-auto rounded-[28px] border border-white/70 bg-[linear-gradient(180deg,rgba(7,2,97,0.96),rgba(22,31,173,0.92))] p-4 text-white shadow-[0_24px_48px_rgba(7,2,97,0.26)]">
            <p className="text-xs uppercase tracking-[0.2em] text-white/55">Agent flow</p>
            <p className="mt-2 text-sm leading-6 text-white/86">
              这一版把首页重点改成“如何发起任务、如何跟踪执行、如何消费结果”，让首次用户也能顺着界面完成一次完整交互。
            </p>
          </div>
        </aside>

        <main className="min-w-0 px-4 py-4 md:px-5 xl:px-6 xl:py-5">
          <div className="flex h-full flex-col rounded-[30px] border border-white/70 bg-white/72 shadow-[0_28px_80px_rgba(17,24,39,0.08)] backdrop-blur">
            <header className="flex flex-wrap items-start justify-between gap-5 border-b border-slate-200/70 px-5 py-4 md:px-6">
              <div className="min-w-0 flex-1">
                <div className="mb-3 flex flex-wrap items-center gap-2 text-xs text-slate-500">
                  <span className="rounded-full bg-[rgba(23,36,216,0.08)] px-3 py-1 font-medium text-[#161FAD]">Agent Workspace</span>
                  <span className="rounded-full bg-[rgba(132,140,254,0.14)] px-3 py-1 text-[#4f59d3]">Biotech Reasoning Interface</span>
                </div>
                <h2 className="text-[24px] font-semibold tracking-tight text-[#070261] md:text-[28px]">先提任务，再看 Agent 如何执行</h2>
                <p className="mt-2 max-w-3xl text-sm leading-7 text-slate-600">
                  我把首屏改成更明确的 Agent 交互路径：顶部直接告诉用户怎么开始，中间以输入与对话为主，右侧持续显示计划、状态与产出，让整个产品的使用方式更直观。
                </p>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Button variant="outline" className="h-10 rounded-2xl border-slate-200 bg-white/70 px-4 text-slate-700 hover:bg-white">
                  <Share2 className="mr-2 h-4 w-4" />分享
                </Button>
                <Button className="h-10 rounded-2xl bg-[#161FAD] px-4 text-white shadow-[0_14px_28px_rgba(22,31,173,0.22)] hover:bg-[#1724D8]">
                  <Play className="mr-2 h-4 w-4" />运行当前任务
                </Button>
              </div>
            </header>

            <div className="grid min-h-0 flex-1 gap-4 p-4 md:p-5 xl:grid-cols-[minmax(0,1fr)_340px]">
              <section className="min-h-0 space-y-4">
                <div className="relative overflow-hidden rounded-[28px] border border-[rgba(23,36,216,0.08)] bg-[#070261] p-5 text-white shadow-[0_30px_60px_rgba(7,2,97,0.26)] md:p-6">
                  <img
                    src="https://d2xsxph8kpxj0f.cloudfront.net/310519663553223948/9Go2FLz3jbkZPo7DBzKuK5/ailux-hero-bio-grid-7nnF6d9BhqXaVefvNoZKif.webp"
                    alt="Ailux 品牌化科研背景"
                    className="absolute inset-0 h-full w-full object-cover opacity-38"
                  />
                  <div className="absolute inset-x-0 top-0 h-1 bg-[linear-gradient(90deg,#1928FB_0%,#848CFE_68%,#FFC997_100%)]" />
                  <div className="relative space-y-5">
                    <div className="flex flex-wrap items-center gap-2 text-xs text-white/72">
                      <span className="rounded-full border border-white/14 bg-white/10 px-3 py-1">Ailux Agent</span>
                      <span className="rounded-full border border-white/14 bg-white/10 px-3 py-1">任务发起区</span>
                    </div>

                    <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_280px]">
                      <div className="space-y-4">
                        <div>
                          <h3 className="text-[22px] font-semibold tracking-tight text-white">告诉 Agent 你要完成什么</h3>
                          <p className="mt-2 max-w-2xl text-sm leading-7 text-white/78">
                            适合直接输入研究目标、上传数据说明或指定分析流程。你不需要先理解所有模块，只需要从一条任务描述开始。
                          </p>
                        </div>

                        <div className="rounded-[26px] border border-white/12 bg-white/10 p-3 backdrop-blur">
                          <textarea
                            className="min-h-[120px] w-full resize-none border-0 bg-transparent px-2 py-2 text-sm leading-7 text-white outline-none placeholder:text-white/45"
                            placeholder="例如：请基于上传的实验数据，分析哪些分子特征影响双抗内化率，构建预测模型，并输出可视化与实验建议。"
                          />
                          <div className="mt-3 flex flex-wrap items-center justify-between gap-3 border-t border-white/10 pt-3">
                            <div className="flex items-center gap-2 text-white/70">
                              <button className="rounded-2xl bg-white/10 p-2 transition hover:bg-white/16"><Paperclip className="h-4 w-4" /></button>
                              <button className="rounded-2xl bg-white/10 p-2 transition hover:bg-white/16"><Database className="h-4 w-4" /></button>
                              <button className="rounded-2xl bg-white/10 p-2 transition hover:bg-white/16"><Search className="h-4 w-4" /></button>
                            </div>
                            <Button className="h-11 rounded-2xl bg-[#FFC997] px-5 text-[#5d3b14] shadow-[0_14px_28px_rgba(255,201,151,0.34)] hover:bg-[#ffbd7b]">
                              启动 Agent
                              <SendHorizonal className="ml-2 h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </div>

                      <div className="rounded-[26px] border border-white/14 bg-white/10 p-4 backdrop-blur">
                        <img
                          src="https://d2xsxph8kpxj0f.cloudfront.net/310519663553223948/9Go2FLz3jbkZPo7DBzKuK5/ailux-panel-ribbon-ktJxcsugSbu6jUffCMwjxY.webp"
                          alt="Ailux 品牌化流线"
                          className="h-16 w-full rounded-2xl object-cover opacity-90"
                        />
                        <div className="mt-4 space-y-3">
                          {guidance.map((item) => {
                            const Icon = item.icon;
                            return (
                              <div key={item.title} className="rounded-2xl border border-white/10 bg-white/10 p-3">
                                <div className="flex items-center gap-2 text-sm font-medium text-white">
                                  <Icon className="h-4 w-4 text-[#FFC997]" />
                                  {item.title}
                                </div>
                                <p className="mt-2 text-sm leading-6 text-white/72">{item.detail}</p>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="rounded-[28px] border border-slate-200/80 bg-[linear-gradient(180deg,#ffffff_0%,#f8faff_100%)] p-4 shadow-[0_20px_50px_rgba(15,23,42,0.05)] md:p-5">
                  <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <p className="text-xs uppercase tracking-[0.18em] text-slate-400">建议起步方式</p>
                      <h3 className="mt-1 text-lg font-semibold tracking-tight text-[#070261]">示例任务</h3>
                    </div>
                    <div className="inline-flex items-center gap-2 rounded-full bg-[rgba(132,140,254,0.12)] px-3 py-1 text-xs font-medium text-[#4f59d3]">
                      <Sparkles className="h-3.5 w-3.5" />一键生成标准任务描述
                    </div>
                  </div>
                  <div className="grid gap-3 lg:grid-cols-3">
                    {starterPrompts.map((prompt) => (
                      <button
                        key={prompt}
                        className="rounded-[22px] border border-slate-200 bg-white px-4 py-4 text-left transition hover:-translate-y-0.5 hover:border-[rgba(23,36,216,0.18)] hover:shadow-[0_16px_36px_rgba(15,23,42,0.06)]"
                      >
                        <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-2xl bg-[rgba(23,36,216,0.08)] text-[#161FAD]">
                          <Atom className="h-4 w-4" />
                        </div>
                        <p className="text-sm leading-7 text-slate-700">{prompt}</p>
                        <div className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-[#161FAD]">
                          使用这个任务
                          <ArrowRight className="h-4 w-4" />
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid gap-4 2xl:grid-cols-[minmax(0,1.15fr)_0.85fr]">
                  <div className="rounded-[28px] border border-slate-200/80 bg-white p-4 shadow-[0_20px_50px_rgba(15,23,42,0.05)] md:p-5">
                    <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Conversation 对话</p>
                        <h3 className="mt-1 text-lg font-semibold tracking-tight text-[#070261]">当前任务对话</h3>
                      </div>
                      <div className="inline-flex items-center gap-2 rounded-full bg-[rgba(23,36,216,0.08)] px-3 py-1 text-xs font-medium text-[#161FAD]">
                        <Bot className="h-3.5 w-3.5" />Agent 正在推进任务
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div className="flex justify-end">
                        <div className="max-w-3xl rounded-[24px] bg-[#1724D8] px-5 py-4 text-sm leading-7 text-white shadow-[0_18px_40px_rgba(23,36,216,0.24)]">
                          现在模拟一轮双抗内化研究流程：生成假数据，分析关键特征，建立预测模型，并给出后续实验建议。
                        </div>
                      </div>

                      <div className="flex gap-3">
                        <div className="mt-1 flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-[rgba(23,36,216,0.08)] text-[#161FAD]">
                          <BrainCircuit className="h-5 w-5" />
                        </div>
                        <div className="min-w-0 flex-1 rounded-[26px] border border-slate-200 bg-[linear-gradient(180deg,#ffffff_0%,#fbfcff_100%)] p-5 shadow-[0_12px_32px_rgba(15,23,42,0.05)]">
                          <p className="text-sm font-semibold text-[#070261]">Agent 已理解你的目标，并准备按以下路径执行：</p>
                          <div className="mt-4 grid gap-3 text-sm leading-6 text-slate-600 md:grid-cols-2">
                            <div className="rounded-2xl bg-slate-50 px-4 py-3">先生成模拟数据，保证任务能完整演示。</div>
                            <div className="rounded-2xl bg-slate-50 px-4 py-3">再做 EDA，确认关键变量和异常值。</div>
                            <div className="rounded-2xl bg-slate-50 px-4 py-3">随后提取特征重要性并比较多种模型。</div>
                            <div className="rounded-2xl bg-slate-50 px-4 py-3">最后输出结论摘要、文件和后续实验建议。</div>
                          </div>
                        </div>
                      </div>

                      <div className="flex gap-3">
                        <div className="mt-1 flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-[rgba(255,201,151,0.22)] text-[#8a5216]">
                          <LoaderCircle className="h-5 w-5 animate-spin" />
                        </div>
                        <div className="min-w-0 flex-1 rounded-[26px] border border-[rgba(255,201,151,0.35)] bg-[linear-gradient(180deg,rgba(255,201,151,0.12),#ffffff)] p-5 shadow-[0_12px_32px_rgba(255,201,151,0.15)]">
                          <p className="text-sm font-semibold text-slate-900">执行中：正在完成探索性数据分析（EDA）</p>
                          <p className="mt-2 text-sm leading-7 text-slate-600">
                            当前已完成数据集生成，正在分析分布、相关性矩阵与内化率变化。右侧可以同步看到计划进度和已生成文件。
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="rounded-[28px] border border-slate-200/80 bg-white p-4 shadow-[0_20px_50px_rgba(15,23,42,0.05)] md:p-5">
                    <div className="mb-4 flex items-center justify-between">
                      <div>
                        <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Result summary</p>
                        <h3 className="mt-1 text-lg font-semibold tracking-tight text-[#070261]">当前阶段产出</h3>
                      </div>
                      <Stethoscope className="h-4 w-4 text-[#848CFE]" />
                    </div>

                    <div className="space-y-3">
                      {[
                        ["数据状态", "已生成 150 条双抗样本记录，可继续用于特征筛查与建模。"],
                        ["初步发现", "KD 与内化率呈负相关，靶点共定位可能是重要驱动因素。"],
                        ["下一步动作", "等待特征重要性完成后输出 SHAP 解读与模型建议。"],
                      ].map(([title, detail]) => (
                        <div key={title} className="rounded-2xl bg-slate-50 px-4 py-3">
                          <p className="text-sm font-semibold text-slate-800">{title}</p>
                          <p className="mt-1 text-sm leading-6 text-slate-500">{detail}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </section>

              <aside className="min-h-0 space-y-4">
                <section className="rounded-[28px] border border-slate-200/80 bg-white p-4 shadow-[0_20px_50px_rgba(15,23,42,0.05)] md:p-5">
                  <div className="mb-4 flex items-center justify-between">
                    <div>
                      <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Execution 执行状态</p>
                      <h3 className="mt-1 text-lg font-semibold tracking-tight text-[#070261]">Agent 当前在做什么</h3>
                    </div>
                    <div className="rounded-full bg-[rgba(255,201,151,0.22)] px-3 py-1 text-xs font-medium text-[#8a5216]">第 2 / 4 步</div>
                  </div>
                  <div className="mb-4 h-2 rounded-full bg-slate-100">
                    <div className="h-2 w-1/2 rounded-full bg-[linear-gradient(90deg,#161FAD_0%,#848CFE_75%,#FFC997_100%)]" />
                  </div>
                  <div className="space-y-3">
                    {runSteps.map((step) => (
                      <article key={step.title} className="rounded-[22px] border border-slate-100 bg-[linear-gradient(180deg,#ffffff_0%,#f9fbff_100%)] p-4">
                        <div className="flex items-start gap-3">
                          <div className={`mt-0.5 flex h-9 w-9 items-center justify-center rounded-full border ${statusClass[step.status]}`}>
                            <CircleCheckBig className="h-4 w-4" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center justify-between gap-3">
                              <p className="text-sm font-semibold text-slate-800">{step.title}</p>
                              <span className="text-xs text-slate-400">{step.time}</span>
                            </div>
                            <p className="mt-1 text-xs leading-5 text-slate-500">{step.detail}</p>
                            <div className={`mt-2 inline-flex rounded-full border px-2.5 py-1 text-[11px] font-medium ${statusClass[step.status]}`}>
                              {statusText[step.status]}
                            </div>
                          </div>
                        </div>
                      </article>
                    ))}
                  </div>
                </section>

                <section className="rounded-[28px] border border-slate-200/80 bg-white p-4 shadow-[0_20px_50px_rgba(15,23,42,0.05)] md:p-5">
                  <div className="mb-4 flex items-center justify-between">
                    <div>
                      <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Outputs 输出</p>
                      <h3 className="mt-1 text-lg font-semibold tracking-tight text-[#070261]">已生成文件</h3>
                    </div>
                    <FolderOpen className="h-4 w-4 text-slate-400" />
                  </div>

                  <div className="mb-4 rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2">
                    <div className="flex items-center gap-2 text-slate-400">
                      <Search className="h-4 w-4" />
                      <input className="w-full border-0 bg-transparent text-sm outline-none placeholder:text-slate-400" placeholder="搜索文件或结果..." />
                    </div>
                  </div>

                  <div className="space-y-2.5">
                    {outputs.map((file) => {
                      const Icon = file.icon;
                      return (
                        <button
                          key={file.name}
                          className="flex w-full items-start gap-3 rounded-[20px] border border-slate-100 bg-[linear-gradient(180deg,#ffffff_0%,#fbfcff_100%)] px-3 py-3 text-left transition hover:-translate-y-0.5 hover:border-[rgba(23,36,216,0.14)] hover:shadow-[0_14px_28px_rgba(15,23,42,0.05)]"
                        >
                          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[rgba(23,36,216,0.08)] text-[#161FAD]">
                            <Icon className="h-4 w-4" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-medium text-slate-800">{file.name}</p>
                            <div className="mt-1 flex items-center gap-2 text-xs text-slate-400">
                              <span>{file.meta}</span>
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </section>

                <section className="rounded-[28px] border border-slate-200/80 bg-[linear-gradient(180deg,#070261_0%,#161FAD_100%)] p-5 text-white shadow-[0_24px_48px_rgba(7,2,97,0.28)]">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-xs uppercase tracking-[0.18em] text-white/50">Follow-up</p>
                      <h3 className="mt-2 text-lg font-semibold">下一步你可以这样做</h3>
                    </div>
                    <Sparkles className="h-5 w-5 text-white/70" />
                  </div>
                  <div className="mt-4 space-y-3 text-sm leading-6 text-white/82">
                    <div className="rounded-2xl border border-white/10 bg-white/8 px-4 py-3">打开结果文件，查看热图、数据集和模型对比表。</div>
                    <div className="rounded-2xl border border-white/10 bg-white/8 px-4 py-3">继续追加追问，例如“把 HER2×CD3 加进对照组重新分析”。</div>
                    <div className="rounded-2xl border border-white/10 bg-white/8 px-4 py-3">如果有真实数据，可以直接在输入区补充文件并重新运行。 </div>
                  </div>
                </section>
              </aside>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
