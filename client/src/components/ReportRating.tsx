import { useEffect, useMemo, useState } from "react";
import { Copy, Star, X } from "lucide-react";
import { toast } from "sonner";

type Lang = "zh" | "en";

type StoredFeedback = {
  rating: number;
  issues: string[];
  comment: string;
};

const STORAGE_PREFIX = "ailux-agent-chat-rating:";

const STAR_HINTS_ZH = ["非常不满意", "不满意", "一般", "满意", "非常满意"];
const STAR_HINTS_EN = ["Very dissatisfied", "Dissatisfied", "Neutral", "Satisfied", "Very satisfied"];

const NEGATIVE_OPTIONS_ZH = [
  "目标理解不准确",
  "Plan 拆解不合理",
  "数据或文件识别错误",
  "Skill 调用不合适",
  "缺少证据或结果不可信",
  "报告/产物不完整",
  "其他",
];

const NEGATIVE_OPTIONS_EN = [
  "Inaccurate goal understanding",
  "Unreasonable plan breakdown",
  "Data or file recognition error",
  "Inappropriate skill use",
  "Weak evidence or unreliable result",
  "Incomplete report / outputs",
  "Other",
];

const POSITIVE_OPTIONS_ZH = [
  "目标理解准确",
  "Plan 拆解合理",
  "数据或文件识别正确",
  "Skill 调用合适",
  "证据充分、结果可信",
  "报告/产物完整",
  "其他",
];

const POSITIVE_OPTIONS_EN = [
  "Accurate goal understanding",
  "Reasonable plan breakdown",
  "Correct data / file recognition",
  "Appropriate skill use",
  "Strong evidence and reliable result",
  "Complete report / outputs",
  "Other",
];

const CHAT_NEGATIVE_OPTIONS_ZH = [
  "回答不准确",
  "原因没解释清",
  "建议不可执行",
  "遗漏关键信息",
  "其他",
];

const CHAT_NEGATIVE_OPTIONS_EN = [
  "Inaccurate answer",
  "Unclear explanation",
  "Suggestions not actionable",
  "Missing key information",
  "Other",
];

const CHAT_POSITIVE_OPTIONS_ZH = [
  "回答准确",
  "解释清楚",
  "建议可执行",
  "信息完整",
  "其他",
];

const CHAT_POSITIVE_OPTIONS_EN = [
  "Accurate answer",
  "Clear explanation",
  "Actionable suggestions",
  "Complete information",
  "Other",
];

function isPositiveRating(value: number) {
  return value >= 4;
}

function storageKey(targetId: string) {
  return `${STORAGE_PREFIX}${targetId}`;
}

function readStoredFeedback(targetId: string): StoredFeedback | null {
  try {
    const raw = localStorage.getItem(storageKey(targetId));
    if (!raw) return null;
    const parsed = JSON.parse(raw) as StoredFeedback;
    if (!parsed?.rating || parsed.rating < 1 || parsed.rating > 5) return null;
    return parsed;
  } catch {
    return null;
  }
}

function writeStoredFeedback(targetId: string, feedback: StoredFeedback) {
  try {
    localStorage.setItem(storageKey(targetId), JSON.stringify(feedback));
  } catch {
    // ignore quota / private mode failures in the prototype
  }
}

export function ReportRating({
  lang,
  targetId,
  timestamp,
  duration,
  copyText,
  forceVisible = false,
  dimensionSet = "task",
  variant = "report",
}: {
  lang: Lang;
  targetId: string;
  timestamp: string;
  duration: string;
  copyText?: string;
  /** Keep visible after interaction (rating panel open / submitted). */
  forceVisible?: boolean;
  dimensionSet?: "task" | "chat";
  variant?: "report" | "chat";
}) {
  const [rating, setRating] = useState<number | null>(null);
  const [hoverRating, setHoverRating] = useState<number | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [panelOpen, setPanelOpen] = useState(false);
  const [selectedIssues, setSelectedIssues] = useState<string[]>([]);
  const [comment, setComment] = useState("");

  useEffect(() => {
    const stored = readStoredFeedback(targetId);
    if (stored) {
      setRating(stored.rating);
      setSelectedIssues(stored.issues ?? []);
      setComment(stored.comment ?? "");
      setSubmitted(true);
      setPanelOpen(false);
    } else {
      setRating(null);
      setSelectedIssues([]);
      setComment("");
      setSubmitted(false);
      setPanelOpen(false);
    }
    setHoverRating(null);
  }, [targetId]);

  const labels = useMemo(
    () =>
      lang === "zh"
        ? {
            title: "结果评分",
            thanks: "感谢你的反馈",
            negativePrompt: "哪里还可以改进？",
            positivePrompt: "你觉得什么让你满意？",
            commentPlaceholder: "选填，补充具体说明",
            close: "关闭",
            submit: "提交",
            copied: "已复制当前对话内容",
            durationPrefix: "用时",
            other: "其他",
          }
        : {
            title: "Result rating",
            thanks: "Thanks for your feedback",
            negativePrompt: "What could be improved?",
            positivePrompt: "What made you satisfied?",
            commentPlaceholder: "Optional — add more detail",
            close: "Close",
            submit: "Submit",
            copied: "Message copied",
            durationPrefix: "Took",
            other: "Other",
          },
    [lang, variant],
  );

  const positive = rating != null && isPositiveRating(rating);
  const dimensionOptions = (() => {
    if (rating == null) return [];
    if (dimensionSet === "chat") {
      if (lang === "zh") return positive ? CHAT_POSITIVE_OPTIONS_ZH : CHAT_NEGATIVE_OPTIONS_ZH;
      return positive ? CHAT_POSITIVE_OPTIONS_EN : CHAT_NEGATIVE_OPTIONS_EN;
    }
    if (lang === "zh") return positive ? POSITIVE_OPTIONS_ZH : NEGATIVE_OPTIONS_ZH;
    return positive ? POSITIVE_OPTIONS_EN : NEGATIVE_OPTIONS_EN;
  })();
  const dimensionPrompt = positive ? labels.positivePrompt : labels.negativePrompt;
  const starHints = lang === "zh" ? STAR_HINTS_ZH : STAR_HINTS_EN;
  const activeValue = hoverRating ?? rating ?? 0;
  const locked = submitted;
  const canSubmit = selectedIssues.length > 0 || comment.trim().length > 0;
  const metaText = `${timestamp} · ${labels.durationPrefix} ${duration}`;

  const handleRate = (value: number) => {
    if (locked) return;
    if (rating != null && isPositiveRating(rating) !== isPositiveRating(value)) {
      setSelectedIssues([]);
      setComment("");
    }
    setRating(value);
    setHoverRating(null);
    setPanelOpen(true);
  };

  const toggleIssue = (issue: string) => {
    if (locked) return;
    setSelectedIssues((current) =>
      current.includes(issue) ? current.filter((item) => item !== issue) : [...current, issue],
    );
  };

  const handleSubmit = () => {
    if (!rating || !canSubmit) return;
    const feedback: StoredFeedback = {
      rating,
      issues: selectedIssues,
      comment: comment.trim(),
    };
    writeStoredFeedback(targetId, feedback);
    setSubmitted(true);
    setPanelOpen(false);
    toast.success(labels.thanks);
  };

  const handleClose = () => {
    if (!rating) {
      setPanelOpen(false);
      return;
    }
    writeStoredFeedback(targetId, {
      rating,
      issues: [],
      comment: "",
    });
    setSelectedIssues([]);
    setComment("");
    setSubmitted(true);
    setPanelOpen(false);
  };

  const handleCopy = async () => {
    if (!copyText) return;
    try {
      await navigator.clipboard.writeText(copyText);
      toast.success(labels.copied);
    } catch {
      toast.error(lang === "zh" ? "复制失败" : "Copy failed");
    }
  };

  return (
    <div className="group/rating mt-3">
      <div className="flex flex-wrap items-center gap-2 text-[11px] text-slate-400">
        {copyText ? (
          <button
            type="button"
            onClick={handleCopy}
            className="rounded-md p-1 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
            aria-label={lang === "zh" ? "复制" : "Copy"}
          >
            <Copy className="h-3.5 w-3.5" />
          </button>
        ) : null}
        <span className="font-medium text-slate-500">{labels.title}</span>
        <div
          className="relative flex items-center gap-0.5"
          onMouseLeave={() => {
            if (!locked) setHoverRating(null);
          }}
        >
          {[1, 2, 3, 4, 5].map((value) => {
            const filled = value <= activeValue;
            const showHint = hoverRating === value && !locked;
            return (
              <button
                key={value}
                type="button"
                disabled={locked}
                aria-label={starHints[value - 1]}
                onMouseEnter={() => {
                  if (!locked) setHoverRating(value);
                }}
                onClick={() => handleRate(value)}
                className={`relative rounded p-0.5 transition ${locked ? "cursor-default" : "cursor-pointer hover:scale-110"}`}
              >
                {showHint ? (
                  <span className="pointer-events-none absolute -top-8 left-1/2 z-10 -translate-x-1/2 whitespace-nowrap rounded-md bg-slate-900 px-2 py-1 text-[10px] text-white shadow">
                    {starHints[value - 1]}
                  </span>
                ) : null}
                <Star
                  className={`h-4 w-4 transition ${
                    filled ? "fill-amber-400 text-amber-400" : "fill-transparent text-slate-300"
                  }`}
                  strokeWidth={1.75}
                />
              </button>
            );
          })}
        </div>
        {submitted ? <span className="text-slate-400">{labels.thanks}</span> : null}
        <span
          className={`ml-auto text-[11px] text-slate-400 transition-opacity duration-150 ${
            forceVisible
              ? "visible opacity-100"
              : "invisible opacity-0 group-hover:visible group-hover:opacity-100 group-hover/rating:visible group-hover/rating:opacity-100"
          }`}
          data-testid="rating-meta"
        >
          {metaText}
        </span>
      </div>

      {panelOpen && !submitted && rating ? (
        <div className="relative mt-2 rounded-xl border border-slate-200 bg-white px-3.5 py-2.5">
          <button
            type="button"
            onClick={handleClose}
            className="absolute right-2.5 top-2.5 rounded-md p-0.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
            aria-label={labels.close}
          >
            <X className="h-3.5 w-3.5" />
          </button>
          <input
            value={comment}
            onChange={(event) => setComment(event.target.value)}
            placeholder={dimensionPrompt}
            className="w-full border-0 bg-transparent pr-6 text-[12px] leading-5 text-slate-700 outline-none placeholder:text-slate-500"
          />
          <div className="mt-2 flex items-end justify-between gap-3">
            <div className="flex min-w-0 flex-1 flex-wrap gap-1.5">
              {dimensionOptions.map((issue) => {
                const active = selectedIssues.includes(issue);
                return (
                  <button
                    key={issue}
                    type="button"
                    onClick={() => toggleIssue(issue)}
                    className={`rounded-md border px-2 py-0.5 text-[11px] leading-5 transition ${
                      active
                        ? "border-[#161FAD] bg-[rgba(22,31,173,0.08)] text-[#161FAD]"
                        : "border-slate-200 bg-white text-slate-600 hover:border-slate-300"
                    }`}
                  >
                    {issue}
                  </button>
                );
              })}
            </div>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={!canSubmit}
              className={`shrink-0 rounded-lg px-3 py-1 text-[12px] font-medium text-white transition ${
                canSubmit ? "bg-[#7B8CFF] hover:bg-[#6A7CF5]" : "cursor-not-allowed bg-[#B8C2FF]"
              }`}
            >
              {labels.submit}
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
