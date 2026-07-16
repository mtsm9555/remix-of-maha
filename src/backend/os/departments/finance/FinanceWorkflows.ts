import type { WorkflowDefinition } from "../../../workflows/types";

export const FINANCE_WORKFLOWS: WorkflowDefinition[] = [
  {
    id: "workflow_month_end_close",
    name: "Automated Month-End Financial Close",
    description: "Standard accounting SOP for closing the books at the end of the month.",
    nodes: [
      { id: "node_1", name: "Reconcile Bank Accounts", type: "agent_task", config: { agentName: "finance-accounting-agent", task: "Match internal ledger with bank statements" } },
      { id: "node_2", name: "Process Accruals", type: "agent_task", config: { agentName: "finance-accounting-agent", task: "Calculate and post month-end accrual journal entries" } },
      { id: "node_3", name: "Generate Draft P&L", type: "tool_call", config: { toolName: "generate_financial_report", args: { reportType: "profit_and_loss", audience: "internal" } } },
      { id: "node_4", name: "CFO Review & Approval", type: "condition", config: { requiresApproval: true, approverRole: "cfo" } },
      { id: "node_5", name: "Lock Accounting Period", type: "tool_call", config: { toolName: "execute_terminal_command", args: { command: "lock_period --month=current", environment: "production" } } },
    ],
    edges: [
      { source: "node_1", target: "node_2" },
      { source: "node_2", target: "node_3" },
      { source: "node_3", target: "node_4" },
      { source: "node_4", target: "node_5" },
    ],
  },
  {
    id: "workflow_invoice_processing",
    name: "Accounts Payable Invoice Processing",
    description: "Automated 3-way matching and payment processing for vendor invoices.",
    nodes: [
      { id: "node_1", name: "Extract Invoice Data", type: "tool_call", config: { toolName: "execute_ocr", args: { documentType: "invoice" } } },
      { id: "node_2", name: "3-Way Match", type: "agent_task", config: { agentName: "finance-compliance-agent", task: "Match invoice against PO and delivery receipt" } },
      { id: "node_3", name: "Approve Payment", type: "condition", config: { requiresApproval: true, approverRole: "ap_manager" } },
      { id: "node_4", name: "Execute Payment", type: "tool_call", config: { toolName: "initiate_wire_transfer" } },
    ],
    edges: [
      { source: "node_1", target: "node_2" },
      { source: "node_2", target: "node_3" },
      { source: "node_3", target: "node_4" },
    ],
  },
];

export function initializeFinanceWorkflows() {
  console.log("[Finance] Loading Accounting & Compliance Workflow Playbooks...");
}