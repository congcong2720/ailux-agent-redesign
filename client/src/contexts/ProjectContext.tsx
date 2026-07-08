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
};

export type UserResource = {
  id: string;
  kind: "tool" | "skill";
  name: string;
  description: string;
  category: string;
  owner: "mine" | "shared";
  permission: "private" | "shared";
  sharedWith: string[];
  updatedAt: string;
  steps?: number;
};

export type AgentPreference = {
  id: string;
  scope: "global" | "project";
  audience: "personal" | "project-members";
  userId: string;
  projectId?: string;
  content: string;
  status: "active" | "paused" | "deleted";
  updatedAt: string;
  deletedAt?: string;
};

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
    name: "DLL3 双抗预测 Skill",
    description: "从结构文件到特征计算、模型预测和报告生成的复用流程。",
    category: "抗体设计",
    owner: "mine",
    permission: "shared",
    sharedWith: ["liwei@xtalpi.com", "zhangmin@xtalpi.com"],
    updatedAt: "2026-07-03",
    steps: 6,
  },
  {
    id: "ur-skill-2",
    kind: "skill",
    name: "EGFR CDR 优化 Skill",
    description: "同事分享的 CDR 区域突变设计与结构复核流程。",
    category: "蛋白设计",
    owner: "shared",
    permission: "shared",
    sharedWith: ["chenlab@xtalpi.com"],
    updatedAt: "2026-07-01",
    steps: 5,
  },
];

const defaultAgentPreferences: AgentPreference[] = [
  {
    id: "pref-global-1",
    scope: "global",
    audience: "personal",
    userId: "user-chen-lab",
    content: "默认用中文回答，关键结论优先给出，必要时补充英文术语。",
    status: "active",
    updatedAt: "2026-07-05",
  },
  {
    id: "pref-global-2",
    scope: "global",
    audience: "personal",
    userId: "user-chen-lab",
    content: "涉及抗体结构分析时，优先说明输入文件、模型假设和结果可解释性限制。",
    status: "active",
    updatedAt: "2026-07-04",
  },
  {
    id: "pref-project-1",
    scope: "project",
    audience: "project-members",
    userId: "user-chen-lab",
    projectId: "proj-default",
    content: "DLL3 项目中优先关注内化活性、KD、共定位评分和 linker 柔性。",
    status: "active",
    updatedAt: "2026-07-03",
  },
  {
    id: "pref-project-2",
    scope: "project",
    audience: "personal",
    userId: "user-chen-lab",
    projectId: "proj-default",
    content: "临时下载路径和一次性中间分析结论不写入长期记忆。",
    status: "paused",
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
  addAgentPreference: (preference: Omit<AgentPreference, "id" | "userId" | "updatedAt" | "status">) => AgentPreference;
  updateAgentPreference: (preferenceId: string, updates: Pick<AgentPreference, "content" | "scope" | "audience" | "projectId">) => void;
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

  const addAgentPreference = (preference: Omit<AgentPreference, "id" | "userId" | "updatedAt" | "status">) => {
    const nextPreference: AgentPreference = {
      ...preference,
      id: `pref-${Date.now()}`,
      userId: "user-chen-lab",
      status: "active",
      updatedAt: new Date().toISOString().slice(0, 10),
    };
    setAgentPreferences((current) => [nextPreference, ...current]);
    return nextPreference;
  };

  const updateAgentPreference = (preferenceId: string, updates: Pick<AgentPreference, "content" | "scope" | "audience" | "projectId">) => {
    setAgentPreferences((current) =>
      current.map((preference) =>
        preference.id === preferenceId
          ? { ...preference, ...updates, updatedAt: new Date().toISOString().slice(0, 10) }
          : preference,
      ),
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
