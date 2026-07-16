import type { MCPServerConfig } from "./MCPGatewayTypes";

const PRIVATE_HOST_PATTERNS = [
  /^localhost$/i,
  /^127\./,
  /^10\./,
  /^192\.168\./,
  /^172\.(1[6-9]|2\d|3[0-1])\./,
  /^::1$/,
  /^fc00:/i,
  /^fe80:/i,
];

export class MCPSecuritySandbox {
  static validateServerConfig(config: MCPServerConfig): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!config.id || !config.name) errors.push("id and name are required");
    if (config.transportType !== "sse" && config.transportType !== "http") {
      errors.push("Only 'sse' and 'http' transports are supported in this runtime.");
    }

    let url: URL | null = null;
    try {
      url = new URL(config.endpoint);
    } catch {
      errors.push("Endpoint is not a valid URL.");
    }
    if (url) {
      if (url.protocol !== "https:" && url.protocol !== "http:") {
        errors.push("Endpoint must use http(s).");
      }
      if (PRIVATE_HOST_PATTERNS.some((re) => re.test(url!.hostname))) {
        errors.push("External MCP servers cannot target private/internal addresses (SSRF).");
      }
    }

    if (!config.allowedTools || config.allowedTools.length === 0) {
      errors.push("A non-empty allowedTools list is required.");
    }

    return { valid: errors.length === 0, errors };
  }

  /**
   * Filters incoming remote tool definitions against the configured allowlist
   * AND blocks obviously destructive names by default.
   */
  static filterAllowedTools<T extends { name: string }>(
    tools: T[],
    allowlist: string[] | undefined,
  ): { allowed: T[]; blocked: string[] } {
    const allow = new Set(allowlist ?? []);
    const allowed: T[] = [];
    const blocked: string[] = [];
    for (const tool of tools) {
      const isDestructive = /(delete|drop|remove|truncate|purge)/i.test(tool.name);
      if (!allow.has(tool.name) || isDestructive) {
        blocked.push(tool.name);
        continue;
      }
      allowed.push(tool);
    }
    return { allowed, blocked };
  }
}