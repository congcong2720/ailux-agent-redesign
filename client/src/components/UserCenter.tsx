import { useEffect, useRef, useState } from "react";
import {
  ArrowLeft,
  Bell,
  Camera,
  Check,
  KeyRound,
  Link2,
  Plus,
  ReceiptText,
  Save,
  UserCircle2,
  X,
} from "lucide-react";
import { useProject } from "@/contexts/ProjectContext";
import { toast } from "sonner";

type Lang = "zh" | "en";
type UserCenterTab = "profile" | "notifications" | "usage" | "connectors";

function FeishuMark({ className = "h-8 w-8" }: { className?: string }) {
  return (
    <span className={`inline-flex items-center justify-center rounded-xl bg-[#3370FF] text-white ${className}`}>
      <svg viewBox="0 0 24 24" className="h-[58%] w-[58%]" fill="currentColor" aria-hidden>
        <path d="M4.6 8.2c0-2.3 1.9-4.2 4.2-4.2h.8v4.8c0 .4-.3.7-.7.7H4.6V8.2Zm10.4 0V4h.8c2.3 0 4.2 1.9 4.2 4.2v1.3h-4.3c-.4 0-.7-.3-.7-.7V8.2ZM4.6 14.5v1.3c0 2.3 1.9 4.2 4.2 4.2h.8v-4.8c0-.4-.3-.7-.7-.7H4.6Zm10.4 0c0-.4.3-.7.7-.7h4.3v1.3c0 2.3-1.9 4.2-4.2 4.2h-.8v-4.8Z" />
      </svg>
    </span>
  );
}
type UsagePeriod = "current" | "last" | "quarter" | "custom";

const usageRecords = [
  { id: "u1", time: "2026-05-29 14:36", item: "DLL3 双抗预测流程", type: "工作流运行", tokens: "128K", project: "DLL3 抗体研究" },
  { id: "u2", time: "2026-05-29 11:08", item: "Rosetta 特征计算", type: "Skill 调用", tokens: "42K", project: "DLL3 抗体研究" },
  { id: "u3", time: "2026-05-28 18:12", item: "ML 回归建模", type: "模型计算", tokens: "76K", project: "DLL3 抗体研究" },
  { id: "u4", time: "2026-05-28 09:30", item: "公共数据引用", type: "资源读取", tokens: "6K", project: "EGFR 靶向优化" },
];

const notificationRules = [
  { id: "task-failed", zh: "任务失败", en: "Task failed", enabled: true },
  { id: "hitl-required", zh: "需要人工处理", en: "Human action required", enabled: true },
  { id: "task-done", zh: "长任务完成", en: "Long task completed", enabled: true },
  { id: "report-ready", zh: "报告生成", en: "Report generated", enabled: true },
];

function NexusMark({ className = "h-8 w-8" }: { className?: string }) {
  return (
    <span className={`inline-flex items-center justify-center rounded-xl bg-[#0F766E] text-white ${className}`}>
      <KeyRound className="h-[52%] w-[52%]" />
    </span>
  );
}

function maskNexusKey(raw: string) {
  const key = raw.trim();
  if (key.length < 8) return "ak_****";
  return `${key.slice(0, 2)}_****${key.slice(-4)}`;
}

function testNexusKey(raw: string) {
  const key = raw.trim();
  if (key.length < 8 || /fail/i.test(key)) return false;
  return true;
}

export function UserCenter({ initialTab = "profile", lang }: { initialTab?: UserCenterTab; lang: Lang }) {
  const { setMainView, feishuConnected, setFeishuConnected } = useProject();
  const [activeTab, setActiveTab] = useState<UserCenterTab>(initialTab);
  const [displayName, setDisplayName] = useState("于靖华");
  const [avatarUrl, setAvatarUrl] = useState("");
  const avatarInputRef = useRef<HTMLInputElement | null>(null);
  const email = "jinghua.yu@xtalpi.com";
  const organization = "xtalpi";
  const [notificationStates, setNotificationStates] = useState<Record<string, boolean>>(
    () => Object.fromEntries(notificationRules.map((rule) => [rule.id, rule.enabled])),
  );
  const [usagePeriod, setUsagePeriod] = useState<UsagePeriod>("current");
  const [customUsageStart, setCustomUsageStart] = useState("2026-07-01");
  const [customUsageEnd, setCustomUsageEnd] = useState("2026-07-22");
  const [nexusMode, setNexusMode] = useState<"platform" | "personal">("platform");
  const [nexusMaskedKey, setNexusMaskedKey] = useState<string | null>(null);
  const [keyDialogOpen, setKeyDialogOpen] = useState(false);
  const [draftKey, setDraftKey] = useState("");
  const [keyTestPassed, setKeyTestPassed] = useState(false);

  useEffect(() => {
    setActiveTab(initialTab);
  }, [initialTab]);

  const tabs: { key: UserCenterTab; label: string; labelEn: string; icon: React.ReactNode }[] = [
    { key: "profile", label: "个人信息", labelEn: "Profile", icon: <UserCircle2 className="h-3.5 w-3.5" /> },
    { key: "connectors", label: "连接器", labelEn: "Connectors", icon: <Link2 className="h-3.5 w-3.5" /> },
    { key: "notifications", label: "通知设置", labelEn: "Notifications", icon: <Bell className="h-3.5 w-3.5" /> },
    { key: "usage", label: "用量明细", labelEn: "Usage", icon: <ReceiptText className="h-3.5 w-3.5" /> },
  ];
  const usagePeriods: { key: UsagePeriod; label: string; labelEn: string; summary: [string, string, string] }[] = [
    { key: "current", label: "本月", labelEn: "This month", summary: ["42", "216", "18"] },
    { key: "last", label: "上月", labelEn: "Last month", summary: ["38", "184", "15"] },
    { key: "quarter", label: "近 3 个月", labelEn: "Last 3 months", summary: ["126", "612", "49"] },
    { key: "custom", label: "自定义", labelEn: "Custom", summary: ["18", "96", "7"] },
  ];
  const currentUsagePeriod = usagePeriods.find((period) => period.key === usagePeriod) ?? usagePeriods[0];
  const usagePeriodLabel =
    usagePeriod === "custom"
      ? `${customUsageStart} - ${customUsageEnd}`
      : lang === "zh" ? currentUsagePeriod.label : currentUsagePeriod.labelEn;

  const handleSaveProfile = (event: React.FormEvent) => {
    event.preventDefault();
    if (!displayName.trim()) {
      toast.error(lang === "zh" ? "昵称不能为空" : "Display name is required");
      return;
    }
    toast.success(lang === "zh" ? "个人信息已更新" : "Profile updated");
  };

  const toggleNotification = (id: string) => {
    setNotificationStates((current) => ({ ...current, [id]: !current[id] }));
  };

  const openKeyDialog = () => {
    setDraftKey("");
    setKeyTestPassed(false);
    setKeyDialogOpen(true);
  };

  const handleTestNexusKey = () => {
    if (testNexusKey(draftKey)) {
      setKeyTestPassed(true);
      toast.success(lang === "zh" ? "连接测试通过" : "Connection test passed");
      return;
    }
    setKeyTestPassed(false);
    toast.error(lang === "zh" ? "测试失败，不能标为已连通" : "Test failed. Key cannot be marked connected.");
  };

  const handleSaveNexusKey = () => {
    if (!keyTestPassed || !testNexusKey(draftKey)) {
      toast.error(lang === "zh" ? "请先测通再保存" : "Test the key before saving");
      return;
    }
    setNexusMaskedKey(maskNexusKey(draftKey));
    setNexusMode("personal");
    setKeyDialogOpen(false);
    setDraftKey("");
    setKeyTestPassed(false);
    toast.success(lang === "zh" ? "已切换为我的 Nexus" : "Switched to My Nexus");
  };

  const handleRestorePlatform = () => {
    setNexusMode("platform");
    toast.success(lang === "zh" ? "已恢复使用平台模型" : "Restored platform models");
  };

  const handleRevokePersonalKey = () => {
    setNexusMaskedKey(null);
    setNexusMode("platform");
    toast.success(lang === "zh" ? "已吊销个人 Key，已回到平台模型" : "Personal key revoked. Back to platform models.");
  };

  const handleAvatarChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        setAvatarUrl(reader.result);
        toast.success(lang === "zh" ? "头像已更新" : "Avatar updated");
      }
    };
    reader.readAsDataURL(file);
    event.target.value = "";
  };

  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden rounded-[24px] border border-white/70 bg-white/84 shadow-[0_16px_40px_rgba(15,23,42,0.045)] backdrop-blur">
      <div className="flex shrink-0 items-center gap-3 border-b border-slate-100 px-5 py-4">
        <button
          onClick={() => setMainView("workspace")}
          className="flex h-7 w-7 shrink-0 items-center justify-center rounded-xl text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
          title={lang === "zh" ? "返回工作区" : "Back to workspace"}
        >
          <ArrowLeft className="h-4 w-4" />
        </button>
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl bg-[linear-gradient(135deg,#161FAD_0%,#848CFE_100%)] text-white">
          <UserCircle2 className="h-5 w-5" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-[15px] font-semibold text-[#070261]">{lang === "zh" ? "用户中心" : "User Center"}</p>
          <p className="mt-0.5 text-[11px] text-slate-400">
            {lang === "zh" ? "管理个人信息、连接器、通知设置和用量明细" : "Manage profile, connectors, notifications, and usage"}
          </p>
        </div>
      </div>

      <div className="shrink-0 border-b border-slate-100">
        <div className="flex">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex flex-1 items-center justify-center gap-1.5 border-b-2 py-3 text-[13px] font-medium transition ${
                activeTab === tab.key
                  ? "border-[#161FAD] text-[#161FAD]"
                  : "border-transparent text-slate-500 hover:text-slate-700"
              }`}
            >
              {tab.icon}
              {lang === "zh" ? tab.label : tab.labelEn}
            </button>
          ))}
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto px-5 py-5">
        {activeTab === "profile" ? (
          <form onSubmit={handleSaveProfile} className="grid gap-4">
            <div className="rounded-[20px] border border-slate-200 bg-white p-5">
              <div className="mb-5 flex items-center gap-4">
                <div className="relative h-16 w-16 shrink-0">
                  <button
                    type="button"
                    onClick={() => avatarInputRef.current?.click()}
                    className="group flex h-16 w-16 items-center justify-center overflow-hidden rounded-full bg-slate-100 text-slate-400 transition hover:ring-4 hover:ring-[rgba(23,36,216,0.08)]"
                    title={lang === "zh" ? "编辑头像" : "Edit avatar"}
                  >
                    {avatarUrl ? (
                      <img src={avatarUrl} alt={displayName} className="h-full w-full object-cover" />
                    ) : (
                      <UserCircle2 className="h-10 w-10" />
                    )}
                    <span className="absolute inset-0 flex items-center justify-center rounded-full bg-slate-900/0 text-white opacity-0 transition group-hover:bg-slate-900/35 group-hover:opacity-100">
                      <Camera className="h-5 w-5" />
                    </span>
                  </button>
                  <input
                    ref={avatarInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleAvatarChange}
                    className="hidden"
                  />
                </div>
                <div>
                  <p className="text-[15px] font-semibold text-[#070261]">{displayName}</p>
                  <p className="mt-1 text-[12px] text-slate-400">{email}</p>
                  <button
                    type="button"
                    onClick={() => avatarInputRef.current?.click()}
                    className="mt-2 text-[11px] font-medium text-[#161FAD] transition hover:text-[#1724D8]"
                  >
                    {lang === "zh" ? "编辑头像" : "Edit avatar"}
                  </button>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <label className="grid gap-1.5">
                  <span className="text-[11px] font-medium text-slate-500">{lang === "zh" ? "昵称" : "Display name"}</span>
                  <input
                    value={displayName}
                    onChange={(event) => setDisplayName(event.target.value)}
                    className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-[13px] text-slate-800 outline-none transition focus:border-[rgba(23,36,216,0.3)]"
                  />
                </label>
                <label className="grid gap-1.5">
                  <span className="text-[11px] font-medium text-slate-500">{lang === "zh" ? "邮箱" : "Email"}</span>
                  <input
                    value={email}
                    disabled
                    className="cursor-not-allowed rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-[13px] text-slate-500 outline-none"
                  />
                </label>
                <label className="grid gap-1.5">
                  <span className="text-[11px] font-medium text-slate-500">{lang === "zh" ? "组织" : "Organization"}</span>
                  <input
                    value={organization}
                    disabled
                    className="cursor-not-allowed rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-[13px] text-slate-500 outline-none"
                  />
                </label>
              </div>
              <div className="mt-5 flex justify-end">
                <button
                  type="submit"
                  className="inline-flex items-center gap-1.5 rounded-xl bg-[#161FAD] px-4 py-2 text-[12px] font-semibold text-white transition hover:bg-[#1724D8]"
                >
                  <Save className="h-3.5 w-3.5" />
                  {lang === "zh" ? "保存修改" : "Save changes"}
                </button>
              </div>
            </div>
          </form>
        ) : null}

        {activeTab === "connectors" ? (
          <div className="grid gap-4">
            <div className="rounded-[20px] border border-slate-200 bg-white">
              <div className="border-b border-slate-100 px-5 py-3">
                <p className="text-[13px] font-semibold text-slate-700">{lang === "zh" ? "可用连接器" : "Available connectors"}</p>
              </div>
              <div className="grid gap-3 p-4">
                <article className="flex items-center gap-3 rounded-[18px] border border-slate-100 bg-slate-50/70 px-4 py-4">
                  <FeishuMark className="h-11 w-11 shrink-0" />
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-[14px] font-semibold text-[#070261]">{lang === "zh" ? "飞书" : "Feishu"}</p>
                      {feishuConnected ? (
                        <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-medium text-emerald-600">
                          {lang === "zh" ? "已关联" : "Connected"}
                        </span>
                      ) : null}
                    </div>
                  </div>
                  {feishuConnected ? (
                    <button
                      onClick={() => {
                        setFeishuConnected(false);
                        toast.success(lang === "zh" ? "已取消关联飞书" : "Feishu disconnected");
                      }}
                      className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-emerald-50 text-emerald-600"
                      title={lang === "zh" ? "取消关联" : "Disconnect"}
                    >
                      <Check className="h-4 w-4" />
                    </button>
                  ) : (
                    <button
                      onClick={() => {
                        setFeishuConnected(true);
                        toast.success(lang === "zh" ? "已关联飞书账号" : "Feishu connected");
                      }}
                      className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-500 transition hover:border-[rgba(23,36,216,0.18)] hover:text-[#161FAD]"
                      title={lang === "zh" ? "关联飞书" : "Connect Feishu"}
                    >
                      <Plus className="h-4 w-4" />
                    </button>
                  )}
                </article>

                <article className="flex items-start gap-3 rounded-[18px] border border-slate-100 bg-slate-50/70 px-4 py-4">
                  <NexusMark className="h-11 w-11 shrink-0" />
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-[14px] font-semibold text-[#070261]">Nexus CLI</p>
                      <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-medium text-emerald-600">
                        {lang === "zh" ? "已连通" : "Connected"}
                      </span>
                    </div>
                    <p className="mt-1 text-[12px] text-slate-500">
                      {nexusMode === "platform"
                        ? lang === "zh" ? "使用平台模型" : "Platform models"
                        : lang === "zh" ? "我的 Nexus" : "My Nexus"}
                      {nexusMode === "personal" && nexusMaskedKey ? ` · ${nexusMaskedKey}` : ""}
                    </p>
                    {nexusMode === "platform" && nexusMaskedKey ? (
                      <p className="mt-1 text-[11px] text-slate-400">
                        {lang === "zh" ? `已保存 ${nexusMaskedKey}，未启用` : `Saved ${nexusMaskedKey}, not in use`}
                      </p>
                    ) : null}
                    <div className="mt-3 flex flex-wrap gap-2">
                      <button
                        onClick={openKeyDialog}
                        className="rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-[11px] font-medium text-slate-600 transition hover:border-[rgba(23,36,216,0.18)] hover:text-[#161FAD]"
                      >
                        {nexusMode === "personal" || nexusMaskedKey
                          ? lang === "zh" ? "轮换 Key" : "Rotate key"
                          : lang === "zh" ? "更换为自己的 Key" : "Use my key"}
                      </button>
                      {nexusMode === "personal" ? (
                        <button
                          onClick={handleRestorePlatform}
                          className="rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-[11px] font-medium text-slate-600 transition hover:border-[rgba(23,36,216,0.18)] hover:text-[#161FAD]"
                        >
                          {lang === "zh" ? "恢复平台模型" : "Restore platform"}
                        </button>
                      ) : null}
                      {nexusMaskedKey ? (
                        <button
                          onClick={handleRevokePersonalKey}
                          className="rounded-xl px-3 py-1.5 text-[11px] font-medium text-slate-400 transition hover:text-red-500"
                        >
                          {lang === "zh" ? "吊销" : "Revoke"}
                        </button>
                      ) : null}
                    </div>
                  </div>
                </article>
              </div>
            </div>
          </div>
        ) : null}

        {activeTab === "notifications" ? (
          <div className="grid gap-4">
            <div className="overflow-hidden rounded-[20px] border border-slate-200 bg-white">
              <div className="border-b border-slate-100 bg-slate-50/80 px-5 py-3">
                <p className="text-[13px] font-semibold text-slate-700">{lang === "zh" ? "通知规则" : "Notification rules"}</p>
              </div>
              {notificationRules.map((rule, index) => (
                <div
                  key={rule.id}
                  className={`flex items-center justify-between gap-4 px-5 py-4 ${index !== 0 ? "border-t border-slate-100" : ""}`}
                >
                  <p className="text-[13px] font-medium text-slate-800">{lang === "zh" ? rule.zh : rule.en}</p>
                  <button
                    onClick={() => toggleNotification(rule.id)}
                    className={`relative h-6 w-11 rounded-full transition ${
                      notificationStates[rule.id] ? "bg-[#161FAD]" : "bg-slate-200"
                    }`}
                    aria-pressed={notificationStates[rule.id]}
                  >
                    <span
                      className={`absolute top-1 h-4 w-4 rounded-full bg-white transition ${
                        notificationStates[rule.id] ? "left-6" : "left-1"
                      }`}
                    />
                  </button>
                </div>
              ))}
            </div>
          </div>
        ) : null}

        {activeTab === "usage" ? (
          <div className="grid gap-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-[13px] font-semibold text-[#070261]">{lang === "zh" ? "用量记录" : "Usage records"}</p>
                <p className="mt-1 text-[11px] text-slate-400">
                  {lang === "zh" ? `当前周期：${usagePeriodLabel}` : `Period: ${usagePeriodLabel}`}
                </p>
              </div>
              <div className="inline-flex rounded-full border border-slate-200 bg-white p-1 shadow-sm">
                {usagePeriods.map((period) => (
                  <button
                    key={period.key}
                    onClick={() => setUsagePeriod(period.key)}
                    className={`rounded-full px-3 py-1.5 text-[11px] font-medium transition ${
                      usagePeriod === period.key ? "bg-[#161FAD] text-white shadow-sm" : "text-slate-500 hover:bg-slate-50 hover:text-slate-700"
                    }`}
                  >
                    {lang === "zh" ? period.label : period.labelEn}
                  </button>
                ))}
              </div>
            </div>
            {usagePeriod === "custom" ? (
              <div className="flex flex-wrap items-center gap-2 rounded-[16px] border border-slate-200 bg-white px-4 py-3">
                <span className="text-[12px] font-medium text-slate-500">{lang === "zh" ? "时间范围" : "Date range"}</span>
                <input
                  type="date"
                  value={customUsageStart}
                  onChange={(event) => setCustomUsageStart(event.target.value)}
                  className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-[12px] text-slate-700 outline-none focus:border-[rgba(23,36,216,0.3)]"
                />
                <span className="text-[12px] text-slate-400">-</span>
                <input
                  type="date"
                  value={customUsageEnd}
                  onChange={(event) => setCustomUsageEnd(event.target.value)}
                  className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-[12px] text-slate-700 outline-none focus:border-[rgba(23,36,216,0.3)]"
                />
              </div>
            ) : null}
            <div className="grid grid-cols-3 gap-3">
              {[
                [lang === "zh" ? `${usagePeriod === "custom" ? "所选周期" : currentUsagePeriod.label}任务数` : "Tasks", currentUsagePeriod.summary[0]],
                [lang === "zh" ? "Skill 调用" : "Skill calls", currentUsagePeriod.summary[1]],
                [lang === "zh" ? "生成报告" : "Reports", currentUsagePeriod.summary[2]],
              ].map(([label, value]) => (
                <div key={label} className="rounded-[18px] border border-slate-200 bg-white px-4 py-3">
                  <p className="text-[11px] text-slate-400">{label}</p>
                  <p className="mt-1 text-[20px] font-semibold text-[#070261]">{value}</p>
                </div>
              ))}
            </div>
            <div className="overflow-hidden rounded-[20px] border border-slate-200 bg-white">
              <div className="flex items-center justify-between border-b border-slate-100 bg-white px-5 py-3">
                <p className="text-[13px] font-semibold text-slate-700">
                  {lang === "zh" ? `${usagePeriod === "custom" ? "所选周期" : currentUsagePeriod.label}用量明细` : `${usagePeriodLabel} usage`}
                </p>
              </div>
              <div className="grid grid-cols-[minmax(220px,1fr)_170px_170px_120px] gap-3 border-b border-slate-100 bg-slate-50/80 px-5 py-2.5 text-[11px] font-medium text-slate-400">
                <span>{lang === "zh" ? "任务名称" : "Task name"}</span>
                <span>{lang === "zh" ? "所属项目" : "Project"}</span>
                <span>{lang === "zh" ? "时间" : "Time"}</span>
                <span>{lang === "zh" ? "token 使用量" : "Token usage"}</span>
              </div>
              {usageRecords.map((record, index) => (
                <div
                  key={record.id}
                  className={`grid grid-cols-[minmax(220px,1fr)_170px_170px_120px] items-center gap-3 px-5 py-4 text-[12px] ${
                    index !== 0 ? "border-t border-slate-100" : ""
                  }`}
                >
                  <span className="truncate font-medium text-slate-800">{record.item}</span>
                  <span className="truncate text-slate-400">{record.project}</span>
                  <span className="text-slate-400">{record.time}</span>
                  <span className="font-semibold text-[#161FAD]">{record.tokens}</span>
                </div>
              ))}
            </div>
          </div>
        ) : null}

      </div>

      {keyDialogOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 px-5">
          <div className="w-full max-w-[440px] overflow-hidden rounded-[24px] bg-white shadow-[0_24px_80px_rgba(15,23,42,0.22)]">
            <div className="flex items-start justify-between gap-4 border-b border-slate-100 px-5 py-4">
              <div>
                <p className="text-[16px] font-semibold text-[#070261]">{lang === "zh" ? "接入个人 Nexus Key" : "Use a personal Nexus key"}</p>
                <p className="mt-1 text-[12px] text-slate-400">
                  {lang === "zh" ? "测通后才会启用。密钥只显示掩码，不回显明文。" : "The key is enabled only after a successful test. Only a masked value is stored."}
                </p>
              </div>
              <button
                onClick={() => setKeyDialogOpen(false)}
                className="rounded-full p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="grid gap-3 px-5 py-4">
              <label className="grid gap-1.5">
                <span className="text-[11px] font-medium text-slate-500">{lang === "zh" ? "个人 Key" : "Personal key"}</span>
                <input
                  type="password"
                  autoComplete="off"
                  value={draftKey}
                  onChange={(event) => {
                    setDraftKey(event.target.value);
                    setKeyTestPassed(false);
                  }}
                  placeholder="ak_••••••••"
                  className="rounded-xl border border-slate-200 bg-white px-3 py-2 font-mono text-[13px] text-slate-800 outline-none transition focus:border-[rgba(23,36,216,0.3)]"
                />
              </label>
              <div className="flex justify-end gap-2">
                <button
                  onClick={handleTestNexusKey}
                  className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-[12px] font-medium text-slate-600 transition hover:border-[rgba(23,36,216,0.18)] hover:text-[#161FAD]"
                >
                  {lang === "zh" ? "测试连接" : "Test connection"}
                </button>
                <button
                  onClick={handleSaveNexusKey}
                  disabled={!keyTestPassed}
                  className="rounded-xl bg-[#161FAD] px-3 py-2 text-[12px] font-semibold text-white transition hover:bg-[#1724D8] disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-400"
                >
                  {lang === "zh" ? "保存并启用" : "Save and enable"}
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
