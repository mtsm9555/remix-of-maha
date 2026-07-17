export type AuditLevel = "info" | "warning" | "error";

export type AuditEvent = {
  id: string;
  source: string;
  action: string;
  targetId?: string;
  level: AuditLevel;
  message: string;
  createdAt: string;
};