// src/review/reviewTypes.ts

export type ReviewStatus = "pending" | "approved" | "rejected";

export type ReviewItem = {
  id: string;
  targetType: "task" | "memory" | "agent_action";
  targetId: string;
  requestedBy: string;
  reason: string;
  status: ReviewStatus;
  createdAt: string;
  updatedAt: string;
};
