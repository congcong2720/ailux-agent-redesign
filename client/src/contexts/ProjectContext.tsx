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
  type: "csv" | "json" | "pdb" | "png" | "xlsx" | "pdf";
  size: string;
  updatedAt: string;
  source: "uploaded" | "run-saved";
  tags?: string[];
};

export type ProjectApp = {
  id: string;
  name: string;
  type: "agent" | "report" | "pipeline";
  description: string;
  lastRun?: string;
  status: "active" | "draft" | "archived";
};

export type Project = {
  id: string;
  name: string;
  description: string;
  color: string;
  isDefault?: boolean;
  members: ProjectMember[];
  data: ProjectDataAsset[];
  apps: ProjectApp[];
  createdAt: string;
};

const defaultMembers: ProjectMember[] = [
  { id: "m1", name: "Chen Lab", email: "chen@ailux.ai", role: "admin" },
  { id: "m2", name: "Li Wei", email: "liwei@ailux.ai", role: "admin" },
  { id: "m3", name: "Zhang Min", email: "zhangmin@ailux.ai", role: "member" },
];

const defaultData: ProjectDataAsset[] = [
  { id: "d1", name: "DLL3_Mcb008_model_1.pdb", type: "pdb", size: "2.4 MB", updatedAt: "2026-04-29", source: "run-saved", tags: ["structure"] },
  { id: "d2", name: "physical_energy_combined_features.csv", type: "csv", size: "128 KB", updatedAt: "2026-04-29", source: "run-saved", tags: ["features"] },
  { id: "d3", name: "all_ml_evaluation_results_stage2.csv", type: "csv", size: "64 KB", updatedAt: "2026-04-28", source: "run-saved", tags: ["model", "evaluation"] },
  { id: "d4", name: "internalization_experiment_raw.csv", type: "csv", size: "48 KB", updatedAt: "2026-04-20", source: "uploaded", tags: ["raw-data"] },
];

const defaultApps: ProjectApp[] = [
  { id: "a1", name: "内化预测建模工作流程", type: "pipeline", description: "双表位抗体内化活性预测完整流程", lastRun: "2026-04-29", status: "active" },
  { id: "a2", name: "内吞特征关联分析", type: "agent", description: "特征相关性分析 Agent", lastRun: "2026-04-28", status: "active" },
  { id: "a3", name: "模型评估报告", type: "report", description: "ML 模型对比评估报告模板", lastRun: "2026-04-27", status: "draft" },
];

export const SAMPLE_PROJECTS: Project[] = [
  {
    id: "proj-default",
    name: "DLL3 抗体研究",
    description: "双表位抗体内化活性预测与特征分析",
    color: "#161FAD",
    isDefault: true,
    members: defaultMembers,
    data: defaultData,
    apps: defaultApps,
    createdAt: "2026-03-01",
  },
  {
    id: "proj-2",
    name: "EGFR 靶向优化",
    description: "EGFR 抗体 CDR 区域优化项目",
    color: "#0891b2",
    members: [defaultMembers[0], defaultMembers[1]],
    data: [defaultData[3]],
    apps: [],
    createdAt: "2026-04-01",
  },
  {
    id: "proj-3",
    name: "PD-L1 结合分析",
    description: "PD-L1 抗体结合亲和力分析",
    color: "#7c3aed",
    members: [defaultMembers[0]],
    data: [],
    apps: [],
    createdAt: "2026-04-15",
  },
];

export type MainView = "workspace" | "project-detail" | "resource" | "create-project";

type ProjectContextType = {
  projects: Project[];
  activeProject: Project;
  setActiveProject: (project: Project) => void;
  createProject: (name: string, description: string) => Project;
  updateProject: (projectId: string, updates: Pick<Project, "name" | "description">) => void;
  deleteProject: (projectId: string) => void;
  updateProjectDataAsset: (projectId: string, assetId: string, name: string) => void;
  deleteProjectDataAsset: (projectId: string, assetId: string) => void;
  addProjectMember: (projectId: string, email: string, role: ProjectMember["role"]) => ProjectMember | null;
  updateProjectMemberRole: (projectId: string, memberId: string, role: ProjectMember["role"]) => void;
  removeProjectMember: (projectId: string, memberId: string) => void;
  // Legacy (kept for backward compat, now unused)
  projectPanelOpen: boolean;
  setProjectPanelOpen: (open: boolean) => void;
  // Main view switching
  mainView: MainView;
  setMainView: (view: MainView) => void;
  projectDetailView: "apps" | "data" | "members";
  setProjectDetailView: (view: "apps" | "data" | "members") => void;
  resourceTab: "data" | "skill" | "template";
  setResourceTab: (tab: "data" | "skill" | "template") => void;
};

const ProjectContext = createContext<ProjectContextType | null>(null);

export function ProjectProvider({ children }: { children: ReactNode }) {
  const [projects, setProjects] = useState<Project[]>(SAMPLE_PROJECTS);
  const [activeProject, setActiveProject] = useState<Project>(SAMPLE_PROJECTS[0]);
  const [projectPanelOpen, setProjectPanelOpen] = useState(false);
  const [mainView, setMainView] = useState<MainView>("workspace");
  const [projectDetailView, setProjectDetailView] = useState<"apps" | "data" | "members">("apps");
  const [resourceTab, setResourceTab] = useState<"data" | "skill" | "template">("data");

  const createProject = (name: string, description: string): Project => {
    const colors = ["#161FAD", "#0891b2", "#7c3aed", "#059669", "#dc2626", "#d97706"];
    const newProject: Project = {
      id: `proj-${Date.now()}`,
      name,
      description,
      color: colors[projects.length % colors.length],
      members: [defaultMembers[0]],
      data: [],
      apps: [],
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

  const updateProject = (projectId: string, updates: Pick<Project, "name" | "description">) => {
    syncProject(projectId, (project) => ({ ...project, ...updates }));
  };

  const deleteProject = (projectId: string) => {
    if (projects.length <= 1) return;

    const nextProjects = projects.filter((project) => project.id !== projectId);
    setProjects(nextProjects);
    setActiveProject((current) => (current.id === projectId ? nextProjects[0] : current));
    setMainView("workspace");
  };

  const updateProjectDataAsset = (projectId: string, assetId: string, name: string) => {
    syncProject(projectId, (project) => ({
      ...project,
      data: project.data.map((asset) => (asset.id === assetId ? { ...asset, name } : asset)),
    }));
  };

  const deleteProjectDataAsset = (projectId: string, assetId: string) => {
    syncProject(projectId, (project) => ({
      ...project,
      data: project.data.filter((asset) => asset.id !== assetId),
    }));
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
        updateProjectDataAsset,
        deleteProjectDataAsset,
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
