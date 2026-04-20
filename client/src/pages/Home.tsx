/*
Design reminder for this file:
- Chosen philosophy: cinematic biotech futurism with a focused hero and restrained product storytelling
- The landing page should feel like an AiluxOS portal, not a generic SaaS template
- The primary conversion path is entering AiluxAgent, so CTA hierarchy must clearly favor the agent entry
- Use dark immersive layers, soft glows, and disciplined typography to echo the previous AiluxOS homepage without pixel-for-pixel copying
*/
import { Button } from "@/components/ui/button";
import { ArrowRight, ChevronDown, FlaskConical, Globe2, LockKeyhole, Orbit, Sparkles, Waypoints } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Link } from "wouter";

type Lang = "zh" | "en";

type LocalizedText = {
  zh: string;
  en: string;
};

const l = (zh: string, en: string): LocalizedText => ({ zh, en });
const pick = (lang: Lang, text: LocalizedText) => text[lang];

const navItems = [
  { label: l("Platform", "Platform"), href: "#platform" },
  { label: l("Applications", "Applications"), href: "#applications" },
  { label: l("Architecture", "Architecture"), href: "#architecture" },
];

const applicationCards = [
  {
    icon: Sparkles,
    eyebrow: "01",
    title: l("AiluxAgent", "AiluxAgent"),
    description: l(
      "面向抗体研发的 AI Agent，能够围绕研究目标组织任务、工具与结果文件，并形成可追踪的执行路径。",
      "An AI agent for antibody R&D that organizes tasks, tools, and result files into a traceable execution path.",
    ),
    points: [
      l("多步骤研究任务规划", "Multi-step research planning"),
      l("对话、计划、结果联动工作台", "Unified chat-plan-results workspace"),
      l("从首页一键进入 Agent", "Direct entry from the homepage"),
    ],
    primary: true,
  },
  {
    icon: Orbit,
    eyebrow: "02",
    title: l("LuxSight", "LuxSight"),
    description: l(
      "整合专利与抗体数据洞察能力，为项目早期筛选提供更快的情报判断。",
      "Integrates patent and antibody intelligence to accelerate early-stage research assessment.",
    ),
    points: [
      l("专利与表位信息洞察", "Patent and epitope intelligence"),
      l("数据挖掘视角更清晰", "Clearer data-mining workflows"),
      l("支持与 Agent 协同使用", "Designed to work with the agent"),
    ],
  },
  {
    icon: Waypoints,
    eyebrow: "03",
    title: l("AtlaX Data Foundation", "AtlaX Data Foundation"),
    description: l(
      "以数据底座承接结构、靶点与实验信号，为上层工具与应用提供统一语义基础。",
      "A data foundation that connects structure, target, and experimental signals to support upper-layer tools and applications.",
    ),
    points: [
      l("统一数据语义与资产视图", "Unified data semantics and asset views"),
      l("支撑模型与应用协作", "Supports model and application collaboration"),
      l("为结果解释提供上下文", "Provides context for result interpretation"),
    ],
  },
];

const architectureLayers = [
  {
    id: "01",
    title: l("应用层", "Application layer"),
    body: l("以 AiluxAgent 为核心入口，承接用户任务、对话与结果消费。", "Anchored by AiluxAgent as the main user entry for tasks, conversations, and result consumption."),
  },
  {
    id: "02",
    title: l("工具与技能层", "Tools & skills layer"),
    body: l("连接领域工具、模型能力与可组合工作流，支持复杂研发流程。", "Connects domain tools, model capabilities, and composable workflows for complex R&D processes."),
  },
  {
    id: "03",
    title: l("算力调度层", "Compute orchestration"),
    body: l("支持云端与私有部署场景下的弹性执行与任务编排。", "Supports elastic execution and task orchestration across cloud and private deployment scenarios."),
  },
  {
    id: "04",
    title: l("数据层", "Data layer"),
    body: l("以 AtlaX 为基础沉淀结构、实验与知识资产，提供统一上下文。", "Grounded in AtlaX to consolidate structural, experimental, and knowledge assets into one shared context."),
  },
];

const copy = {
  zh: {
    switcher: "中 / EN",
    login: "登录",
    heroEyebrow: "AI-NATIVE BIOPHARMA R&D OS",
    heroTitleTop: "AiluxOS",
    heroTitleMain: "Lighting the Path",
    heroTitleBottom: "to Cures",
    heroBody:
      "专为生物药研发打造的 AI 原生操作系统。整合 AiluxAgent、LuxSight 与 AtlaX 数据平台，以更清晰的任务组织与结果工作台缩短研发路径。",
    exploreAgent: "探索 AiluxAgent",
    loginPlatform: "登录平台",
    scrollHint: "向下了解平台能力",
    appEyebrow: "Core Applications",
    appTitle: "三大核心应用",
    appBody: "以 AiluxAgent 为主入口，串联情报、数据与工作流能力，形成更完整的研发操作界面。",
    architectureEyebrow: "Platform Architecture",
    architectureTitle: "四层架构，全栈覆盖",
    architectureBody: "从数据基础到智能应用，首页聚焦品牌与入口，Agent 工作台承接执行与结果分析。",
    agentPanelTag: "Primary entry",
    agentPanelTitle: "点击进入当前 Agent 工作台",
    agentPanelBody: "首页不承担复杂操作，核心任务仍在 Agent 工作台内完成。点击后进入你当前已在迭代的多栏工作界面。",
    launchWorkspace: "进入 Agent 工作台",
    footerText: "AiluxOS Platform for AI-native biopharma workflows",
  },
  en: {
    switcher: "中 / EN",
    login: "Log in",
    heroEyebrow: "AI-NATIVE BIOPHARMA R&D OS",
    heroTitleTop: "AiluxOS",
    heroTitleMain: "Lighting the Path",
    heroTitleBottom: "to Cures",
    heroBody:
      "An AI-native operating system for biopharma R&D. It unifies AiluxAgent, LuxSight, and the AtlaX data foundation to shorten discovery cycles through clearer task orchestration and result workspaces.",
    exploreAgent: "Explore AiluxAgent",
    loginPlatform: "Platform login",
    scrollHint: "Scroll to explore the platform",
    appEyebrow: "Core Applications",
    appTitle: "Three core applications",
    appBody: "Centered on AiluxAgent as the main entry, the platform links intelligence, data, and workflow capabilities into one connected operating surface.",
    architectureEyebrow: "Platform Architecture",
    architectureTitle: "Four layers, one operating surface",
    architectureBody: "From data foundations to intelligent applications, the homepage focuses on brand and entry while the Agent workspace carries execution and result analysis.",
    agentPanelTag: "Primary entry",
    agentPanelTitle: "Enter the current Agent workspace",
    agentPanelBody: "The homepage stays lightweight by design. Core task execution still happens inside the multi-panel Agent workspace you are iterating on now.",
    launchWorkspace: "Open Agent workspace",
    footerText: "AiluxOS Platform for AI-native biopharma workflows",
  },
} as const;

export default function Home() {
  const [lang, setLang] = useState<Lang>("zh");
  const text = copy[lang];

  useEffect(() => {
    const stored = window.localStorage.getItem("ailux-agent-lang");
    if (stored === "zh" || stored === "en") {
      setLang(stored);
    }
  }, []);

  useEffect(() => {
    window.localStorage.setItem("ailux-agent-lang", lang);
  }, [lang]);

  const selectedApps = useMemo(() => applicationCards.map((item) => ({ ...item })), []);

  return (
    <div className="min-h-screen overflow-hidden bg-[#060b1d] text-white">
      <div className="fixed inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(68,131,255,0.2),transparent_28%),radial-gradient(circle_at_80%_18%,rgba(30,211,255,0.12),transparent_24%),radial-gradient(circle_at_50%_45%,rgba(95,84,255,0.18),transparent_30%),linear-gradient(180deg,#081126_0%,#060b1d_52%,#071028_100%)]" />
      <div className="fixed inset-0 opacity-50 [background-image:radial-gradient(rgba(147,197,253,0.28)_1px,transparent_1px)] [background-size:42px_42px]" />
      <div className="fixed left-[8%] top-[12%] h-[32rem] w-[32rem] rounded-full bg-[radial-gradient(circle,rgba(56,189,248,0.18)_0%,rgba(56,189,248,0)_72%)] blur-3xl" />
      <div className="fixed bottom-[8%] right-[10%] h-[26rem] w-[26rem] rounded-full bg-[radial-gradient(circle,rgba(99,102,241,0.22)_0%,rgba(99,102,241,0)_72%)] blur-3xl" />

      <div className="relative z-10 mx-auto flex min-h-screen max-w-[1440px] flex-col px-5 pb-10 pt-5 lg:px-8">
        <header className="flex items-center justify-between rounded-full border border-white/10 bg-white/4 px-4 py-3 backdrop-blur-xl lg:px-6">
          <Link href="/" className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl border border-white/10 bg-[linear-gradient(135deg,rgba(70,120,255,0.88),rgba(82,230,255,0.36))] shadow-[0_0_30px_rgba(65,125,255,0.26)]">
              <FlaskConical className="h-5 w-5" />
            </div>
            <div>
              <p className="text-[18px] font-semibold tracking-tight">AiluxOS</p>
            </div>
          </Link>

          <nav className="hidden items-center gap-8 text-[14px] text-white/72 lg:flex">
            {navItems.map((item) => (
              <a key={item.href} href={item.href} className="transition hover:text-white">
                {pick(lang, item.label)}
              </a>
            ))}
          </nav>

          <div className="flex items-center gap-2.5">
            <button
              onClick={() => setLang((current) => (current === "zh" ? "en" : "zh"))}
              className="inline-flex items-center gap-2 rounded-full border border-white/12 bg-white/6 px-3 py-2 text-[12px] font-medium text-white/80 transition hover:border-white/18 hover:bg-white/10 hover:text-white"
            >
              <Globe2 className="h-3.5 w-3.5" />
              {text.switcher}
            </button>
            <button className="inline-flex items-center gap-2 rounded-full border border-white/12 bg-white/4 px-3 py-2 text-[12px] font-medium text-white/80 transition hover:border-white/18 hover:bg-white/10 hover:text-white">
              <LockKeyhole className="h-3.5 w-3.5" />
              {text.login}
            </button>
          </div>
        </header>

        <main className="flex flex-1 flex-col">
          <section className="relative flex min-h-[78vh] flex-col items-center justify-center px-2 py-20 text-center lg:px-10">
            <div className="absolute inset-x-[14%] top-[12%] h-px bg-[linear-gradient(90deg,transparent,rgba(120,177,255,0.48),transparent)]" />
            <div className="absolute left-[18%] top-[18%] h-24 w-24 rounded-full border border-cyan-300/12 bg-cyan-300/6 blur-2xl" />
            <div className="absolute right-[18%] top-[28%] h-28 w-28 rounded-full border border-indigo-300/12 bg-indigo-300/8 blur-2xl" />

            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-[#8cb7ff33] bg-[#6da8ff12] px-4 py-1.5 text-[11px] font-medium tracking-[0.24em] text-[#b7d3ff] shadow-[0_0_30px_rgba(71,132,255,0.12)]">
              <Sparkles className="h-3.5 w-3.5" />
              {text.heroEyebrow}
            </div>
            <p className="text-[30px] font-semibold tracking-tight text-white sm:text-[48px]">{text.heroTitleTop}</p>
            <h1 className="mt-2 max-w-[980px] text-balance text-[54px] font-semibold leading-[0.95] tracking-tight text-transparent sm:text-[86px] lg:text-[108px] bg-[linear-gradient(180deg,#9db4ff_5%,#89a6ff_28%,#d1bcff_56%,#dcfbff_92%)] bg-clip-text">
              {text.heroTitleMain}
              <br />
              {text.heroTitleBottom}
            </h1>
            <p className="mt-8 max-w-[840px] text-balance text-[15px] leading-8 text-white/70 sm:text-[17px]">
              {text.heroBody}
            </p>
            <div className="mt-10 flex flex-col items-center gap-3 sm:flex-row">
              <Link href="/agent">
                <Button className="h-12 rounded-2xl border border-[#78a8ff4f] bg-[linear-gradient(135deg,#2563ff_0%,#548cff_58%,#69dbff_100%)] px-6 text-[14px] font-semibold text-white shadow-[0_0_36px_rgba(66,126,255,0.35)] transition hover:scale-[1.01] hover:brightness-110">
                  {text.exploreAgent}
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
              <Button variant="outline" className="h-12 rounded-2xl border-white/12 bg-white/4 px-6 text-[14px] font-medium text-white/82 hover:bg-white/10 hover:text-white">
                {text.loginPlatform}
              </Button>
            </div>
            <div className="mt-12 inline-flex items-center gap-2 text-[12px] text-white/42">
              <ChevronDown className="h-4 w-4 animate-bounce" />
              {text.scrollHint}
            </div>
          </section>

          <section id="applications" className="relative py-10 lg:py-14">
            <div className="mb-8 max-w-[860px]">
              <p className="text-[12px] uppercase tracking-[0.26em] text-[#9dc0ff]">{text.appEyebrow}</p>
              <h2 className="mt-3 text-[34px] font-semibold tracking-tight text-white sm:text-[44px]">{text.appTitle}</h2>
              <p className="mt-4 text-[15px] leading-7 text-white/64">{text.appBody}</p>
            </div>

            <div className="grid gap-5 lg:grid-cols-[1.1fr_0.95fr_0.95fr]">
              {selectedApps.map((item) => {
                const Icon = item.icon;
                return (
                  <article
                    key={pick(lang, item.title)}
                    className={`group relative overflow-hidden rounded-[28px] border border-white/10 bg-[linear-gradient(180deg,rgba(9,18,42,0.78),rgba(10,16,34,0.92))] p-6 shadow-[0_20px_60px_rgba(0,0,0,0.22)] transition hover:-translate-y-1 hover:border-[#7ca9ff40] ${item.primary ? "lg:min-h-[430px]" : "lg:min-h-[390px]"}`}
                  >
                    <div className="absolute inset-x-0 top-0 h-px bg-[linear-gradient(90deg,transparent,rgba(138,185,255,0.38),transparent)]" />
                    <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl border border-white/10 bg-white/6 text-[#9fc0ff]">
                      <Icon className="h-5 w-5" />
                    </div>
                    <div className="mt-6 flex items-center justify-between gap-3">
                      <p className="text-[11px] uppercase tracking-[0.24em] text-white/36">{item.eyebrow}</p>
                      {item.primary ? (
                        <span className="rounded-full border border-[#8db4ff2e] bg-[#79a8ff12] px-3 py-1 text-[11px] font-medium text-[#bdd4ff]">
                          {text.agentPanelTag}
                        </span>
                      ) : null}
                    </div>
                    <h3 className="mt-4 text-[24px] font-semibold tracking-tight text-white">{pick(lang, item.title)}</h3>
                    <p className="mt-3 text-[14px] leading-7 text-white/64">{pick(lang, item.description)}</p>
                    <div className="mt-6 space-y-3 text-[13px] text-white/80">
                      {item.points.map((point) => (
                        <div key={pick(lang, point)} className="flex items-start gap-3">
                          <span className="mt-[7px] h-1.5 w-1.5 rounded-full bg-[#8fc2ff] shadow-[0_0_12px_rgba(143,194,255,0.82)]" />
                          <span>{pick(lang, point)}</span>
                        </div>
                      ))}
                    </div>
                    {item.primary ? (
                      <div className="mt-8 rounded-[22px] border border-[#8db4ff24] bg-[linear-gradient(180deg,rgba(255,255,255,0.05),rgba(255,255,255,0.02))] p-5">
                        <p className="text-[12px] uppercase tracking-[0.22em] text-[#9cc4ff]">{text.agentPanelTag}</p>
                        <h4 className="mt-2 text-[20px] font-semibold text-white">{text.agentPanelTitle}</h4>
                        <p className="mt-3 text-[13px] leading-7 text-white/62">{text.agentPanelBody}</p>
                        <Link href="/agent">
                          <Button className="mt-5 h-11 rounded-2xl bg-white text-[13px] font-semibold text-[#09132c] hover:bg-white/90">
                            {text.launchWorkspace}
                            <ArrowRight className="ml-2 h-4 w-4" />
                          </Button>
                        </Link>
                      </div>
                    ) : null}
                  </article>
                );
              })}
            </div>
          </section>

          <section id="architecture" className="relative py-14 lg:py-18">
            <div className="mb-8 max-w-[820px]">
              <p className="text-[12px] uppercase tracking-[0.26em] text-[#9dc0ff]">{text.architectureEyebrow}</p>
              <h2 className="mt-3 text-[34px] font-semibold tracking-tight text-white sm:text-[44px]">{text.architectureTitle}</h2>
              <p className="mt-4 text-[15px] leading-7 text-white/64">{text.architectureBody}</p>
            </div>

            <div className="grid gap-4 lg:grid-cols-4">
              {architectureLayers.map((item) => (
                <article key={item.id} className="rounded-[24px] border border-white/10 bg-[linear-gradient(180deg,rgba(10,17,37,0.82),rgba(8,13,28,0.92))] p-5 backdrop-blur">
                  <p className="text-[11px] uppercase tracking-[0.22em] text-white/32">{item.id}</p>
                  <h3 className="mt-3 text-[20px] font-semibold text-white">{pick(lang, item.title)}</h3>
                  <p className="mt-3 text-[14px] leading-7 text-white/62">{pick(lang, item.body)}</p>
                </article>
              ))}
            </div>
          </section>
        </main>

        <footer className="mt-8 flex flex-col gap-3 border-t border-white/10 pt-5 text-[12px] text-white/42 sm:flex-row sm:items-center sm:justify-between">
          <p>{text.footerText}</p>
          <Link href="/agent" className="inline-flex items-center gap-2 text-white/68 transition hover:text-white">
            AiluxAgent
            <ArrowRight className="h-4 w-4" />
          </Link>
        </footer>
      </div>
    </div>
  );
}
