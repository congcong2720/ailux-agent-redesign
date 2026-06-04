/*
Design reminder for this file:
- Build the product around three core screens: new task, running workspace, final results
- Preserve the Ailux blue system and restrained product feel from the UI specification
- Keep the shell stable: left task rail + center primary workspace + right plan/result side panel
- Prioritize clarity, traceability, and result consumption over decorative storytelling
- Language switching should feel native rather than layered on top; avoid mixed-language headings in a single mode
*/
import { useEffect, useMemo, useRef, useState } from "react";
import { CreateProjectView } from "@/components/CreateProjectView";
import { PdbViewer } from "@/components/PdbViewer";
import { ProjectPanel } from "@/components/ProjectPanel";
import { ProjectSwitcher } from "@/components/ProjectSwitcher";
import { PUBLIC_DATA, ResourcePanel, SKILLS, TEMPLATES } from "@/components/ResourcePanel";
import { UserCenter } from "@/components/UserCenter";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { useProject, type ProjectDataAsset } from "@/contexts/ProjectContext";
import { demoPdbContent } from "@/lib/demoPdb";
import {
  ArrowDownToLine,
  ArrowUpRight,
  AtSign,
  Bot,
  ChevronDown,
  CheckCircle2,
  CircleDashed,
  Clock3,
  Database,
  FileJson,
  FileSpreadsheet,
  FileText,
  FlaskConical,
  Folder,
  FolderOpen,
  GitBranch,
  Globe2,
  History,
  LogOut,
  PanelRightOpen,
  Plus,
  Save,
  Search,
  SendHorizonal,
  Sparkles,
  Upload,
  UserCircle2,
  WandSparkles,
  X,
  Zap,
} from "lucide-react";
import { toast } from "sonner";

type Lang = "zh" | "en";
type ViewMode = "new" | "running" | "result";
type SideTab = "plan" | "results" | "reports";
type StepStatus = "done" | "running" | "waiting" | "failed";
type ResultType = "csv" | "docx" | "json" | "png" | "xlsx" | "pdb";
type ScenarioId = "dll3" | "a2ui";
type DemoCard = "plan-confirm" | "plan-preview" | "hitl-decision" | "recovery-action" | "results-summary";
type AgentDemoAction =
  | "confirm-run"
  | "adjust-params"
  | "continue-label"
  | "adjust-threshold"
  | "fix-retry"
  | "view-results"
  | "view-report"
  | "interpret-files"
  | "rerun-ml"
  | "explain-top-features";

type LocalizedText = {
  zh: string;
  en: string;
};

type PlanStep = {
  id: string;
  title: LocalizedText;
  waiting: LocalizedText;
  detail: LocalizedText;
  duration: string;
  status: StepStatus;
  summary: LocalizedText;
};

type ResultFile = {
  id: string;
  name: string;
  meta: LocalizedText;
  step: LocalizedText;
  type: ResultType;
};

type HistoryTask = {
  id: string;
  title: LocalizedText;
  meta: LocalizedText;
  isDraft?: boolean;
};

type HistoryRunStatus = "Completed" | "Paused at HITL" | "Failed" | "Running";

type HistoryAttempt = {
  id: string;
  label: string;
  tone: "completed" | "failed" | "modified" | "resumed" | "running";
  detail: LocalizedText;
};

type HistoryPlanStep = {
  id: string;
  title: LocalizedText;
  description: LocalizedText;
  status: StepStatus;
  duration: string;
  toolName: string;
  inputs: string[];
  outputs: string[];
  attempts: HistoryAttempt[];
};

type HistoryRunItem = {
  id: string;
  title: LocalizedText;
  status: HistoryRunStatus;
  time: LocalizedText;
  summaryLine: LocalizedText;
  reason: LocalizedText;
  baseRun: LocalizedText;
  compareSummary: LocalizedText;
  compareItems: Array<{ label: LocalizedText; delta: string; detail: LocalizedText }>;
  planSteps: HistoryPlanStep[];
  files: Array<{ name: string; meta: LocalizedText }>;
  logs: Array<{ time: string; event: string; message: LocalizedText }>;
};

type ReportSection = {
  id: string;
  shortLabel: LocalizedText;
  title: LocalizedText;
  summary: LocalizedText;
  badge: string;
  tone: "brand" | "success" | "warning";
  items: Array<{ label: LocalizedText; value: string; detail: LocalizedText }>;
};

type RunReport = {
  id: string;
  runId: string;
  title: LocalizedText;
  fileName: string;
  generatedAt: LocalizedText;
  summary: LocalizedText;
  sections: ReportSection[];
};

type RunningMessage = {
  role: "user" | "agent";
  content: LocalizedText;
  time: string;
  card?: DemoCard;
};

type RecommendedPrompt = {
  id: ScenarioId;
  text: LocalizedText;
};

type DemoScenario = {
  id: ScenarioId;
  title: LocalizedText;
  messages: RunningMessage[];
  steps: PlanStep[];
  resultFiles: ResultFile[];
  reports: RunReport[];
};

const l = (zh: string, en: string): LocalizedText => ({ zh, en });
const pick = (lang: Lang, value: LocalizedText) => value[lang];
const PRODUCT_ICON_URL = `${import.meta.env.BASE_URL}ailux-product-icon.png`;
const MODEL_RANKING_IMAGE_URL = "/manus-storage/ailux-model-ranking-user-final-v2_2de81eaf.png";
const FEATURE_SCATTER_IMAGE_URL = "/manus-storage/feature_scatter_relationship_2a6adde1.png";

const firstReplyIntro = l(
  "好的，我将基于输入的实验数据，围绕双表位抗体内化活性建立分析与建模流程。",
  "Understood. I will build an analysis and modeling workflow around biparatopic antibody internalization activity from the input experimental data.",
);

const firstReplyPlanTitle = l("分析计划", "Analysis plan");

const firstReplySections = [
  {
    title: l("数据摄取与准备", "Data intake and preparation"),
    body: l(
      "建立数据摄取上下文，整理实验数据、样本标签和建模所需输入，为后续分析准备标准化数据集。",
      "Establish the intake context, organize experimental data, sample labels, and model inputs, and prepare a standardized dataset for downstream analysis.",
    ),
  },
  {
    title: l("结构预测", "Structure prediction"),
    body: l(
      "关联源 PDB 文件，生成 Molstar 结构视图，为抗体结构相关特征分析提供结构证据。",
      "Link the source PDB file and generate a Molstar structure view to provide structural evidence for antibody-related feature analysis.",
    ),
  },
  {
    title: l("特征计算", "Feature calculation"),
    body: l(
      "计算与内化活性相关的候选特征，并生成可用于建模的特征矩阵。",
      "Compute candidate features related to internalization activity and assemble a feature matrix for modeling.",
    ),
  },
  {
    title: l("相关性分析与特征选择", "Correlation analysis and feature selection"),
    body: l(
      "分析特征与内化活性的关系，筛选关键特征，并输出重要性图和重要性表。",
      "Analyze the relationship between features and internalization activity, select key features, and output the importance plot and importance table.",
    ),
  },
  {
    title: l("预测模型评估", "Predictive model evaluation"),
    body: l(
      "训练并比较多个预测模型，评估模型表现，确认排名靠前的内化特征以及表现最佳的 AI 模型。",
      "Train and compare multiple predictive models, assess model performance, and identify the top-ranked internalization features and the best-performing AI model.",
    ),
  },
];

const historyTasks: HistoryTask[] = [
  { id: "draft", title: l("新任务", "New task"), meta: l("创建任务", "Create task"), isDraft: true },
  {
    id: "t1",
    title: l("内化预测建模工作流程", "Internalization Predictive Modeling Workflow"),
    meta: l("当前任务", "Current task"),
  },
  { id: "t2", title: l("内吞特征关联分析", "Endocytosis feature analysis"), meta: l("3 分钟前", "3 min ago") },
  { id: "t3", title: l("EGFR 抗体优化", "EGFR antibody optimization"), meta: l("昨天 18:20", "Yesterday 18:20") },
  { id: "t4", title: l("CDR 区域内吞影响评估", "CDR region impact assessment"), meta: l("04-12 14:32", "04-12 14:32") },
];

const recommendedPrompts: RecommendedPrompt[] = [
  {
    id: "dll3",
    text: l(
      "基于输入的实验数据，分析与双表位抗体内化（内吞作用）相关的特征。设计并构建一个预测模型，对这种内化活性进行评分。",
      "Based on input experimental data, analyze the features correlated with biparatopic antibody internalization (endocytosis). Design and build a predictive model to score this internalization activity.",
    ),
  },
  {
    id: "a2ui",
    text: l(
      "给我一条 DLL3 双抗功能预测的固定分析流程，并说明每步输出",
      "Give me a fixed DLL3 bispecific analysis workflow and explain the output of each step.",
    ),
  },
  {
    id: "dll3",
    text: l("输入 PDB 与 CSV 后，帮我生成结构、特征和结果解释报告", "After I provide PDB and CSV files, generate a structure, feature, and result interpretation report."),
  },
];

const runningMessages: RunningMessage[] = [
  {
    role: "user",
    content: l(
      "基于输入的实验数据，分析与双表位抗体内化（内吞作用）相关的特征。设计并构建一个预测模型，对这种内化活性进行评分。",
      "Based on input experimental data, analyze the features correlated with biparatopic antibody internalization (endocytosis). Design and build a predictive model to score this internalization activity.",
    ),
    time: "18:29",
  },
  {
    role: "agent",
    content: l(
      "好的，我将基于输入的实验数据，围绕双表位抗体内化活性建立分析与建模流程。\n分析计划\n数据摄取与准备\n建立数据摄取上下文，整理实验数据、样本标签和建模所需输入，为后续分析准备标准化数据集。\n结构预测\n关联源 PDB 文件，生成 Molstar 结构视图，为抗体结构相关特征分析提供结构证据。\n特征计算\n计算与内化活性相关的候选特征，并生成可用于建模的特征矩阵。\n相关性分析与特征选择\n分析特征与内化活性的关系，筛选关键特征，并输出重要性图和重要性表。\n预测模型评估\n训练并比较多个预测模型，评估模型表现，确认排名靠前的内化特征以及表现最佳的 AI 模型。",
      "Understood. I will build an analysis and modeling workflow around biparatopic antibody internalization activity from the input experimental data.\nAnalysis plan\nData intake and preparation\nEstablish the intake context, organize experimental data, sample labels, and model inputs, and prepare a standardized dataset for downstream analysis.\nStructure prediction\nLink the source PDB file and generate a Molstar structure view to provide structural evidence for antibody-related feature analysis.\nFeature calculation\nCompute candidate features related to internalization activity and assemble a feature matrix for modeling.\nCorrelation analysis and feature selection\nAnalyze the relationship between features and internalization activity, select key features, and output the importance plot and importance table.\nPredictive model evaluation\nTrain and compare multiple predictive models, assess model performance, and identify the top-ranked internalization features and the best-performing AI model.",
    ),
    time: "18:29",
  },
];

const runningSteps: PlanStep[] = [
  {
    id: "step-1",
    title: l("数据摄取与准备", "Data Intake And Preparation"),
    waiting: l("等待工作流启动。", "Waiting for the workflow to start."),
    detail: l(
      "正在建立数据摄取上下文，并整理实验数据、样本标签与建模输入。",
      "Establishing the data-intake context and organizing experimental data, sample labels, and modeling inputs.",
    ),
    duration: "12s",
    status: "waiting",
    summary: l(
      "标准化数据集已准备完成，可用于后续结构分析与建模。",
      "The standardized dataset is ready for downstream structural analysis and modeling.",
    ),
  },
  {
    id: "step-2",
    title: l("结构预测", "Structure Prediction"),
    waiting: l("等待数据摄取与准备完成后启动。", "Waiting for data intake and preparation to finish."),
    detail: l(
      "正在关联源 PDB 文件并生成 Molstar 结构视图，为结构特征分析提供证据。",
      "Linking the source PDB file and generating a Molstar structure view to provide structural evidence.",
    ),
    duration: "26s",
    status: "waiting",
    summary: l(
      "结构预测已完成，结构源文件与结构视图均已可用。",
      "Structure prediction is complete, and both the source PDB file and structure view are available.",
    ),
  },
  {
    id: "step-3",
    title: l("特征计算", "Feature Calculation"),
    waiting: l("等待结构预测完成后启动。", "Waiting for structure prediction to finish."),
    detail: l(
      "正在计算与内化活性相关的候选特征，并生成用于建模的特征矩阵。",
      "Computing candidate features related to internalization activity and generating the modeling feature matrix.",
    ),
    duration: "31s",
    status: "waiting",
    summary: l(
      "特征矩阵已生成，关键输入特征可供后续相关性分析与模型训练使用。",
      "The feature matrix has been generated and is ready for downstream correlation analysis and model training.",
    ),
  },
  {
    id: "step-4",
    title: l("相关性分析与特征选择", "Correlation Analysis And Feature Selection"),
    waiting: l("等待特征计算完成后启动。", "Waiting for feature calculation to finish."),
    detail: l(
      "正在分析特征与内化活性的关系，并输出重要性图、重要性表与筛选结果。",
      "Analyzing the relationship between features and internalization activity, then exporting importance plots, tables, and selected features.",
    ),
    duration: "24s",
    status: "waiting",
    summary: l(
      "相关性分析与特征选择已完成，关键特征和重要性输出已准备就绪。",
      "Correlation analysis and feature selection are complete, with key features and importance outputs ready.",
    ),
  },
  {
    id: "step-5",
    title: l("预测模型评估", "Predictive Model Evaluation"),
    waiting: l("等待相关性分析与特征选择完成后启动。", "Waiting for correlation analysis and feature selection to finish."),
    detail: l(
      "正在训练并比较多个预测模型，汇总模型排名、相关指标与最终推荐配置。",
      "Training and comparing multiple predictive models, then consolidating rankings, key metrics, and the final recommended configuration.",
    ),
    duration: "22s",
    status: "waiting",
    summary: l(
      "预测模型评估已完成，已确认排名靠前的配置组合和表现最佳的 AI 模型。",
      "Predictive model evaluation is complete, and the top-ranked configurations and best-performing AI model have been identified.",
    ),
  },
];

const resultFiles: ResultFile[] = [
  {
    id: "structure-source",
    name: "DLL3_Mcb008_model_1.pdb",
    meta: l("结构源文件", "Structure source file"),
    step: l("步骤 2 · 结构预测", "Step 2 · Structure prediction"),
    type: "pdb",
  },
  {
    id: "interface-definition",
    name: "interface.csv",
    meta: l("接口定义文件", "Interface definition file"),
    step: l("步骤 2 · 结构预测", "Step 2 · Structure prediction"),
    type: "csv",
  },
  {
    id: "feature-importance-table",
    name: "physical_energy_combined_features.csv",
    meta: l("特征重要性表", "Feature-importance table"),
    step: l("步骤 3 · 特征计算", "Step 3 · Feature calculation"),
    type: "csv",
  },
  {
    id: "feature-importance-plot",
    name: "feature1_vs_experiment_label_corr_plot",
    meta: l("单特征相关性图", "Single-feature correlation plot"),
    step: l("步骤 4 · 相关性分析与特征选择", "Step 4 · Correlation analysis and feature selection"),
    type: "png",
  },
  {
    id: "hit-table-all-features",
    name: "top10_aug_regression_10nM_importance_analysis_result_all_features_importance.csv",
    meta: l("命中表全特征文件", "Hit-table all-features file"),
    step: l("步骤 4 · 相关性分析与特征选择", "Step 4 · Correlation analysis and feature selection"),
    type: "csv",
  },
  {
    id: "final-model-evaluation-table",
    name: "all_ml_evaluation_results_stage2.csv",
    meta: l("最终模型评估表", "Final model-evaluation table"),
    step: l("步骤 5 · 预测模型评估", "Step 5 · Predictive model evaluation"),
    type: "csv",
  },
  {
    id: "evaluation-plot",
    name: "regression_scatter.png",
    meta: l("评估图", "Evaluation plot"),
    step: l("步骤 5 · 预测模型评估", "Step 5 · Predictive model evaluation"),
    type: "png",
  },
  {
    id: "analysis-report-current",
    name: "analysis_report.docx",
    meta: l("最终报告文件", "Final report file"),
    step: l("步骤 5 · 预测模型评估", "Step 5 · Predictive model evaluation"),
    type: "docx",
  },
];

const reportSections: ReportSection[] = [
  {
    id: "binder-overview",
    shortLabel: l("Binder", "Binder"),
    title: l("四个结合域特征提取", "Feature extraction for four binders"),
    summary: l("本次分析覆盖 Mcb008、Msb028、ZG006-1、ZG006-2 四个 DLL3 binder。", "This analysis covers four DLL3 binders: Mcb008, Msb028, ZG006-1, and ZG006-2."),
    badge: "4 binders",
    tone: "brand",
    items: [
      { label: l("Mcb008", "Mcb008"), value: "140 features", detail: l("PDB：XF1_DLL3_Mcb008xi_000_SC_0.75.pdb，状态已完成。", "PDB XF1_DLL3_Mcb008xi_000_SC_0.75.pdb completed.") },
      { label: l("Msb028", "Msb028"), value: "140 features", detail: l("PDB：XF_res_DLL3_Msb028_001_SC_0.35.pdb，状态已完成。", "PDB XF_res_DLL3_Msb028_001_SC_0.35.pdb completed.") },
      { label: l("ZG006-1", "ZG006-1"), value: "140 features", detail: l("PDB：XF1_DLL3_ZG006-1_000_SC_0.82.pdb，状态已完成。", "PDB XF1_DLL3_ZG006-1_000_SC_0.82.pdb completed.") },
      { label: l("ZG006-2", "ZG006-2"), value: "140 features", detail: l("PDB：XF1_DLL3_ZG006-2_000_SC_0.84.pdb，状态已完成。", "PDB XF1_DLL3_ZG006-2_000_SC_0.84.pdb completed.") },
    ],
  },
  {
    id: "feature-sources",
    shortLabel: l("特征来源", "Sources"),
    title: l("特征类别与来源", "Feature categories and sources"),
    summary: l("每个 binder 的 140 维特征来自 Prodigy、Rosetta、表位和结合域维度。", "Each binder has 140 features from Prodigy, Rosetta, epitope, and binder dimensions."),
    badge: "140 / binder",
    tone: "success",
    items: [
      { label: l("Prodigy", "Prodigy"), value: "interface", detail: l("提取界面接触数、极性/非极性接触比例、结合自由能预测等特征。", "Extracts interface contacts, polarity ratio, and predicted binding free energy.") },
      { label: l("Rosetta", "Rosetta"), value: "energy", detail: l("提取总能量、界面能、范德华力、静电能和溶剂化能等能量学指标。", "Extracts total energy, interface energy, van der Waals, electrostatic, and solvation metrics.") },
      { label: l("表位 / 结合域", "Epitope / binder"), value: "epitope", detail: l("描述表位残基组成、面积、极性分布，以及 CDR/框架区相关特征。", "Describes epitope residue composition, area, polarity, and CDR/framework features.") },
    ],
  },
  {
    id: "model-quality",
    shortLabel: l("模型风险", "Risk"),
    title: l("模型表现与数据质量风险", "Model performance and data quality risk"),
    summary: l("当前 demo 数据在部分 fold 中出现 All train targets are equal，说明模型训练受样本量和标签分布限制。", "Some folds have all train targets equal, so model training is limited by sample size and label distribution."),
    badge: "limited",
    tone: "warning",
    items: [
      { label: l("直接现象", "Observation"), value: "constant targets", detail: l("部分交叉验证 fold 的训练标签完全相同，CatBoost 会报错。", "Several cross-validation folds have identical training labels, causing CatBoost errors.") },
      { label: l("影响范围", "Impact"), value: "metrics", detail: l("GBDT 和 LightGBM 可容错完成训练，但结果更多用于验证流程。", "GBDT and LightGBM can finish, but results should mainly validate the workflow.") },
      { label: l("展示原则", "Display rule"), value: "with warning", detail: l("前端应明确提示“模型受限”，避免把 demo 指标误读成生产模型性能。", "The UI should clearly show model limitation warnings to prevent over-interpretation.") },
    ],
  },
];

const runReports: RunReport[] = [
  {
    id: "report-run-03",
    runId: "run-03",
    title: l("Run #3 · 双表位双抗内吞特征挖掘报告", "Run #3 · Biparatopic antibody internalization report"),
    fileName: "analysis_report.docx",
    generatedAt: l("今天 15:42", "Today 15:42"),
    summary: l("Top K 调整后的最终报告，包含模型限制提示、Top 12 候选排序和后续优化建议。", "Final report after Top K adjustment, including model limitation warning, Top 12 ranking, and next actions."),
    sections: reportSections,
  },
  {
    id: "report-run-02",
    runId: "run-02",
    title: l("Run #2 · cutoff 调整中间报告", "Run #2 · Cutoff adjustment interim report"),
    fileName: "analysis_report_run2.docx",
    generatedAt: l("今天 15:18", "Today 15:18"),
    summary: l("记录 10nM cutoff 重跑过程、HITL 暂停原因和可继续的模型配置。", "Documents the 10nM cutoff rerun, HITL pause reason, and resumable model config."),
    sections: reportSections.slice(0, 3),
  },
  {
    id: "report-run-01",
    runId: "run-01",
    title: l("Run #1 · 初始 Plan A 报告", "Run #1 · Initial Plan A report"),
    fileName: "analysis_report_v1.docx",
    generatedAt: l("今天 14:56", "Today 14:56"),
    summary: l("首次运行的基础结构特征与初版模型分析报告，用作后续轮次对比基线。", "Baseline structural feature and initial model analysis report for comparison with later runs."),
    sections: reportSections.slice(0, 2),
  },
];

const a2uiPlanSections = [
  {
    title: l("理解任务与校验输入", "Understand Task & Validate Inputs"),
    body: l(
      "抽取目标、输入数据、约束和预期产物，并校验 CSV、PDB 与实验字段。",
      "Extract objective, input data, constraints, and deliverables while validating CSV, PDB, and assay fields.",
    ),
    output: l("输入文件校验通过，识别 DLL3 双抗功能预测目标", "Input files validated, DLL3 bispecific prediction objective identified"),
  },
  {
    title: l("生成可确认执行 Plan", "Generate Confirmable Execution Plan"),
    body: l(
      "把任务拆成结构特征、模型排序、人工检查点、结果解释和模板沉淀。",
      "Split the task into structural features, model ranking, human checkpoints, result explanation, and template capture.",
    ),
    output: l("含步骤、参数、文件要求和风险提示的确认式 Plan", "Confirmable plan with steps, parameters, file requirements, and risk notes"),
  },
  {
    title: l("计算结构与表位特征", "Compute Structural & Epitope Features"),
    body: l(
      "计算界面残基、空间距离、表位覆盖率和潜在冲突位点。",
      "Compute interface residues, spatial distances, epitope coverage, and potential conflict sites.",
    ),
    output: l("结构、能量、界面、表位四维可复用特征", "Structure, energy, interface, and epitope reusable features"),
  },
  {
    title: l("人工确认异常候选", "Human Review for Outlier Candidates"),
    body: l(
      "暂停流程并展示异常候选，等待用户决定继续、调参或排除。",
      "Pause the flow and present outlier candidates for continue, tuning, or exclusion.",
    ),
    output: l("用户决策记录，含 warning 标注或阈值调整", "User decision record with warning labels or threshold adjustments"),
  },
  {
    title: l("模型排序与失败恢复", "Model Ranking & Recovery"),
    body: l(
      "批量推理候选分子；字段缺失时只重跑当前步骤。",
      "Run batch candidate inference and rerun only the current step when fields are missing.",
    ),
    output: l("ranked_candidates.csv + 字段缺失自动恢复", "ranked_candidates.csv + automatic field recovery"),
  },
  {
    title: l("生成结果解释与模板", "Generate Result Explanation & Template"),
    body: l(
      "输出报告、文件预览、Data 保存入口和可复用流程模板。",
      "Generate report, file preview, Data save entry, and reusable workflow template.",
    ),
    output: l("analysis_report.docx + workflow_template.json", "analysis_report.docx + workflow_template.json"),
  },
];

const a2uiRunningMessages: RunningMessage[] = [
  {
    role: "user",
    content: l(
      "给我一条 DLL3 双抗功能预测的固定分析流程，并说明每步输出。",
      "Give me a fixed DLL3 bispecific analysis workflow and explain the output of each step.",
    ),
    time: "10:28",
  },
  {
    role: "agent",
    content: l(
      "好的，我已将任务拆解为 6 个步骤。请确认计划后开始运行。",
      "Understood. I have broken the task into 6 steps. Please confirm the plan to start.",
    ),
    time: "10:28",
    card: "plan-confirm",
  },
  {
    role: "agent",
    content: l(
      "已确认 Plan，开始运行。你可以在右侧 Run 面板查看总进度、当前步骤参数、日志摘要，也可以中止或触发人工检查点。",
      "Plan confirmed. Execution has started. You can inspect overall progress, current-step parameters, log summary, and pause or trigger human checkpoints in the right Run panel.",
    ),
    time: "10:29",
  },
  {
    role: "agent",
    content: l(
      "我发现 3 个候选分子结构评分高但实验读数偏低。为了避免黑盒排序，当前流程暂停，等待你确认继续、调参或排除候选。",
      "I found three candidates with high structural scores but low experimental readouts. To avoid black-box ranking, the flow is paused for your decision: continue, tune thresholds, or exclude candidates.",
    ),
    time: "10:31",
    card: "hitl-decision",
  },
  {
    role: "agent",
    content: l(
      "排序步骤出现字段缺失：ranked_candidates.csv 中 2 行缺少 mol_id。影响范围仅限 Step 5，可自动补齐并从当前步骤局部重跑。",
      "The ranking step found missing fields: 2 rows in ranked_candidates.csv lack mol_id. The impact is limited to Step 5, and the flow can auto-fill the field and rerun this step only.",
    ),
    time: "10:33",
    card: "recovery-action",
  },
  {
    role: "agent",
    content: l(
      "任务已完成。我把结果按步骤分组展示在右侧 Files，并生成了可解释报告、热图、排序表和可保存的流程模板。",
      "The task is complete. I grouped results by step in Files and generated an explainable report, heatmap, ranking table, and reusable workflow template.",
    ),
    time: "10:36",
    card: "results-summary",
  },
];

const a2uiRunningSteps: PlanStep[] = [
  {
    id: "a2ui-step-1",
    title: l("理解任务与校验输入", "Understand Task And Validate Inputs"),
    waiting: l("等待工作流启动。", "Waiting for the workflow to start."),
    detail: l("正在抽取目标、输入数据、约束和预期产物，并校验 CSV、PDB 与实验字段。", "Extracting objective, input data, constraints, and deliverables while validating CSV, PDB, and assay fields."),
    duration: "10s",
    status: "waiting",
    summary: l("输入文件和字段校验通过，已识别 DLL3 双抗功能预测目标。", "Input files and fields passed validation, and the DLL3 bispecific prediction objective was identified."),
  },
  {
    id: "a2ui-step-2",
    title: l("生成可确认执行 Plan", "Generate Confirmable Execution Plan"),
    waiting: l("等待输入校验完成后启动。", "Waiting for input validation to finish."),
    detail: l("正在把任务拆成结构特征、模型排序、人工检查点、结果解释和模板沉淀。", "Splitting the task into structural features, model ranking, human checkpoints, result explanation, and template capture."),
    duration: "18s",
    status: "waiting",
    summary: l("确认式 Plan 已生成，包含步骤、参数、文件要求和风险提示。", "A confirmable plan is ready with steps, parameters, file requirements, and risk notes."),
  },
  {
    id: "a2ui-step-3",
    title: l("计算结构与表位特征", "Compute Structural And Epitope Features"),
    waiting: l("等待用户确认 Plan 后启动。", "Waiting for the user to confirm the plan."),
    detail: l("正在计算界面残基、空间距离、表位覆盖率和潜在冲突位点。", "Computing interface residues, spatial distances, epitope coverage, and potential conflict sites."),
    duration: "16s",
    status: "waiting",
    summary: l("结构、能量、界面和表位维度已形成可复用特征。", "Structure, energy, interface, and epitope dimensions are now reusable features."),
  },
  {
    id: "a2ui-step-4",
    title: l("人工确认异常候选", "Human Review For Outlier Candidates"),
    waiting: l("等待结构特征计算完成后启动。", "Waiting for structural feature calculation to finish."),
    detail: l("正在暂停流程并展示异常候选，等待用户决定继续、调参或排除。", "Pausing the flow and presenting outlier candidates for continue, tuning, or exclusion."),
    duration: "12s",
    status: "waiting",
    summary: l("人工检查点已完成，用户选择继续并保留 warning。", "Human checkpoint completed, and the user chose to continue with warning labels."),
  },
  {
    id: "a2ui-step-5",
    title: l("模型排序与失败恢复", "Model Ranking And Recovery"),
    waiting: l("等待人工确认完成后启动。", "Waiting for human review to finish."),
    detail: l("正在批量推理候选分子；字段缺失时只重跑当前步骤。", "Running batch candidate inference and rerunning only the current step when fields are missing."),
    duration: "14s",
    status: "waiting",
    summary: l("排序步骤已完成，字段缺失通过局部重跑恢复。", "Ranking is complete, and missing fields were recovered through a local rerun."),
  },
  {
    id: "a2ui-step-6",
    title: l("生成结果解释与模板", "Generate Result Explanation And Template"),
    waiting: l("等待排序完成后启动。", "Waiting for ranking to finish."),
    detail: l("正在输出报告、文件预览、Data 保存入口和可复用流程模板。", "Generating report, file preview, Data save entry, and reusable workflow template."),
    duration: "12s",
    status: "waiting",
    summary: l("结果摘要、图表、报告和模板均已生成。", "Result summary, charts, report, and template have been generated."),
  },
];

const a2uiResultFiles: ResultFile[] = [
  {
    id: "a2ui-structure-features",
    name: "structure_features.parquet",
    meta: l("结构特征表", "Structural feature table"),
    step: l("步骤 3 · 计算结构与表位特征", "Step 3 · Compute structural and epitope features"),
    type: "csv",
  },
  {
    id: "a2ui-interface-heatmap",
    name: "interface_heatmap.png",
    meta: l("界面热图", "Interface heatmap"),
    step: l("步骤 3 · 计算结构与表位特征", "Step 3 · Compute structural and epitope features"),
    type: "png",
  },
  {
    id: "a2ui-ranked-candidates",
    name: "ranked_candidates.csv",
    meta: l("候选排序表", "Candidate ranking table"),
    step: l("步骤 5 · 模型排序与失败恢复", "Step 5 · Model ranking and recovery"),
    type: "csv",
  },
  {
    id: "a2ui-analysis-report",
    name: "analysis_report.docx",
    meta: l("可解释报告", "Explainable report"),
    step: l("步骤 6 · 生成结果解释与模板", "Step 6 · Generate result explanation and template"),
    type: "docx",
  },
  {
    id: "a2ui-template-json",
    name: "workflow_template.json",
    meta: l("可复用流程模板", "Reusable workflow template"),
    step: l("步骤 6 · 生成结果解释与模板", "Step 6 · Generate result explanation and template"),
    type: "json",
  },
];

const a2uiReportSections: ReportSection[] = [
  {
    id: "overview",
    shortLabel: l("概况", "Overview"),
    title: l("项目概况", "Project overview"),
    summary: l("XAD017 第四轮计算数据，靶点为 DLL3，分析对象为 XF1 双表位双特异性抗体。", "XAD017 round-4 computation dataset targeting DLL3, focused on XF1 biparatopic bispecific antibodies."),
    badge: "XAD017 / DLL3",
    tone: "brand",
    items: [
      { label: l("抗体格式", "Antibody format"), value: "XF1", detail: l("双表位双特异性抗体。", "Biparatopic bispecific antibody.") },
      { label: l("结合域", "Binders"), value: "4", detail: l("Mcb008、Msb028、ZG006-1、ZG006-2。", "Mcb008, Msb028, ZG006-1, and ZG006-2.") },
      { label: l("特征来源", "Feature sources"), value: "Prodigy + Rosetta", detail: l("融合蛋白相互作用、能量学、表位和结合域特征。", "Combines protein interaction, energy, epitope, and binder-domain features.") },
    ],
  },
  {
    id: "execution",
    shortLabel: l("流程", "Flow"),
    title: l("执行流程：9/9 步骤全部成功", "Execution flow: 9/9 steps succeeded"),
    summary: l("工作空间检查、结构特征计算、双结合域组合和 ML 回归分析均成功完成。", "Workspace checks, structural feature computation, dual-binder feature combination, and ML regression all completed successfully."),
    badge: "9/9 success",
    tone: "success",
    items: [
      { label: l("特征计算", "Feature computation"), value: "completed", detail: l("Prodigy、Rosetta、表位/结合域特征计算完成。", "Prodigy, Rosetta, and epitope/binder features completed.") },
      { label: l("双结合域组合", "Dual-binder combination"), value: "completed", detail: l("两臂特征已合并为双表位双抗联合特征。", "Two-arm features were merged into biparatopic antibody feature vectors.") },
      { label: l("ML 回归分析", "ML regression"), value: "completed", detail: l("完成多模型 K-fold 交叉验证与特征重要性排序。", "Completed multi-model K-fold validation and feature-importance ranking.") },
    ],
  },
  {
    id: "binder-features",
    shortLabel: l("Binder", "Binder"),
    title: l("四个结合域的特征提取", "Feature extraction for four binders"),
    summary: l("每个 binder 提取 140 维结构特征，四个结合域均已完成。", "Each binder has 140 structural features extracted, and all four binders completed successfully."),
    badge: "4 × 140",
    tone: "success",
    items: [
      { label: l("Mcb008", "Mcb008"), value: "140", detail: l("XF1_DLL3_Mcb008xi_000_SC_0.75.pdb，状态成功。", "XF1_DLL3_Mcb008xi_000_SC_0.75.pdb succeeded.") },
      { label: l("Msb028", "Msb028"), value: "140", detail: l("XF_res_DLL3_Msb028_001_SC_0.35.pdb，状态成功。", "XF_res_DLL3_Msb028_001_SC_0.35.pdb succeeded.") },
      { label: l("ZG006-1", "ZG006-1"), value: "140", detail: l("XF1_DLL3_ZG006-1_000_SC_0.82.pdb，状态成功。", "XF1_DLL3_ZG006-1_000_SC_0.82.pdb succeeded.") },
      { label: l("ZG006-2", "ZG006-2"), value: "140", detail: l("XF1_DLL3_ZG006-2_000_SC_0.84.pdb，状态成功。", "XF1_DLL3_ZG006-2_000_SC_0.84.pdb succeeded.") },
    ],
  },
  {
    id: "feature-categories",
    shortLabel: l("特征", "Features"),
    title: l("特征类别：140 维 / binder", "Feature categories: 140 dimensions per binder"),
    summary: l("特征体系覆盖相互作用、能量学、表位和结合域结构信息。", "The feature system covers interaction, energy, epitope, and binder-domain structural information."),
    badge: "140 dims",
    tone: "brand",
    items: [
      { label: l("Prodigy", "Prodigy"), value: "interaction", detail: l("界面接触数、极性/非极性接触比、结合自由能预测等。", "Interface contacts, polar/non-polar contact ratio, predicted binding free energy, and more.") },
      { label: l("Rosetta", "Rosetta"), value: "energy", detail: l("总能量、界面能、范德华力、静电能、溶剂化能等。", "Total energy, interface energy, van der Waals, electrostatic, and solvation energies.") },
      { label: l("表位/结合域", "Epitope / binder"), value: "structure", detail: l("表位残基组成、表位面积、极性分布、CDR 区和框架区特征。", "Epitope residue composition, area, polarity distribution, CDR, and framework features.") },
    ],
  },
  {
    id: "ml-analysis",
    shortLabel: l("ML", "ML"),
    title: l("ML 回归分析结果", "ML regression analysis"),
    summary: l("系统完成 16 个实验配置组合，但当前数据存在 All train targets are equal 风险。", "The system completed 16 experiment configurations, with an All train targets are equal risk in the current dataset."),
    badge: "16 configs",
    tone: "warning",
    items: [
      { label: l("分析配置", "Config"), value: "4-fold K-fold", detail: l("OpenBox 贝叶斯优化 5 轮 / fold，模型包括 GBDT、LightGBM、CatBoost。", "OpenBox Bayesian optimization, 5 rounds per fold, with GBDT, LightGBM, and CatBoost.") },
      { label: l("实验维度", "Dimensions"), value: "1nM / 10nM", detail: l("覆盖 cutoff、特征集和 Stage1 / Stage2 训练阶段组合。", "Covers cutoff, feature set, and Stage1 / Stage2 combinations.") },
      { label: l("模型风险", "Risk"), value: "constant targets", detail: l("部分 fold 训练目标值全部相同，Spearman / Pearson 因常数输入无法稳定定义。", "Some folds have identical targets, so Spearman / Pearson cannot be stably defined.") },
    ],
  },
  {
    id: "findings",
    shortLabel: l("发现", "Findings"),
    title: l("关键发现与抗体设计启示", "Key findings and antibody-design implications"),
    summary: l("多层次特征体系已建立，可用于解释表位选择、结合模式和潜在内吞机制。", "A multi-level feature system has been established to explain epitope choice, binding mode, and potential internalization mechanisms."),
    badge: "insights",
    tone: "success",
    items: [
      { label: l("特征工程", "Feature engineering"), value: "multi-level", detail: l("从单臂结合特征到双表位组合特征均已构建成功。", "Built both single-arm binding features and biparatopic combination features.") },
      { label: l("表位选择", "Epitope choice"), value: "pairwise", detail: l("Mcb008+ZG006 与 Msb028+ZG006 等组合的结构差异可指导表位优化。", "Structural differences among Mcb008+ZG006 and Msb028+ZG006 can guide epitope optimization.") },
      { label: l("内吞机制", "Internalization"), value: "interface + distance", detail: l("内吞效率可能与界面互补性、表位距离等特征相关。", "Internalization efficiency may relate to interface complementarity and epitope distance.") },
    ],
  },
];

const a2uiRunReports: RunReport[] = [
  {
    id: "a2ui-report-run-01",
    runId: "a2ui-run-01",
    title: l("Run #1 · 双表位双抗内吞特征挖掘完整报告", "Run #1 · Complete biparatopic antibody internalization feature report"),
    fileName: "analysis_report.docx",
    generatedAt: l("今天 10:32", "Today 10:32"),
    summary: l("基于 XAD017 第四轮 DLL3 数据的完整分析报告，覆盖特征计算、ML 回归风险、关键发现和下一步建议。", "Complete report for XAD017 round-4 DLL3 data, covering feature computation, ML regression risks, findings, and next actions."),
    sections: a2uiReportSections,
  },
];

const demoScenarios: Record<ScenarioId, DemoScenario> = {
  dll3: {
    id: "dll3",
    title: l("内化预测建模工作流程", "Internalization Predictive Modeling Workflow"),
    messages: runningMessages,
    steps: runningSteps,
    resultFiles,
    reports: runReports,
  },
  a2ui: {
    id: "a2ui",
    title: l("DLL3 双抗功能预测固定流程", "DLL3 Bispecific Fixed Prediction Workflow"),
    messages: a2uiRunningMessages,
    steps: a2uiRunningSteps,
    resultFiles: a2uiResultFiles,
    reports: a2uiRunReports,
  },
};

const historyRunItems: HistoryRunItem[] = [
  {
    id: "run-03",
    title: l("Run #3 · DLL3 功能预测标准流程", "Run #3 · DLL3 functional prediction workflow"),
    status: "Completed",
    time: l("今天 15:42", "Today 15:42"),
    summaryLine: l("Completed · 6 steps · 3 inputs · 12 files", "Completed · 6 steps · 3 inputs · 12 files"),
    reason: l("基于 Run #2 调整 Top K=12 后重跑，并保留 HITL 决策记录。", "Reran from Run #2 with Top K=12 and kept the HITL decision trace."),
    baseRun: l("Run #2", "Run #2"),
    compareSummary: l("Run #3 只调整候选输出数量与结果解释策略，上游结构特征快照保持不变。", "Run #3 only changes the candidate count and result interpretation strategy. Upstream structural feature snapshots remain unchanged."),
    compareItems: [
      { label: l("Top K", "Top K"), delta: "8 → 12", detail: l("扩大候选输出范围，便于后续人工筛选。", "Expanded the candidate output range for downstream review.") },
      { label: l("模型提示", "Model warning"), delta: "off → on", detail: l("增加 constant target warning，避免误读模型性能。", "Added constant-target warnings to avoid over-reading model performance.") },
      { label: l("文件产物", "Artifacts"), delta: "+4 files", detail: l("新增 top12 排序表、结构化报告 JSON 和对比摘要。", "Added the top12 ranking table, structured report JSON, and comparison summary.") },
    ],
    planSteps: [
      {
        id: "step-01",
        title: l("数据校验", "Data validation"),
        description: l("校验输入 CSV、PDB 和 assay 标签字段，冻结输入文件快照。", "Validate CSV, PDB, and assay label fields, then freeze the input snapshot."),
        status: "done",
        duration: "1.8s",
        toolName: "agent_planner",
        inputs: ["candidates.csv", "dll3_complex.pdb", "assay.xlsx"],
        outputs: ["CSV schema valid", "4 binder PDB files found", "assay label column bound"],
        attempts: [{ id: "step-01-attempt-1", label: "Attempt 1", tone: "completed", detail: l("Completed: 输入文件、schema 与实验标签校验通过。", "Completed: input files, schema, and assay labels passed validation.") }],
      },
      {
        id: "step-02",
        title: l("结构预测", "Structure prediction"),
        description: l("根据确认后的 Plan 使用结构文件生成结合域分析上下文。", "Generate binder analysis context from the confirmed plan and structure files."),
        status: "done",
        duration: "2.4s",
        toolName: "strategist",
        inputs: ["dll3_complex.pdb", "binder_metadata_v2.csv"],
        outputs: ["DLL3 extracellular domain recognized", "Binder chain mapping completed", "SC confidence scores recorded"],
        attempts: [
          { id: "step-02-attempt-1", label: "Attempt 1", tone: "failed", detail: l("Failed: binder metadata 缺少 `epitope_region` 字段。", "Failed: binder metadata missed the `epitope_region` column.") },
          { id: "step-02-attempt-2", label: "Attempt 2", tone: "modified", detail: l("Replaced input file: 使用修正后的 binder_metadata_v2.csv 继续。", "Replaced input file: continued with corrected binder_metadata_v2.csv.") },
          { id: "step-02-attempt-3", label: "Attempt 3", tone: "completed", detail: l("Completed: 表位特征计算上下文生成成功。", "Completed: epitope feature context generated successfully.") },
        ],
      },
      {
        id: "step-03",
        title: l("特征计算", "Feature calculation"),
        description: l("提取 Prodigy、Rosetta、表位和结合域特征。", "Extract Prodigy, Rosetta, epitope, and binder features."),
        status: "done",
        duration: "8m 31s",
        toolName: "structure_feature_skill",
        inputs: ["Mcb008.pdb", "Msb028.pdb", "ZG006-1.pdb", "ZG006-2.pdb"],
        outputs: ["560 features generated", "Feature QC passed", "Rosetta cache resumed for ZG006-2"],
        attempts: [
          { id: "step-03-attempt-1", label: "Attempt 1", tone: "failed", detail: l("Failed: ZG006-2 的 Rosetta score cache 缺失。", "Failed: Rosetta score cache was missing for ZG006-2.") },
          { id: "step-03-attempt-2", label: "Attempt 2", tone: "resumed", detail: l("Resumed: 复用 Prodigy 输出，只补跑 Rosetta energy features。", "Resumed: reused Prodigy outputs and reran only Rosetta energy features.") },
          { id: "step-03-attempt-3", label: "Attempt 3", tone: "completed", detail: l("Completed: 4 个 binder 共 560 个单臂特征生成成功。", "Completed: generated 560 single-arm features for 4 binders.") },
        ],
      },
      {
        id: "step-04",
        title: l("候选排序", "Candidate ranking"),
        description: l("使用 1nM / 10nM cutoff 和多模型配置进行回归分析。", "Run regression analysis with 1nM / 10nM cutoffs and multiple model configs."),
        status: "done",
        duration: "2m 12s",
        toolName: "ranking_model",
        inputs: ["combined_features.csv", "assay.xlsx"],
        outputs: ["Top 12 candidate table generated", "Model limitation warning attached", "Ranking snapshot saved"],
        attempts: [
          { id: "step-04-attempt-1", label: "Attempt 1", tone: "modified", detail: l("topK=10：初版候选排序完成，但用户希望扩大候选范围。", "topK=10: initial ranking completed, then the user asked for a wider candidate range.") },
          { id: "step-04-attempt-2", label: "Attempt 2", tone: "completed", detail: l("topK=20 后收敛到 Top 12 输出，并保留模型受限 warning。", "After topK=20, converged to a Top 12 output and kept the model warning.") },
        ],
      },
      {
        id: "step-05",
        title: l("结果解释", "Result interpretation"),
        description: l("生成结构化指标卡、完整报告和可复用流程模板。", "Generate a structured metric card, full report, and reusable workflow template."),
        status: "done",
        duration: "42s",
        toolName: "report_skill",
        inputs: ["ranked_candidates_top12.csv", "feature_importance.csv"],
        outputs: ["A2UI metric card generated", "analysis_report.docx uploaded", "Run snapshot saved"],
        attempts: [{ id: "step-05-attempt-1", label: "Attempt 1", tone: "completed", detail: l("Completed: 生成结构化指标卡、报告文件和 Run 快照。", "Completed: generated the metric card, report file, and run snapshot.") }],
      },
    ],
    files: [
      { name: "structure_features.parquet", meta: l("Step 3 · 特征计算", "Step 3 · Feature calculation") },
      { name: "prodigy_features.csv", meta: l("Step 3 · 特征计算", "Step 3 · Feature calculation") },
      { name: "ranked_candidates_top12.csv", meta: l("Step 5 · 结果解释", "Step 5 · Result interpretation") },
      { name: "analysis_report.docx", meta: l("Step 5 · 结果解释", "Step 5 · Result interpretation") },
    ],
    logs: [
      { time: "15:31:08", event: "planner_complete", message: l("Plan C generated from Run #2 with topK=12 and model warning enabled.", "Plan C generated from Run #2 with topK=12 and model warning enabled.") },
      { time: "15:36:42", event: "commander_step_complete", message: l("Feature calculation completed for 4 binders, 140 features per binder.", "Feature calculation completed for 4 binders, 140 features per binder.") },
      { time: "15:42:03", event: "result_file_uploaded", message: l("12 result files linked to Run #3 snapshot.", "12 result files linked to Run #3 snapshot.") },
    ],
  },
  {
    id: "run-02",
    title: l("Run #2 · 调整 cutoff 后重跑", "Run #2 · Rerun with adjusted cutoff"),
    status: "Paused at HITL",
    time: l("今天 15:18", "Today 15:18"),
    summaryLine: l("Paused at HITL · 4/6 steps · 3 inputs · 6 files", "Paused at HITL · 4/6 steps · 3 inputs · 6 files"),
    reason: l("用户追问 10nM cutoff 下是否更稳定，Agent 生成 Plan B 并在异常候选处暂停。", "The user asked whether 10nM cutoff is more stable. The agent generated Plan B and paused at anomalous candidates."),
    baseRun: l("Run #1", "Run #1"),
    compareSummary: l("Run #2 主要调整 affinity cutoff，尚未生成最终结果。", "Run #2 mainly adjusts the affinity cutoff and has not generated final results yet."),
    compareItems: [
      { label: l("Cutoff", "Cutoff"), delta: "1nM → 10nM", detail: l("放宽亲和力阈值，尝试缓解标签过少问题。", "Relaxed the affinity threshold to reduce sparse-label issues.") },
      { label: l("状态", "Status"), delta: "completed → paused", detail: l("在 HITL 节点暂停，等待用户确认。", "Paused at the HITL checkpoint for user confirmation.") },
    ],
    planSteps: [
      {
        id: "step-01",
        title: l("复用输入快照", "Reuse input snapshot"),
        description: l("继承 Run #1 的输入文件并冻结为 Run #2 输入快照。", "Inherit Run #1 inputs and freeze them as the Run #2 input snapshot."),
        status: "done",
        duration: "1.1s",
        toolName: "agent_planner",
        inputs: ["candidates.csv", "dll3_complex.pdb", "assay.xlsx"],
        outputs: ["Run #1 snapshot inherited", "cutoff changed to 10nM"],
        attempts: [{ id: "step-01-attempt-1", label: "Attempt 1", tone: "completed", detail: l("Completed: 输入快照已复用。", "Completed: input snapshot reused.") }],
      },
      {
        id: "step-02",
        title: l("重新生成模型配置", "Regenerate model config"),
        description: l("将 cutoff 调整为 10nM，并准备重跑模型排序。", "Adjust cutoff to 10nM and prepare the ranking rerun."),
        status: "done",
        duration: "2.0s",
        toolName: "strategist",
        inputs: ["Run #1 feature snapshot"],
        outputs: ["model_config_10nM.json", "HITL checkpoint generated"],
        attempts: [{ id: "step-02-attempt-1", label: "Attempt 1", tone: "completed", detail: l("Completed: Plan B 已生成。", "Completed: Plan B generated.") }],
      },
      {
        id: "step-03",
        title: l("等待人工确认", "Wait for human decision"),
        description: l("发现 3 个结构评分高但实验读数偏低的候选，等待用户决策。", "Found 3 candidates with high structure score but low assay readout, waiting for user decision."),
        status: "running",
        duration: "paused",
        toolName: "hitl_decision",
        inputs: ["model_config_10nM.json", "warning_candidates.json"],
        outputs: ["continue / exclude / adjust options"],
        attempts: [{ id: "step-03-attempt-1", label: "Attempt 1", tone: "running", detail: l("Running: 等待继续、排除或调参选择。", "Running: waiting for continue, exclude, or tune decision.") }],
      },
    ],
    files: [{ name: "model_config_10nM.json", meta: l("Step 2 · 模型配置", "Step 2 · Model config") }],
    logs: [
      { time: "15:12:40", event: "strategist_complete", message: l("Plan B generated with cutoff=10nM.", "Plan B generated with cutoff=10nM.") },
      { time: "15:18:09", event: "hitl_required", message: l("Three candidates require human decision before ranking continues.", "Three candidates require human decision before ranking continues.") },
    ],
  },
  {
    id: "run-01",
    title: l("Run #1 · 初始 Plan A", "Run #1 · Initial Plan A"),
    status: "Completed",
    time: l("今天 14:56", "Today 14:56"),
    summaryLine: l("Completed · 6 steps · 3 inputs · 8 files", "Completed · 6 steps · 3 inputs · 8 files"),
    reason: l("首次基于用户原始问题生成 Plan A，完成基础结构特征和初版模型分析。", "First generated Plan A from the original prompt and completed baseline structural features and model analysis."),
    baseRun: l("无", "None"),
    compareSummary: l("这是初始运行，没有上一版本可对比。", "This is the initial run, with no previous version to compare."),
    compareItems: [{ label: l("Baseline", "Baseline"), delta: "created", detail: l("建立首个不可变 Run 快照。", "Created the first immutable run snapshot.") }],
    planSteps: [
      {
        id: "step-01",
        title: l("初始数据校验", "Initial data validation"),
        description: l("读取用户上传数据并生成首版执行计划。", "Read uploaded data and generate the first execution plan."),
        status: "done",
        duration: "1.6s",
        toolName: "agent_planner",
        inputs: ["user prompt", "uploaded files"],
        outputs: ["Plan A generated", "input files validated"],
        attempts: [{ id: "step-01-attempt-1", label: "Attempt 1", tone: "completed", detail: l("Completed: Plan A 已生成。", "Completed: Plan A generated.") }],
      },
      {
        id: "step-02",
        title: l("基础特征计算", "Baseline feature calculation"),
        description: l("完成四个 binder 的单臂结构特征提取。", "Complete single-arm structural feature extraction for four binders."),
        status: "done",
        duration: "7m 48s",
        toolName: "structure_feature_skill",
        inputs: ["4 binder PDB files"],
        outputs: ["Prodigy features", "Rosetta features", "Epitope features"],
        attempts: [{ id: "step-02-attempt-1", label: "Attempt 1", tone: "completed", detail: l("Completed: 基础特征集已生成。", "Completed: baseline feature set generated.") }],
      },
      {
        id: "step-03",
        title: l("初版报告", "Initial report"),
        description: l("生成初版结果摘要，提示样本量限制。", "Generate the initial result summary and flag sample-size limitations."),
        status: "done",
        duration: "38s",
        toolName: "report_skill",
        inputs: ["feature matrix", "model outputs"],
        outputs: ["analysis_report_v1.docx", "markdown summary"],
        attempts: [{ id: "step-03-attempt-1", label: "Attempt 1", tone: "completed", detail: l("Completed: 初版报告已生成。", "Completed: initial report generated.") }],
      },
    ],
    files: [{ name: "analysis_report_v1.docx", meta: l("Step 3 · 初版报告", "Step 3 · Initial report") }],
    logs: [
      { time: "14:48:12", event: "planner_complete", message: l("Plan A generated from initial prompt.", "Plan A generated from initial prompt.") },
      { time: "14:56:21", event: "react_cycle_complete", message: l("Run #1 completed with baseline report.", "Run #1 completed with baseline report.") },
    ],
  },
];

const datasetPreviewRows = [
  ["BsAb_001", "8.134", "16.298", "ScFv-Fc", "mid-stalk", "membrane-proximal"],
  ["BsAb_002", "3.797", "2.976", "IgG-like", "distal", "distal"],
  ["BsAb_003", "9.750", "30.048", "IgG-like", "mid-stalk", "membrane-proximal"],
  ["BsAb_004", "27.782", "1.819", "DVD-Ig", "mid-stalk", "mid-stalk"],
  ["BsAb_005", "3.384", "13.288", "Fab-Fc", "distal", "mid-stalk"],
  ["BsAb_006", "3.384", "66.053", "Fab-Fc", "mid-stalk", "distal"],
];

const statusStyles: Record<StepStatus, { icon: string }> = {
  done: {
    icon: "border-[rgba(23,36,216,0.12)] bg-[rgba(23,36,216,0.08)] text-[#161FAD]",
  },
  running: {
    icon: "border-[rgba(255,201,151,0.45)] bg-[rgba(255,201,151,0.2)] text-[#8a5216]",
  },
  waiting: {
    icon: "border-slate-200 bg-slate-100 text-slate-500",
  },
  failed: {
    icon: "border-[rgba(220,38,38,0.16)] bg-[rgba(220,38,38,0.1)] text-red-600",
  },
};

const runningStepDurationsMs = [1400, 1500, 1600, 1700, 1800];

const createRuntimeSteps = (steps: PlanStep[]): PlanStep[] =>
  steps.map((step, index): PlanStep => ({
    ...step,
    status: index === 0 ? "running" : "waiting",
  }));

const copy = {
  zh: {
    platformSubtitle: "AILUX AGENT",
    newConversation: "新任务",
    tasksLabel: "任务列表",
    signedInRole: "已登录 · 项目成员",
    userCenter: "用户中心",
    networkDiagnostic: "网络检测工具",
    switchLanguage: "切换语言",
    switchLanguageHint: "切换到 English",
    logout: "退出登录",
    comingSoon: "该功能将在后续版本接入",
    switchedToEnglish: "已切换为 English 模式",
    switchedToChinese: "已切换为中文模式",
    naturalLanguageTask: "自然语言发起任务",
    newTaskTitle: "从目标描述开始，让 Agent 帮你完成模型、工具和执行流程的组织。",
    newTaskBody:
      "当前界面处于新任务工作态。中间区不展示旧任务内容，右侧也不会带入历史计划与结果。你可以直接输入研究目标，或先上传 CSV、PDB 等文件，再由 Agent 自动生成可追踪的执行路径。",
    recommendedTasks: "推荐任务",
    newTaskPlaceholder: "描述你的目标，或上传数据后提问…",
    uploadFile: "上传文件",
    resourceReference: "@ 资源",
    attachUploadTitle: "上传本地数据",
    attachUploadBody: "选择本地文件或文件夹，作为本轮 Agent 任务的新输入。",
    attachResourceTitle: "引用已有资源",
    attachResourceBody: "从项目数据或全局资源中选择已有数据，作为本轮 Agent 任务的上下文。",
    localFiles: "本地文件",
    localFolder: "本地文件夹",
    projectData: "项目数据",
    globalData: "全局资源",
    publicData: "公共数据",
    skills: "Skill",
    templates: "模版",
    searchResources: "搜索资源",
    chooseFiles: "选择文件",
    chooseFolder: "选择文件夹",
    selectedInputs: "已选择输入",
    noProjectData: "当前项目暂无数据集",
    addToTask: "添加到任务",
    attachedContext: "已添加上下文数据",
    send: "发送",
    conversation: "聊天",
    runningTitle: "内化预测建模工作流程",
    runningPlaceholder: "继续向 Agent 追问，例如：请解释为什么共定位评分是最高贡献特征。",
    fileTabHint: "从右侧结果文件列表打开一个文件后，会在这里显示当前文件标签。",
    noOpenedFile:
      "当前未打开任何结果文件。请从最右侧结果文件列表选择需要查看的文件，系统会在此区域展示对应预览，同时左侧对话区保持可追问。",
    closeFile: "关闭",
    downloadFile: "下载文件",
    saveToProjectData: "保存到项目数据",
    save: "保存",
    savedToProjectData: "已保存到项目数据",
    alreadyInProjectData: "项目数据中已存在",
    tableFooter: "仅展示前 100 行。下载文件可查看完整数据。",
    modelSummary: "模型比较摘要",
    conclusion: "结论建议",
    conclusionBody:
      "请重点关注以下 4 项关键指标：\ntest_r2_mean：越高说明模型回归拟合效果越好\ntest_spearman_mean：越高说明模型对结果的排名预测越准确\ntest_mse_mean：越低说明模型的预测误差越小\ntest_pearson_mean：越高说明模型预测值与真实值的线性相关性越强",
    finalSummaryTitle: "最终总结",
    finalSummaryBody:
      "在 216 种模型组合（结构模型×表位×特征集×算法）中，测试皮尔逊相关性排名前 5 的均超过0.824，证实内化活性具有稳健的可预测性。",
    finalSummaryOutcome:
      "请根据决策场景选择配置。若追求最高预测准确率，优先选择 XtalFold Ultra + 科学家推荐表位 + 完整特征集 + Algorithm1（Pearson 0.854）。当你更看重排序一致性时——例如早期筛选中的命中优先级排序——可使用 XtalFold Standard + 代理选择的前10个表位 + 物理与能量特征 + 双特异性抗体特征 + Algorithm2（Spearman 0.949）；同时，该方案的特征占用也更精简。",
    workflowRunningLabel: "工作流运行中",
    workflowRunningFallback: "系统正在按计划推进分析步骤，完成后将在此处追加最终总结。",
    chartCaption: "示意图：关键特征贡献或相关性结果预览。",
    imageSummary: "图像结果摘要",
    imageSummaryBullets: [
      "靶点共定位评分在高内吞组中显著更高。",
      "KD 过高时内吞率显著下降，呈现负相关趋势。",
      "连接区柔性在中等区间时，模型表现更稳定。",
    ],
    plan: "计划",
    results: "结果",
    reports: "报告",
    history: "历史记录",
    waitingPlan: "等待生成计划",
    waitingPlanBody: "首条消息发送成功后，右侧会生成当前任务对应的步骤计划、进度条和每一步的执行摘要。当前新任务态不会展示旧任务数据。",
    overallProgress: "整体进度",
    emptyResults: "暂无结果文件",
    emptyResultsBody: "当任务启动后，系统会按步骤将数据集、图像、日志、JSON 汇总等文件增量写入当前任务的结果区，并支持按文件名搜索。",
    currentRun: "当前 Run",
    currentRunLabel: "当前 Run · Run #3",
    currentRunHint: "默认展示最新一轮结果，旧轮次收起到下方文件夹。",
    previousRuns: "历史轮次",
    previousRunsHint: "同一会话内较早的结果轮次，展开后可快速找回半小时前的文件。",
    filesCount: "个文件",
    completedStatus: "已完成",
    openRunFiles: "展开文件",
    collapseRunFiles: "收起文件",
    finalReports: "最终报告",
    finalReportsHint: "每轮计划完成后生成的最终报告，可打开查看完整章节内容。",
    viewReport: "查看报告",
    reportReaderHint: "报告阅读提示",
    reportReaderBody: "结构特征计算已经完成；当前模型表现受 demo 样本量和标签分布限制，不应过度解读模型指标。",
    exportSelected: "导出所选",
    searchFiles: "搜索文件",
    noMatchedResults: "没有匹配的结果文件，请尝试其他关键词。",
    selectFile: "选择",
    batchDownload: "批量下载",
    batchSave: "批量保存",
    selectedCount: "已选择",
    download: "下载",
    downloading: "已开始下载",
    downloadedFiles: "已下载",
    selectBeforeExport: "请先选择需要导出的文件",
    exportedFiles: "已导出",
    savedFilesToProject: "已保存到项目数据",
    exportedSuffix: "个文件",
    runHistoryTitle: "Run / Plan 版本历史",
    runHistoryBody: "当前任务内每次确认 Plan、重跑或 HITL 分支都会生成不可变 Run 快照。",
    historySnapshot: "快照详情",
    historyCompare: "对比变化",
    historySteps: "计划步骤",
    historyFiles: "关联文件",
    historyLogs: "关键日志",
    inputs: "输入",
    outputs: "输出",
    flowGraph: "流程图",
    flowGraphTitle: "执行流程图",
    flowGraphHint: "节点状态与右侧 Plan 保持同步，用于查看步骤依赖、执行线路和当前运行位置。",
    mermaidSource: "Mermaid 流程源",
    currentStep: "当前节点",
    statusDone: "已完成",
    statusRunning: "运行中",
    statusWaiting: "等待中",
  },
  en: {
    platformSubtitle: "AILUX AGENT",
    newConversation: "New task",
    tasksLabel: "Task list",
    signedInRole: "Signed in · Project member",
    userCenter: "User center",
    networkDiagnostic: "Network diagnostics",
    switchLanguage: "Switch language",
    switchLanguageHint: "Switch to 中文",
    logout: "Log out",
    comingSoon: "This feature will be connected in a later version.",
    switchedToEnglish: "Switched to English mode",
    switchedToChinese: "Switched to Chinese mode",
    naturalLanguageTask: "Natural-language task kickoff",
    newTaskTitle: "Start from the goal, and let the agent organize models, tools, and execution flow for you.",
    newTaskBody:
      "The workspace is in a new-task state. The center column does not show previous conversations, and the right panel does not carry over historical plans or files. You can enter a research objective directly or upload CSV and PDB files first, then let the agent generate a traceable execution path.",
    recommendedTasks: "Suggested tasks",
    newTaskPlaceholder: "Describe your goal, or upload files and ask a question…",
    uploadFile: "Upload file",
    resourceReference: "@ Resources",
    attachUploadTitle: "Upload local data",
    attachUploadBody: "Choose local files or folders as new input for this agent task.",
    attachResourceTitle: "Reference existing resources",
    attachResourceBody: "Select existing project data or global resources as context for this agent task.",
    localFiles: "Local files",
    localFolder: "Local folder",
    projectData: "Project data",
    globalData: "Global resources",
    publicData: "Public data",
    skills: "Skills",
    templates: "Templates",
    searchResources: "Search resources",
    chooseFiles: "Choose files",
    chooseFolder: "Choose folder",
    selectedInputs: "Selected inputs",
    noProjectData: "No datasets in the current project",
    addToTask: "Add to task",
    attachedContext: "Context data added",
    send: "Send",
    conversation: "Chat",
    runningTitle: "Internalization Predictive Modeling Workflow",
    runningPlaceholder: "Ask a follow-up, for example: explain why target colocalization is the top contributing feature.",
    fileTabHint: "When you open a file from the right-side results list, its tab will appear here.",
    noOpenedFile:
      "No result file is currently open. Choose a file from the right-side results list to preview it here while keeping the conversation available on the left.",
    closeFile: "Close",
    downloadFile: "Download file",
    saveToProjectData: "Save to project data",
    save: "Save",
    savedToProjectData: "Saved to project data",
    alreadyInProjectData: "Already exists in project data",
    tableFooter: "Showing the first 100 rows only. Download the file to inspect the full dataset.",
    modelSummary: "Model comparison summary",
    conclusion: "Recommendation",
    conclusionBody:
      "Please focus on these 4 key metrics:\ntest_r2_mean: higher values indicate better regression fit\ntest_spearman_mean: higher values indicate more accurate ranking predictions\ntest_mse_mean: lower values indicate smaller prediction errors\ntest_pearson_mean: higher values indicate a stronger linear correlation between predicted and true values",
    finalSummaryTitle: "Final summary",
    finalSummaryBody:
      "Across 216 model combinations (structure model × epitope × feature set × algorithm), the top 5 by test Pearson all score above 0.824, confirming that internalization activity is robustly predictable.",
    finalSummaryOutcome:
      "Choose configuration by decision context. For maximum prediction accuracy, prioritize XtalFold Ultra + Scientist-Recommended epitopes + full feature set + Algorithm1 (Pearson 0.854). When rank consistency matters more — e.g., hit-prioritization in early screening — use XtalFold Standard + Agent-Selected top10 epitopes + Physical & Energy features & bispecific Ab features + Algorithm2 (Spearman 0.949), which also offers a leaner feature footprint.",
    workflowRunningLabel: "Workflow running",
    workflowRunningFallback: "The system is advancing the plan step by step and will append the final summary here when all stages are complete.",
    chartCaption: "Illustration: preview of key feature contribution or correlation findings.",
    imageSummary: "Image result summary",
    imageSummaryBullets: [
      "Target colocalization is clearly higher in the high-endocytosis group.",
      "When KD becomes too large, endocytosis drops and shows a negative trend.",
      "Medium linker flexibility yields more stable model performance.",
    ],
    plan: "Plan",
    results: "Results",
    reports: "Reports",
    history: "History",
    waitingPlan: "Plan pending",
    waitingPlanBody:
      "After the first message is sent, the right panel will generate a step-by-step plan, progress indicator, and execution summaries. Historical task data stays hidden in the new-task state.",
    overallProgress: "Overall progress",
    emptyResults: "No result files yet",
    emptyResultsBody:
      "Once the task starts, datasets, charts, logs, and JSON summaries will be written incrementally into the current result area and remain searchable by filename.",
    currentRun: "Current run",
    currentRunLabel: "Current run · Run #3",
    currentRunHint: "The latest run is shown by default, while older runs stay folded below.",
    previousRuns: "Previous runs",
    previousRunsHint: "Earlier result rounds in this conversation. Expand to retrieve files from the last half hour.",
    filesCount: "files",
    completedStatus: "Completed",
    openRunFiles: "Show files",
    collapseRunFiles: "Hide files",
    finalReports: "Final reports",
    finalReportsHint: "Final reports generated after each completed plan round. Open one to inspect full sections.",
    viewReport: "View report",
    reportReaderHint: "Report reading note",
    reportReaderBody: "Structural feature calculation is complete; model performance is limited by demo sample size and label distribution, so metrics should not be over-interpreted.",
    exportSelected: "Export selected",
    searchFiles: "Search files",
    noMatchedResults: "No result files match your query. Try another keyword.",
    selectFile: "Select",
    batchDownload: "Download",
    batchSave: "Save",
    selectedCount: "Selected",
    download: "Download",
    downloading: "Started downloading",
    downloadedFiles: "Downloaded",
    selectBeforeExport: "Please select files to export first",
    exportedFiles: "Exported",
    savedFilesToProject: "Saved to project data",
    exportedSuffix: "files",
    runHistoryTitle: "Run / Plan version history",
    runHistoryBody: "Every confirmed plan, rerun, or HITL branch in the current task creates an immutable run snapshot.",
    historySnapshot: "Snapshot details",
    historyCompare: "Diff",
    historySteps: "Plan steps",
    historyFiles: "Files",
    historyLogs: "Key logs",
    inputs: "Inputs",
    outputs: "Outputs",
    flowGraph: "Flow",
    flowGraphTitle: "Execution flow",
    flowGraphHint: "Node status stays synced with the Plan, showing dependencies, route, and the current running step.",
    mermaidSource: "Mermaid source",
    currentStep: "Current node",
    statusDone: "Done",
    statusRunning: "Running",
    statusWaiting: "Waiting",
  },
} as const;

function ResultTypeIcon({ type }: { type: ResultType }) {
  if (type === "csv") return <Database className="h-4 w-4" />;
  if (type === "json") return <FileJson className="h-4 w-4" />;
  if (type === "xlsx") return <FileSpreadsheet className="h-4 w-4" />;
  if (type === "pdb") return <FlaskConical className="h-4 w-4" />;
  return <FileText className="h-4 w-4" />;
}

function getFilePayload(file: ResultFile, lang: Lang) {
  if (file.type === "pdb") {
    return {
      mime: "chemical/x-pdb;charset=utf-8",
      content: demoPdbContent,
    };
  }

  if (file.type === "csv") {
    return {
      mime: "text/csv;charset=utf-8",
      content: [
        ["sample_id", "KD_arm1_nM", "KD_arm2_nM", "antibody_format", "epitope_pos_A", "epitope_pos_B"].join(","),
        ...datasetPreviewRows.map((row) => row.join(",")),
      ].join("\n"),
    };
  }

  if (file.type === "json") {
    return {
      mime: "application/json;charset=utf-8",
      content: JSON.stringify(
        {
          best_model: "XGBoost",
          top_features: ["target_colocalization", "KD_arm1_nM", "linker_flexibility"],
          r2: 0.72,
          rmse: 0.106,
        },
        null,
        2,
      ),
    };
  }

  if (file.type === "xlsx") {
    return {
      mime: "text/plain;charset=utf-8",
      content: "Model\tR2\tRMSE\nXGBoost\t0.72\t0.106\nRandom Forest\t0.69\t0.118\nSVM\t0.64\t0.131",
    };
  }

  return {
    mime: "text/plain;charset=utf-8",
    content:
      lang === "zh"
        ? `${file.name}\n\n该原型以示意内容展示图像结果，可在后续接入真实图片下载地址。`
        : `${file.name}\n\nThis prototype shows an illustrative image result. A real image download URL can be connected later.`,
  };
}

function downloadResultFile(file: ResultFile, lang: Lang) {
  const payload = getFilePayload(file, lang);
  const blob = new Blob([payload.content], { type: payload.mime });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = file.name;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

function getReportPayload(report: RunReport, lang: Lang) {
  return {
    mime: "text/plain;charset=utf-8",
    content: [
      pick(lang, report.title),
      "",
      pick(lang, report.summary),
      "",
      ...report.sections.flatMap((section) => [
        `## ${pick(lang, section.title)}`,
        pick(lang, section.summary),
        ...section.items.map((item) => `${pick(lang, item.label)}: ${item.value} - ${pick(lang, item.detail)}`),
        "",
      ]),
    ].join("\n"),
  };
}

function downloadReportFile(report: RunReport, lang: Lang) {
  const payload = getReportPayload(report, lang);
  const blob = new Blob([payload.content], { type: payload.mime });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = report.fileName;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

function resultTypeFromFileName(fileName: string): ResultType {
  const normalized = fileName.toLowerCase();
  if (normalized.endsWith(".pdb")) return "pdb";
  if (normalized.endsWith(".json")) return "json";
  if (normalized.endsWith(".png")) return "png";
  if (normalized.endsWith(".xlsx")) return "xlsx";
  if (normalized.endsWith(".docx")) return "docx";
  return "csv";
}

function resultFileFromHistoryFile(run: HistoryRunItem, file: HistoryRunItem["files"][number]): ResultFile {
  return {
    id: `${run.id}-${file.name}`,
    name: file.name,
    meta: file.meta,
    step: run.title,
    type: resultTypeFromFileName(file.name),
  };
}

function dataAssetTypeFromResult(type: ResultType): ProjectDataAsset["type"] {
  if (type === "docx") return "docx";
  return type;
}

function dataAssetFromResultFile(file: ResultFile): Omit<ProjectDataAsset, "id" | "source" | "updatedAt"> {
  return {
    name: file.name,
    type: dataAssetTypeFromResult(file.type),
    size: file.type === "pdb" ? "2.4 MB" : file.type === "png" ? "320 KB" : file.type === "docx" ? "1.2 MB" : "128 KB",
    tags: ["run-output"],
  };
}

function dataAssetFromReport(report: RunReport): Omit<ProjectDataAsset, "id" | "source" | "updatedAt"> {
  return {
    name: report.fileName,
    type: "docx",
    size: "1.2 MB",
    tags: ["report", report.runId],
  };
}

function UserMenu({ lang, onAction }: { lang: Lang; onAction: (action: "profile" | "network" | "language" | "logout") => void }) {
  const text = copy[lang];

  return (
    <div className="absolute bottom-[calc(100%+12px)] left-0 z-30 w-[218px] rounded-[20px] border border-slate-200 bg-white/96 p-2 shadow-[0_24px_60px_rgba(15,23,42,0.14)] backdrop-blur">
      <button
        onClick={() => onAction("profile")}
        className="flex w-full items-center gap-3 rounded-[14px] px-3 py-3 text-left text-[13px] font-medium text-slate-700 transition hover:bg-slate-50 hover:text-[#161FAD]"
      >
        <UserCircle2 className="h-4 w-4" />
        {text.userCenter}
      </button>

      <button
        onClick={() => onAction("language")}
        className="flex w-full items-center gap-3 rounded-[14px] px-3 py-3 text-left text-[13px] font-medium text-slate-700 transition hover:bg-[rgba(23,36,216,0.06)] hover:text-[#161FAD]"
      >
        <Globe2 className="h-4 w-4" />
        <div>
          <p>{text.switchLanguage}</p>
          <p className="mt-0.5 text-[11px] font-normal text-slate-400">{text.switchLanguageHint}</p>
        </div>
      </button>
      <div className="my-1 h-px bg-slate-100" />
      <button
        onClick={() => onAction("logout")}
        className="flex w-full items-center justify-center gap-2 rounded-[14px] px-3 py-3 text-[13px] font-medium text-slate-500 transition hover:bg-slate-50 hover:text-slate-700"
      >
        <LogOut className="h-4 w-4" />
        {text.logout}
      </button>
    </div>
  );
}

type AttachedInput = {
  id: string;
  name: string;
  source: "local-file" | "local-folder" | "project-data" | "public-data" | "skill" | "template";
  meta: string;
};

const attachedSourceStyle: Record<AttachedInput["source"], string> = {
  "local-file": "border-blue-100 bg-blue-50 text-[#161FAD]",
  "local-folder": "border-blue-100 bg-blue-50 text-[#161FAD]",
  "project-data": "border-emerald-100 bg-emerald-50 text-emerald-700",
  "public-data": "border-amber-100 bg-amber-50 text-amber-700",
  skill: "border-violet-100 bg-violet-50 text-violet-700",
  template: "border-sky-100 bg-sky-50 text-sky-700",
};

function attachedSourceLabel(source: AttachedInput["source"], lang: Lang) {
  const zh: Record<AttachedInput["source"], string> = {
    "local-file": "文件",
    "local-folder": "文件夹",
    "project-data": "项目数据",
    "public-data": "公共数据",
    skill: "Skill",
    template: "模版",
  };
  const en: Record<AttachedInput["source"], string> = {
    "local-file": "File",
    "local-folder": "Folder",
    "project-data": "Project",
    "public-data": "Public",
    skill: "Skill",
    template: "Template",
  };
  return lang === "zh" ? zh[source] : en[source];
}

function AttachDataDialog({
  lang,
  open,
  projectData,
  variant,
  onAttach,
  onOpenChange,
}: {
  lang: Lang;
  open: boolean;
  projectData: ProjectDataAsset[];
  variant: "upload" | "resource";
  onAttach: (items: AttachedInput[]) => void;
  onOpenChange: (open: boolean) => void;
}) {
  const text = copy[lang];
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const folderInputRef = useRef<HTMLInputElement | null>(null);
  const [activeTab, setActiveTab] = useState<AttachedInput["source"]>(variant === "upload" ? "local-file" : "project-data");
  const [resourceQuery, setResourceQuery] = useState("");
  const [localFiles, setLocalFiles] = useState<AttachedInput[]>([]);
  const [localFolders, setLocalFolders] = useState<AttachedInput[]>([]);
  const [selectedProjectIds, setSelectedProjectIds] = useState<string[]>([]);
  const [selectedPublicIds, setSelectedPublicIds] = useState<string[]>([]);
  const [selectedSkillIds, setSelectedSkillIds] = useState<string[]>([]);
  const [selectedTemplateIds, setSelectedTemplateIds] = useState<string[]>([]);
  const normalizedResourceQuery = resourceQuery.trim().toLowerCase();
  const filteredProjectData = projectData.filter((asset) =>
    `${asset.name} ${asset.type} ${asset.tags?.join(" ") ?? ""}`.toLowerCase().includes(normalizedResourceQuery),
  );
  const filteredPublicData = PUBLIC_DATA.filter((item) =>
    `${item.name} ${item.desc} ${item.category} ${item.tags.join(" ")}`.toLowerCase().includes(normalizedResourceQuery),
  );
  const filteredSkills = SKILLS.filter((item) =>
    `${item.name} ${item.skillId} ${item.desc} ${item.category} ${item.ability} ${item.tags.join(" ")}`.toLowerCase().includes(normalizedResourceQuery),
  );
  const filteredTemplates = TEMPLATES.filter((item) =>
    `${item.name} ${item.desc} ${item.category} ${item.type}`.toLowerCase().includes(normalizedResourceQuery),
  );

  const projectItems: AttachedInput[] = projectData
    .filter((asset) => selectedProjectIds.includes(asset.id))
    .map((asset) => ({
      id: `project-data-${asset.id}`,
      name: asset.name,
      source: "project-data",
      meta: `${asset.type.toUpperCase()} · ${asset.size}`,
    }));
  const publicItems: AttachedInput[] = PUBLIC_DATA
    .filter((item) => selectedPublicIds.includes(item.id))
    .map((item) => ({
      id: `public-data-${item.id}`,
      name: item.name,
      source: "public-data",
      meta: `${item.category} · ${item.size}`,
    }));
  const skillItems: AttachedInput[] = SKILLS
    .filter((item) => selectedSkillIds.includes(item.id))
    .map((item) => ({
      id: `skill-${item.id}`,
      name: item.name,
      source: "skill",
      meta: `${item.category} · ${item.ability}`,
    }));
  const templateItems: AttachedInput[] = TEMPLATES
    .filter((item) => selectedTemplateIds.includes(item.id))
    .map((item) => ({
      id: `template-${item.id}`,
      name: item.name,
      source: "template",
      meta: `${item.category} · ${item.steps} steps`,
    }));
  const selectedItems = variant === "upload" ? [...localFiles, ...localFolders] : [...projectItems, ...publicItems, ...skillItems, ...templateItems];

  const toggleSelected = (id: string, selectedIds: string[], setSelectedIds: (ids: string[]) => void) => {
    setSelectedIds(selectedIds.includes(id) ? selectedIds.filter((item) => item !== id) : [...selectedIds, id]);
  };

  const handleFolderClick = () => {
    const input = folderInputRef.current;
    if (!input) return;
    input.setAttribute("webkitdirectory", "");
    input.setAttribute("directory", "");
    input.click();
  };

  const handleAttach = () => {
    if (selectedItems.length === 0) {
      toast.message(lang === "zh" ? "请先选择至少一个输入" : "Select at least one input first");
      return;
    }
    onAttach(selectedItems);
    onOpenChange(false);
  };

  const tabs: { id: AttachedInput["source"]; label: string }[] =
    variant === "upload"
      ? [
          { id: "local-file", label: text.localFiles },
          { id: "local-folder", label: text.localFolder },
        ]
      : [
          { id: "project-data", label: text.projectData },
          { id: "public-data", label: text.publicData },
          { id: "skill", label: text.skills },
          { id: "template", label: text.templates },
        ];
  const tabCount = (id: AttachedInput["source"]) => {
    if (id === "local-file") return localFiles.length;
    if (id === "local-folder") return localFolders.length;
    if (id === "project-data") return filteredProjectData.length;
    if (id === "public-data") return filteredPublicData.length;
    if (id === "skill") return filteredSkills.length;
    return filteredTemplates.length;
  };
  const selectedTabCount = (id: AttachedInput["source"]) => {
    if (id === "local-file") return localFiles.length;
    if (id === "local-folder") return localFolders.length;
    if (id === "project-data") return selectedProjectIds.length;
    if (id === "public-data") return selectedPublicIds.length;
    if (id === "skill") return selectedSkillIds.length;
    return selectedTemplateIds.length;
  };
  const activeTabLabel = tabs.find((tab) => tab.id === activeTab)?.label ?? "";

  useEffect(() => {
    if (open) {
      setActiveTab(variant === "upload" ? "local-file" : "project-data");
    }
  }, [open, variant]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[min(780px,calc(100vh-40px))] overflow-hidden rounded-[24px] border-white/70 bg-white p-0 shadow-[0_24px_80px_rgba(15,23,42,0.18)] sm:max-w-[1080px]">
        <DialogHeader className="border-b border-slate-100 px-5 py-4">
          <DialogTitle className="text-[15px] font-semibold text-[#070261]">
            {variant === "upload" ? text.attachUploadTitle : text.attachResourceTitle}
          </DialogTitle>
          <p className="mt-1 text-[12px] leading-5 text-slate-500">
            {variant === "upload" ? text.attachUploadBody : text.attachResourceBody}
          </p>
        </DialogHeader>

        <div className="grid h-[640px] min-h-0 grid-cols-[220px_minmax(0,1fr)]">
          <aside className="flex min-h-0 flex-col border-r border-slate-100 bg-slate-50/70 p-3">
            <div className="mb-3 rounded-[14px] border border-slate-100 bg-white px-3 py-2">
              <p className="text-[10px] font-semibold uppercase tracking-[0.08em] text-slate-400">
                {variant === "upload" ? (lang === "zh" ? "上传来源" : "Upload Sources") : (lang === "zh" ? "资源类型" : "Resource Types")}
              </p>
            </div>
            <div className="min-h-0 space-y-1 overflow-y-auto">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex w-full items-center gap-2 rounded-xl px-3 py-2.5 text-left text-[12px] font-medium transition ${
                    activeTab === tab.id ? "bg-white text-[#161FAD] shadow-sm ring-1 ring-[#161FAD]/10" : "text-slate-500 hover:bg-white/70 hover:text-slate-700"
                  }`}
                >
                  <span className="min-w-0 flex-1 truncate">{tab.label}</span>
                  {selectedTabCount(tab.id) > 0 ? (
                    <span className="rounded-full bg-[#161FAD] px-1.5 py-0.5 text-[9px] font-semibold text-white">
                      {selectedTabCount(tab.id)}
                    </span>
                  ) : null}
                  <span className="rounded-full bg-slate-100 px-1.5 py-0.5 text-[9px] font-medium text-slate-400">
                    {tabCount(tab.id)}
                  </span>
                </button>
              ))}
            </div>
          </aside>

          <div className="flex min-h-0 flex-col">
            <div className="flex shrink-0 items-center justify-between gap-3 border-b border-slate-100 bg-white/90 px-5 py-3">
              <div className="min-w-0">
                <p className="text-[13px] font-semibold text-slate-700">{activeTabLabel}</p>
              </div>
              {variant === "resource" ? (
                <div className="flex w-full max-w-[330px] items-center gap-2 rounded-[12px] border border-slate-200 bg-white px-3 py-2 shadow-sm">
                  <Search className="h-3.5 w-3.5 shrink-0 text-slate-400" />
                  <input
                    value={resourceQuery}
                    onChange={(event) => setResourceQuery(event.target.value)}
                    className="min-w-0 flex-1 bg-transparent text-[12px] text-slate-700 outline-none placeholder:text-slate-400"
                    placeholder={text.searchResources}
                  />
                </div>
              ) : null}
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto p-5">

              {activeTab === "local-file" ? (
                <div className="space-y-4">
                  <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    className="hidden"
                    onChange={(event) => {
                      const files = Array.from(event.target.files ?? []);
                      setLocalFiles(
                        files.map((file, index) => ({
                          id: `local-file-${file.name}-${index}`,
                          name: file.name,
                          source: "local-file",
                          meta: `${Math.max(1, Math.round(file.size / 1024))} KB`,
                        })),
                      );
                    }}
                  />
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="flex w-full flex-col items-center justify-center rounded-[18px] border border-dashed border-slate-200 bg-slate-50/70 px-5 py-10 text-center transition hover:border-[rgba(23,36,216,0.24)] hover:bg-[rgba(23,36,216,0.03)]"
                  >
                    <Upload className="mb-3 h-8 w-8 text-[#161FAD]" />
                    <span className="text-[13px] font-semibold text-slate-700">{text.chooseFiles}</span>
                    <span className="mt-1 text-[11px] text-slate-400">CSV / PDB / XLSX / JSON / PDF</span>
                  </button>
                </div>
              ) : null}

              {activeTab === "local-folder" ? (
                <div className="space-y-4">
                  <input
                    ref={folderInputRef}
                    type="file"
                    multiple
                    className="hidden"
                    onChange={(event) => {
                      const files = Array.from(event.target.files ?? []);
                      const firstFile = files[0] as (File & { webkitRelativePath?: string }) | undefined;
                      const folderName = firstFile?.webkitRelativePath?.split("/")[0] || (lang === "zh" ? "本地文件夹" : "Local folder");
                      setLocalFolders(
                        files.length
                          ? [
                              {
                                id: `local-folder-${folderName}`,
                                name: folderName,
                                source: "local-folder",
                                meta: lang === "zh" ? `${files.length} 个文件` : `${files.length} files`,
                              },
                            ]
                          : [],
                      );
                    }}
                  />
                  <button
                    onClick={handleFolderClick}
                    className="flex w-full flex-col items-center justify-center rounded-[18px] border border-dashed border-slate-200 bg-slate-50/70 px-5 py-10 text-center transition hover:border-[rgba(23,36,216,0.24)] hover:bg-[rgba(23,36,216,0.03)]"
                  >
                    <FolderOpen className="mb-3 h-8 w-8 text-[#161FAD]" />
                    <span className="text-[13px] font-semibold text-slate-700">{text.chooseFolder}</span>
                    <span className="mt-1 text-[11px] text-slate-400">{lang === "zh" ? "用于批量输入数据目录" : "Use a data directory as batch input"}</span>
                  </button>
                </div>
              ) : null}

              {activeTab === "project-data" ? (
                <div className="grid grid-cols-2 gap-2.5">
                  {filteredProjectData.length === 0 ? (
                    <div className="col-span-2 rounded-[18px] border border-dashed border-slate-200 bg-slate-50/70 px-4 py-10 text-center text-[13px] text-slate-400">
                      {text.noProjectData}
                    </div>
                  ) : (
                    filteredProjectData.map((asset) => (
                      <button
                        key={asset.id}
                        onClick={() => toggleSelected(asset.id, selectedProjectIds, setSelectedProjectIds)}
                        className={`flex w-full items-center gap-3 rounded-[14px] border px-3 py-2.5 text-left transition hover:bg-white ${
                          selectedProjectIds.includes(asset.id) ? "border-[#161FAD]/20 bg-white shadow-sm" : "border-slate-100 bg-slate-50/80"
                        }`}
                      >
                        <Checkbox checked={selectedProjectIds.includes(asset.id)} />
                        <Database className="h-4 w-4 text-[#161FAD]" />
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-[12px] font-semibold text-slate-800">{asset.name}</p>
                          <p className="mt-0.5 text-[10px] text-slate-400">{asset.type.toUpperCase()} · {asset.size}</p>
                        </div>
                      </button>
                    ))
                  )}
                </div>
              ) : null}

              {activeTab === "public-data" ? (
                <div className="grid grid-cols-2 gap-2.5">
                  {filteredPublicData.length === 0 ? (
                    <div className="col-span-2 rounded-[18px] border border-dashed border-slate-200 bg-slate-50/70 px-4 py-10 text-center text-[13px] text-slate-400">
                      {lang === "zh" ? "没有匹配的公共数据" : "No matching public data"}
                    </div>
                  ) : (
                    filteredPublicData.map((item) => (
                      <button
                        key={item.id}
                        onClick={() => toggleSelected(item.id, selectedPublicIds, setSelectedPublicIds)}
                        className={`flex min-h-[88px] w-full items-start gap-3 rounded-[14px] border px-3 py-2.5 text-left transition hover:bg-white ${
                          selectedPublicIds.includes(item.id) ? "border-[#161FAD]/20 bg-white shadow-sm" : "border-slate-100 bg-slate-50/80"
                        }`}
                      >
                        <Checkbox checked={selectedPublicIds.includes(item.id)} />
                        <Globe2 className="mt-0.5 h-4 w-4 text-[#161FAD]" />
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-[12px] font-semibold text-slate-800">{item.name}</p>
                          <p className="mt-0.5 text-[10px] text-slate-400">{item.category} · {item.size}</p>
                          <p className="mt-1 line-clamp-1 text-[11px] text-slate-500">{item.desc}</p>
                        </div>
                      </button>
                    ))
                  )}
                </div>
              ) : null}

              {activeTab === "skill" ? (
                <div className="grid grid-cols-2 gap-2.5">
                  {filteredSkills.length === 0 ? (
                    <div className="col-span-2 rounded-[18px] border border-dashed border-slate-200 bg-slate-50/70 px-4 py-10 text-center text-[13px] text-slate-400">
                      {lang === "zh" ? "没有匹配的 Skill" : "No matching skills"}
                    </div>
                  ) : (
                    filteredSkills.map((item) => (
                      <button
                        key={item.id}
                        onClick={() => toggleSelected(item.id, selectedSkillIds, setSelectedSkillIds)}
                        className={`flex min-h-[112px] w-full items-start gap-3 rounded-[14px] border px-3 py-2.5 text-left transition hover:bg-white ${
                          selectedSkillIds.includes(item.id) ? "border-[#161FAD]/20 bg-white shadow-sm" : "border-slate-100 bg-slate-50/80"
                        }`}
                      >
                        <Checkbox checked={selectedSkillIds.includes(item.id)} />
                        <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-violet-50 text-violet-700">
                          <Zap className="h-4 w-4" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <p className="min-w-0 flex-1 truncate text-[12px] font-semibold text-slate-800">{item.name}</p>
                            <span className="shrink-0 rounded-full border border-slate-200 bg-white px-2 py-0.5 text-[10px] text-slate-500">{item.category}</span>
                          </div>
                          <p className="mt-1 line-clamp-2 text-[11px] leading-5 text-slate-500">{item.desc}</p>
                          <span className="mt-1.5 inline-flex rounded-full border border-violet-100 bg-violet-50 px-2 py-0.5 text-[10px] text-violet-700">{item.ability}</span>
                        </div>
                      </button>
                    ))
                  )}
                </div>
              ) : null}

              {activeTab === "template" ? (
                <div className="grid grid-cols-2 gap-2.5">
                  {filteredTemplates.length === 0 ? (
                    <div className="col-span-2 rounded-[18px] border border-dashed border-slate-200 bg-slate-50/70 px-4 py-10 text-center text-[13px] text-slate-400">
                      {lang === "zh" ? "没有匹配的模版" : "No matching templates"}
                    </div>
                  ) : (
                    filteredTemplates.map((item) => (
                      <button
                        key={item.id}
                        onClick={() => toggleSelected(item.id, selectedTemplateIds, setSelectedTemplateIds)}
                        className={`flex min-h-[92px] w-full items-start gap-3 rounded-[14px] border px-3 py-2.5 text-left transition hover:bg-white ${
                          selectedTemplateIds.includes(item.id) ? "border-[#161FAD]/20 bg-white shadow-sm" : "border-slate-100 bg-slate-50/80"
                        }`}
                      >
                        <Checkbox checked={selectedTemplateIds.includes(item.id)} />
                        <PanelRightOpen className="mt-0.5 h-4 w-4 text-[#161FAD]" />
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-[12px] font-semibold text-slate-800">{item.name}</p>
                          <p className="mt-0.5 text-[10px] text-slate-400">{item.category} · {lang === "zh" ? `${item.steps} 步` : `${item.steps} steps`}</p>
                          <p className="mt-1 line-clamp-1 text-[11px] text-slate-500">{item.desc}</p>
                        </div>
                      </button>
                    ))
                  )}
                </div>
              ) : null}
            </div>

            <div className="border-t border-slate-100 bg-slate-50/70 px-5 py-4">
              <div className="mb-2 flex items-center justify-between">
                <p className="text-[11px] font-semibold text-slate-500">{text.selectedInputs} · {selectedItems.length}</p>
              </div>
              <div className="mb-4 flex max-h-[58px] min-h-7 flex-wrap gap-1.5 overflow-y-auto">
                {selectedItems.slice(0, 6).map((item) => (
                  <span key={item.id} className={`rounded-full border px-2 py-1 text-[10px] ${attachedSourceStyle[item.source]}`}>
                    {attachedSourceLabel(item.source, lang)} · {item.name}
                  </span>
                ))}
                {selectedItems.length > 6 ? (
                  <span className="rounded-full bg-slate-200 px-2 py-1 text-[10px] text-slate-500">+{selectedItems.length - 6}</span>
                ) : null}
              </div>
              <div className="flex justify-end gap-2">
                <button
                  onClick={() => onOpenChange(false)}
                  className="rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-[12px] font-medium text-slate-500 transition hover:text-slate-700"
                >
                  {lang === "zh" ? "取消" : "Cancel"}
                </button>
                <button
                  onClick={handleAttach}
                  className="rounded-xl bg-[#161FAD] px-3.5 py-2 text-[12px] font-semibold text-white transition hover:bg-[#1724D8] active:scale-[0.97]"
                >
                  {text.addToTask}
                </button>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function AttachedContextChips({ items, lang, onRemove }: { items: AttachedInput[]; lang: Lang; onRemove: (id: string) => void }) {
  if (items.length === 0) return null;

  return (
    <div className="mt-2 flex flex-wrap gap-1.5 border-t border-slate-200 pt-2">
      {items.slice(0, 6).map((item) => (
        <span key={item.id} className={`group inline-flex max-w-[260px] items-center gap-1.5 rounded-full border py-1 pl-2 pr-1 text-[10px] ${attachedSourceStyle[item.source]}`}>
          <span className="shrink-0 font-medium">{attachedSourceLabel(item.source, lang)}</span>
          <span className="truncate text-slate-600">{item.name}</span>
          <button
            onClick={() => onRemove(item.id)}
            className="ml-0.5 rounded-full p-0.5 text-slate-400 transition hover:bg-white/70 hover:text-slate-700"
            aria-label={lang === "zh" ? `移除 ${item.name}` : `Remove ${item.name}`}
          >
            <X className="h-3 w-3" />
          </button>
        </span>
      ))}
      {items.length > 6 ? (
        <span className="rounded-full bg-slate-200 px-2 py-1 text-[10px] text-slate-500">+{items.length - 6}</span>
      ) : null}
    </div>
  );
}

function Sidebar({
  activeView,
  lang,
  userMenuOpen,
  onNewConversation,
  onToggleUserMenu,
  onUserMenuAction,
  collapsed = false,
}: {
  activeView: ViewMode;
  lang: Lang;
  userMenuOpen: boolean;
  onNewConversation: () => void;
  onToggleUserMenu: () => void;
  onUserMenuAction: (action: "profile" | "network" | "language" | "logout") => void;
  collapsed?: boolean;
}) {
  const text = copy[lang];
  const { mainView, setMainView, setResourceTab } = useProject();

  if (collapsed) {
    return (
      <aside className="flex h-full min-h-0 flex-col items-center rounded-[24px] border border-white/70 bg-white/84 p-3 shadow-[0_16px_40px_rgba(15,23,42,0.045)] backdrop-blur">
        <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-[18px] bg-white shadow-[0_10px_22px_rgba(22,31,173,0.18)]">
          <img src={PRODUCT_ICON_URL} alt="Ailux Agent" className="h-12 w-12 rounded-[18px]" />
        </div>

        <button
          onClick={onNewConversation}
          className="mb-3 flex h-11 w-11 items-center justify-center rounded-2xl border border-slate-200 bg-slate-50 text-slate-600 transition hover:border-[rgba(23,36,216,0.18)] hover:bg-white hover:text-[#161FAD]"
          aria-label={text.newConversation}
        >
          <Plus className="h-4 w-4" />
        </button>

        <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-2xl border border-slate-100 bg-slate-50/80 text-slate-400">
          <PanelRightOpen className="h-4 w-4" />
        </div>

        <div className="flex flex-1 flex-col items-center gap-2">
          {historyTasks
            .filter((task) => !task.isDraft)
            .map((task) => {
              const active = activeView !== "new" && task.id === "t1";
              const taskTitle = pick(lang, task.title);
              return (
                <button
                  key={task.id}
                  className={`flex h-12 w-12 items-center justify-center rounded-2xl border text-[11px] font-semibold transition ${
                    active
                      ? "border-[rgba(23,36,216,0.12)] bg-[linear-gradient(180deg,rgba(23,36,216,0.08),rgba(132,140,254,0.08))] text-[#161FAD] shadow-[0_12px_28px_rgba(23,36,216,0.08)]"
                      : "border-transparent bg-slate-50/80 text-slate-500 hover:border-slate-200 hover:bg-white"
                  }`}
                  aria-label={taskTitle}
                >
                  {taskTitle.slice(0, 2)}
                </button>
              );
            })}
        </div>

        <div className="relative mt-4">
          <button
            onClick={onToggleUserMenu}
            className="flex h-11 w-11 items-center justify-center rounded-2xl border border-slate-100 bg-slate-50/90 text-slate-400 transition hover:border-slate-200 hover:bg-white hover:text-[#161FAD]"
            aria-label={text.userCenter}
          >
            <UserCircle2 className="h-5 w-5" />
          </button>
          {userMenuOpen ? <UserMenu lang={lang} onAction={onUserMenuAction} /> : null}
        </div>
      </aside>
    );
  }

  return (
    <aside className="flex h-full min-h-0 flex-col rounded-[24px] border border-white/70 bg-white/84 p-4 shadow-[0_16px_40px_rgba(15,23,42,0.045)] backdrop-blur">
      {/* Global header: Ailux Agent branding */}
      <div className="mb-4 flex items-center gap-3 px-1 py-2">
        <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white shadow-[0_10px_22px_rgba(22,31,173,0.18)]">
          <img src={PRODUCT_ICON_URL} alt="Ailux Agent" className="h-10 w-10 rounded-2xl" />
        </div>
        <div>
          <p className="text-[15px] font-semibold uppercase tracking-[0.08em] text-[#070261]">{text.platformSubtitle}</p>
        </div>
      </div>

      {/* Global resources */}
      <button
        onClick={() => {
          setResourceTab("data");
          setMainView("resource");
        }}
        className={`mb-3 flex w-full items-center gap-3 rounded-[18px] border px-3.5 py-3 text-left transition active:scale-[0.98] ${
          mainView === "resource"
            ? "border-[rgba(23,36,216,0.14)] bg-[linear-gradient(180deg,rgba(23,36,216,0.07),rgba(132,140,254,0.07))] text-[#161FAD] shadow-[0_12px_28px_rgba(22,31,173,0.08)]"
            : "border-slate-100 bg-slate-50/80 text-slate-700 hover:border-[rgba(23,36,216,0.12)] hover:bg-[rgba(23,36,216,0.04)] hover:text-[#161FAD]"
        }`}
      >
        <Database className="h-4 w-4" />
        <div>
          <p className="text-[13px] font-semibold">{lang === "zh" ? "全局资源" : "Global resources"}</p>
          <p className="mt-0.5 text-[11px] opacity-70">{lang === "zh" ? "数据 · Skill · 模版" : "Data · Skills · Templates"}</p>
        </div>
      </button>

      <div className="mb-4">
        <p className="mb-2 px-1 text-[11px] uppercase tracking-[0.18em] text-slate-400">{lang === "zh" ? "项目" : "Projects"}</p>
        <ProjectSwitcher lang={lang} />
      </div>

      <button
        onClick={onNewConversation}
        className={`mb-3 flex w-full items-center gap-2 rounded-[18px] border px-3.5 py-3 text-left text-[13px] font-medium transition ${
          activeView === "new"
            ? "border-[rgba(23,36,216,0.12)] bg-[linear-gradient(180deg,rgba(23,36,216,0.08),rgba(132,140,254,0.08))] text-[#161FAD] shadow-[0_12px_28px_rgba(23,36,216,0.08)]"
            : "border-transparent bg-slate-50 text-slate-700 hover:border-slate-200 hover:bg-white"
        }`}
      >
        <Plus className="h-4 w-4" />
        {text.newConversation}
      </button>

      {/* Tasks section */}
      <div className="mb-2 flex items-center justify-between">
        <h2 className="text-[13px] font-semibold text-slate-500">{text.tasksLabel}</h2>
        <button className="rounded-xl p-2 text-slate-400 transition hover:bg-slate-50 hover:text-[#161FAD] active:scale-[0.92]">
          <PanelRightOpen className="h-4 w-4" />
        </button>
      </div>

      <div className="min-h-0 flex-1 space-y-1.5 overflow-y-auto pr-1">
        {historyTasks.filter((task) => !task.isDraft).length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-[18px] border border-dashed border-slate-200 bg-slate-50/60 px-4 py-8 text-center">
            <div className="mb-2 flex h-9 w-9 items-center justify-center rounded-full bg-slate-100">
              <PanelRightOpen className="h-4 w-4 text-slate-400" />
            </div>
            <p className="text-[12px] font-medium text-slate-500">{lang === "zh" ? "暂无任务" : "No tasks yet"}</p>
            <p className="mt-1 text-[11px] text-slate-400">{lang === "zh" ? "新建对话后任务将显示在这里" : "Tasks will appear here"}</p>
          </div>
        ) : (
          historyTasks
            .filter((task) => !task.isDraft)
            .map((task) => {
              const active = activeView !== "new" && task.id === "t1";
              return (
                <button
                  key={task.id}
                  className={`group w-full rounded-[18px] border px-3.5 py-3 text-left transition duration-150 active:scale-[0.98] ${
                    active
                      ? "border-[rgba(23,36,216,0.12)] bg-[linear-gradient(180deg,rgba(23,36,216,0.08),rgba(132,140,254,0.08))] shadow-[0_12px_28px_rgba(23,36,216,0.08)]"
                      : "border-transparent bg-slate-50/80 hover:border-slate-200 hover:bg-white hover:shadow-[0_4px_12px_rgba(15,23,42,0.05)]"
                  }`}
                >
                  <p className={`truncate text-[13px] transition-colors ${
                    active ? "font-semibold text-[#070261]" : "font-medium text-slate-700 group-hover:text-[#070261]"
                  }`}>
                    {pick(lang, task.title)}
                  </p>
                  <p className="mt-1 text-[11px] text-slate-400">{pick(lang, task.meta)}</p>
                </button>
              );
            })
        )}
      </div>

      {/* User menu */}
      <div className="relative mt-4">
        <button
          onClick={onToggleUserMenu}
          className="flex w-full items-center gap-3 rounded-[18px] border border-slate-100 bg-slate-50/90 px-3 py-3 text-left transition hover:border-slate-200 hover:bg-white active:scale-[0.98]"
        >
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[linear-gradient(135deg,#161FAD_0%,#848CFE_100%)] text-[13px] font-bold text-white shadow-[0_4px_10px_rgba(22,31,173,0.22)]">
            C
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[13px] font-medium text-slate-700">Chen Lab</p>
            <p className="truncate text-[11px] text-slate-400">{text.signedInRole}</p>
          </div>
        </button>
        {userMenuOpen ? <UserMenu lang={lang} onAction={onUserMenuAction} /> : null}
      </div>
    </aside>
  );
}

function NewTaskWorkspace({
  attachedInputs,
  lang,
  prompt,
  onOpenResourceDialog,
  onOpenUploadDialog,
  onPromptChange,
  onPromptPick,
  onRemoveAttachedInput,
  onStart,
}: {
  attachedInputs: AttachedInput[];
  lang: Lang;
  prompt: string;
  onOpenResourceDialog: () => void;
  onOpenUploadDialog: () => void;
  onPromptChange: (value: string) => void;
  onPromptPick: (prompt: RecommendedPrompt) => void;
  onRemoveAttachedInput: (id: string) => void;
  onStart: () => void;
}) {
  const text = copy[lang];

  return (
    <section className="flex h-full min-h-0 flex-col rounded-[24px] border border-white/70 bg-white/84 shadow-[0_16px_40px_rgba(15,23,42,0.045)] backdrop-blur">
      <div className="flex min-h-0 flex-1 flex-col justify-between px-6 py-6">
        <div>
          <div className="rounded-[24px] border border-[rgba(23,36,216,0.08)] bg-[linear-gradient(180deg,rgba(248,250,255,0.98)_0%,rgba(236,241,255,0.95)_100%)] p-6 shadow-[inset_0_1px_0_rgba(255,255,255,0.8)]">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-[rgba(23,36,216,0.08)] px-3 py-1 text-[11px] font-medium text-[#161FAD]">
              <WandSparkles className="h-3.5 w-3.5" />
              {text.naturalLanguageTask}
            </div>
            <h3 className="text-[22px] font-semibold tracking-tight text-[#070261]">{text.newTaskTitle}</h3>
            <p className="mt-3 max-w-[720px] text-[13px] leading-6 text-slate-600">{text.newTaskBody}</p>
          </div>

          <div className="mt-6">
            <div className="mb-3 flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-[#161FAD]" />
              <p className="text-[13px] font-medium text-slate-700">{text.recommendedTasks}</p>
            </div>
            <div className="space-y-3">
              {recommendedPrompts.map((item) => (
                <button
                  key={`${item.id}-${pick(lang, item.text)}`}
                  onClick={() => onPromptPick(item)}
                  className="group flex w-full items-start justify-between gap-3 rounded-[18px] border border-slate-100 bg-slate-50/80 px-4 py-4 text-left transition duration-150 hover:border-[rgba(23,36,216,0.14)] hover:bg-white hover:shadow-[0_4px_14px_rgba(22,31,173,0.07)] active:scale-[0.99]"
                >
                  <div>
                    <p className="text-[13px] font-medium text-slate-700">{pick(lang, item.text)}</p>
                  </div>
                  <ArrowUpRight className="mt-0.5 h-4 w-4 shrink-0 text-slate-300 transition-colors group-hover:text-[#161FAD]" />
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-6 rounded-[18px] border border-slate-200 bg-slate-50/90 p-3">
          <textarea
            value={prompt}
            onChange={(event) => onPromptChange(event.target.value)}
            className="min-h-[52px] w-full resize-none border-0 bg-transparent text-[13px] leading-6 outline-none placeholder:text-slate-400"
            placeholder={text.newTaskPlaceholder}
          />
          <AttachedContextChips items={attachedInputs} lang={lang} onRemove={onRemoveAttachedInput} />
          <div className="mt-2 flex items-center justify-between gap-3 border-t border-slate-200 pt-2.5">
            <div className="flex items-center gap-2">
              <button
                onClick={onOpenUploadDialog}
                className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-500 transition hover:border-[rgba(23,36,216,0.18)] hover:text-[#161FAD]"
                title={text.uploadFile}
              >
                <Upload className="h-4 w-4" />
              </button>
              <button
                onClick={onOpenResourceDialog}
                className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-500 transition hover:border-[rgba(23,36,216,0.18)] hover:text-[#161FAD]"
                title={text.resourceReference}
              >
                <AtSign className="h-4 w-4" />
              </button>
            </div>
            <Button
              onClick={onStart}
              disabled={!prompt.trim()}
              className="h-9 rounded-xl bg-[#161FAD] px-4 text-[13px] text-white shadow-[0_10px_24px_rgba(22,31,173,0.18)] hover:bg-[#1724D8] disabled:cursor-not-allowed disabled:bg-slate-300"
            >
              {text.send}
              <SendHorizonal className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}

function AgentDemoCard({
  card,
  lang,
  onAction,
  parametersOpen,
  planConfirmed,
  thresholdApplied,
  recoveryFixed,
  existingResultsViewed,
}: {
  card: DemoCard;
  lang: Lang;
  onAction: (action: AgentDemoAction) => void;
  parametersOpen: boolean;
  planConfirmed: boolean;
  thresholdApplied: boolean;
  recoveryFixed: boolean;
  existingResultsViewed: boolean;
}) {
  if (card === "plan-preview") {
    return (
      <div className="mt-3 rounded-[18px] border border-slate-200/90 bg-[linear-gradient(180deg,rgba(248,250,255,0.98),rgba(255,255,255,1))] px-4 py-4 shadow-[0_8px_24px_rgba(15,23,42,0.035)]">
        <div className="mb-3 flex items-center gap-2">
          <span className="text-[12px] font-semibold tracking-[0.02em] text-[#161FAD]">
            {lang === "zh" ? "分析计划" : "Analysis Plan"}
          </span>
          <span className="rounded-full bg-[rgba(22,31,173,0.07)] px-2 py-0.5 text-[10px] font-medium text-[#161FAD]">
            {lang === "zh" ? "6 步骤" : "6 steps"}
          </span>
        </div>
        <div className="space-y-3">
          {a2uiPlanSections.map((section, idx) => (
            <div key={idx} className="flex items-start gap-3">
              <span className="mt-[1px] inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[rgba(23,36,216,0.08)] text-[10px] font-bold text-[#161FAD]">
                {idx + 1}
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-[12px] font-semibold text-[#0B1454]">{pick(lang, section.title)}</p>
                <p className="mt-0.5 text-[11px] leading-[1.6] text-slate-500">{pick(lang, section.body)}</p>
                <p className="mt-1 flex items-center gap-1 text-[10px] text-slate-400">
                  <svg className="h-3 w-3 shrink-0 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4" />
                  </svg>
                  <span>{lang === "zh" ? "输出：" : "Output: "}{pick(lang, section.output)}</span>
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (card === "plan-confirm") {
    return (
      <div className="mt-3 overflow-hidden rounded-[16px] border border-[rgba(23,36,216,0.12)] bg-white shadow-[0_4px_16px_rgba(22,31,173,0.06)]">
        {/* Plan steps — compact list */}
        <div className="px-4 pt-4 pb-3">
          <div className="mb-2.5 flex items-center gap-2">
            <span className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#161FAD]">
              {lang === "zh" ? "分析计划" : "Analysis Plan"}
            </span>
            <span className="rounded-full bg-[rgba(22,31,173,0.07)] px-2 py-0.5 text-[10px] font-medium text-[#161FAD]">
              {lang === "zh" ? "6 步" : "6 steps"}
            </span>
          </div>
          <div className="space-y-1.5">
            {a2uiPlanSections.map((section, idx) => (
              <div key={idx} className="flex items-center gap-2.5">
                <span className="inline-flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded-full bg-[rgba(23,36,216,0.08)] text-[9px] font-bold text-[#161FAD]">
                  {idx + 1}
                </span>
                <span className="text-[12px] font-medium text-slate-700">{pick(lang, section.title)}</span>
              </div>
            ))}
          </div>
        </div>
        {/* Divider */}
        <div className="mx-4 border-t border-[rgba(23,36,216,0.08)]" />
        {/* Action row */}
        <div className="flex items-center gap-2 px-4 py-3">
          <button
            onClick={() => onAction("confirm-run")}
            className={`rounded-lg px-4 py-2 text-[12px] font-semibold text-white transition active:scale-[0.97] ${
              planConfirmed
                ? "bg-emerald-500 shadow-[0_4px_12px_rgba(16,185,129,0.25)]"
                : "bg-[#161FAD] shadow-[0_4px_14px_rgba(22,31,173,0.22)] hover:bg-[#1724D8]"
            }`}
          >
            {planConfirmed ? (lang === "zh" ? "已确认，运行中" : "Confirmed, running") : lang === "zh" ? "确认运行" : "Confirm run"}
          </button>
          <button
            onClick={() => onAction("adjust-params")}
            className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-[12px] font-medium text-slate-600 transition hover:border-[rgba(23,36,216,0.2)] hover:bg-white hover:text-[#161FAD]"
          >
            {lang === "zh" ? "调整参数" : "Adjust parameters"}
          </button>
        </div>
        {parametersOpen ? (
          <div className="border-t border-slate-100 bg-slate-50/60 px-4 py-3">
            <p className="mb-2 text-[11px] font-semibold text-slate-600">{lang === "zh" ? "参数调整" : "Parameters"}</p>
            <div className="grid gap-2 sm:grid-cols-3">
              {[
                [lang === "zh" ? "候选 Top K" : "Candidate Top K", "12"],
                [lang === "zh" ? "异常阈值" : "Outlier threshold", "10 nM"],
                [lang === "zh" ? "风险提示" : "Risk note", lang === "zh" ? "开启" : "On"],
              ].map(([label, value]) => (
                <label key={label} className="rounded-lg border border-slate-100 bg-white px-3 py-2">
                  <span className="block text-[10px] text-slate-400">{label}</span>
                  <input value={value} readOnly className="mt-1 w-full border-0 bg-transparent text-[12px] font-semibold text-slate-800 outline-none" />
                </label>
              ))}
            </div>
          </div>
        ) : null}
      </div>
    );
  }

  if (card === "hitl-decision") {
    return (
      <div className="mt-3 rounded-xl border border-amber-200 bg-amber-50/70 p-4">
        <p className="text-sm font-semibold text-amber-900">{lang === "zh" ? "人工检查点" : "Human checkpoint"}</p>
        <p className="mt-1 text-xs leading-5 text-amber-800">
          {lang === "zh"
            ? "异常候选：DLL3-BiAb-087、091、102。建议继续运行并加 warning，或调整阈值后重跑。"
            : "Outliers: DLL3-BiAb-087, 091, 102. Continue with warning labels, or adjust thresholds and rerun."}
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          <button onClick={() => onAction("continue-label")} className="rounded-md bg-amber-500 px-3 py-2 text-xs font-medium text-white">{lang === "zh" ? "继续并打标" : "Continue with label"}</button>
          <button onClick={() => onAction("adjust-threshold")} className="rounded-md border border-amber-200 bg-white px-3 py-2 text-xs font-medium text-amber-800">{lang === "zh" ? "调整阈值" : "Adjust threshold"}</button>
        </div>
        {thresholdApplied ? (
          <div className="mt-3 rounded-lg border border-amber-200 bg-white/80 px-3 py-2 text-[11px] leading-5 text-amber-800">
            {lang === "zh" ? "已将异常阈值从 10 nM 调整为 15 nM，并继续后续排序步骤。" : "Threshold adjusted from 10 nM to 15 nM, then ranking continues."}
          </div>
        ) : null}
      </div>
    );
  }

  if (card === "recovery-action") {
    return (
      <div className="mt-3 rounded-xl border border-red-200 bg-red-50/70 p-4">
        <p className="text-sm font-semibold text-red-700">{lang === "zh" ? "失败恢复建议" : "Recovery suggestion"}</p>
        <p className="mt-1 text-xs leading-5 text-red-700">
          {lang === "zh"
            ? "影响范围仅为排序步骤。可自动补齐 mol_id，并从 step-05 局部重跑。"
            : "The impact is limited to ranking. Auto-fill mol_id and rerun from step-05 only."}
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          <button onClick={() => onAction("fix-retry")} className="rounded-md bg-red-600 px-3 py-2 text-xs font-medium text-white">
            {recoveryFixed ? (lang === "zh" ? "已修复并重跑" : "Fixed and retried") : lang === "zh" ? "修复并重试" : "Fix and retry"}
          </button>
          <button onClick={() => onAction("view-results")} className="rounded-md border border-red-200 bg-white px-3 py-2 text-xs font-medium text-red-700">{lang === "zh" ? "查看已有结果" : "View current results"}</button>
        </div>
        {existingResultsViewed || recoveryFixed ? (
          <div className="mt-3 rounded-lg border border-red-100 bg-white/80 px-3 py-2 text-[11px] leading-5 text-red-700">
            {recoveryFixed
              ? lang === "zh"
                ? "已补齐 mol_id，并从 Step 5 局部重跑；右侧结果区会保留已有文件。"
                : "mol_id has been filled and Step 5 was rerun locally; existing files remain in Results."
              : lang === "zh"
                ? "已切换到右侧结果区，先查看当前已生成文件。"
                : "Switched to Results so current generated files can be reviewed first."}
          </div>
        ) : null}
      </div>
    );
  }

  // ── Results-generated card ──────────────────────────────────────────────
  const statusItems = [
    {
      label: lang === "zh" ? "模型状态" : "Model state",
      value: lang === "zh" ? "常数目标" : "constant_targets",
      code: "constant_targets",
      tone: "warning" as const,
      description:
        lang === "zh"
          ? "部分 fold 训练标签全相同，CatBoost 报错，指标需要降权解读。"
          : "Some folds have constant targets; CatBoost errors — metrics should be down-weighted.",
    },
    {
      label: lang === "zh" ? "指标可信度" : "Metric validity",
      value: lang === "zh" ? "部分有效" : "partial",
      code: "partial",
      tone: "warning" as const,
      description:
        lang === "zh"
          ? "GBDT/LightGBM 可容错完成，但 Spearman/Pearson 在常数输入下无法稳定定义。"
          : "GBDT/LightGBM can finish, but Spearman/Pearson are unstable under constant inputs.",
    },
    {
      label: lang === "zh" ? "特征工程" : "Feature engineering",
      value: lang === "zh" ? "已完成" : "completed",
      code: "completed",
      tone: "success" as const,
      description:
        lang === "zh"
          ? "单臂结合特征和双表位组合特征已形成可复用特征框架。"
          : "Single-arm and biparatopic combination features form a reusable feature framework.",
    },
  ];

  const nextStepItems = [
    {
      action: "interpret-files" as const,
      idx: 1,
      label: lang === "zh" ? "读取并解读结果文件" : "Read and interpret result files",
      detail:
        lang === "zh"
          ? "解析 feature_filtering_result.csv 和 importance_analysis_result.csv。"
          : "Parse feature_filtering_result.csv and importance_analysis_result.csv.",
    },
    {
      action: "rerun-ml" as const,
      idx: 2,
      label: lang === "zh" ? "重新运行 ML 回归分析" : "Rerun ML regression",
      detail: lang === "zh" ? "基于筛选后的精简特征集重新训练。" : "Retrain on the filtered compact feature set.",
    },
    {
      action: "explain-top-features" as const,
      idx: 3,
      label: lang === "zh" ? "解读 Top 重要特征" : "Explain top features",
      detail: lang === "zh" ? "分析 Top 特征与内吞机制的关联。" : "Analyze how top features relate to internalization.",
    },
  ];

  return (
    <div className="mt-3 space-y-3">
      {/* ── Header status banner ── */}
      <div className="flex items-center gap-3 rounded-2xl border border-emerald-200/80 bg-gradient-to-r from-emerald-50 to-white px-4 py-3.5 shadow-[0_2px_8px_rgba(16,185,129,0.08)]">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-emerald-500 shadow-[0_4px_12px_rgba(16,185,129,0.3)]">
          <svg className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-[13px] font-semibold text-slate-900">{lang === "zh" ? "Results 已生成" : "Results generated"}</p>
          <p className="mt-0.5 text-[11px] leading-4 text-slate-500">
            {lang === "zh"
              ? "包含结构特征、热图、排序表和完整报告。结果可预览、下载，并继续进入报告详情。"
              : "Includes structural features, heatmap, ranking table, and complete report."}
          </p>
        </div>
      </div>

      {/* ── Metrics card ── */}
      <div className="rounded-2xl border border-slate-200/80 bg-white shadow-[0_4px_16px_rgba(15,23,42,0.06)]">
        {/* Card header */}
        <div className="flex items-start justify-between gap-3 border-b border-slate-100 px-5 py-4">
          <div>
            <p className="text-[13px] font-semibold text-[#070261]">
              {lang === "zh" ? "双表位内吞特征报告指标卡" : "Biparatopic Internalization Report"}
            </p>
            <p className="mt-0.5 text-[11px] leading-5 text-slate-400">
              {lang === "zh"
                ? "关键判断摘要 · 先看结论再进详情"
                : "Key judgments summary · scan conclusions before full detail"}
            </p>
          </div>
          <span className="mt-0.5 shrink-0 rounded-full border border-amber-200 bg-amber-50 px-2.5 py-1 text-[10px] font-semibold tracking-wide text-amber-700">
            {lang === "zh" ? "模型受限" : "LIMITED"}
          </span>
        </div>

        {/* Metrics row */}
        <div className="grid grid-cols-3 divide-x divide-slate-100 px-1 py-1">
          {[
            { label: lang === "zh" ? "执行成功" : "Steps passed", value: "9/9", hint: lang === "zh" ? "全部步骤完成" : "All steps done", color: "text-emerald-600" },
            { label: lang === "zh" ? "实验配置" : "Configs", value: "16", hint: "cutoff × features × stages", color: "text-[#161FAD]" },
            { label: lang === "zh" ? "特征总量" : "Features", value: "560", hint: "4 binders × 140", color: "text-slate-800" },
          ].map((m) => (
            <div key={m.label} className="flex flex-col items-center py-4">
              <p className="text-[10px] font-medium uppercase tracking-wider text-slate-400">{m.label}</p>
              <p className={`mt-1.5 text-[26px] font-bold leading-none tabular-nums ${m.color}`}>{m.value}</p>
              <p className="mt-1.5 text-center text-[10px] leading-4 text-slate-400">{m.hint}</p>
            </div>
          ))}
        </div>

        {/* Status rows */}
        <div className="space-y-0 border-t border-slate-100">
          {statusItems.map((item, i) => (
            <div
              key={item.label}
              className={`flex items-start gap-0 ${
                i < statusItems.length - 1 ? "border-b border-slate-100" : ""
              }`}
            >
              {/* Left color bar */}
              <div className={`w-1 self-stretch rounded-l-none ${
                item.tone === "warning" ? "bg-amber-400" : "bg-emerald-400"
              }`} />
              <div className="flex min-w-0 flex-1 items-start justify-between gap-3 px-4 py-3">
                <div className="min-w-0 flex-1">
                  <p className="text-[12px] font-semibold text-slate-800">{item.label}</p>
                  <p className="mt-1 text-[11px] leading-[1.6] text-slate-500">{item.description}</p>
                </div>
                <span
                  className={`mt-0.5 shrink-0 rounded-md px-2 py-0.5 font-mono text-[10px] font-medium ${
                    item.tone === "warning"
                      ? "bg-amber-50 text-amber-700 ring-1 ring-amber-200"
                      : "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200"
                  }`}
                >
                  {item.code}
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* CTA */}
        <div className="border-t border-slate-100 px-5 py-4">
          <button
            onClick={() => onAction("view-report")}
            className="inline-flex items-center gap-2 rounded-xl bg-[#161FAD] px-5 py-2.5 text-[12px] font-semibold text-white shadow-[0_4px_14px_rgba(22,31,173,0.25)] transition duration-150 hover:bg-[#1724D8] hover:shadow-[0_6px_18px_rgba(22,31,173,0.32)] active:scale-[0.97]"
          >
            {lang === "zh" ? "查看完整报告" : "View full report"}
            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      </div>

      {/* ── Recommended next steps ── */}
      <div className="rounded-2xl border border-slate-200/80 bg-white shadow-[0_4px_16px_rgba(15,23,42,0.06)]">
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-3.5">
          <div>
            <p className="text-[12px] font-semibold text-[#070261]">{lang === "zh" ? "推荐下一步" : "Recommended next steps"}</p>
            <p className="mt-0.5 text-[10px] text-slate-400">
              {lang === "zh" ? "点击后直接进入下一轮 Agent 任务" : "Click to continue into the next agent task"}
            </p>
          </div>
          <span className="rounded-full border border-[rgba(22,31,173,0.15)] bg-[rgba(22,31,173,0.05)] px-2.5 py-1 text-[10px] font-semibold text-[#161FAD]">
            {lang === "zh" ? "可操作" : "ACTIONABLE"}
          </span>
        </div>
        <div className="divide-y divide-slate-100">
          {nextStepItems.map((item) => (
            <button
              key={item.action}
              onClick={() => onAction(item.action)}
              className="group flex w-full items-start gap-3.5 px-5 py-3.5 text-left transition duration-150 hover:bg-slate-50 active:bg-slate-100"
            >
              <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[rgba(22,31,173,0.08)] text-[10px] font-bold text-[#161FAD] transition group-hover:bg-[#161FAD] group-hover:text-white">
                {item.idx}
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-[12px] font-semibold text-slate-800 transition group-hover:text-[#161FAD]">{item.label}</p>
                <p className="mt-0.5 text-[11px] leading-4 text-slate-400">{item.detail}</p>
              </div>
              <svg className="mt-1 h-4 w-4 shrink-0 text-slate-300 transition group-hover:text-[#161FAD]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
              </svg>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

function RunningWorkspace({
  attachedInputs,
  lang,
  title,
  messages,
  reports,
  prompt,
  onDownloadReport,
  onOpenResourceDialog,
  onOpenUploadDialog,
  onPromptChange,
  onRemoveAttachedInput,
  onSaveReportToProject,
  onContinueRun,
  onViewResults,
  steps,
  workflowCompleted,
  compact = false,
}: {
  attachedInputs: AttachedInput[];
  lang: Lang;
  title: LocalizedText;
  messages: RunningMessage[];
  reports: RunReport[];
  prompt: string;
  onDownloadReport: (report: RunReport) => void;
  onOpenResourceDialog: () => void;
  onOpenUploadDialog: () => void;
  onPromptChange: (value: string) => void;
  onRemoveAttachedInput: (id: string) => void;
  onSaveReportToProject: (report: RunReport) => void;
  onContinueRun: () => void;
  onViewResults: () => void;
  steps: PlanStep[];
  workflowCompleted: boolean;
  compact?: boolean;
}) {
  const text = copy[lang];
  const currentRunningStep = steps.find((step) => step.status === "running");
  const [parametersOpen, setParametersOpen] = useState(false);
  const [planConfirmed, setPlanConfirmed] = useState(false);
  const [thresholdApplied, setThresholdApplied] = useState(false);
  const [recoveryFixed, setRecoveryFixed] = useState(false);
  const [existingResultsViewed, setExistingResultsViewed] = useState(false);
  const [selectedReport, setSelectedReport] = useState<RunReport | null>(null);

  useEffect(() => {
    setParametersOpen(false);
    setPlanConfirmed(false);
    setThresholdApplied(false);
    setRecoveryFixed(false);
    setExistingResultsViewed(false);
    setSelectedReport(null);
  }, [messages]);

  const handleAgentDemoAction = (action: AgentDemoAction) => {
    if (action === "confirm-run") {
      setPlanConfirmed(true);
      onContinueRun();
      return;
    }

    if (action === "adjust-params") {
      setParametersOpen((current) => !current);
      return;
    }

    if (action === "continue-label") {
      setThresholdApplied(false);
      onContinueRun();
      return;
    }

    if (action === "adjust-threshold") {
      setThresholdApplied(true);
      onContinueRun();
      return;
    }

    if (action === "fix-retry") {
      setRecoveryFixed(true);
      onContinueRun();
      return;
    }

    if (action === "view-results") {
      setExistingResultsViewed(true);
      onViewResults();
      return;
    }

    if (action === "interpret-files") {
      onPromptChange(
        lang === "zh"
          ? "请读取并解读 feature_filtering_result.csv 和 importance_analysis_result.csv，告诉我哪些特征最重要、哪些应该剔除。"
          : "Please read and interpret feature_filtering_result.csv and importance_analysis_result.csv, and tell me which features matter most and which should be removed.",
      );
      onViewResults();
      return;
    }

    if (action === "rerun-ml") {
      onPromptChange(
        lang === "zh"
          ? "请基于筛选后的精简特征集，重新运行 ML 回归分析。"
          : "Please rerun ML regression analysis on the filtered compact feature set.",
      );
      onContinueRun();
      return;
    }

    if (action === "explain-top-features") {
      onPromptChange(
        lang === "zh"
          ? "请对 Top 重要特征进行生物学意义解读，并分析它们与内吞机制的关联。"
          : "Please explain the biological meaning of the top features and how they relate to internalization.",
      );
      return;
    }

    setSelectedReport(reports[0] ?? null);
  };

  return (
    <section className="flex h-full min-h-0 flex-col rounded-[24px] border border-white/70 bg-white/84 shadow-[0_16px_40px_rgba(15,23,42,0.045)] backdrop-blur">
      <div className={`border-b border-slate-200/80 ${compact ? "px-4 py-4" : "px-6 py-5"}`}>
        <h2 className="text-[17px] font-semibold text-[#070261]">{pick(lang, title)}</h2>
      </div>

      <div className={`min-h-0 flex-1 overflow-y-auto ${compact ? "px-4 py-4" : "px-6 py-6"}`}>
        <div className="space-y-4 pb-1">
          {messages.map((message, index) => {
            const isUser = message.role === "user";
            return (
              <div key={`${message.role}-${index}`} className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
                <div
                  className={`max-w-[72%] rounded-[22px] border px-4 py-4 text-[13px] leading-6 shadow-[0_10px_28px_rgba(15,23,42,0.04)] ${
                    isUser
                      ? "border-[rgba(23,36,216,0.12)] bg-[linear-gradient(135deg,#161FAD_0%,#2C36F4_100%)] text-white"
                      : "border-slate-200 bg-white text-slate-700"
                  }`}
                >
                  {!isUser ? (
                    <div className="mb-2 flex items-center gap-2">
                      <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[linear-gradient(135deg,#161FAD_0%,#848CFE_100%)] text-white shadow-[0_3px_8px_rgba(22,31,173,0.2)]">
                        <Bot className="h-3.5 w-3.5" />
                      </div>
                      <span className="text-[11px] font-semibold text-[#161FAD]">Ailux Agent</span>
                    </div>
                  ) : null}
                  {!isUser && index === 1 && !message.card && messages[1]?.card !== "plan-confirm" ? (
                    <div className="rounded-[18px] border border-slate-200/90 bg-[linear-gradient(180deg,rgba(248,250,255,0.96),rgba(255,255,255,0.98))] px-4 py-3.5 shadow-[0_8px_24px_rgba(15,23,42,0.035)]">
                      <p className="text-[13px] font-semibold leading-6 text-[#0B1454]">{pick(lang, firstReplyIntro)}</p>
                      <div className="mt-3 space-y-2.5 text-[12px] leading-5 text-slate-700">
                        <p className="text-[12px] font-semibold tracking-[0.02em] text-[#161FAD]">{pick(lang, firstReplyPlanTitle)}</p>
                        {firstReplySections.map((section, sectionIndex) => (
                          <div key={`${pick(lang, section.title)}-${sectionIndex}`} className="flex items-start gap-2.5">
                            <span className="mt-[2px] inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[rgba(23,36,216,0.08)] text-[10px] font-bold text-[#161FAD]">
                              {sectionIndex + 1}
                            </span>
                            <p className="min-w-0 text-[12px] leading-5 text-slate-600">
                              <span className="mr-1.5 font-semibold text-[#0B1454]">{pick(lang, section.title)}</span>
                              <span>{pick(lang, section.body)}</span>
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <p className="whitespace-pre-line">{pick(lang, message.content)}</p>
                  )}
                  {!isUser && message.card ? (
                    <AgentDemoCard
                      card={message.card}
                      lang={lang}
                      onAction={handleAgentDemoAction}
                      parametersOpen={parametersOpen}
                      planConfirmed={planConfirmed}
                      thresholdApplied={thresholdApplied}
                      recoveryFixed={recoveryFixed}
                      existingResultsViewed={existingResultsViewed}
                    />
                  ) : null}
                  <p className={`mt-3 text-[10px] ${isUser ? "text-white/75" : "text-slate-400"}`}>{message.time}</p>
                  {!isUser && index === 1 && !message.card && !workflowCompleted && messages[1]?.card !== "plan-confirm" ? (
                    <div className="mt-3 rounded-[16px] border border-[rgba(255,201,151,0.38)] bg-[rgba(255,201,151,0.16)] px-3 py-2.5 text-[#8a5216]">
                      <div className="flex items-start gap-2">
                        <CircleDashed className="mt-0.5 h-4 w-4 shrink-0 animate-spin" />
                        <div>
                          <p className="text-[11px] font-semibold">{text.workflowRunningLabel}</p>
                          <p className="mt-1 text-[11px] leading-5 text-[#8a5216]">
                            {currentRunningStep
                              ? `${pick(lang, currentRunningStep.title)} · ${pick(lang, currentRunningStep.detail)}`
                              : text.workflowRunningFallback}
                          </p>
                        </div>
                      </div>
                    </div>
                  ) : null}
                </div>
              </div>
            );
          })}

          {workflowCompleted ? (
            <div className="flex justify-start">
              <article className="w-full max-w-[980px] rounded-[24px] border border-slate-200 bg-white px-4 py-4 text-slate-700 shadow-[0_14px_34px_rgba(15,23,42,0.06)] sm:px-5">
                <div                   className="mb-2 flex items-center gap-2">
                  <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[linear-gradient(135deg,#161FAD_0%,#848CFE_100%)] text-white shadow-[0_3px_8px_rgba(22,31,173,0.2)]">
                    <Bot className="h-3.5 w-3.5" />
                  </div>
                  <span className="text-[11px] font-semibold text-[#161FAD]">Ailux Agent</span>
                </div>
                <p className="text-[14px] font-semibold text-[#070261]">{text.finalSummaryTitle}</p>
                <p className="mt-3 text-[13px] leading-6 text-slate-700">{text.finalSummaryBody}</p>
                <img
                  src={MODEL_RANKING_IMAGE_URL}
                  alt={lang === "zh" ? "模型排名表格" : "Model ranking table"}
                  className="mt-4 block h-auto w-full rounded-[16px]"
                />
                <p className="mt-4 text-[13px] leading-6 text-slate-600">{text.finalSummaryOutcome}</p>
                <button
                  onClick={() => setSelectedReport(reports[0] ?? null)}
                  className="mt-4 rounded-xl bg-[#161FAD] px-3.5 py-2 text-[12px] font-medium text-white transition hover:bg-[#1724D8]"
                >
                  {lang === "zh" ? "查看最终报告详情" : "View final report"}
                </button>
                <p className="mt-2 text-[10px] text-slate-400">18:31</p>
              </article>
            </div>
          ) : null}

          <div className="pt-2">
            <div className="rounded-[18px] border border-slate-200 bg-slate-50/90 px-3 py-2.5">
              <textarea
                value={prompt}
                onChange={(event) => onPromptChange(event.target.value)}
                className="min-h-[40px] w-full resize-none border-0 bg-transparent text-[13px] leading-5 outline-none placeholder:text-slate-400"
                placeholder={text.runningPlaceholder}
              />
              <AttachedContextChips items={attachedInputs} lang={lang} onRemove={onRemoveAttachedInput} />
              <div className="mt-2 flex items-center justify-between gap-3 border-t border-slate-200 pt-2">
                <div className="flex items-center gap-1.5 text-slate-500">
                  <button
                    onClick={onOpenUploadDialog}
                    className="rounded-xl p-1.5 transition hover:bg-white hover:text-[#161FAD]"
                    title={text.uploadFile}
                  >
                    <Upload className="h-4 w-4" />
                  </button>
                  <button
                    onClick={onOpenResourceDialog}
                    className="rounded-xl p-1.5 transition hover:bg-white hover:text-[#161FAD]"
                    title={text.resourceReference}
                  >
                    <AtSign className="h-4 w-4" />
                  </button>
                </div>
                <Button className="h-8 rounded-xl bg-[#161FAD] px-3.5 text-[12px] text-white hover:bg-[#1724D8]">
                  {text.send}
                  <SendHorizonal className="ml-1.5 h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
      <ReportDrawer
        lang={lang}
        report={selectedReport}
        onDownloadReport={onDownloadReport}
        onOpenChange={(open) => !open && setSelectedReport(null)}
        onSaveReportToProject={onSaveReportToProject}
      />
    </section>
  );
}

function FilePreviewDrawer({
  lang,
  file,
  onOpenChange,
  onDownloadFile,
  onSaveFileToProject,
}: {
  lang: Lang;
  file: ResultFile | null;
  onOpenChange: (open: boolean) => void;
  onDownloadFile: (file: ResultFile) => void;
  onSaveFileToProject: (file: ResultFile) => void;
}) {
  const text = copy[lang];
  const selectedFile = file;

  return (
    <Sheet open={Boolean(selectedFile)} onOpenChange={onOpenChange}>
      <SheetContent side="right" showOverlay={false} className="w-[min(760px,92vw)] gap-0 overflow-hidden border-l border-slate-200 bg-[#f8faff] p-0 sm:max-w-none">
        {selectedFile ? (
          <>
            <SheetHeader className="border-b border-slate-200 bg-white/92 px-5 py-5">
              <div className="flex items-start justify-between gap-4 pr-8">
                <div className="min-w-0">
                  <SheetTitle className="truncate text-[17px] font-semibold text-[#070261]">{selectedFile.name}</SheetTitle>
                  <SheetDescription className="mt-1 text-[12px] leading-5 text-slate-500">
                    {pick(lang, selectedFile.step)} · {pick(lang, selectedFile.meta)}
                  </SheetDescription>
                </div>
                <div className="flex shrink-0 gap-2">
                  <Button
                    variant="outline"
                    onClick={() => onSaveFileToProject(selectedFile)}
                    className="h-8 rounded-xl border-slate-200 bg-white px-3 text-[12px] text-slate-600 hover:bg-slate-50"
                  >
                    <Save className="mr-1.5 h-4 w-4" />
                    {text.save}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => onDownloadFile(selectedFile)}
                    className="h-8 rounded-xl border-slate-200 bg-white px-3 text-[12px] text-slate-600 hover:bg-slate-50"
                  >
                    <ArrowDownToLine className="mr-1.5 h-4 w-4" />
                    {text.downloadFile}
                  </Button>
                </div>
              </div>
            </SheetHeader>

            <div className="min-h-0 flex-1 overflow-y-auto px-5 py-5">
              <>
                {selectedFile.type === "pdb" ? (
                  <PdbViewer lang={lang} pdbText={demoPdbContent} />
                ) : selectedFile.id === "feature-importance-plot" ? (
                  <div className="space-y-4">
                    <div className="rounded-[18px] border border-slate-200 bg-[linear-gradient(180deg,rgba(248,250,255,0.98),rgba(236,241,255,0.95))] p-4">
                      <p className="text-[12px] font-medium text-slate-700">{lang === "zh" ? "结果说明" : "Result description"}</p>
                      <p className="mt-3 text-[12px] leading-6 text-slate-600">
                        {lang === "zh"
                          ? "这是单个feature和实验特征之间的关系散点图。"
                          : "This scatter plot shows the relationship between a single feature and the experimental feature."}
                      </p>
                    </div>
                    <div className="overflow-hidden rounded-[18px] border border-slate-200 bg-white p-3">
                      <img
                        src={FEATURE_SCATTER_IMAGE_URL}
                        alt={lang === "zh" ? "单个特征与实验特征关系散点图" : "Scatter plot of a single feature against experimental measurements"}
                        className="h-auto w-full rounded-[12px] object-contain"
                      />
                    </div>
                  </div>
                ) : selectedFile.type === "csv" ? (
                  <div className="overflow-hidden rounded-[18px] border border-slate-200">
                    <div className="overflow-x-auto">
                      <table className="min-w-full border-collapse text-left text-[12px]">
                        <thead>
                          <tr className="bg-slate-50 text-slate-500">
                            {["sample_id", "KD_arm1_nM", "KD_arm2_nM", "antibody_format", "epitope_pos_A", "epitope_pos_B"].map((head) => (
                              <th key={head} className="border-b border-slate-200 px-3 py-2.5 font-medium">
                                {head}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {datasetPreviewRows.map((row, index) => (
                            <tr key={`${row[0]}-${index}`} className="even:bg-slate-50/60">
                              {row.map((cell) => (
                                <td key={`${row[0]}-${cell}`} className="border-b border-slate-100 px-3 py-2.5 text-slate-700">
                                  {cell}
                                </td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    <div className="bg-slate-50/70 px-3 py-2 text-[11px] text-slate-400">{text.tableFooter}</div>
                  </div>
                ) : selectedFile.type === "json" ? (
                  <div className="rounded-[18px] border border-slate-200 bg-[#0f172a] p-4 font-mono text-[12px] leading-6 text-slate-200">
                    <p>{`{`}</p>
                    <p className="pl-4">"best_model": "XGBoost",</p>
                    <p className="pl-4">"top_features": ["target_colocalization", "KD_arm1_nM", "linker_flexibility"],</p>
                    <p className="pl-4">"r2": 0.72,</p>
                    <p className="pl-4">"rmse": 0.106</p>
                    <p>{`}`}</p>
                  </div>
                ) : selectedFile.type === "xlsx" ? (
                  <div className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
                    <div className="rounded-[18px] border border-slate-200 bg-slate-50/80 p-4">
                      <p className="text-[12px] font-medium text-slate-700">{text.modelSummary}</p>
                      <div className="mt-4 space-y-3">
                        {[
                          ["XGBoost", "R² 0.72", "RMSE 0.106"],
                          ["Random Forest", "R² 0.69", "RMSE 0.118"],
                          ["SVM", "R² 0.64", "RMSE 0.131"],
                        ].map(([name, score, error]) => (
                          <div key={name} className="flex items-center justify-between rounded-[16px] border border-slate-100 bg-white px-3 py-3">
                            <p className="text-[12px] font-medium text-slate-700">{name}</p>
                            <div className="text-right">
                              <p className="text-[11px] text-slate-500">{score}</p>
                              <p className="text-[11px] text-slate-400">{error}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div className="rounded-[18px] border border-slate-200 bg-[linear-gradient(180deg,rgba(248,250,255,0.98),rgba(236,241,255,0.95))] p-4">
                      <p className="text-[12px] font-medium text-slate-700">{text.conclusion}</p>
                      <p className="mt-3 text-[12px] leading-6 text-slate-600">{text.conclusionBody}</p>
                    </div>
                  </div>
                ) : (
                  <div className="grid gap-4 lg:grid-cols-[1.15fr_0.85fr]">
                    <div className="rounded-[18px] border border-slate-200 bg-[linear-gradient(180deg,rgba(244,247,255,1)_0%,rgba(255,255,255,1)_100%)] p-5">
                      <div className="flex items-end gap-3">
                        {[48, 78, 66, 92, 57, 86].map((height, index) => (
                          <div key={`${height}-${index}`} className="flex flex-1 flex-col items-center gap-2">
                            <div
                              className="w-full rounded-t-[12px] bg-[linear-gradient(180deg,#161FAD_0%,#848CFE_100%)]"
                              style={{ height }}
                            />
                            <span className="text-[10px] text-slate-400">F{index + 1}</span>
                          </div>
                        ))}
                      </div>
                      <p className="mt-4 text-[11px] text-slate-400">{text.chartCaption}</p>
                    </div>
                    <div className="rounded-[18px] border border-slate-200 bg-slate-50/80 p-4">
                      <p className="text-[12px] font-medium text-slate-700">{text.imageSummary}</p>
                      <ul className="mt-3 space-y-3 text-[12px] leading-6 text-slate-600">
                        {text.imageSummaryBullets.map((item) => (
                          <li key={item}>{item}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                )}
              </>
            </div>
          </>
        ) : null}
      </SheetContent>
    </Sheet>
  );
}

function historyRunStatusClass(status: HistoryRunStatus) {
  if (status === "Completed") return "bg-emerald-50 text-emerald-700";
  if (status === "Paused at HITL") return "bg-amber-50 text-amber-700";
  if (status === "Failed") return "bg-red-50 text-red-600";
  return "bg-[rgba(255,201,151,0.2)] text-[#8a5216]";
}

function historyStepIconClass(status: StepStatus) {
  if (status === "done") return "border-[rgba(23,36,216,0.12)] bg-[rgba(23,36,216,0.08)] text-[#161FAD]";
  if (status === "running") return "border-[rgba(255,201,151,0.45)] bg-[rgba(255,201,151,0.2)] text-[#8a5216]";
  if (status === "failed") return "border-red-200 bg-red-50 text-red-600";
  return "border-slate-200 bg-slate-100 text-slate-500";
}

function attemptToneClass(tone: HistoryAttempt["tone"]) {
  if (tone === "completed") return "bg-emerald-50 text-emerald-700";
  if (tone === "failed") return "bg-red-50 text-red-600";
  if (tone === "modified") return "bg-[rgba(23,36,216,0.08)] text-[#161FAD]";
  if (tone === "resumed") return "bg-amber-50 text-amber-700";
  return "bg-[rgba(255,201,151,0.2)] text-[#8a5216]";
}

function reportBadgeClass(tone: ReportSection["tone"]) {
  if (tone === "success") return "bg-emerald-50 text-emerald-700";
  if (tone === "warning") return "bg-amber-50 text-amber-700";
  return "bg-[rgba(23,36,216,0.08)] text-[#161FAD]";
}

function ReportDrawer({
  lang,
  onDownloadReport,
  onOpenChange,
  onSaveReportToProject,
  report,
}: {
  lang: Lang;
  onDownloadReport: (report: RunReport) => void;
  onOpenChange: (open: boolean) => void;
  onSaveReportToProject: (report: RunReport) => void;
  report: RunReport | null;
}) {
  const text = copy[lang];

  return (
    <Sheet open={Boolean(report)} onOpenChange={onOpenChange}>
      <SheetContent side="right" showOverlay={false} className="w-[min(960px,96vw)] gap-0 overflow-hidden border-l border-slate-200 bg-[#f8faff] p-0 sm:max-w-none">
        {report ? (
          <>
            <SheetHeader className="border-b border-slate-200 bg-white/92 px-5 py-5">
              <div className="flex items-start justify-between gap-4 pr-8">
                <div className="min-w-0">
                  <SheetTitle className="text-[17px] font-semibold text-[#070261]">{pick(lang, report.title)}</SheetTitle>
                  <SheetDescription className="text-[12px] leading-5 text-slate-500">
                    {report.fileName} · {pick(lang, report.generatedAt)}
                  </SheetDescription>
                </div>
                <div className="flex shrink-0 gap-2">
                  <Button
                    variant="outline"
                    onClick={() => onSaveReportToProject(report)}
                    className="h-8 rounded-xl border-slate-200 bg-white px-3 text-[12px] text-slate-600 hover:bg-slate-50"
                  >
                    <Save className="mr-1.5 h-4 w-4" />
                    {text.save}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => onDownloadReport(report)}
                    className="h-8 rounded-xl border-slate-200 bg-white px-3 text-[12px] text-slate-600 hover:bg-slate-50"
                  >
                    <ArrowDownToLine className="mr-1.5 h-4 w-4" />
                    {text.download}
                  </Button>
                </div>
              </div>
            </SheetHeader>

            <div className="flex min-h-0 flex-1 gap-4 overflow-hidden px-5 py-5">
              <aside className="hidden w-[150px] shrink-0 border-r border-slate-100 pr-3 md:block">
                <div className="sticky top-0 space-y-1">
                  {report.sections.map((section) => (
                    <a
                      key={section.id}
                      href={`#${report.id}-${section.id}`}
                      className="block rounded-xl px-3 py-2 text-left text-[12px] font-medium text-slate-500 transition hover:bg-slate-50 hover:text-[#161FAD]"
                    >
                      {pick(lang, section.shortLabel)}
                    </a>
                  ))}
                </div>
              </aside>

              <div className="min-w-0 flex-1 overflow-y-auto pr-1">
                <div className="mb-4 rounded-2xl border border-amber-200 bg-amber-50/70 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-amber-900">{text.reportReaderHint}</p>
                      <p className="mt-1 text-xs leading-5 text-amber-800">{text.reportReaderBody}</p>
                    </div>
                    <span className="shrink-0 rounded-full bg-white px-2.5 py-1 text-[11px] font-medium text-amber-700">
                      {lang === "zh" ? "模型受限" : "Limited"}
                    </span>
                  </div>
                </div>

                <div className="space-y-4">
                  {report.sections.map((section) => (
                    <section
                      key={section.id}
                      id={`${report.id}-${section.id}`}
                      className="rounded-2xl border border-slate-200 bg-white p-4 shadow-[0_8px_24px_rgba(15,23,42,0.035)]"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-sm font-semibold text-slate-900">{pick(lang, section.title)}</p>
                          <p className="mt-1 text-xs leading-5 text-slate-500">{pick(lang, section.summary)}</p>
                        </div>
                        <span className={`shrink-0 rounded-full px-2.5 py-1 text-[11px] font-medium ${reportBadgeClass(section.tone)}`}>
                          {section.badge}
                        </span>
                      </div>

                      <div className="mt-4 grid gap-3">
                        {section.items.map((item) => (
                          <div key={`${section.id}-${pick(lang, item.label)}`} className="rounded-xl border border-slate-100 bg-slate-50/70 p-3">
                            <div className="flex items-center justify-between gap-2">
                              <span className="text-xs font-medium text-slate-700">{pick(lang, item.label)}</span>
                              <code className="rounded bg-white px-1.5 py-0.5 text-[10px] text-slate-500">{item.value}</code>
                            </div>
                            <p className="mt-1 text-xs leading-5 text-slate-600">{pick(lang, item.detail)}</p>
                          </div>
                        ))}
                      </div>
                    </section>
                  ))}
                </div>
              </div>
            </div>
          </>
        ) : null}
      </SheetContent>
    </Sheet>
  );
}

function ReportsPanelContent({
  lang,
  onDownloadReport,
  onSaveReportToProject,
  reports,
}: {
  lang: Lang;
  onDownloadReport: (report: RunReport) => void;
  onSaveReportToProject: (report: RunReport) => void;
  reports: RunReport[];
}) {
  const text = copy[lang];
  const [selectedReportId, setSelectedReportId] = useState<string | null>(null);
  const selectedReport = reports.find((report) => report.id === selectedReportId) ?? null;

  return (
    <>
      <div className="space-y-3">
        {reports.map((report) => (
          <div
            key={report.id}
            className="group flex items-start gap-3 rounded-[18px] border border-slate-100 bg-slate-50/90 px-3 py-3 text-left transition hover:border-[rgba(23,36,216,0.14)] hover:bg-white"
          >
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-[rgba(23,36,216,0.08)] text-[#161FAD]">
              <FileText className="h-4 w-4" />
            </div>
            <button onClick={() => setSelectedReportId(report.id)} className="min-w-0 flex-1 text-left">
              <p className="truncate text-[13px] font-semibold text-slate-800">{pick(lang, report.title)}</p>
              <p className="mt-0.5 truncate text-[11px] text-slate-400">{report.fileName}</p>
              <p className="mt-2 text-[11px] leading-5 text-slate-500">{pick(lang, report.summary)}</p>
              <span className="mt-2 inline-flex rounded-xl px-2 py-1 text-[11px] font-medium text-[#161FAD] transition group-hover:bg-[rgba(23,36,216,0.06)]">
                {text.viewReport}
              </span>
            </button>
            <div className="flex shrink-0 gap-1 opacity-0 transition group-hover:opacity-100">
              <button
                onClick={() => onDownloadReport(report)}
                className="rounded-xl p-2 text-slate-400 transition hover:bg-white hover:text-[#161FAD]"
                aria-label={`${text.download} ${report.fileName}`}
              >
                <ArrowDownToLine className="h-4 w-4" />
              </button>
              <button
                onClick={() => onSaveReportToProject(report)}
                className="rounded-xl p-2 text-slate-400 transition hover:bg-white hover:text-[#161FAD]"
                aria-label={`${text.saveToProjectData} ${report.fileName}`}
              >
                <Save className="h-4 w-4" />
              </button>
            </div>
          </div>
        ))}
      </div>

      <ReportDrawer
        lang={lang}
        report={selectedReport}
        onDownloadReport={onDownloadReport}
        onOpenChange={(open) => !open && setSelectedReportId(null)}
        onSaveReportToProject={onSaveReportToProject}
      />
    </>
  );
}

function HistoryRunDetail({
  expandedStepId,
  lang,
  run,
  setExpandedStepId,
}: {
  expandedStepId: string;
  lang: Lang;
  run: HistoryRunItem;
  setExpandedStepId: (id: string) => void;
}) {
  const text = copy[lang];
  const [activeDetailTab, setActiveDetailTab] = useState<"plan" | "files">("plan");

  return (
    <div className="space-y-3">
      <div className="inline-flex rounded-2xl border border-slate-200 bg-slate-50 p-1">
        {[
          { id: "plan" as const, label: "Plan" },
          { id: "files" as const, label: "Files" },
        ].map((tab) => {
          const active = activeDetailTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveDetailTab(tab.id)}
              className={`rounded-xl px-3.5 py-2 text-[12px] font-medium transition ${
                active ? "bg-white text-[#161FAD] shadow-[0_6px_16px_rgba(15,23,42,0.06)]" : "text-slate-500 hover:text-slate-700"
              }`}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      {activeDetailTab === "plan" ? (
        <div className="rounded-[20px] border border-slate-100 bg-white p-3.5 shadow-[0_10px_28px_rgba(15,23,42,0.04)]">
          <div>
          <p className="mb-2 text-[11px] font-medium uppercase tracking-[0.14em] text-slate-400">{text.historySteps}</p>
          <div className="space-y-2.5">
            {run.planSteps.map((step) => {
              const expanded = expandedStepId === step.id;
              return (
                <article key={step.id} className="rounded-[18px] border border-slate-100 bg-slate-50/90 p-3">
                  <button onClick={() => setExpandedStepId(expanded ? "" : step.id)} className="flex w-full items-start gap-3 text-left">
                    <div className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border ${historyStepIconClass(step.status)}`}>
                      {step.status === "done" ? <CheckCircle2 className="h-4 w-4" /> : <CircleDashed className="h-4 w-4" />}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <p className="truncate text-[12px] font-semibold text-slate-800">{pick(lang, step.title)}</p>
                        <span className="text-[10px] text-slate-400">{step.duration}</span>
                      </div>
                      <p className="mt-1 text-[11px] leading-5 text-slate-500">{pick(lang, step.description)}</p>
                    </div>
                    <ChevronDown className={`mt-1 h-4 w-4 shrink-0 text-slate-400 transition ${expanded ? "rotate-180" : ""}`} />
                  </button>

                  {expanded ? (
                    <div className="mt-3 space-y-3 border-t border-slate-100 pt-3">
                      <div className="flex items-center justify-between gap-2">
                        <code className="rounded bg-white px-2 py-1 text-[10px] text-slate-500">{step.toolName}</code>
                        <span className="rounded-full bg-white px-2 py-1 text-[10px] text-slate-500">{step.attempts.length} attempts</span>
                      </div>
                      <div className="grid gap-2">
                        <div className="rounded-[14px] bg-white px-3 py-2">
                          <p className="text-[11px] font-semibold text-slate-700">{text.inputs}</p>
                          <p className="mt-1 text-[11px] leading-5 text-slate-500">{step.inputs.join(" · ")}</p>
                        </div>
                        <div className="rounded-[14px] bg-white px-3 py-2">
                          <p className="text-[11px] font-semibold text-slate-700">{text.outputs}</p>
                          <p className="mt-1 text-[11px] leading-5 text-slate-500">{step.outputs.join(" · ")}</p>
                        </div>
                      </div>
                      <div className="space-y-2">
                        {step.attempts.map((attempt) => (
                          <div key={attempt.id} className="rounded-[14px] border border-slate-100 bg-white px-3 py-2">
                            <div className="flex items-center justify-between gap-2">
                              <span className="text-[11px] font-medium text-slate-700">{attempt.label}</span>
                              <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${attemptToneClass(attempt.tone)}`}>{attempt.tone}</span>
                            </div>
                            <p className="mt-1 text-[11px] leading-4 text-slate-500">{pick(lang, attempt.detail)}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : null}
                </article>
              );
            })}
          </div>
          </div>

          <div className="mt-4">
            <p className="mb-2 text-[11px] font-medium uppercase tracking-[0.14em] text-slate-400">{text.historyLogs}</p>
            <div className="space-y-2">
              {run.logs.map((log) => (
                <div key={`${log.time}-${log.event}`} className="rounded-[14px] bg-slate-50/90 px-3 py-2">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[10px] font-medium text-slate-600">{log.event}</span>
                    <span className="text-[10px] text-slate-400">{log.time}</span>
                  </div>
                  <p className="mt-1 text-[11px] leading-4 text-slate-500">{pick(lang, log.message)}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : (
        <div className="rounded-[20px] border border-slate-100 bg-white p-3.5 shadow-[0_10px_28px_rgba(15,23,42,0.04)]">
          <div className="mb-3 flex items-center justify-between gap-3">
            <div>
              <p className="text-[13px] font-semibold text-[#070261]">{text.historyFiles}</p>
              <p className="mt-1 text-[11px] text-slate-400">
                {run.files.length} {text.filesCount}
              </p>
            </div>
          </div>
          <div className="space-y-2">
            {run.files.map((file) => (
              <div key={file.name} className="flex items-center gap-3 rounded-[16px] border border-slate-100 bg-slate-50/90 px-3 py-2.5">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl bg-[rgba(23,36,216,0.08)] text-[#161FAD]">
                  <FileText className="h-4 w-4" />
                </div>
                <div className="min-w-0">
                  <p className="truncate text-[12px] font-medium text-slate-800">{file.name}</p>
                  <p className="mt-0.5 text-[10px] text-slate-400">{pick(lang, file.meta)}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function HistoryPanelContent({ lang }: { lang: Lang }) {
  const text = copy[lang];
  const [selectedRunId, setSelectedRunId] = useState<string | null>(null);
  const [expandedStepId, setExpandedStepId] = useState(historyRunItems[0]?.planSteps[0]?.id ?? "");
  const selectedRun = historyRunItems.find((run) => run.id === selectedRunId) ?? null;

  const handleOpenRun = (run: HistoryRunItem) => {
    setSelectedRunId(run.id);
    setExpandedStepId(run.planSteps[0]?.id ?? "");
  };

  return (
    <>
      <div className="space-y-3">
        {historyRunItems.map((run) => (
          <button
            key={run.id}
            onClick={() => handleOpenRun(run)}
            className="w-full rounded-[18px] border border-slate-100 bg-slate-50/90 p-3.5 text-left transition hover:border-[rgba(23,36,216,0.14)] hover:bg-white hover:shadow-[0_10px_28px_rgba(23,36,216,0.06)]"
          >
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="truncate text-[13px] font-semibold text-slate-800">{pick(lang, run.title)}</p>
                <p className="mt-1 text-[11px] text-slate-400">{pick(lang, run.summaryLine)}</p>
              </div>
              <span className={`shrink-0 rounded-full px-2 py-1 text-[10px] font-medium ${historyRunStatusClass(run.status)}`}>{run.status}</span>
            </div>
            <p className="mt-2 text-[11px] leading-5 text-slate-500">{pick(lang, run.reason)}</p>
            <div className="mt-3 flex items-center justify-between gap-2 text-[11px]">
              <span className="inline-flex items-center gap-1 text-slate-400">
                <Clock3 className="h-3.5 w-3.5" />
                {pick(lang, run.time)}
              </span>
              <span className="font-medium text-[#161FAD]">{lang === "zh" ? "查看快照 →" : "View snapshot →"}</span>
            </div>
          </button>
        ))}
      </div>

      <Sheet open={Boolean(selectedRun)} onOpenChange={(open) => !open && setSelectedRunId(null)}>
        <SheetContent side="right" showOverlay={false} className="w-[min(760px,92vw)] gap-0 overflow-hidden border-l border-slate-200 bg-[#f8faff] p-0 sm:max-w-none">
          {selectedRun ? (
            <>
              <SheetHeader className="border-b border-slate-200 bg-white/90 px-5 py-5">
                <SheetTitle className="pr-8 text-[17px] font-semibold text-[#070261]">{pick(lang, selectedRun.title)}</SheetTitle>
                <SheetDescription className="text-[12px] text-slate-500">
                  {pick(lang, selectedRun.time)} · {selectedRun.status} · {pick(lang, selectedRun.summaryLine)}
                </SheetDescription>
              </SheetHeader>
              <div className="min-h-0 flex-1 overflow-y-auto px-5 py-5">
                <HistoryRunDetail key={selectedRun.id} expandedStepId={expandedStepId} lang={lang} run={selectedRun} setExpandedStepId={setExpandedStepId} />
              </div>
            </>
          ) : null}
        </SheetContent>
      </Sheet>
    </>
  );
}

function flowNodeClass(status: StepStatus) {
  if (status === "done") return "border-emerald-300 bg-emerald-50/90 shadow-[0_8px_18px_rgba(16,185,129,0.08)]";
  if (status === "running") return "border-[#161FAD]/35 bg-[rgba(23,36,216,0.08)] shadow-[0_14px_30px_rgba(23,36,216,0.16)]";
  return "border-slate-200 bg-white/92 shadow-[0_8px_18px_rgba(15,23,42,0.035)]";
}

function flowEdgeColor(status: StepStatus) {
  if (status === "done") return "#34d399";
  if (status === "running") return "#161FAD";
  return "#cbd5e1";
}

function flowStatusLabel(status: StepStatus, text: typeof copy.zh | typeof copy.en) {
  if (status === "done") return text.statusDone;
  if (status === "running") return text.statusRunning;
  return text.statusWaiting;
}

function getFlowDisplayStatus(steps: PlanStep[], index: number): StepStatus {
  const allWaiting = steps.length > 0 && steps.every((step) => step.status === "waiting");
  if (!allWaiting) return steps[index]?.status === "failed" ? "waiting" : steps[index]?.status ?? "waiting";
  if (index === 0) return "done";
  if (index === 1) return "running";
  return "waiting";
}

type FlowNodePosition = {
  left: number;
  top: number;
};

const FLOW_NODE_WIDTH = 258;
const FLOW_NODE_HEIGHT = 86;
const FLOW_CANVAS_WIDTH = 560;
const FLOW_NODE_TITLES = [
  "step-01: PRODIGY 特征计算 - 提取抗体-抗原界面相互作用特征",
  "step-02: Rosetta 特征计算 - 提取结构打分与能量特征",
  "step-03: 表位-结合物特征计算 - 提取表位上下文描述符",
  "step-04: 双抗组合特征生成 - 将两个单抗臂的特征合并为双特异性抗体特征",
  "step-05: 特征相关性分析 - 筛选冗余特征并指导模型选择",
  "step-06: ML 回归建模 - 训练与评估双抗内吞功能预测模型",
];

function getFlowNodePositions(stepCount: number): FlowNodePosition[] {
  const center = 151;
  const leftBranch = 56;
  const verticalGap = 124;

  return Array.from({ length: stepCount }, (_, index) => {
    if (stepCount >= 5 && index === 3) {
      return { left: leftBranch, top: 34 + index * verticalGap };
    }

    return { left: center, top: 34 + index * verticalGap };
  });
}

function getFlowEdges(stepCount: number) {
  const sequentialEdges = Array.from({ length: Math.max(stepCount - 1, 0) }, (_, index) => ({
    from: index,
    to: index + 1,
    dashed: false,
  }));

  if (stepCount < 5) return sequentialEdges;

  return [
    ...sequentialEdges,
    { from: 2, to: 4, dashed: true },
    ...(stepCount > 5 ? [{ from: 2, to: 5, dashed: true }] : []),
  ];
}

function buildFlowPath(from: FlowNodePosition, to: FlowNodePosition) {
  const startX = from.left + FLOW_NODE_WIDTH / 2;
  const startY = from.top + FLOW_NODE_HEIGHT;
  const endX = to.left + FLOW_NODE_WIDTH / 2;
  const endY = to.top;
  const midY = startY + Math.max((endY - startY) / 2, 28);

  return `M ${startX} ${startY} C ${startX} ${midY}, ${endX} ${midY}, ${endX} ${endY}`;
}

function WorkflowFlowDrawer({
  lang,
  onOpenChange,
  open,
  steps,
}: {
  lang: Lang;
  onOpenChange: (open: boolean) => void;
  open: boolean;
  steps: PlanStep[];
}) {
  const text = copy[lang];
  const runningStepId = steps.find((step) => step.status === "running")?.id;
  const nodePositions = getFlowNodePositions(steps.length);
  const flowEdges = getFlowEdges(steps.length);
  const canvasHeight = (nodePositions.at(-1)?.top ?? 34) + FLOW_NODE_HEIGHT + 48;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" showOverlay={false} className="w-[min(720px,96vw)] gap-0 overflow-hidden border-l border-slate-200 bg-[#f8faff] p-0 sm:max-w-none">
        <SheetHeader className="border-b border-slate-200 bg-white/92 px-5 py-5">
          <SheetTitle className="flex items-center gap-2 text-[17px] font-semibold text-[#070261]">
            <GitBranch className="h-4 w-4 text-[#161FAD]" />
            {text.flowGraphTitle}
          </SheetTitle>
        </SheetHeader>

        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-5">
          <div className="overflow-x-auto rounded-[24px] border border-slate-200 bg-[linear-gradient(180deg,#ffffff_0%,#f2f6ff_100%)] px-4 py-5">
            <div
              className="relative mx-auto"
              style={{ width: FLOW_CANVAS_WIDTH, height: canvasHeight }}
            >
              <div
                className="absolute inset-0 opacity-[0.35]"
                style={{
                  backgroundImage:
                    "linear-gradient(rgba(148,163,184,0.22) 1px, transparent 1px), linear-gradient(90deg, rgba(148,163,184,0.22) 1px, transparent 1px)",
                  backgroundSize: "20px 20px",
                }}
              />

              <svg className="absolute inset-0 z-10" width={FLOW_CANVAS_WIDTH} height={canvasHeight} viewBox={`0 0 ${FLOW_CANVAS_WIDTH} ${canvasHeight}`}>
                <defs>
                  <marker id="flow-arrow" markerHeight="8" markerWidth="8" orient="auto" refX="7" refY="4">
                    <path d="M 0 0 L 8 4 L 0 8 z" fill="#64748b" />
                  </marker>
                </defs>
                {flowEdges.map((edge) => {
                  const from = nodePositions[edge.from];
                  const to = nodePositions[edge.to];
                  if (!from || !to) return null;
                  const status = getFlowDisplayStatus(steps, edge.from);
                  return (
                    <path
                      key={`${edge.from}-${edge.to}-${edge.dashed ? "dashed" : "solid"}`}
                      d={buildFlowPath(from, to)}
                      fill="none"
                      markerEnd="url(#flow-arrow)"
                      stroke={flowEdgeColor(status)}
                      strokeDasharray={edge.dashed ? "4 5" : undefined}
                      strokeLinecap="round"
                      strokeWidth={edge.dashed ? 1.3 : 1.6}
                    />
                  );
                })}
              </svg>

              {steps.map((step, index) => {
                const position = nodePositions[index];
                const displayStatus = getFlowDisplayStatus(steps, index);
                const isRunning = step.id === runningStepId || displayStatus === "running";
                const statusLabel = flowStatusLabel(displayStatus, text);
                return (
                  <article
                    key={step.id}
                    className={`absolute z-20 rounded-[12px] border px-5 py-4 text-center transition ${flowNodeClass(displayStatus)} ${
                      isRunning ? "ring-4 ring-[rgba(23,36,216,0.08)]" : ""
                    }`}
                    style={{ left: position.left, top: position.top, width: FLOW_NODE_WIDTH, minHeight: FLOW_NODE_HEIGHT }}
                  >
                    <p className="line-clamp-2 text-[12px] font-semibold leading-[1.65] text-slate-800">
                      {FLOW_NODE_TITLES[index] ?? `${step.id}: ${pick(lang, step.title)}`}
                    </p>
                    <div className="mt-2.5 flex items-center justify-center gap-2">
                      <span className="inline-flex items-center gap-1 rounded-full bg-white/85 px-2 py-0.5 text-[10px] font-semibold text-slate-500">
                        <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: flowEdgeColor(displayStatus) }} />
                        {statusLabel}
                      </span>
                    </div>
                  </article>
                );
              })}
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}

function SidePanel({
  lang,
  view,
  sideTab,
  steps,
  resultFiles,
  reports,
  selectedFileId,
  selectedFileIds,
  searchQuery,
  onSearchQueryChange,
  onSideTabChange,
  onSelectFile,
  onToggleFile,
  onToggleFiles,
  onDownloadFile,
  onDownloadReport,
  onDownloadFiles,
  onSaveFileToProject,
  onSaveFilesToProject,
  onSaveReportToProject,
}: {
  lang: Lang;
  view: ViewMode;
  sideTab: SideTab;
  steps: PlanStep[];
  resultFiles: ResultFile[];
  reports: RunReport[];
  selectedFileId: string;
  selectedFileIds: string[];
  searchQuery: string;
  onSearchQueryChange: (value: string) => void;
  onSideTabChange: (tab: SideTab) => void;
  onSelectFile: (id: string) => void;
  onToggleFile: (id: string) => void;
  onToggleFiles: (ids: string[], checked: boolean) => void;
  onDownloadFile: (file: ResultFile) => void;
  onDownloadReport: (report: RunReport) => void;
  onDownloadFiles: (files: ResultFile[]) => void;
  onSaveFileToProject: (file: ResultFile) => void;
  onSaveFilesToProject: (files: ResultFile[]) => void;
  onSaveReportToProject: (report: RunReport) => void;
}) {
  const text = copy[lang];
  const showEmpty = view === "new";
  const [flowOpen, setFlowOpen] = useState(false);
  const [historyExpanded, setHistoryExpanded] = useState(false);
  const [expandedPreviousRunIds, setExpandedPreviousRunIds] = useState<string[]>([]);
  const progressPercent = useMemo(() => {
    const doneCount = steps.filter((step) => step.status === "done").length;
    const hasRunning = steps.some((step) => step.status === "running");
    return Math.round(((doneCount + (hasRunning ? 0.55 : 0)) / steps.length) * 100);
  }, [steps]);

  const filteredFiles = useMemo(() => {
    const keyword = searchQuery.trim().toLowerCase();
    if (!keyword) return resultFiles;
    return resultFiles.filter((file) => `${file.name} ${pick(lang, file.step)}`.toLowerCase().includes(keyword));
  }, [lang, resultFiles, searchQuery]);

  const groupedFiles = useMemo(() => {
    return filteredFiles.reduce<Record<string, ResultFile[]>>((acc, file) => {
      const key = pick(lang, file.step);
      if (!acc[key]) acc[key] = [];
      acc[key].push(file);
      return acc;
    }, {});
  }, [filteredFiles, lang]);

  const previousRunItems = historyRunItems.slice(1);
  const filteredPreviousRunItems = useMemo(() => {
    const keyword = searchQuery.trim().toLowerCase();
    if (!keyword) return previousRunItems;
    return previousRunItems.filter((run) => {
      const runText = `${pick(lang, run.title)} ${pick(lang, run.summaryLine)} ${pick(lang, run.reason)} ${run.files
        .map((file) => `${file.name} ${pick(lang, file.meta)}`)
        .join(" ")}`.toLowerCase();
      return runText.includes(keyword);
    });
  }, [lang, previousRunItems, searchQuery]);

  const selectableFiles = useMemo(
    () => [
      ...resultFiles,
      ...previousRunItems.flatMap((run) => run.files.map((file) => resultFileFromHistoryFile(run, file))),
    ],
    [previousRunItems, resultFiles],
  );
  const selectedFiles = useMemo(
    () => selectableFiles.filter((file) => selectedFileIds.includes(file.id)),
    [selectableFiles, selectedFileIds],
  );

  const hasResultMatches = Object.entries(groupedFiles).length > 0 || filteredPreviousRunItems.length > 0;

  const togglePreviousRun = (runId: string) => {
    setExpandedPreviousRunIds((current) => (current.includes(runId) ? current.filter((id) => id !== runId) : [...current, runId]));
  };

  const handleToggleFileGroup = (files: ResultFile[]) => {
    const ids = files.map((file) => file.id);
    const allSelected = ids.every((id) => selectedFileIds.includes(id));
    onToggleFiles(ids, !allSelected);
  };

  return (
    <aside className="flex h-full min-h-0 flex-col rounded-[24px] border border-white/70 bg-white/84 shadow-[0_16px_40px_rgba(15,23,42,0.045)] backdrop-blur">
      <div className="border-b border-slate-200/80 px-4 py-4">
        <div className="inline-flex rounded-2xl border border-slate-200 bg-slate-50 p-1">
          {[
            { id: "plan" as SideTab, label: text.plan },
            { id: "results" as SideTab, label: text.results },
            { id: "reports" as SideTab, label: text.reports },
          ].map((tab) => {
            const active = sideTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => onSideTabChange(tab.id)}
                className={`rounded-xl px-3 py-2 text-[12px] font-medium transition ${
                  active ? "bg-white text-[#161FAD] shadow-[0_6px_16px_rgba(15,23,42,0.06)]" : "text-slate-500 hover:text-slate-700"
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4">
        {sideTab === "plan" ? (
          showEmpty ? (
            <div className="rounded-[20px] border border-dashed border-slate-200 bg-slate-50/70 p-5">
              <p className="text-[11px] uppercase tracking-[0.18em] text-slate-400">{text.plan}</p>
              <h3 className="mt-1 text-[15px] font-semibold text-[#070261]">{text.waitingPlan}</h3>
              <p className="mt-3 text-[12px] leading-6 text-slate-500">{text.waitingPlanBody}</p>
            </div>
          ) : (
            <div>
              <div className="mb-4 pt-1">
                <div className="mb-1 flex items-center justify-between gap-2 text-[11px] text-slate-400">
                  <span>{text.overallProgress}</span>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setFlowOpen(true)}
                      className="inline-flex items-center gap-1 rounded-full border border-[rgba(23,36,216,0.12)] bg-white px-2 py-1 text-[10px] font-semibold text-[#161FAD] transition hover:bg-[rgba(23,36,216,0.06)] active:scale-[0.97]"
                    >
                      <GitBranch className="h-3 w-3" />
                      {text.flowGraph}
                    </button>
                  </div>
                </div>
                <div className="h-2 rounded-full bg-slate-100">
                  <div
                    className="h-2 rounded-full bg-[linear-gradient(90deg,#161FAD_0%,#848CFE_68%,#FFC997_100%)]"
                    style={{ width: `${progressPercent}%` }}
                  />
                </div>
              </div>
              <WorkflowFlowDrawer lang={lang} open={flowOpen} steps={steps} onOpenChange={setFlowOpen} />
              <div className="space-y-3">
                {steps.map((step) => {
                  const style = statusStyles[step.status];
                  const iconDone = step.status === "done";
                  const message =
                    step.status === "done"
                      ? pick(lang, step.summary)
                      : step.status === "running"
                        ? pick(lang, step.detail)
                        : pick(lang, step.waiting);
                  const messageTone =
                    step.status === "running"
                      ? "text-[#8a5216]"
                      : step.status === "done"
                        ? "text-slate-500"
                        : "text-slate-400";
                  return (
                    <article key={step.id} className="rounded-[18px] border border-slate-100 bg-slate-50/90 p-3.5">
                      <div className="flex items-start gap-3">
                        <div className={`mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full border ${style.icon}`}>
                          {iconDone ? <CheckCircle2 className="h-4 w-4" /> : <CircleDashed className="h-4 w-4" />}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center justify-between gap-3">
                            <p className="text-[13px] font-semibold text-slate-800">{pick(lang, step.title)}</p>
                            <span className="text-[11px] text-slate-400">{step.duration}</span>
                          </div>
                          <p className={`mt-1 text-[11px] leading-5 ${messageTone}`}>{message}</p>
                        </div>
                      </div>
                    </article>
                  );
                })}
              </div>

            </div>
          )
        ) : sideTab === "reports" ? (
          showEmpty ? (
            <div className="rounded-[20px] border border-dashed border-slate-200 bg-slate-50/70 p-5">
              <p className="text-[11px] uppercase tracking-[0.18em] text-slate-400">{text.reports}</p>
              <h3 className="mt-1 text-[15px] font-semibold text-[#070261]">{text.finalReports}</h3>
            </div>
          ) : (
            <ReportsPanelContent
              lang={lang}
              reports={reports}
              onDownloadReport={onDownloadReport}
              onSaveReportToProject={onSaveReportToProject}
            />
          )
        ) : showEmpty ? (
          <div className="rounded-[20px] border border-dashed border-slate-200 bg-slate-50/70 p-5">
            <p className="text-[11px] uppercase tracking-[0.18em] text-slate-400">{text.results}</p>
            <h3 className="mt-1 text-[15px] font-semibold text-[#070261]">{text.emptyResults}</h3>
            <p className="mt-3 text-[12px] leading-6 text-slate-500">{text.emptyResultsBody}</p>
          </div>
        ) : (
          <div>
            <div className="mb-4 rounded-[18px] border border-slate-200 bg-slate-50/90 px-3 py-2.5">
              <div className="flex items-center gap-2 text-slate-400">
                <Search className="h-4 w-4" />
                <input
                  value={searchQuery}
                  onChange={(event) => onSearchQueryChange(event.target.value)}
                  className="w-full border-0 bg-transparent text-[13px] outline-none placeholder:text-slate-400"
                  placeholder={text.searchFiles}
                />
                {selectedFileIds.length > 0 ? (
                  <div className="flex shrink-0 items-center gap-1.5">
                    <span className="rounded-full bg-white px-2 py-1 text-[10px] font-medium text-slate-500">
                      {text.selectedCount} {selectedFileIds.length}
                    </span>
                    <button
                      onClick={() => onDownloadFiles(selectedFiles)}
                      className="inline-flex h-8 items-center gap-1 rounded-xl bg-[#161FAD] px-2.5 text-[11px] font-medium text-white transition hover:bg-[#1724D8]"
                    >
                      <ArrowDownToLine className="h-3.5 w-3.5" />
                      {text.batchDownload}
                    </button>
                    <button
                      onClick={() => onSaveFilesToProject(selectedFiles)}
                      className="inline-flex h-8 items-center gap-1 rounded-xl border border-slate-200 bg-white px-2.5 text-[11px] font-medium text-slate-600 transition hover:border-[rgba(23,36,216,0.18)] hover:text-[#161FAD]"
                    >
                      <Save className="h-3.5 w-3.5" />
                      {text.batchSave}
                    </button>
                  </div>
                ) : null}
              </div>
            </div>

            <div className="space-y-4">
              {!hasResultMatches ? (
                <div className="rounded-[18px] border border-dashed border-slate-200 bg-slate-50/70 px-4 py-5 text-[12px] leading-6 text-slate-500">
                  {text.noMatchedResults}
                </div>
              ) : (
                <>
                  {Object.entries(groupedFiles).length > 0 ? (
                    <div className="rounded-[20px] border border-slate-100 bg-white p-3.5 shadow-[0_10px_28px_rgba(15,23,42,0.035)]">
                      <div className="mb-3 flex items-center justify-between gap-2">
                        <div className="flex min-w-0 items-center gap-2">
                          <FolderOpen className="h-4 w-4 shrink-0 text-[#161FAD]" />
                          <div className="min-w-0">
                            <p className="text-[12px] font-semibold text-[#070261]">{text.currentRun}</p>
                            <p className="text-[10px] text-slate-400">{resultFiles.length} {text.filesCount}</p>
                          </div>
                        </div>
                      </div>

                      <div className="space-y-4">
                        {Object.entries(groupedFiles).map(([group, files]) => {
                          const groupSelected = files.length > 0 && files.every((file) => selectedFileIds.includes(file.id));
                          return (
                          <div key={group}>
                            <div className="mb-2 flex items-center gap-2">
                              <Checkbox
                                checked={groupSelected}
                                onCheckedChange={() => handleToggleFileGroup(files)}
                                aria-label={`${text.selectFile} ${group}`}
                              />
                              <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-slate-400">{group}</p>
                            </div>
                            <div className="space-y-2.5">
                              {files.map((file) => {
                                const active = selectedFileId === file.id;
                                const checked = selectedFileIds.includes(file.id);
                                return (
                                  <div
                                    key={file.id}
                                    className={`group flex items-start gap-3 rounded-[18px] border px-3 py-3 transition ${
                                      active
                                        ? "border-[rgba(23,36,216,0.14)] bg-[rgba(23,36,216,0.05)]"
                                        : "border-slate-100 bg-slate-50/90 hover:border-[rgba(23,36,216,0.14)] hover:bg-white"
                                    }`}
                                  >
                                    <Checkbox
                                      checked={checked}
                                      onCheckedChange={() => onToggleFile(file.id)}
                                      className="mt-2"
                                      aria-label={`${text.selectFile} ${file.name}`}
                                    />
                                    <button onClick={() => onSelectFile(file.id)} className="flex min-w-0 flex-1 items-start gap-3 text-left">
                                      <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[rgba(23,36,216,0.08)] text-[#161FAD]">
                                        <ResultTypeIcon type={file.type} />
                                      </div>
                                      <div className="min-w-0 flex-1">
                                        <p className="truncate text-[13px] font-medium text-slate-800">{file.name}</p>
                                        <p className="mt-0.5 text-[10px] text-slate-400">{pick(lang, file.meta)}</p>
                                      </div>
                                    </button>
                                    <div className="flex shrink-0 gap-1 opacity-0 transition group-hover:opacity-100">
                                      <button
                                        onClick={() => onDownloadFile(file)}
                                        className="rounded-xl p-2 text-slate-400 transition hover:bg-white hover:text-[#161FAD]"
                                        aria-label={`${text.download} ${file.name}`}
                                      >
                                        <ArrowDownToLine className="h-4 w-4" />
                                      </button>
                                      <button
                                        onClick={() => onSaveFileToProject(file)}
                                        className="rounded-xl p-2 text-slate-400 transition hover:bg-white hover:text-[#161FAD]"
                                        aria-label={`${text.saveToProjectData} ${file.name}`}
                                      >
                                        <Save className="h-4 w-4" />
                                      </button>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                          );
                        })}
                      </div>
                    </div>
                  ) : null}

                  {filteredPreviousRunItems.map((run) => {
                    const runExpanded = expandedPreviousRunIds.includes(run.id);
                    const runLabel = run.id.replace("run-", "Run #");
                    const runFiles = run.files.map((file) => resultFileFromHistoryFile(run, file));
                    const runSelected = runFiles.length > 0 && runFiles.every((file) => selectedFileIds.includes(file.id));
                    return (
                      <div key={run.id} className="rounded-[20px] border border-slate-100 bg-white p-3.5 shadow-[0_10px_28px_rgba(15,23,42,0.035)]">
                        <div className="flex w-full items-center justify-between gap-3">
                          <div className="flex min-w-0 items-center gap-2.5">
                            <Checkbox
                              checked={runSelected}
                              onCheckedChange={() => handleToggleFileGroup(runFiles)}
                              aria-label={`${text.selectFile} ${runLabel}`}
                            />
                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-slate-50 text-[#161FAD]">
                              {runExpanded ? <FolderOpen className="h-4 w-4" /> : <Folder className="h-4 w-4" />}
                            </div>
                            <button onClick={() => togglePreviousRun(run.id)} className="truncate text-left text-[13px] font-semibold text-[#070261]">
                              {runLabel}
                            </button>
                          </div>
                          <button onClick={() => togglePreviousRun(run.id)}>
                            <ChevronDown className={`h-4 w-4 shrink-0 text-slate-400 transition ${runExpanded ? "rotate-180" : ""}`} />
                          </button>
                        </div>

                        {runExpanded ? (
                          <div className="mt-3 space-y-2 border-t border-slate-100 pt-3">
                            {runFiles.map((historyFile) => {
                              return (
                                <div key={historyFile.id} className="group flex items-center gap-3 rounded-[16px] border border-slate-100 bg-slate-50/90 px-3 py-2.5">
                                  <Checkbox
                                    checked={selectedFileIds.includes(historyFile.id)}
                                    onCheckedChange={() => onToggleFile(historyFile.id)}
                                    aria-label={`${text.selectFile} ${historyFile.name}`}
                                  />
                                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl bg-[rgba(23,36,216,0.08)] text-[#161FAD]">
                                    <ResultTypeIcon type={historyFile.type} />
                                  </div>
                                  <div className="min-w-0 flex-1">
                                    <p className="truncate text-[12px] font-medium text-slate-800">{historyFile.name}</p>
                                    <p className="mt-0.5 text-[10px] text-slate-400">{pick(lang, historyFile.meta)}</p>
                                  </div>
                                  <div className="flex shrink-0 gap-1 opacity-0 transition group-hover:opacity-100">
                                    <button
                                      onClick={() => onDownloadFile(historyFile)}
                                      className="rounded-xl p-2 text-slate-400 transition hover:bg-white hover:text-[#161FAD]"
                                      aria-label={`${text.download} ${historyFile.name}`}
                                    >
                                      <ArrowDownToLine className="h-4 w-4" />
                                    </button>
                                    <button
                                      onClick={() => onSaveFileToProject(historyFile)}
                                      className="rounded-xl p-2 text-slate-400 transition hover:bg-white hover:text-[#161FAD]"
                                      aria-label={`${text.saveToProjectData} ${historyFile.name}`}
                                    >
                                      <Save className="h-4 w-4" />
                                    </button>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        ) : null}
                      </div>
                    );
                  })}
                </>
              )}
            </div>
          </div>
        )}
      </div>

      {!showEmpty ? (
        <div
          className={`shrink-0 border-t border-slate-200/80 bg-white/86 transition-[height] duration-300 ${
            historyExpanded ? "flex h-[52%] min-h-[320px] flex-col" : "h-[52px]"
          }`}
        >
          <button
            onClick={() => setHistoryExpanded((current) => !current)}
            className="flex h-[52px] w-full items-center justify-between gap-3 px-4 text-left transition hover:bg-slate-50/80"
          >
            <div className="flex min-w-0 items-center gap-2.5">
              <History className="h-4 w-4 shrink-0 text-[#161FAD]" />
              <div className="min-w-0">
                <p className="text-[13px] font-semibold text-[#070261]">{text.history}</p>
                <p className="truncate text-[10px] text-slate-400">{pick(lang, historyRunItems[0].summaryLine)}</p>
              </div>
            </div>
            <ChevronDown className={`h-4 w-4 shrink-0 text-slate-400 transition ${historyExpanded ? "rotate-180" : ""}`} />
          </button>

          {historyExpanded ? (
            <div className="min-h-0 flex-1 overflow-y-auto px-4 pb-4 pt-1">
              <HistoryPanelContent lang={lang} />
            </div>
          ) : null}
        </div>
      ) : null}
    </aside>
  );
}

export default function Home() {
  const { activeProject, addProjectDataAsset, mainView, setMainView } = useProject();
  const [lang, setLang] = useState<Lang>("zh");
  const [activeView, setActiveView] = useState<ViewMode>("new");
  const [activeScenarioId, setActiveScenarioId] = useState<ScenarioId>("dll3");
  const [sideTab, setSideTab] = useState<SideTab>("plan");
  const [composerValue, setComposerValue] = useState("");
  const [selectedFileId, setSelectedFileId] = useState<string>("");
  const [selectedFileIds, setSelectedFileIds] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [attachDialogVariant, setAttachDialogVariant] = useState<"upload" | "resource" | null>(null);
  const [attachedInputs, setAttachedInputs] = useState<AttachedInput[]>([]);
  const activeScenario = demoScenarios[activeScenarioId];
  const [runtimeSteps, setRuntimeSteps] = useState<PlanStep[]>(() =>
    demoScenarios.dll3.steps.map((step): PlanStep => ({ ...step, status: "waiting" })),
  );
  const [workflowCompleted, setWorkflowCompleted] = useState(false);
  const menuBoundaryRef = useRef<HTMLDivElement | null>(null);
  const workflowTimerRef = useRef<number | null>(null);
  const text = copy[lang];

  useEffect(() => {
    const stored = window.localStorage.getItem("ailux-agent-lang");
    if (stored === "zh" || stored === "en") {
      setLang(stored);
    }
  }, []);

  useEffect(() => {
    window.localStorage.setItem("ailux-agent-lang", lang);
  }, [lang]);

  useEffect(() => {
    const handlePointerDown = (event: MouseEvent) => {
      if (!menuBoundaryRef.current?.contains(event.target as Node)) {
        setUserMenuOpen(false);
      }
    };

    document.addEventListener("mousedown", handlePointerDown);
    return () => document.removeEventListener("mousedown", handlePointerDown);
  }, []);

  useEffect(() => {
    if (activeView === "new" || workflowCompleted) {
      if (workflowTimerRef.current) {
        window.clearTimeout(workflowTimerRef.current);
        workflowTimerRef.current = null;
      }
      return;
    }

    const currentStepIndex = runtimeSteps.findIndex((step) => step.status === "running");
    if (currentStepIndex === -1) return;

    workflowTimerRef.current = window.setTimeout(() => {
      const isLastStep = currentStepIndex === runtimeSteps.length - 1;
      setRuntimeSteps((current) =>
        current.map((step, index) => {
          if (index < currentStepIndex) return { ...step, status: "done" };
          if (index === currentStepIndex) return { ...step, status: "done" };
          if (!isLastStep && index === currentStepIndex + 1) return { ...step, status: "running" };
          return { ...step, status: step.status === "done" ? "done" : "waiting" };
        }),
      );

      if (isLastStep) {
        setWorkflowCompleted(true);
      }
    }, runningStepDurationsMs[currentStepIndex] ?? 1500);

    return () => {
      if (workflowTimerRef.current) {
        window.clearTimeout(workflowTimerRef.current);
        workflowTimerRef.current = null;
      }
    };
  }, [activeView, runtimeSteps, workflowCompleted]);

  const selectedFile = activeScenario.resultFiles.find((file) => file.id === selectedFileId) ?? null;

  const handlePromptPick = (prompt: RecommendedPrompt) => {
    const scenario = demoScenarios[prompt.id];
    setActiveScenarioId(prompt.id);
    setRuntimeSteps(scenario.steps.map((step): PlanStep => ({ ...step, status: "waiting" })));
    setWorkflowCompleted(false);
    setSelectedFileId("");
    setSelectedFileIds([]);
    setSearchQuery("");
    setSideTab("plan");
    setComposerValue(pick(lang, prompt.text));
    setAttachedInputs([]);
  };

  const handleStart = () => {
    setRuntimeSteps(
      activeScenarioId === "a2ui"
        ? activeScenario.steps.map((step): PlanStep => ({ ...step, status: "waiting" }))
        : createRuntimeSteps(activeScenario.steps),
    );
    setWorkflowCompleted(false);
    setMainView("workspace");
    setActiveView("running");
    setSideTab("plan");
    setComposerValue("");
  };

  const handleContinueRun = () => {
    setWorkflowCompleted(false);
    setRuntimeSteps((current) => {
      if (current.some((step) => step.status === "running") || current.every((step) => step.status === "done")) {
        return current;
      }

      const nextIndex = current.findIndex((step) => step.status === "waiting" || step.status === "failed");
      if (nextIndex === -1) return current;

      return current.map((step, index) => (index === nextIndex ? { ...step, status: "running" } : step));
    });
  };

  const handleViewCurrentResults = () => {
    setMainView("workspace");
    setActiveView("result");
    setSideTab("results");
  };

  const handleNewConversation = () => {
    if (workflowTimerRef.current) {
      window.clearTimeout(workflowTimerRef.current);
      workflowTimerRef.current = null;
    }
    setActiveScenarioId("dll3");
    setRuntimeSteps(demoScenarios.dll3.steps.map((step): PlanStep => ({ ...step, status: "waiting" })));
    setWorkflowCompleted(false);
    setMainView("workspace");
    setActiveView("new");
    setSideTab("plan");
    setComposerValue("");
    setSelectedFileId("");
    setSelectedFileIds([]);
    setSearchQuery("");
    setUserMenuOpen(false);
    setAttachedInputs([]);
  };

  const handleAttachInputs = (items: AttachedInput[]) => {
    setAttachedInputs((current) => {
      const next = [...current];
      items.forEach((item) => {
        const index = next.findIndex((existing) => existing.id === item.id);
        if (index >= 0) {
          next[index] = item;
        } else {
          next.push(item);
        }
      });
      return next;
    });
    toast.success(`${text.attachedContext}: ${items.length}`);
  };

  const handleRemoveAttachedInput = (id: string) => {
    setAttachedInputs((current) => current.filter((item) => item.id !== id));
  };

  const handleSelectFile = (id: string) => {
    setSelectedFileId(id);
    setSideTab("results");
    setActiveView("result");
  };

  const handleToggleFile = (id: string) => {
    setSelectedFileIds((current) => (current.includes(id) ? current.filter((item) => item !== id) : [...current, id]));
  };

  const handleToggleFiles = (ids: string[], checked: boolean) => {
    setSelectedFileIds((current) => {
      if (checked) {
        return Array.from(new Set([...current, ...ids]));
      }

      return current.filter((id) => !ids.includes(id));
    });
  };

  const handleDownloadFile = (file: ResultFile) => {
    downloadResultFile(file, lang);
    toast.success(`${text.downloading} ${file.name}`);
  };

  const handleDownloadReport = (report: RunReport) => {
    downloadReportFile(report, lang);
    toast.success(`${text.downloading} ${report.fileName}`);
  };

  const handleDownloadFiles = (files: ResultFile[]) => {
    if (files.length === 0) {
      toast.message(text.selectBeforeExport);
      return;
    }

    files.forEach((file, index) => {
      window.setTimeout(() => downloadResultFile(file, lang), index * 120);
    });
    toast.success(`${text.downloadedFiles} ${files.length} ${text.exportedSuffix}`);
  };

  const showSaveResultToast = (result: "created" | "existing", fileName: string) => {
    if (result === "existing") {
      toast.message(`${text.alreadyInProjectData}: ${fileName}`);
      return;
    }

    toast.success(`${text.savedToProjectData}: ${fileName}`);
  };

  const handleSaveFileToProject = (file: ResultFile) => {
    const result = addProjectDataAsset(activeProject.id, dataAssetFromResultFile(file));
    showSaveResultToast(result, file.name);
  };

  const handleSaveReportToProject = (report: RunReport) => {
    const result = addProjectDataAsset(activeProject.id, dataAssetFromReport(report));
    showSaveResultToast(result, report.fileName);
  };

  const handleSaveFilesToProject = (files: ResultFile[]) => {
    if (files.length === 0) {
      toast.message(text.selectBeforeExport);
      return;
    }

    const createdCount = files.reduce((count, file) => {
      const result = addProjectDataAsset(activeProject.id, dataAssetFromResultFile(file));
      return result === "created" ? count + 1 : count;
    }, 0);

    if (createdCount === 0) {
      toast.message(text.alreadyInProjectData);
      return;
    }

    toast.success(`${text.savedFilesToProject} ${createdCount} ${text.exportedSuffix}`);
  };

  const handleUserMenuAction = (action: "profile" | "network" | "language" | "logout") => {
    if (action === "language") {
      const nextLang: Lang = lang === "zh" ? "en" : "zh";
      setLang(nextLang);
      setUserMenuOpen(false);
      toast.success(nextLang === "en" ? copy.zh.switchedToEnglish : copy.en.switchedToChinese);
      return;
    }

    if (action === "profile") {
      setMainView("user-center");
      setUserMenuOpen(false);
      return;
    }

    setUserMenuOpen(false);
    toast.message(text.comingSoon);
  };

  return (
    <div className="h-screen overflow-hidden bg-[linear-gradient(180deg,#f8faff_0%,#eef3ff_100%)] text-slate-900">
      <div className="mx-auto flex h-full max-w-[1680px] flex-col p-4 lg:p-5">
        <div
          ref={menuBoundaryRef}
          className={`grid min-h-0 flex-1 gap-4 ${
            mainView !== "workspace" || activeView === "new"
              ? "xl:grid-cols-[260px_minmax(0,1fr)]"
              : activeView === "result"
                ? "xl:grid-cols-[88px_minmax(0,1fr)_360px]"
                : "xl:grid-cols-[260px_minmax(0,1fr)_360px]"
          }`}
        >
          <Sidebar
            activeView={activeView}
            lang={lang}
            userMenuOpen={userMenuOpen}
            onNewConversation={() => { setMainView("workspace"); handleNewConversation(); }}
            onToggleUserMenu={() => setUserMenuOpen((current) => !current)}
            onUserMenuAction={handleUserMenuAction}
            collapsed={mainView === "workspace" && activeView === "result"}
          />

          {mainView === "project-detail" ? (
            <ProjectPanel lang={lang} />
          ) : mainView === "resource" ? (
            <ResourcePanel lang={lang} />
          ) : mainView === "create-project" ? (
            <CreateProjectView lang={lang} />
          ) : mainView === "user-center" ? (
            <UserCenter lang={lang} />
          ) : activeView === "new" ? (
            <NewTaskWorkspace
              attachedInputs={attachedInputs}
              lang={lang}
              prompt={composerValue}
              onOpenResourceDialog={() => setAttachDialogVariant("resource")}
              onOpenUploadDialog={() => setAttachDialogVariant("upload")}
              onPromptChange={setComposerValue}
              onPromptPick={handlePromptPick}
              onRemoveAttachedInput={handleRemoveAttachedInput}
              onStart={handleStart}
            />
          ) : (
            <RunningWorkspace
              attachedInputs={attachedInputs}
              lang={lang}
              title={activeScenario.title}
              messages={activeScenario.messages}
              reports={activeScenario.reports}
              prompt={composerValue}
              onDownloadReport={handleDownloadReport}
              onOpenResourceDialog={() => setAttachDialogVariant("resource")}
              onOpenUploadDialog={() => setAttachDialogVariant("upload")}
              onPromptChange={setComposerValue}
              onRemoveAttachedInput={handleRemoveAttachedInput}
              onSaveReportToProject={handleSaveReportToProject}
              onContinueRun={handleContinueRun}
              onViewResults={handleViewCurrentResults}
              steps={runtimeSteps}
              workflowCompleted={workflowCompleted}
              compact={activeView === "result"}
            />
          )}

          {mainView === "workspace" && activeView !== "new" ? (
            <SidePanel
              lang={lang}
              view={activeView}
              sideTab={sideTab}
              steps={runtimeSteps}
              resultFiles={activeScenario.resultFiles}
              reports={activeScenario.reports}
              selectedFileId={selectedFileId}
              selectedFileIds={selectedFileIds}
              searchQuery={searchQuery}
              onSearchQueryChange={setSearchQuery}
              onSideTabChange={setSideTab}
              onSelectFile={handleSelectFile}
              onToggleFile={handleToggleFile}
              onToggleFiles={handleToggleFiles}
              onDownloadFile={handleDownloadFile}
              onDownloadReport={handleDownloadReport}
              onDownloadFiles={handleDownloadFiles}
              onSaveFileToProject={handleSaveFileToProject}
              onSaveFilesToProject={handleSaveFilesToProject}
              onSaveReportToProject={handleSaveReportToProject}
            />
          ) : null}
        </div>
        <FilePreviewDrawer
          lang={lang}
          file={selectedFile}
          onOpenChange={(open) => {
            if (!open) setSelectedFileId("");
          }}
          onDownloadFile={handleDownloadFile}
          onSaveFileToProject={handleSaveFileToProject}
        />
        <AttachDataDialog
          lang={lang}
          open={attachDialogVariant !== null}
          projectData={activeProject.data}
          variant={attachDialogVariant ?? "upload"}
          onAttach={handleAttachInputs}
          onOpenChange={(open) => {
            if (!open) setAttachDialogVariant(null);
          }}
        />
      </div>
    </div>
  );
}
