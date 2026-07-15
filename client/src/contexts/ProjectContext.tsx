import { createContext, useContext, useState, ReactNode } from "react";

export type ProjectMember = {
  id: string;
  name: string;
  email: string;
  role: "admin" | "member";
  avatar?: string;
};

export type ProjectDataAsset = {
  id: string;
  name: string;
  type: "csv" | "json" | "pdb" | "png" | "xlsx" | "pdf" | "docx" | "fasta" | "cif" | "a3m" | "folder";
  size: string;
  updatedAt: string;
  source: "uploaded" | "run-saved";
  description?: string;
  sourceTaskName?: string;
  sourceTaskId?: string;
  savedAt?: string;
  tags?: string[];
  children?: ProjectDataChild[];
};

export type ProjectDataChild = {
  id: string;
  name: string;
  type: ProjectDataAsset["type"];
  size: string;
  stepName?: string;
  description?: string;
  children?: ProjectDataChild[];
};

export type UserResource = {
  id: string;
  kind: "tool" | "skill";
  name: string;
  description: string;
  category: string;
  owner: "mine" | "shared";
  permission: "private" | "shared";
  sharedWith: Array<{ email: string; role: "admin" | "member" }>;
  accessRole?: "admin" | "member";
  updatedAt: string;
  steps?: number;
};

export type AgentPreference = {
  id: string;
  title: string;
  scope: "global" | "project";
  audience: "personal" | "project-members";
  userId: string;
  projectId?: string;
  content: string;
  status: "active" | "paused" | "deleted";
  priority: "high" | "medium" | "low";
  permission: "private" | "project-members";
  tags: string[];
  source: "manual" | "run" | "report" | "agent-suggested";
  version: number;
  referenceCount: number;
  recentReferences: Array<{ id: string; title: string; usedAt: string; context: string }>;
  versionHistory: Array<{ version: number; updatedAt: string; summary: string }>;
  updatedAt: string;
  deletedAt?: string;
};

export type ProjectDataFileType = Exclude<ProjectDataAsset["type"], "folder">;

export type ProjectDetailView = "data" | "members";

export type Project = {
  id: string;
  name: string;
  description: string;
  projectCode?: string;
  color: string;
  isDefault?: boolean;
  members: ProjectMember[];
  data: ProjectDataAsset[];
  createdAt: string;
};

const defaultMembers: ProjectMember[] = [
  { id: "m1", name: "Chen Lab", email: "chen@ailux.ai", role: "admin" },
  { id: "m2", name: "Li Wei", email: "liwei@ailux.ai", role: "admin" },
  { id: "m3", name: "Zhang Min", email: "zhangmin@ailux.ai", role: "member" },
];

const defaultData: ProjectDataAsset[] = [
  {
    id: "d-run-folder-1",
    name: "run-20260626-dll3-003_result",
    type: "folder",
    size: "4.6 MB",
    updatedAt: "2026-04-29",
    source: "run-saved",
    description: "由任务「DLL3 双抗预测流程」保存的完整 Run 结果包，按步骤保留结果文件。",
    sourceTaskName: "DLL3 双抗预测流程",
    sourceTaskId: "run-20260626-dll3-003",
    savedAt: "2026-04-29 14:36",
    tags: ["run-output", "folder"],
    children: [
      {
        id: "d-run-folder-1-step-2",
        name: "步骤 2 · 结构预测",
        type: "folder",
        size: "2.5 MB",
        children: [
          { id: "d-run-folder-1-c1", name: "DLL3_Mcb008_model_1.pdb", type: "pdb", size: "2.4 MB", description: "结构源文件" },
          { id: "d-run-folder-1-c2", name: "interface.csv", type: "csv", size: "128 KB", description: "接口定义文件" },
        ],
      },
      {
        id: "d-run-folder-1-step-3",
        name: "步骤 3 · 特征计算",
        type: "folder",
        size: "128 KB",
        children: [
          { id: "d-run-folder-1-c3", name: "physical_energy_combined_features.csv", type: "csv", size: "128 KB", description: "特征重要性表" },
        ],
      },
      {
        id: "d-run-folder-1-step-4",
        name: "步骤 4 · 相关性分析与特征选择",
        type: "folder",
        size: "320 KB",
        children: [
          { id: "d-run-folder-1-c4", name: "feature1_vs_experiment.png", type: "png", size: "320 KB", description: "单特征相关性图" },
        ],
      },
    ],
  },
  {
    id: "d1",
    name: "DLL3_Mcb008_model_1.pdb",
    type: "pdb",
    size: "2.4 MB",
    updatedAt: "2026-04-29",
    source: "run-saved",
    description: "由任务「DLL3 双抗预测流程」生成，用于后续结构分析复用。",
    sourceTaskName: "DLL3 双抗预测流程",
    sourceTaskId: "run-20260626-dll3-003",
    savedAt: "2026-04-29 14:36",
    tags: ["structure"],
  },
  { id: "d2", name: "physical_energy_combined_features.csv", type: "csv", size: "128 KB", updatedAt: "2026-04-29", source: "run-saved", sourceTaskName: "DLL3 双抗预测流程", sourceTaskId: "run-20260626-dll3-003", savedAt: "2026-04-29 14:36", tags: ["features"] },
  { id: "d3", name: "all_ml_evaluation_results_stage2.csv", type: "csv", size: "64 KB", updatedAt: "2026-04-28", source: "run-saved", sourceTaskName: "内化预测建模工作流程", sourceTaskId: "run-20260428-model-002", savedAt: "2026-04-28 18:12", tags: ["model", "evaluation"] },
  { id: "d4", name: "internalization_experiment_raw.csv", type: "csv", size: "48 KB", updatedAt: "2026-04-20", source: "uploaded", description: "项目初始化时上传的实验原始数据。", tags: ["raw-data"] },
];

const defaultUserResources: UserResource[] = [
  {
    id: "ur-tool-1",
    kind: "tool",
    name: "Rosetta 能量特征计算",
    description: "个人常用的 Rosetta 结构能量计算配置，适用于候选抗体结构初筛。",
    category: "抗体设计",
    owner: "mine",
    permission: "private",
    sharedWith: [],
    updatedAt: "2026-07-02",
  },
  {
    id: "ur-skill-1",
    kind: "skill",
    name: "DLL3 双抗预测模版",
    description: "从结构文件到特征计算、模型预测和报告生成的复用流程。",
    category: "抗体设计",
    owner: "mine",
    permission: "shared",
    sharedWith: [
      { email: "liwei@xtalpi.com", role: "admin" },
      { email: "zhangmin@xtalpi.com", role: "member" },
    ],
    updatedAt: "2026-07-03",
    steps: 6,
  },
  {
    id: "ur-skill-2",
    kind: "skill",
    name: "EGFR CDR 优化模版",
    description: "同事分享的 CDR 区域突变设计与结构复核流程。",
    category: "蛋白设计",
    owner: "shared",
    permission: "shared",
    sharedWith: [{ email: "chenlab@xtalpi.com", role: "member" }],
    accessRole: "member",
    updatedAt: "2026-07-01",
    steps: 5,
  },
];

const defaultAgentPreferences: AgentPreference[] = [
  {
    id: "pref-global-1",
    title: "通用偏好 · 报告与结果保存",
    scope: "global",
    audience: "personal",
    userId: "user-chen-lab",
    content: `# 通用偏好

## 报告语言
默认使用中文，关键术语保留英文。

## 结果展示
所有任务报告需要包含：
- 输入数据摘要
- 参数表
- 每一步产物
- 错误日志摘要
- 下一步建议

## 结果保存
任务完成后，优先建议将关键结果保存到项目数据集。
保存时必须记录 Run ID、Step ID、保存时间和描述。`,
    status: "active",
    priority: "medium",
    permission: "private",
    tags: ["report", "result-saving", "language"],
    source: "manual",
    version: 3,
    referenceCount: 18,
    recentReferences: [
      { id: "ref-g-1", title: "DLL3 双抗预测流程", usedAt: "2026-07-10 09:42", context: "Plan 生成时注入报告结构要求" },
      { id: "ref-g-2", title: "内化预测建模工作流程", usedAt: "2026-07-09 16:10", context: "结果保存建议" },
    ],
    versionHistory: [
      { version: 3, updatedAt: "2026-07-05", summary: "补充结果保存字段要求" },
      { version: 2, updatedAt: "2026-07-03", summary: "增加报告结构要求" },
      { version: 1, updatedAt: "2026-07-01", summary: "创建通用偏好" },
    ],
    updatedAt: "2026-07-05",
  },
  {
    id: "pref-global-2",
    title: "通用偏好 · 结构分析解释",
    scope: "global",
    audience: "personal",
    userId: "user-chen-lab",
    content: `# 结构分析通用说明

涉及抗体结构分析时，优先说明输入文件、模型假设和结果可解释性限制。

## 必须说明
- 输入结构文件路径
- 使用的 Skill / 模版
- 关键参数与默认假设
- 结果适用范围与风险

## 引用格式
文件路径使用 \`Project Dataset / ...\`，Skill 引用使用 \`@Skill: Rosetta 能量特征计算\`。`,
    status: "active",
    priority: "medium",
    permission: "private",
    tags: ["structure", "explainability"],
    source: "manual",
    version: 2,
    referenceCount: 11,
    recentReferences: [
      { id: "ref-g2-1", title: "DLL3 结构预测", usedAt: "2026-07-08 14:20", context: "Monitor 节点日志摘要" },
    ],
    versionHistory: [
      { version: 2, updatedAt: "2026-07-04", summary: "增加 Skill 与路径引用格式" },
      { version: 1, updatedAt: "2026-07-02", summary: "创建结构分析说明" },
    ],
    updatedAt: "2026-07-04",
  },
  {
    id: "pref-project-1",
    title: "DLL3 项目偏好 · 抗体分析规则",
    scope: "project",
    audience: "project-members",
    userId: "user-chen-lab",
    projectId: "proj-default",
    content: `# DLL3 项目偏好

## 抗体编号规则
所有抗体序列分析统一使用 IMGT numbering。

## 默认数据集
默认序列库：
Project Dataset / DLL3 抗体研究 / sequences / candidate_antibodies.fasta

## 报告要求
Humanization 报告必须包含：
- CDR 变化说明
- liability 位点
- developability risk
- 推荐进入下一轮的候选列表

## 项目变量
默认使用 {project.dataset.default_library} 作为候选序列库。`,
    status: "active",
    priority: "high",
    permission: "project-members",
    tags: ["DLL3", "IMGT", "humanization"],
    source: "manual",
    version: 4,
    referenceCount: 24,
    recentReferences: [
      { id: "ref-p-1", title: "DLL3 双抗预测流程", usedAt: "2026-07-10 10:05", context: "项目偏好覆盖通用结构规则" },
      { id: "ref-p-2", title: "Humanization 报告生成", usedAt: "2026-07-09 11:28", context: "报告章节要求" },
    ],
    versionHistory: [
      { version: 4, updatedAt: "2026-07-03", summary: "补充项目变量引用" },
      { version: 3, updatedAt: "2026-07-02", summary: "补充 Humanization 报告要求" },
      { version: 2, updatedAt: "2026-06-30", summary: "增加默认数据集路径" },
      { version: 1, updatedAt: "2026-06-28", summary: "创建 DLL3 项目偏好" },
    ],
    updatedAt: "2026-07-03",
  },
  {
    id: "pref-project-2",
    title: "DLL3 项目偏好 · 临时结论不入长期记忆",
    scope: "project",
    audience: "personal",
    userId: "user-chen-lab",
    projectId: "proj-default",
    content: `# 临时信息处理规则

临时下载路径和一次性中间分析结论不写入长期记忆。

## 不保存内容
- 临时文件下载路径
- 一次性调参记录
- 尚未验证的中间结论

## 可保存内容
如果用户明确确认某条结论长期有效，Agent 需要先提示再保存为项目偏好。`,
    status: "paused",
    priority: "low",
    permission: "private",
    tags: ["memory", "temporary"],
    source: "agent-suggested",
    version: 1,
    referenceCount: 3,
    recentReferences: [
      { id: "ref-p2-1", title: "Run #2 调参复盘", usedAt: "2026-07-07 17:30", context: "判断不写入长期偏好" },
    ],
    versionHistory: [
      { version: 1, updatedAt: "2026-07-02", summary: "由 Agent 建议，用户确认后创建" },
    ],
    updatedAt: "2026-07-02",
  },
];

export const SAMPLE_PROJECTS: Project[] = [
  {
    id: "proj-default",
    name: "DLL3 抗体研究",
    description: "双表位抗体内化活性预测与特征分析",
    projectCode: "CADD-DLL3-2026",
    color: "#161FAD",
    isDefault: true,
    members: defaultMembers,
    data: defaultData,
    createdAt: "2026-03-01",
  },
  {
    id: "proj-2",
    name: "EGFR 靶向优化",
    description: "EGFR 抗体 CDR 区域优化项目",
    projectCode: "CADD-EGFR-2026",
    color: "#0891b2",
    members: [defaultMembers[0], defaultMembers[1]],
    data: [defaultData[3]],
    createdAt: "2026-04-01",
  },
  {
    id: "proj-3",
    name: "PD-L1 结合分析",
    description: "PD-L1 抗体结合亲和力分析",
    projectCode: "CADD-PDL1-2026",
    color: "#7c3aed",
    members: [defaultMembers[0]],
    data: [],
    createdAt: "2026-04-15",
  },
];

export type MainView = "workspace" | "project-detail" | "resource" | "my-resources" | "agent-preferences" | "create-project" | "user-center";

type ProjectContextType = {
  projects: Project[];
  activeProject: Project;
  setActiveProject: (project: Project) => void;
  createProject: (name: string, description: string, projectCode?: string) => Project;
  updateProject: (projectId: string, updates: Pick<Project, "name" | "description" | "projectCode">) => void;
  deleteProject: (projectId: string) => void;
  addProjectDataAsset: (projectId: string, asset: Omit<ProjectDataAsset, "id" | "source" | "updatedAt"> & { source?: ProjectDataAsset["source"] }) => "created" | "existing";
  updateProjectDataAsset: (projectId: string, assetId: string, updates: Pick<ProjectDataAsset, "name" | "description">) => void;
  deleteProjectDataAsset: (projectId: string, assetId: string) => void;
  userResources: UserResource[];
  addUserResource: (resource: Omit<UserResource, "id" | "updatedAt">) => UserResource;
  updateUserResource: (resourceId: string, updates: Pick<UserResource, "name" | "description" | "permission" | "sharedWith">) => void;
  agentPreferences: AgentPreference[];
  addAgentPreference: (preference: Omit<AgentPreference, "id" | "userId" | "updatedAt" | "status" | "version" | "referenceCount" | "recentReferences" | "versionHistory">) => AgentPreference;
  updateAgentPreference: (preferenceId: string, updates: Pick<AgentPreference, "title" | "content" | "scope" | "audience" | "projectId" | "priority" | "permission" | "tags" | "source">) => void;
  toggleAgentPreference: (preferenceId: string) => void;
  deleteAgentPreference: (preferenceId: string) => void;
  addProjectMember: (projectId: string, email: string, role: ProjectMember["role"]) => ProjectMember | null;
  updateProjectMemberRole: (projectId: string, memberId: string, role: ProjectMember["role"]) => void;
  removeProjectMember: (projectId: string, memberId: string) => void;
  // Legacy (kept for backward compat, now unused)
  projectPanelOpen: boolean;
  setProjectPanelOpen: (open: boolean) => void;
  // Main view switching
  mainView: MainView;
  setMainView: (view: MainView) => void;
  projectDetailView: ProjectDetailView;
  setProjectDetailView: (view: ProjectDetailView) => void;
  resourceTab: "data" | "skill" | "template" | "preference";
  setResourceTab: (tab: "data" | "skill" | "template" | "preference") => void;
};

const ProjectContext = createContext<ProjectContextType | null>(null);

export function ProjectProvider({ children }: { children: ReactNode }) {
  const [projects, setProjects] = useState<Project[]>(SAMPLE_PROJECTS);
  const [activeProject, setActiveProject] = useState<Project>(SAMPLE_PROJECTS[0]);
  const [userResources, setUserResources] = useState<UserResource[]>(defaultUserResources);
  const [agentPreferences, setAgentPreferences] = useState<AgentPreference[]>(defaultAgentPreferences);
  const [projectPanelOpen, setProjectPanelOpen] = useState(false);
  const [mainView, setMainView] = useState<MainView>("workspace");
  const [projectDetailView, setProjectDetailView] = useState<ProjectDetailView>("data");
  const [resourceTab, setResourceTab] = useState<"data" | "skill" | "template" | "preference">("data");

  const createProject = (name: string, description: string, projectCode?: string): Project => {
    const colors = ["#161FAD", "#0891b2", "#7c3aed", "#059669", "#dc2626", "#d97706"];
    const newProject: Project = {
      id: `proj-${Date.now()}`,
      name,
      description,
      projectCode: projectCode || undefined,
      color: colors[projects.length % colors.length],
      members: [defaultMembers[0]],
      data: [],
      createdAt: new Date().toISOString().slice(0, 10),
    };
    setProjects((prev) => [...prev, newProject]);
    return newProject;
  };

  const syncProject = (projectId: string, updater: (project: Project) => Project) => {
    setProjects((prev) =>
      prev.map((project) => (project.id === projectId ? updater(project) : project))
    );
    setActiveProject((current) => (current.id === projectId ? updater(current) : current));
  };

  const updateProject = (projectId: string, updates: Pick<Project, "name" | "description" | "projectCode">) => {
    syncProject(projectId, (project) => ({ ...project, ...updates }));
  };

  const deleteProject = (projectId: string) => {
    if (projects.length <= 1) return;

    const nextProjects = projects.filter((project) => project.id !== projectId);
    setProjects(nextProjects);
    setActiveProject((current) => (current.id === projectId ? nextProjects[0] : current));
    setMainView("workspace");
  };

  const addProjectDataAsset = (projectId: string, asset: Omit<ProjectDataAsset, "id" | "source" | "updatedAt"> & { source?: ProjectDataAsset["source"] }) => {
    let result: "created" | "existing" = "created";

    syncProject(projectId, (project) => {
      const exists = project.data.some((item) => item.name === asset.name);
      if (exists) {
        result = "existing";
        return project;
      }

      return {
        ...project,
        data: [
          {
            ...asset,
            id: `d-${Date.now()}-${project.data.length}`,
            updatedAt: new Date().toISOString().slice(0, 10),
            source: asset.source ?? "run-saved",
          },
          ...project.data,
        ],
      };
    });

    return result;
  };

  const updateProjectDataAsset = (projectId: string, assetId: string, updates: Pick<ProjectDataAsset, "name" | "description">) => {
    syncProject(projectId, (project) => ({
      ...project,
      data: project.data.map((asset) => (asset.id === assetId ? { ...asset, ...updates } : asset)),
    }));
  };

  const deleteProjectDataAsset = (projectId: string, assetId: string) => {
    syncProject(projectId, (project) => ({
      ...project,
      data: project.data.filter((asset) => asset.id !== assetId),
    }));
  };

  const addUserResource = (resource: Omit<UserResource, "id" | "updatedAt">) => {
    const nextResource: UserResource = {
      ...resource,
      id: `ur-${Date.now()}`,
      updatedAt: new Date().toISOString().slice(0, 10),
    };
    setUserResources((current) => [nextResource, ...current]);
    return nextResource;
  };

  const updateUserResource = (resourceId: string, updates: Pick<UserResource, "name" | "description" | "permission" | "sharedWith">) => {
    setUserResources((current) =>
      current.map((resource) =>
        resource.id === resourceId
          ? { ...resource, ...updates, updatedAt: new Date().toISOString().slice(0, 10) }
          : resource,
      ),
    );
  };

  const addAgentPreference = (preference: Omit<AgentPreference, "id" | "userId" | "updatedAt" | "status" | "version" | "referenceCount" | "recentReferences" | "versionHistory">) => {
    const today = new Date().toISOString().slice(0, 10);
    const nextPreference: AgentPreference = {
      ...preference,
      id: `pref-${Date.now()}`,
      userId: "user-chen-lab",
      status: "active",
      version: 1,
      referenceCount: 0,
      recentReferences: [],
      versionHistory: [{ version: 1, updatedAt: today, summary: "创建偏好文档" }],
      updatedAt: today,
    };
    setAgentPreferences((current) => [nextPreference, ...current]);
    return nextPreference;
  };

  const updateAgentPreference = (preferenceId: string, updates: Pick<AgentPreference, "title" | "content" | "scope" | "audience" | "projectId" | "priority" | "permission" | "tags" | "source">) => {
    setAgentPreferences((current) =>
      current.map((preference) => {
        if (preference.id !== preferenceId) return preference;
        const today = new Date().toISOString().slice(0, 10);
        const nextVersion = preference.version + 1;
        return {
          ...preference,
          ...updates,
          version: nextVersion,
          versionHistory: [
            { version: nextVersion, updatedAt: today, summary: "更新偏好文档与元数据" },
            ...preference.versionHistory,
          ],
          updatedAt: today,
        };
      }),
    );
  };

  const toggleAgentPreference = (preferenceId: string) => {
    setAgentPreferences((current) =>
      current.map((preference) =>
        preference.id === preferenceId
          ? {
              ...preference,
              status: preference.status === "active" ? "paused" : "active",
              updatedAt: new Date().toISOString().slice(0, 10),
            }
          : preference,
      ),
    );
  };

  const deleteAgentPreference = (preferenceId: string) => {
    setAgentPreferences((current) =>
      current.map((preference) =>
        preference.id === preferenceId
          ? {
              ...preference,
              status: "deleted",
              deletedAt: new Date().toISOString().slice(0, 10),
              updatedAt: new Date().toISOString().slice(0, 10),
            }
          : preference,
      ),
    );
  };

  const addProjectMember = (projectId: string, email: string, role: ProjectMember["role"]) => {
    const normalizedEmail = email.trim().toLowerCase();
    if (!normalizedEmail) return null;

    let addedMember: ProjectMember | null = null;
    const name = normalizedEmail
      .split("@")[0]
      .split(/[._-]/)
      .filter(Boolean)
      .map((part) => part.slice(0, 1).toUpperCase() + part.slice(1))
      .join(" ") || normalizedEmail;
    const nextMember: ProjectMember = {
      id: `m-${Date.now()}`,
      name,
      email: normalizedEmail,
      role,
    };

    syncProject(projectId, (project) => {
      const existing = project.members.find((member) => member.email.toLowerCase() === normalizedEmail);
      if (existing) {
        addedMember = existing;
        return project;
      }

      addedMember = nextMember;

      return {
        ...project,
        members: [...project.members, nextMember],
      };
    });

    return addedMember;
  };

  const updateProjectMemberRole = (projectId: string, memberId: string, role: ProjectMember["role"]) => {
    syncProject(projectId, (project) => {
      return {
        ...project,
        members: project.members.map((member) => {
          if (member.id === memberId) return { ...member, role };
          return member;
        }),
      };
    });
  };

  const removeProjectMember = (projectId: string, memberId: string) => {
    syncProject(projectId, (project) => ({
      ...project,
      members: project.members.filter((member) => member.id !== memberId),
    }));
  };

  return (
    <ProjectContext.Provider
      value={{
        projects,
        activeProject,
        setActiveProject,
        createProject,
        updateProject,
        deleteProject,
        addProjectDataAsset,
        updateProjectDataAsset,
        deleteProjectDataAsset,
        userResources,
        addUserResource,
        updateUserResource,
        agentPreferences,
        addAgentPreference,
        updateAgentPreference,
        toggleAgentPreference,
        deleteAgentPreference,
        addProjectMember,
        updateProjectMemberRole,
        removeProjectMember,
        projectPanelOpen,
        setProjectPanelOpen,
        mainView,
        setMainView,
        projectDetailView,
        setProjectDetailView,
        resourceTab,
        setResourceTab,
      }}
    >
      {children}
    </ProjectContext.Provider>
  );
}

export function useProject() {
  const ctx = useContext(ProjectContext);
  if (!ctx) throw new Error("useProject must be used within ProjectProvider");
  return ctx;
}
