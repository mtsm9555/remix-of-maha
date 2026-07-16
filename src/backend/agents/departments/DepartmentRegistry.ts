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
import { UIAgent } from "./Design/UIAgent";
import { UXAgent } from "./Design/UXAgent";
import { GraphicAgent } from "./Design/GraphicAgent";
import { VideoAgent } from "./Design/VideoAgent";
import { WorkflowAgent } from "./Operations/WorkflowAgent";
import { AutomationAgent } from "./Operations/AutomationAgent";
import { MonitoringAgent } from "./Operations/MonitoringAgent";
import { ResearchAgent as ResearchDeptAgent } from "./Research/ResearchAgent";
import { CompetitiveAgent } from "./Research/CompetitiveAgent";
import { TrendAgent } from "./Research/TrendAgent";

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

    this.departments.set("design", {
      name: "design",
      displayName: "Design Department",
      description: "Handles UI/UX design, graphics, and video content creation",
      agents: [
        "design-ui-agent",
        "design-ux-agent",
        "design-graphic-agent",
        "design-video-agent",
      ],
      tools: ["figma", "canva", "image-models", "video-models", "tailwind"],
      workflows: ["ui-design", "ux-research", "brand-creation", "video-production"],
    });

    this.departments.set("operations", {
      name: "operations",
      displayName: "Operations Department",
      description: "Handles workflows, automation, and system monitoring",
      agents: ["ops-workflow-agent", "ops-automation-agent", "ops-monitoring-agent"],
      tools: ["playwright", "prometheus", "grafana", "zapier", "workflow-engine"],
      workflows: ["workflow-design", "task-automation", "system-monitoring", "incident-response"],
    });

    this.departments.set("research", {
      name: "research",
      displayName: "Research Department",
      description: "Handles deep research, competitive analysis, and trend monitoring",
      agents: ["research-research-agent", "research-competitive-agent", "research-trend-agent"],
      tools: ["web-search", "academic-databases", "market-reports", "news-feeds", "industry-reports"],
      workflows: ["deep-research", "competitive-analysis", "trend-monitoring", "market-intelligence"],
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
    this.registerAgent(new UIAgent());
    this.registerAgent(new UXAgent());
    this.registerAgent(new GraphicAgent());
    this.registerAgent(new VideoAgent());
    this.registerAgent(new WorkflowAgent());
    this.registerAgent(new AutomationAgent());
    this.registerAgent(new MonitoringAgent());
    this.registerAgent(new ResearchDeptAgent());
    this.registerAgent(new CompetitiveAgent());
    this.registerAgent(new TrendAgent());
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
    if (t.includes("ui") || t.includes("interface") || t.includes("component") || t.includes("layout"))
      return agents.find((a) => a.role.includes("UI"));
    if (t.includes("ux") || t.includes("user experience") || t.includes("user flow") || t.includes("journey") || t.includes("wireframe"))
      return agents.find((a) => a.role.includes("UX") || a.role.includes("User Experience"));
    if (t.includes("logo") || t.includes("graphic") || t.includes("brand") || t.includes("illustration") || t.includes("banner") || t.includes("poster"))
      return agents.find((a) => a.role.includes("Graphic"));
    if (t.includes("video") || t.includes("storyboard") || t.includes("script") || t.includes("animation"))
      return agents.find((a) => a.role.includes("Video"));
    if (t.includes("workflow") || t.includes("process") || t.includes("bottleneck"))
      return agents.find((a) => a.role.includes("Workflow"));
    if (t.includes("automate") || t.includes("automation") || t.includes("playwright") || t.includes("scrape") || t.includes("browser"))
      return agents.find((a) => a.role.includes("Automation"));
    if (t.includes("monitor") || t.includes("alert") || t.includes("health") || t.includes("uptime") || t.includes("sla") || t.includes("metrics"))
      return agents.find((a) => a.role.includes("Monitoring"));
    if (t.includes("competitor") || t.includes("competitive") || t.includes("market analysis") || t.includes("benchmark") || t.includes("swot"))
      return agents.find((a) => a.role.includes("Competitive"));
    if (t.includes("trend") || t.includes("forecast") || t.includes("future") || t.includes("emerging"))
      return agents.find((a) => a.role.includes("Trend"));
    if (t.includes("research") || t.includes("investigate") || t.includes("study") || t.includes("deep dive"))
      return agents.find((a) => a.role.includes("Research"));
    return agents.find((a) => a.status === "idle");
  }

  getAllAgentStatus() {
    return this.getAllAgents().map((a) => a.getStatus());
  }
}

export const globalDepartmentRegistry = new DepartmentRegistry();