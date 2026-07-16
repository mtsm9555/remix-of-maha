// src/backend/auth/PermissionEngine.ts
import { AuthContext } from "./types";

export class PermissionEngine {
  static hasPermission(
    context: AuthContext,
    resource: string,
    action: string,
    target?: string,
  ): boolean {
    if (context.role === "admin") return true;

    const permissionString = target ? `${resource}:${action}:${target}` : `${resource}:${action}`;
    const wildcardPermission = `${resource}:${action}:*`;

    return (
      context.permissions.includes(permissionString) ||
      context.permissions.includes(wildcardPermission) ||
      context.permissions.includes(`${resource}:*`)
    );
  }

  static requirePermission(
    context: AuthContext,
    resource: string,
    action: string,
    target?: string,
  ): void {
    if (!this.hasPermission(context, resource, action, target)) {
      const targetStr = target ? `:${target}` : "";
      throw new Error(
        `Permission denied: ${context.userId} cannot ${action} ${resource}${targetStr}`,
      );
    }
  }

  static filterByPermission<T extends { name: string }>(
    context: AuthContext,
    items: T[],
    resource: string,
    action: string,
  ): T[] {
    if (context.role === "admin") return items;
    return items.filter((item) => this.hasPermission(context, resource, action, item.name));
  }
}