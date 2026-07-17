import { supabaseAdmin } from "@/integrations/supabase/client.server";
import type { ComplianceFramework } from "./ComplianceLayerTypes";

const FRAMEWORKS: ComplianceFramework[] = ["GDPR", "CCPA", "SOC2", "ISO27001", "HIPAA", "PCI_DSS", "FedRAMP"];

export class ComplianceScoringEngine {
  static async calculateMetrics(tenantId: string, period = "current") {
    const [controlsRes, evidenceRes, certRes, consentRes] = await Promise.all([
      supabaseAdmin.from("compliance_controls").select("*").eq("tenant_id", tenantId),
      supabaseAdmin.from("compliance_evidence").select("*").eq("tenant_id", tenantId),
      supabaseAdmin.from("compliance_certifications").select("*").eq("tenant_id", tenantId),
      supabaseAdmin.from("consent_records").select("*").eq("tenant_id", tenantId),
    ]);
    const controls = controlsRes.data ?? [];
    const evidence = evidenceRes.data ?? [];
    const certifications = certRes.data ?? [];
    const consents = consentRes.data ?? [];

    const total = controls.length;
    const compliant = controls.filter((c: any) => c.status === "compliant").length;
    const overallComplianceScore = total > 0 ? Math.round((compliant / total) * 100) : 0;

    const byFramework: Record<string, any> = {};
    for (const f of FRAMEWORKS) {
      const fc = controls.filter((c: any) => c.framework === f);
      const fCompliant = fc.filter((c: any) => c.status === "compliant").length;
      const gaps = fc.filter((c: any) => c.status === "non_compliant" || c.status === "partial").length;
      byFramework[f] = {
        score: fc.length > 0 ? Math.round((fCompliant / fc.length) * 100) : 0,
        totalControls: fc.length,
        compliantControls: fCompliant,
        gaps,
      };
    }

    const totalEvidence = evidence.length;
    const automatedEvidence = evidence.filter((e: any) => e.type === "automated").length;
    const now = Date.now();
    const expiringEvidence = evidence.filter(
      (e: any) => e.expires_at && new Date(e.expires_at).getTime() - now < 30 * 86400000,
    ).length;

    return {
      tenantId,
      period,
      overallComplianceScore,
      byFramework,
      totalEvidence,
      automatedEvidencePercentage:
        totalEvidence > 0 ? Math.round((automatedEvidence / totalEvidence) * 100) : 0,
      expiringEvidence,
      activeCertifications: certifications.filter((c: any) => c.status === "certified").length,
      expiringCertifications: certifications.filter(
        (c: any) => c.expires_at && new Date(c.expires_at).getTime() - now < 90 * 86400000,
      ).length,
      residencyViolations: 0,
      consentRecords: consents.length,
      activeConsents: consents.filter((c: any) => c.granted && !c.withdrawn_at).length,
      withdrawnConsents: consents.filter((c: any) => !!c.withdrawn_at).length,
      complianceTrend: "stable" as const,
      highRiskGaps: controls.filter((c: any) => c.risk_level === "high" && c.status !== "compliant").length,
      criticalGaps: controls.filter((c: any) => c.risk_level === "critical" && c.status !== "compliant").length,
    };
  }

  static async generateReport(tenantId: string, framework: ComplianceFramework, reportType: string, generatedBy: string) {
    const metrics = await this.calculateMetrics(tenantId);
    const fm = metrics.byFramework[framework] ?? { score: 0, totalControls: 0, compliantControls: 0, gaps: 0 };
    const { data: controls } = await supabaseAdmin
      .from("compliance_controls")
      .select("*")
      .eq("tenant_id", tenantId)
      .eq("framework", framework);
    const list = controls ?? [];
    const now = new Date();
    const report = {
      id: `report_${crypto.randomUUID()}`,
      tenant_id: tenantId,
      framework,
      report_type: reportType,
      title: `${framework} ${reportType} — ${now.toISOString().split("T")[0]}`,
      period_start: new Date(now.getFullYear(), 0, 1).toISOString(),
      period_end: now.toISOString(),
      overall_score: fm.score,
      total_controls: fm.totalControls,
      compliant_controls: fm.compliantControls,
      non_compliant_controls: list.filter((c: any) => c.status === "non_compliant").length,
      partial_controls: list.filter((c: any) => c.status === "partial").length,
      not_applicable_controls: list.filter((c: any) => c.status === "not_applicable").length,
      critical_gaps: list.filter((c: any) => c.gap_severity === "critical").length,
      major_gaps: list.filter((c: any) => c.gap_severity === "major").length,
      minor_gaps: list.filter((c: any) => c.gap_severity === "minor").length,
      total_evidence: metrics.totalEvidence,
      automated_evidence: Math.round((metrics.automatedEvidencePercentage / 100) * metrics.totalEvidence),
      manual_evidence: metrics.totalEvidence - Math.round((metrics.automatedEvidencePercentage / 100) * metrics.totalEvidence),
      status: "completed",
      generated_at: now.toISOString(),
      approved_by: generatedBy,
      findings: [],
      recommendations: [],
      metadata: {},
    };
    await supabaseAdmin.from("compliance_reports").insert(report);
    return report;
  }
}