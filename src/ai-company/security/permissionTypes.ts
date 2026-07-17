// src/security/permissionTypes.ts

export type Permission =
  | "read_task"
  | "write_task"
  | "assign_task"
  | "archive_task"
  | "read_memory"
  | "write_memory"
  | "review_action"
  | "manage_agents";
