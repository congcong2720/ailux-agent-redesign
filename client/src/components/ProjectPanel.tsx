/*
 * ProjectPanel — 项目详情内嵌视图（替换原弹窗，直接渲染在主区域）
 * Tabs: 应用 / 数据 / 成员
 * 设计语言：Ailux 蓝色系，HarmonyOS Sans SC
 */
import { useState } from "react";
import {
  LayoutGrid,
  Database,
  Users,
  Bot,
  FileText,
  GitBranch,
  Plus,
  Upload,
  FileSpreadsheet,
  FileJson,
  Image,
  File,
  Crown,
  Shield,
  User,
  Eye,
  MoreHorizontal,
  Clock,
  CheckCircle2,
  Circle,
  Archive,
  UserPlus,
  ArrowLeft,
  Settings2,
} from "lucide-react";
import { useProject, Project } from "@/contexts/ProjectContext";
import { toast } from "sonner";

type Lang = "zh" | "en";

const FILE_TYPE_ICONS: Record<string, React.ReactNode> = {
  csv: <FileSpreadsheet className="h-4 w-4 text-emerald-600" />,
  json: <FileJson className="h-4 w-4 text-amber-600" />,
  pdb: <File className="h-4 w-4 text-[#161FAD]" />,
  png: <Image className="h-4 w-4 text-purple-600" />,
  xlsx: <FileSpreadsheet className="h-4 w-4 text-emerald-700" />,
  pdf: <FileText className="h-4 w-4 text-red-500" />,
};

const APP_TYPE_ICONS: Record<string, React.ReactNode> = {
  agent: <Bot className="h-4 w-4 text-[#161FAD]" />,
  report: <FileText className="h-4 w-4 text-amber-600" />,
  pipeline: <GitBranch className="h-4 w-4 text-emerald-600" />,
};

const ROLE_CONFIG: Record<string, { label: string; labelEn: string; icon: React.ReactNode; color: string }> = {
  owner: { label: "所有者", labelEn: "Owner", icon: <Crown className="h-3 w-3" />, color: "text-amber-600 bg-amber-50 border-amber-200" },
  admin: { label: "管理员", labelEn: "Admin", icon: <Shield className="h-3 w-3" />, color: "text-[#161FAD] bg-blue-50 border-blue-200" },
  member: { label: "成员", labelEn: "Member", icon: <User className="h-3 w-3" />, color: "text-slate-600 bg-slate-50 border-slate-200" },
  viewer: { label: "观察者", labelEn: "Viewer", icon: <Eye className="h-3 w-3" />, color: "text-slate-400 bg-slate-50 border-slate-100" },
};

const STATUS_CONFIG: Record<string, { label: string; labelEn: string; icon: React.ReactNode; color: string }> = {
  active: { label: "运行中", labelEn: "Active", icon: <CheckCircle2 className="h-3.5 w-3.5" />, color: "text-emerald-600 bg-emerald-50" },
  draft: { label: "草稿", labelEn: "Draft", icon: <Circle className="h-3.5 w-3.5" />, color: "text-slate-500 bg-slate-50" },
  archived: { label: "已归档", labelEn: "Archived", icon: <Archive className="h-3.5 w-3.5" />, color: "text-slate-400 bg-slate-50" },
};

function AppsTab({ project, lang }: { project: Project; lang: Lang }) {
  const apps = project.apps;
  const appTypeLabel: Record<string, { zh: string; en: string }> = {
    agent: { zh: "Agent 对话", en: "Agent" },
    report: { zh: "报告", en: "Report" },
    pipeline: { zh: "工作流", en: "Pipeline" },
  };

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <p className="text-[12px] text-slate-400">{lang === "zh" ? `共 ${apps.length} 个应用` : `${apps.length} apps`}</p>
        <button
          onClick={() => toast.message(lang === "zh" ? "创建应用 — 即将上线" : "Create app — coming soon")}
          className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-[12px] font-medium text-slate-600 transition hover:border-[rgba(23,36,216,0.2)] hover:text-[#161FAD]"
        >
          <Plus className="h-3.5 w-3.5" />
          {lang === "zh" ? "新建" : "New"}
        </button>
      </div>

      {apps.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-[18px] border border-dashed border-slate-200 py-14 text-center">
          <LayoutGrid className="mb-3 h-9 w-9 text-slate-300" />
          <p className="text-[13px] text-slate-400">{lang === "zh" ? "暂无应用" : "No apps yet"}</p>
          <p className="mt-1 text-[11px] text-slate-300">{lang === "zh" ? "创建 Agent、工作流或报告" : "Create an Agent, pipeline, or report"}</p>
        </div>
      ) : (
        <div className="space-y-2">
          {apps.map((app) => {
            const status = STATUS_CONFIG[app.status];
            return (
              <button
                key={app.id}
                onClick={() => toast.message(lang === "zh" ? `打开 ${app.name}` : `Open ${app.name}`)}
                className="flex w-full items-start gap-3 rounded-[16px] border border-slate-100 bg-slate-50/80 px-4 py-3.5 text-left transition hover:border-[rgba(23,36,216,0.12)] hover:bg-white"
              >
                <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-white">
                  {APP_TYPE_ICONS[app.type]}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="truncate text-[13px] font-medium text-slate-800">{app.name}</p>
                    <span className={`flex shrink-0 items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium ${status.color}`}>
                      {status.icon}
                      {lang === "zh" ? status.label : status.labelEn}
                    </span>
                  </div>
                  <p className="mt-0.5 truncate text-[11px] text-slate-400">
                    {appTypeLabel[app.type]?.[lang]} · {app.description}
                  </p>
                  {app.lastRun && (
                    <p className="mt-1 flex items-center gap-1 text-[10px] text-slate-300">
                      <Clock className="h-3 w-3" />
                      {lang === "zh" ? `上次运行 ${app.lastRun}` : `Last run ${app.lastRun}`}
                    </p>
                  )}
                </div>
                <MoreHorizontal className="mt-1 h-4 w-4 shrink-0 text-slate-300" />
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

function DataTab({ project, lang }: { project: Project; lang: Lang }) {
  const assets = project.data;
  const [filter, setFilter] = useState<"all" | "uploaded" | "run-saved">("all");
  const filtered = filter === "all" ? assets : assets.filter((a) => a.source === filter);

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <div className="flex gap-1 rounded-xl bg-slate-100 p-1">
          {(["all", "uploaded", "run-saved"] as const).map((f) => {
            const labels: Record<typeof f, { zh: string; en: string }> = {
              all: { zh: "全部", en: "All" },
              uploaded: { zh: "上传", en: "Uploaded" },
              "run-saved": { zh: "Run 产物", en: "Run Output" },
            };
            return (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`rounded-lg px-2.5 py-1 text-[11px] font-medium transition ${
                  filter === f ? "bg-white text-[#161FAD] shadow-sm" : "text-slate-500 hover:text-slate-700"
                }`}
              >
                {labels[f][lang]}
              </button>
            );
          })}
        </div>
        <button
          onClick={() => toast.message(lang === "zh" ? "上传文件 — 即将上线" : "Upload file — coming soon")}
          className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-[12px] font-medium text-slate-600 transition hover:border-[rgba(23,36,216,0.2)] hover:text-[#161FAD]"
        >
          <Upload className="h-3.5 w-3.5" />
          {lang === "zh" ? "上传" : "Upload"}
        </button>
      </div>

      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-[18px] border border-dashed border-slate-200 py-14 text-center">
          <Database className="mb-3 h-9 w-9 text-slate-300" />
          <p className="text-[13px] text-slate-400">{lang === "zh" ? "暂无数据资产" : "No data assets"}</p>
          <p className="mt-1 text-[11px] text-slate-300">
            {lang === "zh" ? "上传文件或从 Run 产物中保存" : "Upload files or save from Run outputs"}
          </p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-[18px] border border-slate-100 bg-white">
          {filtered.map((asset, idx) => (
            <button
              key={asset.id}
              onClick={() => toast.message(lang === "zh" ? `查看 ${asset.name}` : `View ${asset.name}`)}
              className={`flex w-full items-start gap-4 px-5 py-4 text-left transition hover:bg-slate-50/80 ${
                idx !== 0 ? "border-t border-slate-100" : ""
              }`}
            >
              {/* File type icon */}
              <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-slate-100 bg-slate-50">
                {FILE_TYPE_ICONS[asset.type] ?? <File className="h-4 w-4 text-slate-400" />}
              </div>

              {/* File info — single row layout */}
              <div className="min-w-0 flex-1">
                {/* Single row: name · size · source · date · tags */}
                <div className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1">
                  <p className="shrink-0 text-[13px] font-medium text-slate-800">{asset.name}</p>
                  <span className="text-[11px] text-slate-300">·</span>
                  <span className="shrink-0 text-[12px] text-slate-400">{asset.size}</span>
                  <span className="text-[11px] text-slate-300">·</span>
                  <span
                    className={`inline-flex shrink-0 items-center rounded-full px-2 py-0.5 text-[11px] font-medium ${
                      asset.source === "uploaded"
                        ? "bg-blue-50 text-blue-600"
                        : "bg-emerald-50 text-emerald-600"
                    }`}
                  >
                    {asset.source === "uploaded"
                      ? lang === "zh" ? "已上传" : "Uploaded"
                      : lang === "zh" ? "Run 产物" : "Run output"}
                  </span>
                  <span className="text-[11px] text-slate-300">·</span>
                  <span className="shrink-0 text-[12px] text-slate-400">{asset.updatedAt}</span>
                  {asset.tags && asset.tags.length > 0 && (
                    <>
                      <span className="text-[11px] text-slate-300">·</span>
                      {asset.tags.map((tag) => (
                        <span
                          key={tag}
                          className="shrink-0 rounded-md bg-slate-100 px-2 py-0.5 text-[11px] text-slate-500"
                        >
                          {tag}
                        </span>
                      ))}
                    </>
                  )}
                </div>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function MembersTab({ project, lang }: { project: Project; lang: Lang }) {
  const members = project.members;

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <p className="text-[12px] text-slate-400">
          {lang === "zh" ? `${members.length} 位成员` : `${members.length} members`}
        </p>
        <button
          onClick={() => toast.message(lang === "zh" ? "邀请成员 — 即将上线" : "Invite member — coming soon")}
          className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-[12px] font-medium text-slate-600 transition hover:border-[rgba(23,36,216,0.2)] hover:text-[#161FAD]"
        >
          <UserPlus className="h-3.5 w-3.5" />
          {lang === "zh" ? "邀请" : "Invite"}
        </button>
      </div>

      <div className="space-y-2">
        {members.map((member) => {
          const role = ROLE_CONFIG[member.role];
          const initials = member.name.slice(0, 2).toUpperCase();
          return (
            <div
              key={member.id}
              className="flex items-center gap-3 rounded-[16px] border border-slate-100 bg-slate-50/80 px-4 py-3"
            >
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[linear-gradient(135deg,#161FAD_0%,#848CFE_100%)] text-[12px] font-semibold text-white">
                {initials}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[13px] font-medium text-slate-800">{member.name}</p>
                <p className="text-[11px] text-slate-400">{member.email}</p>
              </div>
              <span className={`flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-medium ${role.color}`}>
                {role.icon}
                {lang === "zh" ? role.label : role.labelEn}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/** 内嵌项目详情视图（直接渲染在主区域，无 overlay） */
export function ProjectPanel({ lang }: { lang: Lang }) {
  const { activeProject, projectDetailView, setProjectDetailView, setMainView } = useProject();

  const tabs: { key: "apps" | "data" | "members"; label: string; labelEn: string; icon: React.ReactNode }[] = [
    { key: "apps", label: "应用", labelEn: "Apps", icon: <LayoutGrid className="h-3.5 w-3.5" /> },
    { key: "data", label: "数据", labelEn: "Data", icon: <Database className="h-3.5 w-3.5" /> },
    { key: "members", label: "成员", labelEn: "Members", icon: <Users className="h-3.5 w-3.5" /> },
  ];

  return (
    <div className="flex h-full min-h-0 flex-col rounded-[24px] border border-white/70 bg-white/84 shadow-[0_16px_40px_rgba(15,23,42,0.045)] backdrop-blur overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-3 border-b border-slate-100 px-4 py-3.5 shrink-0">
        <button
          onClick={() => setMainView("workspace")}
          className="flex h-7 w-7 shrink-0 items-center justify-center rounded-xl text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
          title={lang === "zh" ? "返回工作区" : "Back to workspace"}
        >
          <ArrowLeft className="h-4 w-4" />
        </button>
        <div
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl text-white text-[12px] font-bold"
          style={{ background: `linear-gradient(135deg, ${activeProject.color} 0%, ${activeProject.color}99 100%)` }}
        >
          {activeProject.name.slice(0, 1)}
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-[13px] font-semibold text-[#070261]">{activeProject.name}</p>
          <p className="truncate text-[11px] text-slate-400">{activeProject.description}</p>
        </div>
        <button
          onClick={() => toast.message(lang === "zh" ? "项目设置 — 即将上线" : "Project settings — coming soon")}
          className="flex h-7 w-7 shrink-0 items-center justify-center rounded-xl text-slate-400 transition hover:bg-slate-100 hover:text-[#161FAD]"
          title={lang === "zh" ? "项目设置" : "Project settings"}
        >
          <Settings2 className="h-4 w-4" />
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-slate-100 px-4 py-2 shrink-0">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setProjectDetailView(tab.key)}
            className={`flex items-center gap-1.5 rounded-xl px-3 py-2 text-[12px] font-medium transition ${
              projectDetailView === tab.key
                ? "bg-[rgba(23,36,216,0.08)] text-[#161FAD]"
                : "text-slate-500 hover:bg-slate-50 hover:text-slate-700"
            }`}
          >
            {tab.icon}
            {lang === "zh" ? tab.label : tab.labelEn}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4">
        {projectDetailView === "apps" && <AppsTab project={activeProject} lang={lang} />}
        {projectDetailView === "data" && <DataTab project={activeProject} lang={lang} />}
        {projectDetailView === "members" && <MembersTab project={activeProject} lang={lang} />}
      </div>

      {/* Footer */}
      <div className="border-t border-slate-100 px-4 py-2.5 shrink-0">
        <p className="text-[10px] text-slate-400">
          {lang === "zh" ? `创建于 ${activeProject.createdAt}` : `Created ${activeProject.createdAt}`}
          {activeProject.isDefault && (
            <span className="ml-2 rounded-full bg-[rgba(23,36,216,0.08)] px-2 py-0.5 text-[10px] text-[#161FAD]">
              {lang === "zh" ? "默认项目" : "Default"}
            </span>
          )}
        </p>
      </div>
    </div>
  );
}
