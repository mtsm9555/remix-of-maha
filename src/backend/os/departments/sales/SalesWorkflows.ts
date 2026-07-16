import type { WorkflowDefinition } from "../../../workflows/types";

export const SALES_WORKFLOWS: WorkflowDefinition[] = [
  {
    id: "workflow_inbound_qualification",
    name: "Inbound Lead Qualification & Routing",
    description: "Automatically enriches, scores, and routes inbound leads to the CRM.",
    nodes: [
      { id: "node_1", name: "Enrich Lead Data", type: "tool_call", config: { toolName: "enrich_lead_data" } },
      { id: "node_2", name: "Score Lead (BANT)", type: "agent_task", config: { agentName: "sales-lead-agent", task: "Evaluate lead against Budget, Authority, Need, Timeline criteria" } },
      { id: "node_3", name: "Update CRM", type: "tool_call", config: { toolName: "update_crm_pipeline" } },
      { id: "node_4", name: "Notify Account Executive", type: "tool_call", config: { toolName: "send_internal_notification" } },
    ],
    edges: [
      { source: "node_1", target: "node_2" },
      { source: "node_2", target: "node_3" },
      { source: "node_3", target: "node_4" },
    ],
  },
  {
    id: "workflow_outbound_sequence",
    name: "Automated Outbound Cold Sequence",
    description: "Drafts, reviews, and sends a 3-step cold email sequence.",
    nodes: [
      { id: "node_1", name: "Draft Initial Email", type: "agent_task", config: { agentName: "sales-outreach-agent", task: "Write personalized cold email based on enriched data" } },
      { id: "node_2", name: "Human Compliance Check", type: "condition", config: { requiresApproval: true, approverRole: "sales_manager" } },
      { id: "node_3", name: "Send Email 1", type: "tool_call", config: { toolName: "send_sales_outreach" } },
      { id: "node_4", name: "Wait 3 Days", type: "condition", config: { waitTimeMs: 259200000 } },
      { id: "node_5", name: "Send Follow-up", type: "tool_call", config: { toolName: "send_sales_outreach" } },
    ],
    edges: [
      { source: "node_1", target: "node_2" },
      { source: "node_2", target: "node_3" },
      { source: "node_3", target: "node_4" },
      { source: "node_4", target: "node_5" },
    ],
  },
];

export function initializeSalesWorkflows() {
  console.log("[Sales] Loading Sales Workflow Playbooks...");
}