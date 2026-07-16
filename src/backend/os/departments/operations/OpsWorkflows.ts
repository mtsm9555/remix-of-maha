import type { WorkflowDefinition } from "../../../workflows/types";

export const OPS_WORKFLOWS: WorkflowDefinition[] = [
  {
    id: "workflow_incident_response",
    name: "Automated Incident Response Runbook",
    description: "Standard SOP for handling a P1 system alert.",
    nodes: [
      { id: "node_1", name: "Triage Alert", type: "agent_task", config: { agentName: "ops-monitoring-agent", task: "Analyze alert logs and determine severity" } },
      { id: "node_2", name: "Notify On-Call", type: "tool_call", config: { toolName: "send_internal_broadcast", args: { channel: "on-call-engineers", priority: "high" } } },
      { id: "node_3", name: "Execute Mitigation", type: "agent_task", config: { agentName: "ops-automation-agent", task: "Run automated mitigation script (e.g., clear cache, restart non-critical pod)" } },
      { id: "node_4", name: "Verify Resolution", type: "agent_task", config: { agentName: "ops-monitoring-agent", task: "Monitor metrics for 10 minutes to confirm stability" } },
      { id: "node_5", name: "Generate Post-Mortem", type: "agent_task", config: { agentName: "ops-workflow-agent", task: "Draft incident report and timeline" } },
    ],
    edges: [
      { source: "node_1", target: "node_2" },
      { source: "node_2", target: "node_3" },
      { source: "node_3", target: "node_4" },
      { source: "node_4", target: "node_5" },
    ],
  },
  {
    id: "workflow_new_hire_provisioning",
    name: "Automated New Hire IT Provisioning",
    description: "Automatically sets up accounts and licenses for a new employee.",
    nodes: [
      { id: "node_1", name: "Create Email Account", type: "tool_call", config: { toolName: "provision_vendor_license", args: { vendor: "google-workspace" } } },
      { id: "node_2", name: "Assign Software Licenses", type: "tool_call", config: { toolName: "provision_vendor_license", args: { vendor: "github" } } },
      { id: "node_3", name: "Send Welcome Packet", type: "tool_call", config: { toolName: "send_internal_broadcast", args: { channel: "new-hire-email", priority: "normal" } } },
    ],
    edges: [
      { source: "node_1", target: "node_2" },
      { source: "node_2", target: "node_3" },
    ],
  },
];

export function initializeOperationsWorkflows() {
  console.log("[Operations] Loading SRE & Automation Workflow Playbooks...");
}