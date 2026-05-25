/*
 * CreateProjectView — 创建新项目的右侧全屏表单视图
 * 只包含：项目名称 + 项目描述
 * 设计语言：Ailux 蓝色系，HarmonyOS Sans SC
 */
import { useState, useRef, useEffect } from "react";
import { ArrowLeft, ChevronRight } from "lucide-react";
import { useProject } from "@/contexts/ProjectContext";
import { toast } from "sonner";

type Lang = "zh" | "en";

export function CreateProjectView({ lang }: { lang: Lang }) {
  const { createProject, setActiveProject, setMainView, setProjectDetailView } = useProject();
  const [name, setName] = useState("");
  const [desc, setDesc] = useState("");
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
    setTimeout(() => {
      const project = createProject(name.trim(), desc.trim());
      setActiveProject(project);
      setProjectDetailView("data");
      setMainView("project-detail");
      toast.success(lang === "zh" ? `项目「${project.name}」已创建` : `Project "${project.name}" created`);
      setSubmitting(false);
    }, 300);
  };

  const handleCancel = () => {
    setMainView("workspace");
  };

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
            {lang === "zh" ? "项目是数据和成员的组织单元" : "Projects organize your data and team"}
          </p>
        </div>
      </div>

      {/* Form body */}
      <div className="min-h-0 flex-1 overflow-y-auto px-8 py-8">
        <div className="mx-auto max-w-[560px] space-y-6">
          {/* Project name */}
          <div>
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
          <div>
            <label className="mb-2 block text-[13px] font-semibold text-slate-700">
              {lang === "zh" ? "项目描述" : "Description"}
              <span className="ml-1.5 text-[11px] font-normal text-slate-400">
                {lang === "zh" ? "（可选）" : "(optional)"}
              </span>
            </label>
            <textarea
              value={desc}
              onChange={(e) => setDesc(e.target.value)}
              rows={5}
              placeholder={lang === "zh" ? "描述项目目标、研究方向或关键背景…" : "Describe your project goals, research direction, or key context…"}
              className="w-full resize-none rounded-[14px] border border-slate-200 bg-white px-4 py-3 text-[13px] text-slate-800 outline-none placeholder:text-slate-400 transition focus:border-[rgba(23,36,216,0.4)] focus:shadow-[0_0_0_3px_rgba(23,36,216,0.06)]"
            />
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-2">
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
      </div>
    </div>
  );
}
