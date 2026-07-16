import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { MarketplaceStore } from "./MarketplaceStore.server";
import { ToolSecurityScanner } from "./ToolSecurityScanner";
import { MCPGatewayManager } from "../mcp/MCPGatewayManager.server";
import type { InstalledTool, ToolManifest } from "./MarketplaceTypes";

function mcpServerIdFor(manifest: ToolManifest): string {
  return `marketplace_${manifest.name}_${manifest.version}`.replace(/[^a-zA-Z0-9_]/g, "_");
}

export class ToolInstaller {
  /**
   * "Installing" a marketplace tool = registering its hosted MCP server
   * with the Gateway, after security scan and audit logging.
   */
  static async installTool(name: string, version: string): Promise<InstalledTool> {
    const listing = await MarketplaceStore.getToolDetails(name, version);
    if (!listing) throw new Error(`Tool ${name}@${version} not found in marketplace.`);
    const manifest = listing.manifest;

    const scan = ToolSecurityScanner.scanManifest(manifest);
    await supabaseAdmin.from("tool_security_scans").insert({
      tool_name: manifest.name,
      version: manifest.version,
      risk_level: scan.riskLevel,
      passed: scan.passed,
      warnings: scan.warnings,
    });
    if (!scan.passed) {
      throw new Error(`Security scan failed (${scan.riskLevel}): ${scan.warnings.join("; ")}`);
    }

    const serverId = mcpServerIdFor(manifest);
    await MCPGatewayManager.connectServer({
      id: serverId,
      name: `${manifest.name}@${manifest.version}`,
      transportType: manifest.transportType,
      endpoint: manifest.mcpEndpoint,
      allowedTools: manifest.exposedTools,
    });

    const nowIso = new Date().toISOString();
    await supabaseAdmin
      .from("installed_tools")
      .upsert({
        name: manifest.name,
        version: manifest.version,
        status: "active",
        mcp_server_id: serverId,
        installed_at: nowIso,
      });

    await MarketplaceStore.incrementDownloads(name, version);

    return {
      manifest,
      installedAt: nowIso,
      status: "active",
      mcpServerId: serverId,
    };
  }

  static async uninstallTool(name: string): Promise<void> {
    const { data } = await supabaseAdmin
      .from("installed_tools")
      .select("mcp_server_id")
      .eq("name", name)
      .maybeSingle();
    if (data?.mcp_server_id) {
      await MCPGatewayManager.disconnectServer(data.mcp_server_id);
    }
    await supabaseAdmin.from("installed_tools").delete().eq("name", name);
  }

  static async setStatus(name: string, status: "active" | "disabled" | "quarantined"): Promise<void> {
    await supabaseAdmin.from("installed_tools").update({ status }).eq("name", name);
  }

  static async getInstalledTools(): Promise<any[]> {
    const { data, error } = await supabaseAdmin
      .from("installed_tools")
      .select("*")
      .order("installed_at", { ascending: false });
    if (error) throw error;
    return data ?? [];
  }
}