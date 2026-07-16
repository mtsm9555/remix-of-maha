import type { WorkflowDefinition } from "../../../workflows/types";

export const DESIGN_WORKFLOWS: WorkflowDefinition[] = [
  {
    id: "workflow_ui_component_handoff",
    name: "UI Component Design & Developer Handoff",
    description: "End-to-end workflow for designing, reviewing, and coding a UI component.",
    nodes: [
      { id: "node_1", name: "Gather Requirements", type: "agent_task", config: { agentName: "design-ux-agent", task: "Analyze user stories and define component requirements" } },
      { id: "node_2", name: "Create Wireframe", type: "agent_task", config: { agentName: "design-ux-agent", task: "Generate low-fidelity wireframe and user flow" } },
      { id: "node_3", name: "High-Fidelity Design", type: "agent_task", config: { agentName: "design-ui-agent", task: "Create high-fidelity mockup using brand guidelines" } },
      { id: "node_4", name: "Design Review", type: "condition", config: { requiresApproval: true, approverRole: "lead_designer" } },
      { id: "node_5", name: "Generate Code", type: "tool_call", config: { toolName: "generate_ui_component_code" } },
      { id: "node_6", name: "Accessibility Audit", type: "agent_task", config: { agentName: "design-ui-agent", task: "Run WCAG 2.1 AA compliance check on generated code" } },
    ],
    edges: [
      { source: "node_1", target: "node_2" },
      { source: "node_2", target: "node_3" },
      { source: "node_3", target: "node_4" },
      { source: "node_4", target: "node_5" },
      { source: "node_5", target: "node_6" },
    ],
  },
  {
    id: "workflow_marketing_asset_gen",
    name: "Marketing Campaign Asset Generation",
    description: "Generates multiple AI image variations for a marketing campaign.",
    nodes: [
      { id: "node_1", name: "Define Visual Style", type: "agent_task", config: { agentName: "design-graphic-agent", task: "Define prompt style based on campaign brief" } },
      { id: "node_2", name: "Generate Variations", type: "tool_call", config: { toolName: "generate_ai_image" } },
      { id: "node_3", name: "Human Curation", type: "condition", config: { requiresApproval: true, approverRole: "marketing_manager" } },
      { id: "node_4", name: "Upscale & Export", type: "tool_call", config: { toolName: "generate_ai_image" } },
    ],
    edges: [
      { source: "node_1", target: "node_2" },
      { source: "node_2", target: "node_3" },
      { source: "node_3", target: "node_4" },
    ],
  },
];

export function initializeDesignWorkflows() {
  console.log("[Design] Loading Design Workflow Playbooks...");
}