import { ArchitectureRegistry } from "./ArchitectureRegistry";
import { globalDepartmentRegistry } from "../agents/departments/DepartmentRegistry";
import type { Department } from "../agents/departments/types";
import { initializeMarketingTools } from "./departments/marketing/MarketingTools";
import { initializeMarketingWorkflows } from "./departments/marketing/MarketingWorkflows";
import { initializeSalesTools } from "./departments/sales/SalesTools";
import { initializeSalesWorkflows } from "./departments/sales/SalesWorkflows";
import { initializeDesignTools } from "./departments/design/DesignTools";
import { initializeDesignWorkflows } from "./departments/design/DesignWorkflows";

const DEPARTMENTS: Array<{
  id: Department;
  name: string;
  budget: { allocated: number; spent: number; limit: number };
  kpis: Array<{ name: string; target: number; current: number; unit: string }>;
}> = [
  { id: "development", name: "Development", budget: { allocated: 1000, spent: 0, limit: 5000 }, kpis: [{ name: "Code Quality", target: 95, current: 0, unit: "%" }] },
  { id: "marketing", name: "Marketing", budget: { allocated: 2000, spent: 0, limit: 10000 }, kpis: [{ name: "Lead Gen", target: 100, current: 0, unit: "leads" }] },
  { id: "sales", name: "Sales", budget: { allocated: 2000, spent: 0, limit: 10000 }, kpis: [{ name: "Revenue", target: 50000, current: 0, unit: "USD" }] },
  { id: "design", name: "Design", budget: { allocated: 1500, spent: 0, limit: 7500 }, kpis: [{ name: "Assets Shipped", target: 50, current: 0, unit: "assets" }] },
  { id: "operations", name: "Operations", budget: { allocated: 1000, spent: 0, limit: 5000 }, kpis: [{ name: "Uptime", target: 99.9, current: 0, unit: "%" }] },
  { id: "research", name: "Research", budget: { allocated: 1500, spent: 0, limit: 7500 }, kpis: [{ name: "Reports", target: 20, current: 0, unit: "reports" }] },
  { id: "support", name: "Support", budget: { allocated: 1000, spent: 0, limit: 5000 }, kpis: [{ name: "CSAT", target: 95, current: 0, unit: "%" }] },
  { id: "finance", name: "Finance", budget: { allocated: 1000, spent: 0, limit: 5000 }, kpis: [{ name: "Budget Adherence", target: 100, current: 0, unit: "%" }] },
];

let initialized = false;

export async function initializeMahaOS() {
  if (initialized) return;
  console.log("🚀 Initializing Maha AI OS Architecture...");
  initializeMarketingTools();
  initializeMarketingWorkflows();
  initializeSalesTools();
  initializeSalesWorkflows();
  initializeDesignTools();
  initializeDesignWorkflows();
  const config = DEPARTMENTS.map((d) => ({
    ...d,
    agents: globalDepartmentRegistry.getDepartmentAgents(d.id),
  }));
  ArchitectureRegistry.initializeOrganization(config);
  initialized = true;
  const total = config.reduce((sum, d) => sum + d.agents.length, 0);
  console.log(
    `✅ Maha AI OS Architecture Online. ${config.length} Departments, ${total} Agents, ${config.length} Managers ready.`,
  );
}