import { useEffect, useMemo, useState } from "react";
import { Copy, Star } from "lucide-react";
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

const ISSUE_OPTIONS_ZH = [
  "目标理解不准确",
  "Plan 拆解不合理",
  "数据或文件识别错误",
  "Skill 调用不合适",
  "执行过程不稳定",
  "结果解释不可信",
  "缺少证据或可追溯性",
  "报告/产物不完整",
  "等待时间过长",
  "其他",
];

const ISSUE_OPTIONS_EN = [
  "Goal understanding issue",
  "Plan breakdown issue",
  "Data or file recognition issue",
  "Skill selection issue",
  "Execution instability",
  "Unreliable result interpretation",
  "Missing evidence or traceability",
  "Incomplete report / outputs",
  "Long waiting time",
  "Other",
];

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
  copyText,
  forceVisible = false,
}: {
  lang: Lang;
  targetId: string;
  timestamp: string;
  copyText?: string;
  /** Keep visible after interaction (rating panel open / submitted). */
  forceVisible?: boolean;
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
            issueTitle: "选择评估维度",
            commentTitle: "留言",
            commentPlaceholder: "请告诉我我们做得好或者待改进的地方",
            ignore: "忽略",
            submit: "提交",
            copied: "已复制当前对话内容",
          }
        : {
            title: "Result rating",
            thanks: "Thanks for your feedback",
            issueTitle: "Select issue types",
            commentTitle: "Comment",
            commentPlaceholder: "Tell us what went well or what to improve",
            ignore: "Dismiss",
            submit: "Submit",
            copied: "Message copied",
          },
    [lang],
  );

  const issueOptions = lang === "zh" ? ISSUE_OPTIONS_ZH : ISSUE_OPTIONS_EN;
  const starHints = lang === "zh" ? STAR_HINTS_ZH : STAR_HINTS_EN;
  const activeValue = hoverRating ?? rating ?? 0;
  const locked = submitted;
  const keepVisible = forceVisible || panelOpen || submitted;

  const handleRate = (value: number) => {
    if (locked) return;
    setRating(value);
    setHoverRating(null);
    // Low score: open issue panel; high score: also allow optional comment panel
    setPanelOpen(true);
  };

  const toggleIssue = (issue: string) => {
    if (locked) return;
    setSelectedIssues((current) =>
      current.includes(issue) ? current.filter((item) => item !== issue) : [...current, issue],
    );
  };

  const handleSubmit = () => {
    if (!rating) return;
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

  const handleIgnore = () => {
    if (!rating) {
      setPanelOpen(false);
      return;
    }
    // Still record the star rating even if user dismisses details
    writeStoredFeedback(targetId, {
      rating,
      issues: [],
      comment: "",
    });
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
    <div
      className={`mt-3 transition-opacity duration-150 ${
        keepVisible ? "opacity-100" : "opacity-0 group-hover:opacity-100 focus-within:opacity-100"
      }`}
    >
      <div className="flex flex-wrap items-center gap-2.5 text-[11px] text-slate-400">
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
        <span>{timestamp}</span>
        <span className="text-slate-300">·</span>
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
      </div>

      {panelOpen && !submitted && rating ? (
        <div className="mt-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-[0_12px_28px_rgba(15,23,42,0.08)]">
          {(rating <= 2 || rating >= 3) && (
            <>
              {rating <= 2 ? (
                <>
                  <p className="text-[12px] font-semibold text-slate-700">{labels.issueTitle}</p>
                  <div className="mt-2.5 flex flex-wrap gap-2">
                    {issueOptions.map((issue) => {
                      const active = selectedIssues.includes(issue);
                      return (
                        <button
                          key={issue}
                          type="button"
                          onClick={() => toggleIssue(issue)}
                          className={`rounded-full border px-2.5 py-1 text-[11px] transition ${
                            active
                              ? "border-[#161FAD] bg-[rgba(22,31,173,0.08)] text-[#161FAD]"
                              : "border-slate-200 bg-slate-50 text-slate-600 hover:border-slate-300"
                          }`}
                        >
                          {issue}
                        </button>
                      );
                    })}
                  </div>
                </>
              ) : null}

              <p className={`text-[12px] font-semibold text-slate-700 ${rating <= 2 ? "mt-4" : ""}`}>
                {labels.commentTitle}
              </p>
              <textarea
                value={comment}
                onChange={(event) => setComment(event.target.value)}
                placeholder={labels.commentPlaceholder}
                className="mt-2 min-h-[88px] w-full resize-none rounded-xl border border-slate-200 bg-slate-50/80 px-3 py-2.5 text-[12px] leading-5 text-slate-700 outline-none transition focus:border-[#161FAD] focus:bg-white"
              />

              <div className="mt-3 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={handleIgnore}
                  className="rounded-xl border border-slate-200 bg-white px-3.5 py-1.5 text-[12px] font-medium text-slate-600 transition hover:bg-slate-50"
                >
                  {labels.ignore}
                </button>
                <button
                  type="button"
                  onClick={handleSubmit}
                  className="rounded-xl bg-slate-700 px-3.5 py-1.5 text-[12px] font-medium text-white transition hover:bg-slate-800"
                >
                  {labels.submit}
                </button>
              </div>
            </>
          )}
        </div>
      ) : null}
    </div>
  );
}
