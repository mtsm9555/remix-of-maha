import type { DetectedObject } from "../types";

export class ObjectDetector {
  async detect(_imageUrl: string): Promise<DetectedObject[]> {
    return [
      { label: "person", confidence: 0.98, bbox: [100, 100, 250, 450] },
    ];
  }
}