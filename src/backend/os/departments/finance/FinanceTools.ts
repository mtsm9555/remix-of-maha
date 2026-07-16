import { z } from "zod";
import { globalToolRegistry } from "../../../tools/ToolRegistry";
import { DepartmentToolPermissions } from "../../permissions/DepartmentToolPermissions";
import type { ToolResult } from "../../../tools/types";

function ok(data: any, start: number): ToolResult {
  return { success: true, data, executionTimeMs: Date.now() - start };
}

export function initializeFinanceTools() {
  console.log("[Finance] Registering Finance Tools & Zero-Trust Permissions...");

  if (!globalToolRegistry.has("generate_invoice")) {
    globalToolRegistry.register({
      name: "generate_invoice",
      description: "Creates and sends a formal invoice to a client.",
      parameters: z.object({
        clientId: z.string(),
        amountUSD: z.number().positive(),
        lineItems: z.array(z.object({ description: z.string(), amount: z.number() })),
        dueDate: z.string(),
      }),
      execute: async () => {
        const s = Date.now();
        return ok(
          { invoiceId: "inv_12345", pdfUrl: "https://docs.company.com/inv_12345.pdf" },
          s,
        );
      },
    });
  }

  if (!globalToolRegistry.has("initiate_wire_transfer")) {
    globalToolRegistry.register({
      name: "initiate_wire_transfer",
      description: "Initiates a real bank wire transfer to a vendor or employee.",
      parameters: z.object({
        beneficiaryName: z.string(),
        accountNumber: z.string(),
        routingNumber: z.string(),
        amountUSD: z.number().positive(),
        reference: z.string(),
      }),
      execute: async () => {
        const s = Date.now();
        return ok({ transferId: "wire_98765", status: "pending_approval" }, s);
      },
    });
  }

  if (!globalToolRegistry.has("process_expense_report")) {
    globalToolRegistry.register({
      name: "process_expense_report",
      description: "Reviews, approves, and reimburses an employee expense report.",
      parameters: z.object({
        employeeId: z.string(),
        totalAmountUSD: z.number().positive(),
        receipts: z.array(z.string().url()),
        category: z.enum(["travel", "software", "meals", "office_supplies", "other"]),
      }),
      execute: async () => {
        const s = Date.now();
        return ok({ reimbursementId: "exp_54321" }, s);
      },
    });
  }

  if (!globalToolRegistry.has("generate_financial_report")) {
    globalToolRegistry.register({
      name: "generate_financial_report",
      description: "Generates P&L, Balance Sheet, or Cash Flow statements.",
      parameters: z.object({
        reportType: z.enum(["profit_and_loss", "balance_sheet", "cash_flow"]),
        period: z.string(),
        audience: z.enum(["internal", "board", "investors"]),
      }),
      execute: async () => {
        const s = Date.now();
        return ok({ reportUrl: "https://docs.company.com/finance/q3_pl.pdf" }, s);
      },
    });
  }

  if (!globalToolRegistry.has("execute_ocr")) {
    globalToolRegistry.register({
      name: "execute_ocr",
      description: "Runs OCR over a document (invoice, receipt) and extracts structured fields.",
      parameters: z.object({
        documentUrl: z.string().url().optional(),
        documentType: z.enum(["invoice", "receipt", "contract"]),
      }),
      execute: async () => {
        const s = Date.now();
        return ok({ fields: { vendor: "Acme", amount: 1234.56 } }, s);
      },
    });
  }

  DepartmentToolPermissions.addRule({
    id: "finance_wire_transfer_approval",
    toolName: "initiate_wire_transfer",
    allowedDepartments: ["finance"],
    level: "require_approval",
    parameterConstraints: [{ field: "amountUSD", operator: "gt", value: 100000 }],
    description:
      "Wire transfers >$100k are strictly blocked. Transfers <=$100k require CFO approval.",
  });

  DepartmentToolPermissions.addRule({
    id: "finance_block_test_accounts",
    toolName: "initiate_wire_transfer",
    allowedDepartments: ["finance"],
    level: "deny",
    parameterConstraints: [
      { field: "accountNumber", operator: "regex", value: "^(0000|1111|9999)" },
    ],
    description: "CRITICAL: Wire transfers to test/dummy accounts are strictly forbidden.",
  });

  DepartmentToolPermissions.addRule({
    id: "finance_expense_compliance",
    toolName: "process_expense_report",
    allowedDepartments: ["finance"],
    level: "deny",
    parameterConstraints: [
      { field: "category", operator: "eq", value: "other" },
      { field: "receipts", operator: "max_value", value: 0 },
    ],
    description:
      "Expense reports with missing receipts or vague 'other' categories are automatically rejected.",
  });

  DepartmentToolPermissions.addRule({
    id: "finance_external_report_approval",
    toolName: "generate_financial_report",
    allowedDepartments: ["finance"],
    level: "require_approval",
    parameterConstraints: [
      { field: "audience", operator: "in", value: ["board", "investors"] },
    ],
    description:
      "Financial reports destined for the Board or Investors require CFO review before generation.",
  });
}