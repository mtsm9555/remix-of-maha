import type { ToolManifest, ToolPermissionLevel } from "./MarketplaceTypes";

export interface ScanResult {
  passed: boolean;
  riskLevel: "low" | "medium" | "high" | "critical";
  warnings: string[];
  blockedPermissions: ToolPermissionLevel[];
}

export class ToolSecurityScanner {
  /**
   * Manifest-only static scan. No code download in the Worker runtime.
   */
  static scanManifest(manifest: ToolManifest): ScanResult {
    const warnings: string[] = [];
    const blockedPermissions: ToolPermissionLevel[] = [];
    let riskLevel: ScanResult["riskLevel"] = "low";

    if (manifest.requestedPermissions.includes("execute_code")) {
      riskLevel = "critical";
      blockedPermissions.push("execute_code");
      warnings.push("Tool requests code execution — blocked by policy.");
    }
    if (manifest.requestedPermissions.includes("admin")) {
      if (riskLevel !== "critical") riskLevel = "high";
      warnings.push("Tool requests admin permission.");
    }
    if (manifest.requestedPermissions.includes("filesystem_write")) {
      if (riskLevel === "low") riskLevel = "medium";
      warnings.push("Tool requests filesystem write; unsupported on this runtime.");
    }

    try {
      const url = new URL(manifest.mcpEndpoint);
      if (url.protocol !== "https:" && url.protocol !== "http:") {
        riskLevel = "critical";
        warnings.push("Endpoint must be http(s).");
      }
      if (/^(localhost|127\.|10\.|192\.168\.)/.test(url.hostname)) {
        riskLevel = "critical";
        warnings.push("Endpoint targets a private/internal address.");
      }
    } catch {
      riskLevel = "critical";
      warnings.push("Endpoint is not a valid URL.");
    }

    if (manifest.environmentVariables?.some((v) => /secret|key|token/i.test(v))) {
      if (riskLevel === "low") riskLevel = "medium";
      warnings.push("Tool references secret-like env vars — verify usage.");
    }

    if (!manifest.exposedTools || manifest.exposedTools.length === 0) {
      warnings.push("Manifest declares no exposedTools; a strict allowlist is required.");
      if (riskLevel === "low") riskLevel = "medium";
    }

    return { passed: riskLevel !== "critical", riskLevel, warnings, blockedPermissions };
  }
}