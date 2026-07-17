import { KnowledgeVersionStore } from "./KnowledgeVersionStore.server";
import type { VersionDiff } from "./KnowledgeVersioningTypes";

export class VersionDiffEngine {
  static async diffVersions(
    versionIdA: string,
    versionIdB: string,
  ): Promise<VersionDiff> {
    const [versionA, versionB] = await Promise.all([
      KnowledgeVersionStore.getVersion(versionIdA),
      KnowledgeVersionStore.getVersion(versionIdB),
    ]);
    if (!versionA || !versionB) {
      throw new Error("One or both versions not found");
    }
    return {
      versionA,
      versionB,
      contentDiff: this.generateContentDiff(versionA.content, versionB.content),
      metadataDiff: this.calculateMetadataDiff(
        versionA.metadata,
        versionB.metadata,
      ),
      embeddingSimilarity: this.cosineSimilarity(
        versionA.embedding,
        versionB.embedding,
      ),
    };
  }

  private static generateContentDiff(a: string, b: string): string {
    if (a === b) return "No changes to content.";
    const linesA = a.split("\n");
    const linesB = b.split("\n");
    let diff = "";
    const max = Math.max(linesA.length, linesB.length);
    for (let i = 0; i < max; i++) {
      const la = linesA[i] ?? "";
      const lb = linesB[i] ?? "";
      if (la !== lb) {
        if (la) diff += `- ${la}\n`;
        if (lb) diff += `+ ${lb}\n`;
      }
    }
    return diff || "Content structure changed but no line-level differences.";
  }

  private static calculateMetadataDiff(
    a: Record<string, unknown>,
    b: Record<string, unknown>,
  ) {
    const added: Record<string, unknown> = {};
    const removed: Record<string, unknown> = {};
    const modified: Record<string, { old: unknown; new: unknown }> = {};
    for (const key in b) {
      if (!(key in a)) added[key] = b[key];
      else if (JSON.stringify(a[key]) !== JSON.stringify(b[key])) {
        modified[key] = { old: a[key], new: b[key] };
      }
    }
    for (const key in a) if (!(key in b)) removed[key] = a[key];
    return { added, removed, modified };
  }

  private static cosineSimilarity(a: number[], b: number[]): number {
    if (a.length !== b.length || a.length === 0) return 0;
    let dot = 0;
    let magA = 0;
    let magB = 0;
    for (let i = 0; i < a.length; i++) {
      dot += a[i] * b[i];
      magA += a[i] * a[i];
      magB += b[i] * b[i];
    }
    if (magA === 0 || magB === 0) return 0;
    return dot / (Math.sqrt(magA) * Math.sqrt(magB));
  }
}