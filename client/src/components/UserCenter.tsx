import { useState } from "react";
import {
  ArrowLeft,
  CreditCard,
  Download,
  ReceiptText,
  Save,
  UserCircle2,
} from "lucide-react";
import { useProject } from "@/contexts/ProjectContext";
import { toast } from "sonner";

type Lang = "zh" | "en";
type UserCenterTab = "profile" | "usage" | "billing";

const usageRecords = [
  { id: "u1", time: "2026-05-29 14:36", item: "DLL3 双抗预测流程", type: "工作流运行", credits: "-128", project: "DLL3 抗体研究" },
  { id: "u2", time: "2026-05-29 11:08", item: "Rosetta 特征计算", type: "Skill 调用", credits: "-42", project: "DLL3 抗体研究" },
  { id: "u3", time: "2026-05-28 18:12", item: "ML 回归建模", type: "模型计算", credits: "-76", project: "DLL3 抗体研究" },
  { id: "u4", time: "2026-05-28 09:30", item: "公共数据引用", type: "资源读取", credits: "-6", project: "EGFR 靶向优化" },
];

const bills = [
  { id: "b1", month: "2026-05", status: "待出账", amount: "¥0.00", credits: "252", due: "2026-06-01" },
  { id: "b2", month: "2026-04", status: "已结清", amount: "¥0.00", credits: "1,084", due: "2026-05-01" },
  { id: "b3", month: "2026-03", status: "已结清", amount: "¥0.00", credits: "736", due: "2026-04-01" },
];

export function UserCenter({ lang }: { lang: Lang }) {
  const { setMainView } = useProject();
  const [activeTab, setActiveTab] = useState<UserCenterTab>("profile");
  const [displayName, setDisplayName] = useState("于靖华");
  const [email, setEmail] = useState("jinghua.yu@xtalpi.com");
  const [organization, setOrganization] = useState("xtalpi");

  const tabs: { key: UserCenterTab; label: string; labelEn: string; icon: React.ReactNode }[] = [
    { key: "profile", label: "个人信息", labelEn: "Profile", icon: <UserCircle2 className="h-3.5 w-3.5" /> },
    { key: "usage", label: "消费记录", labelEn: "Usage", icon: <ReceiptText className="h-3.5 w-3.5" /> },
    { key: "billing", label: "账单", labelEn: "Billing", icon: <CreditCard className="h-3.5 w-3.5" /> },
  ];

  const handleSaveProfile = (event: React.FormEvent) => {
    event.preventDefault();
    if (!displayName.trim()) {
      toast.error(lang === "zh" ? "昵称不能为空" : "Display name is required");
      return;
    }
    toast.success(lang === "zh" ? "个人信息已更新" : "Profile updated");
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
            {lang === "zh" ? "管理个人信息、消费记录和账单" : "Manage profile, usage records, and billing"}
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
                <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-400">
                  <UserCircle2 className="h-10 w-10" />
                </div>
                <div>
                  <p className="text-[15px] font-semibold text-[#070261]">{displayName}</p>
                  <p className="mt-1 text-[12px] text-slate-400">{email}</p>
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
                    onChange={(event) => setEmail(event.target.value)}
                    className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-[13px] text-slate-800 outline-none transition focus:border-[rgba(23,36,216,0.3)]"
                  />
                </label>
                <label className="grid gap-1.5">
                  <span className="text-[11px] font-medium text-slate-500">{lang === "zh" ? "组织" : "Organization"}</span>
                  <input
                    value={organization}
                    onChange={(event) => setOrganization(event.target.value)}
                    className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-[13px] text-slate-800 outline-none transition focus:border-[rgba(23,36,216,0.3)]"
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

        {activeTab === "usage" ? (
          <div className="overflow-hidden rounded-[20px] border border-slate-200 bg-white">
            <div className="grid grid-cols-[148px_minmax(180px,1fr)_120px_100px_140px] gap-3 border-b border-slate-100 bg-slate-50/80 px-5 py-2.5 text-[11px] font-medium text-slate-400">
              <span>{lang === "zh" ? "时间" : "Time"}</span>
              <span>{lang === "zh" ? "项目" : "Item"}</span>
              <span>{lang === "zh" ? "类型" : "Type"}</span>
              <span>Credits</span>
              <span>{lang === "zh" ? "所属项目" : "Project"}</span>
            </div>
            {usageRecords.map((record, index) => (
              <div
                key={record.id}
                className={`grid grid-cols-[148px_minmax(180px,1fr)_120px_100px_140px] items-center gap-3 px-5 py-4 text-[12px] ${
                  index !== 0 ? "border-t border-slate-100" : ""
                }`}
              >
                <span className="text-slate-400">{record.time}</span>
                <span className="font-medium text-slate-800">{record.item}</span>
                <span className="text-slate-500">{record.type}</span>
                <span className="font-semibold text-[#161FAD]">{record.credits}</span>
                <span className="truncate text-slate-400">{record.project}</span>
              </div>
            ))}
          </div>
        ) : null}

        {activeTab === "billing" ? (
          <div className="grid gap-4">
            <div className="grid grid-cols-3 gap-3">
              <div className="rounded-[18px] border border-slate-200 bg-white px-4 py-3">
                <p className="text-[11px] text-slate-400">{lang === "zh" ? "当前余额" : "Balance"}</p>
                <p className="mt-1 text-[20px] font-semibold text-[#070261]">7,848</p>
              </div>
              <div className="rounded-[18px] border border-slate-200 bg-white px-4 py-3">
                <p className="text-[11px] text-slate-400">{lang === "zh" ? "本月消费" : "This month"}</p>
                <p className="mt-1 text-[20px] font-semibold text-[#070261]">252</p>
              </div>
              <div className="rounded-[18px] border border-slate-200 bg-white px-4 py-3">
                <p className="text-[11px] text-slate-400">{lang === "zh" ? "账单方式" : "Billing mode"}</p>
                <p className="mt-1 text-[20px] font-semibold text-[#070261]">{lang === "zh" ? "团队账单" : "Team"}</p>
              </div>
            </div>

            <div className="overflow-hidden rounded-[20px] border border-slate-200 bg-white">
              <div className="grid grid-cols-[120px_110px_120px_120px_minmax(120px,1fr)_90px] gap-3 border-b border-slate-100 bg-slate-50/80 px-5 py-2.5 text-[11px] font-medium text-slate-400">
                <span>{lang === "zh" ? "账期" : "Period"}</span>
                <span>{lang === "zh" ? "状态" : "Status"}</span>
                <span>{lang === "zh" ? "金额" : "Amount"}</span>
                <span>Credits</span>
                <span>{lang === "zh" ? "出账日期" : "Billing date"}</span>
                <span className="text-right">{lang === "zh" ? "操作" : "Action"}</span>
              </div>
              {bills.map((bill, index) => (
                <div
                  key={bill.id}
                  className={`grid grid-cols-[120px_110px_120px_120px_minmax(120px,1fr)_90px] items-center gap-3 px-5 py-4 text-[12px] ${
                    index !== 0 ? "border-t border-slate-100" : ""
                  }`}
                >
                  <span className="font-medium text-slate-800">{bill.month}</span>
                  <span className={bill.status === "已结清" ? "text-emerald-600" : "text-amber-600"}>{bill.status}</span>
                  <span className="text-slate-600">{bill.amount}</span>
                  <span className="text-slate-600">{bill.credits}</span>
                  <span className="text-slate-400">{bill.due}</span>
                  <button className="ml-auto flex h-8 w-8 items-center justify-center rounded-xl text-slate-400 transition hover:bg-slate-50 hover:text-[#161FAD]">
                    <Download className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
