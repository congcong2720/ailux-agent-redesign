import { useEffect, useRef, useState } from "react";
import {
  ArrowLeft,
  Bell,
  Camera,
  ReceiptText,
  Save,
  UserCircle2,
} from "lucide-react";
import { useProject } from "@/contexts/ProjectContext";
import { toast } from "sonner";

type Lang = "zh" | "en";
type UserCenterTab = "profile" | "notifications" | "usage";

const usageRecords = [
  { id: "u1", time: "2026-05-29 14:36", item: "DLL3 双抗预测流程", type: "工作流运行", credits: "-128", project: "DLL3 抗体研究" },
  { id: "u2", time: "2026-05-29 11:08", item: "Rosetta 特征计算", type: "Skill 调用", credits: "-42", project: "DLL3 抗体研究" },
  { id: "u3", time: "2026-05-28 18:12", item: "ML 回归建模", type: "模型计算", credits: "-76", project: "DLL3 抗体研究" },
  { id: "u4", time: "2026-05-28 09:30", item: "公共数据引用", type: "资源读取", credits: "-6", project: "EGFR 靶向优化" },
];

const notificationRules = [
  { id: "task-failed", zh: "任务失败或需要人工处理", en: "Task failed or needs action", channel: "即时通知", enabled: true },
  { id: "task-done", zh: "长任务完成与报告生成", en: "Long task completed or report generated", channel: "完成通知", enabled: true },
];

export function UserCenter({ initialTab = "profile", lang }: { initialTab?: UserCenterTab; lang: Lang }) {
  const { setMainView } = useProject();
  const [activeTab, setActiveTab] = useState<UserCenterTab>(initialTab);
  const [displayName, setDisplayName] = useState("于靖华");
  const [avatarUrl, setAvatarUrl] = useState("");
  const avatarInputRef = useRef<HTMLInputElement | null>(null);
  const email = "jinghua.yu@xtalpi.com";
  const organization = "xtalpi";
  const [notificationStates, setNotificationStates] = useState<Record<string, boolean>>(
    () => Object.fromEntries(notificationRules.map((rule) => [rule.id, rule.enabled])),
  );

  useEffect(() => {
    setActiveTab(initialTab);
  }, [initialTab]);

  const tabs: { key: UserCenterTab; label: string; labelEn: string; icon: React.ReactNode }[] = [
    { key: "profile", label: "个人信息", labelEn: "Profile", icon: <UserCircle2 className="h-3.5 w-3.5" /> },
    { key: "notifications", label: "通知设置", labelEn: "Notifications", icon: <Bell className="h-3.5 w-3.5" /> },
    { key: "usage", label: "用量明细", labelEn: "Usage", icon: <ReceiptText className="h-3.5 w-3.5" /> },
  ];

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
            {lang === "zh" ? "管理个人信息、通知设置和用量明细" : "Manage profile, notifications, and usage"}
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
                <label className="grid gap-1.5">
                  <span className="text-[11px] font-medium text-slate-500">{lang === "zh" ? "账号类型" : "Account type"}</span>
                  <input
                    value={lang === "zh" ? "团队成员" : "Team member"}
                    disabled
                    className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-[13px] text-slate-500 outline-none"
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
                  <div>
                    <p className="text-[13px] font-medium text-slate-800">{lang === "zh" ? rule.zh : rule.en}</p>
                    <p className="mt-1 text-[11px] text-slate-400">{rule.channel}</p>
                  </div>
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
            <div className="grid grid-cols-3 gap-3">
              {[
                [lang === "zh" ? "本月任务数" : "Tasks this month", "42"],
                [lang === "zh" ? "模型调用" : "Model calls", "216"],
                [lang === "zh" ? "生成报告" : "Reports", "18"],
              ].map(([label, value]) => (
                <div key={label} className="rounded-[18px] border border-slate-200 bg-white px-4 py-3">
                  <p className="text-[11px] text-slate-400">{label}</p>
                  <p className="mt-1 text-[20px] font-semibold text-[#070261]">{value}</p>
                </div>
              ))}
            </div>
            <div className="overflow-hidden rounded-[20px] border border-slate-200 bg-white">
              <div className="grid grid-cols-[minmax(220px,1fr)_160px_160px_100px] gap-3 border-b border-slate-100 bg-slate-50/80 px-5 py-2.5 text-[11px] font-medium text-slate-400">
                <span>{lang === "zh" ? "任务名称" : "Task name"}</span>
                <span>{lang === "zh" ? "所属项目" : "Project"}</span>
                <span>{lang === "zh" ? "时间" : "Time"}</span>
                <span>Credits</span>
              </div>
              {usageRecords.map((record, index) => (
                <div
                  key={record.id}
                  className={`grid grid-cols-[minmax(220px,1fr)_160px_160px_100px] items-center gap-3 px-5 py-4 text-[12px] ${
                    index !== 0 ? "border-t border-slate-100" : ""
                  }`}
                >
                  <span className="truncate font-medium text-slate-800">{record.item}</span>
                  <span className="truncate text-slate-400">{record.project}</span>
                  <span className="text-slate-400">{record.time}</span>
                  <span className="font-semibold text-[#161FAD]">{record.credits}</span>
                </div>
              ))}
            </div>
          </div>
        ) : null}

      </div>
    </div>
  );
}
