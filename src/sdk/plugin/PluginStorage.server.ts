import { supabaseAdmin } from "@/integrations/supabase/client.server";
import type { PluginStorage } from "./PluginSDKTypes";

export class PluginStorageImpl implements PluginStorage {
  constructor(private pluginId: string, private tenantId: string) {}

  async get(key: string): Promise<any> {
    const { data } = await supabaseAdmin
      .from('plugin_storage')
      .select('value')
      .eq('plugin_id', this.pluginId)
      .eq('tenant_id', this.tenantId)
      .eq('key', key)
      .maybeSingle();
    return (data as any)?.value;
  }

  async set(key: string, value: any): Promise<void> {
    await supabaseAdmin.from('plugin_storage').upsert({
      plugin_id: this.pluginId,
      tenant_id: this.tenantId,
      key,
      value,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'plugin_id,tenant_id,key' });
  }

  async delete(key: string): Promise<void> {
    await supabaseAdmin.from('plugin_storage').delete()
      .eq('plugin_id', this.pluginId)
      .eq('tenant_id', this.tenantId)
      .eq('key', key);
  }

  async list(prefix?: string): Promise<string[]> {
    let query = supabaseAdmin.from('plugin_storage').select('key')
      .eq('plugin_id', this.pluginId)
      .eq('tenant_id', this.tenantId);
    if (prefix) query = query.like('key', `${prefix}%`);
    const { data } = await query;
    return (data || []).map((d: any) => d.key as string);
  }
}