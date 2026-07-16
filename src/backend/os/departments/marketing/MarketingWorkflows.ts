import type { WorkflowDefinition } from "../../../workflows/types";

export const MARKETING_WORKFLOWS: WorkflowDefinition[] = [
  {
    id: "workflow_content_campaign",
    name: "Launch Content Marketing Campaign",
    description:
      "End-to-end workflow for researching, writing, optimizing, and publishing a content campaign.",
    nodes: [
      { id: "node_1", name: "Research Topic", type: "agent_task", config: { agentName: "marketing-research-agent", task: "Research trending topics in AI OS market" } },
      { id: "node_2", name: "Draft Article", type: "agent_task", config: { agentName: "marketing-content-agent", task: "Write 1500 word article based on research" } },
      { id: "node_3", name: "SEO Optimization", type: "agent_task", config: { agentName: "marketing-seo-agent", task: "Optimize draft for target keywords and meta tags" } },
      { id: "node_4", name: "Human Editorial Review", type: "condition", config: { requiresApproval: true, approverRole: "editor" } },
      { id: "node_5", name: "Publish to CMS", type: "tool_call", config: { toolName: "publish_blog_post" } },
      { id: "node_6", name: "Social Promotion", type: "agent_task", config: { agentName: "marketing-social-agent", task: "Create 5 social posts linking to the article" } },
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
    id: "workflow_seo_audit",
    name: "Monthly SEO Site Audit",
    description: "Automated monthly crawl and optimization of the top 20 landing pages.",
    nodes: [
      { id: "node_1", name: "Crawl Top Pages", type: "tool_call", config: { toolName: "crawl_sitemap" } },
      { id: "node_2", name: "Run SEO Audit", type: "agent_task", config: { agentName: "marketing-seo-agent", task: "Analyze crawled pages for technical SEO issues" } },
      { id: "node_3", name: "Generate Report", type: "agent_task", config: { agentName: "marketing-analytics-agent", task: "Compile findings into executive PDF report" } },
    ],
    edges: [
      { source: "node_1", target: "node_2" },
      { source: "node_2", target: "node_3" },
    ],
  },
];

export function initializeMarketingWorkflows() {
  console.log("[Marketing] Loading Marketing Workflow Playbooks...");
}