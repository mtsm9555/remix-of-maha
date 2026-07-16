import type { Department, DepartmentAgent, DepartmentConfig } from "./types";
import { CodeAgent } from "./Development/CodeAgent";
import { DebugAgent } from "./Development/DebugAgent";
import { DevOpsAgent } from "./Development/DevOpsAgent";
import { ContentAgent } from "./Marketing/ContentAgent";
import { SEOAgent } from "./Marketing/SEOAgent";
import { SocialMediaAgent } from "./Marketing/SocialMediaAgent";
import { AnalyticsAgent } from "./Marketing/AnalyticsAgent";
import { AdsAgent } from "./Marketing/AdsAgent";
import { LeadAgent } from "./Sales/LeadAgent";
import { CRMAgent } from "./Sales/CRMAgent";
import { OutreachAgent } from "./Sales/OutreachAgent";
import { ProposalAgent } from "./Sales/ProposalAgent";

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

    this.departments.set("sales", {
      name: "sales",
      displayName: "Sales Department",
      description: "Handles lead generation, CRM, outreach, and proposals",
      agents: [
        "sales-lead-agent",
        "sales-crm-agent",
        "sales-outreach-agent",
        "sales-proposal-agent",
      ],
      tools: ["salesforce", "hubspot", "linkedin", "email", "crm", "docs"],
      workflows: ["lead-generation", "outreach-campaign", "proposal-creation"],
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
    this.registerAgent(new LeadAgent());
    this.registerAgent(new CRMAgent());
    this.registerAgent(new OutreachAgent());
    this.registerAgent(new ProposalAgent());
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
    if (t.includes("lead") || t.includes("prospect") || t.includes("qualify"))
      return agents.find((a) => a.role.includes("Lead"));
    if (t.includes("crm") || t.includes("pipeline") || t.includes("customer relationship"))
      return agents.find((a) => a.role.includes("CRM") || a.role.includes("Customer Relationship"));
    if (t.includes("outreach") || t.includes("cold email"))
      return agents.find((a) => a.role.includes("Outreach"));
    if (t.includes("proposal") || t.includes("quote") || t.includes("pricing"))
      return agents.find((a) => a.role.includes("Proposal"));
    return agents.find((a) => a.status === "idle");
  }

  getAllAgentStatus() {
    return this.getAllAgents().map((a) => a.getStatus());
  }
}

export const globalDepartmentRegistry = new DepartmentRegistry();