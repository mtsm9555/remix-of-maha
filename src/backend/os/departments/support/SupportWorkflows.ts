import type { WorkflowDefinition } from "../../../workflows/types";

export const SUPPORT_WORKFLOWS: WorkflowDefinition[] = [
  {
    id: "workflow_ticket_triage_and_resolution",
    name: "Inbound Ticket Triage & AI Resolution",
    description: "Standard workflow for analyzing, drafting, and sending a support reply.",
    nodes: [
      { id: "node_1", name: "Analyze Sentiment & Intent", type: "agent_task", config: { agentName: "support-triage-agent", task: "Determine customer sentiment (angry, neutral, happy) and core issue" } },
      { id: "node_2", name: "Search Knowledge Base", type: "agent_task", config: { agentName: "support-resolution-agent", task: "Find relevant help articles to solve the issue" } },
      { id: "node_3", name: "Draft Empathetic Reply", type: "agent_task", config: { agentName: "support-resolution-agent", task: "Draft a reply that acknowledges feelings and provides the solution" } },
      { id: "node_4", name: "Human QA & Tone Check", type: "condition", config: { requiresApproval: true, approverRole: "support_lead" } },
      { id: "node_5", name: "Send Reply", type: "tool_call", config: { toolName: "send_customer_reply" } },
    ],
    edges: [
      { source: "node_1", target: "node_2" },
      { source: "node_2", target: "node_3" },
      { source: "node_3", target: "node_4" },
      { source: "node_4", target: "node_5" },
    ],
  },
  {
    id: "workflow_refund_request",
    name: "Customer Refund & Credit Request",
    description: "Handles customer requests for refunds according to company policy.",
    nodes: [
      { id: "node_1", name: "Verify Purchase & Policy", type: "agent_task", config: { agentName: "support-escalation-agent", task: "Check if the purchase falls within the 30-day refund window" } },
      { id: "node_2", name: "Calculate Credit Amount", type: "agent_task", config: { agentName: "support-escalation-agent", task: "Calculate prorated refund amount" } },
      { id: "node_3", name: "Manager Approval", type: "condition", config: { requiresApproval: true, approverRole: "support_manager" } },
      { id: "node_4", name: "Issue Credit", type: "tool_call", config: { toolName: "issue_account_credit" } },
      { id: "node_5", name: "Notify Customer", type: "tool_call", config: { toolName: "send_customer_reply" } },
    ],
    edges: [
      { source: "node_1", target: "node_2" },
      { source: "node_2", target: "node_3" },
      { source: "node_3", target: "node_4" },
      { source: "node_4", target: "node_5" },
    ],
  },
];

export function initializeSupportWorkflows() {
  console.log("[Support] Loading Triage & Escalation Workflow Playbooks...");
}