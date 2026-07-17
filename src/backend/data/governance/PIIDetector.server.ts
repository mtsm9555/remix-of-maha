import type {
  DataAction,
  PIICategory,
  PIIDetection,
  PIIDetectionResult,
} from "./DataGovernanceTypes";

const PII_PATTERNS: Record<PIICategory, RegExp> = {
  ssn: /\b\d{3}-\d{2}-\d{4}\b/g,
  credit_card: /\b(?:\d{4}[-\s]?){3}\d{4}\b/g,
  email: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b/g,
  phone: /\b(?:\+?1[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}\b/g,
  passport: /\b[A-Z]\d{8}\b/g,
  bank_account: /\b\d{8,17}\b/g,
  ip_address: /\b(?:\d{1,3}\.){3}\d{1,3}\b/g,
  address:
    /(?:\d+\s+[A-Za-z]+\s+(?:Street|St|Avenue|Ave|Road|Rd|Boulevard|Blvd|Drive|Dr|Lane|Ln|Way|Court|Ct|Place|Pl)\b)/gi,
  medical_record: /\b(?:MRN|Medical Record)\s*[:#]?\s*\d+\b/gi,
  biometric: /(?:fingerprint|retina|iris|face\s*scan)/gi,
  custom: /(?:API_KEY|SECRET_KEY|PASSWORD)\s*[:=]\s*\S+/gi,
};

const REDACTION_MAP: Record<PIICategory, string> = {
  ssn: "[SSN_REDACTED]",
  credit_card: "[CARD_REDACTED]",
  email: "[EMAIL_REDACTED]",
  phone: "[PHONE_REDACTED]",
  passport: "[PASSPORT_REDACTED]",
  bank_account: "[BANK_REDACTED]",
  ip_address: "[IP_REDACTED]",
  address: "[ADDRESS_REDACTED]",
  medical_record: "[MEDICAL_REDACTED]",
  biometric: "[BIOMETRIC_REDACTED]",
  custom: "[SECRET_REDACTED]",
};

export class PIIDetector {
  static detectPII(text: string): PIIDetectionResult {
    const detections: PIIDetection[] = [];
    for (const [category, pattern] of Object.entries(PII_PATTERNS)) {
      const re = new RegExp(pattern.source, pattern.flags);
      for (const match of text.matchAll(re)) {
        if (match.index === undefined) continue;
        detections.push({
          category: category as PIICategory,
          value: match[0],
          position: { start: match.index, end: match.index + match[0].length },
          confidence: 1.0,
          redactedValue: REDACTION_MAP[category as PIICategory],
        });
      }
    }
    return {
      found: detections.length > 0,
      detections,
      suggestedAction: PIIDetector.determineAction(detections),
    };
  }

  static async detectSemanticPII(text: string): Promise<PIIDetectionResult> {
    const apiKey = process.env.LOVABLE_API_KEY;
    if (!apiKey) {
      return { found: false, detections: [], suggestedAction: "allow" };
    }
    const prompt = `You are a Data Privacy Officer AI. Scan the following text for ANY personally identifiable information (PII) or sensitive data.

Text to Scan:
"${text.substring(0, 2000)}"

Output strict JSON:
{"piiFound": boolean, "items": [{"category": "ssn|credit_card|email|phone|address|passport|bank_account|medical_record|custom", "value": "the exact text found", "confidence": 0.0}]}`;
    try {
      const res = await fetch(
        "https://ai.gateway.lovable.dev/v1/chat/completions",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${apiKey}`,
          },
          body: JSON.stringify({
            model: "google/gemini-2.5-flash",
            messages: [
              { role: "system", content: "Respond with strict JSON only." },
              { role: "user", content: prompt },
            ],
            response_format: { type: "json_object" },
            temperature: 0.1,
          }),
        },
      );
      if (!res.ok) {
        return { found: false, detections: [], suggestedAction: "allow" };
      }
      const json = (await res.json()) as {
        choices?: Array<{ message?: { content?: string } }>;
      };
      const parsed = JSON.parse(
        json.choices?.[0]?.message?.content ?? "{}",
      ) as {
        piiFound?: boolean;
        items?: Array<{
          category: PIICategory;
          value: string;
          confidence: number;
        }>;
      };
      const detections: PIIDetection[] = (parsed.items ?? []).map((item) => {
        const start = text.indexOf(item.value);
        return {
          category: item.category,
          value: item.value,
          position: {
            start: start < 0 ? 0 : start,
            end: start < 0 ? 0 : start + item.value.length,
          },
          confidence: item.confidence ?? 0.7,
          redactedValue: REDACTION_MAP[item.category] ?? "[REDACTED]",
        };
      });
      return {
        found: (parsed.piiFound ?? false) || detections.length > 0,
        detections,
        suggestedAction: PIIDetector.determineAction(detections),
      };
    } catch (err) {
      console.error("[PIIDetector] semantic detection failed:", err);
      return { found: false, detections: [], suggestedAction: "allow" };
    }
  }

  static redactPII(text: string, result: PIIDetectionResult): string {
    if (!result.found) return text;
    const sorted = [...result.detections].sort(
      (a, b) => b.position.start - a.position.start,
    );
    let out = text;
    for (const d of sorted) {
      out =
        out.substring(0, d.position.start) +
        d.redactedValue +
        out.substring(d.position.end);
    }
    return out;
  }

  private static determineAction(detections: PIIDetection[]): DataAction {
    if (detections.length === 0) return "allow";
    const highRisk: PIICategory[] = [
      "ssn",
      "credit_card",
      "passport",
      "bank_account",
      "medical_record",
    ];
    if (detections.some((d) => highRisk.includes(d.category))) return "block";
    if (detections.length > 3) return "quarantine";
    return "redact";
  }
}