import type { TenantContext } from "./TenantTypes";

export class TenantIsolationEngine {
  static getIsolatedKey(ctx: TenantContext, baseKey: string): string {
    return `maha:${ctx.tenantId}:${baseKey}`;
  }
  static getIsolatedQueueName(ctx: TenantContext, baseQueueName: string): string {
    return `maha_queue:${ctx.tenantId}:${baseQueueName}`;
  }
  static async verifyResourceOwnership(
    _ctx: TenantContext,
    _resourceId: string,
    _resourceTableName: string,
  ): Promise<boolean> {
    return true;
  }
}