import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { RefreshCw, Square } from "lucide-react";

type JobState = "running" | "queued" | "processing" | "cancelled";
const initialJobs: { id: string; name: string; state: JobState; reason?: string }[] = [
  { id: "job-009", name: "train_model_fold_1", state: "running" },
  { id: "job-010", name: "train_model_fold_2", state: "running" },
  { id: "job-011", name: "train_model_fold_3", state: "queued" },
  { id: "job-012", name: "generate_final_report", state: "queued" },
];

export function TaskCancellation({ lang = "zh", onJobsChange }: { lang?: "zh" | "en"; onJobsChange?: (states: Record<string, JobState>) => void }) {
  const t = (zh: string, en: string) => lang === "zh" ? zh : en;
  const [jobs, setJobs] = useState(initialJobs);
  const [selected, setSelected] = useState<string[]>([]);
  const [stopped, setStopped] = useState(false);
  const [confirm, setConfirm] = useState<"all" | "selected" | string | null>(null);
  const [fail, setFail] = useState(false);
  const [message, setMessage] = useState("");
  const [command, setCommand] = useState("");
  useEffect(() => { onJobsChange?.(Object.fromEntries(jobs.map(j => [j.id, j.state]))); }, [jobs, onJobsChange]);
  const active = jobs.filter(j => j.state !== "cancelled");
  const busy = jobs.some(j => j.state === "processing");
  const requestCancel = () => {
    if (!confirm) return;
    const action = confirm;
    const ids = action === "all" ? active.map(j => j.id) : action === "selected" ? selected : [action];
    if (action === "all") setStopped(true);
    setConfirm(null);
    setJobs(current => current.map(j => ids.includes(j.id) ? { ...j, state: "processing", reason: undefined } : j));
    setMessage(t("已发出请求，等待后台确认终止。", "Request sent. Waiting for backend confirmation."));
    window.setTimeout(() => {
      setJobs(current => current.map(j => {
        if (!ids.includes(j.id)) return j;
        const failed = fail || (action === "all" && j.id === "job-010");
        return failed ? { ...j, state: "running", reason: t("调度服务未确认终止，任务仍在运行。可重试 Kill。", "Scheduler did not confirm termination. Retry Kill.") } : { ...j, state: "cancelled", reason: undefined };
      }));
      setSelected([]);
      setMessage(t("已核对后台状态，请查看各任务的处理结果。", "Backend states checked. Review each task below."));
    }, 1300);
  };
  return <section className="rounded-[18px] border border-[#e8edfc] bg-white p-4">
    <div className="flex items-center justify-between gap-2">
      <h3 className="text-[13px] font-semibold text-slate-700">{t("执行控制", "Execution controls")}</h3>
      <span className="text-[10px] text-slate-400">{t("交互演示", "Interactive demo")}</span>
    </div>
    <p role="status" className={`mt-3 rounded-xl px-3 py-2 text-[12px] ${stopped && active.length ? "bg-amber-50 text-amber-800" : "bg-[#f5f8ff] text-slate-600"}`}>
      {stopped ? active.length ? t("Agent 已停止，但仍有后台任务运行或处理中", "Agent stopped; backend tasks remain active") : t("Agent 已停止，关联后台任务已终止", "Agent stopped; linked backend tasks terminated") : t("Agent 执行中 · 4 个关联后台任务", "Agent running · 4 linked backend tasks")}
    </p>
    <div className="mt-3 flex gap-2">
      <button disabled={stopped || busy} onClick={() => setConfirm("all")} className="flex flex-1 items-center justify-center gap-1 rounded-xl bg-[#161fad] px-3 py-2 text-[12px] text-white disabled:opacity-40"><Square size={12}/>{t("取消整个任务", "Cancel entire task")}</button>
      <button disabled={!selected.length || busy} onClick={() => setConfirm("selected")} className="rounded-xl border border-slate-200 px-3 py-2 text-[12px] text-slate-600 disabled:opacity-40">{t("取消所选", "Cancel selected")} {selected.length || ""}</button>
    </div>
    <details open={stopped} className="mt-3"><summary className="cursor-pointer text-[12px] text-[#5266b2]">{t("关联后台任务 · 选择取消 / Kill", "Linked backend tasks · Cancel / Kill")}</summary>
    <div className="mt-3 space-y-2">{jobs.map(job => <div key={job.id} className="rounded-xl bg-[#f5f8fc] p-3">
      <div className="flex items-center gap-2">
        <input type="checkbox" aria-label={`${t("选择", "Select")} ${job.name}`} checked={selected.includes(job.id)} disabled={job.state === "cancelled" || busy} onChange={e => setSelected(s => e.target.checked ? [...s, job.id] : s.filter(id => id !== job.id))}/>
        <span className="min-w-0 flex-1 truncate text-[12px] font-medium text-slate-700" title={job.name}>{job.name}</span>
        <span className={`text-[11px] ${job.state === "cancelled" ? "text-emerald-700" : "text-amber-700"}`}>{({running:t("运行中", "Running"),queued:t("排队中", "Queued"),processing:t("处理中", "Processing"),cancelled:t("已终止", "Terminated")})[job.state]}</span>
      </div>
      <div className="mt-2 flex items-center justify-between"><code className="text-[10px] text-slate-400">{job.id}</code>{job.state === "running" && <button disabled={busy} onClick={() => setConfirm(job.id)} className="rounded-lg border border-red-100 bg-white px-2 py-1 text-[11px] text-red-600 disabled:opacity-40">Kill</button>}</div>
      {job.reason && <p role="alert" className="mt-2 text-[11px] leading-5 text-red-600">{job.reason}</p>}
    </div>)}</div>
    {message && <p role="status" className="mt-2 text-[11px] leading-5 text-slate-500">{message}</p>}
    <form className="mt-3 flex gap-2" onSubmit={e => { e.preventDefault(); const matched = jobs.filter(j => command.includes(j.id) || command.includes(j.name)); if (/全部|整个|所有|all/i.test(command)) setConfirm("all"); else if (matched.length) {setSelected(matched.map(j => j.id)); setConfirm("selected");} else setMessage(t("请输入“取消全部”或指定任务名称 / ID。", "Enter cancel all or specify a task name / ID.")); }}>
      <input aria-label={t("取消指令", "Cancellation command")} value={command} onChange={e => setCommand(e.target.value)} placeholder={t("取消 job-009，或取消全部", "Cancel job-009, or cancel all")} className="min-w-0 flex-1 rounded-lg border border-slate-200 px-2 py-2 text-[11px]"/>
      <button disabled={busy || !active.length} className="text-[12px] text-[#161fad] disabled:opacity-40">{t("执行", "Send")}</button>
    </form>
    <details className="mt-3 text-[10px] text-slate-400"><summary>{t("演示选项", "Demo options")}</summary><label className="mt-2 flex items-center gap-2"><input type="checkbox" checked={fail} onChange={e => setFail(e.target.checked)}/>{t("模拟后台取消 / Kill 失败", "Simulate cancellation / Kill failure")}</label><button className="mt-2 flex items-center gap-1" disabled={busy} onClick={() => {setJobs(initialJobs); setStopped(false); setSelected([]); setMessage("");setFail(false);setCommand("");}}><RefreshCw size={11}/>{t("重置演示", "Reset demo")}</button></details>
    </details>
    <Dialog open={Boolean(confirm)} onOpenChange={open => !open && setConfirm(null)}><DialogContent className="rounded-2xl sm:max-w-[440px]"><DialogHeader><DialogTitle>{confirm === "all" ? t("取消整个任务？", "Cancel entire task?") : confirm === "selected" ? t("取消所选子任务？", "Cancel selected tasks?") : t("强制终止单个后台任务？", "Kill this backend task?")}</DialogTitle><DialogDescription className="pt-2 leading-6">{confirm === "all" ? t("停止 Agent，并取消已提交的关联 MCP / 后台任务。取消表示终止，无法暂停后恢复。", "Stop Agent and cancel submitted MCP / backend tasks. Cancellation is final.") : t("仅终止指定子任务及其对应后台任务，其他无依赖任务继续执行。", "Terminate only selected tasks and their linked backend work. Other independent tasks continue.")}</DialogDescription></DialogHeader><p className="break-all rounded-xl bg-slate-50 p-3 text-[12px] text-slate-600">{confirm === "all" ? active.map(j => `${j.name} (${j.id})`).join("、") : confirm === "selected" ? selected.join("、") : confirm}</p><div className="flex justify-end gap-2"><button onClick={() => setConfirm(null)} className="rounded-xl border px-4 py-2 text-[13px]">{t("返回", "Back")}</button><button onClick={requestCancel} className="rounded-xl bg-red-600 px-4 py-2 text-[13px] text-white">{t("确认终止", "Confirm termination")}</button></div></DialogContent></Dialog>
  </section>;
}
