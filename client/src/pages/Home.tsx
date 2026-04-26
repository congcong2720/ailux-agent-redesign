/*
Design reminder for this file:
- Build the product around three core screens: new task, running workspace, final results
- Preserve the Ailux blue system and restrained product feel from the UI specification
- Keep the shell stable: left task rail + center primary workspace + right plan/result side panel
- Prioritize clarity, traceability, and result consumption over decorative storytelling
- Language switching should feel native rather than layered on top; avoid mixed-language headings in a single mode
*/
import { useEffect, useMemo, useRef, useState } from "react";
import { PdbViewer } from "@/components/PdbViewer";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { demoPdbContent, demoPdbName } from "@/lib/demoPdb";
import {
  ArrowDownToLine,
  ArrowUpRight,
  Bot,
  CheckCircle2,
  CircleDashed,
  Database,
  FileJson,
  FileSpreadsheet,
  FileText,
  FlaskConical,
  Globe2,
  LogOut,
  PanelRightOpen,
  Plus,
  Search,
  SendHorizonal,
  Sparkles,
  Upload,
  UserCircle2,
  WandSparkles,
  X,
} from "lucide-react";
import { toast } from "sonner";

type Lang = "zh" | "en";
type ViewMode = "new" | "running" | "result";
type SideTab = "plan" | "results";
type StepStatus = "done" | "running" | "waiting" | "failed";
type ResultType = "csv" | "json" | "png" | "xlsx" | "pdb";

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

type RunningMessage = {
  role: "user" | "agent";
  content: LocalizedText;
  time: string;
};

const l = (zh: string, en: string): LocalizedText => ({ zh, en });
const pick = (lang: Lang, value: LocalizedText) => value[lang];

const historyTasks: HistoryTask[] = [
  { id: "draft", title: l("新对话", "New conversation"), meta: l("创建任务", "Create task"), isDraft: true },
  {
    id: "t1",
    title: l("内化预测建模工作流程", "Internalization Predictive Modeling Workflow"),
    meta: l("当前任务", "Current task"),
  },
  { id: "t2", title: l("内吞特征关联分析", "Endocytosis feature analysis"), meta: l("3 分钟前", "3 min ago") },
  { id: "t3", title: l("EGFR 抗体优化", "EGFR antibody optimization"), meta: l("昨天 18:20", "Yesterday 18:20") },
  { id: "t4", title: l("CDR 区域内吞影响评估", "CDR region impact assessment"), meta: l("04-12 14:32", "04-12 14:32") },
];

const recommendedPrompts = [
  l(
    "基于输入的实验数据，分析与双表位抗体内化（内吞作用）相关的特征。设计并构建一个预测模型，对这种内化活性进行评分。",
    "Based on input experimental data, analyze the features correlated with biparatopic antibody internalization (endocytosis). Design and build a predictive model to score this internalization activity.",
  ),
  l("给我一条 DLL3 双抗功能预测的固定分析流程，并说明每步输出", "Give me a fixed DLL3 bispecific analysis workflow and explain the output of each step."),
  l("输入 PDB 与 CSV 后，帮我生成结构、特征和结果解释报告", "After I provide PDB and CSV files, generate a structure, feature, and result interpretation report."),
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
      "启动内部化预测建模工作流程。我将从输入数据中提取结构证据、界面表征、特征计算和特征选择输出、可解释性工件以及预测模型评估结果。",
      "Starting the internalization predictive-modeling workflow. I will surface structure evidence, interface characterization, feature-calculation and feature-selection outputs, explainability artifacts, and predictive model evaluation results from the input data.",
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
      "页面正在加载记录的证据包，并初始化内部化预测建模工作流程。",
      "The page is loading the recorded evidence bundle and initializing the internalization predictive-modeling workflow.",
    ),
    duration: "12s",
    status: "waiting",
    summary: l(
      "工作流已建立数据摄取上下文，并为下游分析准备了带标签的建模输入。",
      "The workflow has established data-intake context and prepared labeled modeling inputs for downstream analysis.",
    ),
  },
  {
    id: "step-2",
    title: l("结构预测", "Structure Prediction"),
    waiting: l("等待数据摄取与准备完成后启动。", "Waiting for data intake and preparation to finish."),
    detail: l(
      "工作流正在关联源 PDB 文件并生成 Molstar 结构视图。",
      "The workflow is linking the source PDB file and generating the Molstar structure view.",
    ),
    duration: "26s",
    status: "waiting",
    summary: l(
      "结构证据已准备就绪。工作流程已关联源 PDB 文件并生成了 Molstar 结构视图。",
      "Structure evidence is ready. The workflow has linked the source PDB file and generated the Molstar structure view.",
    ),
  },
  {
    id: "step-3",
    title: l("界面表征", "Interface Characterization"),
    waiting: l("等待结构预测完成后启动。", "Waiting for structure prediction to finish."),
    detail: l(
      "工作流正在从 interface.csv 加载接口定义，并渲染界面表征结果。",
      "The workflow is loading interface definitions from interface.csv and rendering interface characterization.",
    ),
    duration: "18s",
    status: "waiting",
    summary: l(
      "接口定义已从 interface.csv 加载，接口特征正在渲染中。",
      "Interface definition has been loaded from interface.csv, and interface characterization is being rendered.",
    ),
  },
  {
    id: "step-4",
    title: l("特征计算", "Feature Calculation"),
    waiting: l("等待界面表征完成后启动。", "Waiting for interface characterization to finish."),
    detail: l(
      "工作流正在计算模型特征，并从组合特征源中组装紧凑分析表。",
      "The workflow is calculating model features and assembling the compact analysis table from the combined feature source.",
    ),
    duration: "31s",
    status: "waiting",
    summary: l(
      "相关性分析和特征选择的输出已准备好，包括前 k 个重要性图和转换后的重要性表。",
      "Correlation analysis and feature-selection outputs are ready, including the top-k importance plot and transformed importance table.",
    ),
  },
  {
    id: "step-5",
    title: l("相关性分析与特征选择", "Correlation Analysis And Feature Selection"),
    waiting: l("等待特征计算完成后启动。", "Waiting for feature calculation to finish."),
    detail: l(
      "可解释性模型工件已加载，可解释性输出正在被记录以便展示。",
      "Explainability model artifacts are loaded, and explainability outputs are being recorded for display.",
    ),
    duration: "24s",
    status: "waiting",
    summary: l(
      "模型可解释性已就绪。模型工件元数据和可解释性状态在本阶段可用。",
      "Model explainability is ready. Model artifact metadata and explainability status are available in this stage.",
    ),
  },
  {
    id: "step-6",
    title: l("模型可解释性", "Model Explainability"),
    waiting: l("等待相关性分析与特征选择完成后启动。", "Waiting for correlation analysis and feature selection to finish."),
    detail: l(
      "该工作流通过将 psc 映射为标签字段、将 ranking_score 映射为预测字段来评估预测结果。",
      "The workflow is evaluating predictions by mapping psc as the label field and ranking_score as the prediction field.",
    ),
    duration: "17s",
    status: "waiting",
    summary: l(
      "预测模型评估已完成，输出预测值与观测值散点图和残差分布图。",
      "Predictive model evaluation is ready with predicted-vs-observed scatter and residual distribution outputs.",
    ),
  },
  {
    id: "step-7",
    title: l("预测模型评估", "Predictive Model Evaluation"),
    waiting: l("等待模型可解释性完成后启动。", "Waiting for model explainability to finish."),
    detail: l(
      "正在汇总命中表与模型比较结果，生成最终运行总结。",
      "The workflow is consolidating the hit table and model-comparison outputs to generate the final run summary.",
    ),
    duration: "22s",
    status: "waiting",
    summary: l(
      "运行总结结果：命中表确认了排名靠前的内化特征以及模型比较中表现最佳的 AI 模型。",
      "Run summary result: the hit table confirms the top-ranked internalization features and the best-performing AI model from model comparison.",
    ),
  },
];

const resultFiles: ResultFile[] = [
  {
    id: "structure-source",
    name: demoPdbName,
    meta: l("结构源文件", "Structure source file"),
    step: l("步骤 2 · 结构预测", "Step 2 · Structure prediction"),
    type: "pdb",
  },
  {
    id: "interface-definition",
    name: "interface.csv",
    meta: l("接口定义文件", "Interface definition file"),
    step: l("步骤 3 · 界面表征", "Step 3 · Interface characterization"),
    type: "csv",
  },
  {
    id: "feature-importance-table",
    name: "v3_importance_from_mcb008.csv",
    meta: l("特征重要性表", "Feature-importance table"),
    step: l("步骤 4 · 特征计算", "Step 4 · Feature calculation"),
    type: "csv",
  },
  {
    id: "feature-importance-plot",
    name: "importance_topk.png",
    meta: l("特征重要性图", "Feature-importance plot"),
    step: l("步骤 5 · 相关性分析与特征选择", "Step 5 · Correlation analysis and feature selection"),
    type: "png",
  },
  {
    id: "hit-table-all-features",
    name: "top10_aug_regression_10nM_importance_analysis_result_all_features_importance.csv",
    meta: l("命中表全特征文件", "Hit-table all-features file"),
    step: l("步骤 6 · 模型可解释性", "Step 6 · Model explainability"),
    type: "csv",
  },
  {
    id: "final-model-evaluation-table",
    name: "all_ml_evaluation_results_stage2.csv",
    meta: l("最终模型评估表", "Final model-evaluation table"),
    step: l("步骤 7 · 预测模型评估", "Step 7 · Predictive model evaluation"),
    type: "csv",
  },
  {
    id: "evaluation-plot",
    name: "regression_scatter.png",
    meta: l("评估图", "Evaluation plot"),
    step: l("步骤 7 · 预测模型评估", "Step 7 · Predictive model evaluation"),
    type: "png",
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

const runningStepDurationsMs = [1400, 1500, 1400, 1700, 1500, 1600, 1600];

const createRuntimeSteps = (): PlanStep[] =>
  runningSteps.map((step, index): PlanStep => ({
    ...step,
    status: index === 0 ? "running" : "waiting",
  }));

const copy = {
  zh: {
    platformSubtitle: "智能体平台",
    newConversation: "新对话",
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
    send: "发送",
    conversation: "聊天",
    runningTitle: "内化预测建模工作流程",
    runningPlaceholder: "继续向 Agent 追问，例如：请解释为什么共定位评分是最高贡献特征。",
    fileTabHint: "从右侧结果文件列表打开一个文件后，会在这里显示当前文件标签。",
    noOpenedFile:
      "当前未打开任何结果文件。请从最右侧结果文件列表选择需要查看的文件，系统会在此区域展示对应预览，同时左侧对话区保持可追问。",
    closeFile: "关闭",
    downloadFile: "下载文件",
    tableFooter: "仅展示前 100 行。下载文件可查看完整数据。",
    modelSummary: "模型比较摘要",
    conclusion: "结论建议",
    conclusionBody:
      "以下是你应该如何阅读此表格：重点关注四列。较高的 test_r2_mean 意味着更好的回归拟合，较高的 test_spearman_mean 意味着更好的排名一致性，较低的 test_mse_mean 意味着较低的预测误差，而较高的 test_pearson_mean 意味着更强的线性一致性。",
    finalSummaryTitle: "最终总结",
    finalSummaryBody:
      "以下是你应该如何阅读此表格：重点关注四列。较高的 test_r2_mean 意味着更好的回归拟合，较高的 test_spearman_mean 意味着更好的排名一致性，较低的 test_mse_mean 意味着较低的预测误差，而较高的 test_pearson_mean 意味着更强的线性一致性。",
    finalSummaryOutcome:
      "对于此演示页面，推荐文本固定为 all_ml_evaluation_results_stage2.csv 中的当前排名结果。AI 结论：任务完成。模型评估结果推荐使用 target_colocalization、KD_arm1_nM 与 XGBoost 模型的组合。",
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
    waitingPlan: "等待生成计划",
    waitingPlanBody: "首条消息发送成功后，右侧会生成当前任务对应的步骤计划、进度条和每一步的执行摘要。当前新任务态不会展示旧任务数据。",
    overallProgress: "整体进度",
    emptyResults: "暂无结果文件",
    emptyResultsBody: "当任务启动后，系统会按步骤将数据集、图像、日志、JSON 汇总等文件增量写入当前任务的结果区，并支持按文件名搜索。",
    exportSelected: "导出所选",
    searchFiles: "搜索文件",
    noMatchedResults: "没有匹配的结果文件，请尝试其他关键词。",
    selectFile: "选择",
    download: "下载",
    downloading: "已开始下载",
    selectBeforeExport: "请先选择需要导出的文件",
    exportedFiles: "已导出",
    exportedSuffix: "个文件",
  },
  en: {
    platformSubtitle: "Agent Workspace",
    newConversation: "New conversation",
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
    send: "Send",
    conversation: "Chat",
    runningTitle: "Internalization Predictive Modeling Workflow",
    runningPlaceholder: "Ask a follow-up, for example: explain why target colocalization is the top contributing feature.",
    fileTabHint: "When you open a file from the right-side results list, its tab will appear here.",
    noOpenedFile:
      "No result file is currently open. Choose a file from the right-side results list to preview it here while keeping the conversation available on the left.",
    closeFile: "Close",
    downloadFile: "Download file",
    tableFooter: "Showing the first 100 rows only. Download the file to inspect the full dataset.",
    modelSummary: "Model comparison summary",
    conclusion: "Recommendation",
    conclusionBody:
      "Here is how you should read this table: focus on four columns. Higher test_r2_mean means better regression fit, higher test_spearman_mean means better ranking consistency, lower test_mse_mean means lower prediction error, and higher test_pearson_mean means stronger linear agreement.",
    finalSummaryTitle: "Final summary",
    finalSummaryBody:
      "Here is how you should read this table: focus on four columns. Higher test_r2_mean means better regression fit, higher test_spearman_mean means better ranking consistency, lower test_mse_mean means lower prediction error, and higher test_pearson_mean means stronger linear agreement.",
    finalSummaryOutcome:
      "For this demo page, the recommendation text is fixed to the current ranked result in all_ml_evaluation_results_stage2.csv. AI conclusion: task completed. The model-evaluation result recommends the combination of target_colocalization, KD_arm1_nM, and the XGBoost model.",
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
    waitingPlan: "Plan pending",
    waitingPlanBody:
      "After the first message is sent, the right panel will generate a step-by-step plan, progress indicator, and execution summaries. Historical task data stays hidden in the new-task state.",
    overallProgress: "Overall progress",
    emptyResults: "No result files yet",
    emptyResultsBody:
      "Once the task starts, datasets, charts, logs, and JSON summaries will be written incrementally into the current result area and remain searchable by filename.",
    exportSelected: "Export selected",
    searchFiles: "Search files",
    noMatchedResults: "No result files match your query. Try another keyword.",
    selectFile: "Select",
    download: "Download",
    downloading: "Started downloading",
    selectBeforeExport: "Please select files to export first",
    exportedFiles: "Exported",
    exportedSuffix: "files",
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
        onClick={() => onAction("network")}
        className="flex w-full items-center gap-3 rounded-[14px] px-3 py-3 text-left text-[13px] font-medium text-slate-700 transition hover:bg-slate-50 hover:text-[#161FAD]"
      >
        <Search className="h-4 w-4" />
        {text.networkDiagnostic}
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

  if (collapsed) {
    return (
      <aside className="flex min-h-[760px] flex-col items-center rounded-[24px] border border-white/70 bg-white/84 p-3 shadow-[0_16px_40px_rgba(15,23,42,0.045)] backdrop-blur">
        <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-[18px] bg-[linear-gradient(135deg,#161FAD_0%,#848CFE_100%)] text-white shadow-[0_10px_22px_rgba(22,31,173,0.2)]">
          <FlaskConical className="h-5 w-5" />
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
    <aside className="flex min-h-[760px] flex-col rounded-[24px] border border-white/70 bg-white/84 p-4 shadow-[0_16px_40px_rgba(15,23,42,0.045)] backdrop-blur">
      <div className="mb-5 flex items-center gap-3 rounded-[18px] border border-slate-100 bg-slate-50/90 px-3 py-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[linear-gradient(135deg,#161FAD_0%,#848CFE_100%)] text-white shadow-[0_10px_22px_rgba(22,31,173,0.2)]">
          <FlaskConical className="h-5 w-5" />
        </div>
        <div>
          <p className="text-[11px] uppercase tracking-[0.24em] text-slate-400">Ailux Agent</p>
          <p className="text-[14px] font-semibold text-[#070261]">{text.platformSubtitle}</p>
        </div>
      </div>

      <button
        onClick={onNewConversation}
        className={`mb-4 flex w-full items-center gap-2 rounded-[18px] border px-3.5 py-3 text-left text-[13px] font-medium transition ${
          activeView === "new"
            ? "border-[rgba(23,36,216,0.12)] bg-[linear-gradient(180deg,rgba(23,36,216,0.08),rgba(132,140,254,0.08))] text-[#161FAD] shadow-[0_12px_28px_rgba(23,36,216,0.08)]"
            : "border-transparent bg-slate-50 text-slate-700 hover:border-slate-200 hover:bg-white"
        }`}
      >
        <Plus className="h-4 w-4" />
        {text.newConversation}
      </button>

      <div className="mb-3 flex items-center justify-between">
        <div>
          <p className="text-[11px] uppercase tracking-[0.18em] text-slate-400">Tasks</p>
          <h2 className="mt-1 text-[17px] font-semibold text-[#070261]">{text.tasksLabel}</h2>
        </div>
        <button className="rounded-xl p-2 text-slate-400 transition hover:bg-slate-50 hover:text-[#161FAD]">
          <PanelRightOpen className="h-4 w-4" />
        </button>
      </div>

      <div className="flex-1 space-y-2">
        {historyTasks
          .filter((task) => !task.isDraft)
          .map((task) => {
            const active = activeView !== "new" && task.id === "t1";

            return (
              <button
                key={task.id}
                className={`w-full rounded-[18px] border px-3.5 py-3 text-left transition ${
                  active
                    ? "border-[rgba(23,36,216,0.12)] bg-[linear-gradient(180deg,rgba(23,36,216,0.08),rgba(132,140,254,0.08))] shadow-[0_12px_28px_rgba(23,36,216,0.08)]"
                    : "border-transparent bg-slate-50/80 hover:border-slate-200 hover:bg-white"
                }`}
              >
                <p className={`truncate text-[13px] ${active ? "font-semibold text-[#070261]" : "font-medium text-slate-700"}`}>
                  {pick(lang, task.title)}
                </p>
                <p className="mt-1 text-[11px] text-slate-400">{pick(lang, task.meta)}</p>
              </button>
            );
          })}
      </div>

      <div className="relative mt-4">
        <button
          onClick={onToggleUserMenu}
          className="flex w-full items-center gap-3 rounded-[18px] border border-slate-100 bg-slate-50/90 px-3 py-3 text-left transition hover:border-slate-200 hover:bg-white"
        >
          <UserCircle2 className="h-8 w-8 text-slate-400" />
          <div>
            <p className="text-[13px] font-medium text-slate-700">Chen Lab</p>
            <p className="text-[11px] text-slate-400">{text.signedInRole}</p>
          </div>
        </button>
        {userMenuOpen ? <UserMenu lang={lang} onAction={onUserMenuAction} /> : null}
      </div>
    </aside>
  );
}

function NewTaskWorkspace({
  lang,
  prompt,
  onPromptChange,
  onPromptPick,
  onStart,
}: {
  lang: Lang;
  prompt: string;
  onPromptChange: (value: string) => void;
  onPromptPick: (value: string) => void;
  onStart: () => void;
}) {
  const text = copy[lang];

  return (
    <section className="flex min-h-[760px] flex-col rounded-[24px] border border-white/70 bg-white/84 shadow-[0_16px_40px_rgba(15,23,42,0.045)] backdrop-blur">
      <div className="flex flex-1 flex-col justify-between px-6 py-6">
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
                  key={pick(lang, item)}
                  onClick={() => onPromptPick(pick(lang, item))}
                  className="flex w-full items-start justify-between gap-3 rounded-[18px] border border-slate-100 bg-slate-50/80 px-4 py-4 text-left transition hover:border-[rgba(23,36,216,0.14)] hover:bg-white"
                >
                  <div>
                    <p className="text-[13px] font-medium text-slate-700">{pick(lang, item)}</p>
                  </div>
                  <ArrowUpRight className="mt-0.5 h-4 w-4 shrink-0 text-slate-300" />
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
          <div className="mt-2 flex items-center justify-between gap-3 border-t border-slate-200 pt-2.5">
            <div className="flex items-center gap-2">
              <button className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-[12px] font-medium text-slate-600 transition hover:border-[rgba(23,36,216,0.18)] hover:text-[#161FAD]">
                <Upload className="mr-1.5 inline h-4 w-4" />
                {text.uploadFile}
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

function RunningWorkspace({
  lang,
  prompt,
  onPromptChange,
  steps,
  workflowCompleted,
  compact = false,
}: {
  lang: Lang;
  prompt: string;
  onPromptChange: (value: string) => void;
  steps: PlanStep[];
  workflowCompleted: boolean;
  compact?: boolean;
}) {
  const text = copy[lang];
  const currentRunningStep = steps.find((step) => step.status === "running");
  const runtimeMessages: RunningMessage[] = workflowCompleted
    ? [
        ...runningMessages,
        {
          role: "agent",
          content: l(text.finalSummaryBody, text.finalSummaryBody),
          time: "18:31",
        },
        {
          role: "agent",
          content: l(text.finalSummaryOutcome, text.finalSummaryOutcome),
          time: "18:31",
        },
      ]
    : runningMessages;

  return (
    <section className="flex min-h-[760px] flex-col rounded-[24px] border border-white/70 bg-white/84 shadow-[0_16px_40px_rgba(15,23,42,0.045)] backdrop-blur">
      <div className={`border-b border-slate-200/80 ${compact ? "px-4 py-4" : "px-6 py-5"}`}>
        <div>
          <p className="text-[11px] uppercase tracking-[0.18em] text-slate-400">{text.conversation}</p>
          <h2 className="mt-1 text-[17px] font-semibold text-[#070261]">{text.runningTitle}</h2>
        </div>
      </div>

      <div className={`flex-1 overflow-y-auto ${compact ? "px-4 py-4" : "px-6 py-6"}`}>
        <div className="space-y-4">
          {runtimeMessages.map((message, index) => {
            const isUser = message.role === "user";
            return (
              <div key={`${message.role}-${index}`} className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
                <div
                  className={`max-w-[86%] rounded-[22px] border px-4 py-4 text-[13px] leading-6 shadow-[0_10px_28px_rgba(15,23,42,0.04)] ${
                    isUser
                      ? "border-[rgba(23,36,216,0.12)] bg-[linear-gradient(135deg,#161FAD_0%,#2C36F4_100%)] text-white"
                      : "border-slate-200 bg-white text-slate-700"
                  }`}
                >
                  {!isUser ? (
                    <div className="mb-1.5 flex items-center gap-2 text-[11px] font-medium text-[#161FAD]">
                      <Bot className="h-4 w-4" />Ailux Agent
                    </div>
                  ) : null}
                  <p>{pick(lang, message.content)}</p>
                  <p className={`mt-2 text-[10px] ${isUser ? "text-white/75" : "text-slate-400"}`}>{message.time}</p>
                  {!isUser && index === 1 && !workflowCompleted ? (
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
        </div>
      </div>

      <div className={`border-t border-slate-200/80 ${compact ? "px-4 py-3" : "px-6 py-4"}`}>
        <div className="rounded-[18px] border border-slate-200 bg-slate-50/90 p-3">
          <textarea
            value={prompt}
            onChange={(event) => onPromptChange(event.target.value)}
            className="min-h-[54px] w-full resize-none border-0 bg-transparent text-[13px] leading-6 outline-none placeholder:text-slate-400"
            placeholder={text.runningPlaceholder}
          />
          <div className="mt-2 flex items-center justify-between gap-3 border-t border-slate-200 pt-2.5">
            <div className="flex items-center gap-2 text-slate-500">
              <button className="rounded-xl p-2 transition hover:bg-white hover:text-[#161FAD]">
                <Upload className="h-4 w-4" />
              </button>
              <button className="rounded-xl p-2 transition hover:bg-white hover:text-[#161FAD]">
                <Database className="h-4 w-4" />
              </button>
            </div>
            <Button className="h-9 rounded-xl bg-[#161FAD] px-4 text-[13px] text-white hover:bg-[#1724D8]">
              {text.send}
              <SendHorizonal className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}

function ResultWorkspace({
  lang,
  openedFiles,
  selectedFile,
  onSelectFile,
  onCloseFile,
  onDownloadFile,
}: {
  lang: Lang;
  openedFiles: ResultFile[];
  selectedFile: ResultFile | null;
  onSelectFile: (id: string) => void;
  onCloseFile: (id: string) => void;
  onDownloadFile: (file: ResultFile) => void;
}) {
  const text = copy[lang];

  return (
    <section className="flex min-h-[760px] flex-col rounded-[24px] border border-white/70 bg-white/84 shadow-[0_16px_40px_rgba(15,23,42,0.045)] backdrop-blur">
      <div className="flex-1 overflow-y-auto px-4 py-4">
        <div className="rounded-[22px] border border-slate-100 bg-white shadow-[0_8px_24px_rgba(15,23,42,0.04)]">
          <div className="border-b border-slate-200/80 px-4 py-3">
            <div className="flex items-center gap-2 overflow-x-auto whitespace-nowrap">
              {openedFiles.length > 0 ? (
                openedFiles.map((file) => {
                  const active = selectedFile?.id === file.id;
                  return (
                    <div
                      key={file.id}
                      className={`inline-flex items-center gap-2 rounded-xl border px-3 py-2 text-[12px] font-medium transition ${
                        active
                          ? "border-[rgba(255,201,151,0.5)] bg-[rgba(255,201,151,0.28)] text-[#6c4b1d]"
                          : "border-slate-200 bg-slate-50 text-slate-500 hover:bg-white hover:text-slate-700"
                      }`}
                    >
                      <button onClick={() => onSelectFile(file.id)} className="truncate text-left">
                        {file.name}
                      </button>
                      <button
                        onClick={() => onCloseFile(file.id)}
                        className="rounded-full p-0.5 text-slate-400 transition hover:bg-white hover:text-slate-700"
                        aria-label={`${text.closeFile} ${file.name}`}
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  );
                })
              ) : (
                <p className="text-[12px] text-slate-400">{text.fileTabHint}</p>
              )}
            </div>
          </div>

          <div className="px-4 py-4">
            {!selectedFile ? (
              <div className="rounded-[18px] border border-dashed border-slate-200 bg-slate-50/70 px-4 py-8 text-[12px] leading-6 text-slate-500">
                {text.noOpenedFile}
              </div>
            ) : (
              <>
                <div className="mb-3 flex items-center justify-between gap-3">
                  <p className="truncate pr-3 text-[14px] font-semibold text-[#070261]">{selectedFile.name}</p>
                  <Button
                    variant="outline"
                    onClick={() => onDownloadFile(selectedFile)}
                    className="h-8 rounded-xl border-slate-200 bg-white px-3 text-[12px] text-slate-600 hover:bg-slate-50"
                  >
                    <ArrowDownToLine className="mr-1.5 h-4 w-4" />
                    {text.downloadFile}
                  </Button>
                </div>

                {selectedFile.type === "pdb" ? (
                  <PdbViewer lang={lang} pdbText={demoPdbContent} />
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
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

function SidePanel({
  lang,
  view,
  sideTab,
  steps,
  selectedFileId,
  selectedFileIds,
  searchQuery,
  onSearchQueryChange,
  onSideTabChange,
  onSelectFile,
  onToggleFile,
  onDownloadFile,
  onExportSelected,
}: {
  lang: Lang;
  view: ViewMode;
  sideTab: SideTab;
  steps: PlanStep[];
  selectedFileId: string;
  selectedFileIds: string[];
  searchQuery: string;
  onSearchQueryChange: (value: string) => void;
  onSideTabChange: (tab: SideTab) => void;
  onSelectFile: (id: string) => void;
  onToggleFile: (id: string) => void;
  onDownloadFile: (file: ResultFile) => void;
  onExportSelected: () => void;
}) {
  const text = copy[lang];
  const showEmpty = view === "new";
  const progressPercent = useMemo(() => {
    const doneCount = steps.filter((step) => step.status === "done").length;
    const hasRunning = steps.some((step) => step.status === "running");
    return Math.round(((doneCount + (hasRunning ? 0.55 : 0)) / steps.length) * 100);
  }, [steps]);

  const filteredFiles = useMemo(() => {
    const keyword = searchQuery.trim().toLowerCase();
    if (!keyword) return resultFiles;
    return resultFiles.filter((file) => `${file.name} ${pick(lang, file.step)}`.toLowerCase().includes(keyword));
  }, [lang, searchQuery]);

  const groupedFiles = useMemo(() => {
    return filteredFiles.reduce<Record<string, ResultFile[]>>((acc, file) => {
      const key = pick(lang, file.step);
      if (!acc[key]) acc[key] = [];
      acc[key].push(file);
      return acc;
    }, {});
  }, [filteredFiles, lang]);

  return (
    <aside className="flex min-h-[760px] flex-col rounded-[24px] border border-white/70 bg-white/84 shadow-[0_16px_40px_rgba(15,23,42,0.045)] backdrop-blur">
      <div className="border-b border-slate-200/80 px-4 py-4">
        <div className="inline-flex rounded-2xl border border-slate-200 bg-slate-50 p-1">
          {[
            { id: "plan" as SideTab, label: text.plan },
            { id: "results" as SideTab, label: text.results },
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

      <div className="flex-1 overflow-y-auto px-4 py-4">
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
                <div className="mb-1 flex items-center justify-between text-[11px] text-slate-400">
                  <span>{text.overallProgress}</span>
                  <span>{progressPercent}%</span>
                </div>
                <div className="h-2 rounded-full bg-slate-100">
                  <div
                    className="h-2 rounded-full bg-[linear-gradient(90deg,#161FAD_0%,#848CFE_68%,#FFC997_100%)]"
                    style={{ width: `${progressPercent}%` }}
                  />
                </div>
              </div>
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
        ) : showEmpty ? (
          <div className="rounded-[20px] border border-dashed border-slate-200 bg-slate-50/70 p-5">
            <p className="text-[11px] uppercase tracking-[0.18em] text-slate-400">{text.results}</p>
            <h3 className="mt-1 text-[15px] font-semibold text-[#070261]">{text.emptyResults}</h3>
            <p className="mt-3 text-[12px] leading-6 text-slate-500">{text.emptyResultsBody}</p>
          </div>
        ) : (
          <div>
            <div className="mb-4 flex items-center justify-end gap-3 pt-1">
              {selectedFileIds.length > 0 ? (
                <Button onClick={onExportSelected} className="h-8 rounded-xl bg-[#161FAD] px-3 text-[12px] text-white hover:bg-[#1724D8]">
                  {text.exportSelected} ({selectedFileIds.length})
                </Button>
              ) : null}
            </div>

            <div className="mb-4 rounded-[18px] border border-slate-200 bg-slate-50/90 px-3 py-2.5">
              <div className="flex items-center gap-2 text-slate-400">
                <Search className="h-4 w-4" />
                <input
                  value={searchQuery}
                  onChange={(event) => onSearchQueryChange(event.target.value)}
                  className="w-full border-0 bg-transparent text-[13px] outline-none placeholder:text-slate-400"
                  placeholder={text.searchFiles}
                />
              </div>
            </div>

            <div className="space-y-4">
              {Object.entries(groupedFiles).length === 0 ? (
                <div className="rounded-[18px] border border-dashed border-slate-200 bg-slate-50/70 px-4 py-5 text-[12px] leading-6 text-slate-500">
                  {text.noMatchedResults}
                </div>
              ) : (
                Object.entries(groupedFiles).map(([group, files]) => (
                  <div key={group}>
                    <p className="mb-2 text-[11px] font-medium uppercase tracking-[0.14em] text-slate-400">{group}</p>
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
                              </div>
                            </button>
                            <button
                              onClick={() => onDownloadFile(file)}
                              className="mt-1 rounded-xl p-2 text-slate-300 opacity-0 transition group-hover:bg-white group-hover:text-[#161FAD] group-hover:opacity-100"
                              aria-label={`${text.download} ${file.name}`}
                            >
                              <ArrowDownToLine className="h-4 w-4" />
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>
    </aside>
  );
}

export default function Home() {
  const [lang, setLang] = useState<Lang>("zh");
  const [activeView, setActiveView] = useState<ViewMode>("new");
  const [sideTab, setSideTab] = useState<SideTab>("plan");
  const [composerValue, setComposerValue] = useState("");
  const [selectedFileId, setSelectedFileId] = useState<string>("");
  const [openedFileIds, setOpenedFileIds] = useState<string[]>([]);
  const [selectedFileIds, setSelectedFileIds] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [runtimeSteps, setRuntimeSteps] = useState<PlanStep[]>(() =>
    runningSteps.map((step): PlanStep => ({ ...step, status: "waiting" })),
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

  const openedFiles = openedFileIds
    .map((id) => resultFiles.find((file) => file.id === id))
    .filter((file): file is ResultFile => Boolean(file));
  const selectedFile = resultFiles.find((file) => file.id === selectedFileId) ?? null;

  const handlePromptPick = (value: string) => {
    setComposerValue(value);
  };

  const handleStart = () => {
    setRuntimeSteps(createRuntimeSteps());
    setWorkflowCompleted(false);
    setActiveView("running");
    setSideTab("plan");
  };

  const handleNewConversation = () => {
    if (workflowTimerRef.current) {
      window.clearTimeout(workflowTimerRef.current);
      workflowTimerRef.current = null;
    }
    setRuntimeSteps(runningSteps.map((step): PlanStep => ({ ...step, status: "waiting" })));
    setWorkflowCompleted(false);
    setActiveView("new");
    setSideTab("plan");
    setComposerValue("");
    setSelectedFileId("");
    setOpenedFileIds([]);
    setSelectedFileIds([]);
    setSearchQuery("");
    setUserMenuOpen(false);
  };

  const handleSelectFile = (id: string) => {
    setOpenedFileIds((current) => (current.includes(id) ? current : [...current, id]));
    setSelectedFileId(id);
    setSideTab("results");
    setActiveView("result");
  };

  const handleCloseFile = (id: string) => {
    setOpenedFileIds((current) => {
      const remaining = current.filter((item) => item !== id);
      if (selectedFileId === id) {
        setSelectedFileId(remaining[remaining.length - 1] ?? "");
      }
      return remaining;
    });
  };

  const handleToggleFile = (id: string) => {
    setSelectedFileIds((current) => (current.includes(id) ? current.filter((item) => item !== id) : [...current, id]));
  };

  const handleDownloadFile = (file: ResultFile) => {
    downloadResultFile(file, lang);
    toast.success(`${text.downloading} ${file.name}`);
  };

  const handleExportSelected = () => {
    if (selectedFileIds.length === 0) {
      toast.message(text.selectBeforeExport);
      return;
    }

    const selectedFiles = resultFiles.filter((file) => selectedFileIds.includes(file.id));
    const payload = JSON.stringify(
      {
        exportedAt: new Date().toISOString(),
        files: selectedFiles.map((file) => ({ name: file.name, step: pick(lang, file.step), meta: pick(lang, file.meta) })),
      },
      null,
      2,
    );

    const blob = new Blob([payload], { type: "application/json;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "ailux-selected-results.json";
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
    toast.success(`${text.exportedFiles} ${selectedFiles.length} ${text.exportedSuffix}`);
  };

  const handleUserMenuAction = (action: "profile" | "network" | "language" | "logout") => {
    if (action === "language") {
      const nextLang: Lang = lang === "zh" ? "en" : "zh";
      setLang(nextLang);
      setUserMenuOpen(false);
      toast.success(nextLang === "en" ? copy.zh.switchedToEnglish : copy.en.switchedToChinese);
      return;
    }

    setUserMenuOpen(false);
    toast.message(text.comingSoon);
  };

  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,#f8faff_0%,#eef3ff_100%)] text-slate-900">
      <div className="mx-auto flex min-h-screen max-w-[1680px] flex-col p-4 lg:p-5">
        <div
          ref={menuBoundaryRef}
          className={`grid flex-1 gap-4 ${
            activeView === "new"
              ? "xl:grid-cols-[260px_minmax(0,1fr)]"
              : activeView === "result"
                ? "xl:grid-cols-[88px_minmax(320px,0.82fr)_minmax(500px,1.18fr)_360px]"
                : "xl:grid-cols-[260px_minmax(0,1fr)_360px]"
          }`}
        >
          <Sidebar
            activeView={activeView}
            lang={lang}
            userMenuOpen={userMenuOpen}
            onNewConversation={handleNewConversation}
            onToggleUserMenu={() => setUserMenuOpen((current) => !current)}
            onUserMenuAction={handleUserMenuAction}
            collapsed={activeView === "result"}
          />

          {activeView === "new" ? (
            <NewTaskWorkspace
              lang={lang}
              prompt={composerValue}
              onPromptChange={setComposerValue}
              onPromptPick={handlePromptPick}
              onStart={handleStart}
            />
          ) : (
            <RunningWorkspace
              lang={lang}
              prompt={composerValue}
              onPromptChange={setComposerValue}
              steps={runtimeSteps}
              workflowCompleted={workflowCompleted}
              compact={activeView === "result"}
            />
          )}

          {activeView === "result" ? (
            <ResultWorkspace
              lang={lang}
              openedFiles={openedFiles}
              selectedFile={selectedFile}
              onSelectFile={handleSelectFile}
              onCloseFile={handleCloseFile}
              onDownloadFile={handleDownloadFile}
            />
          ) : null}

          {activeView !== "new" ? (
            <SidePanel
              lang={lang}
              view={activeView}
              sideTab={sideTab}
              steps={runtimeSteps}
              selectedFileId={selectedFileId}
              selectedFileIds={selectedFileIds}
              searchQuery={searchQuery}
              onSearchQueryChange={setSearchQuery}
              onSideTabChange={setSideTab}
              onSelectFile={handleSelectFile}
              onToggleFile={handleToggleFile}
              onDownloadFile={handleDownloadFile}
              onExportSelected={handleExportSelected}
            />
          ) : null}
        </div>
      </div>
    </div>
  );
}
