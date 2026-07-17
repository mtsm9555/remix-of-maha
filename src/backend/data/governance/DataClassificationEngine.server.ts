import { ComplianceAuditLogger } from "./ComplianceAuditLogger.server";
import { PIIDetector } from "./PIIDetector.server";
import type {
  DataClassification,
  PIIDetectionResult,
} from "./DataGovernanceTypes";

export class DataClassificationEngine {
  static async classifyAndGovern(
    content: string,
    entityType: string,
    metadata: Record<string, unknown>,
  ): Promise<{
    classification: DataClassification;
    processedContent: string;
    piiResult: PIIDetectionResult;
    blocked: boolean;
  }> {
    const regex = PIIDetector.detectPII(content);
    let piiResult = regex;
    if (!regex.found) {
      const semantic = await PIIDetector.detectSemanticPII(content);
      if (semantic.found) piiResult = semantic;
    }
    const classification = DataClassificationEngine.determineClassification(
      piiResult,
      metadata,
    );

    let processedContent = content;
    let blocked = false;
    const entityId = typeof metadata.id === "string" ? metadata.id : undefined;

    switch (piiResult.suggestedAction) {
      case "block":
        blocked = true;
        await ComplianceAuditLogger.log({
          eventType: "pii_detected",
          entityId,
          entityType,
          details: {
            action: "blocked",
            categories: piiResult.detections.map((d) => d.category),
            contentPreview: content.substring(0, 100),
          },
          performedBy: "system",
        });
        break;
      case "redact":
        processedContent = PIIDetector.redactPII(content, piiResult);
        await ComplianceAuditLogger.log({
          eventType: "pii_redacted",
          entityId,
          entityType,
          details: {
            action: "redacted",
            redactedCount: piiResult.detections.length,
            categories: piiResult.detections.map((d) => d.category),
          },
          performedBy: "system",
        });
        break;
      case "quarantine":
        blocked = true;
        await ComplianceAuditLogger.log({
          eventType: "pii_detected",
          entityId,
          entityType,
          details: {
            action: "quarantined",
            reason: "Excessive PII detected",
            count: piiResult.detections.length,
          },
          performedBy: "system",
        });
        break;
      case "allow":
      default:
        break;
    }

    return { classification, processedContent, piiResult, blocked };
  }

  private static determineClassification(
    piiResult: PIIDetectionResult,
    metadata: Record<string, unknown>,
  ): DataClassification {
    if (piiResult.found) return "pii";
    const explicit = metadata.confidentiality;
    if (typeof explicit === "string") {
      const valid: DataClassification[] = [
        "public",
        "internal",
        "confidential",
        "restricted",
        "pii",
      ];
      if (valid.includes(explicit as DataClassification))
        return explicit as DataClassification;
    }
    const content = typeof metadata.content === "string" ? metadata.content : "";
    if (/\b(confidential|secret|proprietary)\b/i.test(content))
      return "confidential";
    if (/\b(internal use only|do not share)\b/i.test(content)) return "internal";
    return "public";
  }
}