import { ArrowLeft, FileText, PanelRightOpen, Plus, Search, X } from "lucide-react";
import { useMemo, useState } from "react";
import { Link } from "wouter";
import { toast } from "sonner";

type DispatchScope = "run" | "conversation";
type DispatchStatusFilter = "all" | "running" | "error" | "done" | "queued";
type DispatchJobStatus = "queued" | "running" | "done" | "error";

type DispatchJob = {
  id: string;
  runId: string;
  runLabel: string;
  conversationId: string;
  planStepId: string;
  model: string;
  name: string;
  startedAt: string;
  endedAt?: string;
  duration: string;
  status: DispatchJobStatus;
  cpu: number;
  gpu: number;
  gpuModel: string;
  memory: number;
};

type SplitTaskDetail = {
  splitId: number;
  handle: string;
  status: DispatchJobStatus;
  operation: string;
  startTime: string;
  endTime: string;
  errorInfo?: string;
};

const CURRENT_DISPATCH_RUN_ID = "run-03";
const CURRENT_CONVERSATION_ID = "conv-dll3-20260626";

const dispatchJobs: DispatchJob[] = [
  { id: "job-001", runId: CURRENT_DISPATCH_RUN_ID, runLabel: "Run #3", conversationId: CURRENT_CONVERSATION_ID, planStepId: "step-01", model: "agent_planner", name: "validate_inputs_and_freeze_snapshot", startedAt: "2026-06-26 14:36:02", endedAt: "2026-06-26 14:36:14", duration: "12s", status: "done", cpu: 2, gpu: 0, gpuModel: "-", memory: 16 },
  { id: "job-002", runId: CURRENT_DISPATCH_RUN_ID, runLabel: "Run #3", conversationId: CURRENT_CONVERSATION_ID, planStepId: "step-02", model: "StructureExtractor", name: "build_binder_context", startedAt: "2026-06-26 14:36:18", endedAt: "2026-06-26 14:36:48", duration: "30s", status: "done", cpu: 8, gpu: 0, gpuModel: "-", memory: 24 },
  { id: "job-003", runId: CURRENT_DISPATCH_RUN_ID, runLabel: "Run #3", conversationId: CURRENT_CONVERSATION_ID, planStepId: "step-03", model: "DockedPoses Filter B", name: "prodigy_features_[split]_Mcb008", startedAt: "2026-06-26 14:37:02", endedAt: "2026-06-26 14:38:01", duration: "59s", status: "done", cpu: 8, gpu: 0, gpuModel: "-", memory: 14 },
  { id: "job-004", runId: CURRENT_DISPATCH_RUN_ID, runLabel: "Run #3", conversationId: CURRENT_CONVERSATION_ID, planStepId: "step-03", model: "DockedPoses Filter B", name: "prodigy_features_[split]_Msb028", startedAt: "2026-06-26 14:37:04", endedAt: "2026-06-26 14:38:04", duration: "1m", status: "done", cpu: 8, gpu: 0, gpuModel: "-", memory: 14 },
  { id: "job-005", runId: CURRENT_DISPATCH_RUN_ID, runLabel: "Run #3", conversationId: CURRENT_CONVERSATION_ID, planStepId: "step-03", model: "DockedPoses Filter B", name: "prodigy_features_[split]_ZG006-1", startedAt: "2026-06-26 14:37:06", endedAt: "2026-06-26 14:38:10", duration: "1m 4s", status: "done", cpu: 8, gpu: 0, gpuModel: "-", memory: 14 },
  { id: "job-006", runId: CURRENT_DISPATCH_RUN_ID, runLabel: "Run #3", conversationId: CURRENT_CONVERSATION_ID, planStepId: "step-03", model: "DockedPoses Filter B", name: "rosetta_energy_[split]_ZG006-2", startedAt: "2026-06-26 14:37:08", endedAt: "2026-06-26 14:37:42", duration: "34s", status: "error", cpu: 16, gpu: 0, gpuModel: "-", memory: 32 },
  { id: "job-007", runId: CURRENT_DISPATCH_RUN_ID, runLabel: "Run #3", conversationId: CURRENT_CONVERSATION_ID, planStepId: "step-03", model: "Rosetta Feature Engine", name: "resume_rosetta_energy_ZG006-2", startedAt: "2026-06-26 14:38:28", endedAt: "2026-06-26 14:40:16", duration: "1m 48s", status: "done", cpu: 16, gpu: 0, gpuModel: "-", memory: 32 },
  { id: "job-008", runId: CURRENT_DISPATCH_RUN_ID, runLabel: "Run #3", conversationId: CURRENT_CONVERSATION_ID, planStepId: "step-04", model: "FeatureRank GBM", name: "feature_selection_topK20", startedAt: "2026-06-26 14:40:22", endedAt: "2026-06-26 14:42:10", duration: "1m 48s", status: "done", cpu: 4, gpu: 0, gpuModel: "-", memory: 16 },
  { id: "job-009", runId: CURRENT_DISPATCH_RUN_ID, runLabel: "Run #3", conversationId: CURRENT_CONVERSATION_ID, planStepId: "step-04", model: "LightGBM-Antibody", name: "train_model_fold_[split]_1", startedAt: "2026-06-26 14:42:18", duration: "running", status: "running", cpu: 8, gpu: 1, gpuModel: "A10", memory: 48 },
  { id: "job-010", runId: CURRENT_DISPATCH_RUN_ID, runLabel: "Run #3", conversationId: CURRENT_CONVERSATION_ID, planStepId: "step-04", model: "LightGBM-Antibody", name: "train_model_fold_[split]_2", startedAt: "2026-06-26 14:42:21", duration: "running", status: "running", cpu: 8, gpu: 1, gpuModel: "A10", memory: 48 },
  { id: "job-011", runId: CURRENT_DISPATCH_RUN_ID, runLabel: "Run #3", conversationId: CURRENT_CONVERSATION_ID, planStepId: "step-04", model: "CatBoost Regression", name: "train_model_fold_[split]_3", startedAt: "2026-06-26 14:42:24", duration: "queued", status: "queued", cpu: 8, gpu: 1, gpuModel: "A10", memory: 48 },
  { id: "job-012", runId: CURRENT_DISPATCH_RUN_ID, runLabel: "Run #3", conversationId: CURRENT_CONVERSATION_ID, planStepId: "step-05", model: "Ailux ReportSynth", name: "generate_final_report", startedAt: "2026-06-26 14:45:02", duration: "waiting", status: "queued", cpu: 2, gpu: 0, gpuModel: "-", memory: 16 },
  { id: "job-013", runId: "run-02", runLabel: "Run #2", conversationId: CURRENT_CONVERSATION_ID, planStepId: "step-02", model: "strategist", name: "regenerate_model_config_10nM", startedAt: "2026-06-26 15:12:40", endedAt: "2026-06-26 15:12:57", duration: "17s", status: "done", cpu: 2, gpu: 0, gpuModel: "-", memory: 16 },
  { id: "job-014", runId: "run-01", runLabel: "Run #1", conversationId: CURRENT_CONVERSATION_ID, planStepId: "step-02", model: "StructureExtractor", name: "baseline_feature_extraction", startedAt: "2026-06-26 14:49:02", endedAt: "2026-06-26 14:55:10", duration: "6m 8s", status: "done", cpu: 16, gpu: 0, gpuModel: "-", memory: 32 },
];

const statusMeta: Record<DispatchJobStatus, { className: string }> = {
  queued: { className: "bg-slate-100 text-slate-500" },
  running: { className: "bg-amber-50 text-amber-700" },
  done: { className: "bg-emerald-50 text-emerald-700" },
  error: { className: "bg-red-50 text-red-600" },
};

const splitTaskDetails: Record<string, SplitTaskDetail[]> = {
  "job-003": Array.from({ length: 10 }, (_, index) => ({
    splitId: index + 1,
    handle: `d9qqai9arhlg00a1rf${index === 9 ? "g" : index}`,
    status: "done",
    operation: "日志",
    startTime: `2026-06-26 14:37:${String(index + 2).padStart(2, "0")}`,
    endTime: `2026-06-26 14:38:${String(index + 1).padStart(2, "0")}`,
  })),
  "job-009": [
    { splitId: 1, handle: "train-fold-1-a10-001", status: "running", operation: "日志", startTime: "2026-06-26 14:42:18", endTime: "-", errorInfo: undefined },
    { splitId: 2, handle: "train-fold-1-a10-002", status: "running", operation: "日志", startTime: "2026-06-26 14:42:24", endTime: "-", errorInfo: undefined },
    { splitId: 3, handle: "train-fold-1-a10-003", status: "queued", operation: "日志", startTime: "2026-06-26 14:42:31", endTime: "-", errorInfo: undefined },
    { splitId: 4, handle: "train-fold-1-a10-004", status: "error", operation: "日志", startTime: "2026-06-26 14:42:33", endTime: "2026-06-26 14:43:08", errorInfo: "All train targets are equal" },
  ],
};

function getScopedJobs(scope: DispatchScope) {
  if (scope === "run") return dispatchJobs.filter((job) => job.runId === CURRENT_DISPATCH_RUN_ID);
  return dispatchJobs.filter((job) => job.conversationId === CURRENT_CONVERSATION_ID);
}

function buildJobLog(job: DispatchJob) {
  return [
    `[${job.startedAt}] submit job ${job.id}`,
    `[${job.startedAt}] model=${job.model} cpu=${job.cpu} gpu=${job.gpu} memory=${job.memory}GB`,
    job.status === "error" ? "[error] Rosetta score cache missing for ZG006-2" : `[${job.endedAt ?? "running"}] status=${job.status}`,
    job.status === "running" ? "[running] streaming logs from scheduler..." : "[done] log archived",
  ];
}

function buildSplitLog(job: DispatchJob, item: SplitTaskDetail) {
  return [
    `[${item.startTime}] split=${item.splitId} handle=${item.handle}`,
    `[${item.startTime}] parent=${job.name}`,
    item.status === "error" ? `[error] ${item.errorInfo}` : `[${item.endTime}] status=${item.status}`,
    item.status === "running" ? "[running] waiting for fold metrics..." : "[done] output synced to report bucket",
  ];
}

export default function DispatchMonitor() {
  const params = new URLSearchParams(window.location.search);
  const initialScope = params.get("scope") === "conversation" ? "conversation" : "run";
  const initialStatus = ["running", "error", "done", "queued"].includes(params.get("status") ?? "")
    ? (params.get("status") as DispatchStatusFilter)
    : "all";
  const [scope, setScope] = useState<DispatchScope>(initialScope);
  const [statusFilter, setStatusFilter] = useState<DispatchStatusFilter>(initialStatus);
  const [query, setQuery] = useState("");
  const [selectedSplitJob, setSelectedSplitJob] = useState<DispatchJob | null>(null);
  const [selectedLog, setSelectedLog] = useState<{ title: string; lines: string[] } | null>(null);

  const scopedJobs = useMemo(() => getScopedJobs(scope), [scope]);
  const visibleJobs = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return scopedJobs.filter((job) => {
      const statusMatch = statusFilter === "all" || job.status === statusFilter;
      const queryMatch = !normalizedQuery || `${job.model} ${job.name} ${job.runLabel} ${job.status} ${job.gpuModel}`.toLowerCase().includes(normalizedQuery);
      return statusMatch && queryMatch;
    });
  }, [query, scopedJobs, statusFilter]);

  return (
    <main className="min-h-screen bg-[linear-gradient(180deg,#f8faff_0%,#eef3ff_100%)] p-5 text-slate-900">
      <section className="mx-auto flex min-h-[calc(100vh-40px)] max-w-[1440px] flex-col overflow-hidden rounded-[28px] border border-white/70 bg-white/92 shadow-[0_24px_80px_rgba(15,23,42,0.08)]">
        <header className="shrink-0 border-b border-slate-100 px-6 py-5">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <Link
                href="/"
                className="mb-4 inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-[12px] font-medium text-slate-500 transition hover:border-[rgba(23,36,216,0.18)] hover:text-[#161FAD]"
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                返回 Agent 工作台
              </Link>
              <h1 className="text-[22px] font-semibold text-[#070261]">调度任务监控</h1>
            </div>
          </div>

          <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
            <div className="inline-flex rounded-2xl border border-slate-200 bg-slate-50 p-1">
              {[
                { id: "run" as DispatchScope, label: "本轮 Run" },
                { id: "conversation" as DispatchScope, label: "整个对话" },
              ].map((item) => (
                <button
                  key={item.id}
                  onClick={() => setScope(item.id)}
                  className={`rounded-xl px-4 py-2 text-[13px] font-medium transition ${
                    scope === item.id ? "bg-white text-[#161FAD] shadow-[0_6px_16px_rgba(15,23,42,0.06)]" : "text-slate-500 hover:text-slate-700"
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <select
                value={statusFilter}
                onChange={(event) => setStatusFilter(event.target.value as DispatchStatusFilter)}
                className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-[13px] text-slate-600 outline-none transition focus:border-[rgba(23,36,216,0.35)]"
              >
                <option value="all">全部状态</option>
                <option value="running">running</option>
                <option value="error">error</option>
                <option value="done">done</option>
                <option value="queued">queued</option>
              </select>
              <label className="flex h-10 min-w-[260px] items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 text-slate-400 transition focus-within:border-[rgba(23,36,216,0.35)]">
                <Search className="h-3.5 w-3.5" />
                <input
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="搜索模型或作业名称"
                  className="min-w-0 flex-1 bg-transparent text-[13px] text-slate-700 outline-none placeholder:text-slate-300"
                />
              </label>
            </div>
          </div>
        </header>

        <div className="min-h-0 flex-1 overflow-auto px-6 py-5">
          {scopedJobs.length === 0 ? (
            <div className="rounded-[20px] border border-dashed border-slate-200 bg-slate-50/70 p-10 text-center">
              <p className="text-[15px] font-semibold text-slate-700">当前对话尚未提交调度任务</p>
            </div>
          ) : visibleJobs.length === 0 ? (
            <div className="rounded-[20px] border border-dashed border-slate-200 bg-slate-50/70 p-10 text-center">
              <p className="text-[15px] font-semibold text-slate-700">没有匹配的调度作业</p>
              <p className="mt-2 text-[12px] text-slate-400">调整状态或搜索条件后再试。</p>
            </div>
          ) : (
            <div className="min-w-[1020px] overflow-hidden rounded-[20px] border border-slate-200 bg-white">
              <div className="grid grid-cols-[86px_160px_minmax(220px,1fr)_190px_90px_90px_80px_130px_96px_92px] border-b border-slate-100 bg-slate-50/80 px-4 py-3 text-[11px] font-semibold text-slate-400">
                <span>#</span>
                <span>模型</span>
                <span>名称</span>
                <span>开始 / 结束时间</span>
                <span>运行时间</span>
                <span>状态</span>
                <span>CPU</span>
                <span>GPU</span>
                <span>Memory</span>
                <span>操作</span>
              </div>
              {visibleJobs.map((job, index) => (
                <div
                  key={job.id}
                  className={`grid grid-cols-[86px_160px_minmax(220px,1fr)_190px_90px_90px_80px_130px_96px_92px] items-center px-4 py-3 text-[12px] ${
                    index !== 0 ? "border-t border-slate-100" : ""
                  } ${job.status === "error" ? "bg-red-50/35" : index % 2 ? "bg-slate-50/45" : "bg-white"}`}
                >
                  <span className="flex items-center gap-2 font-mono text-[11px] text-slate-400">
                    {splitTaskDetails[job.id] ? (
                      <button
                        onClick={() => setSelectedSplitJob(job)}
                        className="inline-flex h-5 w-5 items-center justify-center rounded-full border border-blue-100 bg-blue-50 text-[#161FAD] transition hover:bg-blue-100"
                        title="查看拆分子任务"
                        aria-label="查看拆分子任务"
                      >
                        <Plus className="h-3 w-3" />
                      </button>
                    ) : (
                      <span className="h-5 w-5" />
                    )}
                    {index + 1}
                  </span>
                  <span className="truncate text-slate-600" title={job.model}>{job.model}</span>
                  <span className="truncate font-medium text-slate-700" title={job.name}>{job.name}</span>
                  <span className="text-[11px] leading-4 text-slate-500">
                    {job.startedAt}
                    <br />
                    {job.endedAt ?? "-"}
                  </span>
                  <span className="text-slate-500">{job.duration}</span>
                  <span>
                    <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${statusMeta[job.status].className}`}>
                      {job.status}
                    </span>
                  </span>
                  <span className="text-slate-500">{job.cpu}</span>
                  <span className="text-slate-500">{job.gpu}{job.gpuModel !== "-" ? ` · ${job.gpuModel}` : ""}</span>
                  <span className="text-slate-500">{job.memory} GB</span>
                  <span className="flex items-center gap-1.5 text-[#161FAD]">
                    <button
                      onClick={() => setSelectedLog({ title: job.name, lines: buildJobLog(job) })}
                      className="rounded-lg p-1.5 transition hover:bg-blue-50"
                      title="日志"
                    >
                      <FileText className="h-3.5 w-3.5" />
                    </button>
                    <button
                      onClick={() => toast.message(`打开详情：${job.id}`)}
                      className="rounded-lg p-1.5 transition hover:bg-blue-50"
                      title="详情"
                    >
                      <PanelRightOpen className="h-3.5 w-3.5" />
                    </button>
                  </span>
                </div>
              ))}
            </div>
          )}

        </div>
      </section>

      {selectedSplitJob ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 px-5">
          <div className="w-full max-w-[920px] overflow-hidden rounded-[24px] bg-white shadow-[0_24px_80px_rgba(15,23,42,0.22)]">
            <div className="flex items-start justify-between gap-4 border-b border-slate-100 px-5 py-4">
              <div>
                <p className="text-[16px] font-semibold text-[#070261]">{selectedSplitJob.name}</p>
                <p className="mt-1 text-[12px] text-slate-400">拆分子任务明细 · {selectedSplitJob.runLabel}</p>
              </div>
              <button
                onClick={() => setSelectedSplitJob(null)}
                className="rounded-full p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="max-h-[62vh] overflow-auto px-5 py-4">
              <div className="min-w-[760px] overflow-hidden rounded-[16px] border border-slate-200">
                <div className="grid grid-cols-[80px_180px_100px_110px_170px_170px_minmax(120px,1fr)] bg-slate-50 px-4 py-3 text-[11px] font-semibold text-slate-400">
                  <span>split ID</span>
                  <span>handle</span>
                  <span>status</span>
                  <span>operation</span>
                  <span>start time</span>
                  <span>end time</span>
                  <span>error info</span>
                </div>
                {(splitTaskDetails[selectedSplitJob.id] ?? []).map((item) => (
                  <div key={`${selectedSplitJob.id}-${item.splitId}`} className="grid grid-cols-[80px_180px_100px_110px_170px_170px_minmax(120px,1fr)] border-t border-slate-100 px-4 py-3 text-[12px]">
                    <span className="text-slate-500">{item.splitId}</span>
                    <span className="truncate font-mono text-[11px] text-slate-500" title={item.handle}>{item.handle}</span>
                    <span>
                      <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${statusMeta[item.status].className}`}>{item.status}</span>
                    </span>
                    <button
                      onClick={() => setSelectedLog({ title: `${selectedSplitJob.name} · split ${item.splitId}`, lines: buildSplitLog(selectedSplitJob, item) })}
                      className="w-fit rounded-lg px-2 py-1 text-left text-[#161FAD] transition hover:bg-blue-50"
                    >
                      {item.operation}
                    </button>
                    <span className="text-slate-500">{item.startTime}</span>
                    <span className="text-slate-500">{item.endTime}</span>
                    <span className="truncate text-red-500" title={item.errorInfo}>{item.errorInfo ?? "-"}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      ) : null}

      {selectedLog ? (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-950/45 px-5">
          <div className="w-full max-w-[720px] overflow-hidden rounded-[24px] bg-white shadow-[0_24px_80px_rgba(15,23,42,0.22)]">
            <div className="flex items-start justify-between gap-4 border-b border-slate-100 px-5 py-4">
              <div>
                <p className="text-[16px] font-semibold text-[#070261]">日志</p>
                <p className="mt-1 max-w-[560px] truncate text-[12px] text-slate-400" title={selectedLog.title}>{selectedLog.title}</p>
              </div>
              <button
                onClick={() => setSelectedLog(null)}
                className="rounded-full p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="px-5 py-4">
              <pre className="max-h-[48vh] overflow-auto whitespace-pre-wrap rounded-[18px] bg-slate-950 px-4 py-4 font-mono text-[11px] leading-6 text-slate-100">
                {selectedLog.lines.join("\n")}
              </pre>
            </div>
          </div>
        </div>
      ) : null}
    </main>
  );
}
