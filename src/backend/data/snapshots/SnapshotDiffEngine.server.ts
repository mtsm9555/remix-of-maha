import { ContextSnapshotter } from "./ContextSnapshotter.server";
import type {
  ContextSnapshot,
  SnapshotChunkMetadata,
  SnapshotDiffResult,
} from "./ContextSnapshotTypes";

export class SnapshotDiffEngine {
  static async diffSnapshots(
    snapshotIdA: string,
    snapshotIdB: string,
  ): Promise<SnapshotDiffResult> {
    const [snapA, snapB] = await Promise.all([
      ContextSnapshotter.getSnapshot(snapshotIdA),
      ContextSnapshotter.getSnapshot(snapshotIdB),
    ]);
    if (!snapA || !snapB) throw new Error("One or both snapshots not found");

    if (snapA.promptHash === snapB.promptHash) {
      return {
        snapshotA_id: snapshotIdA,
        snapshotB_id: snapshotIdB,
        addedChunks: [],
        removedChunks: [],
        modifiedChunks: [],
        tokenDelta: 0,
        promptTextDiff: "No changes. Prompts are identical.",
      };
    }

    const chunksA = new Map(snapA.chunkMetadata.map((c) => [c.id, c]));
    const chunksB = new Map(snapB.chunkMetadata.map((c) => [c.id, c]));

    const addedChunks: SnapshotChunkMetadata[] = [];
    const removedChunks: SnapshotChunkMetadata[] = [];
    const modifiedChunks: { id: string; oldPreview: string; newPreview: string }[] = [];

    for (const [id, chunkB] of chunksB) {
      const chunkA = chunksA.get(id);
      if (!chunkA) addedChunks.push(chunkB);
      else if (chunkA.contentPreview !== chunkB.contentPreview) {
        modifiedChunks.push({
          id,
          oldPreview: chunkA.contentPreview,
          newPreview: chunkB.contentPreview,
        });
      }
    }
    for (const [id, chunkA] of chunksA) {
      if (!chunksB.has(id)) removedChunks.push(chunkA);
    }

    return {
      snapshotA_id: snapshotIdA,
      snapshotB_id: snapshotIdB,
      addedChunks,
      removedChunks,
      modifiedChunks,
      tokenDelta: snapB.totalTokens - snapA.totalTokens,
      promptTextDiff: this.simpleTextDiff(snapA, snapB),
    };
  }

  private static simpleTextDiff(a: ContextSnapshot, b: ContextSnapshot): string {
    if (a.fullPromptText === b.fullPromptText) return "Identical";
    return `Prompt A length: ${a.fullPromptText.length} chars | Prompt B length: ${b.fullPromptText.length} chars.`;
  }
}