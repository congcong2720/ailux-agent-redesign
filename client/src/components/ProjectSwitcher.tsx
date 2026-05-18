/*
 * ProjectSwitcher — 左侧导航栏中的项目切换器
 * 点击展开项目列表，支持切换和创建新项目
 * 设计语言：与现有 Ailux 蓝色系保持一致
 */
import { useState, useRef, useEffect } from "react";
import { ChevronDown, Plus, Check, FolderOpen } from "lucide-react";
import { useProject, Project } from "@/contexts/ProjectContext";
import { toast } from "sonner";

type Lang = "zh" | "en";

function ProjectColorDot({ color, size = "sm" }: { color: string; size?: "sm" | "md" }) {
  const sz = size === "sm" ? "h-2 w-2" : "h-3 w-3";
  return <span className={`${sz} shrink-0 rounded-full`} style={{ backgroundColor: color }} />;
}

export function ProjectSwitcher({ lang }: { lang: Lang }) {
  const { projects, activeProject, setActiveProject, createProject, setProjectPanelOpen, setProjectDetailView } = useProject();
  const [open, setOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const dropdownRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (creating && inputRef.current) {
      inputRef.current.focus();
    }
  }, [creating]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false);
        setCreating(false);
        setNewName("");
        setNewDesc("");
      }
    }
    if (open) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  const handleSelect = (project: Project) => {
    setActiveProject(project);
    setOpen(false);
  };

  const handleCreate = () => {
    if (!newName.trim()) return;
    const project = createProject(newName.trim(), newDesc.trim());
    setActiveProject(project);
    setCreating(false);
    setNewName("");
    setNewDesc("");
    setOpen(false);
    toast.success(lang === "zh" ? `项目「${project.name}」已创建` : `Project "${project.name}" created`);
  };

  const handleOpenDetail = (e: React.MouseEvent, view: "apps" | "data" | "members") => {
    e.stopPropagation();
    setProjectDetailView(view);
    setProjectPanelOpen(true);
    setOpen(false);
  };

  return (
    <div ref={dropdownRef} className="relative">
      {/* Trigger */}
      <button
        onClick={() => setOpen((v) => !v)}
        className={`flex w-full items-center gap-2.5 rounded-[16px] border px-3 py-2.5 text-left transition ${
          open
            ? "border-[rgba(23,36,216,0.18)] bg-white shadow-[0_4px_16px_rgba(23,36,216,0.08)]"
            : "border-slate-100 bg-slate-50/80 hover:border-slate-200 hover:bg-white"
        }`}
      >
        <div
          className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-[11px] font-bold text-white"
          style={{ background: `linear-gradient(135deg, ${activeProject.color} 0%, ${activeProject.color}aa 100%)` }}
        >
          {activeProject.name.slice(0, 1)}
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-[12px] font-semibold text-[#070261]">{activeProject.name}</p>
          {activeProject.isDefault && (
            <p className="text-[10px] text-slate-400">{lang === "zh" ? "默认项目" : "Default project"}</p>
          )}
        </div>
        <ChevronDown className={`h-3.5 w-3.5 shrink-0 text-slate-400 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      {/* Dropdown */}
      {open && (
        <div className="absolute left-0 top-[calc(100%+6px)] z-50 w-full rounded-[18px] border border-slate-200 bg-white/98 p-2 shadow-[0_16px_40px_rgba(15,23,42,0.12)] backdrop-blur">
          {/* Project list */}
          <div className="mb-1.5 space-y-0.5">
            {projects.map((project) => {
              const isActive = project.id === activeProject.id;
              return (
                <button
                  key={project.id}
                  onClick={() => handleSelect(project)}
                  className={`flex w-full items-center gap-2.5 rounded-[12px] px-2.5 py-2 text-left transition ${
                    isActive ? "bg-[rgba(23,36,216,0.06)]" : "hover:bg-slate-50"
                  }`}
                >
                  <ProjectColorDot color={project.color} size="md" />
                  <div className="min-w-0 flex-1">
                    <p className={`truncate text-[12px] font-medium ${isActive ? "text-[#161FAD]" : "text-slate-700"}`}>
                      {project.name}
                    </p>
                    <p className="truncate text-[10px] text-slate-400">{project.description}</p>
                  </div>
                  {isActive && <Check className="h-3.5 w-3.5 shrink-0 text-[#161FAD]" />}
                </button>
              );
            })}
          </div>

          {/* Quick actions for active project */}
          <div className="mb-1.5 rounded-[12px] border border-slate-100 bg-slate-50/80 p-1.5">
            <p className="mb-1 px-1.5 text-[10px] uppercase tracking-wider text-slate-400">
              {lang === "zh" ? "当前项目" : "Current project"}
            </p>
            <div className="flex gap-1">
              {(["apps", "data", "members"] as const).map((view) => {
                const labels = {
                  apps: { zh: "应用", en: "Apps" },
                  data: { zh: "数据", en: "Data" },
                  members: { zh: "成员", en: "Members" },
                };
                return (
                  <button
                    key={view}
                    onClick={(e) => handleOpenDetail(e, view)}
                    className="flex flex-1 items-center justify-center gap-1 rounded-[10px] px-2 py-1.5 text-[11px] font-medium text-slate-600 transition hover:bg-white hover:text-[#161FAD]"
                  >
                    <FolderOpen className="h-3 w-3" />
                    {labels[view][lang]}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="h-px bg-slate-100 my-1.5" />

          {/* Create new project */}
          {creating ? (
            <div className="rounded-[12px] border border-[rgba(23,36,216,0.12)] bg-[rgba(23,36,216,0.04)] p-2.5">
              <input
                ref={inputRef}
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") handleCreate(); if (e.key === "Escape") { setCreating(false); setNewName(""); setNewDesc(""); } }}
                placeholder={lang === "zh" ? "项目名称" : "Project name"}
                className="mb-1.5 w-full rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-[12px] text-slate-800 outline-none placeholder:text-slate-400 focus:border-[rgba(23,36,216,0.3)]"
              />
              <input
                value={newDesc}
                onChange={(e) => setNewDesc(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") handleCreate(); }}
                placeholder={lang === "zh" ? "项目描述（可选）" : "Description (optional)"}
                className="mb-2 w-full rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-[12px] text-slate-800 outline-none placeholder:text-slate-400 focus:border-[rgba(23,36,216,0.3)]"
              />
              <div className="flex gap-1.5">
                <button
                  onClick={handleCreate}
                  disabled={!newName.trim()}
                  className="flex-1 rounded-lg bg-[#161FAD] py-1.5 text-[12px] font-medium text-white transition hover:bg-[#1724D8] disabled:cursor-not-allowed disabled:bg-slate-300"
                >
                  {lang === "zh" ? "创建" : "Create"}
                </button>
                <button
                  onClick={() => { setCreating(false); setNewName(""); setNewDesc(""); }}
                  className="rounded-lg border border-slate-200 px-3 py-1.5 text-[12px] text-slate-500 transition hover:bg-slate-50"
                >
                  {lang === "zh" ? "取消" : "Cancel"}
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={() => setCreating(true)}
              className="flex w-full items-center gap-2 rounded-[12px] px-2.5 py-2 text-[12px] font-medium text-slate-500 transition hover:bg-slate-50 hover:text-[#161FAD]"
            >
              <Plus className="h-3.5 w-3.5" />
              {lang === "zh" ? "创建新项目" : "Create new project"}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
