import { supabaseAdmin } from "@/integrations/supabase/client.server";
import type { PluginManifest, PluginContext, PluginConfig } from "./PluginSDKTypes";
import { PluginBase } from "./PluginBase";
import { PluginAPIClient } from "./PluginAPIClient.server";
import { PluginEventSystemImpl } from "./PluginEventSystem";
import { PluginHookSystemImpl } from "./PluginHookSystem";
import { PluginStorageImpl } from "./PluginStorage.server";
import { PluginLoggerImpl } from "./PluginLogger.server";

export class PluginManager {
  private plugins: Map<string, PluginBase> = new Map();
  private eventSystem = new PluginEventSystemImpl();
  private hookSystem = new PluginHookSystemImpl();

  async installPlugin(
    manifest: PluginManifest,
    pluginClass: new (manifest: PluginManifest) => PluginBase,
    tenantId: string,
    userId: string,
  ): Promise<void> {
    const { data: existing } = await supabaseAdmin
      .from('plugin_configs')
      .select('plugin_id')
      .eq('plugin_id', manifest.id)
      .eq('tenant_id', tenantId)
      .maybeSingle();
    if (existing) throw new Error(`Plugin ${manifest.name} is already installed`);

    const plugin = new pluginClass(manifest);
    const context = this.createContext(manifest.id, tenantId, userId);
    await plugin.onInstall(context);

    const tools = await plugin.registerTools();
    for (const tool of tools) await context.api.tools.register(tool);
    await plugin.subscribeToEvents();
    await plugin.registerHooks();

    await supabaseAdmin.from('plugin_configs').insert({
      plugin_id: manifest.id,
      tenant_id: tenantId,
      settings: {},
      is_active: false,
    });

    this.plugins.set(`${manifest.id}:${tenantId}`, plugin);
  }

  async activatePlugin(pluginId: string, tenantId: string, userId: string): Promise<void> {
    const plugin = this.plugins.get(`${pluginId}:${tenantId}`);
    if (!plugin) throw new Error(`Plugin ${pluginId} not found`);
    const context = this.createContext(pluginId, tenantId, userId);
    await plugin.onActivate(context);
    await supabaseAdmin.from('plugin_configs').update({
      is_active: true, last_activated_at: new Date().toISOString(),
    }).eq('plugin_id', pluginId).eq('tenant_id', tenantId);
  }

  async deactivatePlugin(pluginId: string, tenantId: string, userId: string): Promise<void> {
    const plugin = this.plugins.get(`${pluginId}:${tenantId}`);
    if (!plugin) throw new Error(`Plugin ${pluginId} not found`);
    const context = this.createContext(pluginId, tenantId, userId);
    await plugin.onDeactivate(context);
    await supabaseAdmin.from('plugin_configs').update({
      is_active: false, last_deactivated_at: new Date().toISOString(),
    }).eq('plugin_id', pluginId).eq('tenant_id', tenantId);
  }

  async uninstallPlugin(pluginId: string, tenantId: string, userId: string): Promise<void> {
    const plugin = this.plugins.get(`${pluginId}:${tenantId}`);
    if (!plugin) throw new Error(`Plugin ${pluginId} not found`);
    const context = this.createContext(pluginId, tenantId, userId);
    await plugin.onUninstall(context);
    await supabaseAdmin.from('plugin_configs').delete()
      .eq('plugin_id', pluginId).eq('tenant_id', tenantId);
    this.plugins.delete(`${pluginId}:${tenantId}`);
  }

  private createContext(pluginId: string, tenantId: string, userId: string): PluginContext {
    return {
      pluginId,
      tenantId,
      userId,
      api: new PluginAPIClient(pluginId, tenantId).createAPI(),
      events: this.eventSystem,
      hooks: this.hookSystem,
      storage: new PluginStorageImpl(pluginId, tenantId),
      logger: new PluginLoggerImpl(pluginId, tenantId),
      config: {},
    };
  }

  async getInstalledPlugins(tenantId: string): Promise<PluginConfig[]> {
    const { data } = await supabaseAdmin
      .from('plugin_configs').select('*').eq('tenant_id', tenantId);
    return ((data as any[]) || []).map((c) => ({
      pluginId: c.plugin_id,
      tenantId: c.tenant_id,
      settings: c.settings,
      isActive: c.is_active,
      installedAt: new Date(c.installed_at),
      lastActivatedAt: c.last_activated_at ? new Date(c.last_activated_at) : undefined,
      lastDeactivatedAt: c.last_deactivated_at ? new Date(c.last_deactivated_at) : undefined,
    }));
  }

  emitEvent(eventName: string, data: any): void {
    this.eventSystem.emit(eventName, data);
  }

  async executeHooks(hookName: string, data: any): Promise<any> {
    return this.hookSystem.execute(hookName, data);
  }
}