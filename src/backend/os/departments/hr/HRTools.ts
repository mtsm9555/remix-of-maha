import { globalToolRegistry } from "../../../tools/ToolRegistry";
import { DepartmentToolPermissions } from "../../permissions/DepartmentToolPermissions";
import { z } from "zod";

export function initializeHRTools() {
  console.log("[HR] Registering HR Tools & PII Protection Permissions...");

  globalToolRegistry.register({
    name: "generate_offer_letter",
    description: "Generates a formal employment offer letter with compensation details.",
    parameters: z.object({
      candidateName: z.string(),
      role: z.string(),
      baseSalaryUSD: z.number().positive(),
      equityPercentage: z.number().min(0).max(5),
      startDate: z.string(),
    }),
    execute: async () => ({ success: true, documentId: "offer_99887", pdfUrl: "https://docs.company.com/offers/offer_99887.pdf" }),
  });

  globalToolRegistry.register({
    name: "schedule_candidate_interview",
    description: "Sends calendar invites to candidates and interview panelists.",
    parameters: z.object({
      candidateEmail: z.string().email(),
      panelists: z.array(z.string().email()),
      durationMinutes: z.number(),
      interviewType: z.enum(["screening", "technical", "culture", "final"]),
    }),
    execute: async () => ({ success: true, calendarEventId: "evt_11223" }),
  });

  globalToolRegistry.register({
    name: "send_employee_communication",
    description: "Sends HR-related emails or Slack messages to employees (e.g., policy updates, surveys).",
    parameters: z.object({
      recipientType: z.enum(["individual", "team", "all_hands"]),
      recipientEmail: z.string().email().optional(),
      subject: z.string(),
      body: z.string(),
    }),
    execute: async () => ({ success: true, messageId: "hr_msg_44556" }),
  });

  globalToolRegistry.register({
    name: "initiate_background_check",
    description: "Triggers a third-party background and identity verification check.",
    parameters: z.object({
      candidateFullName: z.string(),
      ssn: z.string().min(9).max(9),
      consentSigned: z.boolean(),
    }),
    execute: async () => ({ success: true, checkId: "bg_77889", status: "processing" }),
  });

  DepartmentToolPermissions.addRule({
    id: "hr_salary_band_limits",
    toolName: "generate_offer_letter",
    allowedDepartments: ["hr"],
    level: "require_approval",
    parameterConstraints: [{ field: "baseSalaryUSD", operator: "gt", value: 150000 }],
    description: "Offer letters with base salaries over $150k require VP of People approval.",
  });

  DepartmentToolPermissions.addRule({
    id: "hr_block_pii_in_email",
    toolName: "send_employee_communication",
    allowedDepartments: ["hr", "finance"],
    level: "deny",
    parameterConstraints: [
      { field: "body", operator: "regex", value: "\\b\\d{3}-\\d{2}-\\d{4}\\b" },
      { field: "body", operator: "regex", value: "\\b\\d{9}\\b" },
    ],
    description: "CRITICAL: Sending SSNs or sensitive PII via standard email is strictly blocked. Use secure HRIS portal.",
  });

  DepartmentToolPermissions.addRule({
    id: "hr_survey_rate_limit",
    toolName: "send_employee_communication",
    allowedDepartments: ["hr"],
    level: "require_approval",
    parameterConstraints: [
      { field: "recipientType", operator: "eq", value: "all_hands" },
      { field: "subject", operator: "regex", value: "(?i)(survey|feedback|pulse)" },
    ],
    maxExecutionsPerHour: 1,
    description: "Company-wide surveys require approval and are strictly rate-limited to prevent fatigue.",
  });

  DepartmentToolPermissions.addRule({
    id: "hr_background_check_consent",
    toolName: "initiate_background_check",
    allowedDepartments: ["hr"],
    level: "deny",
    parameterConstraints: [{ field: "consentSigned", operator: "eq", value: false }],
    description: "Background checks cannot be initiated without explicit candidate consent (FCRA compliance).",
  });
}