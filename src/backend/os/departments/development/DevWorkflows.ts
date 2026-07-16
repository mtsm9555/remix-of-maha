import type { WorkflowDefinition } from "../../../workflows/types";

export const DEV_WORKFLOWS: WorkflowDefinition[] = [
  {
    id: "workflow_feature_development",
    name: "Feature Development & PR Pipeline",
    description: "Standard workflow for writing code, testing, and creating a Pull Request.",
    nodes: [
      { id: "node_1", name: "Write Code", type: "agent_task", config: { agentName: "dev-code-agent", task: "Implement feature based on Jira ticket" } },
      { id: "node_2", name: "Run Unit Tests", type: "tool_call", config: { toolName: "execute_terminal_command", args: { command: "npm run test", environment: "ci" } } },
      { id: "node_3", name: "Code Quality Check", type: "agent_task", config: { agentName: "dev-security-agent", task: "Run linting and static analysis" } },
      { id: "node_4", name: "Human Code Review", type: "condition", config: { requiresApproval: true, approverRole: "senior_engineer" } },
      { id: "node_5", name: "Push to Git", type: "tool_call", config: { toolName: "push_to_git" } },
    ],
    edges: [
      { source: "node_1", target: "node_2" },
      { source: "node_2", target: "node_3" },
      { source: "node_3", target: "node_4" },
      { source: "node_4", target: "node_5" },
    ],
  },
  {
    id: "workflow_production_release",
    name: "Production Release Pipeline",
    description: "Safe deployment to production with automated rollback triggers.",
    nodes: [
      { id: "node_1", name: "Deploy to Staging", type: "tool_call", config: { toolName: "deploy_to_environment", args: { environment: "staging" } } },
      { id: "node_2", name: "Run E2E Tests", type: "tool_call", config: { toolName: "execute_terminal_command", args: { command: "npx playwright test", environment: "staging" } } },
      { id: "node_3", name: "Production Approval", type: "condition", config: { requiresApproval: true, approverRole: "cto" } },
      { id: "node_4", name: "Deploy to Production", type: "tool_call", config: { toolName: "deploy_to_environment", args: { environment: "production" } } },
      { id: "node_5", name: "Monitor Health", type: "agent_task", config: { agentName: "dev-devops-agent", task: "Monitor error rates for 15 mins" } },
    ],
    edges: [
      { source: "node_1", target: "node_2" },
      { source: "node_2", target: "node_3" },
      { source: "node_3", target: "node_4" },
      { source: "node_4", target: "node_5" },
    ],
  },
];

export function initializeDevelopmentWorkflows() {
  console.log("[Development] Loading DevOps Workflow Playbooks...");
}