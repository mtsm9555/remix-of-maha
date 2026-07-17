import { supabaseAdmin } from "@/integrations/supabase/client.server";
import type { Artifact } from "./CICDPlatformTypes";

export class ArtifactManager {
  static async recordArtifact(input: {
    runId: string;
    tenantId: string;
    name: string;
    path: string;
    sizeBytes: number;
    mimeType?: string;
    storageUrl: string;
    checksum: string;
    expireInDays?: number;
  }): Promise<Artifact> {
    const id = `artifact_${crypto.randomUUID()}`;
    const expiresAt = input.expireInDays
      ? new Date(Date.now() + input.expireInDays * 86400_000)
      : undefined;
    await supabaseAdmin.from("artifacts").insert({
      id,
      run_id: input.runId,
      tenant_id: input.tenantId,
      name: input.name,
      path: input.path,
      size_bytes: input.sizeBytes,
      mime_type: input.mimeType ?? "application/octet-stream",
      storage_url: input.storageUrl,
      checksum: input.checksum,
      expires_at: expiresAt?.toISOString(),
    });
    return {
      id,
      runId: input.runId,
      tenantId: input.tenantId,
      name: input.name,
      path: input.path,
      sizeBytes: input.sizeBytes,
      mimeType: input.mimeType ?? "application/octet-stream",
      storageUrl: input.storageUrl,
      checksum: input.checksum,
      expiresAt,
      createdAt: new Date(),
    };
  }

  static async listForRun(runId: string, tenantId: string) {
    const { data } = await supabaseAdmin
      .from("artifacts")
      .select("*")
      .eq("run_id", runId)
      .eq("tenant_id", tenantId)
      .order("created_at", { ascending: false });
    return data ?? [];
  }
}