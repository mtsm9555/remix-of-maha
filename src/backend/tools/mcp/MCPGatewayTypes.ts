// MCP Gateway type definitions
// NOTE: stdio transport is disabled on Cloudflare Workers (no child_process).
export type MCPTransportType = "sse" | "http";

export interface MCPServerConfig {
  id: string;
  name: string;
  transportType: MCPTransportType;
  endpoint: string;
  apiKeySecretName?: string;
  allowedTools?: string[];
  status?: "connected" | "disconnected" | "error";
}

export interface MCPToolDefinition {
  name: string;
  description: string;
  inputSchema: Record<string, any>;
  serverId: string;
}

export interface MCPResource {
  uri: string;
  name: string;
  description?: string;
  mimeType?: string;
  serverId: string;
}

export interface MCPMessage {
  jsonrpc: "2.0";
  id?: number | string;
  method?: string;
  params?: any;
  result?: any;
  error?: { code: number; message: string; data?: any };
}

export interface MCPConnectionState {
  config: MCPServerConfig;
  isConnected: boolean;
  exposedTools: MCPToolDefinition[];
  exposedResources: MCPResource[];
  lastHeartbeat: string;
  error?: string;
}