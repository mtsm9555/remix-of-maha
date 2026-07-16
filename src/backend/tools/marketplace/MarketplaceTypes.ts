export type ToolPermissionLevel =
  | "read_only"
  | "network_access"
  | "filesystem_write"
  | "execute_code"
  | "admin";

export type MarketplaceCategory =
  | "productivity"
  | "development"
  | "finance"
  | "marketing"
  | "data";

/**
 * A marketplace tool is a hosted MCP server (http/sse). Stdio and local
 * filesystem installs are unsupported on the Worker runtime.
 */
export interface ToolManifest {
  name: string;
  version: string;
  description: string;
  author: string;
  license: string;

  mcpEndpoint: string;
  transportType: "sse" | "http";
  exposedTools: string[];

  requestedPermissions: ToolPermissionLevel[];
  environmentVariables?: string[];
  checksum?: string;

  tags: string[];
  category: MarketplaceCategory;
  iconUrl?: string;
}

export interface MarketplaceListing {
  manifest: ToolManifest;
  downloads: number;
  rating: number;
  lastUpdated: string;
  isVerified: boolean;
}

export interface InstalledTool {
  manifest: ToolManifest;
  installedAt: string;
  status: "active" | "disabled" | "quarantined";
  mcpServerId: string;
}