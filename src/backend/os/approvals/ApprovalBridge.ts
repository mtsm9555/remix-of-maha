// src/backend/os/approvals/ApprovalBridge.ts
import type { ToolAccessDecision } from "../permissions/ToolPermissionTypes";

export interface ApprovalRequest {
  reason?: string;
  [key: string]: any;
}

export interface PendingApproval {
  id: string;
  request: ApprovalRequest | ToolAccessDecision;
  context: string;
  resolve: (approved: boolean) => void;
  timestamp: Date;
}

type WSClient = { readyState: number; send: (data: string) => void };

export class ApprovalBridge {
  private static pendingApprovals: Map<string, PendingApproval> = new Map();
  private static wsClients: Set<WSClient> = new Set();

  static registerClient(ws: WSClient) {
    this.wsClients.add(ws);
    console.log(`[ApprovalBridge] Client registered. Total clients: ${this.wsClients.size}`);
  }

  static unregisterClient(ws: WSClient) {
    this.wsClients.delete(ws);
  }

  static async requestApproval(
    id: string,
    request: ApprovalRequest | ToolAccessDecision,
    context: string,
  ): Promise<boolean> {
    return new Promise<boolean>((resolve) => {
      const pending: PendingApproval = { id, request, context, resolve, timestamp: new Date() };
      this.pendingApprovals.set(id, pending);
      console.log(`[ApprovalBridge] ⏸️ Execution paused. Waiting for approval on ID: ${id}`);
      this.broadcastToClients({
        type: "APPROVAL_REQUEST",
        data: {
          id,
          context,
          reason: (request as any).reason || "Action requires human oversight",
          timestamp: pending.timestamp,
        },
      });
    });
  }

  static resolveApproval(approvalId: string, approved: boolean) {
    const pending = this.pendingApprovals.get(approvalId);
    if (pending) {
      console.log(
        `[ApprovalBridge] ▶️ Execution resumed for ID: ${approvalId}. Decision: ${approved ? "APPROVED" : "REJECTED"}`,
      );
      pending.resolve(approved);
      this.pendingApprovals.delete(approvalId);
    } else {
      console.warn(`[ApprovalBridge] Approval ID ${approvalId} not found or already resolved.`);
    }
  }

  static listPending(): PendingApproval[] {
    return Array.from(this.pendingApprovals.values());
  }

  private static broadcastToClients(message: any) {
    const payload = JSON.stringify(message);
    for (const client of this.wsClients) {
      if (client.readyState === 1) client.send(payload);
    }
  }

  static getPendingCount(): number {
    return this.pendingApprovals.size;
  }
}