/*
 * CreateProjectView — 创建新项目的右侧全屏表单视图
 * 设计语言：Ailux 蓝色系，HarmonyOS Sans SC
 * 布局：左侧填写表单，右侧展示项目信息预览卡片
 */
import { useState, useRef, useEffect } from "react";
import {
  ArrowLeft,
  FlaskConical,
  Users,
  Database,
  LayoutGrid,
  Sparkles,
  ChevronRight,
} from "lucide-react";
import { useProject } from "@/contexts/ProjectContext";
import { toast } from "sonner";

type Lang = "zh" | "en";

const PROJECT_COLORS = [
  { value: "#161FAD", label: "靛蓝" },
  { value: "#0891b2", label: "青蓝" },
  { value: "#7c3aed", label: "紫色" },
  { value: "#059669", label: "翠绿" },
  { value: "#dc2626", label: "红色" },
  { value: "#d97706", label: "琥珀" },
];

const TEMPLATES = [
  {
    id: "blank",
    icon: <LayoutGrid className="h-5 w-5" />,
    label: { zh: "空白项目", en: "Blank project" },
    desc: { zh: "从零开始，自由构建", en: "Start from scratch" },
  },
  {
    id: "antibody",
    icon: <FlaskConical className="h-5 w-5" />,
    label: { zh: "抗体研究", en: "Antibody Research" },
    desc: { zh: "含内化预测、结构分析模板", en: "Internalization & structure templates" },
  },
  {
    id: "ml",
    icon: <Sparkles className="h-5 w-5" />,
    label: { zh: "ML 建模", en: "ML Modeling" },
    desc: { zh: "特征工程、模型评估流程", en: "Feature engineering & evaluation" },
  },
];

export function CreateProjectView({ lang }: { lang: Lang }) {
  const { createProject, setActiveProject, setMainView, setProjectDetailView } = useProject();
  const [name, setName] = useState("");
  const [desc, setDesc] = useState("");
  const [color, setColor] = useState(PROJECT_COLORS[0].value);
  const [template, setTemplate] = useState("blank");
  const [submitting, setSubmitting] = useState(false);
  const nameRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    nameRef.current?.focus();
  }, []);

  const handleCreate = () => {
    if (!name.trim()) {
      nameRef.current?.focus();
      return;
    }
    setSubmitting(true);
    // Simulate brief async
    setTimeout(() => {
      const project = createProject(name.trim(), desc.trim());
      // Override color with user selection
      (project as { color: string }).color = color;
      setActiveProject(project);
      setProjectDetailView("apps");
      setMainView("project-detail");
      toast.success(lang === "zh" ? `项目「${project.name}」已创建` : `Project "${project.name}" created`);
      setSubmitting(false);
    }, 300);
  };

  const handleCancel = () => {
    setMainView("workspace");
  };

  const previewInitial = name.trim() ? name.trim().slice(0, 1).toUpperCase() : "P";

  return (
    <div className="flex h-full min-h-0 flex-col rounded-[24px] border border-white/70 bg-white/84 shadow-[0_16px_40px_rgba(15,23,42,0.045)] backdrop-blur overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-3 border-b border-slate-100 px-6 py-4 shrink-0">
        <button
          onClick={handleCancel}
          className="flex h-7 w-7 shrink-0 items-center justify-center rounded-xl text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
        >
          <ArrowLeft className="h-4 w-4" />
        </button>
        <div>
          <p className="text-[15px] font-semibold text-[#070261]">
            {lang === "zh" ? "创建新项目" : "Create New Project"}
          </p>
          <p className="text-[11px] text-slate-400">
            {lang === "zh" ? "项目是数据、应用和成员的组织单元" : "Projects organize your data, apps, and team"}
          </p>
        </div>
      </div>

      {/* Body: two-column layout */}
      <div className="min-h-0 flex-1 overflow-y-auto">
        <div className="grid min-h-full grid-cols-1 gap-0 lg:grid-cols-[1fr_360px]">
          {/* Left: form */}
          <div className="border-r border-slate-100 px-8 py-8">
            {/* Project name */}
            <div className="mb-6">
              <label className="mb-2 block text-[13px] font-semibold text-slate-700">
                {lang === "zh" ? "项目名称" : "Project name"}
                <span className="ml-1 text-red-400">*</span>
              </label>
              <input
                ref={nameRef}
                value={name}
                onChange={(e) => setName(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") handleCreate(); }}
                placeholder={lang === "zh" ? "例如：DLL3 抗体研究" : "e.g. DLL3 Antibody Research"}
                className="w-full rounded-[14px] border border-slate-200 bg-white px-4 py-3 text-[14px] text-slate-800 outline-none placeholder:text-slate-400 transition focus:border-[rgba(23,36,216,0.4)] focus:shadow-[0_0_0_3px_rgba(23,36,216,0.06)]"
              />
            </div>

            {/* Description */}
            <div className="mb-6">
              <label className="mb-2 block text-[13px] font-semibold text-slate-700">
                {lang === "zh" ? "项目描述" : "Description"}
                <span className="ml-1.5 text-[11px] font-normal text-slate-400">
                  {lang === "zh" ? "（可选）" : "(optional)"}
                </span>
              </label>
              <textarea
                value={desc}
                onChange={(e) => setDesc(e.target.value)}
                rows={4}
                placeholder={lang === "zh" ? "描述项目目标、研究方向或关键背景…" : "Describe your project goals, research direction, or key context…"}
                className="w-full resize-none rounded-[14px] border border-slate-200 bg-white px-4 py-3 text-[13px] text-slate-800 outline-none placeholder:text-slate-400 transition focus:border-[rgba(23,36,216,0.4)] focus:shadow-[0_0_0_3px_rgba(23,36,216,0.06)]"
              />
            </div>

            {/* Color picker */}
            <div className="mb-6">
              <label className="mb-2 block text-[13px] font-semibold text-slate-700">
                {lang === "zh" ? "项目颜色" : "Project color"}
              </label>
              <div className="flex gap-2.5">
                {PROJECT_COLORS.map((c) => (
                  <button
                    key={c.value}
                    onClick={() => setColor(c.value)}
                    className={`h-8 w-8 rounded-full transition-all ${
                      color === c.value
                        ? "ring-2 ring-offset-2 scale-110"
                        : "hover:scale-105 opacity-70 hover:opacity-100"
                    }`}
                    style={{
                      backgroundColor: c.value,
                      outline: color === c.value ? `2px solid ${c.value}` : undefined,
                      outlineOffset: color === c.value ? "2px" : undefined,
                    }}
                    title={c.label}
                  />
                ))}
              </div>
            </div>

            {/* Template selection */}
            <div className="mb-8">
              <label className="mb-2 block text-[13px] font-semibold text-slate-700">
                {lang === "zh" ? "从模版开始" : "Start from template"}
              </label>
              <div className="space-y-2">
                {TEMPLATES.map((tpl) => (
                  <button
                    key={tpl.id}
                    onClick={() => setTemplate(tpl.id)}
                    className={`flex w-full items-center gap-3 rounded-[14px] border px-4 py-3 text-left transition ${
                      template === tpl.id
                        ? "border-[rgba(23,36,216,0.2)] bg-[rgba(23,36,216,0.04)] shadow-[0_0_0_2px_rgba(23,36,216,0.06)]"
                        : "border-slate-100 bg-slate-50/80 hover:border-slate-200 hover:bg-white"
                    }`}
                  >
                    <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${
                      template === tpl.id ? "bg-[rgba(23,36,216,0.08)] text-[#161FAD]" : "bg-slate-100 text-slate-500"
                    }`}>
                      {tpl.icon}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className={`text-[13px] font-medium ${template === tpl.id ? "text-[#161FAD]" : "text-slate-700"}`}>
                        {tpl.label[lang]}
                      </p>
                      <p className="text-[11px] text-slate-400">{tpl.desc[lang]}</p>
                    </div>
                    {template === tpl.id && (
                      <div className="h-4 w-4 shrink-0 rounded-full bg-[#161FAD] flex items-center justify-center">
                        <svg className="h-2.5 w-2.5 text-white" fill="none" viewBox="0 0 12 12">
                          <path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      </div>
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3">
              <button
                onClick={handleCreate}
                disabled={!name.trim() || submitting}
                className="flex items-center gap-2 rounded-[14px] bg-[#161FAD] px-6 py-3 text-[13px] font-semibold text-white shadow-[0_8px_20px_rgba(23,36,216,0.22)] transition hover:bg-[#1724D8] active:scale-[0.98] disabled:cursor-not-allowed disabled:bg-slate-300 disabled:shadow-none"
              >
                {submitting ? (
                  <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                ) : (
                  <ChevronRight className="h-4 w-4" />
                )}
                {lang === "zh" ? "创建项目" : "Create Project"}
              </button>
              <button
                onClick={handleCancel}
                className="rounded-[14px] border border-slate-200 bg-white px-5 py-3 text-[13px] font-medium text-slate-600 transition hover:bg-slate-50"
              >
                {lang === "zh" ? "取消" : "Cancel"}
              </button>
            </div>
          </div>

          {/* Right: preview card */}
          <div className="flex flex-col gap-6 bg-slate-50/60 px-8 py-8">
            <div>
              <p className="mb-4 text-[11px] uppercase tracking-[0.18em] text-slate-400">
                {lang === "zh" ? "项目预览" : "Preview"}
              </p>

              {/* Project card preview */}
              <div className="rounded-[20px] border border-white bg-white p-5 shadow-[0_8px_24px_rgba(15,23,42,0.06)]">
                <div className="mb-4 flex items-center gap-3">
                  <div
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-[15px] font-bold text-white"
                    style={{ background: `linear-gradient(135deg, ${color} 0%, ${color}aa 100%)` }}
                  >
                    {previewInitial}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[14px] font-semibold text-[#070261]">
                      {name.trim() || (lang === "zh" ? "项目名称" : "Project name")}
                    </p>
                    <p className="truncate text-[11px] text-slate-400">
                      {desc.trim() || (lang === "zh" ? "项目描述" : "Project description")}
                    </p>
                  </div>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { icon: <LayoutGrid className="h-3.5 w-3.5" />, label: lang === "zh" ? "应用" : "Apps", value: "0" },
                    { icon: <Database className="h-3.5 w-3.5" />, label: lang === "zh" ? "数据" : "Data", value: "0" },
                    { icon: <Users className="h-3.5 w-3.5" />, label: lang === "zh" ? "成员" : "Members", value: "1" },
                  ].map((stat) => (
                    <div key={stat.label} className="flex flex-col items-center gap-1 rounded-[12px] bg-slate-50 py-3">
                      <span className="text-slate-400">{stat.icon}</span>
                      <span className="text-[16px] font-bold text-[#161FAD]">{stat.value}</span>
                      <span className="text-[10px] text-slate-400">{stat.label}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Tips */}
            <div className="rounded-[16px] border border-[rgba(23,36,216,0.08)] bg-[rgba(23,36,216,0.03)] p-4">
              <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.12em] text-[#161FAD]">
                {lang === "zh" ? "项目包含" : "What's inside"}
              </p>
              <ul className="space-y-2">
                {[
                  { icon: <LayoutGrid className="h-3.5 w-3.5 shrink-0 text-[#161FAD]" />, text: lang === "zh" ? "Agent 对话、工作流与报告" : "Agent chats, pipelines & reports" },
                  { icon: <Database className="h-3.5 w-3.5 shrink-0 text-emerald-600" />, text: lang === "zh" ? "数据资产（上传 & Run 产物）" : "Data assets (uploads & run outputs)" },
                  { icon: <Users className="h-3.5 w-3.5 shrink-0 text-amber-600" />, text: lang === "zh" ? "成员与权限管理" : "Members & access control" },
                ].map((item, i) => (
                  <li key={i} className="flex items-start gap-2">
                    {item.icon}
                    <span className="text-[12px] text-slate-600">{item.text}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
