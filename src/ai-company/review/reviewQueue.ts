// src/review/reviewQueue.ts

import { ReviewItem, ReviewStatus } from "./reviewTypes";

export class ReviewQueue {
  private reviews: Map<string, ReviewItem> = new Map();

  submitReview(
    id: string,
    targetType: ReviewItem["targetType"],
    targetId: string,
    requestedBy: string,
    reason: string
  ): ReviewItem {
    const now = new Date().toISOString();

    const review: ReviewItem = {
      id,
      targetType,
      targetId,
      requestedBy,
      reason,
      status: "pending",
      createdAt: now,
      updatedAt: now,
    };

    this.reviews.set(id, review);
    return review;
  }

  getReview(id: string): ReviewItem | undefined {
    return this.reviews.get(id);
  }

  getAllReviews(): ReviewItem[] {
    return Array.from(this.reviews.values());
  }

  updateReviewStatus(id: string, status: ReviewStatus): ReviewItem {
    const review = this.reviews.get(id);

    if (!review) {
      throw new Error(`Review not found: ${id}`);
    }

    review.status = status;
    review.updatedAt = new Date().toISOString();
    this.reviews.set(id, review);

    return review;
  }

  approveReview(id: string): ReviewItem {
    return this.updateReviewStatus(id, "approved");
  }

  rejectReview(id: string): ReviewItem {
    return this.updateReviewStatus(id, "rejected");
  }
}
