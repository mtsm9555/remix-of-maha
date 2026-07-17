import { supabaseAdmin } from "@/integrations/supabase/client.server";
import type { ComplianceControl, ComplianceFramework } from "./ComplianceLayerTypes";

type SeedControl = Omit<ComplianceControl, "id" | "tenantId" | "createdAt" | "updatedAt">;

export class ComplianceFrameworkManager {
  static async seedFrameworkControls(tenantId: string, framework: ComplianceFramework): Promise<number> {
    const controls = this.getFrameworkControls(framework);
    let seeded = 0;
    for (const control of controls) {
      const { data: existing } = await supabaseAdmin
        .from("compliance_controls")
        .select("id")
        .eq("tenant_id", tenantId)
        .eq("framework", framework)
        .eq("control_id", control.controlId)
        .maybeSingle();
      if (existing) continue;
      await supabaseAdmin.from("compliance_controls").insert({
        id: `ctrl_${crypto.randomUUID()}`,
        tenant_id: tenantId,
        framework: control.framework,
        control_id: control.controlId,
        control_name: control.controlName,
        description: control.description,
        category: control.category,
        requirement: control.requirement,
        implementation_guidance: control.implementationGuidance,
        status: control.status,
        evidence_collected: control.evidenceCollected,
        auto_monitorable: control.autoMonitorable,
        risk_level: control.riskLevel,
        tags: control.tags,
        metadata: control.metadata ?? {},
      });
      seeded++;
    }
    return seeded;
  }

  static async listControls(tenantId: string, framework?: ComplianceFramework) {
    let q = supabaseAdmin.from("compliance_controls").select("*").eq("tenant_id", tenantId);
    if (framework) q = q.eq("framework", framework);
    const { data } = await q.order("framework").order("control_id");
    return data ?? [];
  }

  static async updateControlStatus(controlId: string, status: string, assessedBy: string) {
    await supabaseAdmin
      .from("compliance_controls")
      .update({ status, last_assessed_at: new Date().toISOString(), assessed_by: assessedBy })
      .eq("id", controlId);
  }

  private static getFrameworkControls(framework: ComplianceFramework): SeedControl[] {
    const base = (partial: Partial<SeedControl>): SeedControl => ({
      framework,
      controlId: "",
      controlName: "",
      description: "",
      category: "general",
      requirement: "",
      implementationGuidance: "",
      status: "not_assessed",
      evidenceCollected: 0,
      autoMonitorable: false,
      riskLevel: "medium",
      tags: [],
      metadata: {},
      ...partial,
    });
    switch (framework) {
      case "GDPR":
        return [
          base({ controlId: "GDPR_Art5", controlName: "Principles of Processing", description: "Lawful, fair, transparent processing", category: "data_processing", requirement: "Document lawful basis", riskLevel: "high", tags: ["gdpr"] }),
          base({ controlId: "GDPR_Art32", controlName: "Security of Processing", description: "Technical & organizational security", category: "security", requirement: "Encryption, access control, testing", riskLevel: "critical", autoMonitorable: true, tags: ["gdpr", "security"] }),
          base({ controlId: "GDPR_Art33", controlName: "Breach Notification", description: "Notify within 72 hours", category: "incident_response", requirement: "Breach notification process", riskLevel: "high", tags: ["gdpr"] }),
        ];
      case "SOC2":
        return [
          base({ controlId: "SOC2_CC6.1", controlName: "Logical Access Controls", description: "Restrict logical access", category: "access_control", requirement: "RBAC, MFA", riskLevel: "high", autoMonitorable: true, tags: ["soc2"] }),
          base({ controlId: "SOC2_CC7.2", controlName: "System Monitoring", description: "Monitor system components", category: "monitoring", requirement: "Continuous monitoring", riskLevel: "high", autoMonitorable: true, tags: ["soc2"] }),
        ];
      case "HIPAA":
        return [
          base({ controlId: "HIPAA_164.312", controlName: "Technical Safeguards", description: "PHI technical safeguards", category: "security", requirement: "Encryption at rest/transit", riskLevel: "critical", tags: ["hipaa"] }),
        ];
      default:
        return [];
    }
  }
}