import type {
  MCPServerConfig,
  MCPMessage,
  MCPConnectionState,
  MCPToolDefinition,
  MCPResource,
} from "./MCPGatewayTypes";

/**
 * Stateless MCP client. Each call is a single JSON-RPC POST to the remote
 * MCP HTTP endpoint. SSE-only servers accept the same POST for requests and
 * stream responses; this client reads either JSON or the first `data:` frame.
 *
 * Runtime: Cloudflare Workers. No persistent socket, no child_process.
 */
export class MCPClient {
  private idCounter = 0;

  constructor(private readonly config: MCPServerConfig) {}

  private nextId(): number {
    this.idCounter += 1;
    return this.idCounter;
  }

  private async transmit(message: MCPMessage): Promise<MCPMessage> {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      Accept: "application/json, text/event-stream",
    };
    const apiKey = this.config.apiKeySecretName
      ? process.env[this.config.apiKeySecretName]
      : undefined;
    if (apiKey) headers["Authorization"] = `Bearer ${apiKey}`;

    const res = await fetch(this.config.endpoint, {
      method: "POST",
      headers,
      body: JSON.stringify(message),
    });
    if (!res.ok) {
      throw new Error(`MCP transport ${res.status}: ${await res.text().catch(() => res.statusText)}`);
    }
    const contentType = res.headers.get("content-type") ?? "";
    if (contentType.includes("text/event-stream")) {
      const raw = await res.text();
      const line = raw.split("\n").find((l) => l.startsWith("data:"));
      if (!line) throw new Error("MCP SSE response contained no data frame");
      return JSON.parse(line.slice(5).trim());
    }
    return (await res.json()) as MCPMessage;
  }

  private async request(method: string, params: any): Promise<any> {
    const response = await this.transmit({
      jsonrpc: "2.0",
      id: this.nextId(),
      method,
      params,
    });
    if (response.error) {
      throw new Error(`MCP error ${response.error.code}: ${response.error.message}`);
    }
    return response.result;
  }

  async initialize(): Promise<MCPConnectionState> {
    await this.request("initialize", {
      protocolVersion: "2024-11-05",
      capabilities: { tools: {}, resources: {} },
      clientInfo: { name: "MahaAI-OS", version: "3.0.0" },
    });

    // Best-effort notification (some servers require it, most tolerate absence)
    try {
      await this.transmit({ jsonrpc: "2.0", method: "notifications/initialized", params: {} });
    } catch {
      /* non-fatal */
    }

    const [toolsResult, resourcesResult] = await Promise.all([
      this.request("tools/list", {}).catch(() => ({ tools: [] })),
      this.request("resources/list", {}).catch(() => ({ resources: [] })),
    ]);

    const exposedTools: MCPToolDefinition[] = (toolsResult.tools ?? []).map((t: any) => ({
      name: t.name,
      description: t.description ?? "",
      inputSchema: t.inputSchema ?? {},
      serverId: this.config.id,
    }));
    const exposedResources: MCPResource[] = (resourcesResult.resources ?? []).map((r: any) => ({
      uri: r.uri,
      name: r.name ?? r.uri,
      description: r.description,
      mimeType: r.mimeType,
      serverId: this.config.id,
    }));

    return {
      config: this.config,
      isConnected: true,
      exposedTools,
      exposedResources,
      lastHeartbeat: new Date().toISOString(),
    };
  }

  async callTool(name: string, args: Record<string, any>): Promise<any> {
    const result = await this.request("tools/call", { name, arguments: args });
    return result?.content ?? result;
  }

  async readResource(uri: string): Promise<any> {
    return this.request("resources/read", { uri });
  }
}