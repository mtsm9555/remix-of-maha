import { supabaseAdmin } from "@/integrations/supabase/client.server";
import type { PluginAPI, PluginTool } from "./PluginSDKTypes";

export class PluginAPIClient {
  constructor(private pluginId: string, private tenantId: string) {}

  createAPI(): PluginAPI {
    return {
      contacts: this.crud('crm_contacts'),
      deals: this.crud('crm_deals'),
      projects: this.crud('pm_projects'),
      tasks: this.crud('pm_tasks'),
      tools: this.createToolsAPI(),
      notifications: this.createNotificationsAPI(),
      webhooks: this.createWebhooksAPI(),
    };
  }

  private crud(table: string) {
    const tenantId = this.tenantId;
    return {
      list: async (_filters?: any) => {
        const { data } = await supabaseAdmin.from(table as any).select('*').eq('tenant_id', tenantId);
        return (data as any[]) || [];
      },
      get: async (id: string) => {
        const { data } = await supabaseAdmin.from(table as any).select('*')
          .eq('id', id).eq('tenant_id', tenantId).maybeSingle();
        return data;
      },
      create: async (payload: any) => {
        const { data } = await supabaseAdmin.from(table as any)
          .insert({ ...payload, tenant_id: tenantId }).select().single();
        return data;
      },
      update: async (id: string, payload: any) => {
        const { data } = await supabaseAdmin.from(table as any).update(payload)
          .eq('id', id).eq('tenant_id', tenantId).select().single();
        return data;
      },
      delete: async (id: string) => {
        await supabaseAdmin.from(table as any).delete().eq('id', id).eq('tenant_id', tenantId);
      },
    };
  }

  private createToolsAPI() {
    return {
      register: async (tool: PluginTool) => {
        await supabaseAdmin.from('plugin_tools').insert({
          id: tool.id,
          plugin_id: this.pluginId,
          tenant_id: this.tenantId,
          name: tool.name,
          description: tool.description,
          parameters: tool.parameters,
          is_active: true,
        });
      },
      unregister: async (toolId: string) => {
        await supabaseAdmin.from('plugin_tools').delete()
          .eq('id', toolId).eq('plugin_id', this.pluginId);
      },
      execute: async (toolId: string, args: any) => {
        console.log(`[PluginAPI] Executing tool ${toolId}`, args);
        return { success: true };
      },
    };
  }

  private createNotificationsAPI() {
    return {
      send: async (_userId: string, message: string, metadata?: any) => {
        console.log(`[PluginAPI:notify] tenant=${this.tenantId} msg=${message}`, metadata);
      },
      broadcast: async (message: string, metadata?: any) => {
        console.log(`[PluginAPI:broadcast] tenant=${this.tenantId} msg=${message}`, metadata);
      },
    };
  }

  private createWebhooksAPI() {
    return {
      register: async (endpoint: string, events: string[]) => {
        const webhookId = `webhook_${crypto.randomUUID()}`;
        const secret = Array.from(crypto.getRandomValues(new Uint8Array(32)))
          .map((b) => b.toString(16).padStart(2, '0')).join('');
        await supabaseAdmin.from('plugin_webhooks').insert({
          id: webhookId,
          plugin_id: this.pluginId,
          tenant_id: this.tenantId,
          endpoint,
          events,
          secret,
          is_active: true,
        });
        return webhookId;
      },
      unregister: async (webhookId: string) => {
        await supabaseAdmin.from('plugin_webhooks').delete()
          .eq('id', webhookId).eq('plugin_id', this.pluginId);
      },
    };
  }
}