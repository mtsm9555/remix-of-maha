import type { VisionEntity } from "../types";

export class VisionEntityExtractor {
  async extract(analysis: unknown): Promise<VisionEntity[]> {
    void analysis;
    return [];
  }
}