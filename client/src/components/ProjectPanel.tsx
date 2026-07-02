/*
 * ProjectPanel — 项目详情内嵌视图（替换原弹窗，直接渲染在主区域）
 * Tabs: 数据 / 成员
 * 设计语言：Ailux 蓝色系，HarmonyOS Sans SC
 */
import { useRef, useState } from "react";
import {
  Database,
  Users,
  FileText,
  Upload,
  FolderUp,
  Search,
  FileSpreadsheet,
  FileJson,
  Image,
  File,
  Shield,
  User,
  MoreHorizontal,
  UserPlus,
  ArrowLeft,
  Save,
  X,
  Mail,
  Pencil,
  Trash2,
} from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useProject, Project, ProjectMember } from "@/contexts/ProjectContext";
import { toast } from "sonner";

type Lang = "zh" | "en";

const FILE_TYPE_ICONS: Record<string, React.ReactNode> = {
  csv: <FileSpreadsheet className="h-4 w-4 text-emerald-600" />,
  json: <FileJson className="h-4 w-4 text-amber-600" />,
  pdb: <File className="h-4 w-4 text-[#161FAD]" />,
  fasta: <FileText className="h-4 w-4 text-[#161FAD]" />,
  cif: <File className="h-4 w-4 text-[#161FAD]" />,
  a3m: <FileText className="h-4 w-4 text-purple-600" />,
  png: <Image className="h-4 w-4 text-purple-600" />,
  xlsx: <FileSpreadsheet className="h-4 w-4 text-emerald-700" />,
  pdf: <FileText className="h-4 w-4 text-red-500" />,
  docx: <FileText className="h-4 w-4 text-[#161FAD]" />,
  folder: <FolderUp className="h-4 w-4 text-amber-600" />,
};

const ROLE_CONFIG: Record<ProjectMember["role"], { label: string; labelEn: string; icon: React.ReactNode; color: string }> = {
  admin: { label: "管理员", labelEn: "Admin", icon: <Shield className="h-3 w-3" />, color: "text-[#161FAD] bg-blue-50 border-blue-200" },
  member: { label: "成员", labelEn: "Member", icon: <User className="h-3 w-3" />, color: "text-slate-600 bg-slate-50 border-slate-200" },
};

const XPMP_PROJECT_OPTIONS = [
  { code: "", zh: "请选择 XPMP 项目编号", en: "Select an XPMP project code" },
  { code: "CADD-DLL3-2026", zh: "CADD-DLL3-2026 · DLL3 抗体研究", en: "CADD-DLL3-2026 · DLL3 antibody research" },
  { code: "CADD-EGFR-2026", zh: "CADD-EGFR-2026 · EGFR 靶向优化", en: "CADD-EGFR-2026 · EGFR optimization" },
  { code: "CADD-PDL1-2026", zh: "CADD-PDL1-2026 · PD-L1 结合分析", en: "CADD-PDL1-2026 · PD-L1 binding analysis" },
];

function formatFileSize(size: number) {
  if (size >= 1024 * 1024) return `${(size / 1024 / 1024).toFixed(1)} MB`;
  if (size >= 1024) return `${Math.max(1, Math.round(size / 1024))} KB`;
  return `${size} B`;
}

function dataTypeFromName(name: string): Project["data"][number]["type"] {
  const extension = name.split(".").pop()?.toLowerCase();
  if (extension === "csv") return "csv";
  if (extension === "json") return "json";
  if (extension === "pdb") return "pdb";
  if (extension === "png") return "png";
  if (extension === "xlsx") return "xlsx";
  if (extension === "pdf") return "pdf";
  if (extension === "docx") return "docx";
  if (extension === "fasta" || extension === "fa") return "fasta";
  if (extension === "cif") return "cif";
  if (extension === "a3m") return "a3m";
  return "csv";
}

function DataTab({ project, lang }: { project: Project; lang: Lang }) {
  const { addProjectDataAsset, updateProjectDataAsset, deleteProjectDataAsset } = useProject();
  const assets = project.data;
  const [filter, setFilter] = useState<"all" | "uploaded" | "run-saved">("all");
  const [dataSearchQuery, setDataSearchQuery] = useState("");
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [editingAssetId, setEditingAssetId] = useState<string | null>(null);
  const [editingAssetName, setEditingAssetName] = useState("");
  const [deleteAssetId, setDeleteAssetId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const folderInputRef = useRef<HTMLInputElement | null>(null);
  const normalizedDataQuery = dataSearchQuery.trim().toLowerCase();
  const filteredBySource = filter === "all" ? assets : assets.filter((a) => a.source === filter);
  const filtered = normalizedDataQuery
    ? filteredBySource.filter((asset) =>
        [
          asset.name,
          asset.type,
          asset.size,
          asset.updatedAt,
          asset.source,
          asset.description,
          asset.sourceTaskName,
          asset.sourceTaskId,
          asset.savedAt,
          ...(asset.tags ?? []),
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase()
          .includes(normalizedDataQuery),
      )
    : filteredBySource;
  const editingAsset = assets.find((asset) => asset.id === editingAssetId);
  const deleteAsset = assets.find((asset) => asset.id === deleteAssetId);

  const handleUploadFiles = (files: FileList | null) => {
    const selectedFiles = Array.from(files ?? []);
    if (selectedFiles.length === 0) return;

    let createdCount = 0;
    selectedFiles.forEach((file) => {
      const result = addProjectDataAsset(project.id, {
        name: file.name,
        type: dataTypeFromName(file.name),
        size: formatFileSize(file.size),
        source: "uploaded",
        description: lang === "zh" ? "从本地文件上传到项目数据集。" : "Uploaded from local file.",
        tags: ["uploaded", dataTypeFromName(file.name)],
      });
      if (result === "created") createdCount += 1;
    });

    toast.success(lang === "zh" ? `已上传 ${createdCount} 个文件` : `Uploaded ${createdCount} files`);
    setUploadDialogOpen(false);
  };

  const handleUploadFolder = (files: FileList | null) => {
    const selectedFiles = Array.from(files ?? []);
    if (selectedFiles.length === 0) return;

    const folderStats = new Map<string, { count: number; size: number }>();
    selectedFiles.forEach((file) => {
      const relativePath = (file as File & { webkitRelativePath?: string }).webkitRelativePath;
      const folderName = relativePath?.split("/")[0] || (lang === "zh" ? "本地文件夹" : "Local folder");
      const current = folderStats.get(folderName) ?? { count: 0, size: 0 };
      folderStats.set(folderName, { count: current.count + 1, size: current.size + file.size });
    });

    let createdCount = 0;
    folderStats.forEach((stat, folderName) => {
      const result = addProjectDataAsset(project.id, {
        name: folderName,
        type: "folder",
        size: `${stat.count} ${lang === "zh" ? "个文件" : "files"} · ${formatFileSize(stat.size)}`,
        source: "uploaded",
        description: lang === "zh" ? "从本地文件夹上传到项目数据集。" : "Uploaded from local folder.",
        tags: ["folder", "uploaded"],
      });
      if (result === "created") createdCount += 1;
    });

    toast.success(lang === "zh" ? `已上传 ${createdCount} 个文件夹` : `Uploaded ${createdCount} folders`);
    setUploadDialogOpen(false);
  };

  const openAssetEditor = (asset: Project["data"][number]) => {
    setEditingAssetId(asset.id);
    setEditingAssetName(asset.name);
  };

  const handleSaveAssetName = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingAssetId) return;

    const nextName = editingAssetName.trim();
    if (!nextName) {
      toast.error(lang === "zh" ? "数据名称不能为空" : "Data name is required");
      return;
    }

    updateProjectDataAsset(project.id, editingAssetId, nextName);
    setEditingAssetId(null);
    toast.success(lang === "zh" ? "数据名称已更新" : "Data name updated");
  };

  const handleDeleteAsset = () => {
    if (!deleteAssetId) return;
    deleteProjectDataAsset(project.id, deleteAssetId);
    setDeleteAssetId(null);
    toast.success(lang === "zh" ? "数据已删除" : "Data deleted");
  };

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
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
        <div className="flex flex-1 items-center justify-end gap-2">
          <div className="flex min-w-[220px] max-w-[320px] flex-1 items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-1.5">
            <Search className="h-3.5 w-3.5 shrink-0 text-slate-400" />
            <input
              value={dataSearchQuery}
              onChange={(event) => setDataSearchQuery(event.target.value)}
              className="min-w-0 flex-1 bg-transparent text-[12px] text-slate-700 outline-none placeholder:text-slate-400"
              placeholder={lang === "zh" ? "搜索名称 / 类型 / 描述 / 来源" : "Search name / type / description / source"}
            />
          </div>
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept=".fasta,.fa,.pdb,.cif,.a3m,.csv,.xlsx,.json,.pdf,.docx,.png"
            onChange={(event) => {
              handleUploadFiles(event.target.files);
              event.target.value = "";
            }}
            className="hidden"
          />
          <input
            ref={folderInputRef}
            type="file"
            multiple
            onChange={(event) => {
              handleUploadFolder(event.target.files);
              event.target.value = "";
            }}
            className="hidden"
            {...{ webkitdirectory: "", directory: "" }}
          />
          <button
            onClick={() => setUploadDialogOpen(true)}
            className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-[12px] font-medium text-slate-600 transition hover:border-[rgba(23,36,216,0.2)] hover:text-[#161FAD]"
          >
            <Upload className="h-3.5 w-3.5" />
            {lang === "zh" ? "上传" : "Upload"}
          </button>
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-[18px] border border-dashed border-slate-200 py-14 text-center">
          <Database className="mb-3 h-9 w-9 text-slate-300" />
          <p className="text-[13px] text-slate-400">
            {assets.length === 0
              ? lang === "zh" ? "暂无数据资产" : "No data assets"
              : lang === "zh" ? "没有匹配的数据" : "No matching data"}
          </p>
          <p className="mt-1 text-[11px] text-slate-300">
            {assets.length === 0
              ? lang === "zh" ? "上传文件、文件夹或从 Run 产物中保存" : "Upload files, folders, or save from Run outputs"
              : lang === "zh" ? "换个关键词试试，或清空搜索查看全部数据" : "Try another keyword or clear search"}
          </p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-[18px] border border-slate-100 bg-white">
          <div className="grid grid-cols-[minmax(200px,1.2fr)_82px_92px_96px_minmax(180px,1fr)_88px] items-center gap-3 border-b border-slate-100 bg-slate-50/80 px-5 py-2.5 text-[11px] font-medium text-slate-400">
            <span>{lang === "zh" ? "名称" : "Name"}</span>
            <span>{lang === "zh" ? "大小" : "Size"}</span>
            <span>{lang === "zh" ? "来源" : "Source"}</span>
            <span>{lang === "zh" ? "更新时间" : "Updated"}</span>
            <span>{lang === "zh" ? "描述 / 来源任务" : "Description / source task"}</span>
            <span className="text-right">{lang === "zh" ? "操作" : "Actions"}</span>
          </div>
          {filtered.map((asset, idx) => (
            <div
              key={asset.id}
              className={`grid grid-cols-[minmax(200px,1.2fr)_82px_92px_96px_minmax(180px,1fr)_88px] items-center gap-3 px-5 py-4 transition hover:bg-slate-50/80 ${
                idx !== 0 ? "border-t border-slate-100" : ""
              }`}
            >
              <button
                onClick={() => toast.message(lang === "zh" ? `查看 ${asset.name}` : `View ${asset.name}`)}
                className="flex min-w-0 items-center gap-3 text-left"
              >
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-slate-100 bg-slate-50">
                  {FILE_TYPE_ICONS[asset.type] ?? <File className="h-4 w-4 text-slate-400" />}
                </div>
                <p className="min-w-0 truncate text-[13px] font-medium text-slate-800">{asset.name}</p>
              </button>
              <span className="text-[12px] text-slate-400">{asset.size}</span>
              <span
                className={`w-fit rounded-full px-2 py-0.5 text-[11px] font-medium ${
                  asset.source === "uploaded"
                    ? "bg-blue-50 text-blue-600"
                    : "bg-emerald-50 text-emerald-600"
                }`}
              >
                {asset.source === "uploaded"
                  ? lang === "zh" ? "已上传" : "Uploaded"
                  : lang === "zh" ? "Run 产物" : "Run output"}
              </span>
              <span className="text-[12px] text-slate-400">{asset.updatedAt}</span>
              <div className="min-w-0">
                <p className="truncate text-[11px] text-slate-500">{asset.description || (asset.sourceTaskName ? `${lang === "zh" ? "来自" : "From"} ${asset.sourceTaskName}` : "-")}</p>
                {asset.sourceTaskId ? (
                  <p className="mt-0.5 truncate font-mono text-[10px] text-slate-400">{asset.sourceTaskId}{asset.savedAt ? ` · ${asset.savedAt}` : ""}</p>
                ) : null}
              </div>
              <div className="flex justify-end gap-1.5">
                <button
                  onClick={() => openAssetEditor(asset)}
                  className="flex h-8 w-8 items-center justify-center rounded-xl text-slate-400 transition hover:bg-white hover:text-[#161FAD]"
                  title={lang === "zh" ? "编辑名称" : "Edit name"}
                >
                  <Pencil className="h-3.5 w-3.5" />
                </button>
                <button
                  onClick={() => setDeleteAssetId(asset.id)}
                  className="flex h-8 w-8 items-center justify-center rounded-xl text-slate-400 transition hover:bg-red-50 hover:text-red-500"
                  title={lang === "zh" ? "删除" : "Delete"}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <Dialog open={uploadDialogOpen} onOpenChange={setUploadDialogOpen}>
        <DialogContent className="overflow-hidden rounded-[28px] border-white/70 bg-white p-0 shadow-[0_28px_90px_rgba(15,23,42,0.22)] sm:max-w-[760px]">
          <DialogHeader className="border-b border-slate-100 px-6 py-5">
            <DialogTitle className="text-[16px] font-semibold text-[#070261]">
              {lang === "zh" ? "上传项目数据" : "Upload project data"}
            </DialogTitle>
            <p className="mt-1 text-[12px] font-normal text-slate-400">
              {lang === "zh"
                ? "选择本地文件或文件夹，作为当前项目的数据资产。"
                : "Select local files or folders as data assets for this project."}
            </p>
          </DialogHeader>
          <div className="grid gap-5 px-6 py-6">
            <div className="grid gap-4 md:grid-cols-2">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="group flex min-h-[170px] flex-col items-center justify-center rounded-[22px] border border-dashed border-slate-200 bg-slate-50/45 px-6 py-8 text-center transition hover:border-[rgba(23,36,216,0.28)] hover:bg-[rgba(23,36,216,0.03)]"
              >
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-[#161FAD] shadow-sm transition group-hover:shadow-[0_10px_24px_rgba(22,31,173,0.14)]">
                  <Upload className="h-6 w-6" />
                </div>
                <p className="text-[14px] font-semibold text-slate-800">{lang === "zh" ? "选择文件" : "Select files"}</p>
                <p className="mt-2 text-[11px] text-slate-400">FASTA / PDB / CIF / A3M / CSV / XLSX</p>
              </button>
              <button
                type="button"
                onClick={() => folderInputRef.current?.click()}
                className="group flex min-h-[170px] flex-col items-center justify-center rounded-[22px] border border-dashed border-slate-200 bg-slate-50/45 px-6 py-8 text-center transition hover:border-[rgba(23,36,216,0.28)] hover:bg-[rgba(23,36,216,0.03)]"
              >
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-[#161FAD] shadow-sm transition group-hover:shadow-[0_10px_24px_rgba(22,31,173,0.14)]">
                  <FolderUp className="h-6 w-6" />
                </div>
                <p className="text-[14px] font-semibold text-slate-800">{lang === "zh" ? "选择文件夹" : "Select folder"}</p>
                <p className="mt-2 text-[11px] text-slate-400">
                  {lang === "zh" ? "用于批量导入数据目录" : "Import a data directory in batch"}
                </p>
              </button>
            </div>
            <div className="flex items-center justify-end border-t border-slate-100 pt-4">
              <button
                type="button"
                onClick={() => setUploadDialogOpen(false)}
                className="rounded-xl bg-[#161FAD] px-4 py-2 text-[12px] font-semibold text-white transition hover:bg-[#111996] active:scale-[0.97]"
              >
                {lang === "zh" ? "确定" : "Confirm"}
              </button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={Boolean(editingAssetId)} onOpenChange={(open) => !open && setEditingAssetId(null)}>
        <DialogContent className="rounded-[24px] border-white/70 bg-white p-0 shadow-[0_24px_80px_rgba(15,23,42,0.18)] sm:max-w-[440px]">
          <DialogHeader className="border-b border-slate-100 px-5 py-4">
            <DialogTitle className="text-[15px] font-semibold text-[#070261]">
              {lang === "zh" ? "编辑数据名称" : "Edit data name"}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSaveAssetName} className="grid gap-4 px-5 py-5">
            <label className="grid gap-1.5">
              <span className="text-[11px] font-medium text-slate-500">
                {lang === "zh" ? "名称" : "Name"}
              </span>
              <input
                value={editingAssetName}
                onChange={(e) => setEditingAssetName(e.target.value)}
                className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-[13px] text-slate-800 outline-none transition focus:border-[rgba(23,36,216,0.3)]"
                placeholder={editingAsset?.name}
              />
            </label>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setEditingAssetId(null)}
                className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-[12px] font-medium text-slate-500 transition hover:text-slate-700"
              >
                {lang === "zh" ? "取消" : "Cancel"}
              </button>
              <button
                type="submit"
                className="rounded-xl bg-[#161FAD] px-4 py-2 text-[12px] font-semibold text-white transition hover:bg-[#111996] active:scale-[0.97]"
              >
                {lang === "zh" ? "保存" : "Save"}
              </button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={Boolean(deleteAssetId)} onOpenChange={(open) => !open && setDeleteAssetId(null)}>
        <DialogContent className="rounded-[24px] border-white/70 bg-white p-0 shadow-[0_24px_80px_rgba(15,23,42,0.18)] sm:max-w-[420px]">
          <DialogHeader className="border-b border-slate-100 px-5 py-4">
            <DialogTitle className="text-[15px] font-semibold text-[#070261]">
              {lang === "zh" ? "确认删除数据" : "Delete data?"}
            </DialogTitle>
          </DialogHeader>
          <div className="px-5 py-5">
            <p className="text-[13px] leading-relaxed text-slate-600">
              {lang === "zh"
                ? `确定删除「${deleteAsset?.name ?? ""}」吗？删除后将从当前项目数据列表移除。`
                : `Delete "${deleteAsset?.name ?? ""}" from this project?`}
            </p>
            <div className="mt-5 flex justify-end gap-2">
              <button
                onClick={() => setDeleteAssetId(null)}
                className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-[12px] font-medium text-slate-500 transition hover:text-slate-700"
              >
                {lang === "zh" ? "取消" : "Cancel"}
              </button>
              <button
                onClick={handleDeleteAsset}
                className="rounded-xl bg-red-500 px-4 py-2 text-[12px] font-semibold text-white transition hover:bg-red-600 active:scale-[0.97]"
              >
                {lang === "zh" ? "确认删除" : "Delete"}
              </button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function MembersTab({ project, lang }: { project: Project; lang: Lang }) {
  const { addProjectMember, updateProjectMemberRole, removeProjectMember } = useProject();
  const members = project.members;
  const [addOpen, setAddOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<ProjectMember["role"]>("member");
  const [openMemberMenuId, setOpenMemberMenuId] = useState<string | null>(null);
  const [editingMemberId, setEditingMemberId] = useState<string | null>(null);
  const [editingRole, setEditingRole] = useState<ProjectMember["role"]>("member");
  const [removeMemberId, setRemoveMemberId] = useState<string | null>(null);
  const removeMember = members.find((member) => member.id === removeMemberId);

  const handleAddMember = (e: React.FormEvent) => {
    e.preventDefault();
    const normalizedEmail = email.trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
      toast.error(lang === "zh" ? "请输入有效的邮箱地址" : "Enter a valid email address");
      return;
    }

    const added = addProjectMember(project.id, normalizedEmail, role);
    if (!added) return;

    toast.success(
      lang === "zh"
        ? `已添加 ${added.email} 到项目`
        : `Added ${added.email} to the project`
    );
    setEmail("");
    setRole("member");
    setAddOpen(false);
  };

  const openRoleEditor = (member: ProjectMember) => {
    setEditingMemberId(member.id);
    setEditingRole(member.role);
    setOpenMemberMenuId(null);
  };

  const handleSaveRole = (member: ProjectMember) => {
    updateProjectMemberRole(project.id, member.id, editingRole);
    setEditingMemberId(null);
    toast.success(
      lang === "zh"
        ? `已将 ${member.name} 设置为${ROLE_CONFIG[editingRole].label}`
        : `${member.name} is now ${ROLE_CONFIG[editingRole].labelEn}`
    );
  };

  const handleRemoveMember = () => {
    if (!removeMemberId) return;

    if (members.length <= 1) {
      toast.error(lang === "zh" ? "项目至少需要保留 1 位成员" : "Keep at least one project member");
      setRemoveMemberId(null);
      return;
    }

    removeProjectMember(project.id, removeMemberId);
    setRemoveMemberId(null);
    toast.success(lang === "zh" ? "成员已移除" : "Member removed");
  };

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <p className="text-[12px] text-slate-400">
          {lang === "zh" ? `${members.length} 位成员` : `${members.length} members`}
        </p>
        <button
          onClick={() => setAddOpen(true)}
          className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-[12px] font-medium text-slate-600 transition hover:border-[rgba(23,36,216,0.2)] hover:text-[#161FAD]"
        >
          <UserPlus className="h-3.5 w-3.5" />
          {lang === "zh" ? "添加成员" : "Add member"}
        </button>
      </div>

      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent className="rounded-[24px] border-white/70 bg-white p-0 shadow-[0_24px_80px_rgba(15,23,42,0.18)] sm:max-w-[460px]">
          <DialogHeader className="border-b border-slate-100 px-5 py-4">
            <DialogTitle className="text-[15px] font-semibold text-[#070261]">
              {lang === "zh" ? "添加项目成员" : "Add project member"}
            </DialogTitle>
          </DialogHeader>
        <form
          onSubmit={handleAddMember}
          className="grid gap-4 px-5 py-5"
        >
          <label className="grid gap-1.5">
            <span className="text-[11px] font-medium text-slate-500">
              {lang === "zh" ? "邮箱" : "Email"}
            </span>
            <label className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2">
              <Mail className="h-3.5 w-3.5 shrink-0 text-slate-400" />
              <input
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={lang === "zh" ? "name@company.com" : "name@company.com"}
                className="min-w-0 flex-1 bg-transparent text-[12px] text-slate-700 outline-none placeholder:text-slate-300"
              />
            </label>
          </label>
          <label className="grid gap-1.5">
            <span className="text-[11px] font-medium text-slate-500">
              {lang === "zh" ? "角色" : "Role"}
            </span>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value as ProjectMember["role"])}
              className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-[12px] text-slate-600 outline-none transition focus:border-[rgba(23,36,216,0.3)]"
            >
              <option value="admin">{lang === "zh" ? "管理员" : "Admin"}</option>
              <option value="member">{lang === "zh" ? "成员" : "Member"}</option>
            </select>
          </label>
          <div className="flex justify-end gap-2 pt-1">
            <button
              type="button"
              onClick={() => setAddOpen(false)}
              className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-[12px] font-medium text-slate-500 transition hover:text-slate-700"
            >
              {lang === "zh" ? "取消" : "Cancel"}
            </button>
            <button
              type="submit"
              className="rounded-xl bg-[#161FAD] px-4 py-2 text-[12px] font-semibold text-white transition hover:bg-[#111996] active:scale-[0.97]"
            >
              {lang === "zh" ? "添加" : "Add"}
            </button>
          </div>
        </form>
        </DialogContent>
      </Dialog>

      <div className="space-y-2">
        {members.map((member) => {
          const role = ROLE_CONFIG[member.role];
          const initials = member.name.slice(0, 2).toUpperCase();
          const isEditing = editingMemberId === member.id;
          const menuOpen = openMemberMenuId === member.id;
          return (
            <div
              key={member.id}
              className="relative flex items-center gap-3 rounded-[16px] border border-slate-100 bg-slate-50/80 px-4 py-3 transition hover:border-[rgba(23,36,216,0.12)] hover:bg-white"
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
              {isEditing ? (
                <div className="flex items-center gap-2">
                  <select
                    value={editingRole}
                    onChange={(e) => setEditingRole(e.target.value as ProjectMember["role"])}
                    className="h-8 rounded-xl border border-slate-200 bg-white px-2 text-[12px] text-slate-600 outline-none transition focus:border-[rgba(23,36,216,0.3)]"
                  >
                    <option value="admin">{lang === "zh" ? "管理员" : "Admin"}</option>
                    <option value="member">{lang === "zh" ? "成员" : "Member"}</option>
                  </select>
                  <button
                    onClick={() => handleSaveRole(member)}
                    className="h-8 rounded-xl bg-[#161FAD] px-3 text-[12px] font-semibold text-white transition hover:bg-[#111996] active:scale-[0.97]"
                  >
                    {lang === "zh" ? "保存" : "Save"}
                  </button>
                  <button
                    onClick={() => setEditingMemberId(null)}
                    className="flex h-8 w-8 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-400 transition hover:text-slate-600"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setOpenMemberMenuId((current) => (current === member.id ? null : member.id))}
                  className="flex h-8 w-8 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-400 transition hover:border-[rgba(23,36,216,0.2)] hover:text-[#161FAD]"
                  title={lang === "zh" ? "更多" : "More"}
                >
                  <MoreHorizontal className="h-4 w-4" />
                </button>
              )}
              {menuOpen && !isEditing && (
                <div className="absolute right-4 top-[calc(100%-6px)] z-20 w-32 rounded-[14px] border border-slate-200 bg-white p-1.5 shadow-[0_14px_32px_rgba(15,23,42,0.12)]">
                  <button
                    onClick={() => openRoleEditor(member)}
                    className="flex w-full items-center gap-2 rounded-xl px-2.5 py-2 text-left text-[12px] text-slate-600 transition hover:bg-slate-50 hover:text-[#161FAD]"
                  >
                    <Pencil className="h-3.5 w-3.5" />
                    {lang === "zh" ? "编辑角色" : "Edit role"}
                  </button>
                  <button
                    onClick={() => {
                      setRemoveMemberId(member.id);
                      setOpenMemberMenuId(null);
                    }}
                    className="flex w-full items-center gap-2 rounded-xl px-2.5 py-2 text-left text-[12px] text-red-500 transition hover:bg-red-50"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    {lang === "zh" ? "移除成员" : "Remove"}
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>

      <Dialog open={Boolean(removeMemberId)} onOpenChange={(open) => !open && setRemoveMemberId(null)}>
        <DialogContent className="rounded-[24px] border-white/70 bg-white p-0 shadow-[0_24px_80px_rgba(15,23,42,0.18)] sm:max-w-[420px]">
          <DialogHeader className="border-b border-slate-100 px-5 py-4">
            <DialogTitle className="text-[15px] font-semibold text-[#070261]">
              {lang === "zh" ? "确认移除成员" : "Remove member?"}
            </DialogTitle>
          </DialogHeader>
          <div className="px-5 py-5">
            <p className="text-[13px] leading-relaxed text-slate-600">
              {lang === "zh"
                ? `确定将「${removeMember?.name ?? ""}」从当前项目中移除吗？`
                : `Remove "${removeMember?.name ?? ""}" from this project?`}
            </p>
            <div className="mt-5 flex justify-end gap-2">
              <button
                onClick={() => setRemoveMemberId(null)}
                className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-[12px] font-medium text-slate-500 transition hover:text-slate-700"
              >
                {lang === "zh" ? "取消" : "Cancel"}
              </button>
              <button
                onClick={handleRemoveMember}
                className="rounded-xl bg-red-500 px-4 py-2 text-[12px] font-semibold text-white transition hover:bg-red-600 active:scale-[0.97]"
              >
                {lang === "zh" ? "确认移除" : "Remove"}
              </button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

/** 内嵌项目详情视图（直接渲染在主区域，无 overlay） */
export function ProjectPanel({ lang }: { lang: Lang }) {
  const { projects, activeProject, projectDetailView, setProjectDetailView, setMainView, updateProject, deleteProject } = useProject();
  const [editingProject, setEditingProject] = useState(false);
  const [projectName, setProjectName] = useState(activeProject.name);
  const [projectCode, setProjectCode] = useState(activeProject.projectCode ?? "");
  const [projectDescription, setProjectDescription] = useState(activeProject.description);
  const [deleteProjectOpen, setDeleteProjectOpen] = useState(false);

  const openProjectEditor = () => {
    setProjectName(activeProject.name);
    setProjectCode(activeProject.projectCode ?? "");
    setProjectDescription(activeProject.description);
    setEditingProject(true);
  };

  const handleSaveProject = (e: React.FormEvent) => {
    e.preventDefault();
    const nextName = projectName.trim();
    const nextDescription = projectDescription.trim();

    if (!nextName) {
      toast.error(lang === "zh" ? "项目名称不能为空" : "Project name is required");
      return;
    }

    updateProject(activeProject.id, {
      name: nextName,
      projectCode: projectCode.trim() || undefined,
      description: nextDescription || (lang === "zh" ? "暂无项目描述" : "No project description"),
    });
    setEditingProject(false);
    toast.success(lang === "zh" ? "项目信息已更新" : "Project details updated");
  };

  const handleDeleteProject = () => {
    if (projects.length <= 1) {
      toast.error(lang === "zh" ? "至少需要保留 1 个项目" : "Keep at least one project");
      setDeleteProjectOpen(false);
      return;
    }

    const deletedProjectName = activeProject.name;
    deleteProject(activeProject.id);
    setDeleteProjectOpen(false);
    toast.success(lang === "zh" ? `已删除项目「${deletedProjectName}」` : `Deleted project "${deletedProjectName}"`);
  };

  const tabs: { key: "data" | "members"; label: string; labelEn: string; icon: React.ReactNode }[] = [
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
          <div className="flex min-w-0 items-center gap-1.5">
            <p className="truncate text-[13px] font-semibold text-[#070261]">{activeProject.name}</p>
            <button
              onClick={openProjectEditor}
              className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg text-slate-300 transition hover:bg-slate-100 hover:text-[#161FAD]"
              title={lang === "zh" ? "编辑项目信息" : "Edit project details"}
            >
              <Pencil className="h-3.5 w-3.5" />
            </button>
          </div>
          <p className="truncate text-[11px] text-slate-400">
            {activeProject.projectCode ? `${activeProject.projectCode} · ` : ""}{activeProject.description}
          </p>
        </div>
      </div>

      {editingProject && (
        <form
          onSubmit={handleSaveProject}
          className="shrink-0 border-b border-slate-100 bg-[rgba(23,36,216,0.035)] px-4 py-4"
        >
          <div className="mb-3 flex items-start justify-between gap-3">
            <div>
              <p className="text-[13px] font-semibold text-[#070261]">
                {lang === "zh" ? "编辑项目信息" : "Edit project details"}
              </p>
            </div>
            <button
              type="button"
              onClick={() => setEditingProject(false)}
              className="flex h-7 w-7 items-center justify-center rounded-lg text-slate-400 transition hover:bg-white hover:text-slate-600"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
          <div className="grid gap-3">
            <label className="grid gap-1.5">
              <span className="text-[11px] font-medium text-slate-500">
                {lang === "zh" ? "项目名称" : "Project name"}
              </span>
              <input
                value={projectName}
                onChange={(e) => setProjectName(e.target.value)}
                className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-[13px] text-slate-800 outline-none transition focus:border-[rgba(23,36,216,0.3)]"
                placeholder={lang === "zh" ? "输入项目名称" : "Enter project name"}
              />
            </label>
            <label className="grid gap-1.5">
              <span className="text-[11px] font-medium text-slate-500">
                {lang === "zh" ? "项目编号" : "Project code"}
              </span>
              <select
                value={projectCode}
                onChange={(e) => setProjectCode(e.target.value)}
                className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-[13px] text-slate-800 outline-none transition focus:border-[rgba(23,36,216,0.3)]"
              >
                {XPMP_PROJECT_OPTIONS.map((option) => (
                  <option key={option.code || "empty"} value={option.code}>
                    {lang === "zh" ? option.zh : option.en}
                  </option>
                ))}
              </select>
            </label>
            <label className="grid gap-1.5">
              <span className="text-[11px] font-medium text-slate-500">
                {lang === "zh" ? "项目描述" : "Project description"}
              </span>
              <textarea
                value={projectDescription}
                onChange={(e) => setProjectDescription(e.target.value)}
                rows={3}
                className="resize-none rounded-xl border border-slate-200 bg-white px-3 py-2 text-[13px] leading-relaxed text-slate-800 outline-none transition focus:border-[rgba(23,36,216,0.3)]"
                placeholder={lang === "zh" ? "补充项目背景、目标或范围" : "Describe the project background, goal, or scope"}
              />
            </label>
          </div>
          <div className="mt-3 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setDeleteProjectOpen(true)}
              disabled={projects.length <= 1}
              className="mr-auto inline-flex items-center gap-1.5 rounded-xl border border-red-100 bg-red-50 px-3.5 py-2 text-[12px] font-medium text-red-500 transition hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Trash2 className="h-3.5 w-3.5" />
              {lang === "zh" ? "删除项目" : "Delete project"}
            </button>
            <button
              type="button"
              onClick={() => setEditingProject(false)}
              className="rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-[12px] font-medium text-slate-500 transition hover:text-slate-700"
            >
              {lang === "zh" ? "取消" : "Cancel"}
            </button>
            <button
              type="submit"
              className="inline-flex items-center gap-1.5 rounded-xl bg-[#161FAD] px-3.5 py-2 text-[12px] font-semibold text-white transition hover:bg-[#111996] active:scale-[0.97]"
            >
              <Save className="h-3.5 w-3.5" />
              {lang === "zh" ? "保存" : "Save"}
            </button>
          </div>
        </form>
      )}

      <Dialog open={deleteProjectOpen} onOpenChange={setDeleteProjectOpen}>
        <DialogContent className="rounded-[24px] border-white/70 bg-white p-0 shadow-[0_24px_80px_rgba(15,23,42,0.18)] sm:max-w-[420px]">
          <DialogHeader className="border-b border-slate-100 px-5 py-4">
            <DialogTitle className="text-[15px] font-semibold text-[#070261]">
              {lang === "zh" ? "确认删除项目" : "Delete project?"}
            </DialogTitle>
          </DialogHeader>
          <div className="px-5 py-5">
            <p className="text-[13px] leading-relaxed text-slate-600">
              {lang === "zh"
                ? `确定删除「${activeProject.name}」吗？删除后会返回工作区并切换到其他项目。`
                : `Delete "${activeProject.name}"? You will return to the workspace and switch to another project.`}
            </p>
            <div className="mt-5 flex justify-end gap-2">
              <button
                onClick={() => setDeleteProjectOpen(false)}
                className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-[12px] font-medium text-slate-500 transition hover:text-slate-700"
              >
                {lang === "zh" ? "取消" : "Cancel"}
              </button>
              <button
                onClick={handleDeleteProject}
                className="rounded-xl bg-red-500 px-4 py-2 text-[12px] font-semibold text-white transition hover:bg-red-600 active:scale-[0.97]"
              >
                {lang === "zh" ? "确认删除" : "Delete"}
              </button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

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
