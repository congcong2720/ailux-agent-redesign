/*
 * ResourcePanel — 全局资源视图（内嵌在主区域）
 * Tabs: 公共数据 / Skill / 模版
 * 设计语言：3列卡片网格 + 分类标题 + 搜索栏 + 说明提示条，参考 Biomni 风格
 * 字体：HarmonyOS Sans SC，主色 #161FAD
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
  ArrowUpRight,
  Star,
  Clock,
} from "lucide-react";
import { useState } from "react";
import { useProject } from "@/contexts/ProjectContext";
import { toast } from "sonner";

type Lang = "zh" | "en";

// ── Mock data ──────────────────────────────────────────────────────────────

const PUBLIC_DATA = [
  { id: "pd1", name: "UniProt Human Proteome", type: "json", size: "1.2 GB", desc: "人类蛋白质组全量数据集", category: "Proteomics", tags: ["proteomics", "reference"], starred: true },
  { id: "pd2", name: "PDB Structure Library", type: "pdb", size: "450 GB", desc: "蛋白质三维结构数据库", category: "Structure", tags: ["structure", "reference"], starred: false },
  { id: "pd3", name: "Antibody Internalization Benchmark", type: "csv", size: "12 MB", desc: "抗体内化活性基准数据集", category: "Antibody", tags: ["antibody", "benchmark"], starred: true },
  { id: "pd4", name: "ChEMBL Bioactivity Dataset", type: "xlsx", size: "340 MB", desc: "化合物生物活性数据", category: "Drug", tags: ["drug", "bioactivity"], starred: false },
  { id: "pd5", name: "TCGA Cancer Genomics", type: "csv", size: "2.1 GB", desc: "肿瘤基因组图谱综合数据", category: "Genomics", tags: ["cancer", "genomics"], starred: true },
  { id: "pd6", name: "AlphaFold DB (Human)", type: "pdb", size: "23 GB", desc: "AlphaFold 人类蛋白质预测结构", category: "Structure", tags: ["structure", "alphafold"], starred: false },
  { id: "pd7", name: "BindingDB Affinity Data", type: "csv", size: "180 MB", desc: "蛋白质-配体结合亲和力数据", category: "Drug", tags: ["binding", "affinity"], starred: false },
  { id: "pd8", name: "SAbDab Antibody DB", type: "json", size: "8.4 MB", desc: "抗体结构数据库", category: "Antibody", tags: ["antibody", "structure"], starred: true },
];

const SKILLS = [
  { id: "sk1", name: "蛋白质结构预测", desc: "基于 AlphaFold2/Boltz2 的结构预测工作流", category: "Structure", uses: 128, starred: true },
  { id: "sk2", name: "特征工程 & 筛选", desc: "自动化特征提取、相关性分析与重要性排序", category: "ML", uses: 94, starred: false },
  { id: "sk3", name: "抗体序列分析", desc: "CDR 区域识别、序列比对与多样性评估", category: "Antibody", uses: 76, starred: true },
  { id: "sk4", name: "分子对接评分", desc: "Vina/GNINA 对接打分与构象采样", category: "Docking", uses: 52, starred: false },
  { id: "sk5", name: "ML 模型评估", desc: "交叉验证、多指标对比与模型选择", category: "ML", uses: 110, starred: false },
  { id: "sk6", name: "序列嵌入生成", desc: "ESM2/ProtTrans 蛋白质语言模型嵌入", category: "Structure", uses: 63, starred: false },
];

const TEMPLATES = [
  { id: "tp1", name: "内化活性预测流程", desc: "双表位抗体内化活性预测完整模板", type: "pipeline", category: "Antibody", steps: 6, starred: true },
  { id: "tp2", name: "靶点结合亲和力分析", desc: "KD 测量与结合模式分析报告模板", type: "report", category: "Drug", steps: 4, starred: false },
  { id: "tp3", name: "CDR 优化工作流", desc: "CDR 区域突变扫描与功能预测", type: "pipeline", category: "Antibody", steps: 8, starred: true },
  { id: "tp4", name: "多模型对比评估", desc: "多算法横向对比与最优模型推荐", type: "report", category: "ML", steps: 3, starred: false },
  { id: "tp5", name: "结构特征提取流程", desc: "从 PDB 文件批量提取物理化学特征", type: "pipeline", category: "Structure", steps: 5, starred: false },
];

const FILE_ICONS: Record<string, React.ReactNode> = {
  csv: <FileSpreadsheet className="h-4 w-4 text-emerald-600" />,
  json: <File className="h-4 w-4 text-amber-600" />,
  pdb: <Database className="h-4 w-4 text-[#161FAD]" />,
  xlsx: <FileSpreadsheet className="h-4 w-4 text-emerald-700" />,
  pdf: <FileText className="h-4 w-4 text-red-500" />,
  png: <Image className="h-4 w-4 text-purple-600" />,
};

// ── Grouped card grid ──────────────────────────────────────────────────────

function groupBy<T extends { category: string }>(items: T[]): Record<string, T[]> {
  return items.reduce((acc, item) => {
    (acc[item.category] = acc[item.category] || []).push(item);
    return acc;
  }, {} as Record<string, T[]>);
}

// ── Sub-tabs ───────────────────────────────────────────────────────────────

function PublicDataTab({ lang }: { lang: Lang }) {
  const [query, setQuery] = useState("");
  const filtered = PUBLIC_DATA.filter(
    (d) =>
      d.name.toLowerCase().includes(query.toLowerCase()) ||
      d.tags.some((t) => t.includes(query.toLowerCase()))
  );
  const grouped = groupBy(filtered);

  return (
    <div className="flex flex-col gap-5">
      {/* Search */}
      <div className="flex items-center gap-2 rounded-[12px] border border-slate-200 bg-white px-3 py-2.5 shadow-sm">
        <Search className="h-3.5 w-3.5 shrink-0 text-slate-400" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="flex-1 bg-transparent text-[13px] text-slate-700 outline-none placeholder:text-slate-400"
          placeholder={lang === "zh" ? "搜索公共数据集…" : "Search public datasets…"}
        />
      </div>

      {/* Hint bar */}
      <div className="rounded-[12px] border border-amber-100 bg-amber-50/60 px-4 py-3 text-[12px] text-amber-800">
        {lang === "zh"
          ? "在对话中使用 @ 引用这些数据集，Agent 可自动查询并从这些来源获取数据。"
          : "Use @ in conversation to reference these datasets. Agent can automatically query and fetch data from these sources."}
      </div>

      {/* Count */}
      <div className="flex items-center gap-1.5 text-[12px] text-slate-500">
        <Database className="h-3.5 w-3.5 text-amber-500" />
        <span>{lang === "zh" ? `${filtered.length} 个数据集可用` : `${filtered.length} datasets available`}</span>
      </div>

      {/* Grouped grid */}
      {Object.entries(grouped).map(([category, items]) => (
        <div key={category}>
          <div className="mb-3 flex items-center gap-2">
            <h3 className="text-[15px] font-semibold text-slate-800" style={{ fontFamily: "Georgia, serif" }}>{category}</h3>
            <span className="text-[12px] text-slate-400">{items.length}</span>
          </div>
          <div className="grid grid-cols-3 gap-3">
            {items.map((item) => (
              <button
                key={item.id}
                onClick={() => toast.message(lang === "zh" ? `查看 ${item.name}` : `View ${item.name}`)}
                className="group relative flex flex-col gap-2 rounded-[14px] border border-slate-200 bg-white p-4 text-left transition hover:border-[#161FAD]/30 hover:shadow-sm"
              >
                {/* Top row: icon + name + external link */}
                <div className="flex items-start gap-2">
                  <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border border-amber-100 bg-amber-50">
                    {FILE_ICONS[item.type] ?? <File className="h-4 w-4 text-slate-400" />}
                  </div>
                  <p className="flex-1 text-[13px] font-semibold leading-tight text-slate-800">{item.name}</p>
                  <ArrowUpRight className="h-3.5 w-3.5 shrink-0 text-slate-300 transition group-hover:text-[#161FAD]" />
                </div>
                {/* Desc */}
                <p className="line-clamp-2 text-[11px] leading-relaxed text-slate-500">{item.desc}</p>
                {/* Tags */}
                <div className="mt-auto flex flex-wrap gap-1">
                  {item.tags.map((tag) => (
                    <span key={tag} className="rounded-full border border-slate-200 px-2 py-0.5 text-[10px] text-slate-500">{tag}</span>
                  ))}
                  {item.starred && <Star className="ml-auto h-3 w-3 fill-amber-400 text-amber-400" />}
                </div>
              </button>
            ))}
          </div>
        </div>
      ))}

      {filtered.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <Database className="mb-3 h-9 w-9 text-slate-200" />
          <p className="text-[13px] text-slate-400">{lang === "zh" ? "没有匹配的数据集" : "No matching datasets"}</p>
        </div>
      )}
    </div>
  );
}

function SkillTab({ lang }: { lang: Lang }) {
  const [query, setQuery] = useState("");
  const filtered = SKILLS.filter(
    (s) =>
      s.name.toLowerCase().includes(query.toLowerCase()) ||
      s.category.toLowerCase().includes(query.toLowerCase())
  );
  const grouped = groupBy(filtered);

  return (
    <div className="flex flex-col gap-5">
      {/* Search */}
      <div className="flex items-center gap-2 rounded-[12px] border border-slate-200 bg-white px-3 py-2.5 shadow-sm">
        <Search className="h-3.5 w-3.5 shrink-0 text-slate-400" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="flex-1 bg-transparent text-[13px] text-slate-700 outline-none placeholder:text-slate-400"
          placeholder={lang === "zh" ? "搜索 Skill…" : "Search skills…"}
        />
      </div>

      {/* Hint bar */}
      <div className="rounded-[12px] border border-blue-100 bg-blue-50/50 px-4 py-3 text-[12px] text-blue-800">
        {lang === "zh"
          ? "在对话中使用 @ 引用这些技能。Agent 可在执行流程中自动调用对应工具。"
          : "Use @ in conversation to reference these skills. Agent can automatically invoke the corresponding tools."}
      </div>

      {/* Count */}
      <div className="flex items-center gap-1.5 text-[12px] text-slate-500">
        <Zap className="h-3.5 w-3.5 text-[#161FAD]" />
        <span>{lang === "zh" ? `${filtered.length} 个技能可用` : `${filtered.length} skills available`}</span>
      </div>

      {/* Grouped grid */}
      {Object.entries(grouped).map(([category, items]) => (
        <div key={category}>
          <div className="mb-3 flex items-center gap-2">
            <h3 className="text-[15px] font-semibold text-slate-800" style={{ fontFamily: "Georgia, serif" }}>{category}</h3>
            <span className="text-[12px] text-slate-400">{items.length}</span>
          </div>
          <div className="grid grid-cols-3 gap-3">
            {items.map((skill) => (
              <button
                key={skill.id}
                onClick={() => toast.message(lang === "zh" ? `使用 ${skill.name}` : `Use ${skill.name}`)}
                className="group relative flex flex-col gap-2 rounded-[14px] border border-slate-200 bg-white p-4 text-left transition hover:border-[#161FAD]/30 hover:shadow-sm"
              >
                <div className="flex items-start gap-2">
                  <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border border-blue-100 bg-blue-50">
                    <Zap className="h-3.5 w-3.5 text-[#161FAD]" />
                  </div>
                  <p className="flex-1 text-[13px] font-semibold leading-tight text-slate-800">{skill.name}</p>
                  <ArrowUpRight className="h-3.5 w-3.5 shrink-0 text-slate-300 transition group-hover:text-[#161FAD]" />
                </div>
                <p className="line-clamp-2 text-[11px] leading-relaxed text-slate-500">{skill.desc}</p>
                <div className="mt-auto flex items-center gap-1.5">
                  <span className="rounded-full border border-slate-200 px-2 py-0.5 text-[10px] text-slate-500">{skill.category}</span>
                  <span className="ml-auto flex items-center gap-1 text-[10px] text-slate-400">
                    <Clock className="h-3 w-3" />
                    {skill.uses}
                  </span>
                  {skill.starred && <Star className="h-3 w-3 fill-amber-400 text-amber-400" />}
                </div>
              </button>
            ))}
          </div>
        </div>
      ))}

      {filtered.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <Zap className="mb-3 h-9 w-9 text-slate-200" />
          <p className="text-[13px] text-slate-400">{lang === "zh" ? "没有匹配的技能" : "No matching skills"}</p>
        </div>
      )}
    </div>
  );
}

function TemplateTab({ lang }: { lang: Lang }) {
  const [query, setQuery] = useState("");
  const filtered = TEMPLATES.filter(
    (t) =>
      t.name.toLowerCase().includes(query.toLowerCase()) ||
      t.category.toLowerCase().includes(query.toLowerCase())
  );
  const grouped = groupBy(filtered);

  const typeLabel: Record<string, { zh: string; en: string }> = {
    pipeline: { zh: "工作流", en: "Pipeline" },
    report: { zh: "报告", en: "Report" },
  };

  return (
    <div className="flex flex-col gap-5">
      {/* Search */}
      <div className="flex items-center gap-2 rounded-[12px] border border-slate-200 bg-white px-3 py-2.5 shadow-sm">
        <Search className="h-3.5 w-3.5 shrink-0 text-slate-400" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="flex-1 bg-transparent text-[13px] text-slate-700 outline-none placeholder:text-slate-400"
          placeholder={lang === "zh" ? "搜索模版…" : "Search templates…"}
        />
      </div>

      {/* Hint bar */}
      <div className="rounded-[12px] border border-emerald-100 bg-emerald-50/50 px-4 py-3 text-[12px] text-emerald-800">
        {lang === "zh"
          ? "选择模版可快速创建标准化的 Agent 执行流程，也可在新建项目时直接选用。"
          : "Select a template to quickly create standardized Agent pipelines, or use them when creating a new project."}
      </div>

      {/* Count */}
      <div className="flex items-center gap-1.5 text-[12px] text-slate-500">
        <LayoutTemplate className="h-3.5 w-3.5 text-emerald-600" />
        <span>{lang === "zh" ? `${filtered.length} 个模版可用` : `${filtered.length} templates available`}</span>
      </div>

      {/* Grouped grid */}
      {Object.entries(grouped).map(([category, items]) => (
        <div key={category}>
          <div className="mb-3 flex items-center gap-2">
            <h3 className="text-[15px] font-semibold text-slate-800" style={{ fontFamily: "Georgia, serif" }}>{category}</h3>
            <span className="text-[12px] text-slate-400">{items.length}</span>
          </div>
          <div className="grid grid-cols-3 gap-3">
            {items.map((tpl) => (
              <button
                key={tpl.id}
                onClick={() => toast.message(lang === "zh" ? `使用模版 ${tpl.name}` : `Use template ${tpl.name}`)}
                className="group relative flex flex-col gap-2 rounded-[14px] border border-slate-200 bg-white p-4 text-left transition hover:border-[#161FAD]/30 hover:shadow-sm"
              >
                <div className="flex items-start gap-2">
                  <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border border-emerald-100 bg-emerald-50">
                    <LayoutTemplate className="h-3.5 w-3.5 text-emerald-600" />
                  </div>
                  <p className="flex-1 text-[13px] font-semibold leading-tight text-slate-800">{tpl.name}</p>
                  <ArrowUpRight className="h-3.5 w-3.5 shrink-0 text-slate-300 transition group-hover:text-[#161FAD]" />
                </div>
                <p className="line-clamp-2 text-[11px] leading-relaxed text-slate-500">{tpl.desc}</p>
                <div className="mt-auto flex flex-wrap items-center gap-1">
                  <span className="rounded-full border border-slate-200 px-2 py-0.5 text-[10px] text-slate-500">
                    {typeLabel[tpl.type]?.[lang]}
                  </span>
                  <span className="rounded-full border border-slate-200 px-2 py-0.5 text-[10px] text-slate-500">
                    {lang === "zh" ? `${tpl.steps} 步` : `${tpl.steps} steps`}
                  </span>
                  {tpl.starred && <Star className="ml-auto h-3 w-3 fill-amber-400 text-amber-400" />}
                </div>
              </button>
            ))}
          </div>
        </div>
      ))}

      {filtered.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <LayoutTemplate className="mb-3 h-9 w-9 text-slate-200" />
          <p className="text-[13px] text-slate-400">{lang === "zh" ? "没有匹配的模版" : "No matching templates"}</p>
        </div>
      )}
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
    <div className="flex h-full min-h-0 flex-col overflow-hidden rounded-[24px] border border-white/70 bg-white/84 shadow-[0_16px_40px_rgba(15,23,42,0.045)] backdrop-blur">
      {/* Header */}
      <div className="flex shrink-0 items-center gap-3 border-b border-slate-100 px-5 py-4">
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
          <p className="text-[14px] font-semibold text-[#070261]">
            {lang === "zh" ? "全局资源" : "Global Resources"}
          </p>
          <p className="text-[11px] text-slate-400">
            {lang === "zh" ? "跨项目共享的数据、技能与模版" : "Shared data, skills & templates across projects"}
          </p>
        </div>
      </div>

      {/* Tabs — full-width segmented style */}
      <div className="shrink-0 border-b border-slate-100">
        <div className="flex">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setResourceTab(tab.key)}
              className={`flex flex-1 items-center justify-center gap-1.5 border-b-2 py-3 text-[13px] font-medium transition ${
                resourceTab === tab.key
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

      {/* Content */}
      <div className="min-h-0 flex-1 overflow-y-auto px-5 py-5">
        {resourceTab === "data" && <PublicDataTab lang={lang} />}
        {resourceTab === "skill" && <SkillTab lang={lang} />}
        {resourceTab === "template" && <TemplateTab lang={lang} />}
      </div>
    </div>
  );
}
