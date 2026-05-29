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
  Clock,
} from "lucide-react";
import { useState } from "react";
import { useProject } from "@/contexts/ProjectContext";
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
                {/* Top row: icon + name */}
                <div className="flex items-start gap-2">
                  <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border border-amber-100 bg-amber-50">
                    {FILE_ICONS[item.type] ?? <File className="h-4 w-4 text-slate-400" />}
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

function SkillTab({ lang }: { lang: Lang }) {
  const [query, setQuery] = useState("");
  const filtered = SKILLS.filter(
    (s) =>
      s.name.toLowerCase().includes(query.toLowerCase()) ||
      s.category.toLowerCase().includes(query.toLowerCase()) ||
      s.ability.toLowerCase().includes(query.toLowerCase()) ||
      s.skillId.toLowerCase().includes(query.toLowerCase()) ||
      s.tags.some((tag) => tag.toLowerCase().includes(query.toLowerCase()))
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
            placeholder={lang === "zh" ? "搜索 Skill…" : "Search skills…"}
          />
        </div>
        <div className="min-h-8 flex-1" />
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
                className="group relative flex min-h-[124px] flex-col gap-2 rounded-[14px] border border-slate-200 bg-white p-4 text-left transition hover:border-[#161FAD]/30 hover:shadow-sm"
              >
                <div className="flex items-start gap-2">
                  <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border border-blue-100 bg-blue-50">
                    <Zap className="h-3.5 w-3.5 text-[#161FAD]" />
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
          <p className="text-[13px] text-slate-400">{lang === "zh" ? "没有匹配的技能" : "No matching skills"}</p>
        </div>
      )}
    </div>
  );
}

function TemplateTab({ lang }: { lang: Lang }) {
  const [query, setQuery] = useState("");
  const [selectedTemplate, setSelectedTemplate] = useState<(typeof TEMPLATES)[number] | null>(null);
  const filtered = TEMPLATES.filter(
    (t) =>
      t.name.toLowerCase().includes(query.toLowerCase()) ||
      t.category.toLowerCase().includes(query.toLowerCase()) ||
      t.stepsPreview.some((step) => step.toLowerCase().includes(query.toLowerCase()))
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
            placeholder={lang === "zh" ? "搜索模版…" : "Search templates…"}
          />
        </div>
        <div className="min-h-8 flex-1" />
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
                onClick={() => setSelectedTemplate(tpl)}
                className="group relative flex min-h-[118px] flex-col gap-2 rounded-[14px] border border-slate-200 bg-white p-4 text-left transition hover:border-[#161FAD]/30 hover:shadow-sm"
              >
                <div className="flex items-start gap-2">
                  <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border border-emerald-100 bg-emerald-50">
                    <LayoutTemplate className="h-3.5 w-3.5 text-emerald-600" />
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
          <LayoutTemplate className="mb-3 h-9 w-9 text-slate-200" />
          <p className="text-[13px] text-slate-400">{lang === "zh" ? "没有匹配的模版" : "No matching templates"}</p>
        </div>
      )}

      <Sheet open={Boolean(selectedTemplate)} onOpenChange={(open) => !open && setSelectedTemplate(null)}>
        <SheetContent side="right" showOverlay={false} className="w-[min(560px,92vw)] gap-0 overflow-hidden border-l border-slate-200 bg-[#f8faff] p-0 sm:max-w-none">
          {selectedTemplate ? (
            <>
              <SheetHeader className="border-b border-slate-200 bg-white/92 px-5 py-5 pr-12">
                <div className="flex items-start gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border border-emerald-100 bg-emerald-50">
                    <LayoutTemplate className="h-5 w-5 text-emerald-600" />
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
