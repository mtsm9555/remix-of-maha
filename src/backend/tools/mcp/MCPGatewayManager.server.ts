import { z } from "zod";
import { MCPClient } from "./MCPClient";
import { MCPSecuritySandbox } from "./MCPSecuritySandbox";
import type {
  MCPServerConfig,
  MCPConnectionState,
  MCPToolDefinition,
} from "./MCPGatewayTypes";
import { globalToolRegistry } from "../ToolRegistry";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

/**
 * Stateless MCP Gateway. All connection state lives in `mcp_server_connections`.
 * Callers hydrate an MCPClient from the DB row on demand.
 */
export class MCPGatewayManager {
  static async connectServer(config: MCPServerConfig): Promise<MCPConnectionState> {
    const validation = MCPSecuritySandbox.validateServerConfig(config);
    if (!validation.valid) {
      throw new Error("Security validation failed: " + validation.errors.join("; "));
    }

    const client = new MCPClient(config);
    let state: MCPConnectionState;
    try {
      state = await client.initialize();
    } catch (err: any) {
      await MCPGatewayManager.persist(config, "error", err?.message ?? String(err));
      throw err;
    }

    const { allowed, blocked } = MCPSecuritySandbox.filterAllowedTools(
      state.exposedTools,
      config.allowedTools,
    );
    state.exposedTools = allowed;

    await supabaseAdmin
      .from("mcp_server_connections")
      .upsert({
        server_id: config.id,
        name: config.name,
        transport_type: config.transportType,
        endpoint: config.endpoint,
        api_key_secret_name: config.apiKeySecretName ?? null,
        allowed_tools: config.allowedTools ?? [],
        exposed_tools: allowed as any,
        exposed_resources: state.exposedResources as any,
        status: "connected",
        error_message: null,
        last_heartbeat: state.lastHeartbeat,
      });

    MCPGatewayManager.registerInMemoryTools(config.id, allowed);

    console.log(
      `[MCPGateway] Connected ${config.name}. Exposed ${allowed.length} tools, blocked ${blocked.length}.`,
    );
    return state;
  }

  static async disconnectServer(serverId: string): Promise<void> {
    const { data } = await supabaseAdmin
      .from("mcp_server_connections")
      .select("exposed_tools")
      .eq("server_id", serverId)
      .maybeSingle();

    if (data?.exposed_tools) {
      for (const tool of data.exposed_tools as MCPToolDefinition[]) {
        globalToolRegistry.unregister(`mcp_${serverId}_${tool.name}`);
      }
    }
    await supabaseAdmin
      .from("mcp_server_connections")
      .update({ status: "disconnected" })
      .eq("server_id", serverId);
  }

  static async listConnections(): Promise<any[]> {
    const { data, error } = await supabaseAdmin
      .from("mcp_server_connections")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) throw error;
    return data ?? [];
  }

  static async callTool(
    serverId: string,
    toolName: string,
    args: Record<string, any>,
    agentName?: string,
  ): Promise<any> {
    const { data, error } = await supabaseAdmin
      .from("mcp_server_connections")
      .select("*")
      .eq("server_id", serverId)
      .maybeSingle();
    if (error || !data) throw new Error(`MCP server ${serverId} not registered`);
    if (data.status !== "connected") throw new Error(`MCP server ${serverId} not connected`);
    if (!Array.isArray(data.allowed_tools) || !data.allowed_tools.includes(toolName)) {
      throw new Error(`Tool ${toolName} not in allowlist for ${serverId}`);
    }

    const config: MCPServerConfig = {
      id: data.server_id,
      name: data.name,
      transportType: data.transport_type,
      endpoint: data.endpoint,
      apiKeySecretName: data.api_key_secret_name ?? undefined,
      allowedTools: data.allowed_tools,
    };

    const client = new MCPClient(config);
    const started = Date.now();
    let success = false;
    let summary = "";
    try {
      const result = await client.callTool(toolName, args);
      success = true;
      summary = typeof result === "string" ? result.slice(0, 500) : JSON.stringify(result).slice(0, 500);
      return result;
    } catch (err: any) {
      summary = err?.message ?? String(err);
      throw err;
    } finally {
      await supabaseAdmin.from("mcp_tool_executions").insert({
        server_id: serverId,
        tool_name: toolName,
        arguments: args as any,
        result_summary: summary,
        execution_time_ms: Date.now() - started,
        success,
        agent_name: agentName ?? null,
      });
    }
  }

  private static async persist(
    config: MCPServerConfig,
    status: "connected" | "disconnected" | "error",
    errorMessage?: string,
  ) {
    await supabaseAdmin.from("mcp_server_connections").upsert({
      server_id: config.id,
      name: config.name,
      transport_type: config.transportType,
      endpoint: config.endpoint,
      api_key_secret_name: config.apiKeySecretName ?? null,
      allowed_tools: config.allowedTools ?? [],
      status,
      error_message: errorMessage ?? null,
    });
  }

  /**
   * Registers MCP tools into the in-process ToolRegistry for the current
   * request. Since Workers are stateless, agents call this again in each
   * request that intends to use MCP tools.
   */
  private static registerInMemoryTools(serverId: string, tools: MCPToolDefinition[]) {
    for (const tool of tools) {
      const name = `mcp_${serverId}_${tool.name}`;
      if (globalToolRegistry.has(name)) continue;
      globalToolRegistry.register({
        name,
        description: `[MCP:${serverId}] ${tool.description}`,
        parameters: z.any(),
        execute: async (args, ctx) => {
          const started = Date.now();
          try {
            const data = await MCPGatewayManager.callTool(serverId, tool.name, args, ctx?.agentName);
            return { success: true, data, executionTimeMs: Date.now() - started };
          } catch (err: any) {
            return {
              success: false,
              error: err?.message ?? String(err),
              executionTimeMs: Date.now() - started,
            };
          }
        },
      });
    }
  }
}