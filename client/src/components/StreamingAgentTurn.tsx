import { useEffect, useMemo, useRef, useState, type RefObject } from "react";
import { createPortal } from "react-dom";
import {
  ArrowDown,
  BookOpen,
  Bot,
  Check,
  ChevronDown,
  ChevronRight,
  Code2,
  Cog,
  FileText,
  Infinity,
  Lightbulb,
  ListChecks,
  ShieldCheck,
  SquareTerminal,
} from "lucide-react";
import { ReportRating } from "@/components/ReportRating";

type Lang = "zh" | "en";
type Phase = "understanding" | "thinking" | "answering" | "done";
type EventKind = "decision" | "skill" | "tool" | "code" | "file" | "status" | "note";
export type StreamVariant = "log" | "steps";

type ExecEvent = {
  kind: EventKind;
  zh: string;
  en: string;
};

type ThinkStep = {
  zh: string;
  en: string;
  detailZh?: string;
  detailEn?: string;
};

const LOG_EVENTS: ExecEvent[] = [
  { kind: "decision", zh: "约束：不使用需外部凭证的 Skill", en: "Constraint: skip Skills that need external credentials" },
  { kind: "skill", zh: "已读取技能 bio-structure-viz", en: "Read skill bio-structure-viz" },
  { kind: "status", zh: "当前步骤：拉取 7K3L 结构", en: "Current step: fetch 7K3L structure" },
  { kind: "file", zh: "写入 7K3L.pdb → project/outputs", en: "Wrote 7K3L.pdb → project/outputs" },
  { kind: "tool", zh: "已调用 TaskCreate", en: "Called TaskCreate" },
  { kind: "note", zh: "判断：本地 3Dmol.js 足够完成可视化", en: "Decision: local 3Dmol.js is enough for visualization" },
  { kind: "tool", zh: "已调用 TaskUpdate", en: "Called TaskUpdate" },
  { kind: "code", zh: '已运行 os.makedirs("project/outputs", exist_ok=True)', en: 'Ran os.makedirs("project/outputs", exist_ok=True)' },
  { kind: "file", zh: "产物就绪：structure_view.html", en: "Artifact ready: structure_view.html" },
  { kind: "status", zh: "执行完成，开始组织回答", en: "Execution finished, composing the reply" },
];

const LOG_UNDERSTANDING = {
  zh: "用户希望换一个不依赖外部平台或 API Key 的 Skill，完成 7K3L 蛋白结构可视化。我将改用本地 bio-structure-viz：从 RCSB 拉取结构、用 3Dmol.js 展示，必要时再用 RDKit 处理配体。不调用需要外部平台凭证的 gn-protein-preparation。",
  en: "The user wants a Skill that does not depend on an external platform or API key to visualize 7K3L. I will switch to local bio-structure-viz: fetch the structure from RCSB, render it with 3Dmol.js, and use RDKit for ligands if needed. I will not call gn-protein-preparation, which requires external credentials.",
};

const LOG_ANSWER = {
  zh: "好的，我来用 bio-structure-viz 做一次完整的 7K3L 可视化演示。\n\n已完成本地准备：结构文件写入 project/outputs，3Dmol.js 视图可旋转、着色并高亮配体口袋。整个过程没有调用外部平台凭证。\n\n接下来你可以继续让我导出截图、切换表面展示，或对结合位点做一轮简要注释。",
  en: "I will use bio-structure-viz for a complete 7K3L visualization demo.\n\nLocal setup is ready: the structure is in project/outputs, and the 3Dmol.js view can rotate, color, and highlight the ligand pocket. No external platform credentials were used.\n\nYou can next ask me to export a screenshot, switch surface display, or annotate the binding site.",
};

const STEPS: ThinkStep[] = [
  { zh: "核对口袋残基与配体条目", en: "Verify pocket residues and the ligand entry" },
  {
    zh: "获取结合位点坐标与注释数据",
    en: "Fetch binding-site coordinates and annotations",
    detailZh: "用 3Dmol.js 对齐配体坐标，并检查口袋残基编号是否与 7K3L 一致。",
    detailEn: "Align ligand coordinates in 3Dmol.js and check pocket residue numbers against 7K3L.",
  },
  {
    zh: "调整视角对准口袋开口",
    en: "Aim the camera at the pocket opening",
    detailZh: "沿口袋长轴旋转，让配体居中、疏水表面可见。",
    detailEn: "Rotate along the pocket axis so the ligand is centered and the hydrophobic surface is visible.",
  },
  { zh: "叠加配体高亮与残基标签", en: "Overlay ligand highlight and residue labels" },
  { zh: "整理这个视角的选择理由", en: "Write up why this viewpoint was chosen" },
  { zh: "导出带注释的结构视图", en: "Export the annotated structure view" },
];

const STEPS_UNDERSTANDING = {
  zh: "收到。我会在现有 7K3L 视图上标出配体与口袋，并说明为什么用这个朝向最适合看结合位点。",
  en: "Got it. I will annotate the ligand and pocket on the existing 7K3L view, and explain why this orientation is best for the binding site.",
};

const STEPS_ANSWER = {
  zh: "配体已标在口袋中央，周围是接触残基标签。\n\n选这个视角是因为它沿口袋开口看进去：配体完整露出，疏水表面和入口形状同时可见，比侧视更适合判断结合姿态。\n\n注释视图已写到 project/outputs/structure_view_annotated.html，需要的话我可以再导出一张静态截图。",
  en: "The ligand is marked at the pocket center, with contacting residue labels around it.\n\nThis viewpoint looks down the pocket opening: the ligand is fully visible, and the hydrophobic surface and entrance shape can be read together. A side view is worse for judging binding pose.\n\nThe annotated view is at project/outputs/structure_view_annotated.html. I can export a still screenshot next if you want.",
};

function useTypeText(full: string, active: boolean, stepMs: number, chunk = 2) {
  const [text, setText] = useState("");
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (!active) {
      return;
    }
    setText("");
    setDone(false);
    let index = 0;
    const timer = window.setInterval(() => {
      index = Math.min(full.length, index + chunk);
      setText(full.slice(0, index));
      if (index >= full.length) {
        window.clearInterval(timer);
        setDone(true);
      }
    }, stepMs);
    return () => window.clearInterval(timer);
  }, [active, chunk, full, stepMs]);

  return { text, done };
}

function EventIcon({ kind }: { kind: EventKind }) {
  if (kind === "skill") return <BookOpen className="h-3.5 w-3.5" />;
  if (kind === "code") return <Code2 className="h-3.5 w-3.5" />;
  if (kind === "file") return <FileText className="h-3.5 w-3.5" />;
  if (kind === "status") return <ListChecks className="h-3.5 w-3.5" />;
  if (kind === "decision") return <ShieldCheck className="h-3.5 w-3.5" />;
  if (kind === "note") return <Lightbulb className="h-3.5 w-3.5" />;
  return <Cog className="h-3.5 w-3.5" />;
}

function Cursor({ className }: { className: string }) {
  return <span className={`ml-0.5 inline-block animate-pulse align-middle ${className}`} />;
}

export function StreamingAgentTurn({
  lang,
  scrollRef,
  variant = "log",
  onComplete,
}: {
  lang: Lang;
  scrollRef: RefObject<HTMLDivElement | null>;
  variant?: StreamVariant;
  onComplete?: () => void;
}) {
  const isSteps = variant === "steps";
  const events = LOG_EVENTS;
  const steps = STEPS;
  const understandingFull = isSteps ? STEPS_UNDERSTANDING[lang] : LOG_UNDERSTANDING[lang];
  const answerFull = isSteps ? STEPS_ANSWER[lang] : LOG_ANSWER[lang];
  const totalThink = isSteps ? steps.length : events.length;

  const [phase, setPhase] = useState<Phase>("understanding");
  const [visibleEvents, setVisibleEvents] = useState(0);
  const [elapsed, setElapsed] = useState(0);
  const [thinkingOpen, setThinkingOpen] = useState(true);
  const [stepsExpanded, setStepsExpanded] = useState(false);
  const [followLatest, setFollowLatest] = useState(true);
  const followRef = useRef(true);
  const completedRef = useRef(false);
  const endRef = useRef<HTMLDivElement | null>(null);
  const logRef = useRef<HTMLDivElement | null>(null);

  const understanding = useTypeText(understandingFull, phase === "understanding", 18, 3);
  const answer = useTypeText(answerFull, phase === "answering" || phase === "done", 16, 3);
  const revealedEvents = events.slice(0, visibleEvents);
  const revealedSteps = steps.slice(0, visibleEvents);
  const toolCount = revealedEvents.filter((event) => event.kind === "tool" || event.kind === "code" || event.kind === "skill").length;
  const fileCount = revealedEvents.filter((event) => event.kind === "file").length;

  useEffect(() => {
    if (phase === "understanding" && understanding.done) {
      setPhase("thinking");
    }
  }, [phase, understanding.done]);

  useEffect(() => {
    if (phase !== "thinking") return;
    if (visibleEvents >= totalThink) {
      const timer = window.setTimeout(() => setPhase("answering"), 450);
      return () => window.clearTimeout(timer);
    }
    const timer = window.setTimeout(() => setVisibleEvents((count) => count + 1), isSteps ? 640 : 520);
    return () => window.clearTimeout(timer);
  }, [isSteps, phase, totalThink, visibleEvents]);

  useEffect(() => {
    if (phase === "answering" && answer.done) {
      setPhase("done");
      if (!isSteps) {
        setThinkingOpen(false);
      }
    }
  }, [answer.done, isSteps, phase]);

  useEffect(() => {
    if (phase !== "done" || completedRef.current) return;
    completedRef.current = true;
    onComplete?.();
  }, [onComplete, phase]);

  useEffect(() => {
    if (phase === "done") return;
    const timer = window.setInterval(() => setElapsed((value) => value + 1), 1000);
    return () => window.clearInterval(timer);
  }, [phase]);

  useEffect(() => {
    const root = scrollRef.current;
    if (!root) return;
    const onScroll = () => {
      const distance = root.scrollHeight - root.scrollTop - root.clientHeight;
      const next = distance < 72;
      followRef.current = next;
      setFollowLatest(next);
    };
    root.addEventListener("scroll", onScroll);
    return () => root.removeEventListener("scroll", onScroll);
  }, [scrollRef]);

  useEffect(() => {
    if (!followRef.current) return;
    endRef.current?.scrollIntoView({ block: "end" });
  }, [answer.text, phase, understanding.text, visibleEvents]);

  useEffect(() => {
    logRef.current?.scrollTo({ top: logRef.current.scrollHeight });
  }, [visibleEvents]);

  const jumpToLatest = () => {
    followRef.current = true;
    setFollowLatest(true);
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  };

  const header = useMemo(() => {
    if (lang === "zh") {
      return phase === "done" || phase === "answering"
        ? `已执行 · ${visibleEvents} 步 · ${toolCount} 次工具`
        : `执行中 · ${visibleEvents}/${events.length} 步 · ${toolCount} 次工具`;
    }
    return phase === "done" || phase === "answering"
      ? `Done · ${visibleEvents} steps · ${toolCount} tools`
      : `Running · ${visibleEvents}/${events.length} steps · ${toolCount} tools`;
  }, [events.length, lang, phase, toolCount, visibleEvents]);

  const portalHost = scrollRef.current?.parentElement ?? null;
  const showThinking = phase !== "understanding";
  const previewSteps = stepsExpanded ? revealedSteps : revealedSteps.slice(-2);
  const previewOffset = revealedSteps.length - previewSteps.length;

  return (
    <div className="group w-full max-w-[760px]">
      <div className="mb-2 flex items-center gap-2">
        <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-[linear-gradient(135deg,#161FAD_0%,#848CFE_100%)] text-white">
          <Bot className="h-3.5 w-3.5" />
        </div>
        <span className="text-[13px] font-semibold text-[#161FAD]">Ailux Agent</span>
      </div>

      {isSteps ? (
        <div className="text-[13px] leading-7 text-slate-700">
          {understanding.text}
          {phase === "understanding" && !understanding.done ? <Cursor className="h-3.5 w-[1.5px] bg-slate-700" /> : null}
        </div>
      ) : (
        <div className="max-h-[88px] overflow-y-auto rounded-xl bg-slate-100/90 px-3 py-2.5 text-[12px] leading-5 text-slate-600">
          {understanding.text}
          {phase === "understanding" && !understanding.done ? <Cursor className="h-3 w-[1.5px] bg-slate-500" /> : null}
        </div>
      )}

      {showThinking && !isSteps ? (
        <div className="mt-2 rounded-xl border border-slate-200 bg-white">
          <button
            type="button"
            onClick={() => setThinkingOpen((open) => !open)}
            className="flex w-full items-center justify-between gap-3 px-3 py-2 text-left"
          >
            <span className="flex min-w-0 items-center gap-2 text-[12px] font-medium text-slate-600">
              <Infinity className="h-3.5 w-3.5 shrink-0 text-slate-400" />
              <span className="truncate">{header}</span>
              {fileCount > 0 ? (
                <span className="shrink-0 rounded-full bg-slate-100 px-1.5 py-0.5 text-[10px] font-medium text-slate-500">
                  {lang === "zh" ? `${fileCount} 个产物` : `${fileCount} files`}
                </span>
              ) : null}
            </span>
            <span className="flex shrink-0 items-center gap-1.5 text-[11px] text-slate-400">
              {elapsed}s
              <ChevronDown className={`h-3.5 w-3.5 transition ${thinkingOpen ? "rotate-180" : ""}`} />
            </span>
          </button>
          {thinkingOpen ? (
            <div ref={logRef} className="max-h-[148px] space-y-1.5 overflow-y-auto border-t border-slate-100 px-3 py-2">
              {revealedEvents.map((event) => (
                <div key={event.zh} className="flex items-start gap-2 text-[12px] leading-5 text-slate-600">
                  <span className="mt-0.5 text-slate-400">
                    <EventIcon kind={event.kind} />
                  </span>
                  <span>{lang === "zh" ? event.zh : event.en}</span>
                </div>
              ))}
            </div>
          ) : null}
        </div>
      ) : null}

      {showThinking && isSteps ? (
        <div className="mt-3">
          <div className="space-y-2">
            {previewSteps.map((step, index) => {
              const globalIndex = previewOffset + index;
              const isCurrent = phase === "thinking" && globalIndex === visibleEvents - 1;
              const title = lang === "zh" ? step.zh : step.en;
              const detail = lang === "zh" ? step.detailZh : step.detailEn;
              return (
                <div key={step.zh}>
                  <div className="flex items-start gap-2.5">
                    {isCurrent ? (
                      <span className="relative mt-2 flex h-2 w-2 shrink-0">
                        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#161FAD] opacity-40" />
                        <span className="relative inline-flex h-2 w-2 rounded-full bg-[#161FAD]" />
                      </span>
                    ) : (
                      <span className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full border border-slate-200 text-slate-300">
                        <Check className="h-2.5 w-2.5" strokeWidth={2.6} />
                      </span>
                    )}
                    <p
                      className={`min-w-0 text-[13px] leading-6 ${
                        isCurrent ? "font-medium text-slate-800" : "text-slate-400"
                      }`}
                    >
                      {title}
                      {isCurrent ? <ChevronRight className="ml-0.5 inline-block h-3.5 w-3.5 align-[-2px] text-slate-400" /> : null}
                    </p>
                  </div>
                  {isCurrent && detail ? (
                    <div className="ml-[26px] mt-1 flex items-start gap-2 text-[12px] leading-5 text-slate-500">
                      <SquareTerminal className="mt-0.5 h-3.5 w-3.5 shrink-0 text-slate-400" />
                      <span>{detail}</span>
                    </div>
                  ) : null}
                </div>
              );
            })}
          </div>
          {revealedSteps.length > 2 ? (
            <button
              type="button"
              data-testid="stream-steps-expand"
              onClick={() => setStepsExpanded((open) => !open)}
              className="mt-2 text-[12px] text-slate-400 transition hover:text-slate-600"
            >
              {stepsExpanded ? (lang === "zh" ? "收起" : "Show less") : lang === "zh" ? "全部展示" : "Show all"}
            </button>
          ) : null}
        </div>
      ) : null}

      {phase === "answering" || phase === "done" ? (
        <div className="mt-3 whitespace-pre-wrap text-[13px] leading-7 text-slate-700">
          {answer.text}
          {phase === "answering" && !answer.done ? <Cursor className="h-3.5 w-[1.5px] bg-slate-700" /> : null}
        </div>
      ) : null}

      {phase === "done" ? (
        <ReportRating
          lang={lang}
          variant="chat"
          dimensionSet="chat"
          targetId={isSteps ? "stream-reply-7k3l-pocket" : "stream-reply-7k3l"}
          timestamp={lang === "zh" ? (isSteps ? "9月3日 14:24" : "9月3日 14:21") : isSteps ? "Sep 3, 14:24" : "Sep 3, 14:21"}
          duration={`${Math.max(elapsed, 1)}${lang === "zh" ? "秒" : "s"}`}
          copyText={answerFull}
        />
      ) : null}

      <div ref={endRef} />

      {portalHost && !followLatest && (phase === "thinking" || phase === "answering")
        ? createPortal(
            <button
              type="button"
              onClick={jumpToLatest}
              className="absolute bottom-4 left-1/2 z-20 -translate-x-1/2 rounded-full border border-slate-200 bg-white px-3 py-1 text-[12px] font-medium text-slate-600 shadow-[0_8px_20px_rgba(15,23,42,0.12)]"
            >
              <span className="inline-flex items-center gap-1">
                <ArrowDown className="h-3.5 w-3.5" />
                Latest
              </span>
            </button>,
            portalHost,
          )
        : null}
    </div>
  );
}
