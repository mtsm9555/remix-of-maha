import type { Department, DepartmentAgent, DepartmentConfig } from "./types";
import { CodeAgent } from "./Development/CodeAgent";
import { DebugAgent } from "./Development/DebugAgent";
import { DevOpsAgent } from "./Development/DevOpsAgent";
import { ContentAgent } from "./Marketing/ContentAgent";
import { SEOAgent } from "./Marketing/SEOAgent";
import { SocialMediaAgent } from "./Marketing/SocialMediaAgent";
import { AnalyticsAgent } from "./Marketing/AnalyticsAgent";
import { AdsAgent } from "./Marketing/AdsAgent";

export class DepartmentRegistry {
  private departments: Map<Department, DepartmentConfig> = new Map();
  private agents: Map<string, DepartmentAgent> = new Map();

  constructor() {
    this.initializeDepartments();
    this.initializeAgents();
  }

  private initializeDepartments() {
    this.departments.set("development", {
      name: "development",
      displayName: "Development Department",
      description: "Handles all software development tasks",
      agents: ["dev-code-agent", "dev-debug-agent", "dev-devops-agent"],
      tools: ["github", "terminal", "docker", "kubernetes", "vscode"],
      workflows: ["code-review", "bug-fix", "deployment"],
    });

    this.departments.set("marketing", {
      name: "marketing",
      displayName: "Marketing Department",
      description: "Handles marketing, content creation, and brand growth",
      agents: [
        "marketing-content-agent",
        "marketing-seo-agent",
        "marketing-social-agent",
        "marketing-analytics-agent",
        "marketing-ads-agent",
      ],
      tools: ["google-analytics", "meta", "linkedin", "twitter", "google-ads", "blog-cms"],
      workflows: ["content-creation", "seo-optimization", "social-campaign", "ad-campaign"],
    });
  }

  private initializeAgents() {
    this.registerAgent(new CodeAgent());
    this.registerAgent(new DebugAgent());
    this.registerAgent(new DevOpsAgent());
    this.registerAgent(new ContentAgent());
    this.registerAgent(new SEOAgent());
    this.registerAgent(new SocialMediaAgent());
    this.registerAgent(new AnalyticsAgent());
    this.registerAgent(new AdsAgent());
  }

  private registerAgent(agent: DepartmentAgent) {
    this.agents.set(agent.id, agent);
    console.log(`[DepartmentRegistry] Registered agent: ${agent.name} (${agent.department})`);
  }

  getAgent(agentId: string): DepartmentAgent | undefined {
    return this.agents.get(agentId);
  }

  getDepartmentAgents(department: Department): DepartmentAgent[] {
    return Array.from(this.agents.values()).filter((a) => a.department === department);
  }

  getDepartment(department: Department): DepartmentConfig | undefined {
    return this.departments.get(department);
  }

  getAllDepartments(): DepartmentConfig[] {
    return Array.from(this.departments.values());
  }

  getAllAgents(): DepartmentAgent[] {
    return Array.from(this.agents.values());
  }

  findBestAgent(task: string, department?: Department): DepartmentAgent | undefined {
    const agents = department ? this.getDepartmentAgents(department) : this.getAllAgents();
    const t = task.toLowerCase();
    if (t.includes("code") || t.includes("implement") || t.includes("write"))
      return agents.find((a) => a.role.includes("Engineer"));
    if (t.includes("debug") || t.includes("fix") || t.includes("error"))
      return agents.find((a) => a.role.includes("Debug"));
    if (t.includes("deploy") || t.includes("docker") || t.includes("kubernetes"))
      return agents.find((a) => a.role.includes("DevOps"));
    return agents.find((a) => a.status === "idle");
  }

  getAllAgentStatus() {
    return this.getAllAgents().map((a) => a.getStatus());
  }
}

export const globalDepartmentRegistry = new DepartmentRegistry();