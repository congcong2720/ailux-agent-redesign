/*
 * ResourcePanel — 全局资源视图（内嵌在主区域）
 * Tabs: 公共数据 / 工具 / Skill
 * 设计语言：3列卡片网格 + 分类标题 + 搜索栏 + 说明提示条，参考 Biomni 风格
 * 字体：HarmonyOS Sans SC，主色 #161FAD
 */
import {
  Database,
  Zap,
  ArrowLeft,
  Search,
  Clock,
  Globe2,
  PanelRightOpen,
  Pencil,
  Share2,
  Users,
  Brain,
  PauseCircle,
  PlayCircle,
  Plus,
  Trash2,
} from "lucide-react";
import { useEffect, useState } from "react";
import { useProject, type AgentPreference, type UserResource } from "@/contexts/ProjectContext";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { toast } from "sonner";

type Lang = "zh" | "en";

// ── Mock data ──────────────────────────────────────────────────────────────

export const PUBLIC_DATA = [
  {
    id: "pd-oas",
    name: "OAS",
    type: "csv",
    size: "1B+ seqs",
    desc: "Observed Antibody Space，收集并注释大规模免疫组库序列，支持抗体分析和 AI 模型训练。",
    category: "Antibody",
    tags: ["antibody", "repertoire", "sequence"],
    starred: true,
  },
  {
    id: "pd-udb",
    name: "UDB",
    type: "csv",
    size: "14,986 pairs",
    desc: "治疗性抗体商业数据库子集，包含成对 VH/VL 序列、靶点、专利和临床相关信息。",
    category: "Antibody",
    tags: ["therapeutic", "patent", "paired-vh-vl"],
    starred: true,
  },
  {
    id: "pd-zhydb",
    name: "ZHYDB",
    type: "csv",
    size: "patent set",
    desc: "智慧芽抗体专利挖掘数据集，结构化整理抗原-抗体配对、亲和力实验和表位信息。",
    category: "Antibody",
    tags: ["patent", "affinity", "epitope"],
    starred: true,
  },
  {
    id: "pd-sabdab",
    name: "SAbDab",
    type: "pdb",
    size: "9,521 PDB",
    desc: "结构抗体数据库，汇总 PDB 中抗体结构、抗原复合物、CDR 注释和亲和力数据。",
    category: "Structure",
    tags: ["antibody", "structure", "pdb"],
    starred: true,
  },
  {
    id: "pd-abnativ",
    name: "AbNatiV",
    type: "csv",
    size: "VHH splits",
    desc: "用于评估抗体和纳米抗体 nativeness 的数据集，支持人源化、hit selection 和 de novo 设计评估。",
    category: "Nanobody",
    tags: ["nanobody", "humanization", "nativeness"],
    starred: false,
  },
  {
    id: "pd-cycpeptmpdb",
    name: "CycPeptMPDB",
    type: "csv",
    size: "7,991 peptides",
    desc: "环肽膜通透性数据库，包含实验通透性、理化性质、HELM 序列、SMILES 和 3D 结构。",
    category: "Peptide",
    tags: ["cyclic-peptide", "permeability", "drug-design"],
    starred: false,
  },
  {
    id: "pd-kydab",
    name: "KyDab",
    type: "csv",
    size: "120K+ seqs",
    desc: "Kymouse 抗体发现数据集，覆盖免疫原、成对重轻链序列和实验表征克隆。",
    category: "Antibody",
    tags: ["kymouse", "paired-antibody", "spr"],
    starred: false,
  },
  {
    id: "pd-flab-sarscov2",
    name: "FLAb SARS-CoV-2",
    type: "csv",
    size: "352K binding",
    desc: "FLAb 上游 SARS-CoV-2 抗体结合数据集，包含大量抗体-肽结合实验记录。",
    category: "FLAb",
    tags: ["flab", "binding", "sars-cov-2"],
    starred: false,
  },
];

export const SKILLS = [
  {
    id: "sk-prodigy",
    skillId: "prodigy_feature_calculation",
    name: "PRODIGY 特征计算",
    desc: "提取抗体-抗原界面的相互作用信息，为后续双抗功能预测提供基础特征。",
    category: "抗体设计",
    ability: "特征计算",
    uses: 86,
    starred: true,
    tags: ["interface", "csv", "XAD017"],
    inputs: "base_path / folders",
    outputs: "prodigy_features.csv",
  },
  {
    id: "sk-rosetta",
    skillId: "rosetta_feature_calculation",
    name: "Rosetta 特征计算",
    desc: "计算结构打分与能量学特征，帮助评估候选抗体结构稳定性和界面质量。",
    category: "抗体设计",
    ability: "特征计算",
    uses: 74,
    starred: true,
    tags: ["rosetta", "energy", "structure"],
    inputs: "base_path / folders",
    outputs: "结构能量与运行日志",
  },
  {
    id: "sk-epitope-binder",
    skillId: "epitope_binder_feature_calculation",
    name: "表位-结合域特征计算",
    desc: "分析表位与结合域的上下文特征，用于解释不同 binder 的结构和功能差异。",
    category: "抗体设计",
    ability: "特征计算",
    uses: 68,
    starred: false,
    tags: ["epitope", "binder", "pdb"],
    inputs: "pdb_folder",
    outputs: "表位 / binder 描述符",
  },
  {
    id: "sk-bi-binder",
    skillId: "bi_binder_feature_combination",
    name: "双结合域特征组合",
    desc: "把两个结合臂的特征组合成双表位双抗特征，用于比较不同组合方案。",
    category: "抗体设计",
    ability: "特征工程",
    uses: 61,
    starred: false,
    tags: ["bispecific", "feature-combination"],
    inputs: "base_path / folders",
    outputs: "双抗组合特征",
  },
  {
    id: "sk-correlation",
    skillId: "feature_correlation_analysis",
    name: "特征相关性分析",
    desc: "分析特征之间的相关性，筛选关键特征，并辅助解释模型判断依据。",
    category: "抗体设计",
    ability: "结果解释",
    uses: 93,
    starred: true,
    tags: ["correlation", "importance", "filtering"],
    inputs: "base_path / folders",
    outputs: "correlation_matrix.png / filtering CSV",
  },
  {
    id: "sk-ml-regression",
    skillId: "ml_regression",
    name: "ML 回归建模",
    desc: "基于结构与界面特征训练回归模型，预测候选双抗的功能表现。",
    category: "抗体设计",
    ability: "模型预测",
    uses: 88,
    starred: true,
    tags: ["gbdt", "lightgbm", "regression"],
    inputs: "base_path / folders",
    outputs: "预测 CSV / 特征重要性 CSV",
  },
];

export const TEMPLATES = [
  {
    id: "tp-bispecific-prediction",
    name: "双抗预测流程",
    desc: "面向双表位双抗候选物的标准预测模板，覆盖数据读取、结构特征计算、特征筛选与机器学习预测。",
    type: "pipeline",
    category: "抗体设计",
    steps: 9,
    starred: true,
    bestFor: "已有双抗候选结构和实验表格，需要快速完成特征计算、筛选与预测建模。",
    output: "特征表、相关性分析结果、模型预测结果和可解释报告。",
    stepsPreview: [
      "列出工作区根目录，确认文件结构",
      "列出 inputs 目录，确认输入文件",
      "读取 Excel 文件，分析数据结构和内容",
      "运行 PRODIGY 特征计算",
      "运行 Rosetta 特征计算",
      "运行 Epitope-Binder 特征计算",
      "运行 Bi-Binder 特征组合",
      "运行特征相关性分析",
      "运行机器学习回归模型训练",
    ],
  },
  {
    id: "tp-de-novo-design",
    name: "De novo 设计流程",
    desc: "从设计目标出发生成候选序列，并经过结构预测、约束筛选和打分排序得到可进入下一轮评估的分子方案。",
    type: "pipeline",
    category: "蛋白设计",
    steps: 7,
    starred: true,
    bestFor: "只有设计目标和约束条件，需要从零生成候选序列并完成初步筛选。",
    output: "候选序列、结构预测结果、打分排序和设计总结报告。",
    stepsPreview: [
      "定义设计目标与约束条件",
      "生成初始候选序列",
      "过滤序列质量和可开发性风险",
      "预测候选结构",
      "进行结构打分与稳定性评估",
      "按目标属性筛选 Top 候选",
      "生成设计结果报告",
    ],
  },
];

// ── Grouped card grid ──────────────────────────────────────────────────────

function groupBy<T extends { category: string }>(items: T[]): Record<string, T[]> {
  return items.reduce((acc, item) => {
    (acc[item.category] = acc[item.category] || []).push(item);
    return acc;
  }, {} as Record<string, T[]>);
}

function sourceBadge(resource: Pick<UserResource, "owner" | "permission">, lang: Lang) {
  if (resource.owner === "shared") return lang === "zh" ? "他人分享" : "Shared with me";
  if (resource.permission === "shared") return lang === "zh" ? "已共享" : "Shared";
  return lang === "zh" ? "仅自己可见" : "Private";
}

function UserResourceCard({
  resource,
  lang,
  onEdit,
}: {
  resource: UserResource;
  lang: Lang;
  onEdit?: (resource: UserResource) => void;
}) {
  const icon =
    resource.kind === "tool" ? (
      <Zap className="h-3.5 w-3.5" />
    ) : (
      <PanelRightOpen className="h-3.5 w-3.5" />
    );

  return (
    <div className="group flex min-h-[132px] flex-col gap-2 rounded-[14px] border border-slate-200 bg-white p-4 text-left transition hover:border-[#161FAD]/30 hover:shadow-sm">
      <div className="flex items-start gap-2">
        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-slate-50 text-[#161FAD]">
          {icon}
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-[13px] font-semibold leading-tight text-slate-800">{resource.name}</p>
          <p className="mt-1 text-[10px] text-slate-400">
            {resource.kind === "tool" ? (lang === "zh" ? "Tool" : "Tool") : "Skill"} · {resource.updatedAt}
          </p>
        </div>
        {onEdit ? (
          <button
            onClick={() => onEdit(resource)}
            className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-slate-300 opacity-0 transition hover:bg-slate-50 hover:text-[#161FAD] group-hover:opacity-100"
            title={lang === "zh" ? "编辑与分享" : "Edit and share"}
          >
            <Pencil className="h-3.5 w-3.5" />
          </button>
        ) : null}
      </div>
      <p className="line-clamp-2 text-[11px] leading-relaxed text-slate-500">{resource.description}</p>
      <div className="mt-auto flex flex-wrap items-center gap-1">
        <span className="rounded-full border border-slate-200 px-2 py-0.5 text-[10px] text-slate-500">{resource.category}</span>
        {resource.steps ? (
          <span className="rounded-full border border-slate-200 px-2 py-0.5 text-[10px] text-slate-500">
            {lang === "zh" ? `${resource.steps} 步` : `${resource.steps} steps`}
          </span>
        ) : null}
        <span className="ml-auto rounded-full bg-blue-50 px-2 py-0.5 text-[10px] text-[#161FAD]">
          {sourceBadge(resource, lang)}
        </span>
      </div>
    </div>
  );
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
      <div className="flex items-center justify-between gap-3">
        <div className="flex w-full max-w-[320px] items-center gap-2 rounded-[12px] border border-slate-200 bg-white px-3 py-2 shadow-sm">
          <Search className="h-3.5 w-3.5 shrink-0 text-slate-400" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="min-w-0 flex-1 bg-transparent text-[12px] text-slate-700 outline-none placeholder:text-slate-400"
            placeholder={lang === "zh" ? "搜索公共数据集…" : "Search public datasets…"}
          />
        </div>
        <div className="min-h-8 flex-1" />
      </div>

      {/* Hint bar */}
      <div className="rounded-[12px] border border-amber-100 bg-amber-50/60 px-4 py-3 text-[12px] text-amber-800">
        {lang === "zh"
          ? "在对话中使用 @ 引用这些数据集，Agent 可自动查询并从这些来源获取数据。"
          : "Use @ in conversation to reference these datasets. Agent can automatically query and fetch data from these sources."}
      </div>

      {/* Count */}
      <div className="flex items-center gap-1.5 text-[12px] text-slate-500">
        <Globe2 className="h-3.5 w-3.5 text-[#161FAD]" />
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
                {/* Top row: icon + name */}
                <div className="flex items-start gap-2">
                  <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-slate-50 text-[#161FAD]">
                    <Globe2 className="h-4 w-4" />
                  </div>
                  <p className="flex-1 text-[13px] font-semibold leading-tight text-slate-800">{item.name}</p>
                </div>
                {/* Desc */}
                <p className="line-clamp-2 text-[11px] leading-relaxed text-slate-500">{item.desc}</p>
                {/* Tags */}
                <div className="mt-auto flex flex-wrap gap-1">
                  {item.tags.map((tag) => (
                    <span key={tag} className="rounded-full border border-slate-200 px-2 py-0.5 text-[10px] text-slate-500">{tag}</span>
                  ))}
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

function SkillTab({ lang, userResources = [] }: { lang: Lang; userResources?: UserResource[] }) {
  const [query, setQuery] = useState("");
  const userTools = userResources.filter((resource) => resource.kind === "tool");
  const filtered = SKILLS.filter(
    (s) =>
      s.name.toLowerCase().includes(query.toLowerCase()) ||
      s.category.toLowerCase().includes(query.toLowerCase()) ||
      s.ability.toLowerCase().includes(query.toLowerCase()) ||
      s.skillId.toLowerCase().includes(query.toLowerCase()) ||
      s.tags.some((tag) => tag.toLowerCase().includes(query.toLowerCase()))
  );
  const filteredUserTools = userTools.filter(
    (resource) =>
      resource.name.toLowerCase().includes(query.toLowerCase()) ||
      resource.description.toLowerCase().includes(query.toLowerCase()) ||
      resource.category.toLowerCase().includes(query.toLowerCase())
  );
  const grouped = groupBy(filtered);

  return (
    <div className="flex flex-col gap-5">
      {/* Search */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex w-full max-w-[320px] items-center gap-2 rounded-[12px] border border-slate-200 bg-white px-3 py-2 shadow-sm">
          <Search className="h-3.5 w-3.5 shrink-0 text-slate-400" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="min-w-0 flex-1 bg-transparent text-[12px] text-slate-700 outline-none placeholder:text-slate-400"
            placeholder={lang === "zh" ? "搜索工具…" : "Search tools…"}
          />
        </div>
        <div className="min-h-8 flex-1" />
      </div>

      {/* Hint bar */}
      <div className="rounded-[12px] border border-blue-100 bg-blue-50/50 px-4 py-3 text-[12px] text-blue-800">
        {lang === "zh"
          ? "平台公共工具由平台统一维护；下方也会展示你自己的或他人分享给你的工具。"
          : "Platform tools are maintained centrally; your own and shared tools are also shown below."}
      </div>

      {/* Count */}
      <div className="flex items-center gap-1.5 text-[12px] text-slate-500">
        <Zap className="h-3.5 w-3.5 text-[#161FAD]" />
        <span>{lang === "zh" ? `${filtered.length + filteredUserTools.length} 个工具可用` : `${filtered.length + filteredUserTools.length} tools available`}</span>
      </div>

      {filteredUserTools.length > 0 ? (
        <div>
          <div className="mb-3 flex items-center gap-2">
            <h3 className="text-[15px] font-semibold text-slate-800" style={{ fontFamily: "Georgia, serif" }}>
              {lang === "zh" ? "我的 / 共享工具" : "My / Shared Tools"}
            </h3>
            <span className="text-[12px] text-slate-400">{filteredUserTools.length}</span>
          </div>
          <div className="grid grid-cols-3 gap-3">
            {filteredUserTools.map((resource) => (
              <UserResourceCard key={resource.id} resource={resource} lang={lang} />
            ))}
          </div>
        </div>
      ) : null}

      {/* Grouped grid */}
      {Object.entries(grouped).map(([category, items]) => (
        <div key={category}>
          <div className="mb-3 flex items-center gap-2">
            <h3 className="text-[15px] font-semibold text-slate-800" style={{ fontFamily: "Georgia, serif" }}>
              {lang === "zh" ? `平台公共工具 · ${category}` : `Platform Tools · ${category}`}
            </h3>
            <span className="text-[12px] text-slate-400">{items.length}</span>
          </div>
          <div className="grid grid-cols-3 gap-3">
            {items.map((skill) => (
              <button
                key={skill.id}
                onClick={() => toast.message(lang === "zh" ? `使用 ${skill.name}` : `Use ${skill.name}`)}
                className="group relative flex min-h-[124px] flex-col gap-2 rounded-[14px] border border-slate-200 bg-white p-4 text-left transition hover:border-[#161FAD]/30 hover:shadow-sm"
              >
                <div className="flex items-start gap-2">
                  <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-violet-50 text-violet-700">
                    <Zap className="h-3.5 w-3.5" />
                  </div>
                  <p className="flex-1 text-[13px] font-semibold leading-tight text-slate-800">{skill.name}</p>
                </div>
                <p className="line-clamp-2 text-[11px] leading-relaxed text-slate-500">{skill.desc}</p>
                <div className="mt-auto flex flex-wrap items-center gap-1">
                  <span className="rounded-full border border-blue-100 bg-blue-50 px-2 py-0.5 text-[10px] text-[#161FAD]">{skill.ability}</span>
                  <span className="ml-auto flex items-center gap-1 text-[10px] text-slate-400">
                    <Clock className="h-3 w-3" />
                    {skill.uses}
                  </span>
                </div>
              </button>
            ))}
          </div>
        </div>
      ))}

      {filtered.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <Zap className="mb-3 h-9 w-9 text-slate-200" />
          <p className="text-[13px] text-slate-400">{lang === "zh" ? "没有匹配的工具" : "No matching tools"}</p>
        </div>
      )}
    </div>
  );
}

function TemplateTab({ lang, userResources = [] }: { lang: Lang; userResources?: UserResource[] }) {
  const [query, setQuery] = useState("");
  const [selectedTemplate, setSelectedTemplate] = useState<(typeof TEMPLATES)[number] | null>(null);
  const userSkills = userResources.filter((resource) => resource.kind === "skill");
  const filtered = TEMPLATES.filter(
    (t) =>
      t.name.toLowerCase().includes(query.toLowerCase()) ||
      t.category.toLowerCase().includes(query.toLowerCase()) ||
      t.stepsPreview.some((step) => step.toLowerCase().includes(query.toLowerCase()))
  );
  const filteredUserSkills = userSkills.filter(
    (resource) =>
      resource.name.toLowerCase().includes(query.toLowerCase()) ||
      resource.description.toLowerCase().includes(query.toLowerCase()) ||
      resource.category.toLowerCase().includes(query.toLowerCase())
  );
  const grouped = groupBy(filtered);

  const typeLabel: Record<string, { zh: string; en: string }> = {
    pipeline: { zh: "工作流", en: "Pipeline" },
    report: { zh: "报告", en: "Report" },
  };

  return (
    <div className="flex flex-col gap-5">
      {/* Search */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex w-full max-w-[320px] items-center gap-2 rounded-[12px] border border-slate-200 bg-white px-3 py-2 shadow-sm">
          <Search className="h-3.5 w-3.5 shrink-0 text-slate-400" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="min-w-0 flex-1 bg-transparent text-[12px] text-slate-700 outline-none placeholder:text-slate-400"
            placeholder={lang === "zh" ? "搜索 Skill…" : "Search skills…"}
          />
        </div>
        <div className="min-h-8 flex-1" />
      </div>

      {/* Hint bar */}
      <div className="rounded-[12px] border border-emerald-100 bg-emerald-50/50 px-4 py-3 text-[12px] text-emerald-800">
        {lang === "zh"
          ? "平台公共 Skill 由平台维护；你保存的流程模板和他人分享的 Skill 会显示在“我的 / 共享 Skill”。"
          : "Platform Skills are maintained centrally; saved and shared Skills appear under My / Shared Skills."}
      </div>

      {/* Count */}
      <div className="flex items-center gap-1.5 text-[12px] text-slate-500">
        <PanelRightOpen className="h-3.5 w-3.5 text-[#161FAD]" />
        <span>{lang === "zh" ? `${filtered.length + filteredUserSkills.length} 个 Skill 可用` : `${filtered.length + filteredUserSkills.length} skills available`}</span>
      </div>

      {filteredUserSkills.length > 0 ? (
        <div>
          <div className="mb-3 flex items-center gap-2">
            <h3 className="text-[15px] font-semibold text-slate-800" style={{ fontFamily: "Georgia, serif" }}>
              {lang === "zh" ? "我的 / 共享 Skill" : "My / Shared Skills"}
            </h3>
            <span className="text-[12px] text-slate-400">{filteredUserSkills.length}</span>
          </div>
          <div className="grid grid-cols-3 gap-3">
            {filteredUserSkills.map((resource) => (
              <UserResourceCard key={resource.id} resource={resource} lang={lang} />
            ))}
          </div>
        </div>
      ) : null}

      {/* Grouped grid */}
      {Object.entries(grouped).map(([category, items]) => (
        <div key={category}>
          <div className="mb-3 flex items-center gap-2">
            <h3 className="text-[15px] font-semibold text-slate-800" style={{ fontFamily: "Georgia, serif" }}>
              {lang === "zh" ? `平台公共 Skill · ${category}` : `Platform Skills · ${category}`}
            </h3>
            <span className="text-[12px] text-slate-400">{items.length}</span>
          </div>
          <div className="grid grid-cols-3 gap-3">
            {items.map((tpl) => (
              <button
                key={tpl.id}
                onClick={() => setSelectedTemplate(tpl)}
                className="group relative flex min-h-[118px] flex-col gap-2 rounded-[14px] border border-slate-200 bg-white p-4 text-left transition hover:border-[#161FAD]/30 hover:shadow-sm"
              >
                <div className="flex items-start gap-2">
                  <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-slate-50 text-[#161FAD]">
                    <PanelRightOpen className="h-3.5 w-3.5" />
                  </div>
                  <p className="flex-1 text-[13px] font-semibold leading-tight text-slate-800">{tpl.name}</p>
                </div>
                <p className="line-clamp-2 text-[11px] leading-relaxed text-slate-500">{tpl.desc}</p>
                <div className="mt-auto flex flex-wrap items-center gap-1">
                  <span className="rounded-full border border-slate-200 px-2 py-0.5 text-[10px] text-slate-500">
                    {typeLabel[tpl.type]?.[lang]}
                  </span>
                  <span className="rounded-full border border-slate-200 px-2 py-0.5 text-[10px] text-slate-500">
                    {lang === "zh" ? `${tpl.steps} 步` : `${tpl.steps} steps`}
                  </span>
                </div>
              </button>
            ))}
          </div>
        </div>
      ))}

      {filtered.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <PanelRightOpen className="mb-3 h-9 w-9 text-slate-200" />
          <p className="text-[13px] text-slate-400">{lang === "zh" ? "没有匹配的 Skill" : "No matching skills"}</p>
        </div>
      )}

      <Sheet open={Boolean(selectedTemplate)} onOpenChange={(open) => !open && setSelectedTemplate(null)}>
        <SheetContent side="right" showOverlay={false} className="w-[min(560px,92vw)] gap-0 overflow-hidden border-l border-slate-200 bg-[#f8faff] p-0 sm:max-w-none">
          {selectedTemplate ? (
            <>
              <SheetHeader className="border-b border-slate-200 bg-white/92 px-5 py-5 pr-12">
                <div className="flex items-start gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-slate-50 text-[#161FAD]">
                    <PanelRightOpen className="h-5 w-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <SheetTitle className="text-[17px] font-semibold text-[#070261]">{selectedTemplate.name}</SheetTitle>
                    <SheetDescription className="mt-1 text-[12px] leading-5 text-slate-500">
                      {selectedTemplate.desc}
                    </SheetDescription>
                  </div>
                </div>
              </SheetHeader>

              <div className="min-h-0 flex-1 overflow-y-auto px-5 py-5">
                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-[16px] border border-slate-200 bg-white px-4 py-3">
                    <p className="text-[11px] text-slate-400">{lang === "zh" ? "所属模块" : "Category"}</p>
                    <p className="mt-1 text-[13px] font-semibold text-slate-700">{selectedTemplate.category}</p>
                  </div>
                  <div className="rounded-[16px] border border-slate-200 bg-white px-4 py-3">
                    <p className="text-[11px] text-slate-400">{lang === "zh" ? "流程步骤" : "Steps"}</p>
                    <p className="mt-1 text-[13px] font-semibold text-slate-700">
                      {lang === "zh" ? `${selectedTemplate.steps} 步` : `${selectedTemplate.steps} steps`}
                    </p>
                  </div>
                </div>

                <div className="mt-4 rounded-[18px] border border-slate-200 bg-white p-4">
                  <p className="text-[13px] font-semibold text-[#070261]">{lang === "zh" ? "适用场景" : "Best For"}</p>
                  <p className="mt-2 text-[12px] leading-6 text-slate-600">{selectedTemplate.bestFor}</p>
                </div>

                <div className="mt-4 rounded-[18px] border border-slate-200 bg-white p-4">
                  <p className="text-[13px] font-semibold text-[#070261]">{lang === "zh" ? "预期产出" : "Expected Output"}</p>
                  <p className="mt-2 text-[12px] leading-6 text-slate-600">{selectedTemplate.output}</p>
                </div>

                <div className="mt-4 rounded-[18px] border border-slate-200 bg-white p-4">
                  <div className="mb-4 flex items-center justify-between">
                    <p className="text-[13px] font-semibold text-[#070261]">{lang === "zh" ? "流程预览" : "Workflow Preview"}</p>
                    <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-[10px] font-medium text-emerald-700">
                      {typeLabel[selectedTemplate.type]?.[lang]}
                    </span>
                  </div>
                  <div className="space-y-0">
                    {selectedTemplate.stepsPreview.map((step, index) => (
                      <div key={step} className="relative flex gap-3 pb-4 last:pb-0">
                        {index < selectedTemplate.stepsPreview.length - 1 ? (
                          <span className="absolute left-[13px] top-7 h-[calc(100%-28px)] w-px bg-emerald-100" />
                        ) : null}
                        <span className="relative z-10 flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-emerald-100 bg-emerald-50 text-[11px] font-semibold text-emerald-700">
                          {index + 1}
                        </span>
                        <div className="min-w-0 pt-1">
                          <p className="text-[12px] leading-5 text-slate-700">{step}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </>
          ) : null}
        </SheetContent>
      </Sheet>
    </div>
  );
}

function MyResourcesTab({ lang, kind }: { lang: Lang; kind: "tool" | "skill" }) {
  const { userResources, updateUserResource } = useProject();
  const [query, setQuery] = useState("");
  const [editingResource, setEditingResource] = useState<UserResource | null>(null);
  const [resourceName, setResourceName] = useState("");
  const [resourceDescription, setResourceDescription] = useState("");
  const [permission, setPermission] = useState<UserResource["permission"]>("private");
  const [sharedWith, setSharedWith] = useState("");

  const filtered = userResources.filter((resource) => {
    if (resource.kind !== kind) return false;
    const keyword = query.trim().toLowerCase();
    if (!keyword) return true;
    return `${resource.name} ${resource.description} ${resource.category} ${resource.sharedWith.join(" ")}`.toLowerCase().includes(keyword);
  });

  const openEditor = (resource: UserResource) => {
    setEditingResource(resource);
    setResourceName(resource.name);
    setResourceDescription(resource.description);
    setPermission(resource.permission);
    setSharedWith(resource.sharedWith.join(", "));
  };

  const handleSave = (event: React.FormEvent) => {
    event.preventDefault();
    if (!editingResource) return;
    const nextName = resourceName.trim();
    if (!nextName) {
      toast.error(lang === "zh" ? "资源名称不能为空" : "Resource name is required");
      return;
    }

    const nextSharedWith = sharedWith
      .split(/[,，\s]+/)
      .map((item) => item.trim())
      .filter(Boolean);

    updateUserResource(editingResource.id, {
      name: nextName,
      description: resourceDescription.trim() || (lang === "zh" ? "暂无描述" : "No description"),
      permission,
      sharedWith: permission === "shared" ? nextSharedWith : [],
    });
    setEditingResource(null);
    toast.success(lang === "zh" ? "资源信息已更新" : "Resource updated");
  };

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center justify-between gap-3">
        <div className="flex w-full max-w-[360px] items-center gap-2 rounded-[12px] border border-slate-200 bg-white px-3 py-2 shadow-sm">
          <Search className="h-3.5 w-3.5 shrink-0 text-slate-400" />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            className="min-w-0 flex-1 bg-transparent text-[12px] text-slate-700 outline-none placeholder:text-slate-400"
            placeholder={kind === "tool" ? (lang === "zh" ? "搜索我的工具…" : "Search my tools…") : (lang === "zh" ? "搜索我的 Skill…" : "Search my Skills…")}
          />
        </div>
      </div>

      <div className="rounded-[12px] border border-blue-100 bg-blue-50/50 px-4 py-3 text-[12px] leading-5 text-blue-800">
        {lang === "zh"
          ? "在这里管理自己创建、保存或他人分享给你的 Tool / Skill。可编辑名称和描述，并将资源分享给指定用户。"
          : "Manage Tools / Skills you own, saved, or received here. Edit details and share resources with selected users."}
      </div>

      <div className="flex items-center gap-1.5 text-[12px] text-slate-500">
        <Users className="h-3.5 w-3.5 text-[#161FAD]" />
        <span>
          {kind === "tool"
            ? lang === "zh" ? `${filtered.length} 个 Tool` : `${filtered.length} Tools`
            : lang === "zh" ? `${filtered.length} 个 Skill` : `${filtered.length} Skills`}
        </span>
      </div>

      {filtered.length > 0 ? (
        <div className="grid grid-cols-3 gap-3">
          {filtered.map((resource) => (
            <UserResourceCard key={resource.id} resource={resource} lang={lang} onEdit={openEditor} />
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          {kind === "tool" ? <Zap className="mb-3 h-9 w-9 text-slate-200" /> : <PanelRightOpen className="mb-3 h-9 w-9 text-slate-200" />}
          <p className="text-[13px] text-slate-400">
            {lang === "zh" ? "暂无匹配资源" : "No matching resources"}
          </p>
        </div>
      )}

      <Dialog open={Boolean(editingResource)} onOpenChange={(open) => !open && setEditingResource(null)}>
        <DialogContent className="rounded-[24px] border-white/70 bg-white p-0 shadow-[0_24px_80px_rgba(15,23,42,0.18)] sm:max-w-[520px]">
          <DialogHeader className="border-b border-slate-100 px-5 py-4">
            <DialogTitle className="text-[15px] font-semibold text-[#070261]">
              {lang === "zh" ? "编辑资源与分享权限" : "Edit resource and sharing"}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSave} className="grid gap-4 px-5 py-5">
            <label className="grid gap-1.5">
              <span className="text-[11px] font-medium text-slate-500">{lang === "zh" ? "名称" : "Name"}</span>
              <input
                value={resourceName}
                onChange={(event) => setResourceName(event.target.value)}
                className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-[13px] text-slate-800 outline-none transition focus:border-[rgba(23,36,216,0.3)]"
              />
            </label>
            <label className="grid gap-1.5">
              <span className="text-[11px] font-medium text-slate-500">{lang === "zh" ? "描述" : "Description"}</span>
              <textarea
                value={resourceDescription}
                onChange={(event) => setResourceDescription(event.target.value)}
                rows={3}
                className="resize-none rounded-xl border border-slate-200 bg-white px-3 py-2 text-[13px] leading-6 text-slate-700 outline-none transition focus:border-[rgba(23,36,216,0.3)]"
              />
            </label>
            <label className="grid gap-1.5">
              <span className="text-[11px] font-medium text-slate-500">{lang === "zh" ? "权限" : "Permission"}</span>
              <select
                value={permission}
                onChange={(event) => setPermission(event.target.value as UserResource["permission"])}
                className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-[12px] text-slate-600 outline-none transition focus:border-[rgba(23,36,216,0.3)]"
              >
                <option value="private">{lang === "zh" ? "仅自己可见" : "Private"}</option>
                <option value="shared">{lang === "zh" ? "分享给指定用户" : "Share with selected users"}</option>
              </select>
            </label>
            {permission === "shared" ? (
              <label className="grid gap-1.5">
                <span className="text-[11px] font-medium text-slate-500">{lang === "zh" ? "分享对象" : "Shared with"}</span>
                <input
                  value={sharedWith}
                  onChange={(event) => setSharedWith(event.target.value)}
                  className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-[13px] text-slate-800 outline-none transition placeholder:text-slate-300 focus:border-[rgba(23,36,216,0.3)]"
                  placeholder={lang === "zh" ? "输入邮箱，多个用户用逗号分隔" : "Enter emails, separated by commas"}
                />
              </label>
            ) : null}
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setEditingResource(null)}
                className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-[12px] font-medium text-slate-500 transition hover:text-slate-700"
              >
                {lang === "zh" ? "取消" : "Cancel"}
              </button>
              <button
                type="submit"
                className="inline-flex items-center gap-1.5 rounded-xl bg-[#161FAD] px-4 py-2 text-[12px] font-semibold text-white transition hover:bg-[#111996] active:scale-[0.97]"
              >
                <Share2 className="h-3.5 w-3.5" />
                {lang === "zh" ? "保存" : "Save"}
              </button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function AgentPreferenceCard({
  preference,
  lang,
  scopeLabel,
  projectName,
  onEdit,
  onToggle,
  onDelete,
}: {
  preference: AgentPreference;
  lang: Lang;
  scopeLabel: string;
  projectName?: string;
  onEdit: (preference: AgentPreference) => void;
  onToggle: (preference: AgentPreference) => void;
  onDelete: (preference: AgentPreference) => void;
}) {
  const active = preference.status === "active";

  return (
    <div className={`group rounded-[16px] border p-4 transition ${
      active ? "border-slate-200 bg-white hover:border-[#161FAD]/25" : "border-slate-100 bg-slate-50/80 opacity-70"
    }`}>
      <div className="flex items-start gap-3">
        <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-xl ${
          active ? "bg-blue-50 text-[#161FAD]" : "bg-slate-100 text-slate-400"
        }`}>
          <Brain className="h-4 w-4" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="rounded-full bg-blue-50 px-2 py-0.5 text-[10px] font-medium text-[#161FAD]">{scopeLabel}</span>
            <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${
              active ? "bg-emerald-50 text-emerald-600" : "bg-slate-100 text-slate-400"
            }`}>
              {active ? (lang === "zh" ? "生效中" : "Active") : (lang === "zh" ? "已停用" : "Paused")}
            </span>
            {projectName ? (
              <span className="rounded-full border border-slate-200 px-2 py-0.5 text-[10px] text-slate-500">{projectName}</span>
            ) : null}
            {preference.scope === "project" ? (
              <span className="rounded-full border border-emerald-100 bg-emerald-50 px-2 py-0.5 text-[10px] text-emerald-600">
                {preference.audience === "project-members"
                  ? lang === "zh" ? "项目成员共享" : "Project shared"
                  : lang === "zh" ? "仅本人" : "Personal"}
              </span>
            ) : null}
          </div>
          <p className="mt-2 text-[13px] leading-6 text-slate-700">{preference.content}</p>
          <p className="mt-2 text-[10px] text-slate-400">
            {lang === "zh" ? "更新时间" : "Updated"} · {preference.updatedAt}
          </p>
        </div>
        <div className="flex shrink-0 gap-1 opacity-0 transition group-hover:opacity-100">
          <button
            onClick={() => onEdit(preference)}
            className="flex h-8 w-8 items-center justify-center rounded-xl text-slate-400 transition hover:bg-slate-50 hover:text-[#161FAD]"
            title={lang === "zh" ? "编辑" : "Edit"}
          >
            <Pencil className="h-3.5 w-3.5" />
          </button>
          <button
            onClick={() => onToggle(preference)}
            className="flex h-8 w-8 items-center justify-center rounded-xl text-slate-400 transition hover:bg-slate-50 hover:text-[#161FAD]"
            title={active ? (lang === "zh" ? "停用" : "Pause") : (lang === "zh" ? "启用" : "Activate")}
          >
            {active ? <PauseCircle className="h-3.5 w-3.5" /> : <PlayCircle className="h-3.5 w-3.5" />}
          </button>
          <button
            onClick={() => onDelete(preference)}
            className="flex h-8 w-8 items-center justify-center rounded-xl text-slate-400 transition hover:bg-red-50 hover:text-red-500"
            title={lang === "zh" ? "删除" : "Delete"}
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}

function AgentPreferenceTab({ lang }: { lang: Lang }) {
  const {
    activeProject,
    projects,
    agentPreferences,
    addAgentPreference,
    updateAgentPreference,
    toggleAgentPreference,
    deleteAgentPreference,
  } = useProject();
  const [query, setQuery] = useState("");
  const [projectFilter, setProjectFilter] = useState("current");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "paused">("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingPreference, setEditingPreference] = useState<AgentPreference | null>(null);
  const [scope, setScope] = useState<AgentPreference["scope"]>("global");
  const [audience, setAudience] = useState<AgentPreference["audience"]>("personal");
  const [content, setContent] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<AgentPreference | null>(null);

  const normalizedQuery = query.trim().toLowerCase();
  const projectNameById = new Map(projects.map((project) => [project.id, project.name]));
  const selectedProjectId = projectFilter === "current" ? activeProject.id : projectFilter === "all" ? null : projectFilter;
  const visiblePreferences = agentPreferences.filter((preference) => {
    if (preference.status === "deleted") return false;
    if (statusFilter !== "all" && preference.status !== statusFilter) return false;
    if (preference.scope === "project" && selectedProjectId && preference.projectId !== selectedProjectId) return false;
    if (!normalizedQuery) return true;

    const projectName = preference.projectId ? projectNameById.get(preference.projectId) ?? "" : "";
    return `${preference.content} ${preference.scope} ${preference.status} ${projectName}`.toLowerCase().includes(normalizedQuery);
  });
  const globalPreferences = visiblePreferences.filter((preference) => preference.scope === "global");
  const projectPreferences = visiblePreferences.filter((preference) => preference.scope === "project");

  const openCreateDialog = (nextScope: AgentPreference["scope"] = "global") => {
    setEditingPreference(null);
    setScope(nextScope);
    setAudience("personal");
    setContent("");
    setDialogOpen(true);
  };

  const openEditDialog = (preference: AgentPreference) => {
    setEditingPreference(preference);
    setScope(preference.scope);
    setAudience(preference.audience);
    setContent(preference.content);
    setDialogOpen(true);
  };

  const resetDialog = () => {
    setDialogOpen(false);
    setEditingPreference(null);
    setScope("global");
    setAudience("personal");
    setContent("");
  };

  const handleSave = (event: React.FormEvent) => {
    event.preventDefault();
    const nextContent = content.trim();
    if (!nextContent) {
      toast.error(lang === "zh" ? "偏好内容不能为空" : "Preference content is required");
      return;
    }

    const projectId = scope === "project" ? activeProject.id : undefined;
    const nextAudience = scope === "project" ? audience : "personal";
    if (editingPreference) {
      updateAgentPreference(editingPreference.id, {
        content: nextContent,
        scope,
        audience: nextAudience,
        projectId,
      });
      toast.success(lang === "zh" ? "偏好已更新" : "Preference updated");
    } else {
      addAgentPreference({
        content: nextContent,
        scope,
        audience: nextAudience,
        projectId,
      });
      toast.success(lang === "zh" ? "偏好已新增" : "Preference added");
    }
    resetDialog();
  };

  const handleConfirmDelete = () => {
    if (!deleteTarget) return;
    deleteAgentPreference(deleteTarget.id);
    setDeleteTarget(null);
    toast.success(lang === "zh" ? "偏好已软删除，不会进入后续召回" : "Preference soft-deleted and excluded from future recall");
  };

  const renderPreferenceList = (items: AgentPreference[], title: string, body: string, emptyText: string) => (
    <section className="rounded-[18px] border border-slate-100 bg-white p-4">
      <div className="mb-3 flex items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <p className="text-[14px] font-semibold text-[#070261]">{title}</p>
            <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-slate-500">
              {items.length}
            </span>
          </div>
          <p className="mt-1 text-[11px] leading-5 text-slate-400">{body}</p>
        </div>
      </div>
      <div className="max-h-[420px] space-y-2.5 overflow-y-auto pr-1 [scrollbar-color:#cbd5e1_transparent] [scrollbar-width:thin]">
        {items.length > 0 ? (
          items.map((preference) => (
            <AgentPreferenceCard
              key={preference.id}
              preference={preference}
              lang={lang}
              scopeLabel={preference.scope === "global" ? (lang === "zh" ? "通用偏好" : "General") : (lang === "zh" ? "项目偏好" : "Project")}
              projectName={preference.scope === "project" ? projectNameById.get(preference.projectId ?? "") ?? activeProject.name : undefined}
              onEdit={openEditDialog}
              onToggle={(item) => {
                toggleAgentPreference(item.id);
                toast.success(item.status === "active" ? (lang === "zh" ? "偏好已停用" : "Preference paused") : (lang === "zh" ? "偏好已启用" : "Preference activated"));
              }}
              onDelete={setDeleteTarget}
            />
          ))
        ) : (
          <div className="rounded-[14px] border border-dashed border-slate-200 bg-slate-50/70 px-4 py-8 text-center">
            <p className="text-[12px] text-slate-400">{emptyText}</p>
          </div>
        )}
      </div>
    </section>
  );

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-[20px] border border-slate-100 bg-white/70 px-3 py-3 shadow-[0_10px_30px_rgba(15,23,42,0.04)]">
        <div className="flex w-full max-w-[360px] items-center gap-2 rounded-full border border-slate-200/80 bg-slate-50/80 px-3 py-2 transition focus-within:border-[#161FAD]/25 focus-within:bg-white focus-within:shadow-[0_0_0_3px_rgba(22,31,173,0.06)]">
          <Search className="h-3.5 w-3.5 shrink-0 text-slate-400" />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            className="min-w-0 flex-1 bg-transparent text-[12px] text-slate-700 outline-none placeholder:text-slate-400"
            placeholder={lang === "zh" ? "搜索偏好或项目" : "Search preferences"}
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1.5 rounded-full bg-slate-50 px-2 py-1">
            <select
              value={projectFilter}
              onChange={(event) => setProjectFilter(event.target.value)}
              className="h-8 max-w-[210px] rounded-full border-0 bg-transparent px-2 text-[12px] font-medium text-slate-600 outline-none"
            >
              <option value="current">{lang === "zh" ? `当前项目：${activeProject.name}` : `Current: ${activeProject.name}`}</option>
              <option value="all">{lang === "zh" ? "全部项目" : "All projects"}</option>
              {projects.filter((project) => project.id !== activeProject.id).map((project) => (
                <option key={project.id} value={project.id}>
                  {project.name}
                </option>
              ))}
            </select>
          </div>
          <div className="flex items-center gap-1.5 rounded-full bg-slate-50 px-2 py-1">
            <select
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value as "all" | "active" | "paused")}
              className="h-8 rounded-full border-0 bg-transparent px-2 text-[12px] font-medium text-slate-600 outline-none"
            >
              <option value="all">{lang === "zh" ? "全部状态" : "All status"}</option>
              <option value="active">{lang === "zh" ? "生效中" : "Active"}</option>
              <option value="paused">{lang === "zh" ? "已停用" : "Paused"}</option>
            </select>
          </div>
          <button
            onClick={() => openCreateDialog("global")}
            className="inline-flex h-9 items-center gap-1.5 rounded-full bg-[#161FAD] px-4 text-[12px] font-semibold text-white shadow-[0_8px_18px_rgba(22,31,173,0.18)] transition hover:bg-[#111996] active:scale-[0.98]"
          >
            <Plus className="h-3.5 w-3.5" />
            {lang === "zh" ? "新增偏好" : "Add preference"}
          </button>
        </div>
      </div>

      <div className="rounded-[14px] border border-blue-100 bg-blue-50/60 px-4 py-3 text-[12px] leading-6 text-blue-800">
        {lang === "zh"
          ? `Agent 偏好会影响后续回答和任务执行。通用偏好对所有项目生效；当前项目偏好只影响「${activeProject.name}」，且与通用偏好冲突时优先生效。`
          : `Agent preferences affect future answers and task execution. General preferences apply to all projects; project preferences apply to "${activeProject.name}" and override general preferences.`}
      </div>

      {renderPreferenceList(
        globalPreferences,
        lang === "zh" ? "我的通用偏好" : "My general preferences",
        lang === "zh" ? "对你的所有项目生效。" : "Applied across all your projects.",
        lang === "zh" ? "暂无通用偏好" : "No general preferences",
      )}

      {renderPreferenceList(
        projectPreferences,
        lang === "zh" ? "项目偏好" : "Project preferences",
        projectFilter === "all"
          ? lang === "zh" ? "按项目筛选或搜索，可查看不同项目下的偏好。" : "Filter or search to review preferences across projects."
          : lang === "zh" ? "对所选项目生效，可选择仅本人使用或共享给项目成员。" : "Applied to the selected project. Can be personal or shared with project members.",
        lang === "zh" ? "暂无匹配的项目偏好" : "No matching project preferences",
      )}

      <Dialog open={dialogOpen} onOpenChange={(open) => (open ? setDialogOpen(true) : resetDialog())}>
        <DialogContent className="rounded-[24px] border-white/70 bg-white p-0 shadow-[0_24px_80px_rgba(15,23,42,0.18)] sm:max-w-[540px]">
          <DialogHeader className="border-b border-slate-100 px-5 py-4">
            <DialogTitle className="text-[15px] font-semibold text-[#070261]">
              {editingPreference ? (lang === "zh" ? "编辑 Agent 偏好" : "Edit Agent preference") : (lang === "zh" ? "新增 Agent 偏好" : "Add Agent preference")}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSave} className="grid gap-4 px-5 py-5">
            <label className="grid gap-1.5">
              <span className="text-[11px] font-medium text-slate-500">{lang === "zh" ? "生效范围" : "Scope"}</span>
              <select
                value={scope}
                onChange={(event) => {
                  const nextScope = event.target.value as AgentPreference["scope"];
                  setScope(nextScope);
                  if (nextScope === "global") setAudience("personal");
                }}
                className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-[12px] text-slate-600 outline-none transition focus:border-[rgba(23,36,216,0.3)]"
              >
                <option value="global">{lang === "zh" ? "我的通用偏好 · 所有项目生效" : "General · all projects"}</option>
                <option value="project">{lang === "zh" ? `项目偏好 · ${activeProject.name}` : `Project · ${activeProject.name}`}</option>
              </select>
            </label>
            {scope === "project" ? (
              <label className="grid gap-1.5">
                <span className="text-[11px] font-medium text-slate-500">{lang === "zh" ? "共享范围" : "Audience"}</span>
                <select
                  value={audience}
                  onChange={(event) => setAudience(event.target.value as AgentPreference["audience"])}
                  className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-[12px] text-slate-600 outline-none transition focus:border-[rgba(23,36,216,0.3)]"
                >
                  <option value="personal">{lang === "zh" ? "仅本人在当前项目内生效" : "Only me in this project"}</option>
                  <option value="project-members">{lang === "zh" ? "共享给当前项目成员" : "Share with project members"}</option>
                </select>
              </label>
            ) : null}
            <label className="grid gap-1.5">
              <span className="text-[11px] font-medium text-slate-500">{lang === "zh" ? "偏好内容" : "Preference"}</span>
              <textarea
                value={content}
                onChange={(event) => setContent(event.target.value)}
                rows={5}
                className="resize-none rounded-xl border border-slate-200 bg-white px-3 py-2 text-[13px] leading-6 text-slate-700 outline-none transition placeholder:text-slate-300 focus:border-[rgba(23,36,216,0.3)]"
                placeholder={lang === "zh" ? "例如：本项目优先关注内化活性和 KD，不需要每次解释基础背景。" : "Example: Prioritize internalization and KD in this project; do not repeat basic context every time."}
              />
            </label>
            <div className="rounded-[14px] bg-slate-50 px-3 py-2 text-[11px] leading-5 text-slate-500">
              {scope === "global"
                ? lang === "zh" ? "该偏好将对你的所有项目生效。" : "This preference applies to all your projects."
                : audience === "project-members"
                  ? lang === "zh" ? "该偏好将共享给当前项目成员。" : "This preference will be shared with current project members."
                  : lang === "zh" ? "该偏好仅你本人在当前项目内使用。" : "This preference is personal within the current project."}
            </div>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={resetDialog}
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

      <Dialog open={Boolean(deleteTarget)} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <DialogContent className="rounded-[24px] border-white/70 bg-white p-0 shadow-[0_24px_80px_rgba(15,23,42,0.18)] sm:max-w-[440px]">
          <DialogHeader className="border-b border-slate-100 px-5 py-4">
            <DialogTitle className="text-[15px] font-semibold text-[#070261]">
              {lang === "zh" ? "删除偏好？" : "Delete preference?"}
            </DialogTitle>
          </DialogHeader>
          <div className="px-5 py-5">
            <p className="text-[13px] leading-6 text-slate-600">
              {lang === "zh"
                ? "删除后该偏好会被软删除，不会进入后续召回和 prompt 注入。"
                : "After deletion, this preference is soft-deleted and will not enter future recall or prompt injection."}
            </p>
            <div className="mt-5 flex justify-end gap-2">
              <button
                onClick={() => setDeleteTarget(null)}
                className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-[12px] font-medium text-slate-500 transition hover:text-slate-700"
              >
                {lang === "zh" ? "取消" : "Cancel"}
              </button>
              <button
                onClick={handleConfirmDelete}
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

export function AgentPreferencePanel({ lang }: { lang: Lang }) {
  const { setMainView } = useProject();

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
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-[linear-gradient(135deg,#161FAD_0%,#848CFE_100%)] text-white">
          <Brain className="h-4 w-4" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-[14px] font-semibold text-[#070261]">
            {lang === "zh" ? "Agent 偏好" : "Agent Preferences"}
          </p>
          <p className="text-[11px] text-slate-400">
            {lang === "zh" ? "管理你的通用偏好和当前项目偏好" : "Manage general preferences and current project preferences"}
          </p>
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto px-5 py-5">
        <AgentPreferenceTab lang={lang} />
      </div>
    </div>
  );
}

// ── Main export ────────────────────────────────────────────────────────────

export function ResourcePanel({ lang, mode = "global" }: { lang: Lang; mode?: "global" | "mine" }) {
  const { resourceTab, setResourceTab, setMainView, userResources } = useProject();

  useEffect(() => {
    if (mode === "mine" && (resourceTab === "data" || resourceTab === "preference")) {
      setResourceTab("skill");
    }
    if (mode === "global" && resourceTab === "preference") {
      setResourceTab("data");
    }
  }, [mode, resourceTab, setResourceTab]);

  const globalTabs: { key: "data" | "skill" | "template"; label: string; labelEn: string; icon: React.ReactNode }[] = [
    { key: "data", label: "公共数据", labelEn: "Public Data", icon: <Globe2 className="h-3.5 w-3.5" /> },
    { key: "skill", label: "工具", labelEn: "Tools", icon: <Zap className="h-3.5 w-3.5" /> },
    { key: "template", label: "Skill", labelEn: "Skills", icon: <PanelRightOpen className="h-3.5 w-3.5" /> },
  ];
  const myTabs: { key: "data" | "skill" | "template"; label: string; labelEn: string; icon: React.ReactNode }[] = [
    { key: "skill", label: "Tool", labelEn: "Tools", icon: <Zap className="h-3.5 w-3.5" /> },
    { key: "template", label: "Skill", labelEn: "Skills", icon: <PanelRightOpen className="h-3.5 w-3.5" /> },
  ];
  const tabs = mode === "mine" ? myTabs : globalTabs;

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
            {mode === "mine" ? (lang === "zh" ? "我的资源" : "My Resources") : (lang === "zh" ? "全局资源" : "Global Resources")}
          </p>
          <p className="text-[11px] text-slate-400">
              {mode === "mine"
              ? lang === "zh" ? "管理我的 Tool / Skill 与分享权限" : "Manage my Tools / Skills and sharing"
              : lang === "zh" ? "区分平台公共资源、我的资源和他人分享资源" : "Platform resources, my resources, and shared resources"}
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
        {mode === "global" && resourceTab === "data" && <PublicDataTab lang={lang} />}
        {mode === "global" && resourceTab === "skill" && <SkillTab lang={lang} userResources={userResources} />}
        {mode === "global" && resourceTab === "template" && <TemplateTab lang={lang} userResources={userResources} />}
        {mode === "mine" && resourceTab === "skill" && <MyResourcesTab lang={lang} kind="tool" />}
        {mode === "mine" && resourceTab === "template" && <MyResourcesTab lang={lang} kind="skill" />}
      </div>
    </div>
  );
}
