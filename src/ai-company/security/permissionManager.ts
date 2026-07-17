// src/security/permissionManager.ts

import { Permission } from "./permissionTypes";

export type Role = "worker" | "planner" | "reviewer" | "manager" | "admin";

const rolePermissions: Record<Role, Permission[]> = {
  worker: ["read_task", "write_task", "read_memory"],
  planner: ["read_task", "write_task", "assign_task", "read_memory", "write_memory"],
  reviewer: ["read_task", "read_memory", "review_action"],
  manager: ["read_task", "write_task", "assign_task", "archive_task", "read_memory", "write_memory", "review_action"],
  admin: ["read_task", "write_task", "assign_task", "archive_task", "read_memory", "write_memory", "review_action", "manage_agents"],
};

export class PermissionManager {
  hasPermission(role: Role, permission: Permission): boolean {
    return rolePermissions[role].includes(permission);
  }

  assertPermission(role: Role, permission: Permission): void {
    if (!this.hasPermission(role, permission)) {
      throw new Error(`Permission denied: role "${role}" cannot "${permission}"`);
    }
  }

  getPermissions(role: Role): Permission[] {
    return rolePermissions[role];
  }
}
