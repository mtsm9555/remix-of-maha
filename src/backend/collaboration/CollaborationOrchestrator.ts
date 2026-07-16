import type {
  AgentMessage,
  CollaborationSession,
} from "./CollaborationTypes";
import type { Department } from "../agents/departments/types";
import { AgentMessageBus } from "./AgentMessageBus";
import { SharedBlackboard } from "./SharedBlackboard";

export class CollaborationOrchestrator {
  static async initiateCollaboration(
    initiatorId: string,
    initiatorDept: Department,
    targetDept: Department,
    objective: string,
    payload: Record<string, unknown>,
  ): Promise<CollaborationSession> {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const sessionId = `collab_${crypto.randomUUID()}`;
    const blackboardId = await SharedBlackboard.createSessionBlackboard(sessionId);

    const session: CollaborationSession = {
      id: sessionId,
      initiatorId,
      participants: [initiatorId],
      objective,
      status: "negotiating",
      blackboardId,
      createdAt: new Date(),
    };

    await supabaseAdmin.from("collaboration_sessions").insert({
      id: session.id,
      initiator_id: session.initiatorId,
      participants: session.participants,
      objective: session.objective,
      status: session.status,
      blackboard_id: session.blackboardId,
      created_at: session.createdAt.toISOString(),
    });

    const rfpMessage: AgentMessage = {
      id: `msg_${crypto.randomUUID()}`,
      senderId: initiatorId,
      senderDepartment: initiatorDept,
      receiverDepartment: targetDept,
      intent: "REQUEST_PROPOSAL",
      payload: { objective, collaborationId: sessionId, requirements: payload },
      collaborationId: sessionId,
      timestamp: new Date(),
    };

    await AgentMessageBus.broadcastToDepartment(rfpMessage);
    console.log(`[Collab] Session ${sessionId} initiated. RFP → ${targetDept}.`);
    return session;
  }

  static async handleProposal(
    collaborationId: string,
    proposerId: string,
    proposalPayload: {
      estimatedTimeMin: number;
      estimatedCostUSD: number;
      approach: string;
    },
  ): Promise<void> {
    await SharedBlackboard.postArtifact({
      id: `proposal_${proposerId}_${collaborationId}`,
      collaborationId,
      ownerAgentId: proposerId,
      content: proposalPayload as unknown as Record<string, unknown>,
    });
    console.log(`[Collab] Proposal from ${proposerId} for ${collaborationId}`);
  }

  static async completeCollaboration(
    collaborationId: string,
    finalResult: Record<string, unknown>,
  ): Promise<void> {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    await supabaseAdmin
      .from("collaboration_sessions")
      .update({ status: "completed", completed_at: new Date().toISOString() })
      .eq("id", collaborationId);

    await SharedBlackboard.postArtifact({
      id: `final_result_${collaborationId}`,
      collaborationId,
      ownerAgentId: "system",
      content: finalResult,
    });
    console.log(`[Collab] Session ${collaborationId} completed.`);
  }
}