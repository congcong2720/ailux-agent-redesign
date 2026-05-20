/*
 * ResourcePanel — 全局资源视图（内嵌在主区域）
 * Tabs: 公共数据 / Skill / 模版
 * 设计语言：Ailux 蓝色系，HarmonyOS Sans SC
 */
import {
  Database,
  Zap,
  LayoutTemplate,
  ArrowLeft,
  Search,
  FileSpreadsheet,
  File,
  FileText,
  Image,
  Star,
  Clock,
  ArrowUpRight,
} from "lucide-react";
import { useProject } from "@/contexts/ProjectContext";
import { toast } from "sonner";

type Lang = "zh" | "en";

// ── Mock data ──────────────────────────────────────────────────────────────

const PUBLIC_DATA = [
  { id: "pd1", name: "UniProt Human Proteome (2024)", type: "json", size: "1.2 GB", desc: "人类蛋白质组全量数据", tags: ["proteomics", "reference"], starred: true },
  { id: "pd2", name: "PDB Structure Library", type: "pdb", size: "450 GB", desc: "蛋白质三维结构数据库", tags: ["structure", "reference"], starred: false },
  { id: "pd3", name: "Antibody Internalization Benchmark", type: "csv", size: "12 MB", desc: "抗体内化活性基准数据集", tags: ["antibody", "benchmark"], starred: true },
  { id: "pd4", name: "ChEMBL Bioactivity Dataset", type: "xlsx", size: "340 MB", desc: "化合物生物活性数据", tags: ["drug", "bioactivity"], starred: false },
];

const SKILLS = [
  { id: "sk1", name: "蛋白质结构预测", desc: "基于 AlphaFold2/Boltz2 的结构预测工作流", category: "Structure", uses: 128, starred: true },
  { id: "sk2", name: "特征工程 & 筛选", desc: "自动化特征提取、相关性分析与重要性排序", category: "ML", uses: 94, starred: false },
  { id: "sk3", name: "抗体序列分析", desc: "CDR 区域识别、序列比对与多样性评估", category: "Antibody", uses: 76, starred: true },
  { id: "sk4", name: "分子对接评分", desc: "Vina/GNINA 对接打分与构象采样", category: "Docking", uses: 52, starred: false },
  { id: "sk5", name: "ML 模型评估", desc: "交叉验证、多指标对比与模型选择", category: "ML", uses: 110, starred: false },
];

const TEMPLATES = [
  { id: "tp1", name: "内化活性预测流程", desc: "双表位抗体内化活性预测完整模板", type: "pipeline", steps: 6, starred: true },
  { id: "tp2", name: "靶点结合亲和力分析", desc: "KD 测量与结合模式分析报告模板", type: "report", steps: 4, starred: false },
  { id: "tp3", name: "CDR 优化工作流", desc: "CDR 区域突变扫描与功能预测", type: "pipeline", steps: 8, starred: true },
  { id: "tp4", name: "多模型对比评估", desc: "多算法横向对比与最优模型推荐", type: "report", steps: 3, starred: false },
];

const FILE_ICONS: Record<string, React.ReactNode> = {
  csv: <FileSpreadsheet className="h-4 w-4 text-emerald-600" />,
  json: <File className="h-4 w-4 text-amber-600" />,
  pdb: <File className="h-4 w-4 text-[#161FAD]" />,
  xlsx: <FileSpreadsheet className="h-4 w-4 text-emerald-700" />,
  pdf: <FileText className="h-4 w-4 text-red-500" />,
  png: <Image className="h-4 w-4 text-purple-600" />,
};

// ── Sub-tabs ───────────────────────────────────────────────────────────────

function PublicDataTab({ lang }: { lang: Lang }) {
  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-2 rounded-[14px] border border-slate-200 bg-white px-3 py-2">
        <Search className="h-3.5 w-3.5 shrink-0 text-slate-400" />
        <input
          className="flex-1 bg-transparent text-[12px] text-slate-700 outline-none placeholder:text-slate-400"
          placeholder={lang === "zh" ? "搜索公共数据集…" : "Search public datasets…"}
        />
      </div>
      <div className="space-y-2">
        {PUBLIC_DATA.map((item) => (
          <button
            key={item.id}
            onClick={() => toast.message(lang === "zh" ? `查看 ${item.name}` : `View ${item.name}`)}
            className="flex w-full items-start gap-3 rounded-[16px] border border-slate-100 bg-slate-50/80 px-4 py-3.5 text-left transition hover:border-[rgba(23,36,216,0.12)] hover:bg-white"
          >
            <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-white">
              {FILE_ICONS[item.type] ?? <File className="h-4 w-4 text-slate-400" />}
            </div>
            <div className="min-w-0 flex-1">
              {/* Single row: name · starred · size · tags */}
              <div className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1">
                <p className="shrink-0 text-[12px] font-medium text-slate-800">{item.name}</p>
                {item.starred && <Star className="h-3 w-3 shrink-0 fill-amber-400 text-amber-400" />}
                <span className="text-[10px] text-slate-300">·</span>
                <span className="shrink-0 text-[11px] text-slate-400">{item.size}</span>
                {item.tags.length > 0 && (
                  <>
                    <span className="text-[10px] text-slate-300">·</span>
                    {item.tags.map((tag) => (
                      <span key={tag} className="shrink-0 rounded-md bg-slate-100 px-1.5 py-0.5 text-[10px] text-slate-500">{tag}</span>
                    ))}
                  </>
                )}
              </div>
              <p className="mt-0.5 truncate text-[11px] text-slate-400">{item.desc}</p>
            </div>
            <ArrowUpRight className="mt-1 h-3.5 w-3.5 shrink-0 text-slate-300 transition group-hover:text-[#161FAD]" />
          </button>
        ))}
      </div>
    </div>
  );
}

function SkillTab({ lang }: { lang: Lang }) {
  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-2 rounded-[14px] border border-slate-200 bg-white px-3 py-2">
        <Search className="h-3.5 w-3.5 shrink-0 text-slate-400" />
        <input
          className="flex-1 bg-transparent text-[12px] text-slate-700 outline-none placeholder:text-slate-400"
          placeholder={lang === "zh" ? "搜索 Skill…" : "Search skills…"}
        />
      </div>
      <div className="space-y-2">
        {SKILLS.map((skill) => (
          <button
            key={skill.id}
            onClick={() => toast.message(lang === "zh" ? `使用 ${skill.name}` : `Use ${skill.name}`)}
            className="flex w-full items-start gap-3 rounded-[16px] border border-slate-100 bg-slate-50/80 px-4 py-3.5 text-left transition hover:border-[rgba(23,36,216,0.12)] hover:bg-white"
          >
            <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-white">
              <Zap className="h-4 w-4 text-[#161FAD]" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5">
                <p className="truncate text-[12px] font-medium text-slate-800">{skill.name}</p>
                {skill.starred && <Star className="h-3 w-3 shrink-0 fill-amber-400 text-amber-400" />}
                <span className="ml-auto shrink-0 rounded-full bg-slate-100 px-2 py-0.5 text-[10px] text-slate-500">{skill.category}</span>
              </div>
              <p className="mt-0.5 truncate text-[11px] text-slate-400">{skill.desc}</p>
              <p className="mt-1 flex items-center gap-1 text-[10px] text-slate-300">
                <Clock className="h-3 w-3" />
                {lang === "zh" ? `已使用 ${skill.uses} 次` : `Used ${skill.uses} times`}
              </p>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

function TemplateTab({ lang }: { lang: Lang }) {
  const typeLabel: Record<string, { zh: string; en: string }> = {
    pipeline: { zh: "工作流模版", en: "Pipeline template" },
    report: { zh: "报告模版", en: "Report template" },
  };

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-2 rounded-[14px] border border-slate-200 bg-white px-3 py-2">
        <Search className="h-3.5 w-3.5 shrink-0 text-slate-400" />
        <input
          className="flex-1 bg-transparent text-[12px] text-slate-700 outline-none placeholder:text-slate-400"
          placeholder={lang === "zh" ? "搜索模版…" : "Search templates…"}
        />
      </div>
      <div className="space-y-2">
        {TEMPLATES.map((tpl) => (
          <button
            key={tpl.id}
            onClick={() => toast.message(lang === "zh" ? `使用模版 ${tpl.name}` : `Use template ${tpl.name}`)}
            className="flex w-full items-start gap-3 rounded-[16px] border border-slate-100 bg-slate-50/80 px-4 py-3.5 text-left transition hover:border-[rgba(23,36,216,0.12)] hover:bg-white"
          >
            <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-white">
              <LayoutTemplate className="h-4 w-4 text-emerald-600" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5">
                <p className="truncate text-[12px] font-medium text-slate-800">{tpl.name}</p>
                {tpl.starred && <Star className="h-3 w-3 shrink-0 fill-amber-400 text-amber-400" />}
              </div>
              <p className="mt-0.5 truncate text-[11px] text-slate-400">{tpl.desc}</p>
              <p className="mt-1 text-[10px] text-slate-400">
                {typeLabel[tpl.type]?.[lang]} · {lang === "zh" ? `${tpl.steps} 步` : `${tpl.steps} steps`}
              </p>
            </div>
            <ArrowUpRight className="mt-1 h-3.5 w-3.5 shrink-0 text-slate-300" />
          </button>
        ))}
      </div>
    </div>
  );
}

// ── Main export ────────────────────────────────────────────────────────────

export function ResourcePanel({ lang }: { lang: Lang }) {
  const { resourceTab, setResourceTab, setMainView } = useProject();

  const tabs: { key: "data" | "skill" | "template"; label: string; labelEn: string; icon: React.ReactNode }[] = [
    { key: "data", label: "公共数据", labelEn: "Public Data", icon: <Database className="h-3.5 w-3.5" /> },
    { key: "skill", label: "Skill", labelEn: "Skills", icon: <Zap className="h-3.5 w-3.5" /> },
    { key: "template", label: "模版", labelEn: "Templates", icon: <LayoutTemplate className="h-3.5 w-3.5" /> },
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
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-[linear-gradient(135deg,#059669_0%,#34d399_100%)] text-white">
          <Database className="h-4 w-4" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-[13px] font-semibold text-[#070261]">
            {lang === "zh" ? "全局资源" : "Global Resources"}
          </p>
          <p className="text-[11px] text-slate-400">
            {lang === "zh" ? "跨项目共享的数据、技能与模版" : "Shared data, skills & templates across projects"}
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-slate-100 px-4 py-2 shrink-0">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setResourceTab(tab.key)}
            className={`flex items-center gap-1.5 rounded-xl px-3 py-2 text-[12px] font-medium transition ${
              resourceTab === tab.key
                ? "bg-[rgba(5,150,105,0.08)] text-emerald-700"
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
        {resourceTab === "data" && <PublicDataTab lang={lang} />}
        {resourceTab === "skill" && <SkillTab lang={lang} />}
        {resourceTab === "template" && <TemplateTab lang={lang} />}
      </div>
    </div>
  );
}
