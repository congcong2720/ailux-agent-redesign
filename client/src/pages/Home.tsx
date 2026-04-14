/*
Design reminder for this file:
- Philosophy: Post-minimal bio-computing workspace
- Keep Biomni-like information architecture, but shift to a more layered central workbench
- Use deep brand blues as structure, peach only for key actions, lilac for metadata
- Favor soft planes, timelines, and nested panels over uniform bordered boxes
*/
import { Button } from "@/components/ui/button";
import {
  Activity,
  BarChart3,
  Beaker,
  Bot,
  BrainCircuit,
  ChevronRight,
  CircleCheckBig,
  Clock3,
  Command,
  Database,
  Download,
  FileText,
  FlaskConical,
  FolderOpen,
  Layers3,
  Microscope,
  MoreHorizontal,
  Paperclip,
  PanelLeft,
  Search,
  SendHorizonal,
  Share2,
  Sparkles,
} from "lucide-react";

type StepItem = {
  id: string;
  title: string;
  detail: string;
  duration: string;
  status: "done" | "running" | "queued";
};

const primaryNav = [
  { label: "工作台", icon: PanelLeft, active: true },
  { label: "任务", icon: Command },
  { label: "实验", icon: FlaskConical },
  { label: "资源", icon: FolderOpen },
];

const projectGroups = [
  {
    heading: "项目",
    items: [
      "双抗内化研究项目",
      "EGFR 抗体优化",
      "内化特征关联分析",
    ],
  },
  {
    heading: "所有任务",
    items: [
      "双抗内化功能预测模型",
      "内化特征相关性分析",
      "CDR 区域内化影响评估",
      "EGFR 亲和力成熟化",
    ],
  },
];

const metricCards = [
  { label: "样本规模", value: "150", note: "双抗分子记录" },
  { label: "特征维度", value: "20", note: "靶点、柔性、结合能力" },
  { label: "候选模型", value: "6", note: "XGBoost / RF / SVM" },
  { label: "当前阶段", value: "EDA", note: "相关性与重要性提取" },
];

const steps: StepItem[] = [
  {
    id: "01",
    title: "生成模拟实验数据集",
    detail: "构建 150 个双抗分子记录，覆盖靶点生物学、结合动力学、抗体工程学与细胞生物学等 4 类关键特征。",
    duration: "4s",
    status: "done",
  },
  {
    id: "02",
    title: "探索性数据分析（EDA）",
    detail: "对内化评分分布、关键变量相关性与聚类趋势进行初筛，确认 KD 与内化率、靶点共定位与内化率的主要关系。",
    duration: "19s",
    status: "running",
  },
  {
    id: "03",
    title: "特征重要性分析",
    detail: "使用 SHAP 与随机森林 MDI 联合识别决定性变量，突出靶点生物学特征与连接区柔性的解释价值。",
    duration: "32s",
    status: "queued",
  },
  {
    id: "04",
    title: "构建预测模型",
    detail: "训练并比较多个机器学习模型，对双抗内化功能进行预测，并准备后续阈值建议。",
    duration: "1m27s",
    status: "queued",
  },
  {
    id: "05",
    title: "模型评估与可视化",
    detail: "输出 ROC、学习曲线、特征贡献与误差分布图，用于设计建议的可信审阅。",
    duration: "25s",
    status: "queued",
  },
  {
    id: "06",
    title: "生物学解释与总结",
    detail: "形成设计准则、推荐阈值与实验验证建议，沉淀为可复用的任务模板。",
    duration: "16s",
    status: "queued",
  },
];

const files = [
  { name: "bsab_internalization_dataset.csv", size: "28.5 KB", tag: "数据集" },
  { name: "data_summary.json", size: "3.2 KB", tag: "摘要" },
  { name: "fig1_distribution.png", size: "142 KB", tag: "可视化" },
  { name: "fig2_correlation_heatmap.png", size: "293 KB", tag: "热图" },
  { name: "fig3_scatter_matrix.png", size: "319 KB", tag: "散点" },
  { name: "eda_report.json", size: "6.1 KB", tag: "报告" },
];

const statusTone = {
  done: "bg-[rgba(23,36,216,0.08)] text-[#161FAD] border-[rgba(23,36,216,0.14)]",
  running: "bg-[rgba(132,140,254,0.16)] text-[#161FAD] border-[rgba(132,140,254,0.34)]",
  queued: "bg-white text-slate-500 border-slate-200",
};

const statusText = {
  done: "已完成",
  running: "处理中",
  queued: "排队中",
};

export default function Home() {
  return (
    <div className="ailux-shell min-h-screen overflow-hidden bg-[radial-gradient(circle_at_top_left,rgba(132,140,254,0.18),transparent_26%),linear-gradient(180deg,#f7f9ff_0%,#eef3ff_100%)] text-slate-900">
      <div className="absolute inset-0 pointer-events-none bg-[linear-gradient(90deg,rgba(7,2,97,0.03)_1px,transparent_1px),linear-gradient(rgba(7,2,97,0.03)_1px,transparent_1px)] bg-[size:30px_30px] opacity-40" />

      <div className="relative grid min-h-screen grid-cols-1 xl:grid-cols-[72px_220px_minmax(0,1fr)_300px] 2xl:grid-cols-[76px_240px_minmax(0,1fr)_340px]">
        <aside className="hidden border-r border-white/50 bg-[linear-gradient(180deg,rgba(255,255,255,0.9),rgba(245,248,255,0.82))] px-3 py-5 backdrop-blur xl:flex xl:flex-col xl:items-center xl:gap-5">
          <div className="flex h-12 w-12 items-center justify-center rounded-[18px] bg-[#070261] text-white shadow-[0_18px_40px_rgba(7,2,97,0.28)]">
            <Bot className="h-6 w-6" />
          </div>
          <div className="mt-4 flex flex-1 flex-col items-center gap-2">
            {primaryNav.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.label}
                  className={`group flex w-full flex-col items-center gap-2 rounded-2xl px-2 py-3 text-[11px] font-medium transition ${
                    item.active
                      ? "bg-[linear-gradient(180deg,rgba(23,36,216,0.12),rgba(132,140,254,0.14))] text-[#161FAD] shadow-[inset_0_0_0_1px_rgba(23,36,216,0.08)]"
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
          <div className="rounded-2xl border border-white/60 bg-white/80 p-2 text-slate-500 shadow-sm">
            <Activity className="h-4 w-4" />
          </div>
        </aside>

        <aside className="hidden border-r border-white/50 bg-white/72 px-5 py-5 backdrop-blur xl:flex xl:flex-col">
          <div className="mb-6 flex items-center justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.22em] text-slate-400">Ailux Agent</p>
              <h1 className="mt-2 text-[22px] font-semibold tracking-tight text-[#070261]">双抗内化工作台</h1>
            </div>
            <button className="rounded-2xl border border-slate-200 bg-white p-2 text-slate-500 shadow-sm transition hover:text-[#161FAD]">
              <PanelLeft className="h-4 w-4" />
            </button>
          </div>

          <Button className="mb-5 h-11 justify-start rounded-2xl bg-[#161FAD] px-4 text-white shadow-[0_18px_32px_rgba(22,31,173,0.24)] hover:bg-[#1724D8]">
            <Sparkles className="mr-2 h-4 w-4" />
            新建任务
          </Button>

          {projectGroups.map((group) => (
            <section key={group.heading} className="mb-5">
              <div className="mb-2 flex items-center justify-between">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">{group.heading}</p>
                <span className="text-xs text-slate-300">+</span>
              </div>
              <div className="space-y-2">
                {group.items.map((item, index) => {
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
                          <p className="mt-1 text-xs text-slate-400">{index === 0 ? "当前项目" : "3w ago"}</p>
                        </div>
                        {active ? (
                          <span className="rounded-full bg-[rgba(255,201,151,0.28)] px-2 py-1 text-[10px] font-medium text-[#9a5a1a]">进行中</span>
                        ) : null}
                      </div>
                    </button>
                  );
                })}
              </div>
            </section>
          ))}

          <div className="mt-auto rounded-[28px] border border-white/70 bg-[linear-gradient(180deg,rgba(7,2,97,0.96),rgba(22,31,173,0.92))] p-4 text-white shadow-[0_24px_48px_rgba(7,2,97,0.26)]">
            <p className="text-xs uppercase tracking-[0.2em] text-white/55">Workspace pulse</p>
            <p className="mt-2 text-sm leading-6 text-white/86">
              当前工作流已切换到新的品牌化界面，保留原有字段结构，但强化了中心工作台与时间线感知。
            </p>
          </div>
        </aside>

        <main className="min-w-0 px-4 py-4 md:px-5 xl:px-6 xl:py-5">
          <div className="flex h-full flex-col rounded-[30px] border border-white/70 bg-white/72 shadow-[0_28px_80px_rgba(17,24,39,0.08)] backdrop-blur">
            <header className="flex flex-wrap items-start justify-between gap-5 border-b border-slate-200/70 px-5 py-4 md:px-6">
              <div className="min-w-0 flex-1">
                <div className="mb-3 flex flex-wrap items-center gap-2 text-xs text-slate-500">
                  <span className="rounded-full bg-[rgba(23,36,216,0.08)] px-3 py-1 font-medium text-[#161FAD]">Agent Workspace</span>
                  <span className="rounded-full bg-[rgba(132,140,254,0.14)] px-3 py-1 text-[#4f59d3]">Biospecific Internalization Prediction</span>
                </div>
                <h2 className="text-[24px] font-semibold tracking-tight text-[#070261] md:text-[28px]">双抗内化功能预测模型</h2>
                <p className="mt-2 max-w-3xl text-sm leading-7 text-slate-600">
                  保留现有任务字段和分析节奏，但通过新的工作台叙事、时间线视图与结果栈布局，让界面更贴近 Ailux 自身品牌，而不是 Biomni 的直接镜像。
                </p>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Button variant="outline" className="h-10 rounded-2xl border-slate-200 bg-white/70 px-4 text-slate-700 hover:bg-white">
                  <Share2 className="mr-2 h-4 w-4" />分享
                </Button>
                <Button className="h-10 rounded-2xl bg-[#161FAD] px-4 text-white shadow-[0_14px_28px_rgba(22,31,173,0.22)] hover:bg-[#1724D8]">
                  <Sparkles className="mr-2 h-4 w-4" />运行任务
                </Button>
              </div>
            </header>

            <div className="grid min-h-0 flex-1 gap-4 p-4 md:p-5 xl:grid-cols-[minmax(0,1fr)_300px] 2xl:grid-cols-[minmax(0,1fr)_340px]">
              <section className="min-h-0 space-y-4">
                <div className="relative overflow-hidden rounded-[28px] border border-[rgba(23,36,216,0.08)] bg-[#070261] p-5 text-white shadow-[0_30px_60px_rgba(7,2,97,0.26)] md:p-6">
                  <img
                    src="https://d2xsxph8kpxj0f.cloudfront.net/310519663553223948/9Go2FLz3jbkZPo7DBzKuK5/ailux-hero-bio-grid-7nnF6d9BhqXaVefvNoZKif.webp"
                    alt="Ailux 品牌化科研背景"
                    className="absolute inset-0 h-full w-full object-cover opacity-45"
                  />
                  <div className="absolute inset-x-0 top-0 h-1 bg-[linear-gradient(90deg,#1928FB_0%,#848CFE_68%,#FFC997_100%)]" />
                  <div className="relative">
                    <div className="mb-6 flex flex-wrap items-center gap-2 text-xs text-white/70">
                      <span className="rounded-full border border-white/14 bg-white/10 px-3 py-1">Ailux Research Flow</span>
                      <span className="rounded-full border border-white/14 bg-white/10 px-3 py-1">双抗内化分析</span>
                    </div>
                    <div className="grid gap-5 2xl:grid-cols-[minmax(0,1.3fr)_minmax(260px,0.7fr)]">
                      <div>
                        <div className="inline-flex max-w-3xl rounded-[24px] bg-white/10 px-4 py-3 text-sm leading-7 text-white shadow-[inset_0_0_0_1px_rgba(255,255,255,0.1)] backdrop-blur">
                          现在模拟一轮双抗内化研究流程：生成假数据，分析关键特征，建立预测模型，并给出后续实验建议。
                        </div>
                        <div className="mt-4 rounded-[24px] bg-white px-5 py-5 text-slate-900 shadow-[0_18px_50px_rgba(3,7,18,0.18)]">
                          <div className="mb-3 flex items-center gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[rgba(23,36,216,0.10)] text-[#161FAD]">
                              <BrainCircuit className="h-5 w-5" />
                            </div>
                            <div>
                              <p className="text-sm font-semibold text-[#070261]">执行摘要</p>
                              <p className="text-xs text-slate-500">围绕数据生成、EDA、解释性建模与建议输出构建完整闭环</p>
                            </div>
                          </div>
                            <div className="grid gap-3 text-sm leading-6 text-slate-600 md:grid-cols-2">
                            <div className="rounded-2xl bg-slate-50 px-4 py-3">生成模拟数据并补齐关键实验特征。</div>
                            <div className="rounded-2xl bg-slate-50 px-4 py-3">完成 EDA 与相关性筛查。</div>
                            <div className="rounded-2xl bg-slate-50 px-4 py-3">提取可解释的重要性变量。</div>
                            <div className="rounded-2xl bg-slate-50 px-4 py-3">输出模型、图表与实验建议。</div>
                          </div>
                        </div>
                      </div>

                      <div className="flex flex-col gap-3 rounded-[26px] border border-white/14 bg-white/10 p-4 backdrop-blur">
                        <img
                          src="https://d2xsxph8kpxj0f.cloudfront.net/310519663553223948/9Go2FLz3jbkZPo7DBzKuK5/ailux-panel-ribbon-ktJxcsugSbu6jUffCMwjxY.webp"
                          alt="Ailux 品牌化流线"
                          className="h-16 w-full rounded-2xl object-cover opacity-90"
                        />
                        <div className="grid grid-cols-2 gap-3">
                          {metricCards.map((metric) => (
                            <div key={metric.label} className="rounded-2xl border border-white/12 bg-white/12 p-3">
                              <p className="text-[11px] uppercase tracking-[0.16em] text-white/58">{metric.label}</p>
                              <p className="mt-2 text-2xl font-semibold text-white">{metric.value}</p>
                              <p className="mt-1 text-xs leading-5 text-white/72">{metric.note}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="grid gap-4 2xl:grid-cols-[minmax(0,1fr)_320px]">
                  <div className="rounded-[28px] border border-slate-200/80 bg-[linear-gradient(180deg,#ffffff_0%,#f8faff_100%)] p-4 shadow-[0_20px_50px_rgba(15,23,42,0.05)] md:p-5">
                    <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <p className="text-xs uppercase tracking-[0.18em] text-slate-400">执行轨迹</p>
                        <h3 className="mt-1 text-lg font-semibold tracking-tight text-[#070261]">分阶段工作流</h3>
                      </div>
                      <div className="inline-flex items-center gap-2 rounded-full bg-[rgba(255,201,151,0.24)] px-3 py-1 text-xs font-medium text-[#9a5a1a]">
                        <Clock3 className="h-3.5 w-3.5" />当前在第 2 步
                      </div>
                    </div>

                    <div className="space-y-3">
                      {steps.map((step, index) => (
                        <article
                          key={step.id}
                          className={`group grid gap-4 rounded-[24px] border p-4 transition md:grid-cols-[64px_minmax(0,1fr)_96px] ${
                            step.status === "running"
                              ? "border-[rgba(132,140,254,0.35)] bg-[linear-gradient(180deg,rgba(132,140,254,0.14),rgba(255,255,255,0.9))] shadow-[0_16px_40px_rgba(132,140,254,0.16)]"
                              : "border-slate-200 bg-white hover:-translate-y-0.5 hover:shadow-[0_18px_40px_rgba(15,23,42,0.06)]"
                          }`}
                        >
                          <div className="flex items-start gap-3 md:block">
                            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[linear-gradient(180deg,#edf1ff,#ffffff)] text-sm font-semibold text-[#161FAD] shadow-[inset_0_0_0_1px_rgba(23,36,216,0.08)]">
                              {step.id}
                            </div>
                            {index < steps.length - 1 ? <div className="ml-6 mt-2 hidden h-full min-h-10 w-px bg-[linear-gradient(180deg,rgba(23,36,216,0.22),rgba(132,140,254,0.04))] md:block" /> : null}
                          </div>

                          <div>
                            <div className="flex flex-wrap items-center gap-2">
                              <h4 className="text-base font-semibold text-slate-900">{step.title}</h4>
                              <span className={`rounded-full border px-2.5 py-1 text-[11px] font-medium ${statusTone[step.status]}`}>{statusText[step.status]}</span>
                            </div>
                            <p className="mt-2 text-sm leading-6 text-slate-600">{step.detail}</p>
                          </div>

                          <div className="flex flex-row items-center justify-between gap-3 md:flex-col md:items-end md:justify-center">
                            <span className="text-sm font-medium text-slate-400">{step.duration}</span>
                            <button className="inline-flex items-center gap-1 text-sm font-medium text-[#161FAD] transition group-hover:translate-x-0.5">
                              查看
                              <ChevronRight className="h-4 w-4" />
                            </button>
                          </div>
                        </article>
                      ))}
                    </div>
                  </div>

                  <div className="rounded-[28px] border border-slate-200/80 bg-white p-4 shadow-[0_20px_50px_rgba(15,23,42,0.05)] md:p-5">
                    <div className="mb-4 flex items-center justify-between">
                      <div>
                        <p className="text-xs uppercase tracking-[0.18em] text-slate-400">关键洞察</p>
                        <h3 className="mt-1 text-lg font-semibold tracking-tight text-[#070261]">模型提示</h3>
                      </div>
                      <Beaker className="h-4 w-4 text-[#848CFE]" />
                    </div>
                    <div className="space-y-3">
                      {[
                        ["内化率分布", "中位内化评分约 62.3%，KD 与内化率呈 Pearson r≈-0.68。"],
                        ["特征重要性", "靶点生物学特征贡献最大，其次为双价结合评分与连接区柔性。"],
                        ["建模建议", "先采用 XGBoost 与随机森林对比，再用 SHAP 输出可解释结论。"],
                      ].map(([title, detail]) => (
                        <div key={title} className="rounded-2xl bg-slate-50 px-4 py-3">
                          <p className="text-sm font-semibold text-slate-800">{title}</p>
                          <p className="mt-1 text-sm leading-6 text-slate-500">{detail}</p>
                        </div>
                      ))}
                    </div>
                    <div className="mt-4 rounded-[24px] border border-dashed border-[rgba(23,36,216,0.16)] bg-[linear-gradient(180deg,rgba(23,36,216,0.03),rgba(132,140,254,0.08))] p-4">
                      <div className="mb-2 flex items-center gap-2 text-sm font-medium text-[#161FAD]">
                        <Microscope className="h-4 w-4" />下一轮实验建议
                      </div>
                      <p className="text-sm leading-6 text-slate-600">
                        优先验证靶点表面表达定位与连接区柔性的联合作用，并将 HER2×CD3 作为额外对照组加入后续模拟中。
                      </p>
                    </div>
                  </div>
                </div>

                <div className="rounded-[28px] border border-slate-200/80 bg-white px-4 pb-4 pt-3 shadow-[0_20px_50px_rgba(15,23,42,0.05)] md:px-5">
                  <div className="mb-3 flex items-center justify-between border-b border-slate-100 pb-3">
                    <div>
                      <p className="text-xs uppercase tracking-[0.18em] text-slate-400">对话输入</p>
                      <h3 className="mt-1 text-base font-semibold text-[#070261]">继续追加分析问题</h3>
                    </div>
                    <div className="inline-flex items-center gap-2 rounded-full bg-[rgba(255,201,151,0.22)] px-3 py-1 text-xs text-[#9a5a1a]">
                      <Sparkles className="h-3.5 w-3.5" />建议使用结构化指令
                    </div>
                  </div>
                  <div className="rounded-[24px] border border-slate-200 bg-[linear-gradient(180deg,#ffffff_0%,#fbfcff_100%)] p-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.8)]">
                    <textarea
                      className="min-h-[96px] w-full resize-none border-0 bg-transparent px-2 py-2 text-sm leading-7 text-slate-700 outline-none placeholder:text-slate-400"
                      placeholder="例如：请基于当前结果，补充连接区长度与靶点共定位之间的交互分析，并输出新的可视化建议。"
                    />
                    <div className="mt-3 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-3">
                      <div className="flex items-center gap-2 text-slate-400">
                        <button className="rounded-2xl bg-slate-100 p-2 transition hover:bg-slate-200"><Paperclip className="h-4 w-4" /></button>
                        <button className="rounded-2xl bg-slate-100 p-2 transition hover:bg-slate-200"><Search className="h-4 w-4" /></button>
                        <button className="rounded-2xl bg-slate-100 p-2 transition hover:bg-slate-200"><Database className="h-4 w-4" /></button>
                      </div>
                      <Button className="h-11 rounded-2xl bg-[#FFC997] px-5 text-[#5d3b14] shadow-[0_14px_28px_rgba(255,201,151,0.34)] hover:bg-[#ffbd7b]">
                        发送到工作流
                        <SendHorizonal className="ml-2 h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              </section>

              <aside className="min-h-0 space-y-4">
                <section className="rounded-[28px] border border-slate-200/80 bg-white p-4 shadow-[0_20px_50px_rgba(15,23,42,0.05)] md:p-5">
                  <div className="mb-4 flex items-center justify-between">
                    <div>
                      <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Plan 计划</p>
                      <h3 className="mt-1 text-lg font-semibold tracking-tight text-[#070261]">推进时间线</h3>
                    </div>
                    <div className="text-sm font-semibold text-[#161FAD]">6 / 6</div>
                  </div>
                  <div className="mb-4 h-2 rounded-full bg-slate-100">
                    <div className="h-2 w-full rounded-full bg-[linear-gradient(90deg,#161FAD_0%,#848CFE_70%,#FFC997_100%)]" />
                  </div>
                  <div className="space-y-3">
                    {steps.map((step) => (
                      <div key={step.id} className="rounded-[22px] border border-slate-100 bg-[linear-gradient(180deg,#ffffff_0%,#f9fbff_100%)] p-4">
                        <div className="flex items-start gap-3">
                          <div className={`mt-0.5 flex h-8 w-8 items-center justify-center rounded-full ${step.status === "queued" ? "bg-slate-100 text-slate-400" : "bg-[rgba(23,36,216,0.10)] text-[#161FAD]"}`}>
                            <CircleCheckBig className="h-4 w-4" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center justify-between gap-3">
                              <p className="text-sm font-semibold text-slate-800">{step.title}</p>
                              <span className="text-xs text-slate-400">{step.duration}</span>
                            </div>
                            <p className="mt-1 text-xs leading-5 text-slate-500">{step.detail}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </section>

                <section className="rounded-[28px] border border-slate-200/80 bg-white p-4 shadow-[0_20px_50px_rgba(15,23,42,0.05)] md:p-5">
                  <div className="mb-4 flex items-center justify-between">
                    <div>
                      <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Results 结果</p>
                      <h3 className="mt-1 text-lg font-semibold tracking-tight text-[#070261]">输出文件栈</h3>
                    </div>
                    <div className="flex items-center gap-2 text-slate-400">
                      <Download className="h-4 w-4" />
                      <MoreHorizontal className="h-4 w-4" />
                    </div>
                  </div>
                  <div className="mb-4 rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2">
                    <div className="flex items-center gap-2 text-slate-400">
                      <Search className="h-4 w-4" />
                      <input className="w-full border-0 bg-transparent text-sm outline-none placeholder:text-slate-400" placeholder="Filter files..." />
                    </div>
                  </div>
                  <div className="mb-4 overflow-hidden rounded-[22px] border border-[rgba(23,36,216,0.08)] bg-[linear-gradient(180deg,rgba(23,36,216,0.03),rgba(132,140,254,0.03))]">
                    <div className="flex items-center justify-between px-4 py-3">
                      <div>
                        <p className="text-sm font-semibold text-[#070261]">当前结果摘要</p>
                        <p className="mt-1 text-xs leading-5 text-slate-500">来自探索性分析与模拟数据生成阶段</p>
                      </div>
                      <img
                        src="https://d2xsxph8kpxj0f.cloudfront.net/310519663553223948/9Go2FLz3jbkZPo7DBzKuK5/ailux-empty-state-orb-dXKJfL69bjRZJR6HbmyaUV.webp"
                        alt="计算生物学品牌插画"
                        className="h-16 w-16 object-contain"
                      />
                    </div>
                  </div>
                  <div className="space-y-2.5">
                    {files.map((file) => (
                      <button
                        key={file.name}
                        className="flex w-full items-start gap-3 rounded-[20px] border border-slate-100 bg-[linear-gradient(180deg,#ffffff_0%,#fbfcff_100%)] px-3 py-3 text-left transition hover:-translate-y-0.5 hover:border-[rgba(23,36,216,0.14)] hover:shadow-[0_14px_28px_rgba(15,23,42,0.05)]"
                      >
                        <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[rgba(23,36,216,0.08)] text-[#161FAD]">
                          {file.tag === "数据集" ? <Database className="h-4 w-4" /> : file.tag === "报告" ? <FileText className="h-4 w-4" /> : <BarChart3 className="h-4 w-4" />}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-medium text-slate-800">{file.name}</p>
                          <div className="mt-1 flex items-center gap-2 text-xs text-slate-400">
                            <span>{file.size}</span>
                            <span>·</span>
                            <span>{file.tag}</span>
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                </section>

                <section className="rounded-[28px] border border-slate-200/80 bg-[linear-gradient(180deg,#070261_0%,#161FAD_100%)] p-5 text-white shadow-[0_24px_48px_rgba(7,2,97,0.28)]">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-xs uppercase tracking-[0.18em] text-white/50">Brand distinction</p>
                      <h3 className="mt-2 text-lg font-semibold">与 Biomni 的差异点</h3>
                    </div>
                    <Layers3 className="h-5 w-5 text-white/70" />
                  </div>
                  <div className="mt-4 space-y-3 text-sm leading-6 text-white/82">
                    <div className="rounded-2xl border border-white/10 bg-white/8 px-4 py-3">中央区从“单一文档面”改成“对话摘要 + 执行轨迹 + 输入台”的双层工作台。</div>
                    <div className="rounded-2xl border border-white/10 bg-white/8 px-4 py-3">右侧栏采用堆叠式计划与结果卡，不再复制原始三栏比例与线性分割。</div>
                    <div className="rounded-2xl border border-white/10 bg-white/8 px-4 py-3">颜色完全回到 Ailux 品牌蓝系，并用桃色只强调关键按钮与提示。</div>
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
