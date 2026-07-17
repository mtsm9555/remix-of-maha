import { supabaseAdmin } from "@/integrations/supabase/client.server";
import type { ComplianceEvidence, EvidenceType } from "./ComplianceLayerTypes";

export class EvidenceCollector {
  static async collectAutomatedEvidence(tenantId: string, controlId: string, controlName: string) {
    const now = new Date();
    const evidence = {
      id: `evidence_${crypto.randomUUID()}`,
      tenant_id: tenantId,
      control_id: controlId,
      type: "automated" as EvidenceType,
      title: `Automated Evidence: ${controlName}`,
      description: `System-generated evidence collected at ${now.toISOString()}`,
      content: JSON.stringify({ timestamp: now.toISOString(), system: "maha-os" }),
      collected_at: now.toISOString(),
      collected_by: "system",
      collection_method: "automated",
      is_valid: true,
      validated_at: now.toISOString(),
      validated_by: "system",
      expires_at: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString(),
      metadata: {},
    };
    await supabaseAdmin.from("compliance_evidence").insert(evidence);
    const { data: ctrl } = await supabaseAdmin
      .from("compliance_controls")
      .select("evidence_collected")
      .eq("id", controlId)
      .maybeSingle();
    await supabaseAdmin
      .from("compliance_controls")
      .update({
        evidence_collected: (ctrl?.evidence_collected ?? 0) + 1,
        last_evidence_at: now.toISOString(),
      })
      .eq("id", controlId);
    return evidence;
  }

  static async recordManualEvidence(input: {
    tenantId: string;
    controlId: string;
    type: EvidenceType;
    title: string;
    description: string;
    content: string;
    collectedBy: string;
    fileUrl?: string;
  }) {
    const now = new Date();
    const evidence = {
      id: `evidence_${crypto.randomUUID()}`,
      tenant_id: input.tenantId,
      control_id: input.controlId,
      type: input.type,
      title: input.title,
      description: input.description,
      content: input.content,
      file_url: input.fileUrl,
      collected_at: now.toISOString(),
      collected_by: input.collectedBy,
      collection_method: "manual",
      is_valid: false,
      metadata: {},
    };
    await supabaseAdmin.from("compliance_evidence").insert(evidence);
    return evidence;
  }

  static async listEvidence(tenantId: string, controlId?: string) {
    let q = supabaseAdmin.from("compliance_evidence").select("*").eq("tenant_id", tenantId);
    if (controlId) q = q.eq("control_id", controlId);
    const { data } = await q.order("collected_at", { ascending: false }).limit(200);
    return data ?? [];
  }
}