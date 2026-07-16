import type { WorkflowDefinition } from "../../../workflows/types";

export const HR_WORKFLOWS: WorkflowDefinition[] = [
  {
    id: "workflow_candidate_interview_loop",
    name: "Standard Candidate Interview Loop",
    description: "End-to-end workflow for screening, interviewing, and generating an offer.",
    nodes: [
      { id: "node_1", name: "Screen Resume", type: "agent_task", config: { agentName: "hr-recruiting-agent", task: "Evaluate candidate resume against job description" } },
      { id: "node_2", name: "Schedule Screening Call", type: "tool_call", config: { toolName: "schedule_candidate_interview", args: { interviewType: "screening", durationMinutes: 30 } } },
      { id: "node_3", name: "Technical Interview", type: "tool_call", config: { toolName: "schedule_candidate_interview", args: { interviewType: "technical", durationMinutes: 60 } } },
      { id: "node_4", name: "Generate Offer", type: "agent_task", config: { agentName: "hr-recruiting-agent", task: "Draft offer letter based on approved salary band" } },
      { id: "node_5", name: "Legal/VP Review", type: "condition", config: { requiresApproval: true, approverRole: "vp_people" } },
    ],
    edges: [
      { source: "node_1", target: "node_2" },
      { source: "node_2", target: "node_3" },
      { source: "node_3", target: "node_4" },
      { source: "node_4", target: "node_5" },
    ],
  },
  {
    id: "workflow_new_hire_onboarding",
    name: "Automated New Hire Onboarding",
    description: "Ensures a seamless Day 1 experience for new employees.",
    nodes: [
      { id: "node_1", name: "Send Welcome Packet", type: "tool_call", config: { toolName: "send_employee_communication", args: { recipientType: "individual" } } },
      { id: "node_2", name: "Provision IT Accounts", type: "agent_task", config: { agentName: "hr-onboarding-agent", task: "Trigger IT provisioning workflow for email, Slack, and GitHub" } },
      { id: "node_3", name: "Assign Mentor", type: "agent_task", config: { agentName: "hr-culture-agent", task: "Match new hire with a peer mentor based on team and interests" } },
      { id: "node_4", name: "Schedule 30-Day Check-in", type: "tool_call", config: { toolName: "schedule_candidate_interview", args: { interviewType: "culture", durationMinutes: 45 } } },
    ],
    edges: [
      { source: "node_1", target: "node_2" },
      { source: "node_2", target: "node_3" },
      { source: "node_3", target: "node_4" },
    ],
  },
];

export function initializeHRWorkflows() {
  console.log("[HR] Loading Recruiting & Onboarding Workflow Playbooks...");
}